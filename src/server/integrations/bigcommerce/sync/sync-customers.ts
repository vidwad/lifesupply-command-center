/**
 * Core BC → Postgres customer sync walker.
 *
 * Two-phase: walk /v2/orders to build slim per-customer aggregates, then
 * walk /v3/customers and upsert each (joined with the aggregate). Same
 * memory pattern as the streaming CSV export — slim ~80B aggregates per
 * customer, no full-order state held.
 *
 * Designed to run inside an Inngest function on the Background Worker.
 * The Inngest wrapper handles retries, IntegrationSyncLog row updates,
 * and audit logging — this module is just the data movement.
 *
 * Modes:
 *   - "full"        — walks ALL orders + customers
 *   - "incremental" — walks orders with min_date_modified={sinceIso} and
 *                     customers with date_modified:min={sinceIso}
 */
import { prisma } from "@/server/db/client";

import type { Prisma } from "@prisma/client";

import {
  mapBcCustomerToUpsert,
  SOURCE_SYSTEM,
  type BcCustomerPayload,
  type SlimOrderAggregate,
} from "./customer-mapper";

const BC_BASE = "https://api.bigcommerce.com";
const PAGE_SIZE = 250;
const HARD_CAP_ORDERS = 500_000;
const HARD_CAP_CUSTOMERS = 250_000;

type BcOrder = {
  id: number;
  customer_id: number;
  date_created: string;
  total_inc_tax: string | number;
};

export type SyncCustomersInput = {
  storeRoot: string;
  apiToken: string;
  storeId: string;
  divisionId: string | null;
  mode: "full" | "incremental";
  /** ISO timestamp; only used when mode === "incremental". */
  sinceIso?: string;
  /** Optional callback invoked after each customer page is processed. */
  onProgress?: (counts: SyncCustomersCounts) => void | Promise<void>;
};

export type SyncCustomersCounts = {
  ordersScanned: number;
  customersUpserted: number;
  customersCreated: number;
  customersUpdated: number;
  customersFailed: number;
  errorMessages: string[];
};

async function bcFetch(
  url: string,
  apiToken: string,
): Promise<
  | { ok: true; status: number; body: string }
  | { ok: false; status: number | "network"; body: string }
> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { "X-Auth-Token": apiToken, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      status: "network",
      body: err instanceof Error ? err.message : "network",
    };
  }
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body: body.slice(0, 200) };
  return { ok: true, status: res.status, body };
}

function emptyAgg(): SlimOrderAggregate {
  return {
    count: 0,
    spend: 0,
    firstMs: Number.POSITIVE_INFINITY,
    lastMs: Number.NEGATIVE_INFINITY,
  };
}

/** Walk /v2/orders and produce per-customer aggregates (count/spend/dates). */
async function buildOrderAggregates(args: {
  storeRoot: string;
  apiToken: string;
  sinceIso?: string;
}): Promise<{ aggByCustomer: Map<number, SlimOrderAggregate>; ordersScanned: number }> {
  const aggByCustomer = new Map<number, SlimOrderAggregate>();
  const sinceParam = args.sinceIso
    ? `&min_date_modified=${encodeURIComponent(args.sinceIso)}`
    : "";
  let page = 1;
  let ordersScanned = 0;

  while (ordersScanned < HARD_CAP_ORDERS) {
    const url =
      `${args.storeRoot}/v2/orders?limit=${PAGE_SIZE}&page=${page}` +
      `&sort=date_created:desc${sinceParam}`;
    const r = await bcFetch(url, args.apiToken);
    if (!r.ok) {
      if (r.status === 404) break; // BC v2 returns 404 instead of empty past last page
      throw new Error(`Orders page ${page}: HTTP ${r.status} — ${r.body}`);
    }
    if (r.status === 204 || r.body.trim() === "") break;
    let orders: BcOrder[];
    try {
      orders = JSON.parse(r.body) as BcOrder[];
    } catch {
      break;
    }
    if (!Array.isArray(orders) || orders.length === 0) break;
    for (const o of orders) {
      ordersScanned++;
      if (ordersScanned > HARD_CAP_ORDERS) break;
      if (!o.customer_id || o.customer_id <= 0) continue; // guests handled separately later
      const orderMs = new Date(o.date_created).getTime();
      const total = Number(o.total_inc_tax) || 0;
      let agg = aggByCustomer.get(o.customer_id);
      if (!agg) {
        agg = emptyAgg();
        aggByCustomer.set(o.customer_id, agg);
      }
      agg.count++;
      agg.spend += total;
      if (Number.isFinite(orderMs)) {
        if (orderMs < agg.firstMs) agg.firstMs = orderMs;
        if (orderMs > agg.lastMs) agg.lastMs = orderMs;
      }
    }
    if (orders.length < PAGE_SIZE) break;
    page++;
  }

  return { aggByCustomer, ordersScanned };
}

