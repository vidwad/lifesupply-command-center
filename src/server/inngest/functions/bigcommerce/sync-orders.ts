/**
 * Inngest functions for BC order sync.
 *
 * Mirrors sync-customers.ts in shape: full + incremental modes, both
 * sharing one runOrderSync helper that handles credential resolution,
 * IntegrationSyncLog tracking, lastSyncAt updates, and audit logging.
 *
 * Concurrency: 1 per store (different stores can run in parallel).
 */
import { SyncStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { syncBigCommerceOrders } from "@/server/integrations/bigcommerce/sync/sync-orders";
import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

const BC_BASE = "https://api.bigcommerce.com";

type SyncEventData = {
  syncLogId: string;
  connectionId: string;
  storeId: string;
  triggeredById?: string;
};

async function runOrderSync(args: {
  data: SyncEventData;
  mode: "full" | "incremental";
}): Promise<{ status: "success" | "failed" | "partial"; counts: SyncCounts }> {
  const { syncLogId, connectionId, storeId, triggeredById } = args.data;

  const [store, bundle] = await Promise.all([
    prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      select: { id: true, divisionId: true, name: true },
    }),
    resolveCredentialsBundleForConnection(connectionId),
  ]);
  if (!bundle?.storeHash || !bundle?.apiToken) {
    throw new Error(
      `BC connection ${connectionId} missing storeHash or apiToken`,
    );
  }

  const conn = await prisma.integrationConnection.findUniqueOrThrow({
    where: { id: connectionId },
    select: { lastSuccessfulSyncAt: true },
  });
  const sinceIso =
    args.mode === "incremental" && conn.lastSuccessfulSyncAt
      ? conn.lastSuccessfulSyncAt.toISOString()
      : undefined;

  let counts: SyncCounts | undefined;
  try {
    counts = await syncBigCommerceOrders({
      storeRoot: `${BC_BASE}/stores/${encodeURIComponent(bundle.storeHash)}`,
      apiToken: bundle.apiToken,
      storeId: store.id,
      divisionId: store.divisionId,
      mode: args.mode,
      sinceIso,
      onProgress: async (c) => {
        await prisma.integrationSyncLog.update({
          where: { id: syncLogId },
          data: {
            recordsProcessed: c.ordersUpserted + c.ordersFailed,
            recordsCreated: c.ordersCreated,
            recordsUpdated: c.ordersUpdated,
            recordsFailed: c.ordersFailed,
            metadata: {
              ordersScanned: c.ordersScanned,
              ordersUnlinked: c.ordersUnlinked,
              currentErrors: c.errorMessages.slice(0, 5),
            },
          },
        });
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await prisma.integrationSyncLog.update({
      where: { id: syncLogId },
      data: {
        status: SyncStatus.failed,
        completedAt: new Date(),
        errorSummary: message,
      },
    });
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });
    if (triggeredById) {
      await writeAudit({
        actorUserId: triggeredById,
        action: `sync.bigcommerce.orders.${args.mode}`,
        entityType: "integration_sync_log",
        entityId: syncLogId,
        afterData: { status: "failed", error: message },
      });
    }
    throw err;
  }

  const status: "success" | "partial" =
    counts.ordersFailed > 0 ? "partial" : "success";
  await prisma.integrationSyncLog.update({
    where: { id: syncLogId },
    data: {
      status: status === "success" ? SyncStatus.success : SyncStatus.partial,
      completedAt: new Date(),
      recordsProcessed: counts.ordersUpserted + counts.ordersFailed,
      recordsCreated: counts.ordersCreated,
      recordsUpdated: counts.ordersUpdated,
      recordsFailed: counts.ordersFailed,
      errorSummary:
        counts.errorMessages.length > 0
          ? counts.errorMessages.slice(0, 10).join("\n")
          : null,
      metadata: {
        ordersScanned: counts.ordersScanned,
        ordersUnlinked: counts.ordersUnlinked,
        mode: args.mode,
        sinceIso: sinceIso ?? null,
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
      action: `sync.bigcommerce.orders.${args.mode}`,
      entityType: "integration_sync_log",
      entityId: syncLogId,
      afterData: {
        status,
        ordersScanned: counts.ordersScanned,
        ordersUpserted: counts.ordersUpserted,
        ordersCreated: counts.ordersCreated,
        ordersUpdated: counts.ordersUpdated,
        ordersFailed: counts.ordersFailed,
        ordersUnlinked: counts.ordersUnlinked,
      },
    });
  }

  return { status, counts };
}

type SyncCounts = Awaited<ReturnType<typeof syncBigCommerceOrders>>;

export const syncBcOrdersFull = inngest.createFunction(
  {
    id: "bc-sync-orders-full",
    name: "BigCommerce — Sync Orders (Full)",
    triggers: [{ event: "bc/sync.orders.full" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => {
    return runOrderSync({
      data: event.data as SyncEventData,
      mode: "full",
    });
  },
);

export const syncBcOrdersIncremental = inngest.createFunction(
  {
    id: "bc-sync-orders-incremental",
    name: "BigCommerce — Sync Orders (Incremental)",
    triggers: [{ event: "bc/sync.orders.incremental" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => {
    return runOrderSync({
      data: event.data as SyncEventData,
      mode: "incremental",
    });
  },
);
