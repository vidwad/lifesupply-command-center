import Anthropic from "@anthropic-ai/sdk";

import { resolveCredential } from "@/server/services/integrations";

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

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
