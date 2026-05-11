/**
 * Audit-log retention (docs/13 §15).
 *
 * Policy:
 *   - Default keep-window: 365 days (configurable via AUDIT_RETENTION_DAYS env).
 *   - Sensitive actions (auth, financial approvals, supplier order submission,
 *     report distribution, integration credential changes) are kept ALWAYS,
 *     never archived. They are the audit-of-record.
 *   - Non-sensitive actions older than the keep-window are pruned in batches.
 *
 * "Archival" today means delete after the keep-window. Move to cold storage
 * (S3 + JSONL) is a follow-up — the helper deliberately processes in batches
 * so the same flow can be repurposed to write before delete.
 */

import { type Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { logger } from "@/server/logger";

/**
 * Action prefixes / exact actions that are NEVER pruned. Conservative —
 * when in doubt, keep. Add new entries here as new sensitive actions
 * appear.
 */
const NEVER_PRUNE_PREFIXES = [
  "auth.",
  "approval.",
  "financials.",
  "financial_summary.",
  "financial_adjustment.",
  "report.",
  "investor_update.",
  "automation.run_",
  "automation.order_",
  "integration.field_",
  "feature_flag.",
  "user.created",
  "user.password_reset",
  "user.suspended",
  "user.archived",
  "role.permissions_updated",
  "system_setting.updated",
  "export.",
  "import.",
];

const DEFAULT_RETENTION_DAYS = 365;
const BATCH_SIZE = 1_000;

export function getRetentionDays(): number {
  const raw = process.env.AUDIT_RETENTION_DAYS;
  const n = raw ? Number(raw) : DEFAULT_RETENTION_DAYS;
  if (!Number.isFinite(n) || n < 30) return DEFAULT_RETENTION_DAYS;
  return Math.floor(n);
}

export type RetentionReport = {
  retentionDays: number;
  cutoff: Date;
  scanned: number;
  pruned: number;
  preserved: number;
  preservedBreakdown: { action: string; count: number }[];
  durationMs: number;
};

/**
 * Run one pass of the retention sweep. Safe to call repeatedly — only rows
 * older than the cutoff are touched, and the never-prune list is enforced
 * inside the WHERE clause.
 */
export async function runAuditRetention(args: { actor?: { id: string } } = {}): Promise<RetentionReport> {
  const startedAt = Date.now();
  const retentionDays = getRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // We cannot reliably pre-filter "starts with any of N prefixes" in Prisma
  // without raw SQL, so scan in batches and let JS decide. For typical
  // audit volumes this is fine; revisit when row count > 1M.

  const olderThanCutoff: Prisma.AuditLogWhereInput = { createdAt: { lt: cutoff } };

  const totalOld = await prisma.auditLog.count({ where: olderThanCutoff });
  let pruned = 0;
  let preserved = 0;
  const preservedByAction = new Map<string, number>();
  let cursor: string | null = null;

  while (true) {
    const batch: { id: string; action: string }[] = await prisma.auditLog.findMany({
      where: olderThanCutoff,
      select: { id: true, action: true },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (batch.length === 0) break;

    const toDelete: string[] = [];
    for (const row of batch) {
      if (isNeverPrune(row.action)) {
        preserved++;
        preservedByAction.set(row.action, (preservedByAction.get(row.action) ?? 0) + 1);
      } else {
        toDelete.push(row.id);
      }
    }
    if (toDelete.length > 0) {
      const result = await prisma.auditLog.deleteMany({ where: { id: { in: toDelete } } });
      pruned += result.count;
    }
    const last = batch[batch.length - 1];
    if (!last) break;
    cursor = last.id;
    if (batch.length < BATCH_SIZE) break;
  }

  const durationMs = Date.now() - startedAt;

  // Log the retention pass into the audit log itself — the audit-of-record
  // must include the act of pruning.
  await writeAudit({
    actorUserId: args.actor?.id ?? null,
    action: "audit.retention_run",
    entityType: "audit_log",
    afterData: {
      retentionDays,
      cutoff: cutoff.toISOString(),
      scanned: totalOld,
      pruned,
      preserved,
      durationMs,
    },
  });

  logger.info(
    {
      retentionDays,
      scanned: totalOld,
      pruned,
      preserved,
      durationMs,
    },
    "audit retention sweep complete",
  );

  return {
    retentionDays,
    cutoff,
    scanned: totalOld,
    pruned,
    preserved,
    preservedBreakdown: Array.from(preservedByAction, ([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    durationMs,
  };
}

/**
 * Pure helper used by the retention sweep + tests.
 *
 * @internal exported for testing
 */
export function isNeverPrune(action: string): boolean {
  return NEVER_PRUNE_PREFIXES.some((prefix) => action.startsWith(prefix));
}
