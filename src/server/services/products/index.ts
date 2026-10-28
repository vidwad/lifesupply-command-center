import type { Prisma, ProductStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

import {
  PERFORMANCE_SEGMENTS,
  segmentIdFilter,
  type PerformanceIndex,
  type PerformanceSegment,
  type ProductSales,
} from "./performance";

export type ListProductsFilters = {
  storeId?: string;
  /** Scopes to one operating division, mirroring the shell's Division selector. */
  divisionId?: string;
  categoryId?: string;
  status?: ProductStatus;
  imageStatus?: "missing" | "needs_review";
  /**
   * A sales segment (2026-10-26). The index is computed once by the caller
   * and passed in, so the rows, the count and the pill counts all read the
   * same figures.
   */
  performance?: PerformanceSegment;
  performanceIndex?: PerformanceIndex;
  /** Products the store lists with at most this many images (2026-10-27). */
  maxImages?: number;
  /** Products whose description text, markup stripped, is shorter than this many characters. */
  maxDescriptionChars?: number;
  search?: string;
  /** 1-based. Out-of-range values are clamped by the caller, not here. */
  page?: number;
  sort?: ProductSortKey;
  dir?: SortDirection;
};

/** Matches CUSTOMERS_PAGE_SIZE so the list pages behave alike. */
export const PRODUCTS_PAGE_SIZE = 50;

export type SortDirection = "asc" | "desc";

/**
 * Columns that can be sorted **in the database**, and therefore across the
 * whole result set rather than the current page.
 *
 * Price, Cost, Margin, Stock and Supplier are deliberately absent. Each is
 * derived in application code from the product's variants or supplier rows —
 * `variants[0].price`, an aggregate of `stockLevel`, a margin computed after
 * the query. Prisma cannot order by a to-many aggregate, so the only way to
 * "sort" them here would be to reorder the 50 rows already fetched. Against
 * 51,114 products that would present a page-local shuffle as a catalogue-wide
 * ordering — the same class of lie as the truncated count in F-14. Sorting
 * those properly needs denormalised columns on Product, populated by the sync.
 *
 * `images` is such a column (`imageCount`, 2026-10-27). `revenue` is the
 * one exception to "in the database": the 90-day figure lives in the sales
 * index, so `listProducts` orders the whole matching set by it in code and
 * then fetches the requested page — a true catalogue-wide ordering, not a
 * page-local one. See `listProductsByRevenue`.
 */
export const PRODUCT_SORT_KEYS = [
  "name",
  "sku",
  "category",
  "store",
  "quality",
  "images",
  "revenue",
] as const;
export type ProductSortKey = (typeof PRODUCT_SORT_KEYS)[number];

/**
 * A whole number of zero or more from a query string, or undefined for
 * anything else, so a hand-edited URL cannot turn into a surprising filter.
 */
export function parseNonNegativeInt(value: string | undefined): number | undefined {
  if (value == null || !/^\d{1,9}$/.test(value.trim())) return undefined;
  return Number.parseInt(value.trim(), 10);
}

/** Narrows an arbitrary query-string value to a supported sort key. */
export function parseProductSort(value: string | undefined): ProductSortKey | undefined {
  return PRODUCT_SORT_KEYS.includes(value as ProductSortKey)
    ? (value as ProductSortKey)
    : undefined;
}

export function parseSortDirection(value: string | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc";
}

/**
 * Builds the orderBy. Every branch ends with `id` so paging is deterministic:
 * without a unique final key, rows sharing a sort value can swap between
 * pages and one is never shown.
 */
function productOrderBy(
  sort: ProductSortKey | undefined,
  dir: SortDirection,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: dir }, { id: "asc" }];
    case "sku":
      // Nulls last in both directions: a product with no SKU is not the
      // "smallest" SKU, it is an absence, and it should not head the list.
      return [{ sku: { sort: dir, nulls: "last" } }, { id: "asc" }];
    case "category":
      return [{ category: { name: dir } }, { id: "asc" }];
    case "store":
      return [{ store: { name: dir } }, { id: "asc" }];
    case "quality":
      return [{ imageStatus: dir }, { descriptionStatus: dir }, { id: "asc" }];
    case "images":
      return [{ imageCount: dir }, { id: "asc" }];
    case "revenue":
      // Handled by listProductsByRevenue; this is the fallback when no
      // sales index was supplied.
      return [{ isFeatured: "desc" }, { name: "asc" }, { id: "asc" }];
    default:
      // Unsorted default: featured first, then alphabetical.
      return [{ isFeatured: "desc" }, { name: "asc" }, { id: "asc" }];
  }
}

