/**
 * Inngest function for the QuickBooks read-only report sync (Phase 6).
 * Resolves the OAuth session (refreshing tokens as needed), pulls the last
 * N monthly reports, and finalizes the IntegrationSyncLog + audit trail.
 */
import { SyncStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { getQboSession } from "@/server/integrations/quickbooks/client";
import { syncQuickBooksReports } from "@/server/integrations/quickbooks/sync-reports";

type SyncEventData = {
  syncLogId: string;
  connectionId: string;
  triggeredById?: string;
  months?: number;
};

export const syncQboReports = inngest.createFunction(
  {
    id: "qbo-sync-reports",
    name: "QuickBooks — Sync Reports (Read-only)",
    triggers: [{ event: "qbo/sync.reports" }],
    concurrency: { limit: 1 },
  },
  async ({ event }) => {
    const { syncLogId, connectionId, triggeredById, months } = event.data as SyncEventData;

    try {
      const session = await getQboSession();
      const counts = await syncQuickBooksReports({ session, months, syncLogId });

      const status: "success" | "partial" | "failed" =
        counts.periodsFailed === 0 ? "success" : counts.periodsSynced > 0 ? "partial" : "failed";

      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: {
          status:
            status === "success"
              ? SyncStatus.success
              : status === "partial"
                ? SyncStatus.partial
                : SyncStatus.failed,
          completedAt: new Date(),
          recordsProcessed: counts.periodsSynced + counts.periodsFailed,
          recordsCreated: counts.summariesCreated,
          recordsUpdated: counts.summariesUpdated,
          recordsFailed: counts.periodsFailed,
          errorSummary:
            counts.errorMessages.length > 0 ? counts.errorMessages.slice(0, 10).join("\n") : null,
          metadata: {
            periodsSynced: counts.periodsSynced,
            summariesCreated: counts.summariesCreated,
            summariesUpdated: counts.summariesUpdated,
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
          action: "sync.quickbooks.reports",
          entityType: "integration_sync_log",
          entityId: syncLogId,
          afterData: { status, ...counts, errorMessages: counts.errorMessages.slice(0, 3) },
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
          action: "sync.quickbooks.reports",
          entityType: "integration_sync_log",
          entityId: syncLogId,
          afterData: { status: "failed", error: message },
        });
      }
      throw err;
    }
  },
);
