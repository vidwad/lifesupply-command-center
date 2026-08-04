/**
 * Core BC → Postgres order sync walker.
 *
 * Walks /v2/orders for the store, upserting each into the Order table.
 * Each order's buyer is resolved to a Customer.id and written to
 * Order.customerId:
 *   - Registered orders (customer_id > 0) resolve against synced
 *     Customer rows (sourceSystem='bigcommerce').
 *   - Guest orders (customer_id = 0) resolve by normalized billing email
 *     (Phase 3A): matched to a registered customer when the email is known,
 *     otherwise a first-class guest Customer (sourceSystem='bigcommerce_guest')
 *     is created/reused so the order links to a real buyer instead of null.
 *   - Orders whose registered customer isn't synced yet, or guest orders with
 *     no billing email, are left unlinked.
 *
 * Pre-loads the customer lookup maps up front so the per-row resolve doesn't
 * need an extra DB roundtrip.
 *
 * Per order, the walker also syncs:
 *   - LINE ITEMS via /v2/orders/{id}/products (Phase 3B, `syncItems`).
 *   - SHIPMENTS via /v2/orders/{id}/shipments (Phase 3D, `syncShipments`),
 *     fetched only when the header reports shipped items. The header's
 *     payment_method / refunded_amount / items_shipped feed the order's
 *     payment + fulfillment reporting fields.
 *
 * Modes:
 *   - "full"        — walks ALL orders for the store
 *   - "incremental" — walks orders with min_date_modified={sinceIso}
 */
import { prisma } from "@/server/db/client";

import type { Prisma } from "@prisma/client";

import {
  buildGuestCustomerUpsert,
  GUEST_SOURCE_SYSTEM,
  normalizeEmail,
  resolveOrderCustomerLink,
} from "./guest-customer";
import { mapBcOrderProductToUpsert, type BcOrderProduct } from "./order-item-mapper";
import { mapBcOrderToUpsert, SOURCE_SYSTEM, type BcOrderPayload } from "./order-mapper";
import { mapBcShipmentToUpsert, type BcShipment } from "./shipment-mapper";

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
  /**
   * Sync each order's line items via /v2/orders/{id}/products (Phase 3B).
   * Defaults to true. One extra API call per order — disable for a fast
   * header-only sync.
   */
  syncItems?: boolean;
  /**
   * Sync shipments (tracking refs) via /v2/orders/{id}/shipments (Phase 3D).
   * Defaults to true. Fetched only for orders whose header reports shipped
   * items, so the extra API cost is limited to fulfilled orders.
   */
  syncShipments?: boolean;
  /** Optional callback invoked after each order page is processed. */
  onProgress?: (counts: SyncOrdersCounts) => void | Promise<void>;
};

export type SyncOrdersCounts = {
  ordersScanned: number;
  ordersUpserted: number;
  ordersCreated: number;
  ordersUpdated: number;
  ordersFailed: number;
  ordersUnlinked: number; // registered customer_id had no matching Customer row
  guestsCreated: number; // new guest Customer rows created
  guestOrdersLinked: number; // guest orders linked to a guest Customer
  guestOrdersDeduped: number; // guest orders whose email matched a registered customer
  guestOrdersNoEmail: number; // guest orders with no billing email → left unlinked
  itemsCreated: number; // order line items created
  itemsUpdated: number; // order line items updated in place
  itemsDeleted: number; // stale BC line items removed
  itemsFailed: number; // orders whose item sync raised
  shipmentsUpserted: number; // shipment rows created/updated
  shipmentsDeleted: number; // stale BC shipment rows removed
  shipmentsFailed: number; // orders whose shipment sync raised
  errorMessages: string[];
};

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

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

type CustomerMaps = {
  registeredByBcId: Map<number, string>;
  registeredByEmail: Map<string, string>;
  guestByEmail: Map<string, string>;
};

