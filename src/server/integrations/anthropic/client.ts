import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

/**
 * Returns a singleton Anthropic client, or null if ANTHROPIC_API_KEY is not
 * configured. Callers must handle the null case (typically by returning a
 * "configuration required" message rather than throwing).
 */
export function getAnthropicClient(): Anthropic | null {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  cached = new Anthropic({ apiKey });
  return cached;
}

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
