"use server";

import { approve, ApprovalPermissionError, reject, withdraw } from "@/server/services/approvals";
import { requireUser } from "@/server/permissions";

export type ApprovalActionState = { error?: string; ok?: string } | undefined;

export async function approveAction(
  _prev: ApprovalActionState,
  formData: FormData,
): Promise<ApprovalActionState> {
  const user = await requireUser();
  const approvalId = String(formData.get("approvalId") ?? "");
  const decisionNotes = String(formData.get("decisionNotes") ?? "");
  if (!approvalId) return { error: "Approval is required." };

  try {
    await approve({ approvalId, decisionNotes, actor: user });
    return { ok: "Approved." };
  } catch (err) {
    if (err instanceof ApprovalPermissionError) return { error: err.message };
    return { error: err instanceof Error ? err.message : "Failed to approve." };
  }
}

export async function rejectAction(
  _prev: ApprovalActionState,
  formData: FormData,
): Promise<ApprovalActionState> {
  const user = await requireUser();
  const approvalId = String(formData.get("approvalId") ?? "");
  const decisionNotes = String(formData.get("decisionNotes") ?? "").trim();
  if (!approvalId) return { error: "Approval is required." };
  if (!decisionNotes) return { error: "Decision notes are required when rejecting." };

  try {
    await reject({ approvalId, decisionNotes, actor: user });
    return { ok: "Rejected." };
  } catch (err) {
    if (err instanceof ApprovalPermissionError) return { error: err.message };
    return { error: err instanceof Error ? err.message : "Failed to reject." };
  }
}

export async function withdrawAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const approvalId = String(formData.get("approvalId") ?? "");
  if (!approvalId) return;
  try {
    await withdraw({ approvalId, actorUserId: user.id });
  } catch (err) {
    console.error("[approvals] withdrawAction failed", err);
  }
}