/**
 * Filter clause shared by listProducts and countProducts.
 *
 * Extracted deliberately: the two must agree exactly, or the pagination
 * footer computes its page count from a different population than the rows
 * it is paging through.
 */
function productWhere(filters: ListProductsFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.divisionId) where.divisionId = filters.divisionId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;
  if (filters.imageStatus === "missing") where.imageStatus = "missing";
  if (filters.imageStatus === "needs_review") where.imageStatus = "needs_review";
  if (filters.performance && filters.performanceIndex) {
    where.id = segmentIdFilter(filters.performance, filters.performanceIndex);
  }
  if (filters.maxImages != null) where.imageCount = { lte: filters.maxImages };
  if (filters.maxDescriptionChars != null) {
    where.descriptionLength = { lt: filters.maxDescriptionChars };
  }
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

/** Total matching the same filters as listProducts — drives the header count and paging. */
export async function countProducts(filters: ListProductsFilters = {}): Promise<number> {
  return prisma.product.count({ where: productWhere(filters) });
}

/**
 * How many products each performance segment would return under the other
 * active filters, for the segment pills. Four counts against id sets the
 * caller already computed; the performance filter itself is ignored so each
 * pill reads as "what you would get if you clicked this".
 */
export async function countProductsByPerformance(
  filters: ListProductsFilters,
  index: PerformanceIndex,
): Promise<Record<PerformanceSegment, number>> {
  const { performance: _ignored, ...rest } = filters;
  const counts = await Promise.all(
    PERFORMANCE_SEGMENTS.map((segment) =>
      prisma.product.count({
        where: productWhere({ ...rest, performance: segment, performanceIndex: index }),
      }),
    ),
  );
  return Object.fromEntries(
    PERFORMANCE_SEGMENTS.map((segment, i) => [segment, counts[i] ?? 0]),
  ) as Record<PerformanceSegment, number>;
}

/** How many products each quality filter would return, given the other active filters. */
export type ProductFilterCounts = {
  all: number;
  missingImage: number;
  needsReview: number;
};

/**
 * Counts for the quality filter pills.
 *
 * Each count honours the **other** active filters — search and division — but
 * not the quality filter itself, so the pills read as "what would I get if I
 * clicked this", not "what am I looking at now". One groupBy rather than three
 * counts: at 51,114 rows the difference is worth the small amount of mapping.
 */
export async function countProductsByQuality(
  filters: ListProductsFilters = {},
): Promise<ProductFilterCounts> {
  const { imageStatus: _ignored, ...rest } = filters;
  const grouped = await prisma.product.groupBy({
    by: ["imageStatus"],
    where: productWhere(rest),
    _count: { _all: true },
  });
  const by = new Map(grouped.map((row) => [row.imageStatus, row._count._all]));
  const all = grouped.reduce((sum, row) => sum + row._count._all, 0);
  return {
    all,
    missingImage: by.get("missing") ?? 0,
    needsReview: by.get("needs_review") ?? 0,
  };
}

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

/**
 * How many images the store lists for the product, from the synced
 * BigCommerce payload (2026-10-26). Zero when the payload has none or the
 * product was never synced from BigCommerce.
 */
export function storeImageCount(metadata: unknown): number {
  return storeImages(metadata).length;
}

