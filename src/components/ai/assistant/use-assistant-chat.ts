"use client";

import { useCallback, useRef, useState } from "react";

import type {
  AssistantBudgetSummary,
  AssistantChatEvent,
  AssistantPageContext,
  AssistantTurnDto,
} from "@/server/services/ai/assistant/types";

import { readSseBody } from "./sse";

export type ToolActivity = {
  name: string;
  status: "running" | "done" | "skipped";
  reason?: string;
};

export type PendingTurn = {
  question: string;
  tools: ToolActivity[];
  /** The answer's text so far, for the round in progress. */
  text: string;
};

export const CHAT_ROUTE = "/api/ai/assistant/chat";
export const BUDGET_ROUTE = "/api/ai/assistant/budget";

/**
 * Pure: folds one streamed event into the turn in progress. A new tool
 * round drops the text so far, which was the model thinking aloud; the
 * answer arrives whole with `done`, which the caller handles.
 */
export function applyProgress(pending: PendingTurn, event: AssistantChatEvent): PendingTurn {
  if (event.type === "delta") return { ...pending, text: pending.text + event.text };
  if (event.type !== "tool") return pending;
  if (event.status === "running") {
    return {
      ...pending,
      text: "",
      tools: [...pending.tools, { name: event.name, status: "running" }],
    };
  }
  const tools = [...pending.tools];
  const at = tools.map((t) => t.status).lastIndexOf("running");
  const entry: ToolActivity = { name: event.name, status: event.status, reason: event.reason };
  if (at >= 0 && tools[at]!.name === event.name) tools[at] = entry;
  else tools.push(entry);
  return { ...pending, tools };
}

/**
 * The drawer's conversation (2026-11-06): the finished turns, the turn in
 * progress with its tool activity and streamed text, the last error, and
 * today's budget figures. Each question is chained to the previous answer
 * through the response id the server returns; `reset` starts afresh.
 */
export function useAssistantChat() {
  const [turns, setTurns] = useState<AssistantTurnDto[]>([]);
  const [pending, setPending] = useState<PendingTurn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<AssistantBudgetSummary | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responseId = turns.length ? turns[turns.length - 1]!.responseId : null;

  const refreshBudget = useCallback(async () => {
    try {
      const res = await fetch(BUDGET_ROUTE, { cache: "no-store" });
      if (res.ok) setBudget((await res.json()) as AssistantBudgetSummary);
    } catch {
      // The strip shows the last figures it had.
    }
  }, []);

  const ask = useCallback(
    async (question: string, pageContext: AssistantPageContext) => {
      const trimmed = question.trim();
      if (!trimmed || pending) return;
      setError(null);
      setPending({ question: trimmed, tools: [], text: "" });
      const controller = new AbortController();
      abortRef.current = controller;
      let finished = false;
      try {
        const res = await fetch(CHAT_ROUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed, previousResponseId: responseId, pageContext }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? `The assistant did not answer (${res.status}).`);
        }
        if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) {
          // The sign-in page, after the session ended.
          throw new Error("Your session has ended. Sign in again to use the assistant.");
        }
        await readSseBody<AssistantChatEvent>(res.body, (event) => {
          if (event.type === "done") {
            finished = true;
            setTurns((prev) => [...prev, event.turn]);
            setBudget(event.budget);
            setPending(null);
          } else if (event.type === "error") {
            finished = true;
            setError(event.message);
            setPending(null);
          } else {
            setPending((prev) => (prev ? applyProgress(prev, event) : prev));
          }
        });
        if (!finished) throw new Error("The connection ended before the answer arrived.");
      } catch (err) {
        if (controller.signal.aborted) {
          setError("Stopped.");
        } else {
          setError(err instanceof Error ? err.message : "The assistant could not answer.");
        }
        setPending(null);
      } finally {
        abortRef.current = null;
      }
    },
    [pending, responseId],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
    setPending(null);
    setError(null);
  }, []);

  return { turns, pending, error, budget, ask, stop, reset, refreshBudget };
}
