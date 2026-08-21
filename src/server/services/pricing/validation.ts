/**
 * Pricing Intelligence input validation (DP-1 — docs/22 PRD §8, §9, §17).
 *
 * Pure and server-side: every rule here is enforced regardless of what the
 * browser form allowed. Values are normalized (trimmed, uppercased currency)
 * before persistence so audit before/after diffs stay meaningful.
 */

export class PricingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingValidationError";
  }
}

export const TERMS_REVIEW_STATUSES = [
  "pending",
  "reviewed_allowed",
  "reviewed_restricted",
  "disabled",
] as const;
export type TermsReviewStatus = (typeof TERMS_REVIEW_STATUSES)[number];

function requireHttpUrl(value: string, label: string): string {
  const trimmed = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new PricingValidationError(`${label} must be a valid URL.`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new PricingValidationError(`${label} must use http or https.`);
  }
  return trimmed;
}

function requireText(value: string, label: string, min: number, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new PricingValidationError(`${label} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}

function requireNumber(
  value: number,
  label: string,
  min: number,
  max: number,
  opts: { integer?: boolean } = {},
): number {
  if (!Number.isFinite(value)) throw new PricingValidationError(`${label} must be a number.`);
  if (opts.integer && !Number.isInteger(value)) {
    throw new PricingValidationError(`${label} must be a whole number.`);
  }
  if (value < min || value > max) {
    throw new PricingValidationError(`${label} must be between ${min} and ${max}.`);
  }
  return value;
}

export type CompetitorInput = {
  name: string;
  baseUrl: string;
  country: string | null;
  currency: string;
  searchUrlTemplate: string | null;
  productUrlPattern: string | null;
  rateLimitPerHour: number;
  termsReviewStatus: string;
  requiresManualUrlMapping: boolean;
  enabled: boolean;
  notes: string | null;
};

export function validateCompetitorInput(input: CompetitorInput): CompetitorInput & {
  termsReviewStatus: TermsReviewStatus;
} {
  const name = requireText(input.name, "Competitor name", 2, 120);
  const baseUrl = requireHttpUrl(input.baseUrl, "Base URL");
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new PricingValidationError("Currency must be a 3-letter ISO code (e.g. CAD).");
  }
  const country = input.country?.trim() ? requireText(input.country, "Country", 2, 56) : null;
  let searchUrlTemplate: string | null = null;
  if (input.searchUrlTemplate?.trim()) {
    searchUrlTemplate = requireHttpUrl(input.searchUrlTemplate, "Search URL template");
    if (!/\{(sku|query|name)\}/.test(searchUrlTemplate)) {
      throw new PricingValidationError(
        "Search URL template must contain a {sku}, {query}, or {name} placeholder.",
      );
    }
  }
  const productUrlPattern = input.productUrlPattern?.trim()
    ? requireText(input.productUrlPattern, "Product URL pattern", 2, 500)
    : null;
  const rateLimitPerHour = requireNumber(input.rateLimitPerHour, "Rate limit per hour", 1, 600, {
    integer: true,
  });
  if (!TERMS_REVIEW_STATUSES.includes(input.termsReviewStatus as TermsReviewStatus)) {
    throw new PricingValidationError("Choose a valid terms-review status.");
  }
  const notes = input.notes?.trim() ? requireText(input.notes, "Notes", 1, 4000) : null;

  return {
    name,
    baseUrl,
    country,
    currency,
    searchUrlTemplate,
    productUrlPattern,
    rateLimitPerHour,
    termsReviewStatus: input.termsReviewStatus as TermsReviewStatus,
    requiresManualUrlMapping: input.requiresManualUrlMapping,
    enabled: input.enabled,
    notes,
  };
}

export type PricingRuleInput = {
  name: string;
  storeId: string | null;
  minCostMultiplier: number;
  defaultUndercutAmount: number;
  defaultUndercutPct: number | null;
  maxIncreasePct: number;
  maxDecreasePct: number;
  dailyBatchSize: number;
  minConfidence: number;
  evidenceFreshnessHours: number;
  requiresApproval: boolean;
  autoApproveEligible: boolean;
  enabled: boolean;
  notes: string | null;
};

export function validatePricingRuleInput(input: PricingRuleInput): PricingRuleInput {
  const name = requireText(input.name, "Rule name", 2, 120);
  // The multiplier is the price floor: below 1.0 would authorize selling
  // under cost, so it is rejected outright — not merely warned about.
  const minCostMultiplier = requireNumber(
    input.minCostMultiplier,
    "Minimum cost multiplier",
    1,
    10,
  );
  const defaultUndercutAmount = requireNumber(
    input.defaultUndercutAmount,
    "Undercut amount",
    0,
    1000,
  );
  const defaultUndercutPct =
    input.defaultUndercutPct == null
      ? null
      : requireNumber(input.defaultUndercutPct, "Undercut percent", 0, 50);
  const maxIncreasePct = requireNumber(input.maxIncreasePct, "Max increase percent", 0, 100);
  const maxDecreasePct = requireNumber(input.maxDecreasePct, "Max decrease percent", 0, 100);
  const dailyBatchSize = requireNumber(input.dailyBatchSize, "Daily batch size", 1, 2000, {
    integer: true,
  });
  const minConfidence = requireNumber(input.minConfidence, "Minimum confidence", 0, 1);
  const evidenceFreshnessHours = requireNumber(
    input.evidenceFreshnessHours,
    "Evidence freshness (hours)",
    1,
    720,
    { integer: true },
  );
  // DP-1 ships no approval workflow yet, so no rule may pre-declare that
  // future recommendations skip approval. Limited automation is DP-7 and
  // will revisit this under its own product-owner sign-off.
  if (!input.requiresApproval) {
    throw new PricingValidationError("Approval cannot be disabled in this phase.");
  }
  // Rejected rather than silently coerced to false. A rule stored with
  // autoApproveEligible true would sit in the database looking like an
  // authorisation that no one granted, and the first phase to read the field
  // would honour it. Refusing makes the attempt visible now.
  if (input.autoApproveEligible) {
    throw new PricingValidationError(
      "Auto-approval is unavailable until a later product-owner-approved automation phase.",
    );
  }
  const notes = input.notes?.trim() ? requireText(input.notes, "Notes", 1, 4000) : null;

  return {
    name,
    storeId: input.storeId?.trim() || null,
    minCostMultiplier,
    defaultUndercutAmount,
    defaultUndercutPct,
    maxIncreasePct,
    maxDecreasePct,
    dailyBatchSize,
    minConfidence,
    evidenceFreshnessHours,
    requiresApproval: input.requiresApproval,
    // Pinned false for this phase; the guard above rejects any attempt to set it.
    autoApproveEligible: false,
    enabled: input.enabled,
    notes,
  };
}
