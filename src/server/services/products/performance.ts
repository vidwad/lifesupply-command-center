/**
 * Product performance segments (product owner, 2026-10-26).
 *
 * Close equivalents of BigCommerce Insights' sales segments, computed from
 * the order line items the sync already holds, with the windows stated so a
 * reader knows exactly what each word means here. BigCommerce does not
 * publish its own formulas, so these are not the same numbers.
 *
 * Only sales-based segments live here. "Most abandoned" and "products to
 * improve" compare views and carts against purchases, which needs the GA4
 * item-level report; that is phase two.
 *
 * Cancelled and refunded orders are excluded throughout.
 */
import { createTtlCache } from "@/server/cache/ttl-cache";
import { prisma } from "@/server/db/client";
import { logger } from "@/server/logger";

export const WINDOW_DAYS = 90;
export const RECENT_DAYS = 30;
/**
 * How many products count as top sellers unless the reader chooses another
 * number on the list (product owner, 2026-10-28: 200 rather than 50, and an
 * input). The ceiling keeps a hand-edited URL from asking for the whole
 * catalogue under the name "top".
 */
export const TOP_SELLER_DEFAULT = 200;
export const TOP_SELLER_MAX = 5000;
/** A product needs this many units in the recent window before it is "promising". */
export const PROMISING_MIN_UNITS = 2;
/**
 * How long one load of the sales figures serves every reader in the process
 * (2026-10-30). The figures change only when orders sync, and loading them
 * reads the whole order history from disk on the production database.
 */
export const PRODUCT_SALES_TTL_MS = 10 * 60_000;

export const PERFORMANCE_SEGMENTS = ["top", "promising", "cold", "non_seller"] as const;
export type PerformanceSegment = (typeof PERFORMANCE_SEGMENTS)[number];

export function parsePerformanceSegment(value: string | undefined): PerformanceSegment | undefined {
  return PERFORMANCE_SEGMENTS.includes(value as PerformanceSegment)
    ? (value as PerformanceSegment)
    : undefined;
}

/**
 * The top-seller count a reader asked for. Anything that is not a whole
 * number from 1 up is the default; larger numbers are held to the ceiling.
 */
export function parseTopSellerLimit(value: string | undefined): number {
  if (value == null) return TOP_SELLER_DEFAULT;
  const trimmed = value.trim();
  if (!/^\d{1,9}$/.test(trimmed)) return TOP_SELLER_DEFAULT;
  const parsed = Number.parseInt(trimmed, 10);
  if (parsed < 1) return TOP_SELLER_DEFAULT;
  return Math.min(parsed, TOP_SELLER_MAX);
}

export type PerformanceDefinitions = Record<
  PerformanceSegment,
  { label: string; definition: string }
>;

/** Labels and plain-language definitions, shown beside the filters. */
export function performanceDefinitions(topLimit = TOP_SELLER_DEFAULT): PerformanceDefinitions {
  return {
    top: {
      label: "Top sellers",
      definition: `The ${topLimit} products with the most revenue in the last ${WINDOW_DAYS} days.`,
    },
    promising: {
      label: "Promising",
      definition: `Sold at least ${PROMISING_MIN_UNITS} units in the last ${RECENT_DAYS} days and more than in the ${RECENT_DAYS} days before, or all of its sales are that recent.`,
    },
    cold: {
      label: "Cold",
      definition: `Has sold before but nothing in the last ${WINDOW_DAYS} days.`,
    },
    non_seller: {
      label: "Non-sellers",
      definition: "Has never sold.",
    },
  };
}

/** The definitions at the default top-seller count. */
export const PERFORMANCE_DEFINITIONS: PerformanceDefinitions = performanceDefinitions();

export type ProductSales = {
  unitsLifetime: number;
  units90: number;
  revenue90: number;
  units30: number;
  unitsPrior30: number;
};

export type PerformanceIndex = {
  /** Sales by product id, for every product that has ever sold. */
  stats: Map<string, ProductSales>;
  /** The top sellers, highest revenue first, at most `topLimit` of them. */
  topIds: string[];
  /** How many products were allowed into `topIds`. */
  topLimit: number;
  promisingIds: string[];
  coldIds: string[];
  /** Every product that has ever sold; non-sellers are the complement. */
  soldIds: string[];
  computedAt: Date;
};

