"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requestReportApproval, setReportStatus } from "@/server/services/reports";
import { requirePermission } from "@/server/permissions";

export type ReportActionState = { error?: string; ok?: string } | undefined;

export async function requestApprovalAction(
  _prev: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const actor = await requirePermission(PERMISSIONS.REPORTS_GENERATE);
  const reportId = String(formData.get("reportId") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  if (!reportId) return { error: "Missing report id." };
  try {
    await requestReportApproval({ reportId, requestedById: actor.id, notes });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to request approval." };
  }
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/approvals");
  return { ok: "Approval requested." };
}

export async function archiveReportAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.REPORTS_EDIT);
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return;
  try {
    await setReportStatus({ reportId, status: "archived", actor: { id: actor.id } });
  } catch {
    // surfaced via revalidate
  }
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
}
