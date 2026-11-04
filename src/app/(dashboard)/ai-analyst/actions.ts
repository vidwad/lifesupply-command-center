"use server";

import { PERMISSIONS } from "@/lib/permissions";
import { AiNotConfiguredError } from "@/server/services/ai";
import { answerAssistantQuestion } from "@/server/services/ai/assistant/answer";
import type { AssistantPageContext } from "@/server/services/ai/assistant/types";
import { AiBudgetExceededError, AiOutputTruncatedError } from "@/server/services/ai/errors";
import { requirePermission } from "@/server/permissions";

export type AnalystTurn = {
  question: string;
  answer: string;
  createdAt: string;
  modelName: string;
  /** The tools the assistant used, in order, with why one was skipped. */
  tools: { name: string; skipped?: string }[];
  /** Web pages searched or cited. */
  sources: string[];
  warnings: string[];
};

export type AnalystState =
  | { status: "idle" }
  | { status: "ok"; turns: AnalystTurn[]; responseId: string }
  | { status: "error"; message: string; turns: AnalystTurn[]; responseId: string | null }
  | undefined;

/**
 * One question to the assistant (2026-11-04). The form carries the
 * previous response id and the turns so far, so the conversation continues
 * across submissions without this action storing anything itself; the
 * assistant service persists each answer as an AiOutput.
 */
export async function askAnalystAction(
  prev: AnalystState,
  formData: FormData,
): Promise<AnalystState> {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  const question = String(formData.get("question") ?? "").trim();
  const turns = prev && prev.status !== "idle" ? prev.turns : [];
  const previousResponseId =
    String(formData.get("previousResponseId") ?? "").trim() ||
    (prev && prev.status === "ok" ? prev.responseId : null);
  if (!question) {
    return {
      status: "error",
      message: "Question is required.",
      turns,
      responseId: previousResponseId,
    };
  }

  let pageContext: AssistantPageContext | null = null;
  const rawContext = String(formData.get("pageContext") ?? "").trim();
  if (rawContext) {
    try {
      pageContext = JSON.parse(rawContext) as AssistantPageContext;
    } catch {
      pageContext = null;
    }
  }

  try {
    const result = await answerAssistantQuestion({
      question,
      userId: user.id,
      permissions: user.permissions,
      pageContext,
      previousResponseId,
    });
    return {
      status: "ok",
      responseId: result.responseId,
      turns: [
        ...turns,
        {
          question,
          answer: result.answer,
          createdAt: result.createdAt.toISOString(),
          modelName: result.modelName,
          tools: result.toolCalls.map((c) => ({ name: c.name, skipped: c.skipped })),
          sources: result.sources,
          warnings: result.warnings,
        },
      ],
    };
  } catch (err) {
    if (
      err instanceof AiNotConfiguredError ||
      err instanceof AiBudgetExceededError ||
      err instanceof AiOutputTruncatedError
    ) {
      return { status: "error", message: err.message, turns, responseId: previousResponseId };
    }
    console.error("[ai-analyst] askAnalystAction failed", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "The assistant could not answer.",
      turns,
      responseId: previousResponseId,
    };
  }
}
