/**
 * Forecast + scenario engine (Phase 9 — docs/19 §9, docs/12 §11).
 *
 * Pure module — no I/O — so every projection is deterministic, the math is
 * pinned by unit tests, and the same engine runs in the UI preview and the
 * persisted scenario. Forecasts are NEVER facts: every output carries the
 * assumptions that produced it plus the standing LIMITATIONS list, and the
 * scenario service stamps source periods + data freshness on top.
 *
 * Baseline methods (docs/12 forecast types are combinations of these over
 * revenue / margin series):
 *   trailing_average — mean of the last N months, held flat.
 *   linear_trend     — least-squares line over the history, extrapolated,
 *                      clamped at zero.
 *   seasonal_naive   — same month last year, falling back to the trailing
 *                      average when a year of history is missing.
 *
 * Scenario overlays are explicit, additive assumptions (growth, margin
 * delta, supplier cost increase, reactivation revenue, marketing ROI,
 * financing injection, acquisition revenue). The "cash impact" column is
 * deliberately labeled indicative — it is the cumulative gross-profit delta
 * vs baseline plus financing inputs, not a cash-flow statement.
 */

export type MonthlyPoint = { period: string; value: number };

export type ForecastMethod = "trailing_average" | "linear_trend" | "seasonal_naive";

export const FORECAST_METHODS: ForecastMethod[] = [
  "trailing_average",
  "linear_trend",
  "seasonal_naive",
];

export const MAX_HORIZON_MONTHS = 24;
export const DEFAULT_TRAILING_WINDOW = 3;
/** linear_trend / trailing_average need this many observed months. */
export const MIN_HISTORY_MONTHS = 3;

/** Standing limitations attached to every forecast output. */
export const FORECAST_LIMITATIONS: readonly string[] = [
  "Projections extrapolate historical monthly aggregates from the Command Center; they are estimates, not commitments or accounting records.",
  "Scenario overlays apply management assumptions mechanically; no market, competitive, or execution risk is modeled.",
  "Indicative cash impact = cumulative gross-profit delta vs baseline plus financing inputs; it excludes operating-expense timing, taxes, inventory, and capital expenditure.",
  "Periods sourced from unsynced or open months may be incomplete; check the data-freshness stamp before relying on recent months.",
];

export type ScenarioOverlays = {
  /** Compounding monthly growth applied to projected revenue (e.g. 0.02 = +2%/mo). */
  revenueGrowthPctMonthly?: number;
  /** Absolute percentage-point change to gross margin (e.g. -0.03 = -3pp). */
  grossMarginDeltaPp?: number;
  /** Supplier cost increase applied to COGS (e.g. 0.05 raises COGS 5%). */
  supplierCostIncreasePct?: number;
  /** Incremental monthly revenue from customer reactivation campaigns. */
  reactivationRevenueMonthly?: number;
  /** Multiplier on reactivation revenue for marketing-ROI scenarios (default 1). */
  marketingRoiMultiplier?: number;
  /** Gross margin assumed on incremental (reactivation + acquisition) revenue; defaults to the baseline margin of the month. */
  incrementalMarginPct?: number;
  /** One-time financing cash injection recognized in the first forecast month. */
  financingCashInjection?: number;
  /** Incremental monthly revenue from an acquisition. */
  acquisitionRevenueMonthly?: number;
};

export type ForecastAssumptions = ScenarioOverlays & {
  method: ForecastMethod;
  horizonMonths: number;
  trailingWindowMonths?: number;
};

export type ForecastRow = {
  period: string;
  baselineRevenue: number;
  scenarioRevenue: number;
  baselineGrossMarginPct: number | null;
  scenarioGrossMarginPct: number | null;
  baselineGrossProfit: number | null;
  scenarioGrossProfit: number | null;
  /** Cumulative indicative cash impact vs baseline (see LIMITATIONS). */
  indicativeCashImpact: number;
};

export type ForecastResult = {
  rows: ForecastRow[];
  method: ForecastMethod;
  limitations: readonly string[];
};

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

