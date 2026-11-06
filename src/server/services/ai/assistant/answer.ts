/**
 * One assistant turn (2026-11-04): the question, the tool loop, the answer.
 *
 * The model is given the tools the person may use plus web search, and it
 * is run until it stops asking for tools or the round cap is reached. Each
 * tool call runs on the server under the person's permissions; the result
 * goes back as data. The turn is chained to the previous one with the
 * Responses API's `previous_response_id`, which is how a conversation
 * keeps its memory without this service storing transcripts in the prompt.
 *
 * Every call is metered by the OpenAI client wrapper under the feature
 * name, and the answer is persisted as an AiOutput with the tool calls and
 * sources as its references, then audited.
 */
import type { Prisma } from "@prisma/client";
import type {
  Response as OpenAiResponse,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { DEFAULT_OPENAI_MODEL, getOpenAiClient } from "@/server/integrations/openai/client";
import { getSetting } from "@/server/services/system-settings";

import { AiOutputTruncatedError, AiProviderNotConfiguredError } from "../errors";
import { buildAssistantInstructions } from "./prompt";
import { toJsonSafe } from "./sql-guard";
import { canQueryDatabase, runAssistantTool, toolsForPermissions } from "./tools";
import type {
  AssistantAnswer,
  AssistantPageContext,
  AssistantProgressEvent,
  AssistantToolCall,
} from "./types";

export const MAX_TOOL_ROUNDS = 8;
const MAX_TOOL_OUTPUT_CHARS = 30_000;

export type AnswerArgs = {
  question: string;
  userId: string;
  permissions: string[];
  pageContext?: AssistantPageContext | null;
  /** The previous turn's response id, to continue a conversation. */
  previousResponseId?: string | null;
  /** The ledger's feature name. Text mode by default. */
  feature?: string;
  now?: Date;
  /**
   * Report tool calls and, with `stream`, the answer's text as it arrives
   * (2026-11-06, the drawer). The returned answer is unchanged either way.
   */
  onEvent?: (event: AssistantProgressEvent) => void;
  /** Ask the model to stream, so `onEvent` sees text deltas. */
  stream?: boolean;
};

/** The assistant's text model: env OPENAI_MODEL, then the shared default setting, then the built-in default. */
export async function resolveAssistantModel(): Promise<string> {
  const env = process.env.OPENAI_MODEL?.trim();
  if (env) return env;
  const shared = (await getSetting("ai.default_model")).trim();
  return shared || DEFAULT_OPENAI_MODEL;
}

async function resolveMaxOutputTokens(): Promise<number> {
  const raw = Number(await getSetting("ai.max_output_tokens"));
  return Number.isFinite(raw) && raw >= 64 ? Math.round(raw) : 4096;
}

type OutputItem = Record<string, unknown>;

/** Pure: the function calls the model asked for in a response's output. */
export function functionCallsIn(output: unknown): { callId: string; name: string; args: string }[] {
  if (!Array.isArray(output)) return [];
  const calls: { callId: string; name: string; args: string }[] = [];
  for (const item of output as OutputItem[]) {
    if (item?.type !== "function_call") continue;
    const callId = typeof item.call_id === "string" ? item.call_id : null;
    const name = typeof item.name === "string" ? item.name : null;
    if (!callId || !name) continue;
    calls.push({ callId, name, args: typeof item.arguments === "string" ? item.arguments : "{}" });
  }
  return calls;
}

/** Pure: web pages the model searched or cited, from a response's output. */
export function collectSources(output: unknown, into = new Set<string>()): string[] {
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      if (/^https?:\/\//.test(value)) into.add(value);
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (key === "url" || key === "sources" || key === "annotations" || key === "action")
          visit(v);
        else if (Array.isArray(v) || (v && typeof v === "object")) visit(v);
      }
    }
  };
  if (Array.isArray(output)) {
    for (const item of output as OutputItem[]) {
      if (item?.type === "web_search_call" || item?.type === "message") visit(item);
    }
  }
  return [...into];
}

