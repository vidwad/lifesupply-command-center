/**
 * Inngest function for BC ↔ CC reconciliation (Phase 3E).
 *
 * Mirrors the sync wrappers: resolves credentials, runs the reconciliation,
 * finalizes the IntegrationSyncLog (syncType "reconciliation"), and audit-logs
 * the outcome. Concurrency 1 per store.
 */
import { SyncStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { runBigCommerceReconciliation } from "@/server/integrations/bigcommerce/sync/run-reconciliation";
import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

const BC_BASE = "https://api.bigcommerce.com";
/** Default reconciliation window when the event does not specify one. */
const DEFAULT_RANGE_DAYS = 30;

type ReconcileEventData = {
  syncLogId: string;
  connectionId: string;
  storeId: string;
  triggeredById?: string;
  /** Optional ISO range override. */
  rangeStartIso?: string;
  rangeEndIso?: string;
};

export const reconcileBcStore = inngest.createFunction(
  {
    id: "bc-reconcile-store",
    name: "BigCommerce — Reconcile vs Source Totals",
    triggers: [{ event: "bc/reconcile.run" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => {
    const { syncLogId, connectionId, storeId, triggeredById, rangeStartIso, rangeEndIso } =
      event.data as ReconcileEventData;

    const bundle = await resolveCredentialsBundleForConnection(connectionId);
    if (!bundle?.storeHash || !bundle?.apiToken) {
      throw new Error(`BC connection ${connectionId} missing storeHash or apiToken`);
    }

    const rangeEnd = rangeEndIso ? new Date(rangeEndIso) : new Date();
    const rangeStart = rangeStartIso
      ? new Date(rangeStartIso)
      : new Date(rangeEnd.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

    try {
      const result = await runBigCommerceReconciliation({
        storeRoot: `${BC_BASE}/stores/${encodeURIComponent(bundle.storeHash)}`,
        apiToken: bundle.apiToken,
        storeId,
        rangeStart,
        rangeEnd,
        triggeredById,
      });

      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: {
          // A completed comparison is a successful RUN even when it finds
          // discrepancies — the report status carries the verdict.
          status: SyncStatus.success,
          completedAt: new Date(),
          recordsProcessed: result.rows.length,
          recordsFailed: result.discrepancyCount,
          errorSummary:
            result.discrepancyCount > 0
              ? `${result.discrepancyCount} material discrepancies — see report ${result.reportId}`
              : null,
          metadata: {
            reportId: result.reportId,
            reportStatus: result.status,
            discrepancyCount: result.discrepancyCount,
            exceptionsCreated: result.exceptionsCreated,
          },
        },
      });

      if (triggeredById) {
        await writeAudit({
          actorUserId: triggeredById,
          action: "sync.bigcommerce.reconciliation",
          entityType: "ReconciliationReport",
          entityId: result.reportId,
          afterData: {
            storeId,
            status: result.status,
            discrepancyCount: result.discrepancyCount,
            exceptionsCreated: result.exceptionsCreated,
          },
        });
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: { status: SyncStatus.failed, completedAt: new Date(), errorSummary: message },
      });
      if (triggeredById) {
        await writeAudit({
          actorUserId: triggeredById,
          action: "sync.bigcommerce.reconciliation",
          entityType: "integration_sync_log",
          entityId: syncLogId,
          afterData: { status: "failed", error: message },
        });
      }
      throw err;
    }
  },
);