/**
 * Pre-load the store's synced customers (registered + guest) into lookup maps
 * so the walker resolves each order's buyer without per-row DB queries.
 *
 * Memory: ~60B per row. For 100k customers ≈ 6MB. Fine.
 */
async function loadCustomerMaps(storeId: string): Promise<CustomerMaps> {
  const rows = await prisma.customer.findMany({
    where: { storeId, sourceSystem: { in: [SOURCE_SYSTEM, GUEST_SOURCE_SYSTEM] } },
    select: { id: true, sourceSystem: true, sourceId: true, email: true },
  });
  const maps: CustomerMaps = {
    registeredByBcId: new Map(),
    registeredByEmail: new Map(),
    guestByEmail: new Map(),
  };
  for (const r of rows) {
    if (r.sourceSystem === SOURCE_SYSTEM) {
      const bcId = Number(r.sourceId);
      if (Number.isFinite(bcId) && bcId > 0) maps.registeredByBcId.set(bcId, r.id);
      const email = normalizeEmail(r.email);
      if (email) maps.registeredByEmail.set(email, r.id);
    } else if (r.sourceSystem === GUEST_SOURCE_SYSTEM) {
      // Guest sourceId IS the normalized email; email column mirrors it.
      const email = normalizeEmail(r.email) ?? normalizeEmail(r.sourceId);
      if (email) maps.guestByEmail.set(email, r.id);
    }
  }
  return maps;
}

type ProductMaps = {
  /** BC product_id → Prisma Product.id (for this store). */
  productBySourceId: Map<string, string>;
  /** BC variant_id → Prisma ProductVariant.id (for this store's products). */
  variantBySourceId: Map<string, string>;
};

/**
 * Pre-load the store's synced products + variants so line items can link to
 * them. Empty until product sync (Phase 3C) runs — items still sync, just
 * with productId/productVariantId null.
 */
async function loadProductMaps(storeId: string): Promise<ProductMaps> {
  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { storeId, sourceSystem: SOURCE_SYSTEM },
      select: { id: true, sourceId: true },
    }),
    prisma.productVariant.findMany({
      where: { sourceSystem: SOURCE_SYSTEM, product: { storeId } },
      select: { id: true, sourceId: true },
    }),
  ]);
  const maps: ProductMaps = { productBySourceId: new Map(), variantBySourceId: new Map() };
  for (const p of products) if (p.sourceId) maps.productBySourceId.set(p.sourceId, p.id);
  for (const v of variants) if (v.sourceId) maps.variantBySourceId.set(v.sourceId, v.id);
  return maps;
}

/**
 * Sync one order's line items from /v2/orders/{id}/products: upsert the current
 * items (keyed by BC order-product id) and remove stale BC items that no longer
 * exist upstream. Manually-added items (sourceSystem null) are left untouched.
 * Mutates the item counts; throws on fetch/parse failure so the caller can mark
 * the order's item sync failed without aborting the whole run.
 */
