/**
 * Shared helper that dispatches BC sync events for one or all stores.
 *
 * The API route handlers (POST /api/sync/bigcommerce/customers/{full|
 * incremental}) call this with the mode + actor. The helper:
 *   1. Finds all configured BC IntegrationConnections
 *   2. For each, finds the matching Store (by stripping "BigCommerce — "
 *      prefix from the connection name and matching to Store.name)
 *   3. Creates an IntegrationSyncLog row in `running` state
 *   4. Sends an Inngest event so the worker picks it up
 *   5. Returns the list of (syncLogId, storeName, status) per connection
 *
 * Connections with no matching Store are returned with status "skipped".
 */
import { SyncStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";

export type DispatchedJob = {
  status: "queued" | "skipped";
  syncLogId: string | null;
  connectionId: string;
  connectionName: string;
  storeId: string | null;
  storeName: string | null;
  reason?: string;
};

const STORE_NAME_PREFIX = /^BigCommerce\s*[—–-]\s*/i;

function storeNameFromConnection(connectionName: string): string {
  return connectionName.replace(STORE_NAME_PREFIX, "").trim();
}

export async function dispatchBigCommerceCustomerSync(args: {
  mode: "full" | "incremental";
  actorUserId: string;
}): Promise<DispatchedJob[]> {
  const connections = await prisma.integrationConnection.findMany({
    where: { integrationType: "bigcommerce", status: "configured" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const stores = await prisma.store.findMany({
    select: { id: true, name: true },
  });
  const storesByName = new Map(stores.map((s) => [s.name.toLowerCase(), s]));

  const eventName =
    args.mode === "full"
      ? "bc/sync.customers.full"
      : "bc/sync.customers.incremental";

  const results: DispatchedJob[] = [];

  for (const conn of connections) {
    const targetName = storeNameFromConnection(conn.name).toLowerCase();
    const store = storesByName.get(targetName);
    if (!store) {
      results.push({
        status: "skipped",
        syncLogId: null,
        connectionId: conn.id,
        connectionName: conn.name,
        storeId: null,
        storeName: null,
        reason: `No Store matches connection name "${conn.name}" — expected "${storeNameFromConnection(conn.name)}"`,
      });
      continue;
    }

    const syncLog = await prisma.integrationSyncLog.create({
      data: {
        integrationConnectionId: conn.id,
        syncType: `customers.${args.mode}`,
        status: SyncStatus.running,
        startedAt: new Date(),
        triggeredById: args.actorUserId,
        metadata: {
          mode: args.mode,
          storeId: store.id,
          storeName: store.name,
        },
      },
    });

    await inngest.send({
      name: eventName,
      data: {
        syncLogId: syncLog.id,
        connectionId: conn.id,
        storeId: store.id,
        triggeredById: args.actorUserId,
      },
    });

    results.push({
      status: "queued",
      syncLogId: syncLog.id,
      connectionId: conn.id,
      connectionName: conn.name,
      storeId: store.id,
      storeName: store.name,
    });
  }

  return results;
}
