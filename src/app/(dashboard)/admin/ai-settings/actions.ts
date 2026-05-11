"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { setSetting, type SettingKey } from "@/server/services/system-settings";
import { requirePermission } from "@/server/permissions";

export type AiSettingsActionState = { error?: string; ok?: string } | undefined;

const ALLOWED_KEYS: SettingKey[] = [
  "ai.default_provider",
  "ai.default_model",
  "ai.max_output_tokens",
  "ai.temperature",
];

export async function saveAiSettingsAction(
  _prev: AiSettingsActionState,
  formData: FormData,
): Promise<AiSettingsActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);

  try {
    for (const key of ALLOWED_KEYS) {
      const raw = formData.get(key);
      if (raw == null) continue;
      const value = String(raw).trim();
      if (!value) continue;

      if (key === "ai.max_output_tokens") {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 64 || n > 32_000) {
          return { error: "Max output tokens must be between 64 and 32000." };
        }
      }
      if (key === "ai.temperature") {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || n > 2) {
          return { error: "Temperature must be between 0 and 2." };
        }
      }
      await setSetting(key, value, null, { id: actor.id });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save AI settings." };
  }

  revalidatePath("/admin/ai-settings");
  return { ok: "AI settings saved." };
}
