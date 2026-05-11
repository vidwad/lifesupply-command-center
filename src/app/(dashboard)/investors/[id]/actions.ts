"use server";

import { PERMISSIONS } from "@/lib/permissions";
import { logInvestorInteraction } from "@/server/services/investors";
import { requirePermission } from "@/server/permissions";

export type LogInteractionState = { error?: string; ok?: string } | undefined;

export async function logInteractionAction(
  _prev: LogInteractionState,
  formData: FormData,
): Promise<LogInteractionState> {
  const user = await requirePermission(PERMISSIONS.INVESTORS_UPDATE);

  const investorId = String(formData.get("investorId") ?? "");
  const interactionType = String(formData.get("interactionType") ?? "");
  const interactionDate = String(formData.get("interactionDate") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const nextAction = String(formData.get("nextAction") ?? "");

  if (!investorId) return { error: "Investor is required." };
  if (!interactionType) return { error: "Interaction type is required." };
  if (!interactionDate) return { error: "Date is required." };

  try {
    await logInvestorInteraction({
      investorId,
      interactionType: interactionType as "meeting" | "email" | "call" | "document_shared",
      interactionDate,
      summary: summary || undefined,
      nextAction: nextAction || undefined,
      actorUserId: user.id,
    });
    return { ok: "Interaction logged." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to log interaction." };
  }
}
