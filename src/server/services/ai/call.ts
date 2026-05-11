/**
 * Provider-agnostic AI invocation. Picks Anthropic or OpenAI based on the
 * prompt template's `provider` field, hits the model, and returns a
 * normalized response shape that the AI service persists as an AiOutput.
 *
 * Why split this out of `services/ai/index.ts`:
 * - keeps each provider import server-only and gated by credential resolution
 * - one place to add structured-output validation, retries, or routing
 *   logic in a later phase
 * - tests can stub this module without touching the AI service callers
 */

import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";

import { getAnthropicClient, resolveAnthropicModel } from "@/server/integrations/anthropic/client";
import { getOpenAiClient, resolveOpenAiModel } from "@/server/integrations/openai/client";
import { renderPrompt, type RenderedPrompt } from "@/server/services/prompt-templates";

import {
  AiNotConfiguredError,
  AiOutputValidationError,
  AiProviderNotConfiguredError,
} from "./errors";
import { hasSchema, validateAiOutput } from "./output-schemas";

export type AiCallResult = {
  template: RenderedPrompt;
  output: string;
  /** Parsed structured output if the template has a registered Zod schema. */
  structuredOutput: unknown | null;
  modelProvider: "anthropic" | "openai";
  modelName: string;
  tokenUsage: { inputTokens: number | null; outputTokens: number | null };
};

export type AiCallOptions = {
  /** Hard cap on output tokens. Defaults to 1024. */
  maxOutputTokens?: number;
  /**
   * Override the template's preferred provider. Use sparingly — auditability
   * is better when the template owns the choice. Useful in tests + when a
   * caller knows the user has only one provider configured.
   */
  forceProvider?: "anthropic" | "openai";
};

/**
 * Render a template + invoke the right provider. The AI service wraps this
 * with permission checks, AiOutput persistence, and audit logging — this
 * function deliberately does NEITHER so it remains pure I/O.
 */
export async function aiCall(
  templateKey: string,
  vars: Record<string, string>,
  options: AiCallOptions = {},
): Promise<AiCallResult> {
  const template = await renderPrompt(templateKey, vars);
  const provider = options.forceProvider ?? template.provider;
  const maxTokens = options.maxOutputTokens ?? 1024;

  let raw: Omit<AiCallResult, "structuredOutput">;
  if (provider === "anthropic") {
    const client = await getAnthropicClient();
    if (!client) throw new AiProviderNotConfiguredError("anthropic");
    raw = await invokeAnthropic(client, template, maxTokens);
  } else if (provider === "openai") {
    const client = await getOpenAiClient();
    if (!client) throw new AiProviderNotConfiguredError("openai");
    raw = await invokeOpenAi(client, template, maxTokens);
  } else {
    // Defensive — keeps the union exhaustive even if the enum grows later.
    throw new AiNotConfiguredError();
  }

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

async function invokeAnthropic(
  client: Anthropic,
  template: RenderedPrompt,
  maxTokens: number,
): Promise<Omit<AiCallResult, "structuredOutput">> {
  const model = template.modelHint ?? (await resolveAnthropicModel());
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: template.systemPrompt,
    messages: [{ role: "user", content: template.userPrompt }],
  });
  const output = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
  return {
    template,
    output,
    modelProvider: "anthropic",
    modelName: response.model,
    tokenUsage: {
      inputTokens: response.usage.input_tokens ?? null,
      outputTokens: response.usage.output_tokens ?? null,
    },
  };
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

