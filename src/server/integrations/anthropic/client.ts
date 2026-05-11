import Anthropic from "@anthropic-ai/sdk";

import { resolveCredential } from "@/server/services/integrations";
import { getSetting } from "@/server/services/system-settings";

/**
 * Returns an Anthropic client, or null if no API key is available.
 *
 * Resolution order: process.env.ANTHROPIC_API_KEY (env wins), then the
 * encrypted vault's anthropic.apiKey entry. Callers must handle the null
 * case (typically by throwing AiNotConfiguredError).
 */
export async function getAnthropicClient(): Promise<Anthropic | null> {
  const apiKey = await resolveCredential("anthropic", "apiKey");
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

/**
 * Resolution order: env ANTHROPIC_MODEL → SystemSetting `ai.default_model`
 * → built-in default. Env wins so production deploys can pin a model.
 */
export async function resolveAnthropicModel(): Promise<string> {
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  return getSetting("ai.default_model");
}

// Synchronous fallback for places that cannot easily await — kept for
// legacy callers, but `resolveAnthropicModel()` is preferred.
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
