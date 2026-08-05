/**
 * Stuck-sync diagnostics (Phase 11D — row 11D-20, launch gate GATE-02).
 *
 * GATE-02 requires that no integration sync remains indefinitely in
 * `running`. Nothing in the codebase previously aged out abandoned rows: a
 * worker crash or deploy mid-sync left the IntegrationSyncLog stuck in
 * `running` forever, indistinguishable from live work. This module provides
 * the audit (list) and the operator-triggered disposition (reap). Reaping
 * only touches Command Center rows — it never contacts a source system.
 */
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

/**
 * Age after which a `running` sync log is considered stuck. Full syncs are
 * bounded (HARD_CAP_ORDERS / HARD_CAP_MEMBERS = 500k records) and complete
 * well within this window; Inngest retries also finish or fail long before
 * six hours.
 */
export const STUCK_SYNC_THRESHOLD_MS = 6 * 60 * 60 * 1000;

export type SyncRunState = "terminal" | "running_fresh" | "running_stuck";

/** Pure classifier — unit-tested; the queries below mirror its logic. */
export function classifySyncRun(
  run: { status: string; startedAt: Date },
  now: Date,
  thresholdMs: number = STUCK_SYNC_THRESHOLD_MS,
): SyncRunState {
  if (run.status !== "running") return "terminal";
  return now.getTime() - run.startedAt.getTime() >= thresholdMs ? "running_stuck" : "running_fresh";
}

export type StuckSyncRow = {
  id: string;
  integrationName: string;
  integrationType: string;
  syncType: string;
  startedAt: Date;
  ageMs: number;
};

/** All `running` sync logs older than the threshold, oldest first. */
export async function listStuckSyncRuns(now: Date = new Date()): Promise<StuckSyncRow[]> {
  const cutoff = new Date(now.getTime() - STUCK_SYNC_THRESHOLD_MS);
  const rows = await prisma.integrationSyncLog.findMany({
    where: { status: "running", startedAt: { lte: cutoff } },
    orderBy: { startedAt: "asc" },
    include: { integrationConnection: { select: { name: true, integrationType: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    integrationName: r.integrationConnection.name,
    integrationType: r.integrationConnection.integrationType,
    syncType: r.syncType,
    startedAt: r.startedAt,
    ageMs: now.getTime() - r.startedAt.getTime(),
  }));
}

/**
 * Mark every stuck run as failed so sync history reaches a terminal state.
 * Operator-triggered (not a background job): a human confirms the worker is
 * not actually mid-run before dispositioning. Audit-logged with the affected
 * row ids.
 */
export async function reapStuckSyncRuns(args: {
  actorUserId: string;
  now?: Date;
}): Promise<{ reaped: number; ids: string[] }> {
  const now = args.now ?? new Date();
  const stuck = await listStuckSyncRuns(now);
  if (stuck.length === 0) return { reaped: 0, ids: [] };

  const ids = stuck.map((s) => s.id);
  const hours = Math.round(STUCK_SYNC_THRESHOLD_MS / (60 * 60 * 1000));
  await prisma.integrationSyncLog.updateMany({
    // Re-filter on status so a run that finished between list and update is
    // never overwritten.
    where: { id: { in: ids }, status: "running" },
    data: {
      status: "failed",
      completedAt: now,
      errorSummary: `Marked failed by the stuck-sync audit: still "running" after ${hours}h with no completion. The worker likely crashed or was redeployed mid-run — re-dispatch the sync if the data is still needed.`,
    },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "sync.stuck_runs_reaped",
    entityType: "integration_sync_log",
    entityId: ids[0],
    afterData: { reaped: ids.length, ids, thresholdMs: STUCK_SYNC_THRESHOLD_MS },
  });
  return { reaped: ids.length, ids };
}
