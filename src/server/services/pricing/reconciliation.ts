/**
 * DP-6C writeback reconciliation — pure comparison rules, no Prisma, no HTTP.
 *
 * Answers one question per writeback log: given what we recorded, is the store
 * still in the state we believe we left it in?
 *
 * Reconciliation only ever OBSERVES. Nothing here or downstream corrects a
 * drifted price — that would turn a reporting tool into an unreviewed writer.
 * A mismatch is a finding for a human, not a task for the system.
 */
import { selectPriorSalePrice, type WritebackLogLike } from "./rollback-eligibility";

/** How much drift counts as equal. Matches the DP-6B rollback tolerance. */
export const RECONCILIATION_TOLERANCE = 0.005;

export type ReconciliationStatus =
  | "matched"
  | "mismatch"
  | "possible_landed_write"
  | "manual_verification_required"
  | "not_applicable";

export type ReconciliationOutcome = {
  status: ReconciliationStatus;
  /** What the log implies the store should currently hold. Null when unknown. */
  expectedSalePrice: number | null;
  observedSalePrice: number | null;
  /** Plain-language explanation, shown in the UI and the export. */
  reason: string;
  /** What a human should do about it, if anything. */
  requiredAction: string | null;
};

const near = (a: number | null, b: number | null): boolean => {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= RECONCILIATION_TOLERANCE;
};

const money = (value: number | null): string => (value == null ? "unset" : "$" + value.toFixed(2));

/** The most recent rollback attempt recorded on the log, if any. */
export function latestRollbackAttempt(
  rollbackPayload: unknown,
): { outcome: string | null; reason: string | null; errorMessage: string | null } | null {
  if (!rollbackPayload || typeof rollbackPayload !== "object" || Array.isArray(rollbackPayload)) {
    return null;
  }
  const attempts = (rollbackPayload as Record<string, unknown>).rollbackAttempts;
  if (!Array.isArray(attempts) || attempts.length === 0) return null;
  const last = attempts[attempts.length - 1];
  if (!last || typeof last !== "object" || Array.isArray(last)) return null;
  const record = last as Record<string, unknown>;
  const str = (value: unknown): string | null => (typeof value === "string" ? value : null);
  return {
    outcome: str(record.outcome),
    reason: str(record.reason),
    errorMessage: str(record.errorMessage),
  };
}

/**
 * Compares one writeback log against the price the store currently reports.
 *
 * The expectation differs per log status, and getting that wrong in the safe
 * direction matters: a log we have no expectation for must report
 * `not_applicable`, not a false `matched`.
 */
export function reconcileWritebackLog(args: {
  log: WritebackLogLike;
  observedSalePrice: number | null;
}): ReconciliationOutcome {
  const { log, observedSalePrice } = args;
  const written = log.newSalePrice;

  // ---- A write that landed and was never rolled back ----------------------
  if (log.status === "succeeded" && log.rollbackAt == null) {
    if (written == null) {
      return {
        status: "manual_verification_required",
        expectedSalePrice: null,
        observedSalePrice,
        reason:
          "The log records a successful write but no written price, so nothing can be compared.",
        requiredAction: "Check this product's price in BigCommerce by hand.",
      };
    }
    if (near(observedSalePrice, written)) {
      return {
        status: "matched",
        expectedSalePrice: written,
        observedSalePrice,
        reason: "The store still holds the price this writeback set.",
        requiredAction: null,
      };
    }
    return {
      status: "mismatch",
      expectedSalePrice: written,
      observedSalePrice,
      reason:
        "Store price changed after writeback: expected " +
        money(written) +
        ", found " +
        money(observedSalePrice) +
        ".",
      // Deliberately not "re-write it". Something changed this price and this
      // system does not know what; a person decides whether that was correct.
      requiredAction:
        "Find out what changed this price before acting. Rollback will refuse while the live price differs.",
    };
  }

  // ---- A write that was rolled back ---------------------------------------
  if (log.status === "rolled_back") {
    const prior = selectPriorSalePrice(log);
    if (prior.kind === "value") {
      if (near(observedSalePrice, prior.salePrice)) {
        return {
          status: "matched",
          expectedSalePrice: prior.salePrice,
          observedSalePrice,
          reason: "The store holds the restored pre-writeback price.",
          requiredAction: null,
        };
      }
      return {
        status: "mismatch",
        expectedSalePrice: prior.salePrice,
        observedSalePrice,
        reason:
          "Store price differs from the restored price: expected " +
          money(prior.salePrice) +
          ", found " +
          money(observedSalePrice) +
          ".",
        requiredAction: "Confirm in BigCommerce whether the rollback took effect.",
      };
    }
    // The prior state was "no sale price", which DP-6B cannot restore
    // automatically. Whether the store is correct is a human judgement.
    return {
      status: "manual_verification_required",
      expectedSalePrice: null,
      observedSalePrice,
      reason:
        "This writeback was rolled back, but the pre-writeback state was no sale price, which " +
        "this integration cannot clear automatically.",
      requiredAction: "Confirm in BigCommerce that the sale price is cleared as intended.",
    };
  }

  // ---- A write that reported failure --------------------------------------
  if (log.status === "failed") {
    if (written != null && near(observedSalePrice, written)) {
      // The important finding in this whole module: the API said no, but the
      // store holds the price anyway. Treating that as "nothing happened"
      // would leave an unrecorded live change on the storefront.
      return {
        status: "possible_landed_write",
        expectedSalePrice: null,
        observedSalePrice,
        reason:
          "The writeback reported a failure, but the store holds " +
          money(written) +
          " — the value this writeback tried to set. The write may have landed despite the error.",
        requiredAction:
          "Verify in BigCommerce and decide whether to keep this price. The log does not reflect it.",
      };
    }
    return {
      status: "not_applicable",
      expectedSalePrice: null,
      observedSalePrice,
      reason: "The writeback failed, so no price change was expected.",
      requiredAction: null,
    };
  }

  // ---- Anything else (queued, and future statuses) ------------------------
  return {
    status: "not_applicable",
    expectedSalePrice: null,
    observedSalePrice,
    reason: "No completed writeback to reconcile; the log is " + log.status + ".",
    requiredAction: null,
  };
}

/** Filters offered on the operations page. */
export const OPERATIONS_FILTERS = [
  "approved_not_written",
  "written_back",
  "rolled_back",
  "writeback_failed",
  "rollback_failed",
  "needs_reconciliation",
  "mismatch",
  "all",
] as const;

export type OperationsFilter = (typeof OPERATIONS_FILTERS)[number];

export function parseOperationsFilter(raw: unknown): OperationsFilter {
  const value = typeof raw === "string" ? raw.trim() : "";
  return (OPERATIONS_FILTERS as readonly string[]).includes(value)
    ? (value as OperationsFilter)
    : "all";
}

/** True when a log carries a rollback attempt that did not succeed. */
export function hasFailedRollbackAttempt(rollbackPayload: unknown): boolean {
  const attempt = latestRollbackAttempt(rollbackPayload);
  if (!attempt) return false;
  return attempt.outcome === "failed" || attempt.outcome === "refused";
}
