/**
 * Shapes shared by the assistant's pieces (2026-11-04). See docs/43 §4.4.
 */

export type AssistantPageContext = {
  route: string;
  title?: string;
  entity?: { type: string; id: string; label?: string };
  filters?: Record<string, string>;
  range?: { from: string; to: string };
  storeId?: string;
  divisionId?: string;
  figures?: { label: string; value: string }[];
};

export type AssistantToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  /** Why the call did not run, when it did not. */
  skipped?: string;
  ms: number;
};

export type AssistantAnswer = {
  answer: string;
  modelName: string;
  /** The response to chain the next question onto. */
  responseId: string;
  toolCalls: AssistantToolCall[];
  /** Web pages the model cited or searched. */
  sources: string[];
  warnings: string[];
  aiOutputId: string;
  createdAt: Date;
  tokenUsage: { inputTokens: number | null; outputTokens: number | null };
};

/**
 * What a turn reports while it runs (2026-11-06, the drawer): a tool the
 * model asked for and how it went, and the answer's text as it streams.
 * `delta` events belong to the round in progress; a later `tool` event
 * means a new round began and the text so far was the model thinking aloud,
 * not the answer, which `done` carries whole.
 */
export type AssistantProgressEvent =
  | { type: "tool"; name: string; status: "running" | "done" | "skipped"; reason?: string }
  | { type: "delta"; text: string };

/** One finished turn as the drawer and the AI Analyst page show it. */
export type AssistantTurnDto = {
  question: string;
  answer: string;
  createdAt: string;
  modelName: string;
  tools: { name: string; skipped?: string }[];
  sources: string[];
  warnings: string[];
  responseId: string;
};

/** Today's allowances against the caps, for the drawer's budget strip. */
export type AssistantBudgetSummary = {
  spentUsd: number;
  capUsd: number | null;
  userSpentUsd: number | null;
  userCapUsd: number | null;
  voiceMinutes: number;
  voiceCapMinutes: number | null;
  userVoiceMinutes: number | null;
  userVoiceCapMinutes: number | null;
  sessionMaxMinutes: number;
  /** Why text questions are blocked right now, or null. */
  spendBlocked: string | null;
  /** Why a live voice session is blocked right now, or null. */
  voiceBlocked: string | null;
  /** The `ai.live_voice` flag. */
  liveVoiceEnabled: boolean;
  timezone: string;
};

/** The server-sent events the chat route streams to the drawer. */
export type AssistantChatEvent =
  | AssistantProgressEvent
  | { type: "done"; turn: AssistantTurnDto; budget: AssistantBudgetSummary }
  | { type: "error"; message: string };
