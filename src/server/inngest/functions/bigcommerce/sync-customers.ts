/**
 * Inngest functions for BC customer sync.
 *
 * Two functions, one per mode (full / incremental). Both share the same
 * core walker (syncBigCommerceCustomers) and tracking shape — only the
 * event name and the optional sinceIso change.
 *
 * Tracking:
 *   - IntegrationSyncLog row (created by the API route, updated here as
 *     the sync progresses; finalized to success/failed at completion)
 *   - IntegrationConnection.lastSyncAt + lastSuccessfulSyncAt
 *   - AuditLog entry with action sync.bigcommerce.customers.{mode}
 *   - Exception row on failure or row-level errors (matches the existing
 *     CSV import pattern in services/imports/bigcommerce.ts)
 *
 * Concurrency: limited to 1 PER STORE — two simultaneous full syncs of
 * the same store would race on upserts. Different stores can run in
 * parallel (Render Starter has 0.5 CPU so we don't really benefit, but
 * Inngest's free tier has more than enough invocations).
 */
import { SyncStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { syncBigCommerceCustomers } from "@/server/integrations/bigcommerce/sync/sync-customers";
import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

const BC_BASE = "https://api.bigcommerce.com";

type SyncEventData = {
  syncLogId: string;
  connectionId: string;
  storeId: string;
  triggeredById?: string;
};

async function runCustomerSync(args: {
  data: SyncEventData;
  mode: "full" | "incremental";
}): Promise<{ status: "success" | "failed" | "partial"; counts: SyncCounts }> {
  const { syncLogId, connectionId, storeId, triggeredById } = args.data;

  // ---- Resolve store + credentials ----
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

  // ---- Determine since (incremental only) ----
  const conn = await prisma.integrationConnection.findUniqueOrThrow({
    where: { id: connectionId },
    select: { lastSuccessfulSyncAt: true },
  });
  const sinceIso =
    args.mode === "incremental" && conn.lastSuccessfulSyncAt
      ? conn.lastSuccessfulSyncAt.toISOString()
      : undefined;

  // ---- Run the walker ----
  let counts: SyncCounts | undefined;
  try {
    counts = await syncBigCommerceCustomers({
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
            recordsProcessed: c.customersUpserted + c.customersFailed,
            recordsCreated: c.customersCreated,
            recordsUpdated: c.customersUpdated,
            recordsFailed: c.customersFailed,
            metadata: {
              ordersScanned: c.ordersScanned,
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
        action: `sync.bigcommerce.customers.${args.mode}`,
        entityType: "integration_sync_log",
        entityId: syncLogId,
        afterData: { status: "failed", error: message },
      });
    }
    throw err;
  }

  // ---- Finalize sync log ----
  const status: "success" | "partial" =
    counts.customersFailed > 0 ? "partial" : "success";
  await prisma.integrationSyncLog.update({
    where: { id: syncLogId },
    data: {
      status: status === "success" ? SyncStatus.success : SyncStatus.partial,
      completedAt: new Date(),
      recordsProcessed: counts.customersUpserted + counts.customersFailed,
      recordsCreated: counts.customersCreated,
      recordsUpdated: counts.customersUpdated,
      recordsFailed: counts.customersFailed,
      errorSummary:
        counts.errorMessages.length > 0
          ? counts.errorMessages.slice(0, 10).join("\n")
          : null,
      metadata: {
        ordersScanned: counts.ordersScanned,
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
      action: `sync.bigcommerce.customers.${args.mode}`,
      entityType: "integration_sync_log",
      entityId: syncLogId,
      afterData: {
        status,
        ordersScanned: counts.ordersScanned,
        customersUpserted: counts.customersUpserted,
        customersCreated: counts.customersCreated,
        customersUpdated: counts.customersUpdated,
        customersFailed: counts.customersFailed,
      },
    });
  }

  return { status, counts };
}

type SyncCounts = Awaited<ReturnType<typeof syncBigCommerceCustomers>>;

export const syncBcCustomersFull = inngest.createFunction(
  {
    id: "bc-sync-customers-full",
    name: "BigCommerce — Sync Customers (Full)",
    triggers: [{ event: "bc/sync.customers.full" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => {
    return runCustomerSync({
      data: event.data as SyncEventData,
      mode: "full",
    });
  },
);

export const syncBcCustomersIncremental = inngest.createFunction(
  {
    id: "bc-sync-customers-incremental",
    name: "BigCommerce — Sync Customers (Incremental)",
    triggers: [{ event: "bc/sync.customers.incremental" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => {
    return runCustomerSync({
      data: event.data as SyncEventData,
      mode: "incremental",
    });
  },
);
