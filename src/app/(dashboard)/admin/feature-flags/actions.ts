"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { ALL_FEATURE_FLAG_KEYS, type FeatureFlagKey } from "@/lib/feature-flags";
import { setFeatureFlag } from "@/server/services/feature-flags";
import { requirePermission } from "@/server/permissions";

export type FeatureFlagActionState = { error?: string; ok?: string } | undefined;

const KNOWN_KEYS = new Set<string>(ALL_FEATURE_FLAG_KEYS);

export async function toggleFeatureFlagAction(
  _prev: FeatureFlagActionState,
  formData: FormData,
): Promise<FeatureFlagActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);

  const key = String(formData.get("key") ?? "");
  if (!KNOWN_KEYS.has(key)) return { error: "Unknown feature flag." };

  const enabled = String(formData.get("enabled") ?? "false") === "true";

  try {
    await setFeatureFlag(key as FeatureFlagKey, enabled, { id: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update flag." };
  }

  revalidatePath("/admin/feature-flags");
  return { ok: enabled ? `${key} enabled.` : `${key} disabled.` };
}
