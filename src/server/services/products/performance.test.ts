import { describe, expect, it } from "vitest";

import {
  classifyProducts,
  customRange,
  DEFAULT_RANGE_KEY,
  parseIsoDay,
  parsePerformanceRange,
  parsePerformanceSegment,
  parseTopSellerLimit,
  performanceDefinitions,
  PERFORMANCE_DEFINITIONS,
  PERFORMANCE_SEGMENTS,
  presetRange,
  RANGE_PRESETS,
  rangeSearchParams,
  salesInRange,
  segmentIdFilter,
  TOP_SELLER_DEFAULT,
  TOP_SELLER_MAX,
  type ProductDaySeries,
  type ProductSales,
} from "./performance";

const sales = (over: Partial<ProductSales>): ProductSales => ({
  unitsLifetime: 0,
  unitsRange: 0,
  revenueRange: 0,
  unitsRecent: 0,
  unitsEarlier: 0,
  ...over,
});

const today = new Date("2026-10-30T15:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const dayOf = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);
const range90 = presetRange("90d", today);

describe("the range presets", () => {
  it("offer 30, 60 and 90 days, 6 months and a year, and default to 90 days", () => {
    expect(RANGE_PRESETS.map((p) => p.key)).toEqual(["30d", "60d", "90d", "6m", "1y"]);
    expect(DEFAULT_RANGE_KEY).toBe("90d");
  });

  it("end today, today included, and count whole days", () => {
    const r = presetRange("30d", today);
    expect(r.to).toBe("2026-10-30");
    expect(r.from).toBe("2026-10-01");
    expect(r.days).toBe(30);
    expect(r.end.toISOString()).toBe("2026-10-31T00:00:00.000Z");
    expect(r.description).toBe("the last 30 days");
    expect(r.short).toBe("30d");
  });

  it("measure months by the calendar", () => {
    expect(presetRange("6m", today).from).toBe("2026-05-01");
    expect(presetRange("1y", today).from).toBe("2025-10-31");
    expect(presetRange("1y", today).description).toBe("the last year");
  });
});

describe("parsing the range", () => {
  it("reads a preset key and falls back to the default", () => {
    expect(parsePerformanceRange({ range: "60d" }, today).key).toBe("60d");
    expect(parsePerformanceRange({ range: "fortnight" }, today).key).toBe("90d");
    expect(parsePerformanceRange({}, today).key).toBe("90d");
  });

  it("makes a custom range from a start and end date, both included", () => {
    const r = parsePerformanceRange({ from: "2026-01-01", to: "2026-03-31" }, today);
    expect(r.key).toBe("custom");
    expect(r.from).toBe("2026-01-01");
    expect(r.to).toBe("2026-03-31");
    expect(r.days).toBe(90);
    expect(r.description).toBe("Jan 1, 2026 to Mar 31, 2026");
    expect(r.short).toBe("custom");
  });

  it("runs a start date to today when no end is given, and lets dates beat a preset key", () => {
    const r = parsePerformanceRange({ range: "30d", from: "2026-10-20", to: "" }, today);
    expect(r.key).toBe("custom");
    expect(r.to).toBe("2026-10-30");
    expect(r.days).toBe(11);
  });

  it("ignores an end before the start, a start after today and malformed dates", () => {
    expect(parsePerformanceRange({ from: "2026-03-31", to: "2026-01-01" }, today).key).toBe("90d");
    expect(parsePerformanceRange({ from: "2026-12-01" }, today).key).toBe("90d");
    expect(parsePerformanceRange({ from: "2026-02-30", to: "2026-03-01" }, today).key).toBe("90d");
    expect(parsePerformanceRange({ from: "yesterday" }, today).key).toBe("90d");
    expect(parseIsoDay("2026-1-5")).toBeNull();
    expect(parseIsoDay(" 2026-01-05 ")).toBe(dayOf("2026-01-05"));
  });

  it("carries nothing for the default, the key for a preset, the dates for custom", () => {
    expect(rangeSearchParams(range90)).toEqual({});
    expect(rangeSearchParams(presetRange("6m", today))).toEqual({ range: "6m" });
    expect(rangeSearchParams(customRange(dayOf("2026-01-01"), dayOf("2026-01-31")))).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });
});

describe("summing the day series into a range", () => {
  const product = (entries: [string, number, number][]): ProductDaySeries => ({
    days: entries.map(([d]) => dayOf(d)),
    units: entries.map(([, u]) => u),
    revenue: entries.map(([, , r]) => r),
    unitsLifetime: entries.reduce((sum, [, u]) => sum + u, 0),
  });

  it("counts only the days inside the range and splits them at the midpoint", () => {
    const series = new Map([
      [
        "p",
        product([
          ["2025-01-10", 5, 50], // long ago: lifetime only
          ["2026-08-01", 1, 10], // 90 days back from Oct 30 starts Aug 2: outside
          ["2026-08-02", 2, 20], // first day of the range, first half
          ["2026-09-15", 3, 30], // first half (midpoint is Sep 16)
          ["2026-09-16", 4, 40], // second half
          ["2026-10-30", 6, 60], // today, included
          ["2026-10-31", 7, 70], // tomorrow: outside
        ]),
      ],
    ]);
    expect(salesInRange(series, range90).get("p")).toEqual({
      unitsLifetime: 28,
      unitsRange: 15,
      revenueRange: 150,
      unitsRecent: 10,
      unitsEarlier: 5,
    });
  });

  it("answers a custom range from the same series", () => {
    const series = new Map([
      [
        "p",
        product([
          ["2026-01-15", 2, 20],
          ["2026-02-15", 3, 30],
        ]),
      ],
    ]);
    const january = customRange(dayOf("2026-01-01"), dayOf("2026-01-31"));
    expect(salesInRange(series, january).get("p")).toMatchObject({
      unitsRange: 2,
      revenueRange: 20,
      unitsLifetime: 5,
    });
  });
});

describe("classifying products by sales", () => {
  it("ranks top sellers by revenue in the range and caps the list at 200 by default", () => {
    const stats = new Map<string, ProductSales>();
    for (let i = 0; i < TOP_SELLER_DEFAULT + 5; i += 1) {
      stats.set(
        "p" + String(i),
        sales({ unitsLifetime: 1, unitsRange: 1, revenueRange: 1000 - i }),
      );
    }
    const index = classifyProducts(stats, range90);
    expect(TOP_SELLER_DEFAULT).toBe(200);
    expect(index.topIds).toHaveLength(TOP_SELLER_DEFAULT);
    expect(index.topLimit).toBe(TOP_SELLER_DEFAULT);
    expect(index.topIds[0]).toBe("p0");
    expect(index.topIds).not.toContain("p" + String(TOP_SELLER_DEFAULT + 4));
    expect(index.range).toBe(range90);
  });

  it("caps the top sellers at the number the reader asked for", () => {
    const stats = new Map<string, ProductSales>();
    for (let i = 0; i < 10; i += 1) {
      stats.set("p" + String(i), sales({ unitsLifetime: 1, unitsRange: 1, revenueRange: 100 - i }));
    }
    const index = classifyProducts(stats, range90, 3);
    expect(index.topIds).toEqual(["p0", "p1", "p2"]);
    expect(index.topLimit).toBe(3);
  });

  it("calls a product cold when it sold at some time but not in the range", () => {
    const index = classifyProducts(
      new Map([
        ["old", sales({ unitsLifetime: 12 })],
        ["live", sales({ unitsLifetime: 12, unitsRange: 3, revenueRange: 90 })],
      ]),
      range90,
    );
    expect(index.coldIds).toEqual(["old"]);
    expect(index.soldIds.sort()).toEqual(["live", "old"]);
  });

  it("calls a product promising when the second half rises, or is all it has, with at least two units", () => {
    const index = classifyProducts(
      new Map([
        [
          "rising",
          sales({
            unitsLifetime: 9,
            unitsRange: 6,
            revenueRange: 60,
            unitsRecent: 4,
            unitsEarlier: 2,
          }),
        ],
        [
          "new",
          sales({
            unitsLifetime: 3,
            unitsRange: 3,
            revenueRange: 30,
            unitsRecent: 3,
            unitsEarlier: 0,
          }),
        ],
        [
          "flat",
          sales({
            unitsLifetime: 9,
            unitsRange: 6,
            revenueRange: 60,
            unitsRecent: 3,
            unitsEarlier: 3,
          }),
        ],
        [
          "single",
          sales({
            unitsLifetime: 1,
            unitsRange: 1,
            revenueRange: 10,
            unitsRecent: 1,
            unitsEarlier: 0,
          }),
        ],
      ]),
      range90,
    );
    expect(index.promisingIds.sort()).toEqual(["new", "rising"]);
  });

  it("leaves products with no sales out of every sold set, so they are the non-sellers", () => {
    const index = classifyProducts(new Map([["ghost", sales({})]]), range90);
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

  it("states the chosen count and range in the definitions", () => {
    expect(performanceDefinitions(300).top.definition).toBe(
      "The 300 products with the most revenue in the last 90 days.",
    );
    expect(PERFORMANCE_DEFINITIONS.top.definition).toContain("The 200 products");
    expect(performanceDefinitions(300).cold).toEqual(PERFORMANCE_DEFINITIONS.cold);
    const january = customRange(dayOf("2026-01-01"), dayOf("2026-01-31"));
    expect(performanceDefinitions(200, january).cold.definition).toBe(
      "Has sold at some time but nothing in Jan 1, 2026 to Jan 31, 2026.",
    );
    expect(performanceDefinitions(200, presetRange("6m", today)).promising.definition).toContain(
      "the second half of the last 6 months",
    );
  });
});

describe("the segment vocabulary", () => {
  it("parses only the four segments and defines each in words with its range", () => {
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
