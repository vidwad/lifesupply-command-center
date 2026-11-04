/**
 * OpenAI list prices, for the daily budgets (2026-11-03).
 *
 * Pure. Turns a call's token counts into an estimated USD cost so the ledger
 * (`AiUsageEvent.estimatedCostUsd`) can be summed against the caps set in
 * Admin → AI Settings. Two things to keep in mind:
 *
 * - These are list prices as published on OpenAI's pricing page on the date
 *   in `PRICES_AS_OF`, in USD per million tokens. They are an estimate of
 *   what the invoice will say, never the invoice. Batch discounts, priority
 *   tiers and negotiated rates are not modelled.
 * - An unknown model is priced at the dearest rate of its kind, so a cap
 *   errs on the side of stopping early rather than failing open. When a new
 *   model appears, add a row rather than letting it fall through.
 *
 * Matching is by longest prefix, so `gpt-5-mini-2026-xx` finds `gpt-5-mini`
 * before `gpt-5`.
 */
import type { AiUsageKind } from "@prisma/client";

export const PRICES_AS_OF = "2026-11-03";

/** USD per million tokens, by token class. Absent means the model has no such class. */
export type ModelRate = {
  inputText: number;
  cachedInputText?: number;
  outputText: number;
  inputAudio?: number;
  cachedInputAudio?: number;
  outputAudio?: number;
  inputImage?: number;
  outputImage?: number;
  /** For duration-billed transcription (whisper): USD per minute of audio. */
  perAudioMinute?: number;
};

/**
 * Ordered longest-prefix-first within a family so the loop below can take
 * the first match. Keep variants above their base model.
 */
export const MODEL_RATES: ReadonlyArray<readonly [prefix: string, rate: ModelRate]> = [
  // --- Text (Responses / Chat Completions) -------------------------------
  ["gpt-5-pro", { inputText: 15, outputText: 120 }],
  ["gpt-5-nano", { inputText: 0.05, cachedInputText: 0.005, outputText: 0.4 }],
  ["gpt-5-mini", { inputText: 0.25, cachedInputText: 0.025, outputText: 2 }],
  ["gpt-5-codex", { inputText: 1.25, cachedInputText: 0.125, outputText: 10 }],
  ["gpt-5", { inputText: 1.25, cachedInputText: 0.125, outputText: 10 }],
  ["gpt-4.1-nano", { inputText: 0.1, cachedInputText: 0.025, outputText: 0.4 }],
  ["gpt-4.1-mini", { inputText: 0.4, cachedInputText: 0.1, outputText: 1.6 }],
  ["gpt-4.1", { inputText: 2, cachedInputText: 0.5, outputText: 8 }],
  ["o4-mini", { inputText: 1.1, cachedInputText: 0.275, outputText: 4.4 }],
  ["o3-pro", { inputText: 20, outputText: 80 }],
  ["o3-mini", { inputText: 1.1, cachedInputText: 0.55, outputText: 4.4 }],
  ["o3", { inputText: 2, cachedInputText: 0.5, outputText: 8 }],
  ["o1", { inputText: 15, cachedInputText: 7.5, outputText: 60 }],

  // --- Live dialog (Realtime) -------------------------------------------
  [
    "gpt-realtime-mini",
    {
      inputText: 0.6,
      cachedInputText: 0.06,
      outputText: 2.4,
      inputAudio: 10,
      cachedInputAudio: 0.3,
      outputAudio: 20,
    },
  ],
  [
    "gpt-realtime",
    {
      inputText: 4,
      cachedInputText: 0.4,
      outputText: 16,
      inputAudio: 32,
      cachedInputAudio: 0.4,
      outputAudio: 64,
    },
  ],
  [
    "gpt-4o-mini-realtime",
    {
      inputText: 0.6,
      cachedInputText: 0.3,
      outputText: 2.4,
      inputAudio: 10,
      cachedInputAudio: 0.3,
      outputAudio: 20,
    },
  ],
  [
    "gpt-4o-realtime",
    {
      inputText: 5,
      cachedInputText: 2.5,
      outputText: 20,
      inputAudio: 40,
      cachedInputAudio: 2.5,
      outputAudio: 80,
    },
  ],

  // --- Transcription ----------------------------------------------------
  ["gpt-4o-mini-transcribe", { inputText: 1.25, outputText: 5, inputAudio: 3 }],
  ["gpt-4o-transcribe", { inputText: 2.5, outputText: 10, inputAudio: 6 }],
  ["whisper", { inputText: 0, outputText: 0, perAudioMinute: 0.006 }],

  // --- Images (billed by token: text and image input, image output) ------
  ["gpt-image-1-mini", { inputText: 2, outputText: 0, inputImage: 2.5, outputImage: 8 }],
  ["gpt-image-1.5", { inputText: 5, outputText: 0, inputImage: 10, outputImage: 40 }],
  ["gpt-image-1", { inputText: 5, outputText: 0, inputImage: 10, outputImage: 40 }],
  ["gpt-image-2", { inputText: 5, outputText: 0, inputImage: 10, outputImage: 40 }],
  ["gpt-4o-mini", { inputText: 0.15, cachedInputText: 0.075, outputText: 0.6 }],
  ["gpt-4o", { inputText: 2.5, cachedInputText: 1.25, outputText: 10 }],
];

