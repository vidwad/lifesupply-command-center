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
  store: { id: string; name: string; platform: string; divisionId: string } | null;
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
 * unit-tested directly (correct mapping / missing mapping / wrong store type /
 * division filter).
 *
 * `divisionId` mirrors the Division selector in the app shell (the `?division=`
 * search param). When set, only stores in that division are dispatched; the
 * rest are **skipped with a reason** rather than filtered out silently, so the
 * caller can show exactly which stores a scoped sync left alone. When absent,
 * every mapped BigCommerce store is dispatched, matching "All divisions".
 */
export function planBigCommerceDispatch(
  connections: BcConnectionForDispatch[],
  divisionId?: string | null,
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
    // Division scoping is applied last, so a store excluded by the filter reads
    // as "out of scope" rather than masking a real mapping problem.
    if (divisionId && conn.store.divisionId !== divisionId) {
      return {
        decision: "skip",
        connectionId: conn.id,
        connectionName: conn.name,
        reason: `Store "${conn.store.name}" is not in the selected division — skipped by the division filter.`,
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
  /** Scope to one division, mirroring the shell's Division selector. Null/undefined = all. */
  divisionId?: string | null;
}): Promise<DispatchedJob[]> {
  const connections = await prisma.integrationConnection.findMany({
    where: { integrationType: "bigcommerce", status: "configured" },
    select: {
      id: true,
      name: true,
      storeId: true,
      store: { select: { id: true, name: true, platform: true, divisionId: true } },
    },
    orderBy: { name: "asc" },
  });

  const eventName = `bc/sync.${args.entity}.${args.mode}` as const;
  const syncType = `${args.entity}.${args.mode}`;

  const plan = planBigCommerceDispatch(connections, args.divisionId);
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
          // Recorded so a later reader can tell a division-scoped run from a
          // full fan-out without reconstructing the UI state at the time.
          divisionId: args.divisionId ?? null,
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
 * Dispatch a reconciliation run (Phase 3E) for every configured + mapped BC
 * store. Same planning rules as sync dispatch (explicit store mapping only);
 * each queued store gets an IntegrationSyncLog (syncType "reconciliation")
 * and a bc/reconcile.run event for the worker.
 */
export async function dispatchBigCommerceReconciliation(args: {
  actorUserId: string;
}): Promise<DispatchedJob[]> {
  const connections = await prisma.integrationConnection.findMany({
    where: { integrationType: "bigcommerce", status: "configured" },
    select: {
      id: true,
      name: true,
      storeId: true,
      store: { select: { id: true, name: true, platform: true, divisionId: true } },
    },
    orderBy: { name: "asc" },
  });

  // Reconciliation is deliberately NOT division-scoped: it is an estate-wide
  // integrity check, and running it against a subset would report false gaps.
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
        syncType: "reconciliation",
        status: SyncStatus.running,
        startedAt: new Date(),
        triggeredById: args.actorUserId,
        metadata: { storeId: item.store.id, storeName: item.store.name },
      },
    });

    await inngest.send({
      name: "bc/reconcile.run",
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
  divisionId?: string | null;
}): Promise<DispatchedJob[]> {
  return dispatchBigCommerceSync({ entity: "customers", ...args });
}
