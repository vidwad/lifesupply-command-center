/**
 * Inngest function for the Mailchimp subscriber/suppression read sync
 * (Phase 4). Read-only toward Mailchimp; consent changes are applied to
 * Customers/MarketingContacts and audit-logged at sync level with counts.
 */
import { SyncStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { getMailchimpReadClient } from "@/server/integrations/mailchimp/client";
import { syncMailchimpMembers } from "@/server/integrations/mailchimp/sync-members";

type SyncEventData = {
  syncLogId: string;
  connectionId: string;
  triggeredById?: string;
};

export const syncMailchimpSubscribers = inngest.createFunction(
  {
    id: "mailchimp-sync-members",
    name: "Mailchimp — Sync Subscribers & Suppressions",
    triggers: [{ event: "mailchimp/sync.members" }],
    concurrency: { limit: 1 },
  },
  async ({ event }) => {
    const { syncLogId, connectionId, triggeredById } = event.data as SyncEventData;

    const configured = await getMailchimpReadClient();
    if (!configured) {
      const message =
        "Mailchimp read credentials missing (apiKey, serverPrefix, audienceListId required).";
      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: { status: SyncStatus.failed, completedAt: new Date(), errorSummary: message },
      });
      throw new Error(message);
    }

    try {
      const counts = await syncMailchimpMembers({
        client: configured.client as unknown as { lists: unknown },
        audienceListId: configured.audienceListId,
        onProgress: async (c) => {
          await prisma.integrationSyncLog.update({
            where: { id: syncLogId },
            data: {
              recordsProcessed: c.membersScanned,
              recordsUpdated: c.customersUpdated,
              metadata: {
                contactsUpserted: c.contactsUpserted,
                suppressedApplied: c.suppressedApplied,
                customersUnmatched: c.customersUnmatched,
                currentErrors: c.errorMessages.slice(0, 5),
              },
            },
          });
        },
      });

      const status: "success" | "partial" = counts.errorMessages.length > 0 ? "partial" : "success";
      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: {
          status: status === "success" ? SyncStatus.success : SyncStatus.partial,
          completedAt: new Date(),
          recordsProcessed: counts.membersScanned,
          recordsUpdated: counts.customersUpdated,
          errorSummary:
            counts.errorMessages.length > 0 ? counts.errorMessages.slice(0, 10).join("\n") : null,
          metadata: {
            contactsUpserted: counts.contactsUpserted,
            customersUpdated: counts.customersUpdated,
            customersUnmatched: counts.customersUnmatched,
            suppressedApplied: counts.suppressedApplied,
            complaintsApplied: counts.complaintsApplied,
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
          action: "sync.mailchimp.members",
          entityType: "integration_sync_log",
          entityId: syncLogId,
          afterData: {
            status,
            membersScanned: counts.membersScanned,
            contactsUpserted: counts.contactsUpserted,
            customersUpdated: counts.customersUpdated,
            suppressedApplied: counts.suppressedApplied,
            complaintsApplied: counts.complaintsApplied,
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
          action: "sync.mailchimp.members",
          entityType: "integration_sync_log",
          entityId: syncLogId,
          afterData: { status: "failed", error: message },
        });
      }
      throw err;
    }
  },
);
