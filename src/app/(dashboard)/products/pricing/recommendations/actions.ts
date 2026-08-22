"use server";

/**
 * DP-4 recommendation generation action.
 *
 * Produces a review queue and nothing else. It approves nothing, rejects
 * nothing, mutates no product or variant, calls no external system, and never
 * references pricing.writebacks or external.writebacks. Approval is DP-5.
 *
 * Gated on pricing.review_recommendations rather than pricing.view: generating
 * writes rows, and a read-only viewer should not be able to fill a queue that
 * someone else has to work through.
 */
import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { PricingValidationError } from "@/server/services/pricing";
import { generateRecommendationsForRun } from "@/server/services/pricing/recommendations";

export type RecommendationActionState = { error?: string; ok?: string } | undefined;

export async function generateRecommendationsAction(
  _previous: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_REVIEW_RECOMMENDATIONS);
  const runId = String(formData.get("runId") ?? "");

  try {
    const summary = await generateRecommendationsForRun({
      actorUserId: user.id,
      pricingRunId: runId,
    });
    revalidatePath("/products/pricing/runs/" + runId);
    revalidatePath("/products/pricing/recommendations");

    const blocked = Object.entries(summary.byType)
      .filter(([type]) => type.startsWith("blocked_") || type === "manual_review")
      .map(([type, count]) => String(count) + " " + type)
      .join(", ");

    return {
      ok:
        "Created " +
        String(summary.created) +
        " recommendation(s) from " +
        String(summary.itemsConsidered) +
        " item(s)" +
        (summary.skippedExisting > 0
          ? ", skipped " + String(summary.skippedExisting) + " with a live recommendation"
          : "") +
        (blocked ? ". Not recommended: " + blocked : "") +
        ". Every row requires approval and no price has been changed.",
    };
  } catch (error) {
    if (error instanceof PricingValidationError) return { error: error.message };
    throw error instanceof Error ? error : new Error("Could not generate recommendations.");
  }
}