const num = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Pure classification over the per-product figures. */
export function classifyProducts(
  stats: Map<string, ProductSales>,
  now: Date,
  topLimit = TOP_SELLER_DEFAULT,
): PerformanceIndex {
  const soldIds: string[] = [];
  const promisingIds: string[] = [];
  const coldIds: string[] = [];
  const sellers90: { id: string; revenue: number; units: number }[] = [];
  for (const [id, sales] of stats) {
    if (sales.unitsLifetime <= 0) continue;
    soldIds.push(id);
    if (sales.units90 > 0) sellers90.push({ id, revenue: sales.revenue90, units: sales.units90 });
    else coldIds.push(id);
    const allRecent = sales.unitsPrior30 === 0 && sales.units30 === sales.unitsLifetime;
    if (sales.units30 >= PROMISING_MIN_UNITS && (sales.units30 > sales.unitsPrior30 || allRecent)) {
      promisingIds.push(id);
    }
  }
  sellers90.sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.id.localeCompare(b.id));
  return {
    stats,
    topIds: sellers90.slice(0, topLimit).map((row) => row.id),
    topLimit,
    promisingIds,
    coldIds,
    soldIds,
    computedAt: now,
  };
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

type SalesRow = {
  productId: string;
  unitsLifetime: number;
  units90: number;
  revenue90: number;
  units30: number;
  unitsPrior30: number;
};

/**
 * One pass over the sold order lines, grouped by product, with each window
 * summed as a filtered aggregate. One query where there were four: on the
 * production database each of them read the whole order_items and orders
 * tables from disk, about ten seconds apiece, so the number of queries set
 * the cost, not their shape. Sums are cast to float8 so they arrive as
 * numbers.
 */
export async function loadProductSales(now = new Date()): Promise<Map<string, ProductSales>> {
  const windowStart = daysAgo(now, WINDOW_DAYS);
  const recentStart = daysAgo(now, RECENT_DAYS);
  const priorStart = daysAgo(now, RECENT_DAYS * 2);
  const rows = await prisma.$queryRaw<SalesRow[]>`
    SELECT
      oi."productId" AS "productId",
      coalesce(sum(oi."quantity"), 0)::float8 AS "unitsLifetime",
      coalesce(sum(oi."quantity") FILTER (WHERE o."orderDate" >= ${windowStart}), 0)::float8 AS "units90",
      coalesce(sum(oi."lineSubtotal") FILTER (WHERE o."orderDate" >= ${windowStart}), 0)::float8 AS "revenue90",
      coalesce(sum(oi."quantity") FILTER (WHERE o."orderDate" >= ${recentStart}), 0)::float8 AS "units30",
      coalesce(sum(oi."quantity") FILTER (WHERE o."orderDate" >= ${priorStart} AND o."orderDate" < ${recentStart}), 0)::float8 AS "unitsPrior30"
    FROM "order_items" oi
    JOIN "orders" o ON o."id" = oi."orderId"
    WHERE oi."productId" IS NOT NULL
      AND o."status" NOT IN ('cancelled', 'refunded')
    GROUP BY oi."productId"
  `;
  const stats = new Map<string, ProductSales>();
  for (const row of rows) {
    stats.set(row.productId, {
      unitsLifetime: num(row.unitsLifetime),
      units90: num(row.units90),
      revenue90: num(row.revenue90),
      units30: num(row.units30),
      unitsPrior30: num(row.unitsPrior30),
    });
  }
  return stats;
}

// One load serves every reader for ten minutes; past that the last figures
// are shown while the next load runs, so no reader waits for the database.
const salesCache = createTtlCache<Map<string, ProductSales>>(PRODUCT_SALES_TTL_MS, {
  staleWhileRevalidate: true,
});

/** The sales figures every reader shares. */
export function getProductSales(): Promise<Map<string, ProductSales>> {
  return salesCache.get(() => loadProductSales());
}

/** Drops the shared figures so the next reader loads them anew. */
export function invalidateProductSales(): void {
  salesCache.clear();
}

/**
 * Loads the figures ahead of the first reader, at process start, so the
 * first products list of the day does not wait on them. Never throws: a
 * database that is not ready yet is logged, and the first reader loads.
 */
export async function warmProductSales(): Promise<void> {
  try {
    const stats = await getProductSales();
    logger.info({ products: stats.size }, "product sales figures warmed");
  } catch (err) {
    logger.warn({ err }, "product sales figures could not be warmed");
  }
}

/**
 * Classifies the shared figures. Cheap once they are loaded, so a different
 * top-seller count costs nothing more than the classification.
 */
export async function buildPerformanceIndex(
  now = new Date(),
  topLimit = TOP_SELLER_DEFAULT,
): Promise<PerformanceIndex> {
  return classifyProducts(await getProductSales(), now, topLimit);
}

/** The id constraint a segment adds to the product query. */
export function segmentIdFilter(
  segment: PerformanceSegment,
  index: PerformanceIndex,
): { in: string[] } | { notIn: string[] } {
  switch (segment) {
    case "top":
      return { in: index.topIds };
    case "promising":
      return { in: index.promisingIds };
    case "cold":
      return { in: index.coldIds };
    case "non_seller":
      return { notIn: index.soldIds };
  }
}
