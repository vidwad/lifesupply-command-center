"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { PermissionDeniedError, requirePermission } from "@/server/permissions";
import { attemptDeliveries } from "@/server/public-inquiry/delivery";
import { assignInquiry, handOffToTask, setInquiryStatus } from "@/server/public-inquiry/queue";
import type { InquiryStatus } from "@/server/public-inquiry/contract";

export type InquiryActionState = { ok: string } | { error: string } | undefined;

const STATUSES: readonly InquiryStatus[] = [
  "received",
  "assigned",
  "in_progress",
  "closed",
  "spam",
];

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function failure(error: unknown): InquiryActionState {
  if (error instanceof PermissionDeniedError)
    return { error: "You do not have permission for that action." };
  if (error instanceof Error && /Cannot move/.test(error.message)) return { error: error.message };
  return { error: "The action could not be completed." };
}

export async function inquiryStatusAction(
  _prev: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  try {
    const actor = await requirePermission(PERMISSIONS.TASKS_UPDATE);
    const status = text(formData, "status") as InquiryStatus;
    if (!STATUSES.includes(status)) return { error: "Unknown status." };
    const id = text(formData, "id");
    await setInquiryStatus(actor, id, status);
    revalidatePath("/public-web/inquiries");
    revalidatePath(`/public-web/inquiries/${id}`);
    return { ok: `Marked ${status.replace("_", " ")}.` };
  } catch (error) {
    return failure(error);
  }
}

export async function inquiryAssignSelfAction(
  _prev: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  try {
    const actor = await requirePermission(PERMISSIONS.TASKS_UPDATE);
    const id = text(formData, "id");
    await assignInquiry(actor, id, actor.id);
    revalidatePath("/public-web/inquiries");
    revalidatePath(`/public-web/inquiries/${id}`);
    return { ok: "Assigned to you." };
  } catch (error) {
    return failure(error);
  }
}

export async function inquiryHandOffAction(
  _prev: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  try {
    const actor = await requirePermission(PERMISSIONS.TASKS_UPDATE);
    const id = text(formData, "id");
    await handOffToTask(actor, id);
    revalidatePath("/public-web/inquiries");
    revalidatePath(`/public-web/inquiries/${id}`);
    return { ok: "Task created." };
  } catch (error) {
    return failure(error);
  }
}

export async function inquiryRetryDeliveryAction(
  _prev: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  try {
    await requirePermission(PERMISSIONS.TASKS_UPDATE);
    const id = text(formData, "id");
    await attemptDeliveries(id);
    revalidatePath(`/public-web/inquiries/${id}`);
    return { ok: "Delivery attempted; see states." };
  } catch (error) {
    return failure(error);
  }
}
