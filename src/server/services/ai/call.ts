/**
 * AI invocation. Renders the prompt template, hits OpenAI, and returns a
 * normalized response shape that the AI service persists as an AiOutput.
 *
 * OpenAI is the only provider (product owner, 2026-10-27). The template's
 * `provider` column is kept for history; whatever it says, the call goes to
 * OpenAI. Before that date each template chose between two providers.
 *
 * Why split this out of `services/ai/index.ts`:
 * - keeps the provider import server-only and gated by credential resolution
 * - one place to add structured-output validation, retries, or routing
 *   logic in a later phase
 * - tests can stub this module without touching the AI service callers
 */

import type OpenAI from "openai";

import { getOpenAiClient, resolveOpenAiModel } from "@/server/integrations/openai/client";
import { renderPrompt, type RenderedPrompt } from "@/server/services/prompt-templates";
import { getSetting } from "@/server/services/system-settings";

import {
  AiOutputTruncatedError,
  AiOutputValidationError,
  AiProviderNotConfiguredError,
} from "./errors";
import { hasSchema, validateAiOutput } from "./output-schemas";

export type AiCallResult = {
  template: RenderedPrompt;
  output: string;
  /** Parsed structured output if the template has a registered Zod schema. */
  structuredOutput: unknown | null;
  modelProvider: "openai";
  modelName: string;
  tokenUsage: { inputTokens: number | null; outputTokens: number | null };
};

export type AiCallOptions = {
  /**
   * Hard cap on output tokens. Defaults to the `ai.max_output_tokens`
   * setting (4096). The GPT-5 family spends this cap on reasoning before it
   * writes, so a 1024 cap left an analyst answer empty on 2026-11-04.
   */
  maxOutputTokens?: number;
  /**
   * Who the call is for (2026-11-03). Named on the usage ledger row and
   * counted against that person's daily budget; an unattended call leaves
   * it out and counts only against the organisation-wide cap.
   */
  actorUserId?: string | null;
};

/**
 * Render a template + invoke the model. The AI service wraps this with
 * permission checks, AiOutput persistence, and audit logging — this
 * function deliberately does NEITHER so it remains pure I/O.
 */
export async function aiCall(
  templateKey: string,
  vars: Record<string, string>,
  options: AiCallOptions = {},
): Promise<AiCallResult> {
  const template = await renderPrompt(templateKey, vars);
  const maxTokens = options.maxOutputTokens ?? (await resolveMaxOutputTokens());

  // The client checks the day's budget and meters the call under the
  // template's key, so every template is on the ledger by name.
  const client = await getOpenAiClient({ userId: options.actorUserId, feature: templateKey });
  if (!client) throw new AiProviderNotConfiguredError("openai");
  const raw = await invokeOpenAi(client, template, maxTokens);

  let structuredOutput: unknown | null = null;
  if (hasSchema(templateKey)) {
    const validation = validateAiOutput(templateKey, raw.output);
    if (!validation.ok) {
      throw new AiOutputValidationError(templateKey, validation.issues);
    }
    structuredOutput = validation.parsed;
  }

  return { ...raw, structuredOutput };
}

async function invokeOpenAi(
  client: OpenAI,
  template: RenderedPrompt,
  maxTokens: number,
): Promise<Omit<AiCallResult, "structuredOutput">> {
  const model = template.modelHint ?? (await resolveOpenAiModel());
  const response = await client.chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    messages: [
      { role: "system", content: template.systemPrompt },
      { role: "user", content: template.userPrompt },
    ],
  });
  const choice = response.choices[0];
  const output = (choice?.message?.content ?? "").trim();
  if (!output && choice?.finish_reason === "length") {
    throw new AiOutputTruncatedError(maxTokens);
  }
  return {
    template,
    output,
    modelProvider: "openai",
    modelName: response.model,
    tokenUsage: {
      inputTokens: response.usage?.prompt_tokens ?? null,
      outputTokens: response.usage?.completion_tokens ?? null,
    },
  };
}

/** The `ai.max_output_tokens` setting, or 4096 when it is unset or malformed. */
async function resolveMaxOutputTokens(): Promise<number> {
  const raw = Number(await getSetting("ai.max_output_tokens"));
  return Number.isFinite(raw) && raw >= 64 ? Math.round(raw) : 4096;
}
