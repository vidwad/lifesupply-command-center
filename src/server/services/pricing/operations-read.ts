/**
 * DP-6C operational reporting — read-only queries.
 *
 * Everything here is a SELECT. It contacts no external system, mutates
 * nothing, and imports neither dangerous service, so the operations page can
 * load it during a render without pulling a price-changing capability into the
 * render graph (the DP-6A boundary).
 *
 * Reconciliation OBSERVATIONS are read back out of the audit log rather than a
 * new column. The audit entry is already the durable record of "someone looked
 * at the store at this time and saw this", which is exactly what a
 * reconciliation result is — and it needs no migration to store.
 */
import { prisma } from "@/server/db/client";

import { hasFailedRollbackAttempt, type ReconciliationStatus } from "./reconciliation";

export const RECONCILIATION_AUDIT_ACTION = "pricing.writeback_reconciliation_completed";

export type OperationsCounts = {
  ready_for_review: number;
  approved_not_written: number;
  written_back: number;
  rolled_back: number;
  writeback_failed: number;
  rollback_failed: number;
  expired: number;
  rejected: number;
  needs_reconciliation: number;
  mismatch: number;
};

/**
 * Headline counts for the dashboard.
 *
 * `approved_not_written` is the one that matters operationally: an approved
 * recommendation with no successful writeback is work somebody accepted and
 * nobody finished.
 */
export async function operationsCounts(): Promise<OperationsCounts> {
  const [byStatus, logs, reconciled] = await Promise.all([
    prisma.priceRecommendation.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.priceWritebackLog.findMany({
      select: { id: true, status: true, rollbackPayload: true },
    }),
    latestReconciliations(),
  ]);

  const recCount = (status: string): number =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  const approvedIds = await prisma.priceRecommendation.findMany({
    where: { status: "approved" },
    select: { id: true, writebackLogs: { select: { status: true } } },
  });

  const succeededLogs = logs.filter((log) => log.status === "succeeded");
  const reconciledIds = new Set(reconciled.keys());

  return {
    ready_for_review: recCount("ready_for_review"),
    // Approved but with no successful writeback behind it.
    approved_not_written: approvedIds.filter(
      (rec) => !rec.writebackLogs.some((log) => log.status === "succeeded"),
    ).length,
    written_back: recCount("written_back"),
    rolled_back: logs.filter((log) => log.status === "rolled_back").length,
    writeback_failed: logs.filter((log) => log.status === "failed").length,
    rollback_failed: logs.filter((log) => hasFailedRollbackAttempt(log.rollbackPayload)).length,
    expired: recCount("expired"),
    rejected: recCount("rejected"),
    // A completed writeback nobody has checked against the store yet.
    needs_reconciliation: succeededLogs.filter((log) => !reconciledIds.has(log.id)).length,
    mismatch: [...reconciled.values()].filter(
      (obs) => obs.status === "mismatch" || obs.status === "possible_landed_write",
    ).length,
  };
}

export type ReconciliationObservation = {
  writebackLogId: string;
  status: ReconciliationStatus;
  observedSalePrice: number | null;
  expectedSalePrice: number | null;
  reason: string | null;
  requiredAction: string | null;
  observedAt: Date;
};

const str = (value: unknown): string | null => (typeof value === "string" ? value : null);
const num = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * The most recent reconciliation observation per writeback log.
 *
 * Read from the audit log, newest first, keeping the first seen per entity —
 * so an older observation never overwrites a newer one.
 */
export async function latestReconciliations(): Promise<Map<string, ReconciliationObservation>> {
  const rows = await prisma.auditLog.findMany({
    where: { action: RECONCILIATION_AUDIT_ACTION, entityType: "PriceWritebackLog" },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { entityId: true, afterData: true, createdAt: true },
  });

  const out = new Map<string, ReconciliationObservation>();
  for (const row of rows) {
    if (!row.entityId || out.has(row.entityId)) continue;
    const data =
      row.afterData && typeof row.afterData === "object" && !Array.isArray(row.afterData)
        ? (row.afterData as Record<string, unknown>)
        : {};
    const status = str(data.reconciliationStatus);
    if (!status) continue;
    out.set(row.entityId, {
      writebackLogId: row.entityId,
      status: status as ReconciliationStatus,
      observedSalePrice: num(data.observedSalePrice),
      expectedSalePrice: num(data.expectedSalePrice),
      reason: str(data.reason),
      requiredAction: str(data.requiredAction),
      observedAt: row.createdAt,
    });
  }
  return out;
}

/** Writeback logs with the context the operations table needs. */
export async function listWritebackOperations(args?: { take?: number }) {
  return prisma.priceWritebackLog.findMany({
    orderBy: { createdAt: "desc" },
    take: args?.take ?? 500,
    include: {
      store: { select: { id: true, name: true } },
      writtenBy: { select: { id: true, name: true, email: true } },
      recommendation: {
        select: {
          id: true,
          status: true,
          pricingRunItem: { select: { id: true, sku: true, productName: true } },
        },
      },
    },
  });
}

/** Approved recommendations with no successful writeback — the work queue. */
export async function listApprovedNotWritten(args?: { take?: number }) {
  const rows = await prisma.priceRecommendation.findMany({
    where: { status: "approved" },
    orderBy: { approvedAt: "desc" },
    take: args?.take ?? 500,
    include: {
      writebackLogs: { select: { id: true, status: true } },
      pricingRunItem: {
        select: {
          id: true,
          sku: true,
          productName: true,
          store: { select: { id: true, name: true } },
        },
      },
    },
  });
  return rows.filter((row) => !row.writebackLogs.some((log) => log.status === "succeeded"));
}
