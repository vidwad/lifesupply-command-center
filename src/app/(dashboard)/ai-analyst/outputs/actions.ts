"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { decideAiOutput, type ReviewDecision } from "@/server/services/ai/review";
import { requirePermission } from "@/server/permissions";

export type ReviewActionState = { error?: string; ok?: string } | undefined;

const DECISIONS: ReviewDecision[] = ["reviewed", "approved", "rejected", "archived"];

export async function decideAiOutputAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const actor = await requirePermission(PERMISSIONS.AI_APPROVE_OUTPUT);
  const outputId = String(formData.get("outputId") ?? "");
  const decision = String(formData.get("decision") ?? "") as ReviewDecision;
  const rejectionReason = String(formData.get("rejectionReason") ?? "") || null;
  if (!outputId || !DECISIONS.includes(decision)) {
    return { error: "Missing output or decision." };
  }
  try {
    await decideAiOutput({ outputId, decision, rejectionReason, actorUserId: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to record the decision." };
  }
  revalidatePath("/ai-analyst/outputs");
  return { ok: `Marked ${decision}.` };
}
