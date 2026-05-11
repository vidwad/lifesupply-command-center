"use server";

import { revalidatePath } from "next/cache";
import type { ExceptionState } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import { assignException, setExceptionStatus } from "@/server/services/exceptions";
import { requirePermission } from "@/server/permissions";

export type ExceptionActionState = { error?: string; ok?: string } | undefined;

const VALID_STATES: ExceptionState[] = [
  "open",
  "investigating",
  "blocked",
  "resolved",
  "dismissed",
];

export async function setStatusAction(
  _prev: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const actor = await requirePermission(PERMISSIONS.ORDERS_MANAGE_EXCEPTIONS);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  if (!id) return { error: "Missing exception id." };
  if (!VALID_STATES.includes(status as ExceptionState)) return { error: "Invalid status." };
  try {
    await setExceptionStatus(id, status as ExceptionState, { id: actor.id }, notes);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update exception." };
  }
  revalidatePath("/operations/exceptions");
  return { ok: "Updated." };
}

export async function assignAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.ORDERS_MANAGE_EXCEPTIONS);
  const id = String(formData.get("id") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  if (!id) return;
  await assignException(id, assignedToId, { id: actor.id });
  revalidatePath("/operations/exceptions");
}
