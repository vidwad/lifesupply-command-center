/**
 * Sales Intelligence — read-only sales statistics over already-synced data.
 *
 * WHAT THIS IS. A reusable query layer that answers "what sold, for how much,
 * at what margin" from `Order` and `OrderItem` rows that are already in the
 * Command Center. It is the shared foundation for Pricing Intelligence
 * candidate ranking, dashboard reporting, and future analytics, so those
 * consumers stop each re-deriving revenue and margin their own way.
 *
 * WHAT THIS IS NOT. It performs **no writes of any kind** and makes **no
 * outbound calls**. It does not import, backfill, sync, reprice, or touch a
 * feature flag. It cannot change a BigCommerce price because it never talks to
 * BigCommerce. `read-only.test.ts` asserts all of that against this source.
 *
 * READ `getSalesDataReadiness()` FIRST. In production today only **2.5%** of
 * orders carry line items, and only 21 line items resolve to a product. Every
 * per-product figure below is computed correctly over that data and is still
 * not yet a description of the business. The readiness report exists so a
 * caller can tell the difference, and callers should surface it rather than
 * presenting per-product statistics as complete. See `docs/36` §3.
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

import {
  EXCLUDED_STATUSES,
  GROSS_SALES_STATUSES,
  grossMargin,
  marginOpportunity,
  netSales,
  numOrZero,
  positiveOrNull,
  rangeDays,
  refundRate,
  salesVelocity,
  summariseRefunds,
  targetMarginFromMultiplier,
  type RefundBreakdown,
} from "./policy";

export * from "./policy";

/** Inclusive-start, exclusive-end window over `Order.orderDate`. */
export type SalesRange = { from: Date; to: Date };

export type SalesScope = {
  storeId?: string;
  divisionId?: string;
};

/** Convenience range: the N days ending now. */
export function lastNDays(days: number, now: Date): SalesRange {
  const to = now;
  const from = new Date(now.getTime() - Math.max(1, days) * 86_400_000);
  return { from, to };
}

/**
 * The order-level filter every query in this file shares.
 *
 * Centralised on purpose: if one query counted refunds and another did not,
 * two numbers on the same screen would disagree and neither would be wrong in
 * isolation.
 */
