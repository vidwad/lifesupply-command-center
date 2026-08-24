/**
 * Sales Intelligence — the counting rules, isolated and pure.
 *
 * Every judgement about *what counts as a sale* lives here rather than being
 * spread across query builders, so the rules can be unit-tested without a
 * database and so a reader can find them in one place. `docs/36` §7 documents
 * each one and why it was chosen.
 *
 * Nothing in this file touches Prisma, BigCommerce, feature flags, or any
 * write path.
 */
import { OrderStatus } from "@prisma/client";

/**
 * Statuses whose revenue counts.
 *
 * `cancelled` and `refunded` are excluded: neither represents realised
 * revenue, and including them overstates both revenue and units. Every other
 * status — including the in-flight ones — is counted, because the order was
 * placed and the money is expected.
 *
 * NOTE — this differs from the Executive Dashboard, which excludes only
 * `cancelled` and therefore counts the 9,375 refunded orders in production as
 * revenue. That inconsistency is recorded in `docs/36` §7.1 as a finding, not
 * silently reconciled here: changing the dashboard's headline revenue figure
 * is a product-owner decision, not a side effect of adding a new service.
 */
export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.received,
  OrderStatus.processing,
  OrderStatus.awaiting_supplier,
  OrderStatus.in_supplier_queue,
  OrderStatus.awaiting_human_review,
  OrderStatus.shipped,
  OrderStatus.delivered,
  OrderStatus.completed,
];

/** Statuses deliberately excluded from every revenue and unit figure. */
export const EXCLUDED_STATUSES: OrderStatus[] = [OrderStatus.cancelled, OrderStatus.refunded];

/**
 * A money value only counts when it is strictly positive.
 *
 * Two traps in one guard. A Prisma `Decimal` is an object, so `Decimal(0)` is
 * truthy and a naive `value ? … : …` treats an unpopulated cost as a real cost
 * of zero — which is how the products list came to report a 100% margin on
 * 50,024 variants (`docs/35` F-16). And a raw `0` cost, if believed, yields a
 * 100% margin from arithmetic that is working perfectly on a number that means
 * "we don't know".
 *
 * In this codebase a zero cost always means *unknown*, never *free*: the
 * pricing engine's `positive()` requires `> 0`, and the pricing upload parser
 * "treats a zero cost as absent, never as a zero floor". This matches them.
 */
export function positiveOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Non-negative numeric coercion for values that may legitimately be zero (revenue, units). */
export function numOrZero(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Gross margin as a fraction of revenue, or null when it cannot be stated.
 *
 * Returns null rather than 0 when cost is unknown. A missing margin and a zero
 * margin are different facts, and collapsing them produces confident-looking
 * nonsense — the caller must be able to tell "we don't know" from "it's thin".
 */
export function grossMargin(revenue: number, cost: number | null): number | null {
  if (cost == null) return null;
  if (!Number.isFinite(revenue) || revenue <= 0) return null;
  return (revenue - cost) / revenue;
}

/**
 * The margin a product would earn priced exactly at the Pricing Intelligence
 * floor, expressed as a fraction of revenue.
 *
 * The floor is `cost × minCostMultiplier` (`list-builder.floorPrice`), so at
 * the floor: margin = (m·c − c) / (m·c) = (m − 1) / m. With the shipped
 * default of 1.40 that is 28.57%.
 *
 * Deriving it from the same multiplier the engine uses — rather than hardcoding
 * a target — is what keeps "margin opportunity" here and "below floor" there
 * describing the same thing.
 */
export function targetMarginFromMultiplier(minCostMultiplier: number): number | null {
  if (!Number.isFinite(minCostMultiplier) || minCostMultiplier <= 1) return null;
  return (minCostMultiplier - 1) / minCostMultiplier;
}

/**
 * Revenue that would have been earned had the product hit the target margin.
 *
 * Zero when the product already meets or beats the target — an opportunity is
 * a shortfall, never a surplus, and letting it go negative would let strong
 * products cancel out weak ones in any total.
 */
export function marginOpportunity(
  revenue: number,
  actualMargin: number | null,
  targetMargin: number | null,
): number | null {
  if (actualMargin == null || targetMargin == null) return null;
  if (!Number.isFinite(revenue) || revenue <= 0) return null;
  const shortfall = targetMargin - actualMargin;
  if (shortfall <= 0) return 0;
  return Math.round(revenue * shortfall * 100) / 100;
}

/** Units sold per 30 days over the observed window. */
export function salesVelocity(units: number, rangeDays: number): number | null {
  if (!Number.isFinite(rangeDays) || rangeDays <= 0) return null;
  if (!Number.isFinite(units) || units < 0) return null;
  return Math.round((units / rangeDays) * 30 * 100) / 100;
}

/** Whole days spanned by a range, minimum 1 so a single-day range never divides by zero. */
export function rangeDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 1;
  return Math.max(1, Math.ceil(ms / 86_400_000));
}
