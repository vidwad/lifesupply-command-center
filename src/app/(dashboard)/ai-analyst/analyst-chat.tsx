"use client";

import { useActionState } from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

import { askAnalystAction, type AnalystState } from "./actions";

type Props = { suggestions: string[] };

export function AnalystChat({ suggestions }: Props) {
  const [state, formAction, pending] = useActionState<AnalystState, FormData>(
    askAnalystAction,
    undefined,
  );

  return (
    <div className="space-y-4">
      {state?.status === "ok" && (
        <div className="space-y-3 rounded-md border bg-muted/30 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Question
            </p>
            <p className="mt-1 text-sm font-medium">{state.question}</p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Answer
              </p>
              <p className="text-[10px] text-muted-foreground">
                {state.modelName} • {formatDateTime(state.createdAt)}
              </p>
            </div>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {state.answer}
            </pre>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <textarea
          name="question"
          rows={3}
          required
          disabled={pending}
          placeholder="Ask anything about today's data — orders, customers, financials, campaigns…"
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
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            <Send className={pending ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
            {pending ? "Thinking…" : "Ask"}
          </Button>
        </div>
      </form>

      <div>
        <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Try
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <SuggestionChip key={s} text={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const form = (e.currentTarget.closest("div")?.parentElement?.querySelector("form") ??
          null) as HTMLFormElement | null;
        const textarea = form?.querySelector(
          'textarea[name="question"]',
        ) as HTMLTextAreaElement | null;
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
