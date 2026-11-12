import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The tool loop, with the model and the database stood in for
 * (2026-11-04). What is pinned: a function call runs the tool and its
 * result goes back on the next request chained to the previous response;
 * a tool the person may not use is refused but the loop continues; the
 * answer is persisted with its tool calls and audited; a cut-off answer
 * raises rather than storing a blank.
 */
const requests: Record<string, unknown>[] = [];
let responses: Record<string, unknown>[] = [];
const created: Record<string, unknown>[] = [];
const audits: Record<string, unknown>[] = [];

vi.mock("@/server/integrations/openai/client", () => ({
  DEFAULT_OPENAI_MODEL: "gpt-5-mini",
  getOpenAiClient: async () => ({
    responses: {
      create: async (request: Record<string, unknown>) => {
        requests.push(request);
        const next = responses.shift();
        if (!next) throw new Error("no scripted response left");
        if (!request.stream) return next;
        // Streaming: the text in pieces, then the completed response.
        const text = typeof next.output_text === "string" ? next.output_text : "";
        return (async function* () {
          for (const piece of text.match(/.{1,12}/g) ?? []) {
            yield { type: "response.output_text.delta", delta: piece };
          }
          yield { type: "response.completed", response: next };
        })();
      },
    },
  }),
}));
vi.mock("@/server/db/client", () => ({
  prisma: {
    store: { findMany: async () => [{ name: "LifeSupply.ca" }] },
    aiOutput: {
      create: async (args: { data: Record<string, unknown> }) => {
        created.push(args.data);
        return { id: "out_1", createdAt: new Date("2026-11-04T12:00:00Z"), ...args.data };
      },
    },
  },
}));
vi.mock("@/server/audit", () => ({
  writeAudit: async (entry: Record<string, unknown>) => {
    audits.push(entry);
  },
}));
vi.mock("@/server/services/system-settings", () => ({
  getSetting: async (key: string) => (key === "ai.max_output_tokens" ? "2048" : ""),
}));
vi.mock("./tools", () => ({
  canQueryDatabase: () => false,
  toolsForPermissions: () => [
    {
      name: "sales_overview",
      description: "Revenue for a range, test double.",
      permissions: ["ai.use"],
      parameters: { type: "object", properties: {} },
      run: async () => ({}),
    },
  ],
  runAssistantTool: async (name: string, args: Record<string, unknown>) =>
    name === "sales_overview"
      ? { ok: true, result: { revenue: 1234.5, args } }
      : { ok: false, error: `The person asking may not use "${name}".` },
}));

import { AiOutputTruncatedError } from "../errors";
import {
  answerAssistantQuestion,
  collectSources,
  functionCallsIn,
  NO_ANSWER_TEXT,
  NUDGE_TO_ANSWER,
  outputTypesIn,
  responseText,
} from "./answer";

beforeEach(() => {
  requests.length = 0;
  created.length = 0;
  audits.length = 0;
  responses = [];
});

const message = (text: string) => ({
  type: "message",
  content: [
    {
      type: "output_text",
      text,
      annotations: [{ type: "url_citation", url: "https://example.com/report" }],
    },
  ],
});

