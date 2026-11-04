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
