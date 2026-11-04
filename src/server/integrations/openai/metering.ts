/**
 * Usage metering for the OpenAI client (2026-11-03).
 *
 * `meteredFetch` wraps the SDK's transport so that every billable request
 * leaves one `AiUsageEvent` behind, whichever service made it and whether
 * or not that service remembered to record anything. The response passes
 * through untouched; the ledger write happens on a clone, and a failure
 * there is swallowed, so metering can never break the call it measures.
 *
 * What is metered: Responses, Chat Completions, image generation and edits,
 * and audio transcription. Model listing and client-secret minting carry no
 * usage. Live Realtime sessions run over WebRTC straight from the browser,
 * so their usage is recorded by the live-dialog route from the session's
 * own `response.done` events and wall time, not here.
 *
 * The parsers are pure and exported for their tests.
 */
import type { AiUsageKind } from "@prisma/client";

import { recordAiUsage } from "@/server/services/ai/budget";
import type { UsageCounts } from "@/server/services/ai/pricing";

export type OpenAiUsageAttribution = {
  userId?: string | null;
  /** What spent it, as the ledger and the settings page name it. */
  feature: string;
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const METERED_ENDPOINTS: ReadonlyArray<readonly [RegExp, AiUsageKind]> = [
  [/\/v1\/responses\/?$/, "text"],
  [/\/v1\/chat\/completions\/?$/, "text"],
  [/\/v1\/images\/(generations|edits|variations)\/?$/, "image"],
  [/\/v1\/audio\/transcriptions\/?$/, "transcription"],
];

/** Which ledger kind a request is, or null when it carries no usage. */
export function usageKindForRequest(url: string, method: string | undefined): AiUsageKind | null {
  if ((method ?? "GET").toUpperCase() !== "POST") return null;
  const path = url.split("?")[0] ?? url;
  for (const [pattern, kind] of METERED_ENDPOINTS) {
    if (pattern.test(path)) return kind;
  }
  return null;
}

/** The `model` the request named, from a JSON string body or multipart form data. */
export function modelFromRequestBody(body: unknown): string | null {
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as { model?: unknown };
      return typeof parsed.model === "string" ? parsed.model : null;
    } catch {
      return null;
    }
  }
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const model = body.get("model");
    return typeof model === "string" ? model : null;
  }
  return null;
}

type RawUsage = Record<string, unknown> | null | undefined;

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

/**
 * One shape from the three OpenAI usage dialects: Responses and images
 * (`input_tokens` with `input_tokens_details`), Chat (`prompt_tokens` with
 * `prompt_tokens_details`), and transcription and Realtime
 * (`input_token_details`, singular). Returns null when nothing countable is
 * present, so a response without usage leaves no ledger row.
 */
export function normaliseOpenAiUsage(raw: RawUsage, kind: AiUsageKind): UsageCounts | null {
  if (!raw || typeof raw !== "object") return null;

  if (raw.type === "duration") {
    const seconds = num(raw.seconds);
    return seconds == null ? null : { audioSeconds: seconds };
  }

  const inputTokens = num(raw.input_tokens) ?? num(raw.prompt_tokens);
  const outputTokens = num(raw.output_tokens) ?? num(raw.completion_tokens);
  if (inputTokens == null && outputTokens == null) return null;

  const inDetails = {
    ...obj(raw.prompt_tokens_details),
    ...obj(raw.input_tokens_details),
    ...obj(raw.input_token_details),
  };
  const outDetails = {
    ...obj(raw.completion_tokens_details),
    ...obj(raw.output_tokens_details),
    ...obj(raw.output_token_details),
  };

  const counts: UsageCounts = {
    inputTokens: inputTokens ?? 0,
    outputTokens: outputTokens ?? 0,
    cachedInputTokens: num(inDetails.cached_tokens),
    audioInputTokens: num(inDetails.audio_tokens),
    audioOutputTokens: num(outDetails.audio_tokens),
    imageInputTokens: num(inDetails.image_tokens),
    imageOutputTokens: kind === "image" ? (outputTokens ?? 0) : undefined,
  };
  return counts;
}

/**
 * The usage carried by a server-sent-event stream: the Responses API's
 * `response.completed` event, or a Chat chunk with a `usage` object (sent
 * last when `stream_options.include_usage` is on). Also the model named by
 * the stream, when it is.
 */
export function parseSseUsage(text: string): { usage: RawUsage; model: string | null } {
  let usage: RawUsage = null;
  let model: string | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const event = JSON.parse(payload) as Record<string, unknown>;
      const response = obj(event.response);
      if (event.type === "response.completed" && response.usage) {
        usage = obj(response.usage);
        if (typeof response.model === "string") model = response.model;
      } else if (event.usage && typeof event.usage === "object") {
        usage = obj(event.usage);
        if (typeof event.model === "string") model = event.model;
      }
    } catch {
      // A partial or non-JSON line carries no usage.
    }
  }
  return { usage, model };
}

function urlOf(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/**
 * The SDK transport, with the ledger write attached. `baseFetch` is the
 * global fetch unless a test supplies one.
 */
export function meteredFetch(
  attribution: OpenAiUsageAttribution,
  baseFetch?: FetchLike,
): FetchLike {
  const doFetch: FetchLike = baseFetch ?? ((input, init) => fetch(input, init));
  return async (input, init) => {
    const response = await doFetch(input, init);
    const url = urlOf(input);
    const kind = usageKindForRequest(
      url,
      init?.method ?? (input instanceof Request ? input.method : undefined),
    );
    if (!kind || !response.ok || !response.body) return response;

    const endpoint = url.split("?")[0]?.replace(/^https?:\/\/[^/]+/, "") ?? url;
    const requestModel = modelFromRequestBody(init?.body);
    const record = (raw: RawUsage, model: string | null) => {
      const usage = normaliseOpenAiUsage(raw, kind);
      if (!usage) return Promise.resolve();
      return recordAiUsage({
        userId: attribution.userId ?? null,
        feature: attribution.feature,
        kind,
        modelName: model ?? requestModel ?? "unknown",
        usage,
        metadata: { endpoint },
      });
    };

    const contentType = response.headers.get("content-type") ?? "";
    try {
      const clone = response.clone();
      if (contentType.includes("text/event-stream")) {
        // Read the copy as it streams; the caller's copy is not held up.
        void clone
          .text()
          .then((text) => {
            const parsed = parseSseUsage(text);
            return record(parsed.usage, parsed.model);
          })
          .catch(() => undefined);
      } else {
        const json = (await clone.json()) as { usage?: RawUsage; model?: unknown };
        await record(json.usage, typeof json.model === "string" ? json.model : null);
      }
    } catch {
      // Metering never breaks the call it measures.
    }
    return response;
  };
}
