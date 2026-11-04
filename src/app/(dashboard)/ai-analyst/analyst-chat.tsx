"use client";

import { useActionState, useEffect, useRef } from "react";
import { ExternalLink, Send, Sparkles, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

import { askAnalystAction, type AnalystState, type AnalystTurn } from "./actions";

type Props = {
  suggestions: string[];
  /** What the person is looking at, for "this page" questions. Serialised into the form. */
  pageContext?: Record<string, unknown> | null;
};

const TOOL_LABELS: Record<string, string> = {
  list_stores: "stores",
  dashboard_snapshot: "dashboard",
  sales_overview: "sales",
  top_products: "top products",
  search_customers: "customers",
  customer_detail: "customer",
  product_top_customers: "product's customers",
  search_orders: "orders",
  order_detail: "order",
  search_products: "products",
  open_exceptions: "exceptions",
  tasks_and_approvals: "tasks and approvals",
  financial_summary: "financials",
  marketing_performance: "campaigns",
  competitor_prices: "competitor prices",
  website_content: "website",
  bigcommerce_read: "store API",
  database_schema: "database schema",
  database_query: "database query",
};

/**
 * The assistant's conversation (2026-11-04). Each submission carries the
 * previous response id, so the assistant remembers the thread; the turns
 * stay on screen, each with the tools it used and the web pages it cited.
 */
export function AnalystChat({ suggestions, pageContext = null }: Props) {
  const [state, formAction, pending] = useActionState<AnalystState, FormData>(
    askAnalystAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const turns: AnalystTurn[] = state && state.status !== "idle" ? state.turns : [];
  const responseId =
    state?.status === "ok" ? state.responseId : state?.status === "error" ? state.responseId : null;

  // A sent question leaves the box; the thread above keeps it.
  useEffect(() => {
    if (state?.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      {turns.length > 0 && (
        <ol className="space-y-3">
          {turns.map((turn, index) => (
            <li
              key={`${turn.createdAt}-${index}`}
              className="space-y-3 rounded-md border bg-muted/30 p-4"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Question
                </p>
                <p className="mt-1 text-sm font-medium">{turn.question}</p>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Answer
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {turn.modelName} • {formatDateTime(turn.createdAt)}
                  </p>
                </div>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {turn.answer}
                </pre>
              </div>
              {turn.tools.length > 0 && (
                <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Wrench className="h-3 w-3" aria-hidden="true" />
                  <span>Looked at:</span>
                  {turn.tools.map((tool, i) => (
                    <span
                      key={`${tool.name}-${i}`}
                      className={
                        tool.skipped
                          ? "rounded border border-dashed px-1.5 py-0.5 line-through"
                          : "rounded border bg-background px-1.5 py-0.5"
                      }
                      title={tool.skipped ?? tool.name}
                    >
                      {TOOL_LABELS[tool.name] ?? tool.name}
                    </span>
                  ))}
                </p>
              )}
              {turn.sources.length > 0 && (
                <ul className="space-y-0.5 text-[11px]">
                  {turn.sources.slice(0, 8).map((url) => (
                    <li key={url} className="truncate">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center gap-1 text-muted-foreground hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{url}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {turn.warnings.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-warning">
                  {turn.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}

      <form ref={formRef} action={formAction} className="space-y-3">
        {responseId && <input type="hidden" name="previousResponseId" value={responseId} />}
        {pageContext && (
          <input type="hidden" name="pageContext" value={JSON.stringify(pageContext)} />
        )}
        <textarea
          name="question"
          rows={3}
          required
          disabled={pending}
          placeholder={
            turns.length > 0
              ? "Ask a follow-up…"
              : "Ask anything: sales, customers, orders, products, the stores, the website, or the market…"
          }
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        {state?.status === "error" && (
          <p
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.message}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {pending ? "Reading the data…" : turns.length > 0 ? "The thread continues." : ""}
          </p>
          <Button type="submit" disabled={pending}>
            <Send className={pending ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
            {pending ? "Working…" : "Ask"}
          </Button>
        </div>
      </form>

      {turns.length === 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Try
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <SuggestionChip key={s} text={s} formRef={formRef} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionChip({
  text,
  formRef,
}: {
  text: string;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const textarea = formRef.current?.querySelector<HTMLTextAreaElement>(
          'textarea[name="question"]',
        );
        if (textarea) {
          textarea.value = text;
          textarea.focus();
        }
      }}
      className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {text}
    </button>
  );
}
