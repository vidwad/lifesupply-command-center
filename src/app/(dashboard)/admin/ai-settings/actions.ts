"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { setSetting, type SettingKey } from "@/server/services/system-settings";
import { requirePermission } from "@/server/permissions";

export type AiSettingsActionState = { error?: string; ok?: string } | undefined;

const ALLOWED_KEYS: SettingKey[] = [
  "ai.default_model",
  "ai.max_output_tokens",
  "ai.temperature",
  "ai.openai_model",
  "ai.openai_image_model",
];

/** Keys an empty value clears, meaning "fall back to the next in the order". */
const CLEARABLE_KEYS: SettingKey[] = ["ai.openai_model", "ai.openai_image_model"];

/** An exact provider model identifier: letters, digits, dots, dashes, colons. */
const MODEL_ID = /^[a-z0-9][a-z0-9._:-]{1,80}$/i;

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
      if (!value) {
        // The Product Studio model fields may be emptied to fall back.
        if (CLEARABLE_KEYS.includes(key)) await setSetting(key, "", null, { id: actor.id });
        continue;
      }

      if (CLEARABLE_KEYS.includes(key) && !MODEL_ID.test(value)) {
        return { error: "Model names may contain only letters, digits, dots, dashes and colons." };
      }
      if (key === "ai.openai_image_model" && !/^gpt-image-/i.test(value)) {
        return { error: "The image model must be one of OpenAI's gpt-image models." };
      }
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
