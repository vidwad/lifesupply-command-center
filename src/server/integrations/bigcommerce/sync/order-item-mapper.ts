/**
 * Maps a BigCommerce /v2/orders/{id}/products line item into Prisma OrderItem
 * upsert payloads (Phase 3B — docs/19).
 *
 * Conflict policy (mirrors order-mapper / customer-mapper):
 *
 *   BC-OWNED (overwritten on every sync):
 *     sku, productName, quantity, unitPrice, lineSubtotal, lineTax, lineTotal,
 *     productId, productVariantId (resolved by the caller from synced products)
 *
 *   CC-OWNED (set on create only; NEVER touched by sync):
 *     unitCost, estimatedGrossProfit, estimatedGrossMargin, supplierId,
 *     supplierProductId
 *     (unitCost is seeded from BC's cost_price on create as a starting point,
 *      then owned by CC margin enrichment thereafter)
 *
 *   METADATA escape hatch:
 *     metadata.bcRaw — raw line payload; metadata.bcProductId / bcVariantId;
 *     refund/bundle signals (bcQuantityRefunded, bcIsRefunded, bcIsBundled);
 *     metadata.bcSyncedAt
 *
 * Idempotency: keyed on (sourceSystem, sourceId) where sourceId is the BC
 * order-product id, so re-syncs update in place and preserve CC-owned fields.
 */
import type { Prisma } from "@prisma/client";

export type BcOrderProduct = {
  id: number;
  product_id?: number | null;
  variant_id?: number | null;
  name?: string | null;
  sku?: string | null;
  quantity?: number | null;
  price_inc_tax?: string | number | null;
  price_ex_tax?: string | number | null;
  total_inc_tax?: string | number | null;
  total_ex_tax?: string | number | null;
  total_tax?: string | number | null;
  cost_price_inc_tax?: string | number | null;
  quantity_refunded?: number | null;
  refund_amount?: string | number | null;
  is_refunded?: boolean | null;
  is_bundled_product?: boolean | null;
};

export type OrderItemUpsertPayloads = {
  create: Prisma.OrderItemUncheckedCreateInput;
  update: Prisma.OrderItemUncheckedUpdateInput;
};

export const SOURCE_SYSTEM = "bigcommerce";

function decimal(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function intOrZero(v: number | null | undefined): number {
  if (v == null) return 0;
  return Number.isFinite(v) ? Math.trunc(v) : 0;
}

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

export function mapBcOrderProductToUpsert(
  bc: BcOrderProduct,
  args: {
    orderId: string;
    productId: string | null;
    productVariantId: string | null;
  },
): OrderItemUpsertPayloads {
  const lineSubtotal = decimal(bc.total_ex_tax);
  const lineTotal = decimal(bc.total_inc_tax);
  const lineTax =
    bc.total_tax != null ? decimal(bc.total_tax) : Math.max(lineTotal - lineSubtotal, 0);

  // ---- BC-owned (overwrite on every sync) ----
  const bcOwned = {
    productId: args.productId,
    productVariantId: args.productVariantId,
    sku: trimOrNull(bc.sku) ?? "",
    productName: trimOrNull(bc.name) ?? "(unnamed item)",
    quantity: intOrZero(bc.quantity),
    unitPrice: decimal(bc.price_inc_tax),
    lineSubtotal,
    lineTax,
    lineTotal,
  };

  // ---- METADATA ----
  const metadata = {
    bcRaw: bc as unknown as Prisma.InputJsonValue,
    bcProductId: bc.product_id ?? null,
    bcVariantId: bc.variant_id ?? null,
    bcQuantityRefunded: bc.quantity_refunded ?? 0,
    bcIsRefunded: bc.is_refunded ?? false,
    bcIsBundled: bc.is_bundled_product ?? false,
    bcSyncedAt: new Date().toISOString(),
  } satisfies Prisma.InputJsonObject;

  return {
    create: {
      sourceSystem: SOURCE_SYSTEM,
      sourceId: String(bc.id),
      orderId: args.orderId,
      // CC-owned: seed unitCost from BC cost on create only; margins/supplier
      // stay null until CC enrichment sets them.
      unitCost: bc.cost_price_inc_tax != null ? decimal(bc.cost_price_inc_tax) : null,
      ...bcOwned,
      metadata,
    },
    update: {
      // CC-owned fields intentionally omitted — Prisma preserves them.
      ...bcOwned,
      metadata,
    },
  };
}