/** The id of the image the store flags as the listing's main image, per the last sync. */
export function storeThumbnailImageId(metadata: unknown): number | null {
  const thumbnail = storeImages(metadata).find(
    (image) =>
      image &&
      typeof image === "object" &&
      (image as { is_thumbnail?: unknown }).is_thumbnail === true,
  ) as { id?: unknown } | undefined;
  return typeof thumbnail?.id === "number" ? thumbnail.id : null;
}

function storeImages(metadata: unknown): unknown[] {
  const raw =
    metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>).bcRaw : null;
  const images =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>).images : undefined;
  return Array.isArray(images) ? images : [];
}

/**
 * A cost only counts if it is strictly positive.
 *
 * Guards two distinct traps: a Prisma `Decimal` is an object and therefore
 * always truthy — `Decimal(0)` included — and a raw 0 is a real number that
 * would produce a 100% margin if treated as a known cost.
 */
const positiveOrNull = (d: Prisma.Decimal | null | undefined): number | null => {
  if (d == null) return null;
  const n = Number(d);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const numOrNull = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

const PRODUCT_LIST_INCLUDE = {
  store: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  variants: {
    select: { id: true, sku: true, price: true, costPrice: true, stockLevel: true },
  },
  supplierProducts: {
    where: { isPreferred: true },
    select: { id: true, cost: true, supplier: { select: { name: true, code: true } } },
    take: 1,
  },
} satisfies Prisma.ProductInclude;

type ProductListRecord = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>;

/**
 * The ids of every product that sold in the window, highest revenue first
 * (or lowest first for `asc`), ties broken by units then id so the order is
 * stable between requests. Products with no revenue are not listed: they
 * follow (or precede) this list in the default catalogue order.
 */
export function rankIdsByRevenue(stats: Map<string, ProductSales>, dir: SortDirection): string[] {
  const sold: { id: string; revenue: number; units: number }[] = [];
  for (const [id, sales] of stats) {
    if (sales.revenue90 > 0) sold.push({ id, revenue: sales.revenue90, units: sales.units90 });
  }
  sold.sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.id.localeCompare(b.id));
  const ids = sold.map((s) => s.id);
  return dir === "asc" ? ids.reverse() : ids;
}

/**
 * Revenue ordering across the whole matching set (2026-10-27). Descending
 * lists the products that sold, by revenue, then every other matching
 * product in the default order; ascending is the reverse. Only the ids of
 * the sellers are held in memory; the rest is paged in the database.
 */
async function listProductsByRevenue(
  where: Prisma.ProductWhereInput,
  index: PerformanceIndex,
  dir: SortDirection,
  page: number,
): Promise<ProductListRecord[]> {
  const ranked = rankIdsByRevenue(index.stats, dir);
  const soldMatching = await prisma.product.findMany({
    where: { AND: [where, { id: { in: ranked } }] },
    select: { id: true },
  });
  const matching = new Set(soldMatching.map((row) => row.id));
  const soldOrdered = ranked.filter((id) => matching.has(id));
  const unsoldWhere: Prisma.ProductWhereInput = { AND: [where, { id: { notIn: ranked } }] };
  const unsoldOrder = productOrderBy(undefined, "asc");

  const start = (page - 1) * PRODUCTS_PAGE_SIZE;
  const pageIds: string[] = [];
  if (dir === "desc") {
    pageIds.push(...soldOrdered.slice(start, start + PRODUCTS_PAGE_SIZE));
    if (pageIds.length < PRODUCTS_PAGE_SIZE) {
      const unsold = await prisma.product.findMany({
        where: unsoldWhere,
        orderBy: unsoldOrder,
        skip: Math.max(0, start - soldOrdered.length),
        take: PRODUCTS_PAGE_SIZE - pageIds.length,
        select: { id: true },
      });
      pageIds.push(...unsold.map((row) => row.id));
    }
  } else {
    const unsoldCount = await prisma.product.count({ where: unsoldWhere });
    if (start < unsoldCount) {
      const unsold = await prisma.product.findMany({
        where: unsoldWhere,
        orderBy: unsoldOrder,
        skip: start,
        take: Math.min(PRODUCTS_PAGE_SIZE, unsoldCount - start),
        select: { id: true },
      });
      pageIds.push(...unsold.map((row) => row.id));
    }
    if (pageIds.length < PRODUCTS_PAGE_SIZE) {
      const soldStart = Math.max(0, start - unsoldCount);
      pageIds.push(
        ...soldOrdered.slice(soldStart, soldStart + PRODUCTS_PAGE_SIZE - pageIds.length),
      );
    }
  }

  if (pageIds.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: pageIds } },
    include: PRODUCT_LIST_INCLUDE,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return pageIds.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

