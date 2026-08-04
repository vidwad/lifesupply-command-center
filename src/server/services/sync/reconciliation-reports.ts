/**
 * Read-side helpers for reconciliation reports (Phase 3E). Authorization is
 * enforced by the calling page/route (ADMIN_MANAGE_INTEGRATIONS).
 */
import { prisma } from "@/server/db/client";

import type { MetricRow } from "@/server/integrations/bigcommerce/sync/reconciliation-evaluator";

export type ReconciliationReportRow = {
  id: string;
  storeId: string;
  storeName: string;
  status: string;
  discrepancyCount: number;
  rangeStart: string;
  rangeEnd: string;
  createdAt: string;
  triggeredByName: string | null;
  metrics: MetricRow[];
};

export async function listRecentReconciliationReports(
  limit = 20,
): Promise<ReconciliationReportRow[]> {
  const rows = await prisma.reconciliationReport.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      store: { select: { name: true } },
      triggeredBy: { select: { name: true, email: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    storeId: r.storeId,
    storeName: r.store.name,
    status: r.status,
    discrepancyCount: r.discrepancyCount,
    rangeStart: r.rangeStart.toISOString(),
    rangeEnd: r.rangeEnd.toISOString(),
    createdAt: r.createdAt.toISOString(),
    triggeredByName: r.triggeredBy?.name ?? r.triggeredBy?.email ?? null,
    metrics: Array.isArray(r.metrics) ? (r.metrics as unknown as MetricRow[]) : [],
  }));
}
