import { describe, expect, it } from "vitest";

import {
  buildForecast,
  DEFAULT_TRAILING_WINDOW,
  FORECAST_LIMITATIONS,
  isValidPeriod,
  MAX_HORIZON_MONTHS,
  MIN_HISTORY_MONTHS,
  nextPeriod,
  projectSeries,
} from "./forecast-engine";

const series = (values: number[], start = "2026-01") => {
  let period = start;
  return values.map((value, i) => {
    if (i > 0) period = nextPeriod(period);
    return { period, value };
  });
};

describe("period helpers", () => {
  it("nextPeriod rolls months and years", () => {
    expect(nextPeriod("2026-01")).toBe("2026-02");
    expect(nextPeriod("2026-12")).toBe("2027-01");
  });
  it("isValidPeriod accepts YYYY-MM only", () => {
    expect(isValidPeriod("2026-08")).toBe(true);
    expect(isValidPeriod("2026-13")).toBe(false);
    expect(isValidPeriod("2026-8")).toBe(false);
  });
});

describe("projectSeries", () => {
  it("pins the guard constants", () => {
    expect(MAX_HORIZON_MONTHS).toBe(24);
    expect(MIN_HISTORY_MONTHS).toBe(3);
    expect(DEFAULT_TRAILING_WINDOW).toBe(3);
  });

  it("trailing_average holds the mean of the last window flat", () => {
    const out = projectSeries(series([100, 110, 120, 130]), "trailing_average", 2, {
      trailingWindowMonths: 3,
    });
    expect(out).toEqual([
      { period: "2026-05", value: 120 },
      { period: "2026-06", value: 120 },
    ]);
  });

  it("linear_trend extrapolates a perfect line exactly", () => {
    const out = projectSeries(series([100, 110, 120]), "linear_trend", 3);
    expect(out.map((p) => p.value)).toEqual([130, 140, 150]);
    expect(out[0]!.period).toBe("2026-04");
  });

  it("linear_trend clamps at zero on a steep decline", () => {
    const out = projectSeries(series([100, 50, 0]), "linear_trend", 2);
    expect(out.every((p) => p.value >= 0)).toBe(true);
  });

  it("seasonal_naive uses the same month last year, else trailing average", () => {
    const history = series([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130], "2025-01"); // 2025-01..2026-01
    const out = projectSeries(history, "seasonal_naive", 2);
    // 2026-02 → 2025-02 (20); 2026-03 → 2025-03 (30)
    expect(out).toEqual([
      { period: "2026-02", value: 20 },
      { period: "2026-03", value: 30 },
    ]);

    const short = projectSeries(series([100, 100, 100]), "seasonal_naive", 1);
    expect(short[0]!.value).toBe(100); // fallback to trailing average
  });

  it("rejects short history and out-of-range horizons", () => {
    expect(() => projectSeries(series([1, 2]), "trailing_average", 1)).toThrow(/history/);
    expect(() => projectSeries(series([1, 2, 3]), "trailing_average", 0)).toThrow(/horizon/);
    expect(() => projectSeries(series([1, 2, 3]), "trailing_average", 25)).toThrow(/horizon/);
  });
});

describe("buildForecast", () => {
  const revenueHistory = series([100000, 100000, 100000]);
  const marginHistory = series([0.4, 0.4, 0.4]);

  it("baseline scenario equals baseline when no overlays are set", () => {
    const result = buildForecast({
      revenueHistory,
      grossMarginPctHistory: marginHistory,
      assumptions: { method: "trailing_average", horizonMonths: 2 },
    });
    const row = result.rows[0]!;
    expect(row.scenarioRevenue).toBe(row.baselineRevenue);
    expect(row.scenarioGrossProfit).toBe(row.baselineGrossProfit);
    expect(row.indicativeCashImpact).toBe(0);
    expect(result.limitations).toBe(FORECAST_LIMITATIONS);
  });

  it("applies compounding revenue growth", () => {
    const result = buildForecast({
      revenueHistory,
      grossMarginPctHistory: [],
      assumptions: { method: "trailing_average", horizonMonths: 2, revenueGrowthPctMonthly: 0.1 },
    });
    expect(result.rows[0]!.scenarioRevenue).toBeCloseTo(110000, 0);
    expect(result.rows[1]!.scenarioRevenue).toBeCloseTo(121000, 0);
    // No margin history → margin/GP columns stay null, cash impact stays 0.
    expect(result.rows[0]!.baselineGrossMarginPct).toBeNull();
    expect(result.rows[0]!.indicativeCashImpact).toBe(0);
  });

  it("supplier cost increase compresses margin via COGS", () => {
    const result = buildForecast({
      revenueHistory,
      grossMarginPctHistory: marginHistory,
      assumptions: { method: "trailing_average", horizonMonths: 1, supplierCostIncreasePct: 0.1 },
    });
    // COGS 60% × 1.1 = 66% → margin 34%.
    expect(result.rows[0]!.scenarioGrossMarginPct).toBeCloseTo(0.34, 4);
    expect(result.rows[0]!.scenarioGrossProfit).toBeCloseTo(34000, 0);
    expect(result.rows[0]!.indicativeCashImpact).toBeCloseTo(-6000, 0);
  });

  it("reactivation revenue is scaled by the marketing ROI multiplier", () => {
    const result = buildForecast({
      revenueHistory,
      grossMarginPctHistory: marginHistory,
      assumptions: {
        method: "trailing_average",
        horizonMonths: 1,
        reactivationRevenueMonthly: 10000,
        marketingRoiMultiplier: 1.5,
        incrementalMarginPct: 0.5,
      },
    });
    const row = result.rows[0]!;
    expect(row.scenarioRevenue).toBe(115000); // 100k + 10k × 1.5
    // GP = 100k×0.4 + 15k×0.5 = 47.5k
    expect(row.scenarioGrossProfit).toBeCloseTo(47500, 0);
    expect(row.indicativeCashImpact).toBeCloseTo(7500, 0);
  });

  it("financing injection seeds cash impact; margin delta and acquisition stack", () => {
    const result = buildForecast({
      revenueHistory,
      grossMarginPctHistory: marginHistory,
      assumptions: {
        method: "trailing_average",
        horizonMonths: 2,
        financingCashInjection: 250000,
        grossMarginDeltaPp: 0.05,
        acquisitionRevenueMonthly: 20000,
        incrementalMarginPct: 0.3,
      },
    });
    const [m1, m2] = result.rows;
    // Organic GP = 100k×0.45 = 45k (+5k vs baseline); acquisition GP = 6k.
    expect(m1!.scenarioGrossProfit).toBeCloseTo(51000, 0);
    expect(m1!.indicativeCashImpact).toBeCloseTo(250000 + 11000, 0);
    expect(m2!.indicativeCashImpact).toBeCloseTo(250000 + 22000, 0);
  });

  it("margins are clamped into [0, 1]", () => {
    const result = buildForecast({
      revenueHistory,
      grossMarginPctHistory: marginHistory,
      assumptions: {
        method: "trailing_average",
        horizonMonths: 1,
        supplierCostIncreasePct: 5, // absurd — would push margin far below 0
      },
    });
    expect(result.rows[0]!.scenarioGrossMarginPct).toBeGreaterThanOrEqual(0);
  });

  it("rejects unknown methods", () => {
    expect(() =>
      buildForecast({
        revenueHistory,
        grossMarginPctHistory: [],
        assumptions: { method: "magic" as never, horizonMonths: 1 },
      }),
    ).toThrow(/method/);
  });
});
