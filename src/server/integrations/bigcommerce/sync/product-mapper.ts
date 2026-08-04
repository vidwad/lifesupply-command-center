/**
 * Maps a BigCommerce /v3/catalog/products payload into Prisma Product upsert
 * payloads (Phase 3C — docs/19).
 *
 * Conflict policy (mirrors the other mappers):
 *
 *   BC-OWNED (overwritten on every sync):
 *     name, sku, brand, description, url, imageStatus, descriptionStatus,
 *     status, productType, categoryId (resolved by caller from synced categories)
 *
 *   CC-OWNED (set on create only; NEVER touched by sync):
 *     isFeatured, isRockstarCandidate
 *
 *   METADATA escape hatch:
 *     metadata.bcRaw, metadata.bcCategories (all BC category ids),
 *     metadata.bcBrandId, metadata.bcSyncedAt
 *
 * Price / inventory live on ProductVariant (see variant-mapper) — even simple
 * products carry a single BC variant.
 */
import type { DataQualityStatus, Prisma, ProductStatus } from "@prisma/client";

export type BcProduct = {
  id: number;
  name?: string | null;
  sku?: string | null;
  type?: string | null;
  description?: string | null;
  brand_id?: number | null;
  categories?: number[] | null;
  is_visible?: boolean | null;
  availability?: string | null; // available | disabled | preorder
  custom_url?: { url?: string | null } | null;
  images?: unknown[] | null;
  // Base price fields — used as the variant fallback when a variant omits them.
  price?: string | number | null;
  sale_price?: string | number | null;
  cost_price?: string | number | null;
};

export type ProductUpsertPayloads = {
  create: Prisma.ProductUncheckedCreateInput;
  update: Prisma.ProductUncheckedUpdateInput;
};

export const SOURCE_SYSTEM = "bigcommerce";

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

/** BC availability + visibility → Prisma ProductStatus. */
export function deriveProductStatus(bc: BcProduct): ProductStatus {
  if (bc.availability === "disabled") return "inactive";
  if (bc.is_visible === false) return "draft";
  return "active";
}

/** Present when there's at least one image, else missing. */
export function deriveImageStatus(bc: BcProduct): DataQualityStatus {
  return Array.isArray(bc.images) && bc.images.length > 0 ? "present" : "missing";
}

/**
 * Description quality: missing when empty; needs_review when suspiciously
 * short (< 40 chars of text); otherwise present. HTML tags are stripped
 * before measuring so markup doesn't inflate the length.
 */
export function deriveDescriptionStatus(bc: BcProduct): DataQualityStatus {
  const text = (bc.description ?? "").replace(/<[^>]*>/g, "").trim();
  if (text.length === 0) return "missing";
  if (text.length < 40) return "needs_review";
  return "present";
}

export function mapBcProductToUpsert(
  bc: BcProduct,
  args: {
    storeId: string;
    divisionId: string | null;
    categoryId: string | null;
    brandName: string | null;
  },
): ProductUpsertPayloads {
  const bcOwned = {
    name: trimOrNull(bc.name) ?? "(unnamed product)",
    sku: trimOrNull(bc.sku),
    brand: trimOrNull(args.brandName),
    description: trimOrNull(bc.description),
    url: trimOrNull(bc.custom_url?.url),
    imageStatus: deriveImageStatus(bc),
    descriptionStatus: deriveDescriptionStatus(bc),
    status: deriveProductStatus(bc),
    productType: trimOrNull(bc.type),
    categoryId: args.categoryId,
  };

  const metadata = {
    bcRaw: bc as unknown as Prisma.InputJsonValue,
    bcCategories: bc.categories ?? [],
    bcBrandId: bc.brand_id ?? null,
    bcSyncedAt: new Date().toISOString(),
  } satisfies Prisma.InputJsonObject;

  return {
    create: {
      sourceSystem: SOURCE_SYSTEM,
      sourceId: String(bc.id),
      storeId: args.storeId,
      divisionId: args.divisionId,
      // CC-owned defaults (create only — survive future syncs).
      isFeatured: false,
      isRockstarCandidate: false,
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
