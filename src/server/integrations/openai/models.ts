/**
 * The OpenAI models the configured key can use (2026-10-26), for the AI
 * settings page to list under the model fields. Read-only; a failure is
 * returned, never thrown, so the page still renders with the static
 * suggestions. Since 2026-11-03 the live-dialog families are listed too.
 */
import { getOpenAiClient } from "./client";

export type OpenAiModelChoices = {
  text: string[];
  image: string[];
  /** Models that can hold a live voice session: GPT-Live, and the deprecated Realtime family. */
  realtime: string[];
  /** Speech-to-text models, for live dialog's input transcription and dictation. */
  transcription: string[];
};

export type OpenAiModelListing =
  | { ok: true; choices: OpenAiModelChoices; total: number }
  | { ok: false; reason: string };

/** Model families Product Studio can drive, and variants it cannot. */
const TEXT_FAMILY = /^(gpt-5|gpt-4\.1|o[1-9])/;
const NOT_TEXT =
  /(audio|realtime|tts|transcribe|image|embedding|moderation|search-preview|codex|-pro$)/;
const IMAGE_FAMILY = /^gpt-image-/;
/** Live-dialog models: GPT-Live first (2026-11-06), then the deprecated Realtime family; translation and dated variants left out. */
const REALTIME_FAMILY = /^(gpt-live|gpt-realtime|gpt-4o(-mini)?-realtime)/;
const NOT_REALTIME = /(translation|-\d{4}-\d{2}-\d{2}$)/;
/** Speech-to-text models; `-diarize` variants label speakers, which the drawer does not use. */
const TRANSCRIPTION_FAMILY = /^(gpt-4o(-mini)?-transcribe|whisper-)/;
const NOT_TRANSCRIPTION = /(diarize|-\d{4}-\d{2}-\d{2}$)/;

/**
 * Pure: narrows a model id list to the ones each field accepts. Text
 * models are the Responses-capable chat families; audio, realtime, speech,
 * embedding, moderation and search-preview variants are left out because
 * they cannot run research with web search and structured output. The
 * realtime and transcription lists serve the live-dialog fields.
 */
export function pickModelChoices(ids: readonly string[]): OpenAiModelChoices {
  const unique = [...new Set(ids)].sort();
  return {
    text: unique.filter((id) => TEXT_FAMILY.test(id) && !NOT_TEXT.test(id)),
    image: unique.filter((id) => IMAGE_FAMILY.test(id)),
    realtime: unique.filter((id) => REALTIME_FAMILY.test(id) && !NOT_REALTIME.test(id)),
    transcription: unique.filter(
      (id) => TRANSCRIPTION_FAMILY.test(id) && !NOT_TRANSCRIPTION.test(id),
    ),
  };
}

export async function listOpenAiModels(): Promise<OpenAiModelListing> {
  // Listing carries no usage and must work when the day's budget is spent.
  const client = await getOpenAiClient({ metered: false });
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
