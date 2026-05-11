"use server";

import { PERMISSIONS } from "@/lib/permissions";
import { AiNotConfiguredError, analyzeOpportunity } from "@/server/services/ai";
import { requirePermission } from "@/server/permissions";

export type AnalyzeState = { status: "ok" } | { status: "error"; message: string } | undefined;

export async function analyzeOpportunityAction(
  _prev: AnalyzeState,
  formData: FormData,
): Promise<AnalyzeState> {
  const user = await requirePermission(PERMISSIONS.OPPORTUNITIES_AI_ANALYZE);
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!opportunityId) return { status: "error", message: "Opportunity is required." };

  try {
    await analyzeOpportunity({ opportunityId, userId: user.id });
    return { status: "ok" };
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return { status: "error", message: err.message };
    }
    console.error("[opportunities] analyzeOpportunityAction failed", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to generate analysis.",
    };
  }
}
