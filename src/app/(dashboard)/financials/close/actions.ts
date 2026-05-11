"use server";

import { revalidatePath } from "next/cache";
import type { MonthlyCloseStatus } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import {
  assignCloseTask,
  seedCloseChecklist,
  setCloseTaskStatus,
} from "@/server/services/finance/close-tasks";
import { requirePermission } from "@/server/permissions";

export type CloseActionState = { error?: string; ok?: string } | undefined;

const VALID_STATUS: MonthlyCloseStatus[] = [
  "pending",
  "in_progress",
  "blocked",
  "done",
  "skipped",
];

export async function seedChecklistAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_REVIEW);
  const periodId = String(formData.get("periodId") ?? "");
  const divisionId = String(formData.get("divisionId") ?? "") || null;
  if (!periodId) return;
  await seedCloseChecklist({
    financialPeriodId: periodId,
    divisionId,
    actor: { id: actor.id },
  });
  revalidatePath("/financials/close");
}

export async function setStatusAction(
  _prev: CloseActionState,
  formData: FormData,
): Promise<CloseActionState> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_REVIEW);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  if (!id) return { error: "Missing task id." };
  if (!VALID_STATUS.includes(status as MonthlyCloseStatus)) {
    return { error: "Invalid status." };
  }
  try {
    await setCloseTaskStatus(id, status as MonthlyCloseStatus, { id: actor.id }, notes);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update task." };
  }
  revalidatePath("/financials/close");
  return { ok: "Updated." };
}

export async function assignAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_REVIEW);
  const id = String(formData.get("id") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "") || null;
  if (!id) return;
  await assignCloseTask(id, ownerId, { id: actor.id });
  revalidatePath("/financials/close");
}