function serialiseToolResult(value: unknown): string {
  const text = JSON.stringify(toJsonSafe(value)) ?? "null";
  if (text.length <= MAX_TOOL_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_TOOL_OUTPUT_CHARS)}… [truncated: ${text.length} characters; narrow the request]`;
}

export async function answerAssistantQuestion(args: AnswerArgs): Promise<AssistantAnswer> {
  const question = args.question.trim();
  if (!question) throw new Error("Question is required.");
  const now = args.now ?? new Date();
  const feature = args.feature ?? "assistant.text";

  const client = await getOpenAiClient({ userId: args.userId, feature });
  if (!client) throw new AiProviderNotConfiguredError("openai");

  const [model, maxOutputTokens, stores] = await Promise.all([
    resolveAssistantModel(),
    resolveMaxOutputTokens(),
    prisma.store.findMany({ select: { name: true } }),
  ]);
  const tools = toolsForPermissions(args.permissions);
  const instructions = buildAssistantInstructions({
    now,
    audience: {
      permissions: args.permissions,
      canQueryDatabase: canQueryDatabase(args.permissions),
    },
    pageContext: args.pageContext ?? null,
    storeNames: stores.map((s) => s.name),
  });
  const toolDefinitions = [
    { type: "web_search" },
    ...tools.map((tool) => ({
      type: "function",
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      strict: false,
    })),
  ];

  const emit = (event: AssistantProgressEvent) => {
    try {
      args.onEvent?.(event);
    } catch {
      // A listener's failure never fails the turn.
    }
  };

  /**
   * One request to the model. Streaming reads the events as they come, hands
   * the text deltas on, and returns the completed response the stream ends
   * with, so the loop below is the same in both modes.
   */
  const createResponse = async (
    request: ResponseCreateParamsNonStreaming,
  ): Promise<OpenAiResponse> => {
    if (!args.stream) return client.responses.create(request);
    const stream = (await client.responses.create({
      ...request,
      stream: true,
    } as ResponseCreateParamsStreaming)) as AsyncIterable<ResponseStreamEvent>;
    let final: OpenAiResponse | null = null;
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        emit({ type: "delta", text: event.delta });
      } else if (
        event.type === "response.completed" ||
        event.type === "response.incomplete" ||
        event.type === "response.failed"
      ) {
        final = event.response;
      }
    }
    if (!final) throw new Error("The model's stream ended without a response.");
    return final;
  };

  const toolCalls: AssistantToolCall[] = [];
  const sources = new Set<string>();
  const usage = { inputTokens: 0, outputTokens: 0 };
  let input: unknown = [{ role: "user", content: question }];
  let previousResponseId: string | null = args.previousResponseId ?? null;
  let answer = "";
  let responseId = "";
  let modelName = model;
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;
    const request = {
      model,
      input,
      instructions,
      tools: toolDefinitions,
      tool_choice: "auto",
      parallel_tool_calls: true,
      include: ["web_search_call.action.sources"],
      max_output_tokens: maxOutputTokens,
      store: true,
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
    } as unknown as ResponseCreateParamsNonStreaming;
    const response = await createResponse(request);
    responseId = response.id;
    modelName = response.model ?? model;
    usage.inputTokens += response.usage?.input_tokens ?? 0;
    usage.outputTokens += response.usage?.output_tokens ?? 0;
    collectSources(response.output, sources);

    const calls = functionCallsIn(response.output);
    if (calls.length === 0) {
      answer = (response.output_text ?? "").trim();
      const reason = (response as { incomplete_details?: { reason?: string } }).incomplete_details
        ?.reason;
      if (!answer && reason === "max_output_tokens")
        throw new AiOutputTruncatedError(maxOutputTokens);
      break;
    }

    const outputs: unknown[] = [];
    for (const call of calls) {
      const started = Date.now();
      let parsed: Record<string, unknown> = {};
      let output: string;
      try {
        parsed = call.args ? (JSON.parse(call.args) as Record<string, unknown>) : {};
      } catch {
        output = JSON.stringify({ error: "The arguments were not valid JSON." });
        toolCalls.push({ name: call.name, arguments: {}, skipped: "invalid arguments", ms: 0 });
        emit({ type: "tool", name: call.name, status: "skipped", reason: "invalid arguments" });
        outputs.push({ type: "function_call_output", call_id: call.callId, output });
        continue;
      }
      emit({ type: "tool", name: call.name, status: "running" });
      const result = await runAssistantTool(call.name, parsed, {
        userId: args.userId,
        permissions: args.permissions,
        now,
      });
      const ms = Date.now() - started;
      if (result.ok) {
        output = serialiseToolResult(result.result);
        toolCalls.push({ name: call.name, arguments: parsed, ms });
        emit({ type: "tool", name: call.name, status: "done" });
      } else {
        output = JSON.stringify({ error: result.error });
        toolCalls.push({ name: call.name, arguments: parsed, skipped: result.error, ms });
        emit({ type: "tool", name: call.name, status: "skipped", reason: result.error });
      }
      outputs.push({ type: "function_call_output", call_id: call.callId, output });
    }
    input = outputs;
    previousResponseId = responseId;
  }

  const warnings: string[] = [];
  if (!answer) {
    warnings.push(`The assistant used ${MAX_TOOL_ROUNDS} rounds of tools without finishing.`);
    answer = "I could not finish within the allowed number of steps. Ask a narrower question.";
  }
  for (const call of toolCalls) {
    if (call.skipped) warnings.push(`${call.name}: ${call.skipped}`);
  }

  const aiOutput = await prisma.aiOutput.create({
    data: {
      userId: args.userId,
      modelProvider: "openai",
      modelName,
      module: feature,
      prompt: question,
      output: answer,
      sourceReferences: {
        tools: toolCalls.map((c) => ({
          name: c.name,
          arguments: c.arguments,
          skipped: c.skipped ?? null,
        })),
        sources: [...sources],
        pageContext: args.pageContext ?? null,
        previousResponseId: args.previousResponseId ?? null,
        responseId,
        rounds,
      } as Prisma.InputJsonObject,
      tokenUsage: usage,
      status: "generated",
      assumptions: [],
      warnings,
      confidence: null,
    },
  });

  await writeAudit({
    actorUserId: args.userId,
    action: "ai.assistant_query",
    entityType: "AiOutput",
    entityId: aiOutput.id,
    afterData: {
      module: feature,
      model: modelName,
      questionPreview: question.slice(0, 120),
      tools: toolCalls.map((c) => c.name),
      sources: sources.size,
      rounds,
    },
  });

  return {
    answer,
    modelName,
    responseId,
    toolCalls,
    sources: [...sources],
    warnings,
    aiOutputId: aiOutput.id,
    createdAt: aiOutput.createdAt,
    tokenUsage: usage,
  };
}
