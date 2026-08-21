/**
 * DP-3 eligibility rules for read-only competitor price collection.
 *
 * Pure and Prisma-free so every refusal is unit-testable. The rules here are
 * the access-control boundary for the whole phase: a competitor that has not
 * been through terms review must never be contacted, and a run item that was
 * blocked in DP-2 must never be checked. Both decisions are returned with a
 * reason so the worker can audit exactly why something was skipped rather than
 * silently doing less work than expected.
 */

/** Why a competitor source was not contacted. */
export type CompetitorSkipReason =
  | "disabled"
  | "terms_not_reviewed"
  | "terms_restricted"
  | "terms_disabled"
  | "rate_limited";

/** Why a run item was not checked. */
export type ItemSkipReason =
  | "not_pending"
  | "blocked"
  | "missing_cost"
  | "missing_floor"
  | "no_competitor_url"
  | "run_not_eligible";

export type CompetitorLike = {
  id: string;
  enabled: boolean;
  termsReviewStatus: string;
  rateLimitPerHour: number;
};

export type RunItemLike = {
  id: string;
  status: string;
  blockedReason: string | null;
  costPrice: unknown;
  floorPrice: unknown;
};

export type CompetitorDecision =
  | { allowed: true }
  | { allowed: false; reason: CompetitorSkipReason };

export type ItemDecision = { eligible: true } | { eligible: false; reason: ItemSkipReason };

/** Pricing runs whose items may be checked. */
export const CHECKABLE_RUN_STATUSES = ["draft", "queued"] as const;

export function isRunCheckable(status: string): boolean {
  return (CHECKABLE_RUN_STATUSES as readonly string[]).includes(status);
}

/**
 * Terms review is a hard gate, not a warning.
 *
 * Only `reviewed_allowed` permits contact. `pending` is refused rather than
 * treated as permission-by-default: nobody has looked at that site's terms yet,
 * and defaulting to allowed would make the review step decorative.
 */
export function canContactCompetitor(
  competitor: CompetitorLike,
  args: { checksInLastHour: number },
): CompetitorDecision {
  if (!competitor.enabled) return { allowed: false, reason: "disabled" };

  switch (competitor.termsReviewStatus) {
    case "reviewed_allowed":
      break;
    case "reviewed_restricted":
      return { allowed: false, reason: "terms_restricted" };
    case "disabled":
      return { allowed: false, reason: "terms_disabled" };
    default:
      return { allowed: false, reason: "terms_not_reviewed" };
  }

  const limit = Number.isFinite(competitor.rateLimitPerHour) ? competitor.rateLimitPerHour : 0;
  if (limit <= 0) return { allowed: false, reason: "rate_limited" };
  if (args.checksInLastHour >= limit) return { allowed: false, reason: "rate_limited" };

  return { allowed: true };
}

/** Minimum spacing between requests to one competitor, from its hourly limit. */
export function minRequestSpacingMs(rateLimitPerHour: number): number {
  if (!Number.isFinite(rateLimitPerHour) || rateLimitPerHour <= 0) return 0;
  return Math.ceil(3_600_000 / rateLimitPerHour);
}

const hasPositive = (value: unknown): boolean => {
  if (value == null) return false;
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

/**
 * A run item may only be checked when DP-2 left it genuinely ready.
 *
 * Cost and floor are required because an observation without them cannot be
 * turned into a recommendation later without re-deriving the floor, which is
 * exactly what DP-2 stored per item to avoid.
 */
export function isItemEligible(
  item: RunItemLike,
  args: { runStatus: string; hasCompetitorUrl: boolean },
): ItemDecision {
  if (!isRunCheckable(args.runStatus)) return { eligible: false, reason: "run_not_eligible" };
  if (item.blockedReason != null || item.status === "blocked") {
    return { eligible: false, reason: "blocked" };
  }
  if (item.status !== "pending") return { eligible: false, reason: "not_pending" };
  if (!hasPositive(item.costPrice)) return { eligible: false, reason: "missing_cost" };
  if (!hasPositive(item.floorPrice)) return { eligible: false, reason: "missing_floor" };
  if (!args.hasCompetitorUrl) return { eligible: false, reason: "no_competitor_url" };
  return { eligible: true };
}

/** Batch sizes offered for a staging test run. */
export const TEST_BATCH_SIZES = [5, 10, 25] as const;

/**
 * Caps how many items one dispatch may check.
 *
 * Never exceeds the run's dailyBatchSize: that number is the operator's stated
 * ceiling on outbound requests per day, and a larger batch would spend it in
 * one go.
 */
export function resolveBatchSize(args: {
  requested?: number | null;
  dailyBatchSize: number;
}): number {
  const ceiling =
    Number.isFinite(args.dailyBatchSize) && args.dailyBatchSize > 0 ? args.dailyBatchSize : 300;
  const requested = args.requested;
  if (requested == null || !Number.isFinite(requested) || requested <= 0) return ceiling;
  return Math.min(Math.floor(requested), ceiling);
}
