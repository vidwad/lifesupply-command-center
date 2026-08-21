import { describe, expect, it } from "vitest";

import {
  buildItems,
  ListBuilderInputError,
  MAX_TARGET_COUNT,
  parseLookbackWindow,
  parseRankingBasis,
  parseTargetCount,
  effectivePrice,
  floorPrice,
  rankCandidates,
  rankingValue,
  summarise,
  type CandidateItem,
} from "./list-builder";

const candidate = (over: Partial<CandidateItem> = {}): CandidateItem => ({
  sku: "SKU-1",
  productId: "p1",
  productVariantId: "v1",
  productName: "Widget",
  currentRegularPrice: 100,
  currentSalePrice: null,
  costPrice: 40,
  costSource: "variant",
  quantitySold: 10,
  revenue: 1000,
  estimatedGrossProfit: 600,
  ...over,
});

describe("effectivePrice", () => {
  it("prefers a live sale price", () => {
    expect(effectivePrice(100, 80)).toBe(80);
  });

  it("ignores a zero or absent sale price", () => {
    expect(effectivePrice(100, 0)).toBe(100);
    expect(effectivePrice(100, null)).toBe(100);
  });

  it("returns null when neither price is usable", () => {
    expect(effectivePrice(null, null)).toBeNull();
    expect(effectivePrice(0, 0)).toBeNull();
  });
});

describe("floorPrice", () => {
  it("applies the rule multiplier and rounds to cents", () => {
    expect(floorPrice(40, 1.4)).toBe(56);
    expect(floorPrice(13.33, 1.4)).toBe(18.66);
  });

  it("returns null without a usable cost, so no floor is invented", () => {
    expect(floorPrice(null, 1.4)).toBeNull();
    expect(floorPrice(0, 1.4)).toBeNull();
    expect(floorPrice(-5, 1.4)).toBeNull();
  });

  it("returns null for a nonsensical multiplier rather than a zero floor", () => {
    // A zero floor would permit any price at all.
    expect(floorPrice(40, 0)).toBeNull();
    expect(floorPrice(40, Number.NaN)).toBeNull();
  });
});

describe("rankingValue", () => {
  const item = candidate({ revenue: 1000, quantitySold: 10, estimatedGrossProfit: 200 });

  it("ranks by the requested basis", () => {
    expect(rankingValue(item, "revenue")).toBe(1000);
    expect(rankingValue(item, "units")).toBe(10);
    expect(rankingValue(item, "gross_profit")).toBe(200);
  });

  it("weights margin_opportunity toward high revenue at thin margin", () => {
    const thin = candidate({ revenue: 1000, estimatedGrossProfit: 100 });
    const fat = candidate({ revenue: 1000, estimatedGrossProfit: 900 });
    expect(rankingValue(thin, "margin_opportunity")).toBeGreaterThan(
      rankingValue(fat, "margin_opportunity"),
    );
  });

  it("falls back to revenue when margin is unknown", () => {
    const unknown = candidate({ revenue: 1000, estimatedGrossProfit: null });
    expect(rankingValue(unknown, "margin_opportunity")).toBe(1000);
  });
});

describe("rankCandidates", () => {
  it("takes the top N by basis", () => {
    const items = [
      candidate({ sku: "A", revenue: 10 }),
      candidate({ sku: "B", revenue: 300 }),
      candidate({ sku: "C", revenue: 200 }),
    ];
    expect(rankCandidates(items, "revenue", 2).map((i) => i.sku)).toEqual(["B", "C"]);
  });

  it("breaks ties deterministically so a rebuilt run reproduces the list", () => {
    const items = [candidate({ sku: "B", revenue: 100 }), candidate({ sku: "A", revenue: 100 })];
    expect(rankCandidates(items, "revenue", 2).map((i) => i.sku)).toEqual(["A", "B"]);
  });

  it("returns nothing for a non-positive target", () => {
    expect(rankCandidates([candidate()], "revenue", 0)).toEqual([]);
  });
});

