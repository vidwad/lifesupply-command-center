import { describe, expect, it } from "vitest";

import {
  foldVoiceEvent,
  formatSeconds,
  INITIAL_VOICE_STATE,
  settleVoiceTool,
  toolResultEvents,
  type VoiceState,
} from "./voice-events";

const fold = (state: VoiceState, ...events: unknown[]) => {
  let current = state;
  const effects = [];
  for (const event of events) {
    const next = foldVoiceEvent(current, event);
    current = next.state;
    effects.push(...next.effects);
  }
  return { state: current, effects };
};

describe("foldVoiceEvent", () => {
  it("goes live on session.started and appends transcript fragments per speaker exactly as received", () => {
    const { state } = fold(
      INITIAL_VOICE_STATE,
      { type: "session.started", session: { id: "live_1" } },
      { type: "session.input_transcript.delta", delta: "What is", start_ms: 0, end_ms: 200 },
      {
        type: "session.input_transcript.delta",
        delta: " this month's",
        start_ms: 200,
        end_ms: 500,
      },
      { type: "session.output_transcript.delta", delta: "Revenue was" },
      { type: "session.output_transcript.delta", delta: " up." },
      { type: "session.input_transcript.delta", delta: "Thanks" },
    );
    expect(state.status).toBe("live");
    expect(state.lines).toEqual([
      { role: "user", text: "What is this month's" },
      { role: "assistant", text: "Revenue was up." },
      { role: "user", text: "Thanks" },
    ]);
  });

  it("keeps the latest cumulative seconds, never a smaller one, and asks to report it", () => {
    const { state, effects } = fold(
      INITIAL_VOICE_STATE,
      {
        type: "session.usage.updated",
        usage: { seconds: 12 },
        context_window: { usage_ratio: 0.1 },
      },
      { type: "session.usage.updated", usage: { seconds: 9 } },
      { type: "session.usage.updated", usage: { seconds: 30 } },
    );
    expect(state.seconds).toBe(30);
    expect(effects).toEqual([
      { type: "usage", seconds: 12 },
      { type: "usage", seconds: 12 },
      { type: "usage", seconds: 30 },
    ]);
  });

  it("unwraps a finished function call from the backend's nested event into a tool call to relay", () => {
    const { state, effects } = fold(INITIAL_VOICE_STATE, {
      type: "response.event",
      delegation_id: "item_1",
      event: {
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "call_9",
          name: "sales_overview",
          arguments: '{"days":30}',
        },
      },
    });
    expect(effects).toEqual([
      { type: "tool_call", callId: "call_9", name: "sales_overview", arguments: { days: 30 } },
    ]);
    expect(state.tools).toEqual([{ callId: "call_9", name: "sales_overview", status: "running" }]);
    expect(settleVoiceTool(state, "call_9", "done").tools[0]!.status).toBe("done");
  });

  it("keeps a draft_task call as a draft for the person to confirm (Stage 4)", () => {
    const { state } = fold(INITIAL_VOICE_STATE, {
      type: "response.event",
      event: {
        type: "response.output_item.done",
        item: {
          type: "function_call",
          call_id: "call_d",
          name: "draft_task",
          arguments: '{"title":"Chase order 76507","priority":"high"}',
        },
      },
    });
    expect(state.drafts).toEqual([{ title: "Chase order 76507", priority: "high" }]);
  });

  it("ignores a nested arguments-done alone, and reports backend usage once per completed response", () => {
    const { effects } = fold(
      INITIAL_VOICE_STATE,
      {
        type: "response.event",
        event: { type: "response.function_call_arguments.done", arguments: "{}" },
      },
      {
        type: "response.event",
        event: {
          type: "response.completed",
          response: {
            id: "resp_1",
            model: "gpt-5-mini",
            usage: { input_tokens: 10, output_tokens: 5 },
          },
        },
      },
    );
    expect(effects).toEqual([
      {
        type: "backend_usage",
        responseId: "resp_1",
        model: "gpt-5-mini",
        usage: { input_tokens: 10, output_tokens: 5 },
      },
    ]);
  });

  it("closes with the final seconds and the reason, and keeps a reported error", () => {
    const { state, effects } = fold(
      INITIAL_VOICE_STATE,
      { type: "session.usage.updated", usage: { seconds: 40 } },
      { type: "error", error: { code: "x", message: "Something went wrong." } },
      { type: "session.closed", usage: { seconds: 42 }, reason: "close_requested" },
    );
    expect(state.status).toBe("closed");
    expect(state.closeReason).toBe("close_requested");
    expect(state.error).toBe("Something went wrong.");
    expect(effects.at(-1)).toEqual({ type: "closed", reason: "close_requested", seconds: 42 });
  });

  it("the tool result goes back as an item followed by response.create, and the timer reads mm:ss", () => {
    expect(toolResultEvents("call_1", '{"ok":true}')).toEqual([
      {
        type: "response.item.create",
        event_id: "tool_result_call_1",
        item: { type: "function_call_output", call_id: "call_1", output: '{"ok":true}' },
      },
      { type: "response.create", event_id: "continue_call_1" },
    ]);
    expect(formatSeconds(0)).toBe("0:00");
    expect(formatSeconds(65)).toBe("1:05");
    expect(formatSeconds(900)).toBe("15:00");
  });
});
