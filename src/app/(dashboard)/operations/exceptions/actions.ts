"use server";

import { revalidatePath } from "next/cache";
import type { ExceptionState } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import { assignException, setExceptionStatus } from "@/server/services/exceptions";
import {
  bulkCreateTasksFromExceptions,
  createTaskFromException,
} from "@/server/services/exceptions/task-routing";
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

export async function createTaskFromExceptionAction(
  _prev: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const actor = await requirePermission(PERMISSIONS.TASKS_CREATE);
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing exception id." };
  try {
    const result = await createTaskFromException({ exceptionId: id, actorUserId: actor.id });
    revalidatePath("/operations/exceptions");
    revalidatePath("/tasks");
    if (result.created) return { ok: "Task created and assigned to you." };
    if (result.reason === "task_exists")
      return { ok: "An active task already exists for this exception." };
    return { error: `Could not create a task (${result.reason ?? "unknown"}).` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create task." };
  }
}

export async function bulkCreateTasksAction(
  _prev: ExceptionActionState,
  formData: FormData,
): Promise<ExceptionActionState> {
  const actor = await requirePermission(PERMISSIONS.TASKS_CREATE);
  const ids = formData.getAll("exceptionIds").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "Select at least one exception." };
  try {
    const result = await bulkCreateTasksFromExceptions({
      exceptionIds: ids,
      actorUserId: actor.id,
    });
    revalidatePath("/operations/exceptions");
    revalidatePath("/tasks");
    return {
      ok: `Created ${result.created} task${result.created === 1 ? "" : "s"} (${result.skipped} skipped — closed or already tasked)${
        result.capped ? `; capped at ${ids.length > 20 ? 20 : ids.length} per run` : ""
      }.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Bulk task creation failed." };
  }
}
