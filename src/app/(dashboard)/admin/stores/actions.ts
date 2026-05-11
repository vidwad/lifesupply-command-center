"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { createStore, updateStore } from "@/server/services/stores";
import { requirePermission } from "@/server/permissions";

export type StoreActionState = { error?: string; ok?: string } | undefined;

function parseInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    divisionId: String(formData.get("divisionId") ?? ""),
    platform: String(formData.get("platform") ?? "manual"),
    url: String(formData.get("url") ?? "") || null,
    sourceSystem: String(formData.get("sourceSystem") ?? "") || null,
    externalStoreId: String(formData.get("externalStoreId") ?? "") || null,
    status: String(formData.get("status") ?? "active"),
  };
}

export async function createStoreAction(
  _prev: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  try {
    const input = parseInput(formData);
    if (!input.name.trim()) return { error: "Store name is required." };
    if (!input.divisionId) return { error: "Choose a division." };
    await createStore(input, { id: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create store." };
  }
  revalidatePath("/admin/stores");
  return { ok: "Store created." };
}

export async function updateStoreAction(
  _prev: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  const id = String(formData.get("storeId") ?? "");
  if (!id) return { error: "Missing store id." };
  try {
    const input = parseInput(formData);
    await updateStore(id, input, { id: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update store." };
  }
  revalidatePath("/admin/stores");
  return { ok: "Store updated." };
}
