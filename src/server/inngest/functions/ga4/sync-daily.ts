/**
 * Inngest function for the GA4 daily metric read sync (Phase 6). One event
 * per mapped GA4 connection; credentials resolve per connection so each
 * store/property pair syncs independently.
 */
import { SyncStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { syncGa4Daily } from "@/server/integrations/ga4/sync-daily";
import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

type SyncEventData = {
  syncLogId: string;
  connectionId: string;
  storeId: string;
  triggeredById?: string;
  days?: number;
};

export const syncGa4DailyMetrics = inngest.createFunction(
  {
    id: "ga4-sync-daily",
    name: "GA4 — Sync Daily Metrics (Read-only)",
    triggers: [{ event: "ga4/sync.daily" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => {
    const { syncLogId, connectionId, storeId, triggeredById, days } = event.data as SyncEventData;

    try {
      const bundle = await resolveCredentialsBundleForConnection(connectionId);
      if (!bundle?.propertyId || !bundle?.serviceAccountJson) {
        throw new Error(`GA4 connection ${connectionId} missing propertyId or serviceAccountJson.`);
      }

      const counts = await syncGa4Daily({
        serviceAccountJson: bundle.serviceAccountJson,
        propertyId: bundle.propertyId,
        storeId,
        days,
      });

      const status: "success" | "partial" = counts.errorMessages.length > 0 ? "partial" : "success";
      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: {
          status: status === "success" ? SyncStatus.success : SyncStatus.partial,
          completedAt: new Date(),
          recordsProcessed: counts.daysReturned,
          recordsCreated: counts.metricsCreated,
          recordsUpdated: counts.metricsUpdated,
          errorSummary:
            counts.errorMessages.length > 0 ? counts.errorMessages.slice(0, 10).join("\n") : null,
          metadata: {
            daysReturned: counts.daysReturned,
            attributionRows: counts.attributionRows,
            storeId,
          },
        },
      });
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          ...(status === "success" ? { lastSuccessfulSyncAt: new Date() } : {}),
        },
      });

      if (triggeredById) {
        await writeAudit({
          actorUserId: triggeredById,
          action: "sync.ga4.daily",
          entityType: "integration_sync_log",
          entityId: syncLogId,
          afterData: {
            status,
            storeId,
            ...counts,
            errorMessages: counts.errorMessages.slice(0, 3),
          },
        });
      }
      return { status, counts };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: { status: SyncStatus.failed, completedAt: new Date(), errorSummary: message },
      });
      if (triggeredById) {
        await writeAudit({
          actorUserId: triggeredById,
          action: "sync.ga4.daily",
          entityType: "integration_sync_log",
          entityId: syncLogId,
          afterData: { status: "failed", error: message },
        });
      }
      throw err;
    }
  },
);
