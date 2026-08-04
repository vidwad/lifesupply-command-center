import { describe, expect, it } from "vitest";

import {
  evaluateMetric,
  evaluateReconciliation,
  TOLERANCES,
  type MetricInput,
} from "./reconciliation-evaluator";

function count(ccValue: number, bcValue: number | null): MetricInput {
  return { metric: "orders.count", label: "Orders", kind: "count", ccValue, bcValue };
}

function money(ccValue: number, bcValue: number | null): MetricInput {
  return { metric: "orders.revenue", label: "Revenue", kind: "money", ccValue, bcValue };
}

describe("evaluateMetric", () => {
  it("computes delta and deltaPct against the BC value", () => {
    const row = evaluateMetric(count(95, 100));
    expect(row.delta).toBe(-5);
    expect(row.deltaPct).toBeCloseTo(0.05);
  });

  it("treats a missing BC value as informational — never material", () => {
    const row = evaluateMetric(count(1234, null));
    expect(row.delta).toBeNull();
    expect(row.deltaPct).toBeNull();
    expect(row.material).toBe(false);
  });

  it("an exact match is not material", () => {
    expect(evaluateMetric(count(500, 500)).material).toBe(false);
    expect(evaluateMetric(money(1000.5, 1000.5)).material).toBe(false);
  });

  it("requires BOTH the absolute floor and the pct floor (counts)", () => {
    // Big relative gap but under the absolute floor (|Δ|=2 < 3) → noise.
    expect(evaluateMetric(count(8, 10)).material).toBe(false);
    // Big absolute gap but tiny relative gap (100 of 100k = 0.1% < 0.5%) → noise.
    expect(evaluateMetric(count(99_900, 100_000)).material).toBe(false);
    // Both floors exceeded (5 of 100 = 5%) → material.
    expect(evaluateMetric(count(95, 100)).material).toBe(true);
  });

  it("requires BOTH floors for money too", () => {
    // $20 gap < $25 floor → noise even at a high pct.
    expect(evaluateMetric(money(80, 100)).material).toBe(false);
    // $30 gap on $10k = 0.3% < 0.5% → noise.
    expect(evaluateMetric(money(9_970, 10_000)).material).toBe(false);
    // $100 gap on $5k = 2% → material.
    expect(evaluateMetric(money(4_900, 5_000)).material).toBe(true);
  });

  it("flags surpluses (CC > BC) the same as deficits", () => {
    const row = evaluateMetric(count(110, 100));
    expect(row.delta).toBe(10);
    expect(row.material).toBe(true);
  });

  it("handles a zero BC total without dividing by zero", () => {
    const row = evaluateMetric(count(10, 0));
    expect(row.deltaPct).toBe(10); // |Δ| / max(|bc|, 1)
    expect(row.material).toBe(true);
  });
});

describe("evaluateReconciliation", () => {
  it("summarizes status + discrepancy count across rows", () => {
    const { rows, discrepancyCount, status } = evaluateReconciliation([
      count(100, 100),
      count(95, 100), // material
      count(50, null), // informational
      money(4_900, 5_000), // material
    ]);
    expect(rows).toHaveLength(4);
    expect(discrepancyCount).toBe(2);
    expect(status).toBe("discrepancies");
  });

  it("reports ok when nothing is material", () => {
    const { status, discrepancyCount } = evaluateReconciliation([
      count(100, 100),
      money(999.99, 1_000),
    ]);
    expect(discrepancyCount).toBe(0);
    expect(status).toBe("ok");
  });

  it("tolerances are pinned so tuning is a deliberate act", () => {
    expect(TOLERANCES.count).toEqual({ absFloor: 3, pctFloor: 0.005 });
    expect(TOLERANCES.money).toEqual({ absFloor: 25, pctFloor: 0.005 });
  });
});
