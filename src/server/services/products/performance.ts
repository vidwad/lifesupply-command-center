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
import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export const WINDOW_DAYS = 90;
export const RECENT_DAYS = 30;
export const TOP_SELLER_LIMIT = 50;
/** A product needs this many units in the recent window before it is "promising". */
export const PROMISING_MIN_UNITS = 2;

export const PERFORMANCE_SEGMENTS = ["top", "promising", "cold", "non_seller"] as const;
export type PerformanceSegment = (typeof PERFORMANCE_SEGMENTS)[number];

export function parsePerformanceSegment(value: string | undefined): PerformanceSegment | undefined {
  return PERFORMANCE_SEGMENTS.includes(value as PerformanceSegment)
    ? (value as PerformanceSegment)
    : undefined;
}

/** Labels and plain-language definitions, shown beside the filters. */
export const PERFORMANCE_DEFINITIONS: Record<
  PerformanceSegment,
  { label: string; definition: string }
> = {
  top: {
    label: "Top sellers",
    definition: `The ${TOP_SELLER_LIMIT} products with the most revenue in the last ${WINDOW_DAYS} days.`,
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
  topIds: string[];
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
export function classifyProducts(stats: Map<string, ProductSales>, now: Date): PerformanceIndex {
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
    topIds: sellers90.slice(0, TOP_SELLER_LIMIT).map((row) => row.id),
    promisingIds,
    coldIds,
    soldIds,
    computedAt: now,
  };
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

const SOLD_ORDER: Prisma.OrderWhereInput = { status: { notIn: ["cancelled", "refunded"] } };

// The return type is left to inference: Prisma's groupBy is typed through
// overloads, and an explicit annotation breaks their resolution.
async function sumByProduct(orderWhere: Prisma.OrderWhereInput) {
  return prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null }, order: { ...SOLD_ORDER, ...orderWhere } },
    _sum: { quantity: true, lineSubtotal: true },
  });
}

/**
 * Loads the figures and classifies them. Four aggregate queries, grouped by
 * product in the database, so the cost does not grow with the page size.
 */
export async function buildPerformanceIndex(now = new Date()): Promise<PerformanceIndex> {
  const [lifetime, window, recent, prior] = await Promise.all([
    sumByProduct({}),
    sumByProduct({ orderDate: { gte: daysAgo(now, WINDOW_DAYS) } }),
    sumByProduct({ orderDate: { gte: daysAgo(now, RECENT_DAYS) } }),
    sumByProduct({
      orderDate: { gte: daysAgo(now, RECENT_DAYS * 2), lt: daysAgo(now, RECENT_DAYS) },
    }),
  ]);
  const stats = new Map<string, ProductSales>();
  const entry = (id: string): ProductSales => {
    let current = stats.get(id);
    if (!current) {
      current = { unitsLifetime: 0, units90: 0, revenue90: 0, units30: 0, unitsPrior30: 0 };
      stats.set(id, current);
    }
    return current;
  };
  for (const row of lifetime)
    if (row.productId) entry(row.productId).unitsLifetime = num(row._sum?.quantity);
  for (const row of window) {
    if (!row.productId) continue;
    const e = entry(row.productId);
    e.units90 = num(row._sum?.quantity);
    e.revenue90 = num(row._sum?.lineSubtotal);
  }
  for (const row of recent)
    if (row.productId) entry(row.productId).units30 = num(row._sum?.quantity);
  for (const row of prior)
    if (row.productId) entry(row.productId).unitsPrior30 = num(row._sum?.quantity);
  return classifyProducts(stats, now);
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
