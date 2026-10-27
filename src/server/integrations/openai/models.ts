/**
 * The OpenAI models the configured key can use (2026-10-26), for the AI
 * settings page to list under the Product Studio fields. Read-only; a
 * failure is returned, never thrown, so the page still renders with the
 * static suggestions.
 */
import { getOpenAiClient } from "./client";

export type OpenAiModelChoices = { text: string[]; image: string[] };

export type OpenAiModelListing =
  | { ok: true; choices: OpenAiModelChoices; total: number }
  | { ok: false; reason: string };

/** Model families Product Studio can drive, and variants it cannot. */
const TEXT_FAMILY = /^(gpt-5|gpt-4\.1|o[1-9])/;
const NOT_TEXT =
  /(audio|realtime|tts|transcribe|image|embedding|moderation|search-preview|codex|-pro$)/;
const IMAGE_FAMILY = /^gpt-image-/;

/**
 * Pure: narrows a model id list to the ones the two fields accept. Text
 * models are the Responses-capable chat families; audio, realtime, speech,
 * embedding, moderation and search-preview variants are left out because
 * they cannot run research with web search and structured output.
 */
export function pickModelChoices(ids: readonly string[]): OpenAiModelChoices {
  const unique = [...new Set(ids)].sort();
  return {
    text: unique.filter((id) => TEXT_FAMILY.test(id) && !NOT_TEXT.test(id)),
    image: unique.filter((id) => IMAGE_FAMILY.test(id)),
  };
}

export async function listOpenAiModels(): Promise<OpenAiModelListing> {
  const client = await getOpenAiClient();
  if (!client) return { ok: false, reason: "No OpenAI API key is configured." };
  try {
    const ids: string[] = [];
    for await (const model of client.models.list()) ids.push(model.id);
    return { ok: true, choices: pickModelChoices(ids), total: ids.length };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "The model list could not be fetched.",
    };
  }
}