describe("answerAssistantQuestion", () => {
  it("runs the tool the model asks for, feeds the result back, and persists the answer with its calls", async () => {
    responses = [
      {
        id: "resp_1",
        model: "gpt-5-mini-2026",
        output: [
          {
            type: "function_call",
            call_id: "call_1",
            name: "sales_overview",
            arguments: '{"days":30}',
          },
          {
            type: "function_call",
            call_id: "call_2",
            name: "database_query",
            arguments: '{"sql":"SELECT 1"}',
          },
        ],
        usage: { input_tokens: 100, output_tokens: 20 },
      },
      {
        id: "resp_2",
        model: "gpt-5-mini-2026",
        output: [message("Revenue was $1,234.50 in the last 30 days.")],
        output_text: "Revenue was $1,234.50 in the last 30 days.",
        usage: { input_tokens: 300, output_tokens: 40 },
      },
    ];
    const result = await answerAssistantQuestion({
      question: "How are sales?",
      userId: "u1",
      permissions: ["ai.use"],
      now: new Date("2026-11-04T12:00:00Z"),
    });

    expect(result.answer).toBe("Revenue was $1,234.50 in the last 30 days.");
    expect(result.responseId).toBe("resp_2");
    expect(result.toolCalls).toEqual([
      { name: "sales_overview", arguments: { days: 30 }, ms: expect.any(Number) },
      {
        name: "database_query",
        arguments: { sql: "SELECT 1" },
        skipped: 'The person asking may not use "database_query".',
        ms: expect.any(Number),
      },
    ]);
    expect(result.sources).toEqual(["https://example.com/report"]);
    expect(result.tokenUsage).toEqual({ inputTokens: 400, outputTokens: 60 });

    // The first request carried the question and every tool plus web search;
    // the second carried the tool outputs, chained to the first response.
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      model: "gpt-5-mini",
      max_output_tokens: 2048,
      input: [{ role: "user", content: "How are sales?" }],
    });
    const toolTypes = (requests[0]!.tools as { type: string; name?: string }[]).map(
      (t) => t.name ?? t.type,
    );
    expect(toolTypes).toEqual(["web_search", "sales_overview"]);
    expect(requests[0]).not.toHaveProperty("previous_response_id");
    expect(requests[1]).toMatchObject({ previous_response_id: "resp_1" });
    const outputs = requests[1]!.input as { type: string; call_id: string; output: string }[];
    expect(outputs.map((o) => o.call_id)).toEqual(["call_1", "call_2"]);
    expect(JSON.parse(outputs[0]!.output)).toEqual({ revenue: 1234.5, args: { days: 30 } });
    expect(JSON.parse(outputs[1]!.output)).toEqual({
      error: 'The person asking may not use "database_query".',
    });

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      userId: "u1",
      module: "assistant.text",
      prompt: "How are sales?",
      output: "Revenue was $1,234.50 in the last 30 days.",
      warnings: ['database_query: The person asking may not use "database_query".'],
    });
    expect(audits[0]).toMatchObject({ action: "ai.assistant_query", entityId: "out_1" });
  });

  it("continues a conversation from the previous response", async () => {
    responses = [
      { id: "resp_9", model: "m", output: [message("Yes.")], output_text: "Yes.", usage: {} },
    ];
    await answerAssistantQuestion({
      question: "And last month?",
      userId: "u1",
      permissions: ["ai.use"],
      previousResponseId: "resp_8",
    });
    expect(requests[0]).toMatchObject({ previous_response_id: "resp_8" });
  });

  it("streams the text and reports each tool call when asked to", async () => {
    responses = [
      {
        id: "resp_1",
        model: "m",
        output: [{ type: "function_call", call_id: "c1", name: "sales_overview", arguments: "{}" }],
        output_text: "",
        usage: { input_tokens: 1, output_tokens: 1 },
      },
      {
        id: "resp_2",
        model: "m",
        output: [message("Sales were steady this month.")],
        output_text: "Sales were steady this month.",
        usage: { input_tokens: 1, output_tokens: 1 },
      },
    ];
    const events: unknown[] = [];
    const result = await answerAssistantQuestion({
      question: "How are sales?",
      userId: "u1",
      permissions: ["ai.use"],
      stream: true,
      onEvent: (e) => events.push(e),
    });
    expect(result.answer).toBe("Sales were steady this month.");
    expect(result.responseId).toBe("resp_2");
    expect(requests.every((r) => r.stream === true)).toBe(true);
    expect(events[0]).toEqual({ type: "tool", name: "sales_overview", status: "running" });
    expect(events[1]).toEqual({ type: "tool", name: "sales_overview", status: "done" });
    const text = events
      .filter((e): e is { type: "delta"; text: string } => (e as { type: string }).type === "delta")
      .map((e) => e.text)
      .join("");
    expect(text).toBe("Sales were steady this month.");
  });

  it("raises when the answer was cut off before any text, instead of storing a blank", async () => {
    responses = [
      {
        id: "resp_3",
        model: "m",
        output: [],
        output_text: "",
        incomplete_details: { reason: "max_output_tokens" },
        usage: {},
      },
    ];
    await expect(
      answerAssistantQuestion({ question: "Everything?", userId: "u1", permissions: ["ai.use"] }),
    ).rejects.toBeInstanceOf(AiOutputTruncatedError);
    expect(created).toHaveLength(0);
  });

  it("nudges once, with the tools withheld, when the model stops without writing anything (2026-11-12)", async () => {
    // Seen on production: a successful query round, then a completed
    // response holding only reasoning. The nudge gets the answer out.
    responses = [
      {
        id: "resp_1",
        model: "m",
        output: [{ type: "function_call", call_id: "c1", name: "sales_overview", arguments: "{}" }],
        usage: { input_tokens: 1, output_tokens: 1 },
      },
      {
        id: "resp_2",
        model: "m",
        status: "completed",
        output: [{ type: "reasoning", summary: [] }],
        output_text: "",
        usage: { input_tokens: 1, output_tokens: 900 },
      },
      {
        id: "resp_3",
        model: "m",
        output: [message("Revenue was $1,234.50.")],
        output_text: "Revenue was $1,234.50.",
        usage: { input_tokens: 1, output_tokens: 30 },
      },
    ];
    const result = await answerAssistantQuestion({
      question: "How are sales?",
      userId: "u1",
      permissions: ["ai.use"],
    });
    expect(result.answer).toBe("Revenue was $1,234.50.");
    expect(result.warnings).toEqual([]);
    expect(requests).toHaveLength(3);
    expect(requests[2]).toMatchObject({
      tool_choice: "none",
      previous_response_id: "resp_2",
      input: [{ role: "user", content: NUDGE_TO_ANSWER }],
    });
    expect(requests[1]).toMatchObject({ tool_choice: "auto" });
    const refs = created[0]!.sourceReferences as Record<string, unknown>;
    expect(refs.nudged).toBe(true);
    expect(refs.rounds).toBe(3);
  });

  it("says what came back when even the nudge yields no text, instead of blaming the round cap", async () => {
    responses = [
      {
        id: "resp_1",
        model: "m",
        status: "completed",
        output: [{ type: "reasoning", summary: [] }],
        output_text: "",
        usage: {},
      },
      {
        id: "resp_2",
        model: "m",
        status: "incomplete",
        incomplete_details: { reason: "content_filter" },
        output: [],
        output_text: "",
        usage: {},
      },
    ];
    const result = await answerAssistantQuestion({
      question: "How are sales?",
      userId: "u1",
      permissions: ["ai.use"],
    });
    expect(result.answer).toBe(NO_ANSWER_TEXT);
    expect(result.warnings).toEqual([
      "The model returned no text after 2 rounds (last response: incomplete, content_filter).",
    ]);
    expect(requests).toHaveLength(2);
    const refs = created[0]!.sourceReferences as Record<string, unknown>;
    expect(refs.lastResponse).toEqual({
      status: "incomplete",
      reason: "content_filter",
      outputTypes: [],
    });
  });

  it("reads the answer from the message items when the convenience field is absent", async () => {
    responses = [
      {
        id: "resp_1",
        model: "m",
        output: [message("From the items.")],
        usage: {},
      },
    ];
    const result = await answerAssistantQuestion({
      question: "How are sales?",
      userId: "u1",
      permissions: ["ai.use"],
    });
    expect(result.answer).toBe("From the items.");
    expect(result.warnings).toEqual([]);
  });
});

