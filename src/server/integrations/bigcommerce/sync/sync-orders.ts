/**
 * Core BC → Postgres order sync walker.
 *
 * Walks /v2/orders for the store, upserting each into the Order table.
 * Each order's BC customer_id is resolved against the Customer table
 * (sourceSystem='bigcommerce', sourceId=String(customer_id)) and the
 * resolved Customer.id is written to Order.customerId. Guest orders
 * (customer_id=0) and orders whose customer hasn't been synced yet
 * leave customerId null.
 *
 * Pre-loads a (BC customer_id) → (Prisma Customer.id) map up front, so
 * the per-row upsert doesn't need to do an extra DB roundtrip.
 *
 * Order LINE ITEMS are not touched in this version (mirrors the existing
 * CSV import in services/imports/bigcommerce.ts: "Orders import (header-
 * only — items not handled in CSV path)"). Items can be a follow-up.
 *
 * Modes:
 *   - "full"        — walks ALL orders for the store
 *   - "incremental" — walks orders with min_date_modified={sinceIso}
 */
import { prisma } from "@/server/db/client";

import type { Prisma } from "@prisma/client";

import {
  mapBcOrderToUpsert,
  SOURCE_SYSTEM,
  type BcOrderPayload,
} from "./order-mapper";

const BC_BASE = "https://api.bigcommerce.com";
const PAGE_SIZE = 250;
const HARD_CAP_ORDERS = 500_000;

export type SyncOrdersInput = {
  storeRoot: string;
  apiToken: string;
  storeId: string;
  divisionId: string | null;
  mode: "full" | "incremental";
  /** ISO timestamp; only used when mode === "incremental". */
  sinceIso?: string;
  /** Optional callback invoked after each order page is processed. */
  onProgress?: (counts: SyncOrdersCounts) => void | Promise<void>;
};

export type SyncOrdersCounts = {
  ordersScanned: number;
  ordersUpserted: number;
  ordersCreated: number;
  ordersUpdated: number;
  ordersFailed: number;
  ordersUnlinked: number; // BC customer_id had no matching Customer row
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

/**
 * Pre-load all BC-sourced Customer rows for THIS store so the walker can
 * resolve BC customer_id → Customer.id without per-row DB queries.
 *
 * Memory: ~50B per row × N customers. For 100k customers ≈ 5MB. Fine.
 */
async function loadCustomerIdMap(storeId: string): Promise<Map<number, string>> {
  const rows = await prisma.customer.findMany({
    where: { storeId, sourceSystem: SOURCE_SYSTEM },
    select: { id: true, sourceId: true },
  });
  const map = new Map<number, string>();
  for (const r of rows) {
    if (!r.sourceId) continue;
    const bcId = Number(r.sourceId);
    if (Number.isFinite(bcId) && bcId > 0) map.set(bcId, r.id);
  }
  return map;
}

export async function syncBigCommerceOrders(
  input: SyncOrdersInput,
): Promise<SyncOrdersCounts> {
  const counts: SyncOrdersCounts = {
    ordersScanned: 0,
    ordersUpserted: 0,
    ordersCreated: 0,
    ordersUpdated: 0,
    ordersFailed: 0,
    ordersUnlinked: 0,
    errorMessages: [],
  };

  const customerIdMap = await loadCustomerIdMap(input.storeId);

  const sinceParam = input.sinceIso
    ? `&min_date_modified=${encodeURIComponent(input.sinceIso)}`
    : "";

  let page = 1;
  while (counts.ordersScanned < HARD_CAP_ORDERS) {
    const url =
      `${input.storeRoot}/v2/orders?limit=${PAGE_SIZE}&page=${page}` +
      `&sort=date_created:desc${sinceParam}`;
    const r = await bcFetch(url, input.apiToken);
    if (!r.ok) {
      if (r.status === 404) break; // BC v2 returns 404 past the last page
      throw new Error(`Orders page ${page}: HTTP ${r.status} — ${r.body}`);
    }
    if (r.status === 204 || r.body.trim() === "") break;
    let orders: BcOrderPayload[];
    try {
      orders = JSON.parse(r.body) as BcOrderPayload[];
    } catch {
      break;
    }
    if (!Array.isArray(orders) || orders.length === 0) break;

    for (const bc of orders) {
      counts.ordersScanned++;
      if (counts.ordersScanned > HARD_CAP_ORDERS) break;
      try {
        const customerId =
          bc.customer_id && bc.customer_id > 0
            ? (customerIdMap.get(bc.customer_id) ?? null)
            : null;
        if (bc.customer_id > 0 && !customerId) counts.ordersUnlinked++;

        const { create, update } = mapBcOrderToUpsert(bc, {
          storeId: input.storeId,
          divisionId: input.divisionId,
          customerId,
        });

        const result = await prisma.order.upsert({
          where: {
            sourceSystem_sourceId: {
              sourceSystem: SOURCE_SYSTEM,
              sourceId: String(bc.id),
            },
          },
          create: create as Prisma.OrderUncheckedCreateInput,
          update: update as Prisma.OrderUncheckedUpdateInput,
        });
        counts.ordersUpserted++;
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          counts.ordersCreated++;
        } else {
          counts.ordersUpdated++;
        }
      } catch (err) {
        counts.ordersFailed++;
        const msg = err instanceof Error ? err.message : "unknown error";
        if (counts.errorMessages.length < 20) {
          counts.errorMessages.push(`Order ${bc.id}: ${msg}`);
        }
      }
    }

    if (input.onProgress) await input.onProgress({ ...counts });
    if (orders.length < PAGE_SIZE) break;
    page++;
  }

  return counts;
}
