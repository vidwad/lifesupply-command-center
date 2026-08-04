/**
 * Inngest functions for BC catalog sync (categories + products + variants).
 *
 * Mirrors sync-orders.ts: full + incremental modes sharing one runCatalogSync
 * helper that handles credential resolution, IntegrationSyncLog tracking,
 * lastSyncAt updates, and audit logging.
 *
 * Concurrency: 1 per store (different stores can run in parallel).
 */
import { SyncStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { syncBigCommerceCatalog } from "@/server/integrations/bigcommerce/sync/sync-products";
import { resolveCredentialsBundleForConnection } from "@/server/services/integrations";

const BC_BASE = "https://api.bigcommerce.com";

type SyncEventData = {
  syncLogId: string;
  connectionId: string;
  storeId: string;
  triggeredById?: string;
};

type SyncCounts = Awaited<ReturnType<typeof syncBigCommerceCatalog>>;

async function runCatalogSync(args: {
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
    throw new Error(`BC connection ${connectionId} missing storeHash or apiToken`);
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
    counts = await syncBigCommerceCatalog({
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
            recordsProcessed: c.productsUpserted + c.productsFailed,
            recordsCreated: c.productsCreated,
            recordsUpdated: c.productsUpdated,
            recordsFailed: c.productsFailed,
            metadata: {
              categoriesUpserted: c.categoriesUpserted,
              productsScanned: c.productsScanned,
              variantsUpserted: c.variantsUpserted,
              variantsDeleted: c.variantsDeleted,
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
      data: { status: SyncStatus.failed, completedAt: new Date(), errorSummary: message },
    });
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });
    if (triggeredById) {
      await writeAudit({
        actorUserId: triggeredById,
        action: `sync.bigcommerce.products.${args.mode}`,
        entityType: "integration_sync_log",
        entityId: syncLogId,
        afterData: { status: "failed", error: message },
      });
    }
    throw err;
  }

  const status: "success" | "partial" = counts.productsFailed > 0 ? "partial" : "success";
  await prisma.integrationSyncLog.update({
    where: { id: syncLogId },
    data: {
      status: status === "success" ? SyncStatus.success : SyncStatus.partial,
      completedAt: new Date(),
      recordsProcessed: counts.productsUpserted + counts.productsFailed,
      recordsCreated: counts.productsCreated,
      recordsUpdated: counts.productsUpdated,
      recordsFailed: counts.productsFailed,
      errorSummary:
        counts.errorMessages.length > 0 ? counts.errorMessages.slice(0, 10).join("\n") : null,
      metadata: {
        categoriesUpserted: counts.categoriesUpserted,
        productsScanned: counts.productsScanned,
        variantsUpserted: counts.variantsUpserted,
        variantsDeleted: counts.variantsDeleted,
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
      action: `sync.bigcommerce.products.${args.mode}`,
      entityType: "integration_sync_log",
      entityId: syncLogId,
      afterData: {
        status,
        categoriesUpserted: counts.categoriesUpserted,
        productsUpserted: counts.productsUpserted,
        productsCreated: counts.productsCreated,
        productsUpdated: counts.productsUpdated,
        productsFailed: counts.productsFailed,
        variantsUpserted: counts.variantsUpserted,
        variantsDeleted: counts.variantsDeleted,
      },
    });
  }

  return { status, counts };
}

export const syncBcProductsFull = inngest.createFunction(
  {
    id: "bc-sync-products-full",
    name: "BigCommerce — Sync Catalog (Full)",
    triggers: [{ event: "bc/sync.products.full" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => runCatalogSync({ data: event.data as SyncEventData, mode: "full" }),
);

export const syncBcProductsIncremental = inngest.createFunction(
  {
    id: "bc-sync-products-incremental",
    name: "BigCommerce — Sync Catalog (Incremental)",
    triggers: [{ event: "bc/sync.products.incremental" }],
    concurrency: { limit: 1, key: "event.data.storeId" },
  },
  async ({ event }) => runCatalogSync({ data: event.data as SyncEventData, mode: "incremental" }),
);
