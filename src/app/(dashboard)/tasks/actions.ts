"use server";

import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import {
  assignTask as assignTaskService,
  createTask as createTaskService,
  updateTaskStatus as updateTaskStatusService,
} from "@/server/services/tasks";
import { requirePermission } from "@/server/permissions";

export type TaskFormState = { error?: string } | undefined;

export async function createTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const user = await requirePermission(PERMISSIONS.TASKS_CREATE);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "medium");
  const status = String(formData.get("status") ?? "open");
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const assignedToId = String(formData.get("assignedToId") ?? "").trim() || null;
  const relatedEntityType = String(formData.get("relatedEntityType") ?? "").trim() || null;
  const relatedEntityId = String(formData.get("relatedEntityId") ?? "").trim() || null;

  let task;
  try {
    task = await createTaskService({
      title,
      description,
      priority: priority as "low" | "medium" | "high" | "urgent",
      status: status as
        | "open"
        | "in_progress"
        | "blocked"
        | "awaiting_approval"
        | "completed"
        | "cancelled",
      dueDate: dueDateRaw || null,
      assignedToId,
      relatedEntityType: (relatedEntityType ?? null) as
        | "Order"
        | "Customer"
        | "Product"
        | "Supplier"
        | "Campaign"
        | "Report"
        | null,
      relatedEntityId,
      createdById: user.id,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create task." };
  }

  redirect(`/tasks/${task.id}`);
}

export async function updateStatusAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.TASKS_UPDATE);
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!taskId || !status) return;
  await updateTaskStatusService({
    taskId,
    status: status as
      | "open"
      | "in_progress"
      | "blocked"
      | "awaiting_approval"
      | "completed"
      | "cancelled",
    actorUserId: user.id,
  });
}

export async function assignAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.TASKS_ASSIGN);
  const taskId = String(formData.get("taskId") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "").trim() || null;
  if (!taskId) return;
  await assignTaskService({ taskId, assignedToId, actorUserId: user.id });
}
