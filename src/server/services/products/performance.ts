/**
 * Product performance segments (product owner, 2026-10-26).
 *
 * Close equivalents of BigCommerce Insights' sales segments, computed from
 * the order line items the sync already holds, with the range stated so a
 * reader knows exactly what each word means here. BigCommerce does not
 * publish its own formulas, so these are not the same numbers.
 *
 * The range is the reader's choice (product owner, 2026-10-30): the last 30,
 * 60 or 90 days, the last 6 months, the last year, or any start and end
 * date. Every segment, column and count on the list reads that one range.
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

/**
 * How many products count as top sellers unless the reader chooses another
 * number on the list (product owner, 2026-10-28: 200 rather than 50, and an
 * input). The ceiling keeps a hand-edited URL from asking for the whole
 * catalogue under the name "top".
 */
export const TOP_SELLER_DEFAULT = 200;
export const TOP_SELLER_MAX = 5000;
/** A product needs this many units in the recent half of the range before it is "promising". */
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

// -----------------------------------------------------------------------------
// The range
// -----------------------------------------------------------------------------

export const RANGE_PRESETS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "60d", label: "Last 60 days", days: 60 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "6m", label: "Last 6 months", months: 6 },
  { key: "1y", label: "Last year", months: 12 },
] as const;
export type RangePresetKey = (typeof RANGE_PRESETS)[number]["key"];
export const DEFAULT_RANGE_KEY: RangePresetKey = "90d";

/**
 * A span of whole days in UTC. `start` is the first day and `end` the day
 * after the last, so a line counts when `start <= orderDate < end`.
 */
export type PerformanceRange = {
  key: RangePresetKey | "custom";
  start: Date;
  end: Date;
  /** The first and last day as YYYY-MM-DD, for the date inputs and the address. */
  from: string;
  to: string;
  days: number;
  /** Fits after "in": "the last 90 days", "Jan 1, 2026 to Mar 31, 2026". */
  description: string;
  /** Fits in a column header: "90d", "6m", "custom". */
  short: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const utcDay = (date: Date): number => Math.floor(date.getTime() / DAY_MS);
const dayToDate = (day: number): Date => new Date(day * DAY_MS);
const isoDay = (day: number): string => dayToDate(day).toISOString().slice(0, 10);
const longDay = (day: number): string =>
  dayToDate(day).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** A strict YYYY-MM-DD, as a UTC day number; anything else is null. */
export function parseIsoDay(value: string | undefined): number | null {
  if (value == null) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== `${y}-${m}-${d}`) {
    return null;
  }
  return utcDay(date);
}

function rangeFromDays(
  key: PerformanceRange["key"],
  startDay: number,
  endDay: number,
  description: string,
  short: string,
): PerformanceRange {
  return {
    key,
    start: dayToDate(startDay),
    end: dayToDate(endDay),
    from: isoDay(startDay),
    to: isoDay(endDay - 1),
    days: endDay - startDay,
    description,
    short,
  };
}

/** A preset ending today (UTC), today included. */
export function presetRange(key: RangePresetKey, today = new Date()): PerformanceRange {
  const preset = RANGE_PRESETS.find((p) => p.key === key) ?? RANGE_PRESETS[2];
  const endDay = utcDay(today) + 1;
  let startDay: number;
  if ("days" in preset) {
    startDay = endDay - preset.days;
  } else {
    const first = dayToDate(endDay);
    startDay = utcDay(
      new Date(
        Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - preset.months, first.getUTCDate()),
      ),
    );
  }
  return rangeFromDays(
    preset.key,
    startDay,
    endDay,
    `the ${preset.label.toLowerCase()}`,
    preset.key,
  );
}

/** Any start and end date, both included; the end may not precede the start. */
export function customRange(fromDay: number, toDay: number): PerformanceRange {
  return rangeFromDays(
    "custom",
    fromDay,
    toDay + 1,
    `${longDay(fromDay)} to ${longDay(toDay)}`,
    "custom",
  );
}

/**
 * The range a reader asked for. Dates win: a valid start date makes a custom
 * range to the end date, or to today without one. Otherwise a preset key, or
 * the default. An end before the start, or a start after today, is ignored.
 */
