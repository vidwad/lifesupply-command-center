/**
 * Dispatchers for the Phase 6 read-only syncs.
 *
 * QuickBooks: single connection, one event.
 * GA4: one event per configured connection that is explicitly mapped to a
 * Store (Phase 2 rule: no name matching — unmapped connections skip with a
 * clear reason).
 */
import { SyncStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { isQboConnected } from "@/server/integrations/quickbooks/client";

export type QboDispatchResult =
  | { status: "queued"; syncLogId: string; connectionId: string }
  | { status: "skipped"; reason: string };

export async function dispatchQboReportSync(args: {
  actorUserId: string;
  months?: number;
}): Promise<QboDispatchResult> {
  const conn = await prisma.integrationConnection.findFirst({
    where: { integrationType: "quickbooks" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!conn) return { status: "skipped", reason: "No QuickBooks integration connection exists." };
  if (!(await isQboConnected())) {
    return {
      status: "skipped",
      reason: "QuickBooks is not connected. Complete the OAuth Connect flow first.",
    };
  }

  const syncLog = await prisma.integrationSyncLog.create({
    data: {
      integrationConnectionId: conn.id,
      syncType: "financial_reports",
      status: SyncStatus.running,
      startedAt: new Date(),
      triggeredById: args.actorUserId,
      metadata: { months: args.months ?? 2 },
    },
  });
  await inngest.send({
    name: "qbo/sync.reports",
    data: {
      syncLogId: syncLog.id,
      connectionId: conn.id,
      triggeredById: args.actorUserId,
      months: args.months,
    },
  });
  return { status: "queued", syncLogId: syncLog.id, connectionId: conn.id };
}

export type Ga4DispatchedJob = {
  status: "queued" | "skipped";
  syncLogId: string | null;
  connectionId: string;
  connectionName: string;
  storeName: string | null;
  reason?: string;
};

export async function dispatchGa4DailySync(args: {
  actorUserId: string;
  days?: number;
}): Promise<Ga4DispatchedJob[]> {
  const connections = await prisma.integrationConnection.findMany({
    where: { integrationType: "ga4", status: "configured" },
    select: {
      id: true,
      name: true,
      storeId: true,
      store: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const results: Ga4DispatchedJob[] = [];
  for (const conn of connections) {
    if (!conn.storeId || !conn.store) {
      results.push({
        status: "skipped",
        syncLogId: null,
        connectionId: conn.id,
        connectionName: conn.name,
        storeName: null,
        reason: `"${conn.name}" is not mapped to a Store. Set the mapping in /admin/integrations before syncing.`,
      });
      continue;
    }

    const syncLog = await prisma.integrationSyncLog.create({
      data: {
        integrationConnectionId: conn.id,
        syncType: "metrics",
        status: SyncStatus.running,
        startedAt: new Date(),
        triggeredById: args.actorUserId,
        metadata: { storeId: conn.store.id, storeName: conn.store.name, days: args.days ?? 30 },
      },
    });
    await inngest.send({
      name: "ga4/sync.daily",
      data: {
        syncLogId: syncLog.id,
        connectionId: conn.id,
        storeId: conn.store.id,
        triggeredById: args.actorUserId,
        days: args.days,
      },
    });
    results.push({
      status: "queued",
      syncLogId: syncLog.id,
      connectionId: conn.id,
      connectionName: conn.name,
      storeName: conn.store.name,
    });
  }
  return results;
}