async function syncOrderItemsForOrder(args: {
  storeRoot: string;
  apiToken: string;
  bcOrderId: number;
  orderId: string;
  productMaps: ProductMaps;
  counts: SyncOrdersCounts;
}): Promise<void> {
  const { storeRoot, apiToken, bcOrderId, orderId, productMaps, counts } = args;

  const seenSourceIds: string[] = [];
  let page = 1;
  while (true) {
    const url = `${storeRoot}/v2/orders/${bcOrderId}/products?limit=${PAGE_SIZE}&page=${page}`;
    const r = await bcFetch(url, apiToken);
    if (!r.ok) {
      if (r.status === 404) break; // no products / past last page
      throw new Error(`Order ${bcOrderId} products page ${page}: HTTP ${r.status} — ${r.body}`);
    }
    if (r.status === 204 || r.body.trim() === "") break;
    let items: BcOrderProduct[];
    try {
      items = JSON.parse(r.body) as BcOrderProduct[];
    } catch {
      break;
    }
    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      const productId = item.product_id
        ? (productMaps.productBySourceId.get(String(item.product_id)) ?? null)
        : null;
      const productVariantId = item.variant_id
        ? (productMaps.variantBySourceId.get(String(item.variant_id)) ?? null)
        : null;
      const { create, update } = mapBcOrderProductToUpsert(item, {
        orderId,
        productId,
        productVariantId,
      });
      const result = await prisma.orderItem.upsert({
        where: {
          sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: String(item.id) },
        },
        create,
        update,
      });
      seenSourceIds.push(String(item.id));
      if (result.createdAt.getTime() === result.updatedAt.getTime()) counts.itemsCreated++;
      else counts.itemsUpdated++;
    }

    if (items.length < PAGE_SIZE) break;
    page++;
  }

  // Remove BC line items that no longer exist upstream for this order. Leaves
  // manually-added items (sourceSystem null) untouched.
  const del = await prisma.orderItem.deleteMany({
    where: {
      orderId,
      sourceSystem: SOURCE_SYSTEM,
      ...(seenSourceIds.length > 0 ? { sourceId: { notIn: seenSourceIds } } : {}),
    },
  });
  counts.itemsDeleted += del.count;
}

/**
 * Sync one order's shipments from /v2/orders/{id}/shipments (Phase 3D):
 * upsert each (keyed by BC shipment id) and remove stale BC shipments.
 * Throws on fetch failure so the caller can count it without aborting the run.
 */
async function syncShipmentsForOrder(args: {
  storeRoot: string;
  apiToken: string;
  bcOrderId: number;
  orderId: string;
  counts: SyncOrdersCounts;
}): Promise<void> {
  const { storeRoot, apiToken, bcOrderId, orderId, counts } = args;

  const seen: string[] = [];
  let page = 1;
  while (true) {
    const url = `${storeRoot}/v2/orders/${bcOrderId}/shipments?limit=${PAGE_SIZE}&page=${page}`;
    const r = await bcFetch(url, apiToken);
    if (!r.ok) {
      if (r.status === 404) break; // no shipments / past last page
      throw new Error(`Order ${bcOrderId} shipments page ${page}: HTTP ${r.status} — ${r.body}`);
    }
    if (r.status === 204 || r.body.trim() === "") break;
    let shipments: BcShipment[];
    try {
      shipments = JSON.parse(r.body) as BcShipment[];
    } catch {
      break;
    }
    if (!Array.isArray(shipments) || shipments.length === 0) break;

    for (const s of shipments) {
      const { create, update } = mapBcShipmentToUpsert(s, { orderId });
      await prisma.orderShipment.upsert({
        where: { sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: String(s.id) } },
        create,
        update,
      });
      seen.push(String(s.id));
      counts.shipmentsUpserted++;
    }

    if (shipments.length < PAGE_SIZE) break;
    page++;
  }

  const del = await prisma.orderShipment.deleteMany({
    where: {
      orderId,
      sourceSystem: SOURCE_SYSTEM,
      ...(seen.length > 0 ? { sourceId: { notIn: seen } } : {}),
    },
  });
  counts.shipmentsDeleted += del.count;
}

/**
 * Resolve the Customer.id for one order, creating a guest Customer on demand.
 * Mutates `maps.guestByEmail` when a new guest is created so later orders in
 * the same run reuse it. Returns null when the order can't be linked.
 */