/** Walk /v3/customers and upsert each, joined with the order aggregate. */
async function walkAndUpsertCustomers(args: {
  storeRoot: string;
  apiToken: string;
  storeId: string;
  divisionId: string | null;
  aggByCustomer: Map<number, SlimOrderAggregate>;
  sinceIso?: string;
  counts: SyncCustomersCounts;
  onProgress?: (counts: SyncCustomersCounts) => void | Promise<void>;
}): Promise<void> {
  const sinceParam = args.sinceIso
    ? `&date_modified:min=${encodeURIComponent(args.sinceIso)}`
    : "";
  let page = 1;
  let customersScanned = 0;

  while (customersScanned < HARD_CAP_CUSTOMERS) {
    const url =
      `${args.storeRoot}/v3/customers?limit=${PAGE_SIZE}&page=${page}${sinceParam}`;
    const r = await bcFetch(url, args.apiToken);
    if (!r.ok) {
      throw new Error(`Customers page ${page}: HTTP ${r.status} — ${r.body}`);
    }
    let parsed: { data?: BcCustomerPayload[] };
    try {
      parsed = JSON.parse(r.body) as { data?: BcCustomerPayload[] };
    } catch {
      break;
    }
    const data = parsed.data ?? [];
    if (data.length === 0) break;

    for (const bc of data) {
      customersScanned++;
      if (customersScanned > HARD_CAP_CUSTOMERS) break;
      try {
        const { create, update } = mapBcCustomerToUpsert(bc, {
          storeId: args.storeId,
          divisionId: args.divisionId,
          aggregate: args.aggByCustomer.get(bc.id),
        });
        const result = await prisma.customer.upsert({
          where: {
            sourceSystem_sourceId: {
              sourceSystem: SOURCE_SYSTEM,
              sourceId: String(bc.id),
            },
          },
          create: create as Prisma.CustomerUncheckedCreateInput,
          update: update as Prisma.CustomerUncheckedUpdateInput,
        });
        args.counts.customersUpserted++;
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          args.counts.customersCreated++;
        } else {
          args.counts.customersUpdated++;
        }
      } catch (err) {
        args.counts.customersFailed++;
        const msg = err instanceof Error ? err.message : "unknown error";
        if (args.counts.errorMessages.length < 20) {
          args.counts.errorMessages.push(`Customer ${bc.id}: ${msg}`);
        }
      }
    }

    if (args.onProgress) await args.onProgress({ ...args.counts });
    if (data.length < PAGE_SIZE) break;
    page++;
  }
}

/** Top-level entry: walk orders → walk customers → upsert. */
export async function syncBigCommerceCustomers(
  input: SyncCustomersInput,
): Promise<SyncCustomersCounts> {
  const counts: SyncCustomersCounts = {
    ordersScanned: 0,
    customersUpserted: 0,
    customersCreated: 0,
    customersUpdated: 0,
    customersFailed: 0,
    errorMessages: [],
  };

  const { aggByCustomer, ordersScanned } = await buildOrderAggregates({
    storeRoot: input.storeRoot,
    apiToken: input.apiToken,
    sinceIso: input.mode === "incremental" ? input.sinceIso : undefined,
  });
  counts.ordersScanned = ordersScanned;
  if (input.onProgress) await input.onProgress({ ...counts });

  await walkAndUpsertCustomers({
    storeRoot: input.storeRoot,
    apiToken: input.apiToken,
    storeId: input.storeId,
    divisionId: input.divisionId,
    aggByCustomer,
    sinceIso: input.mode === "incremental" ? input.sinceIso : undefined,
    counts,
    onProgress: input.onProgress,
  });

  return counts;
}