export function parsePerformanceRange(
  params: { range?: string; from?: string; to?: string },
  today = new Date(),
): PerformanceRange {
  const fromDay = parseIsoDay(params.from);
  if (fromDay != null) {
    const toDay =
      params.to == null || params.to.trim() === "" ? utcDay(today) : parseIsoDay(params.to);
    if (toDay != null && toDay >= fromDay) return customRange(fromDay, toDay);
  }
  const preset = RANGE_PRESETS.find((p) => p.key === params.range);
  return presetRange(preset?.key ?? DEFAULT_RANGE_KEY, today);
}

/**
 * What the list's links and form carry for a range: nothing for the default
 * preset, so ordinary addresses stay short; the key for another preset; the
 * two dates for a custom range.
 */
export function rangeSearchParams(range: PerformanceRange): {
  range?: string;
  from?: string;
  to?: string;
} {
  if (range.key === "custom") return { from: range.from, to: range.to };
  if (range.key === DEFAULT_RANGE_KEY) return {};
  return { range: range.key };
}

// -----------------------------------------------------------------------------
// Definitions
// -----------------------------------------------------------------------------

export type PerformanceDefinitions = Record<
  PerformanceSegment,
  { label: string; definition: string }
>;

/** Labels and plain-language definitions, shown beside the filters. */
export function performanceDefinitions(
  topLimit = TOP_SELLER_DEFAULT,
  range: PerformanceRange = presetRange(DEFAULT_RANGE_KEY),
): PerformanceDefinitions {
  return {
    top: {
      label: "Top sellers",
      definition: `The ${topLimit} products with the most revenue in ${range.description}.`,
    },
    promising: {
      label: "Promising",
      definition: `Sold at least ${PROMISING_MIN_UNITS} units in the second half of ${range.description} and more than in the first half, or all of its sales ever fall in that second half.`,
    },
    cold: {
      label: "Cold",
      definition: `Has sold at some time but nothing in ${range.description}.`,
    },
    non_seller: {
      label: "Non-sellers",
      definition: "Has never sold.",
    },
  };
}

/** The definitions at the default top-seller count and range. */
export const PERFORMANCE_DEFINITIONS: PerformanceDefinitions = performanceDefinitions();

// -----------------------------------------------------------------------------
// Figures
// -----------------------------------------------------------------------------

/** A product's sales for one range. */
export type ProductSales = {
  /** Units ever sold, any date. */
  unitsLifetime: number;
  unitsRange: number;
  revenueRange: number;
  /** Units in the second half of the range. */
  unitsRecent: number;
  /** Units in the first half of the range. */
  unitsEarlier: number;
};

/**
 * A product's sold units and revenue by day (UTC day numbers, ascending).
 * Any range is a sum over this, so one load answers every range.
 */
export type ProductDaySeries = {
  days: number[];
  units: number[];
  revenue: number[];
  unitsLifetime: number;
};

export type ProductSalesSeries = Map<string, ProductDaySeries>;

export type PerformanceIndex = {
  range: PerformanceRange;
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

/** Pure. Sums each product's days into the range, split at its midpoint. */
export function salesInRange(
  series: ProductSalesSeries,
  range: PerformanceRange,
): Map<string, ProductSales> {
  const startDay = utcDay(range.start);
  const endDay = utcDay(range.end);
  const midDay = endDay - Math.ceil(range.days / 2);
  const stats = new Map<string, ProductSales>();
  for (const [id, product] of series) {
    let unitsRange = 0;
    let revenueRange = 0;
    let unitsRecent = 0;
    let unitsEarlier = 0;
    for (let i = 0; i < product.days.length; i += 1) {
      const day = product.days[i]!;
      if (day < startDay || day >= endDay) continue;
      const units = product.units[i]!;
      unitsRange += units;
      revenueRange += product.revenue[i]!;
      if (day >= midDay) unitsRecent += units;
      else unitsEarlier += units;
    }
    stats.set(id, {
      unitsLifetime: product.unitsLifetime,
      unitsRange,
      revenueRange,
      unitsRecent,
      unitsEarlier,
    });
  }
  return stats;
}

/** Pure classification over the per-product figures for a range. */
export function classifyProducts(
  stats: Map<string, ProductSales>,
  range: PerformanceRange,
  topLimit = TOP_SELLER_DEFAULT,
  now = new Date(),
): PerformanceIndex {
  const soldIds: string[] = [];
  const promisingIds: string[] = [];
  const coldIds: string[] = [];
  const sellers: { id: string; revenue: number; units: number }[] = [];
  for (const [id, sales] of stats) {
    if (sales.unitsLifetime <= 0) continue;
    soldIds.push(id);
    if (sales.unitsRange > 0) {
      sellers.push({ id, revenue: sales.revenueRange, units: sales.unitsRange });
    } else {
      coldIds.push(id);
    }
    const allRecent = sales.unitsEarlier === 0 && sales.unitsRecent === sales.unitsLifetime;
    if (
      sales.unitsRecent >= PROMISING_MIN_UNITS &&
      (sales.unitsRecent > sales.unitsEarlier || allRecent)
    ) {
      promisingIds.push(id);
    }
  }
  sellers.sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.id.localeCompare(b.id));
  return {
    range,
    stats,
    topIds: sellers.slice(0, topLimit).map((row) => row.id),
    topLimit,
    promisingIds,
    coldIds,
    soldIds,
    computedAt: now,
  };
}

