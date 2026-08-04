/**
 * Forecast scenario service (Phase 9). Persistence + lifecycle around the
 * pure forecast engine:
 *
 *   - Baseline actuals come from monthly FinancialSummary rows. Consolidated
 *     figures prefer the QBO-sourced row (divisionId null) and fall back to
 *     the "CONS" division row — the two conventions that coexist in this
 *     codebase (see budgets.ts vs financials/index.ts).
 *   - Scenarios are versioned by name: saving under an existing name creates
 *     version max+1. Nothing is overwritten; forecasts are auditable.
 *   - Every scenario stores its inputs, assumptions, results, source periods,
 *     data freshness (QBO last successful sync, latest closed period), and
 *     the engine's standing limitations. Forecasts are never facts.
 *   - Approval for external use goes through an Approval row (type
 *     "forecast" → financials.approve). Everything is gated by the
 *     forecasting.enabled FeatureFlag.
 */
import type { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { requireFeature } from "@/server/services/feature-flags";
import { toCsv } from "@/server/services/exports/csv";

import {
  buildForecast,
  FORECAST_LIMITATIONS,
  isValidPeriod,
  nextPeriod,
  type ForecastAssumptions,
  type ForecastResult,
  type ForecastRow,
  type MonthlyPoint,
} from "./forecast-engine";

/** Cap the history window we extrapolate from. */
const MAX_HISTORY_MONTHS = 36;

export type BaselineSeries = {
  revenueHistory: MonthlyPoint[];
  grossMarginPctHistory: MonthlyPoint[];
  sourcePeriods: { name: string; status: string; sourceSystem: string | null }[];
  dataFreshness: {
    qboLastSuccessfulSyncAt: string | null;
    latestPeriod: string | null;
    latestClosedPeriod: string | null;
    generatedAt: string;
  };
};

/**
 * Build the contiguous consolidated monthly baseline ending at the latest
 * month that has a summary. Non-contiguous older history is dropped (the
 * engine assumes an unbroken series).
 */
export async function buildBaselineSeries(): Promise<BaselineSeries> {
  const periods = await prisma.financialPeriod.findMany({
    where: { periodType: "month" },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      summaries: {
        where: { OR: [{ divisionId: null }, { division: { code: "CONS" } }] },
        select: { divisionId: true, revenue: true, grossMargin: true, sourceSystem: true },
      },
    },
  });

  type Point = {
    name: string;
    status: string;
    revenue: number;
    marginPct: number | null;
    sourceSystem: string | null;
  };
  const points: Point[] = [];
  for (const p of periods) {
    if (!isValidPeriod(p.name) || p.summaries.length === 0) continue;
    // Prefer the QBO consolidated row (divisionId null) over the CONS row.
    const summary = p.summaries.find((s) => s.divisionId === null) ?? p.summaries[0]!;
    points.push({
      name: p.name,
      status: p.status,
      revenue: Number(summary.revenue),
      marginPct: summary.grossMargin == null ? null : Number(summary.grossMargin),
      sourceSystem: summary.sourceSystem,
    });
  }

  // Keep the longest contiguous suffix (months must chain via nextPeriod).
  let start = points.length - 1;
  while (start > 0 && nextPeriod(points[start - 1]!.name) === points[start]!.name) start--;
  const contiguous = points.slice(start).slice(-MAX_HISTORY_MONTHS);

  const [qboConnection, latestClosed] = await Promise.all([
    prisma.integrationConnection.findFirst({
      where: { integrationType: "quickbooks" },
      orderBy: { updatedAt: "desc" },
      select: { lastSuccessfulSyncAt: true },
    }),
    prisma.financialPeriod.findFirst({
      where: { periodType: "month", status: { in: ["approved", "closed"] } },
      orderBy: { startDate: "desc" },
      select: { name: true },
    }),
  ]);

  return {
    revenueHistory: contiguous.map((p) => ({ period: p.name, value: p.revenue })),
    grossMarginPctHistory: contiguous
      .filter((p) => p.marginPct != null)
      .map((p) => ({ period: p.name, value: p.marginPct! })),
    sourcePeriods: contiguous.map((p) => ({
      name: p.name,
      status: p.status,
      sourceSystem: p.sourceSystem,
    })),
    dataFreshness: {
      qboLastSuccessfulSyncAt: qboConnection?.lastSuccessfulSyncAt?.toISOString() ?? null,
      latestPeriod: contiguous.at(-1)?.name ?? null,
      latestClosedPeriod: latestClosed?.name ?? null,
      generatedAt: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export type ForecastScenarioRow = {
  id: string;
  name: string;
  version: number;
  status: string;
  method: string;
  horizonMonths: number;
  createdAt: Date;
  createdBy: { name: string | null; email: string } | null;
};

export async function listForecastScenarios(): Promise<ForecastScenarioRow[]> {
  const rows = await prisma.forecastScenario.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    include: { createdBy: { select: { name: true, email: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    version: r.version,
    status: r.status,
    method: r.method,
    horizonMonths: r.horizonMonths,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
  }));
}

export async function getForecastScenario(id: string) {
  return prisma.forecastScenario.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export type CreateScenarioInput = {
  name: string;
  assumptions: ForecastAssumptions;
  notes?: string | null;
  actorUserId: string;
};

export async function createForecastScenario(
  input: CreateScenarioInput,
): Promise<{ id: string; version: number; result: ForecastResult }> {
  await requireFeature(FEATURE_FLAGS.FORECASTING);

  const name = input.name.trim().slice(0, 120);
  if (!name) throw new Error("Scenario name is required.");

  const baseline = await buildBaselineSeries();
  if (baseline.revenueHistory.length < 3) {
    throw new Error(
      "Not enough consolidated monthly actuals to forecast (need at least 3 contiguous months). Run the QuickBooks sync or import financials first.",
    );
  }

  const result = buildForecast({
    revenueHistory: baseline.revenueHistory,
    grossMarginPctHistory: baseline.grossMarginPctHistory,
    assumptions: input.assumptions,
  });

  const latest = await prisma.forecastScenario.findFirst({
    where: { name },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;

  const row = await prisma.forecastScenario.create({
    data: {
      name,
      version,
      status: "draft",
      method: input.assumptions.method,
      horizonMonths: input.assumptions.horizonMonths,
      assumptions: input.assumptions as unknown as Prisma.InputJsonValue,
      inputs: {
        revenueHistory: baseline.revenueHistory,
        grossMarginPctHistory: baseline.grossMarginPctHistory,
      } as unknown as Prisma.InputJsonValue,
      results: result.rows as unknown as Prisma.InputJsonValue,
      sourceReferences: {
        sourcePeriods: baseline.sourcePeriods,
        dataFreshness: baseline.dataFreshness,
      } as unknown as Prisma.InputJsonValue,
      limitations: FORECAST_LIMITATIONS as unknown as Prisma.InputJsonValue,
      notes: input.notes?.trim() || null,
      createdById: input.actorUserId,
    },
  });
  await writeAudit({
    actorUserId: input.actorUserId,
    action: "forecast.scenario_created",
    entityType: "forecast_scenario",
    entityId: row.id,
    afterData: {
      name,
      version,
      method: input.assumptions.method,
      horizonMonths: input.assumptions.horizonMonths,
      sourcePeriodCount: baseline.sourcePeriods.length,
    },
  });
  return { id: row.id, version, result };
}

/** Raise an Approval row so the scenario can be cleared for external use. */
export async function requestForecastApproval(args: {
  scenarioId: string;
  requestedById: string;
}): Promise<{ approvalId: string }> {
  await requireFeature(FEATURE_FLAGS.FORECASTING);
  const scenario = await prisma.forecastScenario.findUniqueOrThrow({
    where: { id: args.scenarioId },
  });
  if (scenario.status !== "draft") {
    throw new Error(`Only draft scenarios can be submitted (current: ${scenario.status}).`);
  }

  const existing = await prisma.approval.findFirst({
    where: {
      approvalType: "forecast",
      relatedEntityType: "ForecastScenario",
      relatedEntityId: scenario.id,
      status: "pending",
    },
    select: { id: true },
  });
  if (existing) return { approvalId: existing.id };

  const freshness =
    (scenario.sourceReferences as { dataFreshness?: { qboLastSuccessfulSyncAt?: string | null } })
      ?.dataFreshness ?? {};
  const approval = await prisma.approval.create({
    data: {
      approvalType: "forecast",
      relatedEntityType: "ForecastScenario",
      relatedEntityId: scenario.id,
      requestSummary:
        `Approve forecast scenario "${scenario.name}" v${scenario.version} for external use ` +
        `(${scenario.method}, ${scenario.horizonMonths} months). ` +
        `Forecast, not actuals — assumptions and limitations attached to the scenario. ` +
        `QBO data freshness: ${freshness.qboLastSuccessfulSyncAt ?? "never synced"}.`,
      requestedById: args.requestedById,
      status: "pending",
    },
  });
  await prisma.forecastScenario.update({
    where: { id: scenario.id },
    data: { status: "under_review", approvalId: approval.id },
  });
  await writeAudit({
    actorUserId: args.requestedById,
    action: "forecast.approval_requested",
    entityType: "forecast_scenario",
    entityId: scenario.id,
    afterData: { approvalId: approval.id },
  });
  return { approvalId: approval.id };
}

export async function archiveForecastScenario(args: {
  scenarioId: string;
  actorUserId: string;
}): Promise<void> {
  await prisma.forecastScenario.update({
    where: { id: args.scenarioId },
    data: { status: "archived" },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "forecast.scenario_archived",
    entityType: "forecast_scenario",
    entityId: args.scenarioId,
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** CSV export: forecast rows plus assumption/limitation/source footer rows. */
export function scenarioToCsv(scenario: {
  name: string;
  version: number;
  status: string;
  method: string;
  assumptions: unknown;
  results: unknown;
  sourceReferences: unknown;
  limitations: unknown;
}): string {
  const rows = (Array.isArray(scenario.results) ? scenario.results : []) as ForecastRow[];
  const table = toCsv({
    headers: [
      { key: "period", label: "Period", get: (r: ForecastRow) => r.period },
      { key: "baselineRevenue", label: "Baseline revenue", get: (r) => r.baselineRevenue },
      { key: "scenarioRevenue", label: "Scenario revenue", get: (r) => r.scenarioRevenue },
      {
        key: "baselineGrossMarginPct",
        label: "Baseline gross margin",
        get: (r) => r.baselineGrossMarginPct,
      },
      {
        key: "scenarioGrossMarginPct",
        label: "Scenario gross margin",
        get: (r) => r.scenarioGrossMarginPct,
      },
      {
        key: "baselineGrossProfit",
        label: "Baseline gross profit",
        get: (r) => r.baselineGrossProfit,
      },
      {
        key: "scenarioGrossProfit",
        label: "Scenario gross profit",
        get: (r) => r.scenarioGrossProfit,
      },
      {
        key: "indicativeCashImpact",
        label: "Indicative cash impact (cumulative)",
        get: (r) => r.indicativeCashImpact,
      },
    ],
    rows,
  });

  const sourceRefs = scenario.sourceReferences as {
    sourcePeriods?: { name: string; status: string }[];
    dataFreshness?: Record<string, string | null>;
  } | null;
  const limitations = (Array.isArray(scenario.limitations) ? scenario.limitations : []) as string[];

  const footer = [
    "",
    `# Forecast scenario: ${scenario.name} v${scenario.version} (${scenario.status})`,
    `# Method: ${scenario.method}`,
    `# FORECAST — NOT ACTUAL RESULTS`,
    `# Assumptions: ${JSON.stringify(scenario.assumptions)}`,
    `# Source periods: ${sourceRefs?.sourcePeriods?.map((p) => `${p.name}(${p.status})`).join(" ") ?? "unknown"}`,
    `# Data freshness: ${JSON.stringify(sourceRefs?.dataFreshness ?? {})}`,
    ...limitations.map((l) => `# Limitation: ${l}`),
  ].join("\n");

  return `${table}\n${footer}\n`;
}