function orderFilter(range: SalesRange, scope: SalesScope = {}): Prisma.OrderWhereInput {
  // Order has no soft-delete column; status is the only exclusion axis.
  // Refunded orders ARE included — they are sales, deducted separately to
  // reach net (DEC-SI-01). Only cancelled orders are excluded outright.
  const where: Prisma.OrderWhereInput = {
    orderDate: { gte: range.from, lt: range.to },
    status: { in: GROSS_SALES_STATUSES },
  };
  if (scope.storeId) where.storeId = scope.storeId;
  if (scope.divisionId) where.divisionId = scope.divisionId;
  return where;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export type SalesOverview = {
  range: SalesRange;
  orderCount: number;
  /**
   * **Gross Sales** — billed `grandTotal` across every order that became a
   * sale, refunded ones included. Inclusive of tax and shipping. Independent
   * of line-item coverage, and therefore the most trustworthy figure here.
   */
  grossSales: number;
  /** Refunds deducted to reach net, with the measured/inferred split. */
  refunds: RefundBreakdown;
  /** **Net Sales** = grossSales − refunds.total. May be negative; see policy. */
  netSales: number;
  /** Refunds as a share of gross, 0–1. Null when gross was zero. */
  refundRate: number | null;
  /** Orders excluded outright as never-sales, reported so they are not simply invisible. */
  cancelled: { orderCount: number; value: number };
  /**
   * @deprecated Ambiguous once refunds are broken out. Equals `grossSales`;
   * read `grossSales` or `netSales` and say which you mean.
   */
  revenue: number;
  /**
   * Product revenue from order headers — `subtotal`, excluding tax and
   * shipping. This is the figure comparable to `lineRevenue`; `revenue` is not.
   */
  productRevenue: number;
  averageOrderValue: number | null;
  /** Line-item-derived. Only as complete as `lineItemCoverage`. */
  unitsSold: number;
  lineRevenue: number;
  /** Null when no line in range carried a usable cost. */
  grossProfit: number | null;
  grossMarginPct: number | null;
  /** Share of in-range orders that have at least one line item, 0–1. */
  lineItemCoverage: number;
  /** Share of in-range line revenue whose cost is known, 0–1. */
  costCoverage: number;
};

/**
 * Headline figures for a range.
 *
 * Order revenue comes from order headers and is trustworthy wherever orders
 * synced. Unit and margin figures come from line items and inherit their
 * coverage, which is why both coverage ratios are returned alongside rather
 * than left for the caller to discover.
 */
export async function getSalesOverview(
  range: SalesRange,
  scope: SalesScope = {},
): Promise<SalesOverview> {
  const where = orderFilter(range, scope);

  const [
    orderAgg,
    ordersWithItems,
    lineAgg,
    costedAgg,
    recordedAgg,
    inferredAgg,
    unquantifiedCount,
    cancelledAgg,
  ] = await Promise.all([
    prisma.order.aggregate({
      where,
      _count: { _all: true },
      _sum: { grandTotal: true, subtotal: true },
    }),
    prisma.order.count({ where: { ...where, items: { some: {} } } }),
    prisma.orderItem.aggregate({
      where: { order: where },
      _sum: { quantity: true, lineSubtotal: true },
    }),
    // Gross profit is only meaningful over lines whose cost is known, so the
    // costed subset is aggregated separately rather than treating a missing
    // cost as zero — which would report 100% margin on unpriced lines.
    prisma.orderItem.aggregate({
      where: { order: where, unitCost: { gt: 0 } },
      _sum: { lineSubtotal: true, estimatedGrossProfit: true },
    }),
    // Refunds, split by how the amount was established. A recorded
    // refundedTotal is trusted wherever present, including on orders whose
    // status is not `refunded` — that is what makes partial refunds work.
    prisma.order.aggregate({
      where: { ...where, refundedTotal: { gt: 0 } },
      _sum: { refundedTotal: true },
    }),
    // Refunded status with no recorded amount: inferred as a full refund of
    // the order. 98.2% of production refund value arrives this way.
    // `partially_refunded` payments are held back into the next aggregate —
    // inferring a full refund for a known-partial one overstates it.
    prisma.order.aggregate({
      where: {
        ...where,
        status: "refunded",
        refundedTotal: { lte: 0 },
        paymentStatus: { not: "partially_refunded" },
      },
      _sum: { grandTotal: true },
      _count: { _all: true },
    }),
    // Known partial, amount never recorded. Counted, never valued: both
    // guessing a full refund and treating it as zero would be wrong, so it is
    // surfaced as a stated limit on the refund total instead.
    prisma.order.count({
      where: {
        ...where,
        status: "refunded",
        refundedTotal: { lte: 0 },
        paymentStatus: "partially_refunded",
      },
    }),
    // Reported, not silently dropped — and never added to gross.
    prisma.order.aggregate({
      where: {
        orderDate: { gte: range.from, lt: range.to },
        status: { in: EXCLUDED_STATUSES },
        ...(scope.storeId ? { storeId: scope.storeId } : {}),
        ...(scope.divisionId ? { divisionId: scope.divisionId } : {}),
      },
      _count: { _all: true },
      _sum: { grandTotal: true },
    }),
  ]);

  const orderCount = orderAgg._count._all;
  const grossSales = numOrZero(orderAgg._sum.grandTotal);
  const productRevenue = numOrZero(orderAgg._sum.subtotal);
  const refunds = summariseRefunds({
    recorded: numOrZero(recordedAgg._sum.refundedTotal),
    inferred: numOrZero(inferredAgg._sum.grandTotal),
    inferredOrderCount: inferredAgg._count._all,
    unquantifiedOrderCount: unquantifiedCount,
  });
  const lineRevenue = numOrZero(lineAgg._sum.lineSubtotal);
  const costedRevenue = numOrZero(costedAgg._sum.lineSubtotal);
  const grossProfit = costedRevenue > 0 ? numOrZero(costedAgg._sum.estimatedGrossProfit) : null;

  return {
    range,
    orderCount,
    grossSales,
    refunds,
    netSales: netSales(grossSales, refunds.total),
    refundRate: refundRate(grossSales, refunds.total),
    cancelled: {
      orderCount: cancelledAgg._count._all,
      value: numOrZero(cancelledAgg._sum.grandTotal),
    },
    revenue: grossSales,
    productRevenue,
    // AOV is computed on gross: it describes the size of an order as placed.
    averageOrderValue: orderCount > 0 ? Math.round((grossSales / orderCount) * 100) / 100 : null,
    unitsSold: lineAgg._sum.quantity ?? 0,
    lineRevenue,
    grossProfit,
    grossMarginPct:
      grossProfit == null ? null : grossMargin(costedRevenue, costedRevenue - grossProfit),
    lineItemCoverage: orderCount > 0 ? ordersWithItems / orderCount : 0,
    costCoverage: lineRevenue > 0 ? costedRevenue / lineRevenue : 0,
  };
}

// ---------------------------------------------------------------------------
// Per-product statistics
// ---------------------------------------------------------------------------

export type ProductSalesStat = {
  productId: string;
  name: string;
  sku: string | null;
  storeName: string | null;
  unitsSold: number;
  revenue: number;
  /** Null when no line for this product carried a usable cost. */
  grossProfit: number | null;
  grossMarginPct: number | null;
  /** Units per 30 days across the range. */
  velocity: number | null;
  /** Revenue forgone against the Pricing Intelligence floor. Null when margin is unknown. */
  marginOpportunity: number | null;
  /** Share of this product's line revenue whose cost is known, 0–1. */
  costCoverage: number;
};

export type ProductSalesOptions = {
  limit?: number;
  sortBy?: "revenue" | "units" | "grossProfit" | "marginOpportunity" | "margin";
  /** Only products whose cost is known on at least one line. */
  requireCost?: boolean;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

/**
 * Per-product sales statistics for a range.
 *
 * **These figures are GROSS. There is no per-product net.** `OrderItem` carries
 * no refund column — refunds are recorded only at order level — so a refund
 * cannot be attributed to the line it reversed. Splitting an order-level refund
 * across its lines pro-rata would invent per-product detail the source system
 * never captured, and a partial refund is rarely pro-rata anyway: it is usually
 * one returned item out of several.
 *
 * So a product's revenue here includes sales later refunded. Use
 * `getSalesOverview()` for the gross → refunds → net picture at order level,
 * and treat product rankings as "what sold", not "what was kept".
 *
 * Only line items resolved to a `productId` are included — an unmatched line
 * cannot be attributed to a product without guessing, and guessing here would
 * silently mis-state a product's revenue. `getSalesDataReadiness()` reports how
 * many lines that excludes; today in production it is nearly all of them.
 */
export async function getProductSalesStats(
  range: SalesRange,
  scope: SalesScope = {},
  options: ProductSalesOptions = {},
): Promise<ProductSalesStat[]> {
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(options.limit ?? DEFAULT_LIMIT)));
  const where = orderFilter(range, scope);
  const targetMargin = await getTargetMargin();
  const days = rangeDays(range.from, range.to);

  const [rows, costedRows] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: where, productId: { not: null } },
      _sum: { quantity: true, lineSubtotal: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: where, productId: { not: null }, unitCost: { gt: 0 } },
      _sum: { lineSubtotal: true, estimatedGrossProfit: true },
    }),
  ]);

  const costed = new Map(
    costedRows.map((r) => [
      r.productId,
      {
        revenue: numOrZero(r._sum.lineSubtotal),
        profit: numOrZero(r._sum.estimatedGrossProfit),
      },
    ]),
  );

  const productIds = rows.map((r) => r.productId).filter((id): id is string => id != null);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, store: { select: { name: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const stats: ProductSalesStat[] = [];
  for (const row of rows) {
    const id = row.productId;
    if (id == null) continue;
    const product = byId.get(id);
    // A groupBy row with no surviving Product means the product was deleted
    // after the sale. Skipping keeps the output describable; the readiness
    // report counts these separately so they are not merely lost.
    if (!product) continue;

    const revenue = numOrZero(row._sum.lineSubtotal);
    const c = costed.get(id);
    const hasCost = c != null && c.revenue > 0;
    const margin = hasCost ? grossMargin(c.revenue, c.revenue - c.profit) : null;

    if (options.requireCost && !hasCost) continue;

    stats.push({
      productId: id,
      name: product.name,
      sku: product.sku,
      storeName: product.store?.name ?? null,
      unitsSold: row._sum.quantity ?? 0,
      revenue,
      grossProfit: hasCost ? c.profit : null,
      grossMarginPct: margin,
      velocity: salesVelocity(row._sum.quantity ?? 0, days),
      // Opportunity is scaled to the costed portion of revenue, not to total
      // revenue: extrapolating a known margin across uncosted lines would
      // invent a number.
      marginOpportunity: hasCost ? marginOpportunity(c.revenue, margin, targetMargin) : null,
      costCoverage: revenue > 0 && hasCost ? Math.min(1, c.revenue / revenue) : 0,
    });
  }

  return sortStats(stats, options.sortBy ?? "revenue").slice(0, limit);
}

function sortStats(
  stats: ProductSalesStat[],
  sortBy: NonNullable<ProductSalesOptions["sortBy"]>,
): ProductSalesStat[] {
  // Nulls always sort last: "unknown margin" must never masquerade as the
  // worst margin and head a remediation list.
  const cmp = (a: number | null, b: number | null): number => {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return b - a;
  };
  const sorted = [...stats];
  switch (sortBy) {
    case "units":
      sorted.sort((a, b) => b.unitsSold - a.unitsSold);
      break;
    case "grossProfit":
      sorted.sort((a, b) => cmp(a.grossProfit, b.grossProfit));
      break;
    case "marginOpportunity":
      sorted.sort((a, b) => cmp(a.marginOpportunity, b.marginOpportunity));
      break;
    case "margin":
      // Ascending — the point of sorting by margin is to find the worst.
      sorted.sort((a, b) => {
        if (a.grossMarginPct == null && b.grossMarginPct == null) return 0;
        if (a.grossMarginPct == null) return 1;
        if (b.grossMarginPct == null) return -1;
        return a.grossMarginPct - b.grossMarginPct;
      });
      break;
    default:
      sorted.sort((a, b) => b.revenue - a.revenue);
  }
  return sorted;
}

export async function getTopProductsByRevenue(
  range: SalesRange,
  scope: SalesScope = {},
  limit = 10,
): Promise<ProductSalesStat[]> {
  return getProductSalesStats(range, scope, { sortBy: "revenue", limit });
}

export async function getTopProductsByUnits(
  range: SalesRange,
  scope: SalesScope = {},
  limit = 10,
): Promise<ProductSalesStat[]> {
  return getProductSalesStats(range, scope, { sortBy: "units", limit });
}

/**
 * Products selling below the Pricing Intelligence margin floor.
 *
 * `requireCost` is forced on: a product whose cost is unknown cannot be shown
 * to be low-margin, and listing it as such would send someone to fix a number
 * that was never measured.
 */
export async function getLowMarginProducts(
  range: SalesRange,
  scope: SalesScope = {},
  limit = 25,
): Promise<ProductSalesStat[]> {
  const target = await getTargetMargin();
  const stats = await getProductSalesStats(range, scope, {
    sortBy: "margin",
    requireCost: true,
    limit: MAX_LIMIT,
  });
  return stats
    .filter((s) => s.grossMarginPct != null && (target == null || s.grossMarginPct < target))
    .slice(0, limit);
}

/** Products with the largest revenue shortfall against the floor margin. */
export async function getMarginOpportunityProducts(
  range: SalesRange,
  scope: SalesScope = {},
  limit = 25,
): Promise<ProductSalesStat[]> {
  const stats = await getProductSalesStats(range, scope, {
    sortBy: "marginOpportunity",
    requireCost: true,
    limit: MAX_LIMIT,
  });
  return stats.filter((s) => (s.marginOpportunity ?? 0) > 0).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Trend
// ---------------------------------------------------------------------------

export type TrendBucket = {
  periodStart: Date;
  unitsSold: number;
  revenue: number;
  grossProfit: number | null;
};

/**
 * Month-by-month history for one product.
 *
 * Bucketed in application code rather than SQL so the behaviour is identical
 * on every database and directly testable. The row volume per product is small
 * — this is not a whole-catalogue scan.
 */
export async function getProductTrend(
  productId: string,
  range: SalesRange,
  scope: SalesScope = {},
): Promise<TrendBucket[]> {
  const lines = await prisma.orderItem.findMany({
    where: { productId, order: orderFilter(range, scope) },
    select: {
      quantity: true,
      lineSubtotal: true,
      unitCost: true,
      estimatedGrossProfit: true,
      order: { select: { orderDate: true } },
    },
  });

  const buckets = new Map<string, TrendBucket & { costedSeen: boolean }>();
  for (const line of lines) {
    const date = line.order?.orderDate;
    if (!date) continue;
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const key = start.toISOString();
    const bucket = buckets.get(key) ?? {
      periodStart: start,
      unitsSold: 0,
      revenue: 0,
      grossProfit: null,
      costedSeen: false,
    };
    bucket.unitsSold += line.quantity;
    bucket.revenue += numOrZero(line.lineSubtotal);
    if (positiveOrNull(line.unitCost) != null) {
      bucket.grossProfit = (bucket.grossProfit ?? 0) + numOrZero(line.estimatedGrossProfit);
      bucket.costedSeen = true;
    }
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())
    .map(({ costedSeen: _costedSeen, ...bucket }) => bucket);
}

// ---------------------------------------------------------------------------
// Pricing Intelligence alignment
// ---------------------------------------------------------------------------

/**
 * The target margin, derived from the enabled pricing rule's floor multiplier.
 *
 * Read from the same `PricingRule` the engine uses so "low margin" here and
 * "below floor" there cannot drift apart. Null when no rule is enabled — in
 * which case margin opportunity is reported as null rather than assuming a
 * default the product owner never chose.
 */
export async function getTargetMargin(): Promise<number | null> {
  const rule = await prisma.pricingRule.findFirst({
    where: { enabled: true },
    orderBy: { createdAt: "asc" },
    select: { minCostMultiplier: true },
  });
  if (!rule) return null;
  return targetMarginFromMultiplier(Number(rule.minCostMultiplier));
}

// ---------------------------------------------------------------------------
// Readiness
// ---------------------------------------------------------------------------

export type SalesDataReadiness = {
  orderCount: number;
  orderItemCount: number;
  oldestOrderDate: Date | null;
  newestOrderDate: Date | null;
  oldestOrderWithItems: Date | null;
  stores: { id: string; name: string; orderCount: number }[];
  /** Orders carrying at least one line item. */
  ordersWithItems: number;
  lineItemCoverage: number;
  itemsWithoutProduct: number;
  itemsWithoutVariant: number;
  itemsWithoutCost: number;
  productsWithoutCostPrice: number;
  productsWithoutSourceId: number;
  variantsWithoutSourceId: number;
  /** Distinct products that have at least one attributable, costed sale. */
  rankableProducts: number;
  pricingRuleEnabled: boolean;
  verdict: ReadinessVerdict;
  blockers: string[];
};

export type ReadinessVerdict = "ready" | "partial" | "insufficient";

/** A product needs this many attributable costed sales before ranking means anything. */
export const MIN_RANKABLE_PRODUCTS = 50;
/** Below this share of orders carrying line items, per-product totals are not representative. */
export const MIN_LINE_ITEM_COVERAGE = 0.8;

/**
 * Answers: "do we have enough historical sales data to run pricing analytics?"
 *
 * Deliberately blunt. Every other function here will happily compute a
 * confident-looking number from three line items; this is the one that says so.
 */
export async function getSalesDataReadiness(scope: SalesScope = {}): Promise<SalesDataReadiness> {
  const orderScope: Prisma.OrderWhereInput = {};
  if (scope.storeId) orderScope.storeId = scope.storeId;
  if (scope.divisionId) orderScope.divisionId = scope.divisionId;

  const [
    orderCount,
    orderItemCount,
    oldest,
    newest,
    oldestWithItems,
    ordersWithItems,
    byStore,
    itemsWithoutProduct,
    itemsWithoutVariant,
    itemsWithoutCost,
    productsWithoutCostPrice,
    productsWithoutSourceId,
    variantsWithoutSourceId,
    rankableRows,
    enabledRule,
  ] = await Promise.all([
    prisma.order.count({ where: orderScope }),
    prisma.orderItem.count({ where: { order: orderScope } }),
    prisma.order.findFirst({
      where: orderScope,
      orderBy: { orderDate: "asc" },
      select: { orderDate: true },
    }),
    prisma.order.findFirst({
      where: orderScope,
      orderBy: { orderDate: "desc" },
      select: { orderDate: true },
    }),
    prisma.order.findFirst({
      where: { ...orderScope, items: { some: {} } },
      orderBy: { orderDate: "asc" },
      select: { orderDate: true },
    }),
    prisma.order.count({ where: { ...orderScope, items: { some: {} } } }),
    prisma.order.groupBy({ by: ["storeId"], where: orderScope, _count: { _all: true } }),
    prisma.orderItem.count({ where: { order: orderScope, productId: null } }),
    prisma.orderItem.count({ where: { order: orderScope, productVariantId: null } }),
    // A zero cost is an absent cost — see policy.positiveOrNull.
    prisma.orderItem.count({
      where: { order: orderScope, OR: [{ unitCost: null }, { unitCost: { lte: 0 } }] },
    }),
    prisma.productVariant.count({
      where: { OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
    }),
    prisma.product.count({ where: { deletedAt: null, sourceId: null } }),
    prisma.productVariant.count({ where: { sourceId: null } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: { ...orderScope, status: { notIn: EXCLUDED_STATUSES } },
        productId: { not: null },
        unitCost: { gt: 0 },
      },
    }),
    prisma.pricingRule.findFirst({ where: { enabled: true }, select: { id: true } }),
  ]);

  const storeIds = byStore.map((r) => r.storeId).filter((id): id is string => id != null);
  const storeRecords = await prisma.store.findMany({
    where: { id: { in: storeIds } },
    select: { id: true, name: true },
  });
  const storeNames = new Map(storeRecords.map((s) => [s.id, s.name]));

  const lineItemCoverage = orderCount > 0 ? ordersWithItems / orderCount : 0;
  const rankableProducts = rankableRows.length;

  const blockers: string[] = [];
  if (orderCount === 0) {
    blockers.push("No orders have been synced.");
  }
  if (orderItemCount === 0) {
    blockers.push(
      "No order line items exist. Every per-product statistic requires them; order headers alone cannot attribute revenue to a product.",
    );
  } else if (lineItemCoverage < MIN_LINE_ITEM_COVERAGE) {
    blockers.push(
      `Only ${(lineItemCoverage * 100).toFixed(1)}% of orders carry line items (${ordersWithItems.toLocaleString()} of ${orderCount.toLocaleString()}). Per-product totals describe that fraction, not the business.`,
    );
  }
  if (rankableProducts < MIN_RANKABLE_PRODUCTS) {
    blockers.push(
      `Only ${rankableProducts} product(s) have an attributable, costed sale — fewer than the ${MIN_RANKABLE_PRODUCTS} needed before ranking is meaningful.`,
    );
  }
  if (orderItemCount > 0 && itemsWithoutProduct / orderItemCount > 0.5) {
    blockers.push(
      `${itemsWithoutProduct.toLocaleString()} of ${orderItemCount.toLocaleString()} line items are not matched to a product, so their revenue cannot be attributed.`,
    );
  }
  if (orderItemCount > 0 && itemsWithoutCost / orderItemCount > 0.5) {
    blockers.push(
      `${itemsWithoutCost.toLocaleString()} of ${orderItemCount.toLocaleString()} line items have no usable cost, so gross profit and margin cannot be stated for them.`,
    );
  }
  if (!enabledRule) {
    blockers.push(
      "No enabled PricingRule, so there is no margin floor to measure opportunity against.",
    );
  }

  const verdict: ReadinessVerdict =
    blockers.length === 0 ? "ready" : rankableProducts > 0 ? "partial" : "insufficient";

  return {
    orderCount,
    orderItemCount,
    oldestOrderDate: oldest?.orderDate ?? null,
    newestOrderDate: newest?.orderDate ?? null,
    oldestOrderWithItems: oldestWithItems?.orderDate ?? null,
    stores: byStore
      .filter((r) => r.storeId != null)
      .map((r) => ({
        id: r.storeId as string,
        name: storeNames.get(r.storeId as string) ?? "(unknown store)",
        orderCount: r._count._all,
      }))
      .sort((a, b) => b.orderCount - a.orderCount),
    ordersWithItems,
    lineItemCoverage,
    itemsWithoutProduct,
    itemsWithoutVariant,
    itemsWithoutCost,
    productsWithoutCostPrice,
    productsWithoutSourceId,
    variantsWithoutSourceId,
    rankableProducts,
    pricingRuleEnabled: enabledRule != null,
    verdict,
    blockers,
  };
}