describe("responseText and outputTypesIn", () => {
  it("prefers output_text, falls back to the message items, and never reads reasoning", () => {
    expect(responseText({ output_text: " Direct. ", output: [message("Items.")] })).toBe("Direct.");
    expect(responseText({ output_text: "", output: [message("A "), message("B")] })).toBe("A B");
    expect(responseText({ output: [{ type: "reasoning", summary: [{ text: "thinking" }] }] })).toBe(
      "",
    );
    expect(responseText({})).toBe("");
    expect(
      outputTypesIn([{ type: "reasoning" }, { type: "message" }, { type: "message" }]),
    ).toEqual(["reasoning", "message"]);
    expect(outputTypesIn(null)).toEqual([]);
  });
});

describe("the pure readers", () => {
  it("functionCallsIn keeps only well-formed function calls", () => {
    expect(
      functionCallsIn([
        { type: "function_call", call_id: "c", name: "x", arguments: "{}" },
        { type: "function_call", name: "missing-id" },
        { type: "message" },
      ]),
    ).toEqual([{ callId: "c", name: "x", args: "{}" }]);
    expect(functionCallsIn(null)).toEqual([]);
  });

  it("collectSources takes urls from searches and citations only", () => {
    expect(
      collectSources([
        { type: "web_search_call", action: { sources: [{ url: "https://a.example" }] } },
        {
          type: "message",
          content: [{ annotations: [{ type: "url_citation", url: "https://b.example" }] }],
        },
        { type: "function_call", arguments: '{"url":"https://not-a-source.example"}' },
      ]),
    ).toEqual(["https://a.example", "https://b.example"]);
  });
});