type SeriesRow = { productId: string; day: number; units: number; revenue: number };

/**
 * One pass over the sold order lines, grouped by product and day. On the
 * production database this reads the whole order_items and orders tables
 * from disk, about ten seconds, so it runs once and is shared (below), and
 * every range is then a sum in memory. Sums are cast to float8 so they
 * arrive as numbers; the day is a count of days since 1970-01-01.
 */
export async function loadProductSalesSeries(): Promise<ProductSalesSeries> {
  const rows = await prisma.$queryRaw<SeriesRow[]>`
    SELECT
      oi."productId" AS "productId",
      (o."orderDate"::date - DATE '1970-01-01')::int AS "day",
      coalesce(sum(oi."quantity"), 0)::float8 AS "units",
      coalesce(sum(oi."lineSubtotal"), 0)::float8 AS "revenue"
    FROM "order_items" oi
    JOIN "orders" o ON o."id" = oi."orderId"
    WHERE oi."productId" IS NOT NULL
      AND o."status" NOT IN ('cancelled', 'refunded')
    GROUP BY 1, 2
    ORDER BY 1, 2
  `;
  const series: ProductSalesSeries = new Map();
  for (const row of rows) {
    let product = series.get(row.productId);
    if (!product) {
      product = { days: [], units: [], revenue: [], unitsLifetime: 0 };
      series.set(row.productId, product);
    }
    const units = num(row.units);
    product.days.push(num(row.day));
    product.units.push(units);
    product.revenue.push(num(row.revenue));
    product.unitsLifetime += units;
  }
  return series;
}

// One load serves every reader for ten minutes; past that the last figures
// are shown while the next load runs, so no reader waits for the database.
const seriesCache = createTtlCache<ProductSalesSeries>(PRODUCT_SALES_TTL_MS, {
  staleWhileRevalidate: true,
});

/** The sales figures every reader shares. */
export function getProductSalesSeries(): Promise<ProductSalesSeries> {
  return seriesCache.get(loadProductSalesSeries);
}

/** Drops the shared figures so the next reader loads them anew. */
export function invalidateProductSales(): void {
  seriesCache.clear();
}

/**
 * Loads the figures ahead of the first reader, at process start, so the
 * first products list of the day does not wait on them. Never throws: a
 * database that is not ready yet is logged, and the first reader loads.
 */
export async function warmProductSales(): Promise<void> {
  try {
    const series = await getProductSalesSeries();
    logger.info({ products: series.size }, "product sales figures warmed");
  } catch (err) {
    logger.warn({ err }, "product sales figures could not be warmed");
  }
}

/**
 * The index for a range and top-seller count. Cheap once the figures are
 * loaded: a sum over about 70,000 product-days and a sort of the sellers.
 */
export async function buildPerformanceIndex(
  range: PerformanceRange,
  topLimit = TOP_SELLER_DEFAULT,
): Promise<PerformanceIndex> {
  return classifyProducts(salesInRange(await getProductSalesSeries(), range), range, topLimit);
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
