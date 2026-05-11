"use server";

import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import { createOpportunity, updateOpportunity } from "@/server/services/opportunities";
import { requirePermission } from "@/server/permissions";

export type OpportunityFormState = { error?: string; ok?: string } | undefined;

type OpportunityType =
  | "acquisition"
  | "supplier"
  | "financing"
  | "marketing"
  | "product"
  | "operational"
  | "technology"
  | "partnership"
  | "cost_reduction";

type OpportunityStatus =
  | "identified"
  | "evaluating"
  | "committed"
  | "in_progress"
  | "completed"
  | "declined"
  | "on_hold";

type RiskRating = "low" | "medium" | "high";
type Priority = "low" | "medium" | "high" | "critical";

function readForm(formData: FormData) {
  const numeric = (key: string): number | null => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
  };
  const marginRaw = String(formData.get("estimatedMarginImpact") ?? "").trim();
  // Margin field is entered as a percent (e.g. "8" for 8%) and stored as 0..1
  const margin = marginRaw ? Number(marginRaw) / 100 : null;

  return {
    title: String(formData.get("title") ?? "").trim(),
    opportunityType: String(formData.get("opportunityType") ?? "") as OpportunityType,
    status: (String(formData.get("status") ?? "identified") as OpportunityStatus) || "identified",
    strategicRationale: String(formData.get("strategicRationale") ?? "").trim() || null,
    estimatedRevenueImpact: numeric("estimatedRevenueImpact"),
    estimatedMarginImpact: margin,
    estimatedCost: numeric("estimatedCost"),
    riskRating: (String(formData.get("riskRating") ?? "").trim() || null) as RiskRating | null,
    priority: (String(formData.get("priority") ?? "").trim() || null) as Priority | null,
    ownerId: String(formData.get("ownerId") ?? "").trim() || null,
    nextAction: String(formData.get("nextAction") ?? "").trim() || null,
    dueDate: String(formData.get("dueDate") ?? "").trim() || null,
  };
}

export async function createOpportunityAction(
  _prev: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const user = await requirePermission(PERMISSIONS.OPPORTUNITIES_UPDATE);
  const data = readForm(formData);
  if (!data.title) return { error: "Title is required." };
  if (!data.opportunityType) return { error: "Type is required." };

  let opportunity;
  try {
    opportunity = await createOpportunity({ ...data, actorUserId: user.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create opportunity." };
  }
  redirect(`/opportunities/${opportunity.id}`);
}

export async function updateOpportunityAction(
  _prev: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const user = await requirePermission(PERMISSIONS.OPPORTUNITIES_UPDATE);
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!opportunityId) return { error: "Opportunity is required." };
  const data = readForm(formData);
  if (!data.title) return { error: "Title is required." };
  if (!data.opportunityType) return { error: "Type is required." };

  try {
    await updateOpportunity({ ...data, opportunityId, actorUserId: user.id });
    return { ok: "Saved." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save." };
  }
}
