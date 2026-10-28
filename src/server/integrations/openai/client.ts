import OpenAI from "openai";

import { resolveCredential } from "@/server/services/integrations";
import { getSetting } from "@/server/services/system-settings";

/** The text model when nothing is configured anywhere. */
export const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
/**
 * The image model when nothing is configured anywhere. Favours identity
 * fidelity over resolution; see product-studio/image-model.ts.
 */
export const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-1.5";

/**
 * Returns an OpenAI client, or null if no API key is available.
 *
 * Resolution order: process.env.OPENAI_API_KEY (env wins), then the
 * encrypted vault's openai.apiKey entry. Callers must handle the null
 * case (typically by throwing AiNotConfiguredError from the AI service).
 */
export async function getOpenAiClient(): Promise<OpenAI | null> {
  const apiKey = await resolveCredential("openai", "apiKey");
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

/**
 * The OpenAI text model, used by Product Studio research, image QA and
 * description reformatting. Resolution order (2026-10-26):
 *
 *   1. env OPENAI_MODEL — the environment always wins;
 *   2. SystemSetting `ai.openai_model`, the admin's Product Studio choice;
 *   3. SystemSetting `ai.default_model`, the shared default;
 *   4. the built-in default.
 */
export async function resolveOpenAiModel(): Promise<string> {
  const env = process.env.OPENAI_MODEL?.trim();
  if (env) return env;
  const dedicated = (await getSetting("ai.openai_model")).trim();
  if (dedicated) return dedicated;
  const shared = (await getSetting("ai.default_model")).trim();
  if (shared) return shared;
  return DEFAULT_OPENAI_MODEL;
}

/**
 * The OpenAI image model for Product Studio generation. Resolution order
 * (2026-10-26): env OPENAI_IMAGE_MODEL, then SystemSetting
 * `ai.openai_image_model`, then the built-in default.
 */
export async function resolveOpenAiImageModel(): Promise<string> {
  const env = process.env.OPENAI_IMAGE_MODEL?.trim();
  if (env) return env;
  const setting = (await getSetting("ai.openai_image_model")).trim();
  if (setting) return setting;
  return DEFAULT_OPENAI_IMAGE_MODEL;
}