/** The dearest rate of each kind, for models the table does not know. */
export const FALLBACK_RATES: Record<AiUsageKind, ModelRate> = {
  text: { inputText: 20, cachedInputText: 10, outputText: 120 },
  realtime: {
    inputText: 5,
    cachedInputText: 2.5,
    outputText: 20,
    inputAudio: 40,
    cachedInputAudio: 2.5,
    outputAudio: 80,
  },
  transcription: { inputText: 2.5, outputText: 10, inputAudio: 6 },
  image: { inputText: 5, outputText: 0, inputImage: 10, outputImage: 40 },
};

/** Token counts as the ledger stores them. Every field optional; absent is zero. */
export type UsageCounts = {
  inputTokens?: number | null;
  cachedInputTokens?: number | null;
  outputTokens?: number | null;
  audioInputTokens?: number | null;
  audioOutputTokens?: number | null;
  imageInputTokens?: number | null;
  imageOutputTokens?: number | null;
  audioSeconds?: number | null;
};

export function rateForModel(
  model: string,
  kind: AiUsageKind,
): { rate: ModelRate; known: boolean } {
  const id = model.trim().toLowerCase();
  let best: ModelRate | null = null;
  let bestLength = -1;
  for (const [prefix, rate] of MODEL_RATES) {
    if (id.startsWith(prefix) && prefix.length > bestLength) {
      best = rate;
      bestLength = prefix.length;
    }
  }
  if (best) return { rate: best, known: true };
  return { rate: FALLBACK_RATES[kind], known: false };
}

const n = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
const perMillion = (tokens: number, usdPerMillion: number | undefined) =>
  usdPerMillion == null ? 0 : (tokens / 1_000_000) * usdPerMillion;

/**
 * Estimated USD for one call, rounded to four decimals (the ledger column's
 * scale). `inputTokens` is the whole input; audio, image and cached counts
 * are the parts of it that carry a different price, so they are subtracted
 * from the text remainder rather than added on top. `outputTokens` likewise.
 *
 * For whisper-style duration billing, `audioSeconds` is the figure.
 */
export function estimateCostUsd(
  model: string,
  kind: AiUsageKind,
  usage: UsageCounts,
): { usd: number; known: boolean } {
  const { rate, known } = rateForModel(model, kind);

  const cachedIn = n(usage.cachedInputTokens);
  const audioIn = n(usage.audioInputTokens);
  const imageIn = n(usage.imageInputTokens);
  const textIn = Math.max(0, n(usage.inputTokens) - cachedIn - audioIn - imageIn);

  const audioOut = n(usage.audioOutputTokens);
  const imageOut =
    kind === "image"
      ? Math.max(n(usage.imageOutputTokens), n(usage.outputTokens))
      : n(usage.imageOutputTokens);
  const textOut = kind === "image" ? 0 : Math.max(0, n(usage.outputTokens) - audioOut - imageOut);

  let usd =
    perMillion(textIn, rate.inputText) +
    perMillion(cachedIn, rate.cachedInputText ?? rate.inputText) +
    perMillion(audioIn, rate.inputAudio) +
    perMillion(imageIn, rate.inputImage) +
    perMillion(textOut, rate.outputText) +
    perMillion(audioOut, rate.outputAudio) +
    perMillion(imageOut, rate.outputImage);

  if (rate.perAudioMinute != null) usd += (n(usage.audioSeconds) / 60) * rate.perAudioMinute;

  return { usd: Math.round(usd * 10_000) / 10_000, known };
}
