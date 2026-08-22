"use server";

/**
 * DP-4 recommendation generation action.
 *
 * Produces a review queue and nothing else. It approves nothing, rejects
 * nothing, mutates no product or variant, calls no external system, and never
 * references pricing.writebacks or external.writebacks.
 *
 * DP-5 adds the decision actions. They record an INTERNAL approval or rejection
 * on the recommendation row only: no price is written to any product, variant,
 * or store.
 *
 * DP-6 adds the writeback action, and DP-6B the rollback action. Those two DO
 * change a live storefront price, and they are the only things in this file
 * that do. Each carries the same permission, the same three flags, and its own
 * audit trail; generation and approval remain incapable of touching a store
 * price. This file is the only place allowed to import either dangerous
 * service, and a canary enforces it.
 *
 * Gated on pricing.review_recommendations rather than pricing.view: generating
 * writes rows, and a read-only viewer should not be able to fill a queue that
 * someone else has to work through.
 */
import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { PricingValidationError } from "@/server/services/pricing";
import { parseRejectionReason } from "@/server/services/pricing/approval";
import { approveRecommendation, rejectRecommendation } from "@/server/services/pricing/approvals";
import { generateRecommendationsForRun } from "@/server/services/pricing/recommendations";
import { rollBackWriteback } from "@/server/services/pricing/rollback";
import { writeRecommendationToBigCommerce } from "@/server/services/pricing/writeback";

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

/**
 * Both decision actions require pricing.approve_recommendations — a stricter
 * permission than the one that GENERATES the queue. Someone who can fill the
 * queue must not be able to bless it on the same permission.
 */
async function requireDecider() {
  return requirePermission(PERMISSIONS.PRICING_APPROVE_RECOMMENDATIONS);
}

function revalidateDecision(recommendationId: string): void {
  revalidatePath("/products/pricing/recommendations");
  revalidatePath("/products/pricing/recommendations/" + recommendationId);
}

export async function approveRecommendationAction(
  _previous: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const user = await requireDecider();
  const recommendationId = String(formData.get("recommendationId") ?? "");

  try {
    await approveRecommendation({ actorUserId: user.id, recommendationId });
    revalidateDecision(recommendationId);
    return {
      ok:
        "Approved. This is an internal approval only — no BigCommerce price change occurs " +
        "until a later controlled writeback phase.",
    };
  } catch (error) {
    if (error instanceof PricingValidationError) return { error: error.message };
    throw error instanceof Error ? error : new Error("Could not approve the recommendation.");
  }
}

export async function rejectRecommendationAction(
  _previous: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const user = await requireDecider();
  const recommendationId = String(formData.get("recommendationId") ?? "");
  const reason = parseRejectionReason(formData.get("rejectionReason"));

  if (reason == null) {
    return { error: "A rejection reason is required. Say why so the next reviewer knows." };
  }

  try {
    await rejectRecommendation({ actorUserId: user.id, recommendationId, reason });
    revalidateDecision(recommendationId);
    return { ok: "Rejected. No price was changed." };
  } catch (error) {
    if (error instanceof PricingValidationError) return { error: error.message };
    throw error instanceof Error ? error : new Error("Could not reject the recommendation.");
  }
}

/**
 * DP-6: writes one approved recommendation's sale price to BigCommerce.
 *
 * Requires pricing.writeback_bigcommerce — deliberately NOT satisfied by
 * pricing.approve_recommendations. The person who blesses a price and the
 * person who publishes it are separated by permission.
 *
 * The user's permissions are handed to the service so the check is enforced
 * twice: once here at the boundary, once inside the service, which must never
 * be callable with a price and no proof of authority.
 */
export async function writeRecommendationToBigCommerceAction(
  _previous: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE);
  const recommendationId = String(formData.get("recommendationId") ?? "");

  try {
    const result = await writeRecommendationToBigCommerce({
      actorUserId: user.id,
      actorPermissions: user.permissions,
      recommendationId,
    });
    revalidateDecision(recommendationId);

    if (result.status === "failed") {
      return {
        error:
          "BigCommerce rejected the write: " +
          result.message +
          " The recommendation is still approved and the attempt is recorded in the writeback log.",
      };
    }
    return {
      ok:
        "Sale price written to BigCommerce (" +
        (result.oldSalePrice == null
          ? "no previous sale price"
          : "was $" + result.oldSalePrice.toFixed(2)) +
        " -> $" +
        result.newSalePrice.toFixed(2) +
        "). " +
        result.message,
    };
  } catch (error) {
    if (error instanceof PricingValidationError) return { error: error.message };
    throw error instanceof Error ? error : new Error("Could not write the price to BigCommerce.");
  }
}

/**
 * DP-6B: restores one writeback's prior sale price in BigCommerce.
 *
 * A rollback is a live price change, so it carries the same permission and the
 * same three flags as the forward write. One writeback log per press: there is
 * no bulk control and no loop anywhere on this path.
 */
export async function rollBackWritebackAction(
  _previous: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const user = await requirePermission(PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE);
  const writebackLogId = String(formData.get("writebackLogId") ?? "");
  const recommendationId = String(formData.get("recommendationId") ?? "");

  try {
    const result = await rollBackWriteback({
      actorUserId: user.id,
      actorPermissions: user.permissions,
      writebackLogId,
    });
    revalidateDecision(recommendationId);

    if (result.status === "failed") {
      return {
        error:
          "BigCommerce rejected the rollback: " +
          result.message +
          " The store price is unchanged and the attempt is recorded on the writeback log.",
      };
    }
    return { ok: result.message };
  } catch (error) {
    if (error instanceof PricingValidationError) return { error: error.message };
    throw error instanceof Error ? error : new Error("Could not roll back the writeback.");
  }
}
