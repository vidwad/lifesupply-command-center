"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import {
  clearIntegrationField,
  setIntegrationField,
  updateIntegrationNotes,
} from "@/server/services/integrations";
import { SecretVaultNotConfiguredError } from "@/server/security/secrets";
import { requirePermission } from "@/server/permissions";

export type FieldActionState = { error?: string; ok?: string } | undefined;

export async function setFieldAction(
  _prev: FieldActionState,
  formData: FormData,
): Promise<FieldActionState> {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const integrationId = String(formData.get("integrationId") ?? "");
  const fieldName = String(formData.get("fieldName") ?? "");
  const plaintext = String(formData.get("value") ?? "");
  if (!integrationId) return { error: "Integration is required." };
  if (!fieldName) return { error: "Field is required." };
  if (!plaintext.trim()) return { error: "Value cannot be empty." };

  try {
    await setIntegrationField({ integrationId, fieldName, plaintext, actorUserId: user.id });
  } catch (err) {
    if (err instanceof SecretVaultNotConfiguredError) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "Failed to set value." };
  }

  revalidatePath("/admin/integrations");
  revalidatePath("/automation");
  return { ok: "Saved." };
}

export async function clearFieldAction(formData: FormData): Promise<void> {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const integrationId = String(formData.get("integrationId") ?? "");
  const fieldName = String(formData.get("fieldName") ?? "");
  if (!integrationId || !fieldName) return;
  await clearIntegrationField({ integrationId, fieldName, actorUserId: user.id });
  revalidatePath("/admin/integrations");
  revalidatePath("/automation");
}

export async function updateNotesAction(formData: FormData): Promise<void> {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const integrationId = String(formData.get("integrationId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!integrationId) return;
  await updateIntegrationNotes({ integrationId, notes, actorUserId: user.id });
  revalidatePath("/admin/integrations");
}
