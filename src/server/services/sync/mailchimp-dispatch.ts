/**
 * Dispatch the Mailchimp subscriber/suppression read sync (Phase 4).
 * Single-connection integration (no store mapping): find the configured
 * Mailchimp connection, open an IntegrationSyncLog, send the event.
 */
import { SyncStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";

export type MailchimpDispatchResult =
  | { status: "queued"; syncLogId: string; connectionId: string; connectionName: string }
  | { status: "skipped"; reason: string };

export async function dispatchMailchimpMemberSync(args: {
  actorUserId: string;
}): Promise<MailchimpDispatchResult> {
  const conn = await prisma.integrationConnection.findFirst({
    where: { integrationType: "mailchimp", status: "configured" },
    select: { id: true, name: true },
  });
  if (!conn) {
    return {
      status: "skipped",
      reason:
        "No configured Mailchimp integration. Set apiKey, serverPrefix, and audienceListId in /admin/integrations first.",
    };
  }

  const syncLog = await prisma.integrationSyncLog.create({
    data: {
      integrationConnectionId: conn.id,
      syncType: "contacts",
      status: SyncStatus.running,
      startedAt: new Date(),
      triggeredById: args.actorUserId,
    },
  });

  await inngest.send({
    name: "mailchimp/sync.members",
    data: { syncLogId: syncLog.id, connectionId: conn.id, triggeredById: args.actorUserId },
  });

  return {
    status: "queued",
    syncLogId: syncLog.id,
    connectionId: conn.id,
    connectionName: conn.name,
  };
}
