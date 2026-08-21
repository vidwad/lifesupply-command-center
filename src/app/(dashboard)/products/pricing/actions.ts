"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import {
  createPricingCompetitor,
  createPricingRule,
  deletePricingCompetitor,
  deletePricingRule,
  PricingValidationError,
  setPricingCompetitorEnabled,
  setPricingRuleEnabled,
  updatePricingCompetitor,
  updatePricingRule,
} from "@/server/services/pricing";
import type { CompetitorInput, PricingRuleInput } from "@/server/services/pricing/validation";

export type PricingActionState = { error?: string; ok?: string } | undefined;

function actionError(error: unknown, fallback: string): PricingActionState {
  if (error instanceof PricingValidationError) return { error: error.message };
  return { error: error instanceof Error ? error.message : fallback };
}

const text = (formData: FormData, key: string): string => String(formData.get(key) ?? "");
const optionalText = (formData: FormData, key: string): string | null =>
  text(formData, key).trim() || null;
const num = (formData: FormData, key: string): number => Number(text(formData, key));
const optionalNum = (formData: FormData, key: string): number | null => {
  const raw = text(formData, key).trim();
  return raw ? Number(raw) : null;
};
const flag = (formData: FormData, key: string): boolean => formData.get(key) === "on";

function competitorInputFromForm(formData: FormData): CompetitorInput {
  return {
    name: text(formData, "name"),
    baseUrl: text(formData, "baseUrl"),
    country: optionalText(formData, "country"),
    currency: text(formData, "currency"),
    searchUrlTemplate: optionalText(formData, "searchUrlTemplate"),
    productUrlPattern: optionalText(formData, "productUrlPattern"),
    rateLimitPerHour: num(formData, "rateLimitPerHour"),
    termsReviewStatus: text(formData, "termsReviewStatus"),
    requiresManualUrlMapping: flag(formData, "requiresManualUrlMapping"),
    enabled: flag(formData, "enabled"),
    notes: optionalText(formData, "notes"),
  };
}

function ruleInputFromForm(formData: FormData): PricingRuleInput {
  return {
    name: text(formData, "name"),
    storeId: optionalText(formData, "storeId"),
    minCostMultiplier: num(formData, "minCostMultiplier"),
    defaultUndercutAmount: num(formData, "defaultUndercutAmount"),
    defaultUndercutPct: optionalNum(formData, "defaultUndercutPct"),
    maxIncreasePct: num(formData, "maxIncreasePct"),
    maxDecreasePct: num(formData, "maxDecreasePct"),
    dailyBatchSize: num(formData, "dailyBatchSize"),
    minConfidence: num(formData, "minConfidence"),
    evidenceFreshnessHours: num(formData, "evidenceFreshnessHours"),
    requiresApproval: flag(formData, "requiresApproval"),
    // Not read from the form: the field is not rendered, and validation
    // rejects true. Sending false keeps the input shape intact.
    autoApproveEligible: false,
    enabled: flag(formData, "enabled"),
    notes: optionalText(formData, "notes"),
  };
}

// ---------------------------------------------------------------------------
// Competitors — pricing.manage_competitors
// ---------------------------------------------------------------------------

export async function saveCompetitorAction(
  _previous: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_MANAGE_COMPETITORS);
  const id = optionalText(formData, "id");
  try {
    const input = competitorInputFromForm(formData);
    if (id) {
      await updatePricingCompetitor({ actorUserId: user.id, id, input });
    } else {
      await createPricingCompetitor({ actorUserId: user.id, input });
    }
  } catch (error) {
    return actionError(error, "Could not save the competitor.");
  }
  revalidatePath("/products/pricing/competitors");
  revalidatePath("/products/pricing");
  return { ok: id ? "Competitor updated." : "Competitor created." };
}

export async function setCompetitorEnabledAction(
  _previous: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_MANAGE_COMPETITORS);
  try {
    await setPricingCompetitorEnabled({
      actorUserId: user.id,
      id: text(formData, "id"),
      enabled: text(formData, "enabled") === "true",
    });
  } catch (error) {
    return actionError(error, "Could not change the competitor state.");
  }
  revalidatePath("/products/pricing/competitors");
  revalidatePath("/products/pricing");
  return undefined;
}

export async function deleteCompetitorAction(
  _previous: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_MANAGE_COMPETITORS);
  try {
    await deletePricingCompetitor({ actorUserId: user.id, id: text(formData, "id") });
  } catch (error) {
    return actionError(error, "Could not delete the competitor.");
  }
  revalidatePath("/products/pricing/competitors");
  revalidatePath("/products/pricing");
  return { ok: "Competitor deleted." };
}

// ---------------------------------------------------------------------------
// Pricing rules — pricing.manage_rules
// ---------------------------------------------------------------------------

export async function saveRuleAction(
  _previous: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_MANAGE_RULES);
  const id = optionalText(formData, "id");
  try {
    const input = ruleInputFromForm(formData);
    if (id) {
      await updatePricingRule({ actorUserId: user.id, id, input });
    } else {
      await createPricingRule({ actorUserId: user.id, input });
    }
  } catch (error) {
    return actionError(error, "Could not save the pricing rule.");
  }
  revalidatePath("/products/pricing/rules");
  revalidatePath("/products/pricing");
  return { ok: id ? "Rule updated." : "Rule created." };
}

export async function setRuleEnabledAction(
  _previous: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_MANAGE_RULES);
  try {
    await setPricingRuleEnabled({
      actorUserId: user.id,
      id: text(formData, "id"),
      enabled: text(formData, "enabled") === "true",
    });
  } catch (error) {
    return actionError(error, "Could not change the rule state.");
  }
  revalidatePath("/products/pricing/rules");
  revalidatePath("/products/pricing");
  return undefined;
}

export async function deleteRuleAction(
  _previous: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_MANAGE_RULES);
  try {
    await deletePricingRule({ actorUserId: user.id, id: text(formData, "id") });
  } catch (error) {
    return actionError(error, "Could not delete the pricing rule.");
  }
  revalidatePath("/products/pricing/rules");
  revalidatePath("/products/pricing");
  return { ok: "Rule deleted." };
}
