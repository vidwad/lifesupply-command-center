import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  EXCLUDED_STATUSES,
  grossMargin,
  marginOpportunity,
  numOrZero,
  positiveOrNull,
  rangeDays,
  REVENUE_STATUSES,
  salesVelocity,
  targetMarginFromMultiplier,
} from "./policy";

describe("which orders count as revenue", () => {
  it("excludes cancelled and refunded, and nothing else", () => {
    expect([...EXCLUDED_STATUSES].sort()).toEqual(["cancelled", "refunded"]);
  });

  it("covers every OrderStatus exactly once across the two lists", () => {
    // A status added to the schema later must force a decision here rather
    // than silently vanishing from revenue.
    const all = Object.values(OrderStatus).sort();
    const covered = [...REVENUE_STATUSES, ...EXCLUDED_STATUSES].sort();
    expect(covered).toEqual(all);
    expect(new Set(covered).size).toBe(covered.length);
  });

  it("counts in-flight orders as revenue", () => {
    // The order was placed and the money is expected; only cancellation or
    // refund undoes that.
    for (const s of ["received", "processing", "shipped", "completed"] as const) {
      expect(REVENUE_STATUSES).toContain(s);
    }
  });
});

describe("positiveOrNull — a zero cost is unknown, not free", () => {
  it("rejects zero, negatives and non-numbers", () => {
    for (const v of [0, -1, "0", "", "abc", NaN, Infinity, null, undefined]) {
      expect(positiveOrNull(v)).toBeNull();
    }
  });

  it("accepts positive numbers and numeric strings", () => {
    expect(positiveOrNull(9.5)).toBe(9.5);
    expect(positiveOrNull("12.34")).toBe(12.34);
  });

  it("rejects a Decimal-like zero, which is a truthy object", () => {
    // The exact trap behind docs/35 F-16: `Decimal(0) ? … : …` takes the
    // truthy branch and a missing cost becomes a real cost of $0.00.
    const decimalZero = { toString: () => "0", valueOf: () => 0 };
    expect(Boolean(decimalZero)).toBe(true);
    expect(positiveOrNull(decimalZero)).toBeNull();
  });
});

describe("grossMargin", () => {
  it("returns null when cost is unknown rather than pretending it is zero", () => {
    // Reporting 100% here is exactly the bug this guard exists to prevent.
    expect(grossMargin(170.44, null)).toBeNull();
  });

  it("computes margin as a fraction of revenue", () => {
    expect(grossMargin(100, 60)).toBeCloseTo(0.4, 10);
  });

  it("returns null for zero or negative revenue instead of dividing by it", () => {
    expect(grossMargin(0, 0)).toBeNull();
    expect(grossMargin(-5, 1)).toBeNull();
  });

  it("allows a genuinely negative margin", () => {
    // Selling below cost is a real and important finding, not an error.
    expect(grossMargin(100, 130)).toBeCloseTo(-0.3, 10);
  });
});

describe("targetMarginFromMultiplier — alignment with Pricing Intelligence", () => {
  it("derives the floor margin from the engine's own multiplier", () => {
    // floor = cost x m, so margin at floor = (m-1)/m. At the shipped 1.40
    // default that is 28.57%.
    expect(targetMarginFromMultiplier(1.4)).toBeCloseTo(0.2857142857, 8);
  });

  it("agrees with floorPrice() arithmetic at the boundary", () => {
    const cost = 100;
    const m = 1.4;
    const floor = cost * m; // what list-builder.floorPrice computes
    const marginAtFloor = (floor - cost) / floor;
    expect(targetMarginFromMultiplier(m)).toBeCloseTo(marginAtFloor, 10);
  });

  it("returns null for a multiplier that implies no margin at all", () => {
    for (const m of [1, 0.9, 0, -1, NaN]) {
      expect(targetMarginFromMultiplier(m)).toBeNull();
    }
  });
});

describe("marginOpportunity", () => {
  it("is the revenue shortfall against the target margin", () => {
    // 10% actual vs 28.57% target on $1,000 of revenue.
    expect(marginOpportunity(1000, 0.1, 0.2857142857)).toBeCloseTo(185.71, 2);
  });

  it("is zero — never negative — when the product already beats the target", () => {
    // A surplus must not offset another product's shortfall in any total.
    expect(marginOpportunity(1000, 0.5, 0.2857)).toBe(0);
    expect(marginOpportunity(1000, 0.2857, 0.2857)).toBe(0);
  });

  it("is null when either margin is unknown", () => {
    expect(marginOpportunity(1000, null, 0.28)).toBeNull();
    expect(marginOpportunity(1000, 0.1, null)).toBeNull();
  });

  it("is null for non-positive revenue", () => {
    expect(marginOpportunity(0, 0.1, 0.28)).toBeNull();
  });

  it("counts a loss-making product's full climb to the target", () => {
    // -20% actual to 28.57% target is a 48.57 point gap.
    expect(marginOpportunity(100, -0.2, 0.2857142857)).toBeCloseTo(48.57, 2);
  });
});

describe("salesVelocity", () => {
  it("normalises units to a 30-day rate", () => {
    expect(salesVelocity(90, 90)).toBe(30);
    expect(salesVelocity(30, 30)).toBe(30);
    expect(salesVelocity(15, 30)).toBe(15);
  });

  it("returns null rather than dividing by a zero-length range", () => {
    expect(salesVelocity(10, 0)).toBeNull();
    expect(salesVelocity(10, -5)).toBeNull();
  });

  it("handles zero units without becoming NaN", () => {
    expect(salesVelocity(0, 30)).toBe(0);
  });
});

describe("rangeDays", () => {
  it("counts whole days across a range", () => {
    expect(rangeDays(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-31T00:00:00Z"))).toBe(30);
  });

  it("never returns zero, so callers cannot divide by it", () => {
    const t = new Date("2026-01-01T00:00:00Z");
    expect(rangeDays(t, t)).toBe(1);
    expect(rangeDays(new Date("2026-02-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z"))).toBe(1);
  });

  it("rounds a partial day up so a same-day range spans one day", () => {
    expect(rangeDays(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-01T06:00:00Z"))).toBe(1);
  });
});

describe("numOrZero", () => {
  it("coerces absent and unparseable values to zero", () => {
    for (const v of [null, undefined, "abc", NaN]) expect(numOrZero(v)).toBe(0);
  });

  it("preserves a legitimate zero and real values", () => {
    expect(numOrZero(0)).toBe(0);
    expect(numOrZero("12.5")).toBe(12.5);
  });
});
