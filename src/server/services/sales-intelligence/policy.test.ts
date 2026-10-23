import { OrderStatus, PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  EXCLUDED_STATUSES,
  GROSS_SALES_STATUSES,
  grossMargin,
  marginOpportunity,
  netSales,
  numOrZero,
  orderRefundAmount,
  positiveOrNull,
  rangeDays,
  refundRate,
  REVENUE_STATUSES,
  salesVelocity,
  summariseRefunds,
  targetMarginFromMultiplier,
} from "./policy";

describe("which orders count toward Gross Sales", () => {
  it("excludes cancelled only — a cancelled order was never a sale", () => {
    expect([...EXCLUDED_STATUSES]).toEqual(["cancelled"]);
  });

  it("INCLUDES refunded, because a refund reverses a sale that did happen", () => {
    // DEC-SI-01: refunds belong in gross and are deducted to reach net.
    expect(GROSS_SALES_STATUSES).toContain(OrderStatus.refunded);
  });

  it("covers every OrderStatus exactly once across the two lists", () => {
    // A status added to the schema later must force a decision here rather
    // than silently vanishing from gross.
    const all = Object.values(OrderStatus).sort();
    const covered = [...GROSS_SALES_STATUSES, ...EXCLUDED_STATUSES].sort();
    expect(covered).toEqual(all);
    expect(new Set(covered).size).toBe(covered.length);
  });

  it("counts in-flight orders", () => {
    for (const s of ["received", "processing", "shipped", "completed"] as const) {
      expect(GROSS_SALES_STATUSES).toContain(s);
    }
  });

  it("keeps the deprecated alias pointing at gross so old imports do not change meaning silently", () => {
    expect(REVENUE_STATUSES).toEqual(GROSS_SALES_STATUSES);
  });
});

describe("orderRefundAmount", () => {
  const order = (over: Partial<Parameters<typeof orderRefundAmount>[0]>) => ({
    status: OrderStatus.completed,
    paymentStatus: PaymentStatus.paid,
    grandTotal: 100,
    refundedTotal: 0,
    ...over,
  });

  it("trusts a recorded refund whatever the status — this is what makes partial refunds work", () => {
    // 25 production orders carry a recorded partial refund without a
    // `refunded` status; ignoring them would drop real refund value.
    expect(orderRefundAmount(order({ refundedTotal: 30 }))).toEqual({
      amount: 30,
      source: "recorded",
    });
  });

  it("infers a full refund when the status says refunded and no amount was recorded", () => {
    // 9,180 production orders are in exactly this state.
    expect(orderRefundAmount(order({ status: OrderStatus.refunded }))).toEqual({
      amount: 100,
      source: "inferred",
    });
  });

  it("does NOT infer a full refund for a known-partial one", () => {
    // Inferring $100 for a partial refund overstates it. 27 production orders
    // would be overstated by up to $17,366 without this branch.
    expect(
      orderRefundAmount(
        order({ status: OrderStatus.refunded, paymentStatus: PaymentStatus.partially_refunded }),
      ),
    ).toEqual({ amount: 0, source: "unquantified" });
  });

  it("prefers a recorded amount over the partial-status branch", () => {
    expect(
      orderRefundAmount(
        order({
          status: OrderStatus.refunded,
          paymentStatus: PaymentStatus.partially_refunded,
          refundedTotal: 12.5,
        }),
      ),
    ).toEqual({ amount: 12.5, source: "recorded" });
  });

  it("returns nothing for an ordinary order", () => {
    expect(orderRefundAmount(order({}))).toEqual({ amount: 0, source: "none" });
  });

  it("treats a zero recorded refund as absent, not as a refund of zero", () => {
    expect(orderRefundAmount(order({ refundedTotal: 0 })).source).toBe("none");
  });
});

describe("summariseRefunds", () => {
  it("splits measured from inferred and reports confidence", () => {
    const r = summariseRefunds({
      recorded: 46882.03,
      inferred: 2542941.72,
      inferredOrderCount: 9180,
    });
    expect(r.total).toBeCloseTo(2589823.75, 2);
    // Production reality: only 1.8% of refund value is measured.
    expect(r.confidence).toBeCloseTo(0.0181, 3);
  });

  it("reports full confidence when there are no refunds at all", () => {
    // 0/0 must not become NaN — "nothing was refunded" is a certain statement.
    const r = summariseRefunds({ recorded: 0, inferred: 0, inferredOrderCount: 0 });
    expect(r.total).toBe(0);
    expect(r.confidence).toBe(1);
  });

  it("reports full confidence when every refund was measured", () => {
    expect(summariseRefunds({ recorded: 500, inferred: 0, inferredOrderCount: 0 }).confidence).toBe(
      1,
    );
  });

  it("keeps unquantified partials out of the total but visible in the count", () => {
    // Their refund is real and unmeasurable; the count states that the total
    // is an understatement of known size.
    const r = summariseRefunds({
      recorded: 100,
      inferred: 0,
      inferredOrderCount: 0,
      unquantifiedOrderCount: 27,
    });
    expect(r.total).toBe(100);
    expect(r.unquantifiedOrderCount).toBe(27);
  });
});

describe("netSales", () => {
  it("is gross less refunds", () => {
    expect(netSales(20463182.16, 2589823.75)).toBeCloseTo(17873358.41, 2);
  });

  it("is NOT floored at zero", () => {
    // Refunds exceeding a period's gross is a real signal — returns landing
    // against sales booked earlier. Clamping would hide the case worth seeing.
    expect(netSales(100, 250)).toBe(-150);
  });

  it("equals gross when nothing was refunded", () => {
    expect(netSales(1000, 0)).toBe(1000);
  });
});

describe("refundRate", () => {
  it("expresses refunds as a share of gross", () => {
    expect(refundRate(1000, 100)).toBeCloseTo(0.1, 10);
  });

  it("is null rather than Infinity when there was no gross", () => {
    expect(refundRate(0, 50)).toBeNull();
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