async function resolveCustomerIdForOrder(
  bc: BcOrderPayload,
  input: SyncOrdersInput,
  maps: CustomerMaps,
  counts: SyncOrdersCounts,
): Promise<string | null> {
  const link = resolveOrderCustomerLink({
    bcCustomerId: bc.customer_id,
    billingEmail: bc.billing_address?.email,
    registeredByBcId: maps.registeredByBcId,
    registeredByEmail: maps.registeredByEmail,
    guestByEmail: maps.guestByEmail,
  });

  switch (link.kind) {
    case "registered":
      return link.customerId;
    case "guest-registered-dedup":
      counts.guestOrdersDeduped++;
      return link.customerId;
    case "guest-existing":
      counts.guestOrdersLinked++;
      return link.customerId;
    case "guest-create": {
      const { create, update } = buildGuestCustomerUpsert({
        email: link.email,
        identity: {
          firstName: trimOrNull(bc.billing_address?.first_name),
          lastName: trimOrNull(bc.billing_address?.last_name),
          companyName: trimOrNull(bc.billing_address?.company),
          phone: trimOrNull(bc.billing_address?.phone),
        },
        storeId: input.storeId,
        divisionId: input.divisionId,
        sourceOrderId: bc.id,
      });
      const guest = await prisma.customer.upsert({
        where: {
          sourceSystem_sourceId: { sourceSystem: GUEST_SOURCE_SYSTEM, sourceId: link.email },
        },
        create,
        update,
      });
      maps.guestByEmail.set(link.email, guest.id);
      if (guest.createdAt.getTime() === guest.updatedAt.getTime()) counts.guestsCreated++;
      counts.guestOrdersLinked++;
      return guest.id;
    }
    case "unlinked":
      if (link.reason === "customer-not-synced") counts.ordersUnlinked++;
      else counts.guestOrdersNoEmail++;
      return null;
  }
}

export async function syncBigCommerceOrders(input: SyncOrdersInput): Promise<SyncOrdersCounts> {
  const counts: SyncOrdersCounts = {
    ordersScanned: 0,
    ordersUpserted: 0,
    ordersCreated: 0,
    ordersUpdated: 0,
    ordersFailed: 0,
    ordersUnlinked: 0,
    guestsCreated: 0,
    guestOrdersLinked: 0,
    guestOrdersDeduped: 0,
    guestOrdersNoEmail: 0,
    itemsCreated: 0,
    itemsUpdated: 0,
    itemsDeleted: 0,
    itemsFailed: 0,
    shipmentsUpserted: 0,
    shipmentsDeleted: 0,
    shipmentsFailed: 0,
    errorMessages: [],
  };

  const syncItems = input.syncItems !== false;
  const syncShipments = input.syncShipments !== false;
  const maps = await loadCustomerMaps(input.storeId);
  const productMaps = syncItems
    ? await loadProductMaps(input.storeId)
    : {
        productBySourceId: new Map<string, string>(),
        variantBySourceId: new Map<string, string>(),
      };

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
        const customerId = await resolveCustomerIdForOrder(bc, input, maps, counts);

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

        // Item sync failures are isolated: a bad line-item fetch must not mark
        // the whole order failed or abort the run.
        if (syncItems) {
          try {
            await syncOrderItemsForOrder({
              storeRoot: input.storeRoot,
              apiToken: input.apiToken,
              bcOrderId: bc.id,
              orderId: result.id,
              productMaps,
              counts,
            });
          } catch (itemErr) {
            counts.itemsFailed++;
            const msg = itemErr instanceof Error ? itemErr.message : "unknown error";
            if (counts.errorMessages.length < 20) {
              counts.errorMessages.push(`Order ${bc.id} items: ${msg}`);
            }
          }
        }

        // Shipments carry the tracking references (Phase 3D). Only fetched
        // when the header reports shipped items, so unshipped orders cost
        // nothing extra. Failures are isolated like item failures.
        if (syncShipments && (bc.items_shipped ?? 0) > 0) {
          try {
            await syncShipmentsForOrder({
              storeRoot: input.storeRoot,
              apiToken: input.apiToken,
              bcOrderId: bc.id,
              orderId: result.id,
              counts,
            });
          } catch (shipErr) {
            counts.shipmentsFailed++;
            const msg = shipErr instanceof Error ? shipErr.message : "unknown error";
            if (counts.errorMessages.length < 20) {
              counts.errorMessages.push(`Order ${bc.id} shipments: ${msg}`);
            }
          }
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
