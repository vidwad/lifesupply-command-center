import OpenAI from "openai";

import { assertAiBudget } from "@/server/services/ai/budget";
import { resolveCredential } from "@/server/services/integrations";
import { getSetting } from "@/server/services/system-settings";

import { meteredFetch, type OpenAiUsageAttribution } from "./metering";

/** The text model when nothing is configured anywhere. */
export const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
/**
 * The image model when nothing is configured anywhere. Favours identity
 * fidelity over resolution; see product-studio/image-model.ts.
 */
export const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-1.5";
/**
 * The live-dialog model when nothing is configured anywhere. GPT-Live
 * (2026-11-06): one voice model, gpt-live-1, billed by the second, with a
 * backend text model doing the tool work. The Realtime models the setting
 * first named (2026-11-03) are deprecated by OpenAI and cannot open a Live
 * session; the voice service refuses them with a message naming this
 * setting. The daily voice budgets bound what a session can cost.
 */
export const DEFAULT_OPENAI_REALTIME_MODEL = "gpt-live-1";
/** The live-dialog voice. marin is GPT-Live's default. */
export const DEFAULT_OPENAI_REALTIME_VOICE = "marin";
/** Transcribes dictation in text mode (GPT-Live transcribes its own sessions). */
export const DEFAULT_OPENAI_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";

/** The GPT-Live voices OpenAI names (2026-11-06): the default first. */
export const OPENAI_REALTIME_VOICES = [
  "marin",
  "quartz",
  "ripple",
  "vesper",
  "willow",
  "stone",
  "gleam",
  "meridian",
  "bossa",
  "tempo",
  "beacon",
  "delta",
  "cinder",
  "nuri",
  "juni",
  "flitz",
  "brise",
  "sillage",
  "nira",
  "harema",
  "shida",
  "noeul",
] as const;

export type GetOpenAiClientOptions =
  | OpenAiUsageAttribution
  /** Only for calls that carry no usage, such as listing the models. */
  | { metered: false };

/**
 * Returns an OpenAI client, or null if no API key is available.
 *
 * Resolution order: process.env.OPENAI_API_KEY (env wins), then the
 * encrypted vault's openai.apiKey entry. Callers must handle the null
 * case (typically by throwing AiNotConfiguredError from the AI service).
 *
 * Since 2026-11-03 the client is the budget chokepoint. Before it is handed
 * out, the day's spend is checked against the caps in Admin → AI Settings
 * (`AiBudgetExceededError` when reached), and every billable call it then
 * makes is written to the usage ledger under the given attribution. A
 * caller that cannot name a feature is recorded as "unattributed"; only the
 * model listing opts out with `{ metered: false }`.
 */
export async function getOpenAiClient(
  options: GetOpenAiClientOptions = { feature: "unattributed" },
): Promise<OpenAI | null> {
  const apiKey = await resolveCredential("openai", "apiKey");
  if (!apiKey) return null;
  if ("metered" in options) return new OpenAI({ apiKey });
  await assertAiBudget({ userId: options.userId, kind: "spend" });
  return new OpenAI({ apiKey, fetch: meteredFetch(options) });
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

/**
 * The live-dialog (GPT-Live) model. Resolution order (2026-11-03): env
 * OPENAI_REALTIME_MODEL, then SystemSetting `ai.openai_realtime_model`,
 * then the built-in default. The shared default model is not consulted: a
 * text model cannot hold a voice session. The names keep "realtime" from
 * the first design so existing settings and environments still apply.
 */
export async function resolveOpenAiRealtimeModel(): Promise<string> {
  const env = process.env.OPENAI_REALTIME_MODEL?.trim();
  if (env) return env;
  const setting = (await getSetting("ai.openai_realtime_model")).trim();
  if (setting) return setting;
  return DEFAULT_OPENAI_REALTIME_MODEL;
}

/** The live-dialog voice: env OPENAI_REALTIME_VOICE, then the setting, then the default. */
export async function resolveOpenAiRealtimeVoice(): Promise<string> {
  const env = process.env.OPENAI_REALTIME_VOICE?.trim();
  if (env) return env;
  const setting = (await getSetting("ai.openai_realtime_voice")).trim();
  if (setting) return setting;
  return DEFAULT_OPENAI_REALTIME_VOICE;
}

/** The speech-to-text model: env OPENAI_TRANSCRIBE_MODEL, then the setting, then the default. */
export async function resolveOpenAiTranscribeModel(): Promise<string> {
  const env = process.env.OPENAI_TRANSCRIBE_MODEL?.trim();
  if (env) return env;
  const setting = (await getSetting("ai.openai_transcribe_model")).trim();
  if (setting) return setting;
  return DEFAULT_OPENAI_TRANSCRIBE_MODEL;
}
