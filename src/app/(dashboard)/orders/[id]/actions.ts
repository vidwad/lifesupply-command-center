"use server";

import type { OrderStatus } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import { addOrderNote, resolveOrderException, updateOrderStatus } from "@/server/services/orders";
import { requirePermission } from "@/server/permissions";

export type OrderActionState = { error?: string; ok?: string } | undefined;

export async function updateOrderStatusAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const user = await requirePermission(PERMISSIONS.ORDERS_UPDATE);
  const orderId = String(formData.get("orderId") ?? "");
  const newStatus = String(formData.get("status") ?? "") as OrderStatus;
  if (!orderId || !newStatus) return { error: "Order and status are required." };

  try {
    await updateOrderStatus({ orderId, newStatus, actorUserId: user.id });
    return { ok: `Status updated to ${newStatus.replace("_", " ")}.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update status." };
  }
}

export async function resolveExceptionAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const user = await requirePermission(PERMISSIONS.ORDERS_MANAGE_EXCEPTIONS);
  const orderId = String(formData.get("orderId") ?? "");
  const resolutionNote = String(formData.get("resolutionNote") ?? "");
  if (!orderId) return { error: "Order is required." };
  if (!resolutionNote.trim()) return { error: "Resolution note is required." };

  try {
    await resolveOrderException({ orderId, resolutionNote, actorUserId: user.id });
    return { ok: "Exception resolved." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to resolve exception." };
  }
}

export async function addNoteAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const user = await requirePermission(PERMISSIONS.ORDERS_UPDATE);
  const orderId = String(formData.get("orderId") ?? "");
  const text = String(formData.get("text") ?? "");
  if (!orderId) return { error: "Order is required." };
  if (!text.trim()) return { error: "Note cannot be empty." };

  try {
    await addOrderNote({ orderId, text, actorUserId: user.id });
    return { ok: "Note added." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add note." };
  }
}
