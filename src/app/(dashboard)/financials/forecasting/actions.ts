"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import {
  FORECAST_METHODS,
  MAX_HORIZON_MONTHS,
  type ForecastAssumptions,
  type ForecastMethod,
} from "@/server/services/financials/forecast-engine";
import {
  archiveForecastScenario,
  createForecastScenario,
  requestForecastApproval,
} from "@/server/services/financials/forecast-scenarios";
import { FeatureDisabledError } from "@/server/services/feature-flags";
import { requirePermission } from "@/server/permissions";

export type ForecastActionState = { error?: string; ok?: string } | undefined;

/** Percent form fields arrive as human percentages ("5" = 5%) — divide by 100. */
function pctField(formData: FormData, name: string): number | undefined {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return n / 100;
}

function moneyField(formData: FormData, name: string): number | undefined {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function createScenarioAction(
  _prev: ForecastActionState,
  formData: FormData,
): Promise<ForecastActionState> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_REVIEW);

  const name = String(formData.get("name") ?? "").trim();
  const method = String(formData.get("method") ?? "") as ForecastMethod;
  const horizonMonths = Number(formData.get("horizonMonths") ?? 0);
  if (!name) return { error: "Scenario name is required." };
  if (!FORECAST_METHODS.includes(method)) return { error: "Choose a projection method." };
  if (!Number.isInteger(horizonMonths) || horizonMonths < 1 || horizonMonths > MAX_HORIZON_MONTHS) {
    return { error: `Horizon must be 1–${MAX_HORIZON_MONTHS} months.` };
  }

  const roiRaw = String(formData.get("marketingRoiMultiplier") ?? "").trim();
  const roi = roiRaw ? Number(roiRaw) : undefined;

  const assumptions: ForecastAssumptions = {
    method,
    horizonMonths,
    trailingWindowMonths: Number(formData.get("trailingWindowMonths") ?? 0) || undefined,
    revenueGrowthPctMonthly: pctField(formData, "revenueGrowthPctMonthly"),
    grossMarginDeltaPp: pctField(formData, "grossMarginDeltaPp"),
    supplierCostIncreasePct: pctField(formData, "supplierCostIncreasePct"),
    reactivationRevenueMonthly: moneyField(formData, "reactivationRevenueMonthly"),
    marketingRoiMultiplier: roi != null && Number.isFinite(roi) && roi > 0 ? roi : undefined,
    incrementalMarginPct: pctField(formData, "incrementalMarginPct"),
    financingCashInjection: moneyField(formData, "financingCashInjection"),
    acquisitionRevenueMonthly: moneyField(formData, "acquisitionRevenueMonthly"),
  };

  let created;
  try {
    created = await createForecastScenario({
      name,
      assumptions,
      notes: String(formData.get("notes") ?? "") || null,
      actorUserId: actor.id,
    });
  } catch (err) {
    if (err instanceof FeatureDisabledError) return { error: err.message };
    return { error: err instanceof Error ? err.message : "Failed to create the scenario." };
  }
  revalidatePath("/financials/forecasting");
  redirect(`/financials/forecasting/${created.id}`);
}

export async function requestForecastApprovalAction(
  _prev: ForecastActionState,
  formData: FormData,
): Promise<ForecastActionState> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_REVIEW);
  const scenarioId = String(formData.get("scenarioId") ?? "");
  if (!scenarioId) return { error: "Missing scenario id." };
  try {
    await requestForecastApproval({ scenarioId, requestedById: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to request approval." };
  }
  revalidatePath(`/financials/forecasting/${scenarioId}`);
  revalidatePath("/approvals");
  return { ok: "Approval requested — pending a financials.approve decision in /approvals." };
}

export async function archiveScenarioAction(
  _prev: ForecastActionState,
  formData: FormData,
): Promise<ForecastActionState> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_REVIEW);
  const scenarioId = String(formData.get("scenarioId") ?? "");
  if (!scenarioId) return { error: "Missing scenario id." };
  await archiveForecastScenario({ scenarioId, actorUserId: actor.id });
  revalidatePath("/financials/forecasting");
  revalidatePath(`/financials/forecasting/${scenarioId}`);
  return { ok: "Scenario archived." };
}
