/**
 * CASL-safe marketing eligibility (Phase 4 — docs/19).
 *
 * Pure, explainable policy: given a customer's consent evidence, decide
 * whether they may receive marketing email and WHY. Every verdict carries a
 * machine code + human reasons so the app "can explain why a customer is
 * eligible or suppressed" (Phase 4 acceptance criteria).
 *
 * Policy (casl-v1), in precedence order:
 *   1. Archived/deleted customers are never eligible.
 *   2. No email address → not contactable.
 *   3. SUPPRESSION WINS: unsubscribed / cleaned (bounced) / complained are
 *      always ineligible, regardless of any other evidence.
 *   4. Pending (double opt-in not confirmed) → ineligible.
 *   5. EXPRESS consent (documented basis + subscribed status) → eligible.
 *      Express consent does not expire under CASL.
 *   6. IMPLIED consent — an existing business relationship. Valid when either
 *      a recorded consentExpiresAt is in the future, or the customer
 *      purchased within the last 24 months (CASL EBR window). Reasons state
 *      the window end so operators can see when it lapses.
 *   7. Everything else (unknown / transactional-only with no recent purchase)
 *      → ineligible: never assume CASL eligibility without evidence.
 */

export const ELIGIBILITY_POLICY_VERSION = "casl-v1";

/** CASL implied-consent (existing business relationship) window, in days. */
export const IMPLIED_CONSENT_WINDOW_DAYS = 730;

export type EligibilityCode =
  | "eligible_express"
  | "eligible_implied"
  | "archived"
  | "no_email"
  | "suppressed"
  | "pending_confirmation"
  | "no_consent_evidence";

export type EligibilityInput = {
  email: string | null;
  /** ConsentStatus enum value as a string. */
  consentStatus: string;
  /** ConsentBasis enum value as a string. */
  consentBasis: string;
  consentObtainedAt: Date | null;
  consentExpiresAt: Date | null;
  suppressionReason: string | null;
  lastOrderAt: Date | null;
  deletedAt?: Date | null;
};

export type EligibilityVerdict = {
  eligible: boolean;
  code: EligibilityCode;
  reasons: string[];
  policy: typeof ELIGIBILITY_POLICY_VERSION;
};

const SUPPRESSED_STATUSES = new Set(["unsubscribed", "cleaned", "complained"]);

const day = 24 * 60 * 60 * 1000;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function evaluateMarketingEligibility(
  input: EligibilityInput,
  now: Date = new Date(),
): EligibilityVerdict {
  const verdict = (
    eligible: boolean,
    code: EligibilityCode,
    reasons: string[],
  ): EligibilityVerdict => ({
    eligible,
    code,
    reasons,
    policy: ELIGIBILITY_POLICY_VERSION,
  });

  if (input.deletedAt) {
    return verdict(false, "archived", ["Customer is archived/deleted."]);
  }
  if (!input.email || !input.email.trim()) {
    return verdict(false, "no_email", ["No email address on file."]);
  }

  if (SUPPRESSED_STATUSES.has(input.consentStatus)) {
    const label =
      input.consentStatus === "complained"
        ? "spam complaint"
        : input.consentStatus === "cleaned"
          ? "cleaned / bounced"
          : "unsubscribed";
    return verdict(false, "suppressed", [
      `Suppressed — ${label}${input.suppressionReason ? ` (${input.suppressionReason})` : ""}. Suppression always wins.`,
    ]);
  }

  if (input.consentStatus === "pending") {
    return verdict(false, "pending_confirmation", [
      "Double opt-in requested but not confirmed — cannot email until confirmed.",
    ]);
  }

  // Express consent: documented basis + an affirmative subscription state.
  if (input.consentBasis === "express" && input.consentStatus === "subscribed") {
    const obtained = input.consentObtainedAt ? ` (obtained ${iso(input.consentObtainedAt)})` : "";
    return verdict(true, "eligible_express", [
      `Express consent${obtained} — does not expire under CASL.`,
    ]);
  }

  // Implied consent: recorded window, else derived from purchase history.
  const recordedWindowOk =
    input.consentExpiresAt && input.consentExpiresAt.getTime() > now.getTime();
  if (recordedWindowOk) {
    return verdict(true, "eligible_implied", [
      `Implied consent — valid until ${iso(input.consentExpiresAt!)}.`,
    ]);
  }
  if (input.consentExpiresAt && input.consentExpiresAt.getTime() <= now.getTime()) {
    return verdict(false, "no_consent_evidence", [
      `Implied consent expired ${iso(input.consentExpiresAt)} — re-permission required.`,
    ]);
  }
  if (input.lastOrderAt) {
    const windowEnd = new Date(input.lastOrderAt.getTime() + IMPLIED_CONSENT_WINDOW_DAYS * day);
    if (windowEnd.getTime() > now.getTime()) {
      return verdict(true, "eligible_implied", [
        `Implied consent (existing business relationship) — purchased ${iso(input.lastOrderAt)}, valid until ${iso(windowEnd)}.`,
      ]);
    }
    return verdict(false, "no_consent_evidence", [
      `Last purchase ${iso(input.lastOrderAt)} — implied-consent window (24 months) has lapsed.`,
    ]);
  }

  return verdict(false, "no_consent_evidence", [
    "No documented consent evidence — CASL requires express consent or a valid implied-consent window.",
  ]);
}

// ---------------------------------------------------------------------------
// Snapshot summarizer — campaign approvals attach this (Phase 4 acceptance:
// "Campaigns cannot be approved without an eligibility snapshot").
// ---------------------------------------------------------------------------

export type EligibilitySnapshot = {
  policy: typeof ELIGIBILITY_POLICY_VERSION;
  evaluatedAt: string;
  total: number;
  eligible: number;
  ineligible: number;
  byCode: Partial<Record<EligibilityCode, number>>;
};

export function buildEligibilitySnapshot(
  verdicts: EligibilityVerdict[],
  evaluatedAt: Date = new Date(),
): EligibilitySnapshot {
  const byCode: Partial<Record<EligibilityCode, number>> = {};
  for (const v of verdicts) byCode[v.code] = (byCode[v.code] ?? 0) + 1;
  const eligible = verdicts.filter((v) => v.eligible).length;
  return {
    policy: ELIGIBILITY_POLICY_VERSION,
    evaluatedAt: evaluatedAt.toISOString(),
    total: verdicts.length,
    eligible,
    ineligible: verdicts.length - eligible,
    byCode,
  };
}
