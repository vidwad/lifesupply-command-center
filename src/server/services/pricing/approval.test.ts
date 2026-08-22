/**
 * DP-5 approval rule tests.
 *
 * Behavioural: each case drives the real eligibility predicate rather than
 * asserting the guard exists in the source. The source-shape canaries proving
 * DP-5 has no price or writeback path live in pricing.test.ts.
 */
import { describe, expect, it } from "vitest";

import {
  canApprove,
  canReject,
  canUserDecide,
  DECISION_PERMISSION,
  isExpired,
  parseRecommendationFilter,
  parseRejectionReason,
  showsDecisionControls,
  type RecommendationLike,
  type RunItemLike,
} from "./approval";

const NOW = new Date("2026-08-22T12:00:00.000Z");
const future = new Date(NOW.getTime() + 60 * 60 * 1000);
const past = new Date(NOW.getTime() - 60 * 60 * 1000);

function rec(overrides: Partial<RecommendationLike> = {}): RecommendationLike {
  return {
    status: "ready_for_review",
    requiresApproval: true,
    recommendedSalePrice: 99.99,
    floorPrice: 70,
    costPrice: 50,
    expiresAt: future,
    ...overrides,
  };
}

const item: RunItemLike = { status: "recommendation_ready", blockedReason: null };

const approve = (o: Partial<RecommendationLike> = {}, i: RunItemLike = item) =>
  canApprove(rec(o), i, NOW);

describe("approving a ready recommendation", () => {
  it("allows a clean, unexpired, above-floor recommendation", () => {
    expect(approve()).toEqual({ allowed: true });
  });

  it("allows one priced exactly at the floor", () => {
    expect(approve({ recommendedSalePrice: 70, floorPrice: 70 }).allowed).toBe(true);
  });

  it("allows one with no expiry set", () => {
    expect(approve({ expiresAt: null }).allowed).toBe(true);
  });
});

describe("approval refusals", () => {
  it("refuses an expired recommendation", () => {
    const verdict = approve({ expiresAt: past });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.reason).toBe("expired");
      expect(verdict.message).toContain("Re-run observation and recommendation generation");
    }
  });

  it("treats an expiry exactly at now as expired", () => {
    expect(isExpired({ expiresAt: NOW }, NOW)).toBe(true);
    expect(approve({ expiresAt: NOW }).allowed).toBe(false);
  });

  for (const status of ["approved", "rejected", "written_back", "failed"] as const) {
    it("refuses a " + status + " recommendation", () => {
      const verdict = approve({ status });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("already_decided");
    });
  }

  for (const status of ["draft", "expired"] as const) {
    it("refuses a " + status + " recommendation as not ready", () => {
      const verdict = approve({ status });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("not_ready");
    });
  }

  it("refuses one below its floor rather than clamping", () => {
    const verdict = approve({ recommendedSalePrice: 69.99, floorPrice: 70 });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.reason).toBe("below_floor");
      expect(verdict.message).toContain("below the $70.00 floor");
    }
  });

  it("refuses one with no proposed price", () => {
    for (const price of [null, 0, -1]) {
      const verdict = approve({ recommendedSalePrice: price });
      expect(verdict.allowed).toBe(false);
      if (!verdict.allowed) expect(verdict.reason).toBe("missing_recommended_price");
    }
  });

  it("refuses one with a missing cost", () => {
    const verdict = approve({ costPrice: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_cost");
  });

  it("refuses one with a missing floor", () => {
    const verdict = approve({ floorPrice: null });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("missing_floor");
  });

  it("refuses one that does not require approval", () => {
    const verdict = approve({ requiresApproval: false });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("approval_not_required");
  });

  it("refuses when the run item is gone", () => {
    const verdict = approve({}, null);
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("item_missing");
  });

  it("refuses when the run item is blocked", () => {
    const verdict = approve({}, { status: "blocked", blockedReason: "missing_cost" });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.reason).toBe("item_blocked");
      expect(verdict.message).toContain("missing_cost");
    }
  });

  it("reports expiry before any price problem", () => {
    // Both wrong; the actionable answer is "your evidence is stale".
    const verdict = approve({ expiresAt: past, recommendedSalePrice: 1, floorPrice: 70 });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe("expired");
  });
});

