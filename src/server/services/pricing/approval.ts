/**
 * DP-5 approval rules — pure decisions, no Prisma, no I/O.
 *
 * Approving a pricing recommendation is an internal decision only. Nothing in
 * this phase writes a price anywhere: approval marks a row as accepted so a
 * later, separately-gated DP-6 writeback can consider it.
 *
 * The eligibility rules live here rather than in the action so they can be
 * tested directly, and so the SAME check runs at approval time that ran at
 * render time. A control hidden in the UI is a courtesy; the check below is
 * the actual guard, and a stale open page must not get past it.
 */
import { PERMISSIONS } from "@/lib/permissions";

/** Statuses that represent a decision already taken. */
export const DECIDED_STATUSES = ["approved", "rejected", "written_back", "failed"] as const;

/** The only status a decision may be taken from. */
export const DECIDABLE_STATUS = "ready_for_review";

export type ApprovalRefusal =
  | "not_ready"
  | "already_decided"
  | "approval_not_required"
  | "expired"
  | "missing_recommended_price"
  | "missing_floor"
  | "missing_cost"
  | "below_floor"
  | "item_missing"
  | "item_blocked";

export type Verdict =
  | { allowed: true }
  | { allowed: false; reason: ApprovalRefusal; message: string };

const refuse = (reason: ApprovalRefusal, message: string): Verdict => ({
  allowed: false,
  reason,
  message,
});

export type RecommendationLike = {
  status: string;
  requiresApproval: boolean;
  recommendedSalePrice: number | null;
  floorPrice: number | null;
  costPrice: number | null;
  expiresAt: Date | null;
};

export type RunItemLike = {
  status: string;
  blockedReason: string | null;
} | null;

const positive = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/**
 * Expiry is evaluated against the clock, not against the stored status.
 *
 * Nothing sweeps rows to `expired` on a timer, so a row can be past its
 * horizon while still reading `ready_for_review`. Trusting the status alone
 * would let exactly the stale evidence DP-4 refused to price get approved.
 */
export function isExpired(recommendation: { expiresAt: Date | null }, now: Date): boolean {
  return recommendation.expiresAt != null && recommendation.expiresAt <= now;
}

/**
 * Whether this recommendation may be approved.
 *
 * The price checks are deliberately re-run here rather than trusted from
 * generation time: the row stores the floor and cost it was built against, and
 * a proposal that no longer clears its own floor must not be approvable no
 * matter how it got that way.
 */
export function canApprove(
  recommendation: RecommendationLike,
  item: RunItemLike,
  now: Date,
): Verdict {
  if (recommendation.status !== DECIDABLE_STATUS) {
    if ((DECIDED_STATUSES as readonly string[]).includes(recommendation.status)) {
      return refuse(
        "already_decided",
        "This recommendation is already " + recommendation.status + ".",
      );
    }
    return refuse(
      "not_ready",
      "Only a recommendation that is ready for review can be approved; this one is " +
        recommendation.status +
        ".",
    );
  }

  // A row that does not require approval has no approval to give. DP-4 writes
  // requiresApproval true on every row, so this is a tripwire for a future
  // phase quietly introducing an auto-approve path.
  if (!recommendation.requiresApproval) {
    return refuse(
      "approval_not_required",
      "This recommendation is not marked as requiring approval; refusing to record one.",
    );
  }

  if (isExpired(recommendation, now)) {
    return refuse(
      "expired",
      "This recommendation is expired. Re-run observation and recommendation generation before approving.",
    );
  }

  if (item == null) {
    return refuse("item_missing", "The pricing run item behind this recommendation is gone.");
  }
  if (item.status === "blocked" || item.blockedReason != null) {
    return refuse(
      "item_blocked",
      "The pricing run item is blocked" +
        (item.blockedReason ? " (" + item.blockedReason + ")" : "") +
        "; resolve that before approving a price for it.",
    );
  }

  if (!positive(recommendation.recommendedSalePrice)) {
    return refuse("missing_recommended_price", "This recommendation has no proposed price.");
  }
  if (!positive(recommendation.costPrice)) {
    return refuse(
      "missing_cost",
      "No cost price is recorded, so the margin behind this price cannot be verified.",
    );
  }
  if (!positive(recommendation.floorPrice)) {
    return refuse(
      "missing_floor",
      "No floor price is recorded, so this price cannot be checked against a floor.",
    );
  }
  if (recommendation.recommendedSalePrice < recommendation.floorPrice) {
    return refuse(
      "below_floor",
      "The proposed price of $" +
        recommendation.recommendedSalePrice.toFixed(2) +
        " is below the $" +
        recommendation.floorPrice.toFixed(2) +
        " floor and cannot be approved.",
    );
  }

  return { allowed: true };
}