describe("buildItems — guardrails", () => {
  it("blocks an item with no cost basis", () => {
    // Guardrail: no product proceeds to a price check without a cost.
    const [item] = buildItems([candidate({ costPrice: null, costSource: "none" })], 1.4);
    expect(item?.status).toBe("blocked");
    expect(item?.blockedReason).toBe("missing_cost");
    expect(item?.floorPrice).toBeNull();
  });

  it("treats a zero cost as missing rather than as a zero floor", () => {
    const [item] = buildItems([candidate({ costPrice: 0 })], 1.4);
    expect(item?.blockedReason).toBe("missing_cost");
  });

  it("blocks an item with no usable price", () => {
    const [item] = buildItems(
      [candidate({ currentRegularPrice: null, currentSalePrice: null })],
      1.4,
    );
    expect(item?.blockedReason).toBe("invalid_price");
  });

  it("blocks a product already selling below its own floor", () => {
    // A price check cannot help, and raising to the floor is a pricing
    // decision nobody has approved.
    const [item] = buildItems([candidate({ costPrice: 40, currentRegularPrice: 50 })], 1.4);
    expect(item?.floorPrice).toBe(56);
    expect(item?.blockedReason).toBe("floor_above_price");
  });

  it("keeps the first of a duplicate SKU and blocks the rest", () => {
    const items = buildItems(
      [candidate({ sku: "DUP" }), candidate({ sku: "dup" }), candidate({ sku: "DUP" })],
      1.4,
    );
    expect(items[0]?.status).toBe("pending");
    expect(items[1]?.blockedReason).toBe("duplicate_sku");
    expect(items[2]?.blockedReason).toBe("duplicate_sku");
  });

  it("retains blocked rows instead of dropping them", () => {
    // A silently shortened list is indistinguishable from a product that
    // simply did not sell.
    const items = buildItems([candidate({ costPrice: null }), candidate({ sku: "OK" })], 1.4);
    expect(items).toHaveLength(2);
  });

  it("passes a well-formed item with its floor computed", () => {
    const [item] = buildItems([candidate()], 1.4);
    expect(item?.status).toBe("pending");
    expect(item?.blockedReason).toBeNull();
    expect(item?.currentEffectivePrice).toBe(100);
    expect(item?.floorPrice).toBe(56);
  });

  it("records the cost source alongside the cost", () => {
    const [item] = buildItems([candidate({ costSource: "order_history" })], 1.4);
    expect(item?.costSource).toBe("order_history");
  });
});

describe("summarise", () => {
  it("counts each blocking reason for the run detail page", () => {
    const summary = summarise(
      buildItems(
        [
          candidate({ sku: "OK" }),
          candidate({ sku: "NOCOST", costPrice: null }),
          candidate({ sku: "DUP" }),
          candidate({ sku: "DUP" }),
          candidate({ sku: "LOW", currentRegularPrice: 10 }),
        ],
        1.4,
      ),
    );
    expect(summary.total).toBe(5);
    expect(summary.pending).toBe(2);
    expect(summary.blocked).toBe(3);
    expect(summary.missingCost).toBe(1);
    expect(summary.duplicates).toBe(1);
    expect(summary.belowFloor).toBe(1);
  });
});

describe("input validation (DP-2A)", () => {
  it("accepts every documented ranking basis", () => {
    for (const basis of ["revenue", "units", "gross_profit", "margin_opportunity"]) {
      expect(parseRankingBasis(basis)).toBe(basis);
    }
  });

  it("rejects an unknown ranking basis rather than defaulting", () => {
    // Defaulting would silently rank by something the operator did not choose.
    for (const bad of ["profit", "", null, undefined, 7, "REVENUE"]) {
      expect(() => parseRankingBasis(bad)).toThrow(ListBuilderInputError);
    }
  });

  it("accepts only the offered lookback windows", () => {
    for (const days of [30, 90, 180, 365]) {
      expect(parseLookbackWindow(days)).toBe(days);
      expect(parseLookbackWindow(String(days))).toBe(days);
    }
  });

  it("rejects an arbitrary lookback window", () => {
    for (const bad of [0, -30, 45, 3650, "ninety", null]) {
      expect(() => parseLookbackWindow(bad)).toThrow(ListBuilderInputError);
    }
  });

  it("requires a positive whole target count", () => {
    expect(parseTargetCount(500)).toBe(500);
    expect(parseTargetCount("500")).toBe(500);
    for (const bad of [0, -1, 1.5, "abc", null, undefined, Number.NaN]) {
      expect(() => parseTargetCount(bad)).toThrow(ListBuilderInputError);
    }
  });

  it("caps the target count at the documented maximum", () => {
    // The cap exists because target count drives how many products a later
    // phase will fetch prices for; an accidental 150000 commits the operation
    // to a workload nobody sized.
    expect(parseTargetCount(MAX_TARGET_COUNT)).toBe(MAX_TARGET_COUNT);
    expect(() => parseTargetCount(MAX_TARGET_COUNT + 1)).toThrow(/cannot exceed 1500/);
  });
});
