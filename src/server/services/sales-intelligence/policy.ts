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
import { OrderStatus, PaymentStatus } from "@prisma/client";

/**
 * Statuses that count toward **Gross Sales**.
 *
 * Everything except `cancelled`. A refunded order **is** a sale — it happened,
 * it was billed, and the refund reverses it — so it belongs in gross and is
 * then deducted to reach Net Sales (`DEC-SI-01`, product owner, 2026-08-24):
 *
 *     Gross Sales  −  Refunds  =  Net Sales
 *
 * A cancelled order is different in kind: it never became a sale, so there is
 * nothing to reverse and nothing to deduct. Including it would not just be a
 * presentation choice, it would be wrong.
 *
 * It would also be catastrophic here. Production holds two cancelled orders
 * from 2021-11-08 valued at $25,298,900 and $22,999,000 against a
 * non-cancelled maximum of $65,930 — junk that would swamp every figure on
 * every screen. `docs/36` §7.6.
 */
export const GROSS_SALES_STATUSES: OrderStatus[] = [
  OrderStatus.received,
  OrderStatus.processing,
  OrderStatus.awaiting_supplier,
  OrderStatus.in_supplier_queue,
  OrderStatus.awaiting_human_review,
  OrderStatus.shipped,
  OrderStatus.delivered,
  OrderStatus.completed,
  // A sale that was subsequently reversed. In gross, then deducted.
  OrderStatus.refunded,
];

/** Never a sale, so never in gross and never a deduction. */
export const EXCLUDED_STATUSES: OrderStatus[] = [OrderStatus.cancelled];

/**
 * @deprecated Use `GROSS_SALES_STATUSES`. Retained only to make the change in
 * meaning explicit to anything that imported the old name: this list no longer
 * describes "what counts as revenue", because refunded orders now count toward
 * gross and are deducted separately.
 */
export const REVENUE_STATUSES: OrderStatus[] = GROSS_SALES_STATUSES;

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

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/**
 * The refund attributable to one order.
 *
 * `Order.refundedTotal` is the right field and supports partial refunds, but
 * in production it is populated on only **196 of 9,376** refunded orders. The
 * other 9,180 carry a `refunded` status and a recorded refund of zero, which
 * is plainly not what happened — believing it would report $46,882 of refunds
 * against $2.59M of refunded orders, a 55x understatement.
 *
 * So the rule is:
 *
 *   1. A recorded `refundedTotal > 0` is trusted, whatever the status. This is
 *      what makes partial refunds work — 25 orders in production carry one
 *      without a `refunded` status.
 *   2. A `refunded` status with no recorded amount is treated as a **full**
 *      refund of the order, because that is what the status asserts and the
 *      order value is the only figure available.
 *   3. Anything else is zero.
 *
 * Rule 2 is an inference, not a measurement, and it currently accounts for
 * 98.2% of all refund value. `RefundBreakdown.confidence` reports exactly how
 * much, so a reader is never invited to mistake the estimate for a fact.
 *
 * The known imprecision: an order with a *partial* refund recorded AND a
 * `refunded` status is trusted at its recorded amount under rule 1, so a
 * partial refund later completed but never re-synced would be understated.
 * Preferring the recorded figure is still right — inventing a larger one from
 * the status would be worse.
 */
export function orderRefundAmount(order: {
  status: OrderStatus;
  paymentStatus?: PaymentStatus | null;
  grandTotal: unknown;
  refundedTotal: unknown;
}): { amount: number; source: "recorded" | "inferred" | "unquantified" | "none" } {
  const recorded = positiveOrNull(order.refundedTotal);
  if (recorded != null) return { amount: recorded, source: "recorded" };

  if (order.status === OrderStatus.refunded) {
    // Known to be PARTIAL, amount unknown. Inferring the full order value here
    // would overstate — 27 such orders in production, worth up to $17,366 of
    // order value against an actual partial refund. Reported separately as
    // unquantified rather than guessed at in either direction.
    if (order.paymentStatus === PaymentStatus.partially_refunded) {
      return { amount: 0, source: "unquantified" };
    }
    const full = positiveOrNull(order.grandTotal);
    if (full != null) return { amount: full, source: "inferred" };
  }
  return { amount: 0, source: "none" };
}

export type RefundBreakdown = {
  /** Total deducted from gross to reach net. */
  total: number;
  /** Portion backed by a recorded `refundedTotal`. */
  recorded: number;
  /** Portion inferred from a `refunded` status with no recorded amount. */
  inferred: number;
  /** Orders contributing an inferred amount. */
  inferredOrderCount: number;
  /**
   * Orders known to be partially refunded whose amount was never recorded.
   *
   * Excluded from `total` — their refund is real but unmeasurable, and both
   * guessing a full refund and silently treating it as zero would be wrong.
   * A non-zero count means `total` is an understatement of known size.
   */
  unquantifiedOrderCount: number;
  /**
   * Share of refund value that is measured rather than inferred, 0–1.
   *
   * Production sits at ~0.018. Surface this wherever the refund line is shown:
   * a deduction that is 98% estimated is a materially different claim from one
   * that is 98% measured, and the number alone cannot tell them apart.
   */
  confidence: number;
};

export function summariseRefunds(args: {
  recorded: number;
  inferred: number;
  inferredOrderCount: number;
  unquantifiedOrderCount?: number;
}): RefundBreakdown {
  const total = args.recorded + args.inferred;
  return {
    total: Math.round(total * 100) / 100,
    recorded: Math.round(args.recorded * 100) / 100,
    inferred: Math.round(args.inferred * 100) / 100,
    inferredOrderCount: args.inferredOrderCount,
    unquantifiedOrderCount: args.unquantifiedOrderCount ?? 0,
    confidence: total > 0 ? args.recorded / total : 1,
  };
}

/**
 * Net sales — gross less refunds.
 *
 * Not floored at zero. A period whose refunds exceed its gross is a real and
 * important signal (returns landing against sales booked in an earlier
 * period), and clamping it to zero would hide exactly the case worth seeing.
 */
export function netSales(grossSales: number, refunds: number): number {
  return Math.round((grossSales - refunds) * 100) / 100;
}

/** Refunds as a share of gross sales, 0–1. Null when there was no gross. */
export function refundRate(grossSales: number, refunds: number): number | null {
  if (!Number.isFinite(grossSales) || grossSales <= 0) return null;
  return refunds / grossSales;
}
