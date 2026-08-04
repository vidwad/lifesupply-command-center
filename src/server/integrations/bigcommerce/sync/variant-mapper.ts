/**
 * Maps a BigCommerce catalog variant (from /v3/catalog/products?include=variants)
 * into Prisma ProductVariant upsert payloads (Phase 3C — docs/19).
 *
 * All fields are BC-owned catalog data (overwritten on every sync). A BC
 * variant may omit price/sale_price/cost_price, meaning "inherit the product's
 * base value" — the caller passes those as fallbacks. Even simple products
 * carry one base variant, so every product ends up with ≥1 ProductVariant.
 */
import type { Prisma, ProductStatus } from "@prisma/client";

export type BcVariantOptionValue = {
  label?: string | null;
  option_display_name?: string | null;
};

export type BcVariant = {
  id: number;
  product_id?: number | null;
  sku?: string | null;
  price?: string | number | null;
  sale_price?: string | number | null;
  cost_price?: string | number | null;
  inventory_level?: number | null;
  purchasing_disabled?: boolean | null;
  option_values?: BcVariantOptionValue[] | null;
};

export type VariantUpsertPayloads = {
  create: Prisma.ProductVariantUncheckedCreateInput;
  update: Prisma.ProductVariantUncheckedUpdateInput;
};

export const SOURCE_SYSTEM = "bigcommerce";

function decimalOrNull(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

/** "Size: Large, Color: Blue" from the variant's option values; null if none. */
export function optionSummary(bc: BcVariant): string | null {
  const parts = (bc.option_values ?? [])
    .map((o) => {
      const name = trimOrNull(o.option_display_name);
      const label = trimOrNull(o.label);
      if (name && label) return `${name}: ${label}`;
      return label ?? null;
    })
    .filter((s): s is string => s !== null);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function mapBcVariantToUpsert(
  bc: BcVariant,
  args: {
    productId: string;
    /** Product-level tracking → schema's inventoryTrackingType (none/bigcommerce). */
    inventoryTrackingType: string;
    fallback: { price: number | null; salePrice: number | null; costPrice: number | null };
  },
): VariantUpsertPayloads {
  const price = decimalOrNull(bc.price) ?? args.fallback.price ?? 0;
  const salePrice = decimalOrNull(bc.sale_price) ?? args.fallback.salePrice;
  const costPrice = decimalOrNull(bc.cost_price) ?? args.fallback.costPrice;
  const status: ProductStatus = bc.purchasing_disabled ? "inactive" : "active";

  const bcOwned = {
    productId: args.productId,
    sku: trimOrNull(bc.sku) ?? "",
    optionSummary: optionSummary(bc),
    price,
    salePrice,
    costPrice,
    inventoryTrackingType: args.inventoryTrackingType,
    stockLevel: typeof bc.inventory_level === "number" ? bc.inventory_level : null,
    status,
  };

  return {
    create: {
      sourceSystem: SOURCE_SYSTEM,
      sourceId: String(bc.id),
      ...bcOwned,
    },
    update: { ...bcOwned },
  };
}

/** BC inventory_tracking ("none"|"product"|"variant") → schema's field. */
export function mapInventoryTracking(bcTracking: string | null | undefined): string {
  return bcTracking && bcTracking !== "none" ? "bigcommerce" : "none";
}
