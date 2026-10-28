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

import { AiOutputValidationError, AiProviderNotConfiguredError } from "./errors";
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
  /** Hard cap on output tokens. Defaults to 1024. */
  maxOutputTokens?: number;
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
  const maxTokens = options.maxOutputTokens ?? 1024;

  const client = await getOpenAiClient();
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