describe("rejecting", () => {
  it("allows rejecting a ready recommendation with a reason", () => {
    expect(canReject({ status: "ready_for_review" }, "Competitor match is wrong")).toEqual({
      allowed: true,
    });
  });

  it("refuses rejection with no reason", () => {
    for (const reason of ["", "   ", "\n\t "]) {
      expect(canReject({ status: "ready_for_review" }, reason).allowed).toBe(false);
    }
  });

  for (const status of ["approved", "rejected", "written_back", "failed"] as const) {
    it("refuses rejecting a " + status + " recommendation", () => {
      expect(canReject({ status }, "reason").allowed).toBe(false);
    });
  }

  it("still allows rejecting a time-expired ready recommendation", () => {
    // Rejection is the conservative direction. Refusing would strand rows.
    expect(canReject({ status: "ready_for_review" }, "stale, not worth re-checking").allowed).toBe(
      true,
    );
  });
});

describe("rejection reason parsing", () => {
  it("rejects blank, short, and non-string input", () => {
    expect(parseRejectionReason("")).toBeNull();
    expect(parseRejectionReason("  ")).toBeNull();
    expect(parseRejectionReason("no")).toBeNull();
    expect(parseRejectionReason(null)).toBeNull();
    expect(parseRejectionReason(42)).toBeNull();
  });

  it("normalises CRLF before measuring, so a textarea reason is not mis-sized", () => {
    expect(parseRejectionReason("a\r\nb")).toBe("a\nb");
  });

  it("trims and caps a long reason", () => {
    expect(parseRejectionReason("  wrong SKU  ")).toBe("wrong SKU");
    expect(parseRejectionReason("x".repeat(5000))?.length).toBe(1000);
  });
});

describe("decision permission", () => {
  it("requires pricing.approve_recommendations", () => {
    expect(DECISION_PERMISSION).toBe("pricing.approve_recommendations");
    expect(canUserDecide({ permissions: ["pricing.approve_recommendations"] })).toBe(true);
  });

  it("denies a user who can only view or only review", () => {
    expect(canUserDecide({ permissions: ["pricing.view"] })).toBe(false);
    expect(canUserDecide({ permissions: ["pricing.review_recommendations"] })).toBe(false);
    expect(canUserDecide({ permissions: ["pricing.view", "pricing.review_recommendations"] })).toBe(
      false,
    );
  });

  it("denies an absent or malformed user", () => {
    expect(canUserDecide(null)).toBe(false);
    expect(canUserDecide(undefined)).toBe(false);
    expect(canUserDecide({ permissions: [] })).toBe(false);
  });
});

describe("when decision controls render", () => {
  const decider = { permissions: ["pricing.approve_recommendations"] };

  it("shows for an eligible ready recommendation held by a decider", () => {
    expect(showsDecisionControls({ recommendation: rec(), item, user: decider, now: NOW })).toBe(
      true,
    );
  });

  it("hides from a user without the decision permission", () => {
    expect(
      showsDecisionControls({
        recommendation: rec(),
        item,
        user: { permissions: ["pricing.view", "pricing.review_recommendations"] },
        now: NOW,
      }),
    ).toBe(false);
  });

  it("hides for an expired recommendation", () => {
    expect(
      showsDecisionControls({
        recommendation: rec({ expiresAt: past }),
        item,
        user: decider,
        now: NOW,
      }),
    ).toBe(false);
  });

  for (const status of ["approved", "rejected", "expired", "written_back", "failed"] as const) {
    it("hides for a " + status + " recommendation", () => {
      expect(
        showsDecisionControls({ recommendation: rec({ status }), item, user: decider, now: NOW }),
      ).toBe(false);
    });
  }
});

describe("queue filters", () => {
  it("accepts every supported filter", () => {
    for (const value of [
      "ready_for_review",
      "approved",
      "rejected",
      "expired",
      "written_back",
      "failed",
      "all",
    ]) {
      expect(parseRecommendationFilter(value)).toBe(value);
    }
  });

  it("falls back to ready_for_review on anything unexpected", () => {
    // Never falls back to "all": a bad query string must not silently widen
    // what a page shows.
    expect(parseRecommendationFilter("bogus")).toBe("ready_for_review");
    expect(parseRecommendationFilter(undefined)).toBe("ready_for_review");
    expect(parseRecommendationFilter(123)).toBe("ready_for_review");
  });
});
