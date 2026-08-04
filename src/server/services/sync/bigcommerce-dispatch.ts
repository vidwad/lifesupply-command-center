/**
 * Shared helper that dispatches BC sync events for one entity (customers
 * or orders) across all configured BC stores.
 *
 * For each BC IntegrationConnection with status="configured":
 *   1. Resolve its explicitly mapped Store via the `storeId` foreign key
 *      (Phase 2 — docs/19). Connections with no mapping, or whose mapped
 *      Store is not a BigCommerce store, are skipped with a clear reason.
 *   2. Create an IntegrationSyncLog row in `running` state.
 *   3. Send an Inngest event so the worker picks it up.
 *
 * Store matching no longer depends on display-name string manipulation —
 * the mapping is set in /admin/integrations and stored as a real FK.
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

/** Minimal connection shape the planner needs. */
export type BcConnectionForDispatch = {
  id: string;
  name: string;
  storeId: string | null;
  store: { id: string; name: string; platform: string } | null;
};

export type DispatchPlanItem =
  | {
      decision: "dispatch";
      connectionId: string;
      connectionName: string;
      store: { id: string; name: string };
    }
  | { decision: "skip"; connectionId: string; connectionName: string; reason: string };

/**
 * Pure mapping resolver — decides, per connection, whether it can be
 * dispatched and to which Store. No DB or event side effects, so it can be
 * unit-tested directly (correct mapping / missing mapping / wrong store type).
 */
export function planBigCommerceDispatch(
  connections: BcConnectionForDispatch[],
): DispatchPlanItem[] {
  return connections.map((conn) => {
    if (!conn.storeId || !conn.store) {
      return {
        decision: "skip",
        connectionId: conn.id,
        connectionName: conn.name,
        reason: `"${conn.name}" is not mapped to a Store. Set the mapping in /admin/integrations before syncing.`,
      };
    }
    if (conn.store.platform !== "bigcommerce") {
      return {
        decision: "skip",
        connectionId: conn.id,
        connectionName: conn.name,
        reason: `"${conn.name}" is mapped to Store "${conn.store.name}", which is not a BigCommerce store (platform: ${conn.store.platform}).`,
      };
    }
    return {
      decision: "dispatch",
      connectionId: conn.id,
      connectionName: conn.name,
      store: { id: conn.store.id, name: conn.store.name },
    };
  });
}

export async function dispatchBigCommerceSync(args: {
  entity: "customers" | "orders" | "products";
  mode: "full" | "incremental";
  actorUserId: string;
}): Promise<DispatchedJob[]> {
  const connections = await prisma.integrationConnection.findMany({
    where: { integrationType: "bigcommerce", status: "configured" },
    select: {
      id: true,
      name: true,
      storeId: true,
      store: { select: { id: true, name: true, platform: true } },
    },
    orderBy: { name: "asc" },
  });

  const eventName = `bc/sync.${args.entity}.${args.mode}` as const;
  const syncType = `${args.entity}.${args.mode}`;

  const plan = planBigCommerceDispatch(connections);
  const results: DispatchedJob[] = [];

  for (const item of plan) {
    if (item.decision === "skip") {
      results.push({
        status: "skipped",
        syncLogId: null,
        connectionId: item.connectionId,
        connectionName: item.connectionName,
        storeId: null,
        storeName: null,
        reason: item.reason,
      });
      continue;
    }

    const syncLog = await prisma.integrationSyncLog.create({
      data: {
        integrationConnectionId: item.connectionId,
        syncType,
        status: SyncStatus.running,
        startedAt: new Date(),
        triggeredById: args.actorUserId,
        metadata: {
          entity: args.entity,
          mode: args.mode,
          storeId: item.store.id,
          storeName: item.store.name,
        },
      },
    });

    await inngest.send({
      name: eventName,
      data: {
        syncLogId: syncLog.id,
        connectionId: item.connectionId,
        storeId: item.store.id,
        triggeredById: args.actorUserId,
      },
    });

    results.push({
      status: "queued",
      syncLogId: syncLog.id,
      connectionId: item.connectionId,
      connectionName: item.connectionName,
      storeId: item.store.id,
      storeName: item.store.name,
    });
  }

  return results;
}

/**
 * Backwards-compat wrapper kept for any callers that haven't migrated to
 * dispatchBigCommerceSync yet (the customer API routes used to call this).
 */
export async function dispatchBigCommerceCustomerSync(args: {
  mode: "full" | "incremental";
  actorUserId: string;
}): Promise<DispatchedJob[]> {
  return dispatchBigCommerceSync({ entity: "customers", ...args });
}
