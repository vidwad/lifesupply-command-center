"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import {
  clearIntegrationSecret,
  setIntegrationSecret,
  updateIntegrationNotes,
} from "@/server/services/integrations";
import { SecretVaultNotConfiguredError } from "@/server/security/secrets";
import { requirePermission } from "@/server/permissions";

export type SecretActionState = { error?: string; ok?: string } | undefined;

export async function setSecretAction(
  _prev: SecretActionState,
  formData: FormData,
): Promise<SecretActionState> {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const integrationId = String(formData.get("integrationId") ?? "");
  const plaintext = String(formData.get("secret") ?? "");
  if (!integrationId) return { error: "Integration is required." };
  if (!plaintext.trim()) return { error: "Secret cannot be empty." };

  try {
    await setIntegrationSecret({ integrationId, plaintext, actorUserId: user.id });
  } catch (err) {
    if (err instanceof SecretVaultNotConfiguredError) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "Failed to set secret." };
  }

  revalidatePath("/admin/integrations");
  revalidatePath("/automation");
  return { ok: "Saved." };
}

export async function clearSecretAction(formData: FormData): Promise<void> {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const integrationId = String(formData.get("integrationId") ?? "");
  if (!integrationId) return;
  await clearIntegrationSecret({ integrationId, actorUserId: user.id });
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
