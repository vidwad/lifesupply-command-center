/**
 * DP-4 recommendation engine tests.
 *
 * Behavioural throughout: each case drives calculateRecommendation and asserts
 * the decision and the number, not that some guard string exists in the source.
 * The source-shape canaries for DP-4 live in pricing.test.ts.
 */
import { describe, expect, it } from "vitest";

import {
  calculateRecommendation,
  currentEffective,
  lowestUsable,
  margin,
  screenObservations,
  type ItemInput,
  type ObservationInput,
  type RuleSettings,
} from "./recommendation";

const NOW = new Date("2026-08-21T12:00:00.000Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 60 * 60 * 1000);

const RULE: RuleSettings = {
  minCostMultiplier: 1.4,
  undercutAmount: 0.01,
  maxIncreasePct: 10,
  maxDecreasePct: 20,
  minConfidence: 0.85,
  evidenceFreshnessHours: 48,
};

function item(overrides: Partial<ItemInput> = {}): ItemInput {
  return {
    id: "item-1",
    sku: "SKU-1",
    status: "checked",
    blockedReason: null,
    costPrice: 50,
    floorPrice: 70, // 50 x 1.40
    currentRegularPrice: 120,
    currentSalePrice: null,
    currentEffectivePrice: 120,
    ...overrides,
  };
}

function observation(overrides: Partial<ObservationInput> = {}): ObservationInput {
  return {
    id: "obs-1",
    competitorId: "comp-1",
    status: "valid",
    observedEffectivePrice: 100,
    currency: null,
    matchConfidence: 0.9,
    checkedAt: hoursAgo(1),
    ...overrides,
  };
}

const run = (
  observations: ObservationInput[],
  itemOverrides: Partial<ItemInput> = {},
  ruleOverrides: Partial<RuleSettings> = {},
) =>
  calculateRecommendation({
    item: item(itemOverrides),
    observations,
    rule: { ...RULE, ...ruleOverrides },
    runStatus: "completed",
    now: NOW,
  });

describe("reduce", () => {
  it("undercuts the cheapest competitor when the floor allows it", () => {
    const result = run([observation({ observedEffectivePrice: 100 })]);
    expect(result.type).toBe("reduce");
    expect(result.recommendedSalePrice).toBe(99.99);
    expect(result.lowestCompetitorPrice).toBe(100);
    expect(result.reason).toContain("Reduce from $120.00 to $99.99");
  });

  it("selects the lowest valid competitor price across several competitors", () => {
    const result = run([
      observation({ id: "a", competitorId: "c1", observedEffectivePrice: 110 }),
      observation({ id: "b", competitorId: "c2", observedEffectivePrice: 95 }),
      observation({ id: "c", competitorId: "c3", observedEffectivePrice: 104 }),
    ]);
    expect(result.lowestCompetitorPrice).toBe(95);
    expect(result.recommendedSalePrice).toBe(94.99);
    expect(result.usedObservationIds).toEqual(["a", "b", "c"]);
  });

  it("ignores a cheaper competitor whose observation is not valid", () => {
    const result = run([
      observation({ id: "good", observedEffectivePrice: 100 }),
      observation({ id: "cheap", observedEffectivePrice: 60, status: "low_confidence" }),
    ]);
    expect(result.lowestCompetitorPrice).toBe(100);
    expect(result.usedObservationIds).toEqual(["good"]);
  });
});

describe("blocked_margin_floor", () => {
  it("refuses to undercut below the floor rather than clamping to it", () => {
    // Floor 70; competitor at 70 means the undercut target is 69.99.
    const result = run([observation({ observedEffectivePrice: 70 })]);
    expect(result.type).toBe("blocked_margin_floor");
    expect(result.recommendedSalePrice).toBeNull();
    expect(result.reason).toContain("would break the $70.00 floor");
  });

  it("uses the stored floor, not one recomputed from a since-edited rule", () => {
    // Stored floor 90 is higher than cost x multiplier (50 x 1.4 = 70). If the
    // engine recomputed, this would become a reduce at 84.99.
    const result = run([observation({ observedEffectivePrice: 85 })], { floorPrice: 90 });
    expect(result.type).toBe("blocked_margin_floor");
    expect(result.floorPrice).toBe(90);
  });
});

describe("increase", () => {
  it("raises toward the cheapest competitor when we are already cheapest", () => {
    const result = run([observation({ observedEffectivePrice: 100 })], {
      currentRegularPrice: 95,
      currentEffectivePrice: 95,
    });
    expect(result.type).toBe("increase");
    expect(result.recommendedSalePrice).toBe(99.99);
  });

  it("caps the rise at maxIncreasePct and stays below the competitor", () => {
    // Current 80, cap = 80 x 1.10 = 88. Raw target would be 99.99.
    const result = run([observation({ observedEffectivePrice: 100 })], {
      currentRegularPrice: 80,
      currentEffectivePrice: 80,
    });
    expect(result.type).toBe("increase");
    expect(result.recommendedSalePrice).toBe(88);
    expect(result.recommendedSalePrice as number).toBeLessThan(100);
    expect(result.reason).toContain("Capped by the 10% maximum increase");
  });

  it("always lands strictly below the competitor, capped or not", () => {
    // The capped branch cannot produce a price at or above the competitor:
    // proposed = lowest - undercut, so proposed > cap implies lowest > cap.
    // Sweep a range of current prices and assert the invariant directly.
    for (const current of [10, 50, 80, 90, 95, 99, 99.5]) {
      const result = run([observation({ observedEffectivePrice: 100 })], {
        currentRegularPrice: current,
        currentEffectivePrice: current,
        costPrice: 5,
        floorPrice: 7,
      });
      expect(["increase", "no_change"]).toContain(result.type);
      expect(result.recommendedSalePrice as number).toBeLessThan(100);
    }
  });
});

describe("no_change", () => {
  it("holds when the available move is smaller than the undercut amount", () => {
    // Current 99.995 is not realistic; use a 1-cent gap: target 99.99 vs 99.99.
    const result = run([observation({ observedEffectivePrice: 100 })], {
      currentRegularPrice: 99.99,
      currentEffectivePrice: 99.99,
    });
    expect(result.type).toBe("no_change");
    expect(result.recommendedSalePrice).toBe(99.99);
  });

  it("reports margin after equal to margin before", () => {
    const result = run([observation({ observedEffectivePrice: 100 })], {
      currentRegularPrice: 99.99,
      currentEffectivePrice: 99.99,
    });
    expect(result.marginAfter).toBe(result.marginBefore);
  });
});

describe("blocked inputs", () => {
  it("blocks a missing cost", () => {
    const result = run([observation()], { costPrice: null });
    expect(result.type).toBe("blocked_missing_cost");
    expect(result.recommendedSalePrice).toBeNull();
  });

  it("derives a floor when none is stored and says so in the reason", () => {
    const result = run([observation({ observedEffectivePrice: 100 })], { floorPrice: null });
    expect(result.type).toBe("reduce");
    expect(result.floorPrice).toBe(70);
    expect(result.reason).toContain("Floor was not stored");
  });

  it("blocks when no floor is stored and none can be derived", () => {
    const result = run([observation()], { floorPrice: null }, { minCostMultiplier: 0 });
    expect(result.type).toBe("manual_review");
    expect(result.reason).toContain("no usable cost multiplier");
    expect(result.recommendedSalePrice).toBeNull();
  });

  it("blocks when there is no current effective price", () => {
    const result = run([observation()], {
      currentRegularPrice: null,
      currentSalePrice: null,
      currentEffectivePrice: null,
    });
    expect(result.type).toBe("manual_review");
    expect(result.reason).toContain("No current effective price");
  });

  it("blocks an item the list builder already blocked", () => {
    const result = run([observation()], { status: "blocked", blockedReason: "missing_cost" });
    expect(result.type).toBe("manual_review");
    expect(result.reason).toContain("missing_cost");
  });

  it("refuses to price a cancelled run", () => {
    const result = calculateRecommendation({
      item: item(),
      observations: [observation()],
      rule: RULE,
      runStatus: "cancelled",
      now: NOW,
    });
    expect(result.type).toBe("manual_review");
    expect(result.recommendedSalePrice).toBeNull();
  });
});

describe("evidence screening", () => {
  it("blocks when there are no observations at all", () => {
    const result = run([]);
    expect(result.type).toBe("blocked_no_valid_observation");
  });

  it("blocks on stale evidence", () => {
    const result = run([observation({ checkedAt: hoursAgo(72) })]);
    expect(result.type).toBe("blocked_stale_evidence");
    expect(result.reason).toContain("limit 48h");
  });

  it("treats an observation with no checkedAt as stale", () => {
    const result = run([observation({ checkedAt: null })]);
    expect(result.type).toBe("blocked_stale_evidence");
  });

  it("blocks when every fresh observation is below minConfidence", () => {
    const result = run([observation({ matchConfidence: 0.5 })]);
    expect(result.type).toBe("blocked_low_confidence");
  });

  it("reports stale rather than low confidence when an observation is both", () => {
    const result = run([observation({ checkedAt: hoursAgo(72), matchConfidence: 0.1 })]);
    expect(result.type).toBe("blocked_stale_evidence");
  });

  for (const status of ["low_confidence", "failed", "invalid", "unavailable"] as const) {
    it("ignores a " + status + " observation", () => {
      const result = run([observation({ status })]);
      expect(result.type).toBe("blocked_no_valid_observation");
      expect(result.usedObservationIds).toEqual([]);
    });
  }

  it("ignores a valid observation with no numeric price", () => {
    const result = run([observation({ observedEffectivePrice: null })]);
    expect(result.type).toBe("blocked_no_valid_observation");
  });

  it("refuses to compare across two stated currencies", () => {
    const result = run([
      observation({ id: "a", observedEffectivePrice: 100, currency: "CAD" }),
      observation({ id: "b", observedEffectivePrice: 70, currency: "USD" }),
    ]);
    expect(result.type).toBe("manual_review");
    expect(result.reason).toContain("more than one currency");
  });

  it("drops an observation whose stated currency differs from the run currency", () => {
    const screen = screenObservations({
      observations: [observation({ currency: "USD" })],
      rule: RULE,
      runCurrency: "CAD",
      now: NOW,
    });
    expect(screen.usable).toEqual([]);
    expect(screen.rejected.currency_mismatch).toBe(1);
  });
});

describe("large decreases", () => {
  it("still recommends a cut beyond maxDecreasePct but flags it in the reason", () => {
    // Current 120, 20% guideline = 96. Competitor at 80 targets 79.99, which is
    // above the 70 floor, so the spec requires a reduce — annotated, not blocked.
    const result = run([observation({ observedEffectivePrice: 80 })], { floorPrice: 70 });
    expect(result.type).toBe("reduce");
    expect(result.recommendedSalePrice).toBe(79.99);
    expect(result.reason).toContain("more than the 20% guideline");
  });

  it("does not flag an ordinary cut", () => {
    const result = run([observation({ observedEffectivePrice: 110 })]);
    expect(result.type).toBe("reduce");
    expect(result.reason).not.toContain("guideline");
  });
});

describe("margins", () => {
  it("computes margin before and after against the selling price", () => {
    const result = run([observation({ observedEffectivePrice: 100 })]);
    // before: (120 - 50) / 120; after: (99.99 - 50) / 99.99
    expect(result.marginBefore).toBeCloseTo(0.5833, 4);
    expect(result.marginAfter).toBeCloseTo(0.4999, 4);
  });

  it("returns null instead of dividing by zero", () => {
    expect(margin(0, 50)).toBeNull();
    expect(margin(null, 50)).toBeNull();
    expect(margin(100, null)).toBeNull();
  });

  it("reports a negative margin when cost exceeds price", () => {
    expect(margin(40, 50)).toBeCloseTo(-0.25, 4);
  });
});

describe("helpers", () => {
  it("prefers a positive sale price over the regular price", () => {
    expect(currentEffective(item({ currentEffectivePrice: null, currentSalePrice: 80 }))).toBe(80);
    expect(currentEffective(item({ currentEffectivePrice: null, currentSalePrice: 0 }))).toBe(120);
  });

  it("breaks a price tie on the more confident observation", () => {
    const best = lowestUsable([
      observation({ id: "low", observedEffectivePrice: 90, matchConfidence: 0.86 }),
      observation({ id: "high", observedEffectivePrice: 90, matchConfidence: 0.99 }),
    ]);
    expect(best?.id).toBe("high");
  });

  it("sets an expiry from the driving observation plus the freshness window", () => {
    const result = run([observation({ checkedAt: hoursAgo(2) })]);
    expect(result.expiresAt?.toISOString()).toBe(
      new Date(hoursAgo(2).getTime() + 48 * 60 * 60 * 1000).toISOString(),
    );
  });
});
