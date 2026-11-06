/**
 * The GPT-Live data channel, folded (docs/43 Stage 3, 2026-11-06). Pure:
 * one event in, the next transcript state and the effects the browser must
 * carry out (relay a tool call, report usage, end). The hook that owns the
 * connection runs the effects; this module can be tested without one.
 *
 * Events as OpenAI's Live docs name them: `session.started`,
 * `session.input_transcript.delta` and `session.output_transcript.delta`
 * (text fragments to append exactly as received), `session.usage.updated`
 * (cumulative seconds; each replaces the last), `session.closed` (final
 * seconds and a reason), `response.event` (a Responses event from the
 * backend, nested under `event`: a finished function call arrives as
 * `response.output_item.done` with the call's id, name and arguments; the
 * backend's tokens as `response.completed`), and `error`.
 */
export type VoiceLine = { role: "user" | "assistant"; text: string };

export type VoiceToolActivity = {
  callId: string;
  name: string;
  status: "running" | "done" | "skipped";
};

export type VoiceState = {
  status: "connecting" | "live" | "closed";
  lines: VoiceLine[];
  /** Cumulative seconds OpenAI last reported. */
  seconds: number;
  tools: VoiceToolActivity[];
  closeReason: string | null;
  /** The last non-fatal error the session reported. */
  error: string | null;
};

export type VoiceEffect =
  | { type: "tool_call"; callId: string; name: string; arguments: Record<string, unknown> }
  | {
      type: "backend_usage";
      responseId: string;
      model: string | null;
      usage: Record<string, unknown>;
    }
  | { type: "usage"; seconds: number }
  | { type: "closed"; reason: string; seconds: number };

export const INITIAL_VOICE_STATE: VoiceState = {
  status: "connecting",
  lines: [],
  seconds: 0,
  tools: [],
  closeReason: null,
  error: null,
};

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function appendLine(lines: VoiceLine[], role: VoiceLine["role"], delta: string): VoiceLine[] {
  if (!delta) return lines;
  const last = lines[lines.length - 1];
  if (last && last.role === role) {
    return [...lines.slice(0, -1), { role, text: last.text + delta }];
  }
  return [...lines, { role, text: delta }];
}

export function foldVoiceEvent(
  state: VoiceState,
  raw: unknown,
): { state: VoiceState; effects: VoiceEffect[] } {
  const event = rec(raw);
  const type = str(event.type);
  const effects: VoiceEffect[] = [];

  switch (type) {
    case "session.started":
      return { state: { ...state, status: "live" }, effects };

    case "session.input_transcript.delta":
      return {
        state: { ...state, lines: appendLine(state.lines, "user", str(event.delta)) },
        effects,
      };

    case "session.output_transcript.delta":
      return {
        state: { ...state, lines: appendLine(state.lines, "assistant", str(event.delta)) },
        effects,
      };

    case "session.usage.updated": {
      const seconds = Number(rec(event.usage).seconds);
      if (!Number.isFinite(seconds)) return { state, effects };
      const next = Math.max(state.seconds, Math.round(seconds));
      effects.push({ type: "usage", seconds: next });
      return { state: { ...state, seconds: next }, effects };
    }

    case "session.closed": {
      const reported = Number(rec(event.usage).seconds);
      const seconds = Number.isFinite(reported)
        ? Math.max(state.seconds, Math.round(reported))
        : state.seconds;
      const reason = str(event.reason) || "closed";
      effects.push({ type: "closed", reason, seconds });
      return { state: { ...state, status: "closed", seconds, closeReason: reason }, effects };
    }

    case "response.event": {
      const nested = rec(event.event);
      const nestedType = str(nested.type);
      if (nestedType === "response.output_item.done") {
        const item = rec(nested.item);
        if (str(item.type) === "function_call") {
          const callId = str(item.call_id);
          const name = str(item.name);
          if (callId && name) {
            let args: Record<string, unknown> = {};
            try {
              const parsed = JSON.parse(str(item.arguments) || "{}") as unknown;
              if (parsed && typeof parsed === "object") args = parsed as Record<string, unknown>;
            } catch {
              args = {};
            }
            effects.push({ type: "tool_call", callId, name, arguments: args });
            return {
              state: { ...state, tools: [...state.tools, { callId, name, status: "running" }] },
              effects,
            };
          }
        }
      } else if (nestedType === "response.completed") {
        const response = rec(nested.response);
        const responseId = str(response.id);
        if (responseId && response.usage) {
          effects.push({
            type: "backend_usage",
            responseId,
            model: str(response.model) || null,
            usage: rec(response.usage),
          });
        }
      }
      return { state, effects };
    }

    case "error": {
      const error = rec(event.error);
      const message = str(error.message) || "The live session reported an error.";
      return { state: { ...state, error: message }, effects };
    }

    default:
      return { state, effects };
  }
}

/** Marks a relayed tool call finished. */
export function settleVoiceTool(
  state: VoiceState,
  callId: string,
  status: "done" | "skipped",
): VoiceState {
  return {
    ...state,
    tools: state.tools.map((t) => (t.callId === callId ? { ...t, status } : t)),
  };
}

/** The events the browser sends back for a finished tool call. */
export function toolResultEvents(callId: string, output: string): Rec[] {
  return [
    {
      type: "response.item.create",
      event_id: `tool_result_${callId}`,
      item: { type: "function_call_output", call_id: callId, output },
    },
    { type: "response.create", event_id: `continue_${callId}` },
  ];
}

/** mm:ss for the timer. */
export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