/**
 * Whether this recommendation may be rejected.
 *
 * Looser than approval on purpose. Rejection is the conservative direction, so
 * an expired row is still rejectable — refusing would strand rows in the queue
 * with no way to clear them. What rejection does require is a reason: an
 * unexplained rejection tells the next reviewer nothing.
 */
export function canReject(recommendation: { status: string }, reason: string): Verdict {
  if (recommendation.status !== DECIDABLE_STATUS) {
    if ((DECIDED_STATUSES as readonly string[]).includes(recommendation.status)) {
      return refuse(
        "already_decided",
        "This recommendation is already " + recommendation.status + ".",
      );
    }
    return refuse(
      "not_ready",
      "Only a recommendation that is ready for review can be rejected; this one is " +
        recommendation.status +
        ".",
    );
  }
  if (!reason.trim()) {
    return refuse("not_ready", "A rejection reason is required.");
  }
  return { allowed: true };
}

export const MIN_REJECTION_REASON_LENGTH = 3;
export const MAX_REJECTION_REASON_LENGTH = 1000;

/** Normalises and validates a supplied rejection reason. */
export function parseRejectionReason(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // Normalised before measuring: a textarea submits CRLF, so a reason at the
  // boundary would otherwise measure differently than the operator typed.
  const value = raw.replace(/\r\n/g, "\n").trim();
  if (value.length < MIN_REJECTION_REASON_LENGTH) return null;
  return value.slice(0, MAX_REJECTION_REASON_LENGTH);
}

/**
 * The permission a decision requires.
 *
 * Deliberately NOT pricing.review_recommendations: that permission generates
 * the queue, and generating work you may then bless yourself is exactly the
 * separation this split exists to create.
 */
export const DECISION_PERMISSION = PERMISSIONS.PRICING_APPROVE_RECOMMENDATIONS;

/** Mirrors canUserApprove in the general approvals module. */
export function canUserDecide(user: { permissions: string[] } | null | undefined): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(DECISION_PERMISSION);
}

/**
 * Whether the APPROVE control should render.
 *
 * Runs the full server predicate, not a subset of it. An earlier version
 * checked only permission, status, and expiry while claiming to match the
 * server — so a row with no floor, no cost, or a below-floor price still got an
 * Approve button that the action then refused. Offering a button that cannot
 * work is worse than offering none: it reads as a system fault rather than as
 * the guardrail doing its job.
 */
export function showsApproveControl(args: {
  recommendation: RecommendationLike;
  item: RunItemLike;
  user: { permissions: string[] } | null | undefined;
  now: Date;
}): boolean {
  if (!canUserDecide(args.user)) return false;
  return canApprove(args.recommendation, args.item, args.now).allowed;
}

/**
 * Whether the REJECT control should render.
 *
 * Deliberately NOT the approve predicate. Rejection is the conservative
 * direction and exists partly to clear rows that can never be approved — an
 * expired one, or one whose cost went missing. Gating it on approvability would
 * strand precisely those rows in the queue with no way out.
 */
export function showsRejectControl(args: {
  recommendation: { status: string };
  user: { permissions: string[] } | null | undefined;
}): boolean {
  if (!canUserDecide(args.user)) return false;
  return args.recommendation.status === DECIDABLE_STATUS;
}

/**
 * Why the approve control is absent, for a user who could otherwise decide.
 *
 * Returns null when approval is available or when the user cannot decide at
 * all. Lets the page say "you cannot approve this because X" instead of simply
 * omitting the button and leaving the reviewer to guess.
 */
export function approveUnavailableReason(args: {
  recommendation: RecommendationLike;
  item: RunItemLike;
  user: { permissions: string[] } | null | undefined;
  now: Date;
}): string | null {
  if (!canUserDecide(args.user)) return null;
  const verdict = canApprove(args.recommendation, args.item, args.now);
  return verdict.allowed ? null : verdict.message;
}

/** Statuses a recommendation list may be filtered by. */
export const RECOMMENDATION_FILTERS = [
  "ready_for_review",
  "approved",
  "rejected",
  "expired",
  "written_back",
  "failed",
  "all",
] as const;

export type RecommendationFilter = (typeof RECOMMENDATION_FILTERS)[number];

export function parseRecommendationFilter(raw: unknown): RecommendationFilter {
  const value = typeof raw === "string" ? raw.trim() : "";
  return (RECOMMENDATION_FILTERS as readonly string[]).includes(value)
    ? (value as RecommendationFilter)
    : "ready_for_review";
}
