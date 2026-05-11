"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import {
  approveAdjustment,
  createAdjustment,
  rejectAdjustment,
  ADJUSTMENT_CATEGORIES,
  type AdjustmentCategory,
} from "@/server/services/finance/adjustments";
import { requirePermission } from "@/server/permissions";

export type AdjustmentActionState = { error?: string; ok?: string } | undefined;

const KNOWN_CATEGORIES = new Set<string>(ADJUSTMENT_CATEGORIES);

export async function createAdjustmentAction(
  _prev: AdjustmentActionState,
  formData: FormData,
): Promise<AdjustmentActionState> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_MANAGE_ADJUSTMENTS);
  const periodId = String(formData.get("periodId") ?? "");
  const divisionId = String(formData.get("divisionId") ?? "") || null;
  const category = String(formData.get("category") ?? "");
  const accountKey = String(formData.get("accountKey") ?? "") || null;
  const amount = Number(formData.get("amount") ?? "");
  const description = String(formData.get("description") ?? "");

  if (!periodId) return { error: "Choose a period." };
  if (!KNOWN_CATEGORIES.has(category)) return { error: "Choose a category." };
  if (!Number.isFinite(amount)) return { error: "Amount must be numeric." };
  if (!description.trim()) return { error: "Description is required." };

  try {
    await createAdjustment(
      {
        financialPeriodId: periodId,
        divisionId,
        category: category as AdjustmentCategory,
        accountKey,
        amount,
        description,
      },
      { id: actor.id },
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create adjustment." };
  }
  revalidatePath("/financials/adjustments");
  revalidatePath("/financials");
  return { ok: "Adjustment recorded as pending." };
}

export async function approveAdjustmentAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_APPROVE);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await approveAdjustment(id, { id: actor.id });
  revalidatePath("/financials/adjustments");
  revalidatePath("/financials");
}

export async function rejectAdjustmentAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_APPROVE);
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!id) return;
  await rejectAdjustment(id, reason, { id: actor.id });
  revalidatePath("/financials/adjustments");
  revalidatePath("/financials");
}
