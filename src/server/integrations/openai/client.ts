import OpenAI from "openai";

import { resolveCredential } from "@/server/services/integrations";
import { getSetting } from "@/server/services/system-settings";

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
 * Resolution order: env OPENAI_MODEL → SystemSetting `ai.default_model`
 * (only if the system provider is OpenAI) → built-in default.
 */
export async function resolveOpenAiModel(): Promise<string> {
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  const provider = await getSetting("ai.default_provider");
  if (provider === "openai") {
    return await getSetting("ai.default_model");
  }
  return "gpt-5-mini";
}
