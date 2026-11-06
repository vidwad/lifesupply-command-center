/**
 * One assistant turn, streamed (2026-11-06, docs/43 Stage 2).
 *
 * The drawer posts the question, the previous response id and the page
 * context; the route answers with server-sent events: a `tool` event as each
 * tool starts and finishes, `delta` events with the answer's text as the
 * model writes it, and one `done` event carrying the whole turn and today's
 * budget figures, or an `error` event. The turn itself is the same service
 * the AI Analyst page uses, so persistence, audit and metering are shared.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { AiNotConfiguredError } from "@/server/services/ai";
import { answerAssistantQuestion } from "@/server/services/ai/assistant/answer";
import { getAssistantBudgetSummary } from "@/server/services/ai/assistant/budget-summary";
import type {
  AssistantChatEvent,
  AssistantPageContext,
} from "@/server/services/ai/assistant/types";
import {
  AiBudgetExceededError,
  AiOutputTruncatedError,
  AiProviderNotConfiguredError,
} from "@/server/services/ai/errors";

export const dynamic = "force-dynamic";

export const MAX_QUESTION_CHARS = 4_000;

const str = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

/**
 * Pure: keeps the page context to its declared fields and sizes, so a page
 * (or anyone posting to the route) cannot pour arbitrary text into the
 * prompt through it.
 */
export function sanitisePageContext(raw: unknown): AssistantPageContext | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const route = str(r.route, 200);
  if (!route) return null;
  const ctx: AssistantPageContext = { route };
  const title = str(r.title, 120);
  if (title) ctx.title = title;
  if (r.entity && typeof r.entity === "object") {
    const e = r.entity as Record<string, unknown>;
    const type = str(e.type, 40);
    const id = str(e.id, 80);
    if (type && id) {
      ctx.entity = { type, id };
      const label = str(e.label, 120);
      if (label) ctx.entity.label = label;
    }
  }
  if (r.filters && typeof r.filters === "object") {
    const filters: Record<string, string> = {};
    for (const [key, value] of Object.entries(r.filters as Record<string, unknown>).slice(0, 20)) {
      const v = str(value, 120);
      if (v) filters[key.slice(0, 40)] = v;
    }
    if (Object.keys(filters).length) ctx.filters = filters;
  }
  if (r.range && typeof r.range === "object") {
    const g = r.range as Record<string, unknown>;
    const from = str(g.from, 20);
    const to = str(g.to, 20);
    if (from && to) ctx.range = { from, to };
  }
  const storeId = str(r.storeId, 80);
  if (storeId) ctx.storeId = storeId;
  const divisionId = str(r.divisionId, 80);
  if (divisionId) ctx.divisionId = divisionId;
  if (Array.isArray(r.figures)) {
    const figures = r.figures
      .slice(0, 24)
      .map((f) => {
        const o = (f ?? {}) as Record<string, unknown>;
        const label = str(o.label, 80);
        const value = str(o.value, 80);
        return label && value ? { label, value } : null;
      })
      .filter((f): f is { label: string; value: string } => f !== null);
    if (figures.length) ctx.figures = figures;
  }
  return ctx;
}

function messageFor(err: unknown): string {
  if (
    err instanceof AiNotConfiguredError ||
    err instanceof AiProviderNotConfiguredError ||
    err instanceof AiBudgetExceededError ||
    err instanceof AiOutputTruncatedError
  ) {
    return err.message;
  }
  console.error("[assistant] chat turn failed", err);
  return err instanceof Error ? err.message : "The assistant could not answer.";
}

export async function POST(req: Request) {
  // Redirects to the sign-in page without a session, as every route does;
  // the drawer reads a non-event-stream answer as "sign in again".
  const user = await requirePermission(PERMISSIONS.AI_USE);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const question = str(body.question, MAX_QUESTION_CHARS);
  if (!question) return Response.json({ error: "Question is required." }, { status: 400 });
  const previousResponseId = str(body.previousResponseId, 200) ?? null;
  const pageContext = sanitisePageContext(body.pageContext);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AssistantChatEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        const result = await answerAssistantQuestion({
          question,
          userId: user.id,
          permissions: user.permissions,
          pageContext,
          previousResponseId,
          stream: true,
          onEvent: send,
        });
        const budget = await getAssistantBudgetSummary(user.id);
        send({
          type: "done",
          budget,
          turn: {
            question,
            answer: result.answer,
            createdAt: result.createdAt.toISOString(),
            modelName: result.modelName,
            tools: result.toolCalls.map((c) => ({ name: c.name, skipped: c.skipped })),
            sources: result.sources,
            warnings: result.warnings,
            responseId: result.responseId,
          },
        });
      } catch (err) {
        send({ type: "error", message: messageFor(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
