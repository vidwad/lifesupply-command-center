/**
 * Core BC → Postgres catalog sync walker (Phase 3C — docs/19).
 *
 * Order of operations for a store:
 *   1. Categories — walk /v3/catalog/categories, upsert, then resolve the
 *      parent hierarchy in a second pass.
 *   2. Brands — walk /v3/catalog/brands into an id → name map (for Product.brand).
 *   3. Products — walk /v3/catalog/products?include=variants, upsert each
 *      Product (linked to its first category + brand name) and its variants,
 *      removing stale BC variants per product.
 *
 * Modes:
 *   - "full"        — walks ALL categories + products
 *   - "incremental" — categories always full (small); products filtered by
 *                     date_modified:min={sinceIso}
 */
import { prisma } from "@/server/db/client";

import { mapBcCategoryToUpsert, SOURCE_SYSTEM, type BcCategory } from "./category-mapper";
import { mapBcProductToUpsert, type BcProduct } from "./product-mapper";
import { mapBcVariantToUpsert, mapInventoryTracking, type BcVariant } from "./variant-mapper";

const PAGE_SIZE = 250;
const HARD_CAP_PRODUCTS = 250_000;
const HARD_CAP_CATEGORIES = 50_000;

export type SyncCatalogInput = {
  storeRoot: string;
  apiToken: string;
  storeId: string;
  divisionId: string | null;
  mode: "full" | "incremental";
  sinceIso?: string;
  onProgress?: (counts: SyncCatalogCounts) => void | Promise<void>;
};

export type SyncCatalogCounts = {
  categoriesUpserted: number;
  productsScanned: number;
  productsUpserted: number;
  productsCreated: number;
  productsUpdated: number;
  productsFailed: number;
  variantsUpserted: number;
  variantsDeleted: number;
  errorMessages: string[];
};

type BcProductWithVariants = BcProduct & {
  inventory_tracking?: string | null;
  brand_id?: number | null;
  variants?: BcVariant[] | null;
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
    return { ok: false, status: "network", body: err instanceof Error ? err.message : "network" };
  }
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body: body.slice(0, 200) };
  return { ok: true, status: res.status, body };
}

