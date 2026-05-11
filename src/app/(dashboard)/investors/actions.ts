"use server";

import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import { createInvestor, updateInvestor } from "@/server/services/investors";
import { requirePermission } from "@/server/permissions";

export type InvestorFormState = { error?: string; ok?: string } | undefined;

type InvestorType = "angel" | "vc" | "family_office" | "lender" | "strategic" | "other";
type InvestorStatus = "prospect" | "engaged" | "committed" | "declined" | "closed";

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    organization: String(formData.get("organization") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    investorType: (String(formData.get("investorType") ?? "").trim() ||
      null) as InvestorType | null,
    status: (String(formData.get("status") ?? "prospect").trim() || "prospect") as InvestorStatus,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createInvestorAction(
  _prev: InvestorFormState,
  formData: FormData,
): Promise<InvestorFormState> {
  const user = await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  const data = readForm(formData);
  if (!data.name) return { error: "Name is required." };

  let investor;
  try {
    investor = await createInvestor({ ...data, actorUserId: user.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create investor." };
  }
  redirect(`/investors/${investor.id}`);
}

export async function updateInvestorAction(
  _prev: InvestorFormState,
  formData: FormData,
): Promise<InvestorFormState> {
  const user = await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  const investorId = String(formData.get("investorId") ?? "");
  if (!investorId) return { error: "Investor is required." };
  const data = readForm(formData);
  if (!data.name) return { error: "Name is required." };

  try {
    await updateInvestor({ ...data, investorId, actorUserId: user.id });
    return { ok: "Saved." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save." };
  }
}
