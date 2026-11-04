"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { OPENAI_REALTIME_VOICES } from "@/server/integrations/openai/client";
import { setSetting, type SettingKey } from "@/server/services/system-settings";
import { requirePermission } from "@/server/permissions";

export type AiSettingsActionState = { error?: string; ok?: string } | undefined;

const ALLOWED_KEYS: SettingKey[] = [
  "ai.default_model",
  "ai.max_output_tokens",
  "ai.temperature",
  "ai.openai_model",
  "ai.openai_image_model",
  "ai.openai_realtime_model",
  "ai.openai_realtime_voice",
  "ai.openai_transcribe_model",
  "ai.budget.daily_usd",
  "ai.budget.daily_usd_per_user",
  "ai.budget.daily_voice_minutes",
  "ai.budget.daily_voice_minutes_per_user",
  "ai.budget.voice_session_max_minutes",
];

/** Keys an empty value clears, meaning "fall back to the next in the order". */
const CLEARABLE_KEYS: SettingKey[] = [
  "ai.openai_model",
  "ai.openai_image_model",
  "ai.openai_realtime_model",
  "ai.openai_realtime_voice",
  "ai.openai_transcribe_model",
];

/** Daily caps: a whole or decimal number, 0 meaning no cap. */
const BUDGET_KEYS: SettingKey[] = [
  "ai.budget.daily_usd",
  "ai.budget.daily_usd_per_user",
  "ai.budget.daily_voice_minutes",
  "ai.budget.daily_voice_minutes_per_user",
];

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
        // The model and voice fields may be emptied to fall back.
        if (CLEARABLE_KEYS.includes(key)) await setSetting(key, "", null, { id: actor.id });
        continue;
      }

      if (CLEARABLE_KEYS.includes(key) && !MODEL_ID.test(value)) {
        return { error: "Model names may contain only letters, digits, dots, dashes and colons." };
      }
      if (key === "ai.openai_image_model" && !/^gpt-image-/i.test(value)) {
        return { error: "The image model must be one of OpenAI's gpt-image models." };
      }
      if (key === "ai.openai_realtime_model" && !/realtime/i.test(value)) {
        return { error: "The live-dialog model must be one of OpenAI's realtime models." };
      }
      if (key === "ai.openai_transcribe_model" && !/transcribe|whisper/i.test(value)) {
        return { error: "The transcription model must be a transcribe or whisper model." };
      }
      if (
        key === "ai.openai_realtime_voice" &&
        !(OPENAI_REALTIME_VOICES as readonly string[]).includes(value.toLowerCase())
      ) {
        return { error: `The voice must be one of: ${OPENAI_REALTIME_VOICES.join(", ")}.` };
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
      if (BUDGET_KEYS.includes(key)) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
          return { error: "Daily limits must be 0 (no limit) or a positive number." };
        }
      }
      if (key === "ai.budget.voice_session_max_minutes") {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 1 || n > 120) {
          return { error: "The longest live session must be between 1 and 120 minutes." };
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
