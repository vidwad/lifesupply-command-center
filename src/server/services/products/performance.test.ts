import { describe, expect, it } from "vitest";

import {
  classifyProducts,
  parsePerformanceSegment,
  parseTopSellerLimit,
  performanceDefinitions,
  PERFORMANCE_DEFINITIONS,
  PERFORMANCE_SEGMENTS,
  segmentIdFilter,
  TOP_SELLER_DEFAULT,
  TOP_SELLER_MAX,
  type ProductSales,
} from "./performance";

const sales = (over: Partial<ProductSales>): ProductSales => ({
  unitsLifetime: 0,
  units90: 0,
  revenue90: 0,
  units30: 0,
  unitsPrior30: 0,
  ...over,
});

const now = new Date("2026-10-26T12:00:00Z");

describe("classifying products by sales", () => {
  it("ranks top sellers by 90-day revenue and caps the list at 200 by default", () => {
    const stats = new Map<string, ProductSales>();
    for (let i = 0; i < TOP_SELLER_DEFAULT + 5; i += 1) {
      stats.set("p" + String(i), sales({ unitsLifetime: 1, units90: 1, revenue90: 1000 - i }));
    }
    const index = classifyProducts(stats, now);
    expect(TOP_SELLER_DEFAULT).toBe(200);
    expect(index.topIds).toHaveLength(TOP_SELLER_DEFAULT);
    expect(index.topLimit).toBe(TOP_SELLER_DEFAULT);
    expect(index.topIds[0]).toBe("p0");
    expect(index.topIds).not.toContain("p" + String(TOP_SELLER_DEFAULT + 4));
  });

  it("caps the top sellers at the number the reader asked for", () => {
    const stats = new Map<string, ProductSales>();
    for (let i = 0; i < 10; i += 1) {
      stats.set("p" + String(i), sales({ unitsLifetime: 1, units90: 1, revenue90: 100 - i }));
    }
    const index = classifyProducts(stats, now, 3);
    expect(index.topIds).toEqual(["p0", "p1", "p2"]);
    expect(index.topLimit).toBe(3);
  });

  it("calls a product cold when it sold before but not in the window", () => {
    const index = classifyProducts(
      new Map([
        ["old", sales({ unitsLifetime: 12 })],
        ["live", sales({ unitsLifetime: 12, units90: 3, revenue90: 90 })],
      ]),
      now,
    );
    expect(index.coldIds).toEqual(["old"]);
    expect(index.soldIds.sort()).toEqual(["live", "old"]);
  });

  it("calls a product promising when recent sales rise, or are all it has, with at least two units", () => {
    const index = classifyProducts(
      new Map([
        [
          "rising",
          sales({ unitsLifetime: 9, units90: 6, revenue90: 60, units30: 4, unitsPrior30: 2 }),
        ],
        [
          "new",
          sales({ unitsLifetime: 3, units90: 3, revenue90: 30, units30: 3, unitsPrior30: 0 }),
        ],
        [
          "flat",
          sales({ unitsLifetime: 9, units90: 6, revenue90: 60, units30: 3, unitsPrior30: 3 }),
        ],
        [
          "single",
          sales({ unitsLifetime: 1, units90: 1, revenue90: 10, units30: 1, unitsPrior30: 0 }),
        ],
      ]),
      now,
    );
    expect(index.promisingIds.sort()).toEqual(["new", "rising"]);
  });

  it("leaves products with no sales out of every sold set, so they are the non-sellers", () => {
    const index = classifyProducts(new Map([["ghost", sales({})]]), now);
    expect(index.soldIds).toEqual([]);
    expect(segmentIdFilter("non_seller", index)).toEqual({ notIn: [] });
    expect(segmentIdFilter("top", index)).toEqual({ in: [] });
  });
});

describe("the top-seller count", () => {
  it("defaults to 200 for anything that is not a whole number from 1 up", () => {
    expect(parseTopSellerLimit(undefined)).toBe(200);
    expect(parseTopSellerLimit("")).toBe(200);
    expect(parseTopSellerLimit("0")).toBe(200);
    expect(parseTopSellerLimit("-5")).toBe(200);
    expect(parseTopSellerLimit("12.5")).toBe(200);
    expect(parseTopSellerLimit("fifty")).toBe(200);
  });

  it("takes a whole number and holds it to the ceiling", () => {
    expect(parseTopSellerLimit("50")).toBe(50);
    expect(parseTopSellerLimit(" 300 ")).toBe(300);
    expect(parseTopSellerLimit("1")).toBe(1);
    expect(parseTopSellerLimit("999999999")).toBe(TOP_SELLER_MAX);
  });

  it("states the chosen count in the top-seller definition", () => {
    expect(performanceDefinitions(300).top.definition).toBe(
      "The 300 products with the most revenue in the last 90 days.",
    );
    expect(PERFORMANCE_DEFINITIONS.top.definition).toContain("The 200 products");
    expect(performanceDefinitions(300).cold).toEqual(PERFORMANCE_DEFINITIONS.cold);
  });
});

describe("the segment vocabulary", () => {
  it("parses only the four segments and defines each in words with its window", () => {
    expect(parsePerformanceSegment("cold")).toBe("cold");
    expect(parsePerformanceSegment("hot")).toBeUndefined();
    for (const segment of PERFORMANCE_SEGMENTS) {
      expect(PERFORMANCE_DEFINITIONS[segment].label.length).toBeGreaterThan(2);
      expect(PERFORMANCE_DEFINITIONS[segment].definition).toMatch(/\.$/);
    }
    expect(PERFORMANCE_DEFINITIONS.top.definition).toContain("90 days");
    expect(PERFORMANCE_DEFINITIONS.cold.definition).toContain("90 days");
  });
});
