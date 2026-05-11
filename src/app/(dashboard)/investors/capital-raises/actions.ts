"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CapitalRaiseStatus, CommitmentStatus } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import {
  createCapitalRaise,
  createCommitment,
  setCapitalRaiseStatus,
  setCommitmentStatus,
} from "@/server/services/strategic/capital-raises";
import { requirePermission } from "@/server/permissions";

export type CapitalRaiseActionState = { error?: string; ok?: string } | undefined;

const VALID_RAISE_STATUS: CapitalRaiseStatus[] = ["planning", "open", "closing", "closed", "cancelled"];
const VALID_COMMITMENT_STATUS: CommitmentStatus[] = ["soft", "signed", "funded", "withdrawn", "declined"];

export async function createCapitalRaiseAction(
  _prev: CapitalRaiseActionState,
  formData: FormData,
): Promise<CapitalRaiseActionState> {
  const actor = await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  const name = String(formData.get("name") ?? "");
  const roundType = String(formData.get("roundType") ?? "");
  const targetAmount = Number(formData.get("targetAmount") ?? "");
  const preMoneyValuation = formData.get("preMoneyValuation");
  const description = String(formData.get("description") ?? "") || null;

  try {
    const id = await createCapitalRaise(
      {
        name,
        roundType,
        targetAmount,
        preMoneyValuation: preMoneyValuation ? Number(preMoneyValuation) : null,
        description,
      },
      { id: actor.id },
    );
    revalidatePath("/investors/capital-raises");
    redirect(`/investors/capital-raises/${id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create round." };
  }
}

export async function setRaiseStatusAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !VALID_RAISE_STATUS.includes(status as CapitalRaiseStatus)) return;
  await setCapitalRaiseStatus(id, status as CapitalRaiseStatus, { id: actor.id });
  revalidatePath("/investors/capital-raises");
  revalidatePath(`/investors/capital-raises/${id}`);
}

export async function createCommitmentAction(
  _prev: CapitalRaiseActionState,
  formData: FormData,
): Promise<CapitalRaiseActionState> {
  const actor = await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  const capitalRaiseId = String(formData.get("capitalRaiseId") ?? "");
  const investorId = String(formData.get("investorId") ?? "") || null;
  const investorLabel = String(formData.get("investorLabel") ?? "") || null;
  const amount = Number(formData.get("amount") ?? "");
  const status = String(formData.get("status") ?? "soft");
  if (!capitalRaiseId) return { error: "Missing round id." };
  if (!VALID_COMMITMENT_STATUS.includes(status as CommitmentStatus))
    return { error: "Invalid status." };
  try {
    await createCommitment(
      {
        capitalRaiseId,
        investorId,
        investorLabel,
        amount,
        status: status as CommitmentStatus,
      },
      { id: actor.id },
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to record commitment." };
  }
  revalidatePath(`/investors/capital-raises/${capitalRaiseId}`);
  return { ok: "Commitment recorded." };
}

export async function setCommitmentStatusAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const capitalRaiseId = String(formData.get("capitalRaiseId") ?? "");
  if (!id || !VALID_COMMITMENT_STATUS.includes(status as CommitmentStatus)) return;
  await setCommitmentStatus(id, status as CommitmentStatus, { id: actor.id });
  if (capitalRaiseId) revalidatePath(`/investors/capital-raises/${capitalRaiseId}`);
}
