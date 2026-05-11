"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { createDivision, updateDivision } from "@/server/services/divisions";
import { requirePermission } from "@/server/permissions";

export type DivisionActionState = { error?: string; ok?: string } | undefined;

function parseInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    type: String(formData.get("type") ?? "") || null,
    jurisdiction: String(formData.get("jurisdiction") ?? "") || null,
    parentDivisionId: String(formData.get("parentDivisionId") ?? "") || null,
    isActive: String(formData.get("isActive") ?? "true") !== "false",
  };
}

export async function createDivisionAction(
  _prev: DivisionActionState,
  formData: FormData,
): Promise<DivisionActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  try {
    const input = parseInput(formData);
    if (!input.name.trim() || !input.code.trim()) return { error: "Name and code are required." };
    await createDivision(input, { id: actor.id });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { error: "A division with this code already exists." };
    }
    return { error: err instanceof Error ? err.message : "Failed to create division." };
  }
  revalidatePath("/admin/divisions");
  return { ok: "Division created." };
}

export async function updateDivisionAction(
  _prev: DivisionActionState,
  formData: FormData,
): Promise<DivisionActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  const id = String(formData.get("divisionId") ?? "");
  if (!id) return { error: "Missing division id." };
  try {
    const input = parseInput(formData);
    await updateDivision(id, input, { id: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update division." };
  }
  revalidatePath("/admin/divisions");
  return { ok: "Division updated." };
}
