/**
 * Delayed-order rules (Phase 8 — docs/19 §8, docs/17 §6 "Order delay").
 *
 * Pure module — no I/O — so thresholds are pinned by unit tests and the same
 * evaluation runs identically in the ops queue, the order detail page, and
 * the worker sweep that raises order_delay exceptions.
 *
 * Rules (calendar days; source timestamps are BigCommerce-synced):
 *   unshipped   — order is in an active pre-ship status with no shipment
 *                 recorded: warn at UNSHIPPED_WARN_DAYS, delayed at
 *                 UNSHIPPED_DELAY_DAYS (matches the ops queue's historical
 *                 7-day view).
 *   in_review   — awaiting_human_review is a human bottleneck; delayed after
 *                 REVIEW_DELAY_DAYS.
 *   delivery    — shipped but never delivered/completed DELIVERY_DELAY_DAYS
 *                 after the latest shipment.
 * Terminal statuses (delivered/completed/cancelled/refunded) are never
 * delayed.
 */

export const DELAY_THRESHOLDS = {
  UNSHIPPED_WARN_DAYS: 3,
  UNSHIPPED_DELAY_DAYS: 7,
  REVIEW_DELAY_DAYS: 2,
  DELIVERY_DELAY_DAYS: 14,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pre-ship statuses where the clock runs against orderDate. */
const PRE_SHIP_STATUSES = new Set([
  "received",
  "processing",
  "awaiting_supplier",
  "in_supplier_queue",
  "awaiting_human_review",
]);

const TERMINAL_STATUSES = new Set(["delivered", "completed", "cancelled", "refunded"]);

export type DelayKind = "none" | "unshipped" | "in_review" | "delivery";

export type DelayVerdict = {
  /** True only for a full delay — the "warn" level is advisory. */
  delayed: boolean;
  /** Advisory: aging but not yet past the delay threshold. */
  warning: boolean;
  kind: DelayKind;
  daysOutstanding: number;
  reason: string | null;
};

export type DelayInput = {
  status: string;
  orderDate: Date;
  /** shippedAt values of recorded shipments (nulls tolerated). */
  shipmentDates: (Date | null)[];
  now?: Date;
};

export function evaluateOrderDelay(input: DelayInput): DelayVerdict {
  const now = input.now ?? new Date();
  const T = DELAY_THRESHOLDS;
  const none: DelayVerdict = {
    delayed: false,
    warning: false,
    kind: "none",
    daysOutstanding: 0,
    reason: null,
  };

  if (TERMINAL_STATUSES.has(input.status)) return none;

  const shipped = input.shipmentDates.filter((d): d is Date => d != null);
  const latestShipment = shipped.length
    ? shipped.reduce((a, b) => (a.getTime() >= b.getTime() ? a : b))
    : null;

  // Shipped (by status or by recorded shipment) → delivery clock.
  if (input.status === "shipped" || latestShipment) {
    const since = latestShipment ?? input.orderDate;
    const days = Math.floor((now.getTime() - since.getTime()) / DAY_MS);
    if (days >= T.DELIVERY_DELAY_DAYS) {
      return {
        delayed: true,
        warning: false,
        kind: "delivery",
        daysOutstanding: days,
        reason: `Shipped ${days} days ago with no delivered/completed status (threshold ${T.DELIVERY_DELAY_DAYS}d).`,
      };
    }
    return none;
  }

  if (!PRE_SHIP_STATUSES.has(input.status)) return none;

  const days = Math.floor((now.getTime() - input.orderDate.getTime()) / DAY_MS);

  // Human-review bottleneck has a tighter clock than general fulfillment.
  if (input.status === "awaiting_human_review" && days >= T.REVIEW_DELAY_DAYS) {
    return {
      delayed: true,
      warning: false,
      kind: "in_review",
      daysOutstanding: days,
      reason: `Awaiting human review for ${days} days (threshold ${T.REVIEW_DELAY_DAYS}d).`,
    };
  }

  if (days >= T.UNSHIPPED_DELAY_DAYS) {
    return {
      delayed: true,
      warning: false,
      kind: "unshipped",
      daysOutstanding: days,
      reason: `Unshipped ${days} days after order date (threshold ${T.UNSHIPPED_DELAY_DAYS}d).`,
    };
  }
  if (days >= T.UNSHIPPED_WARN_DAYS) {
    return {
      delayed: false,
      warning: true,
      kind: "unshipped",
      daysOutstanding: days,
      reason: `Unshipped ${days} days after order date (warn at ${T.UNSHIPPED_WARN_DAYS}d, delayed at ${T.UNSHIPPED_DELAY_DAYS}d).`,
    };
  }
  return { ...none, daysOutstanding: days };
}

/** Severity for the Exception row raised on a delayed order. */
export function delaySeverity(verdict: DelayVerdict): "medium" | "high" {
  if (!verdict.delayed) return "medium";
  // Review bottlenecks and long delivery gaps are customer-visible — high.
  if (verdict.kind === "in_review" || verdict.kind === "delivery") return "high";
  return verdict.daysOutstanding >= DELAY_THRESHOLDS.UNSHIPPED_DELAY_DAYS * 2 ? "high" : "medium";
}
