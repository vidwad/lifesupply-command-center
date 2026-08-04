import { describe, expect, it } from "vitest";

import {
  buildEligibilitySnapshot,
  ELIGIBILITY_POLICY_VERSION,
  evaluateMarketingEligibility,
  IMPLIED_CONSENT_WINDOW_DAYS,
  type EligibilityInput,
} from "./marketing-eligibility";

const NOW = new Date("2026-08-01T00:00:00Z");
const day = 24 * 60 * 60 * 1000;

function input(over: Partial<EligibilityInput> = {}): EligibilityInput {
  return {
    email: "buyer@example.com",
    consentStatus: "unknown",
    consentBasis: "unknown",
    consentObtainedAt: null,
    consentExpiresAt: null,
    suppressionReason: null,
    lastOrderAt: null,
    deletedAt: null,
    ...over,
  };
}

describe("evaluateMarketingEligibility", () => {
  it("archived customers are never eligible", () => {
    const v = evaluateMarketingEligibility(input({ deletedAt: new Date() }), NOW);
    expect(v).toMatchObject({ eligible: false, code: "archived" });
  });

  it("no email → not contactable", () => {
    expect(evaluateMarketingEligibility(input({ email: null }), NOW).code).toBe("no_email");
    expect(evaluateMarketingEligibility(input({ email: "  " }), NOW).code).toBe("no_email");
  });

  it("suppression always wins — even over express consent evidence", () => {
    for (const status of ["unsubscribed", "cleaned", "complained"]) {
      const v = evaluateMarketingEligibility(
        input({
          consentStatus: status,
          consentBasis: "express",
          consentObtainedAt: new Date("2026-01-01"),
          suppressionReason: `mailchimp_${status}`,
          lastOrderAt: new Date("2026-07-01"),
        }),
        NOW,
      );
      expect(v.eligible).toBe(false);
      expect(v.code).toBe("suppressed");
      expect(v.reasons[0]).toContain("Suppression always wins");
    }
  });

  it("pending double opt-in is ineligible even with a recent purchase", () => {
    const v = evaluateMarketingEligibility(
      input({ consentStatus: "pending", lastOrderAt: new Date("2026-07-01") }),
      NOW,
    );
    expect(v.code).toBe("pending_confirmation");
    expect(v.eligible).toBe(false);
  });

  it("express consent + subscribed → eligible, no expiry", () => {
    const v = evaluateMarketingEligibility(
      input({
        consentStatus: "subscribed",
        consentBasis: "express",
        consentObtainedAt: new Date("2024-05-09"),
      }),
      NOW,
    );
    expect(v).toMatchObject({ eligible: true, code: "eligible_express" });
    expect(v.reasons[0]).toContain("2024-05-09");
  });

  it("express basis WITHOUT subscribed status falls through to implied rules", () => {
    // e.g. basis express recorded but status later drifted to unknown.
    const v = evaluateMarketingEligibility(
      input({ consentStatus: "unknown", consentBasis: "express" }),
      NOW,
    );
    expect(v.eligible).toBe(false);
    expect(v.code).toBe("no_consent_evidence");
  });

  it("recorded implied window in the future → eligible with the end date", () => {
    const v = evaluateMarketingEligibility(
      input({ consentBasis: "implied", consentExpiresAt: new Date("2027-01-15") }),
      NOW,
    );
    expect(v).toMatchObject({ eligible: true, code: "eligible_implied" });
    expect(v.reasons[0]).toContain("2027-01-15");
  });

  it("recorded implied window in the past → ineligible (re-permission)", () => {
    const v = evaluateMarketingEligibility(
      input({ consentBasis: "implied", consentExpiresAt: new Date("2026-07-01") }),
      NOW,
    );
    expect(v.eligible).toBe(false);
    expect(v.reasons[0]).toContain("expired");
  });

  it("derives implied consent from a purchase inside the 24-month EBR window", () => {
    const lastOrderAt = new Date(NOW.getTime() - 100 * day);
    const v = evaluateMarketingEligibility(input({ lastOrderAt }), NOW);
    expect(v).toMatchObject({ eligible: true, code: "eligible_implied" });
    expect(v.reasons[0]).toContain("existing business relationship");
  });

  it("purchase outside the 24-month window → ineligible", () => {
    const lastOrderAt = new Date(NOW.getTime() - (IMPLIED_CONSENT_WINDOW_DAYS + 1) * day);
    const v = evaluateMarketingEligibility(input({ lastOrderAt }), NOW);
    expect(v.eligible).toBe(false);
    expect(v.reasons[0]).toContain("lapsed");
  });

  it("implied window boundary: exactly at expiry is ineligible", () => {
    const lastOrderAt = new Date(NOW.getTime() - IMPLIED_CONSENT_WINDOW_DAYS * day);
    const v = evaluateMarketingEligibility(input({ lastOrderAt }), NOW);
    expect(v.eligible).toBe(false);
  });

  it("no evidence at all → ineligible with the CASL explanation", () => {
    const v = evaluateMarketingEligibility(input(), NOW);
    expect(v).toMatchObject({ eligible: false, code: "no_consent_evidence" });
    expect(v.reasons[0]).toContain("CASL");
  });

  it("transactional-only with a recent purchase gets implied eligibility (EBR)", () => {
    const v = evaluateMarketingEligibility(
      input({
        consentStatus: "transactional",
        consentBasis: "transactional_only",
        lastOrderAt: new Date(NOW.getTime() - 30 * day),
      }),
      NOW,
    );
    expect(v).toMatchObject({ eligible: true, code: "eligible_implied" });
  });

  it("every verdict carries the policy version", () => {
    expect(evaluateMarketingEligibility(input(), NOW).policy).toBe(ELIGIBILITY_POLICY_VERSION);
  });
});

describe("buildEligibilitySnapshot", () => {
  it("summarizes verdicts by code", () => {
    const verdicts = [
      evaluateMarketingEligibility(
        input({ consentStatus: "subscribed", consentBasis: "express" }),
        NOW,
      ),
      evaluateMarketingEligibility(input({ lastOrderAt: new Date(NOW.getTime() - day) }), NOW),
      evaluateMarketingEligibility(input({ consentStatus: "unsubscribed" }), NOW),
    ];
    const snap = buildEligibilitySnapshot(verdicts, NOW);
    expect(snap.total).toBe(3);
    expect(snap.eligible).toBe(2);
    expect(snap.ineligible).toBe(1);
    expect(snap.byCode.eligible_express).toBe(1);
    expect(snap.byCode.eligible_implied).toBe(1);
    expect(snap.byCode.suppressed).toBe(1);
    expect(snap.policy).toBe(ELIGIBILITY_POLICY_VERSION);
    expect(snap.evaluatedAt).toBe(NOW.toISOString());
  });
});