/** Walk a paginated /v3 catalog endpoint, collecting every `data` row. */
async function fetchAllV3<T>(
  storeRoot: string,
  apiToken: string,
  path: string,
  hardCap: number,
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  while (out.length < hardCap) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${storeRoot}${path}${sep}limit=${PAGE_SIZE}&page=${page}`;
    const r = await bcFetch(url, apiToken);
    if (!r.ok) {
      if (r.status === 404) break;
      throw new Error(`${path} page ${page}: HTTP ${r.status} — ${r.body}`);
    }
    let parsed: { data?: T[] };
    try {
      parsed = JSON.parse(r.body) as { data?: T[] };
    } catch {
      break;
    }
    const data = parsed.data ?? [];
    if (data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  return out;
}

/** Sync categories + resolve the parent hierarchy. Returns bcId → Prisma id. */
async function syncCategories(
  input: SyncCatalogInput,
  counts: SyncCatalogCounts,
): Promise<Map<number, string>> {
  const cats = await fetchAllV3<BcCategory>(
    input.storeRoot,
    input.apiToken,
    "/v3/catalog/categories",
    HARD_CAP_CATEGORIES,
  );

  const bcIdToPrismaId = new Map<number, string>();

  // Pass 1: upsert every category (parent null for now).
  for (const bc of cats) {
    const { create, update } = mapBcCategoryToUpsert(bc, {
      storeId: input.storeId,
      parentCategoryId: null,
    });
    const row = await prisma.category.upsert({
      where: { sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: String(bc.id) } },
      create,
      update,
    });
    bcIdToPrismaId.set(bc.id, row.id);
    counts.categoriesUpserted++;
  }

  // Pass 2: set parents now that every category has a Prisma id.
  for (const bc of cats) {
    if (!bc.parent_id || bc.parent_id <= 0) continue;
    const childId = bcIdToPrismaId.get(bc.id);
    const parentId = bcIdToPrismaId.get(bc.parent_id);
    if (childId && parentId) {
      await prisma.category.update({
        where: { id: childId },
        data: { parentCategoryId: parentId },
      });
    }
  }

  return bcIdToPrismaId;
}

/** Walk /v3/catalog/brands into a bcBrandId → name map. Best-effort. */
async function loadBrands(storeRoot: string, apiToken: string): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const brands = await fetchAllV3<{ id: number; name?: string | null }>(
      storeRoot,
      apiToken,
      "/v3/catalog/brands",
      HARD_CAP_CATEGORIES,
    );
    for (const b of brands) if (b.name) map.set(b.id, b.name);
  } catch {
    // Brands are non-critical enrichment — leave brand null if the walk fails.
  }
  return map;
}

/** Upsert a product's variants and remove stale BC variants for that product. */
async function syncVariantsForProduct(
  bc: BcProductWithVariants,
  productId: string,
  counts: SyncCatalogCounts,
): Promise<void> {
  const tracking = mapInventoryTracking(bc.inventory_tracking);
  const fallback = {
    price: bc.price != null ? Number(bc.price) : null,
    salePrice: bc.sale_price != null ? Number(bc.sale_price) : null,
    costPrice: bc.cost_price != null ? Number(bc.cost_price) : null,
  };

  const seen: string[] = [];
  for (const v of bc.variants ?? []) {
    const { create, update } = mapBcVariantToUpsert(v, {
      productId,
      inventoryTrackingType: tracking,
      fallback,
    });
    await prisma.productVariant.upsert({
      where: { sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: String(v.id) } },
      create,
      update,
    });
    seen.push(String(v.id));
    counts.variantsUpserted++;
  }

  const del = await prisma.productVariant.deleteMany({
    where: {
      productId,
      sourceSystem: SOURCE_SYSTEM,
      ...(seen.length > 0 ? { sourceId: { notIn: seen } } : {}),
    },
  });
  counts.variantsDeleted += del.count;
}

export async function syncBigCommerceCatalog(input: SyncCatalogInput): Promise<SyncCatalogCounts> {
  const counts: SyncCatalogCounts = {
    categoriesUpserted: 0,
    productsScanned: 0,
    productsUpserted: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsFailed: 0,
    variantsUpserted: 0,
    variantsDeleted: 0,
    errorMessages: [],
  };

  const categoryMap = await syncCategories(input, counts);
  const brandMap = await loadBrands(input.storeRoot, input.apiToken);
  if (input.onProgress) await input.onProgress({ ...counts });

  // `images` is required, not decorative: deriveImageStatus() reads bc.images,
  // and the v3 catalog list endpoint omits the key entirely unless it is
  // included. Without it every product parses as having no images and is
  // flagged `missing`, which made the catalogue-quality filters meaningless
  // (docs/35 F-13 — 249 of 250 sampled products do have an image).
  const INCLUDE = "include=variants,images";
  const sinceParam =
    input.mode === "incremental" && input.sinceIso
      ? `?date_modified:min=${encodeURIComponent(input.sinceIso)}&${INCLUDE}`
      : `?${INCLUDE}`;

  let page = 1;
  while (counts.productsScanned < HARD_CAP_PRODUCTS) {
    const url = `${input.storeRoot}/v3/catalog/products${sinceParam}&limit=${PAGE_SIZE}&page=${page}`;
    const r = await bcFetch(url, input.apiToken);
    if (!r.ok) {
      if (r.status === 404) break;
      throw new Error(`Products page ${page}: HTTP ${r.status} — ${r.body}`);
    }
    let parsed: { data?: BcProductWithVariants[] };
    try {
      parsed = JSON.parse(r.body) as { data?: BcProductWithVariants[] };
    } catch {
      break;
    }
    const products = parsed.data ?? [];
    if (products.length === 0) break;

    for (const bc of products) {
      counts.productsScanned++;
      if (counts.productsScanned > HARD_CAP_PRODUCTS) break;
      try {
        const firstCategory = (bc.categories ?? []).find((c) => c > 0);
        const categoryId = firstCategory ? (categoryMap.get(firstCategory) ?? null) : null;
        const brandName = bc.brand_id ? (brandMap.get(bc.brand_id) ?? null) : null;

        const { create, update } = mapBcProductToUpsert(bc, {
          storeId: input.storeId,
          divisionId: input.divisionId,
          categoryId,
          brandName,
        });
        const product = await prisma.product.upsert({
          where: {
            sourceSystem_sourceId: { sourceSystem: SOURCE_SYSTEM, sourceId: String(bc.id) },
          },
          create,
          update,
        });
        counts.productsUpserted++;
        if (product.createdAt.getTime() === product.updatedAt.getTime()) counts.productsCreated++;
        else counts.productsUpdated++;

        await syncVariantsForProduct(bc, product.id, counts);
      } catch (err) {
        counts.productsFailed++;
        const msg = err instanceof Error ? err.message : "unknown error";
        if (counts.errorMessages.length < 20) counts.errorMessages.push(`Product ${bc.id}: ${msg}`);
      }
    }

    if (input.onProgress) await input.onProgress({ ...counts });
    if (products.length < PAGE_SIZE) break;
    page++;
  }

  return counts;
}
