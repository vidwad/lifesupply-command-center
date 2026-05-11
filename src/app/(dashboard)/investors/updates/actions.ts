"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import {
  AiNotConfiguredError,
  AiProviderNotConfiguredError,
} from "@/server/services/ai";
import {
  draftInvestorUpdate,
  InvestorUpdateError,
  releaseInvestorUpdate,
  requestInvestorUpdateApproval,
} from "@/server/services/strategic/investor-updates";
import { FeatureDisabledError } from "@/server/services/feature-flags";
import { requirePermission } from "@/server/permissions";

export type InvestorUpdateActionState = { error?: string; ok?: string; id?: string } | undefined;

export async function draftAction(
  _prev: InvestorUpdateActionState,
  formData: FormData,
): Promise<InvestorUpdateActionState> {
  const actor = await requirePermission(PERMISSIONS.INVESTORS_GENERATE_UPDATE);
  const title = String(formData.get("title") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const financialPeriodId = String(formData.get("financialPeriodId") ?? "");
  if (!title) return { error: "Title is required." };
  if (!brief) return { error: "Brief is required." };
  if (!financialPeriodId) return { error: "Choose a financial period." };

  let id: string;
  try {
    id = await draftInvestorUpdate(
      { title, brief, financialPeriodId },
      { id: actor.id },
    );
  } catch (err) {
    if (
      err instanceof AiNotConfiguredError ||
      err instanceof AiProviderNotConfiguredError ||
      err instanceof InvestorUpdateError
    ) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "Failed to draft." };
  }
  revalidatePath("/investors/updates");
  redirect(`/investors/updates/${id}`);
}

export async function requestApprovalAction(
  _prev: InvestorUpdateActionState,
  formData: FormData,
): Promise<InvestorUpdateActionState> {
  const actor = await requirePermission(PERMISSIONS.INVESTORS_GENERATE_UPDATE);
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  if (!id) return { error: "Missing update id." };
  try {
    await requestInvestorUpdateApproval({ investorUpdateId: id, notes, actor: { id: actor.id } });
  } catch (err) {
    if (err instanceof InvestorUpdateError) return { error: err.message };
    return { error: err instanceof Error ? err.message : "Failed to request approval." };
  }
  revalidatePath(`/investors/updates/${id}`);
  revalidatePath("/approvals");
  return { ok: "Approval requested." };
}

export async function releaseAction(
  _prev: InvestorUpdateActionState,
  formData: FormData,
): Promise<InvestorUpdateActionState> {
  const actor = await requirePermission(PERMISSIONS.INVESTORS_APPROVE_MATERIALS);
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing update id." };
  try {
    await releaseInvestorUpdate({ investorUpdateId: id, actor: { id: actor.id } });
  } catch (err) {
    if (err instanceof InvestorUpdateError || err instanceof FeatureDisabledError) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "Failed to release." };
  }
  revalidatePath(`/investors/updates/${id}`);
  revalidatePath("/investors/updates");
  return { ok: "Released (stub — real distribution wires later)." };
}