export async function listProducts(filters: ListProductsFilters = {}) {
  const where = productWhere(filters);
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const products =
    filters.sort === "revenue" && filters.performanceIndex
      ? await listProductsByRevenue(where, filters.performanceIndex, filters.dir ?? "desc", page)
      : await prisma.product.findMany({
          where,
          orderBy: productOrderBy(filters.sort, filters.dir ?? "asc"),
          skip: (page - 1) * PRODUCTS_PAGE_SIZE,
          take: PRODUCTS_PAGE_SIZE,
          include: PRODUCT_LIST_INCLUDE,
        });

  return products.map((p) => {
    // Aggregate price/cost from first variant (primary)
    const primary = p.variants[0];
    const price = primary ? num(primary.price) : 0;
    // A zero cost means "not known", never "free". BigCommerce leaves
    // cost_price at 0 when it is unpopulated — true of 50,024 of 50,053
    // variants in production — and the previous truthiness check treated a
    // Prisma Decimal(0), which is a truthy object, as a real cost of $0.00.
    // Every such product then reported a 100% margin (docs/35 F-16).
    //
    // This matches how the rest of the system already reads cost: `positive()`
    // in the pricing engine requires > 0, and the pricing upload parser
    // "treats a zero cost as absent, never as a zero floor".
    const cost =
      positiveOrNull(primary?.costPrice) ?? positiveOrNull(p.supplierProducts[0]?.cost) ?? null;
    const margin = cost != null && price > 0 ? (price - cost) / price : null;
    const stock = p.variants.reduce((sum, v) => sum + (v.stockLevel ?? 0), 0);

    return {
      imageCount: p.imageCount,
      descriptionLength: p.descriptionLength,
      id: p.id,
      name: p.name,
      sku: p.sku,
      brand: p.brand,
      status: p.status,
      imageStatus: p.imageStatus,
      descriptionStatus: p.descriptionStatus,
      isFeatured: p.isFeatured,
      isRockstarCandidate: p.isRockstarCandidate,
      store: p.store,
      category: p.category,
      variantCount: p.variants.length,
      primarySupplier: p.supplierProducts[0]?.supplier ?? null,
      price,
      cost,
      margin,
      stock,
    };
  });
}

export type ProductListRow = Awaited<ReturnType<typeof listProducts>>[number];

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      store: true,
      division: true,
      category: true,
      variants: { orderBy: { sku: "asc" } },
      supplierProducts: {
        include: { supplier: true },
        orderBy: [{ isPreferred: "desc" }, { cost: "asc" }],
      },
    },
  });
  if (!product) return null;

  // Sales metrics — last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const salesAgg = await prisma.orderItem.aggregate({
    where: {
      productId: id,
      order: { orderDate: { gte: ninetyDaysAgo }, status: { not: "cancelled" } },
    },
    _sum: { lineSubtotal: true, quantity: true, estimatedGrossProfit: true },
    _count: { _all: true },
  });

  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      price: num(v.price),
      salePrice: numOrNull(v.salePrice),
      costPrice: numOrNull(v.costPrice),
    })),
    supplierProducts: product.supplierProducts.map((sp) => ({
      ...sp,
      cost: num(sp.cost),
    })),
    sales90d: {
      revenue: num(salesAgg._sum.lineSubtotal),
      quantity: salesAgg._sum.quantity ?? 0,
      grossProfit: num(salesAgg._sum.estimatedGrossProfit),
      orderLines: salesAgg._count._all,
    },
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductById>>>;