export function isValidPeriod(period: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(period)) return false;
  const month = Number(period.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function nextPeriod(period: string): string {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `${next.y}-${String(next.m).padStart(2, "0")}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Baseline projection
// ---------------------------------------------------------------------------

/**
 * Project a monthly series `horizon` months past its last observation.
 * History must be sorted ascending by period with no gaps assumed away —
 * the caller (scenario service) is responsible for a contiguous series.
 */
export function projectSeries(
  history: MonthlyPoint[],
  method: ForecastMethod,
  horizonMonths: number,
  opts: { trailingWindowMonths?: number } = {},
): MonthlyPoint[] {
  if (horizonMonths < 1 || horizonMonths > MAX_HORIZON_MONTHS) {
    throw new Error(`horizonMonths must be 1–${MAX_HORIZON_MONTHS}.`);
  }
  if (history.length < MIN_HISTORY_MONTHS) {
    throw new Error(
      `At least ${MIN_HISTORY_MONTHS} months of history are required (got ${history.length}).`,
    );
  }
  const window = Math.max(1, Math.min(opts.trailingWindowMonths ?? DEFAULT_TRAILING_WINDOW, 12));
  const values = history.map((p) => p.value);
  const trailingAvg =
    values.slice(-window).reduce((s, v) => s + v, 0) / Math.min(window, values.length);

  // Least-squares fit over the observed indices (for linear_trend).
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let varX = 0;
  for (let i = 0; i < n; i++) {
    cov += (i - meanX) * (values[i]! - meanY);
    varX += (i - meanX) ** 2;
  }
  const slope = varX === 0 ? 0 : cov / varX;
  const intercept = meanY - slope * meanX;

  const byPeriod = new Map(history.map((p) => [p.period, p.value]));
  const out: MonthlyPoint[] = [];
  let period = history[history.length - 1]!.period;

  for (let step = 1; step <= horizonMonths; step++) {
    period = nextPeriod(period);
    let value: number;
    switch (method) {
      case "trailing_average":
        value = trailingAvg;
        break;
      case "linear_trend":
        value = intercept + slope * (n - 1 + step);
        break;
      case "seasonal_naive": {
        const year = Number(period.slice(0, 4)) - 1;
        const lastYear = `${year}${period.slice(4)}`;
        value = byPeriod.get(lastYear) ?? trailingAvg;
        break;
      }
    }
    out.push({ period, value: round2(Math.max(0, value)) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scenario forecast
// ---------------------------------------------------------------------------

export type BuildForecastInput = {
  /** Contiguous ascending monthly revenue history. */
  revenueHistory: MonthlyPoint[];
  /** Gross margin percent (0–1) per period; may be shorter or empty. */
  grossMarginPctHistory: MonthlyPoint[];
  assumptions: ForecastAssumptions;
};

export function buildForecast(input: BuildForecastInput): ForecastResult {
  const a = input.assumptions;
  if (!FORECAST_METHODS.includes(a.method)) {
    throw new Error(`Unknown forecast method: ${a.method}`);
  }

  const baselineRevenue = projectSeries(input.revenueHistory, a.method, a.horizonMonths, {
    trailingWindowMonths: a.trailingWindowMonths,
  });
  const baselineMarginSeries =
    input.grossMarginPctHistory.length >= MIN_HISTORY_MONTHS
      ? projectSeries(input.grossMarginPctHistory, a.method, a.horizonMonths, {
          trailingWindowMonths: a.trailingWindowMonths,
        })
      : null;

  const roi = a.marketingRoiMultiplier ?? 1;
  const incrementalRevenueMonthly =
    (a.reactivationRevenueMonthly ?? 0) * roi + (a.acquisitionRevenueMonthly ?? 0);

  const rows: ForecastRow[] = [];
  let cumulativeCash = a.financingCashInjection ?? 0;

  for (let i = 0; i < baselineRevenue.length; i++) {
    const { period, value: baseRev } = baselineRevenue[i]!;

    // Organic revenue: compounding growth overlay.
    const growth = a.revenueGrowthPctMonthly ?? 0;
    const organicRev = baseRev * Math.pow(1 + growth, i + 1);
    const scenarioRev = round2(organicRev + incrementalRevenueMonthly);

    // Margins.
    const baseMarginPct = baselineMarginSeries
      ? Math.min(1, Math.max(0, baselineMarginSeries[i]!.value))
      : null;
    let scenarioMarginPct: number | null = null;
    let baseGp: number | null = null;
    let scenarioGp: number | null = null;

    if (baseMarginPct != null) {
      // Supplier cost increase inflates COGS: newMargin = 1 - (1 - m) * (1 + pct).
      const costAdjusted = 1 - (1 - baseMarginPct) * (1 + (a.supplierCostIncreasePct ?? 0));
      const organicMargin = Math.min(1, Math.max(0, costAdjusted + (a.grossMarginDeltaPp ?? 0)));
      const incrementalMargin = Math.min(1, Math.max(0, a.incrementalMarginPct ?? baseMarginPct));

      baseGp = round2(baseRev * baseMarginPct);
      const organicGp = organicRev * organicMargin;
      const incrementalGp = incrementalRevenueMonthly * incrementalMargin;
      scenarioGp = round2(organicGp + incrementalGp);
      scenarioMarginPct = scenarioRev > 0 ? round2((scenarioGp / scenarioRev) * 10000) / 10000 : 0;

      cumulativeCash += scenarioGp - baseGp;
    }

    rows.push({
      period,
      baselineRevenue: baseRev,
      scenarioRevenue: scenarioRev,
      baselineGrossMarginPct: baseMarginPct,
      scenarioGrossMarginPct: scenarioMarginPct,
      baselineGrossProfit: baseGp,
      scenarioGrossProfit: scenarioGp,
      indicativeCashImpact: round2(cumulativeCash),
    });
  }

  return { rows, method: a.method, limitations: FORECAST_LIMITATIONS };
}
