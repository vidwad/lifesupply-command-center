"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { budgetStripText } from "./budget-strip";
import { useCurrentAssistantPageContext } from "./page-context";
import { toolLabel } from "./tool-labels";
import { useAssistantChat, type PendingTurn } from "./use-assistant-chat";
import type { AssistantTurnDto } from "@/server/services/ai/assistant/types";

type Props = {
  suggestions: string[];
  /** The phone sheet. On a desktop the drawer manages its own expansion. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The assistant drawer (docs/43 §4.5, Stage 2, 2026-11-06). One
 * conversation, two shapes: below `md` a full-height sheet the dock's AI
 * key opens, which closes on the X or the phone's back; from `md` up a bar
 * at the foot of the page that expands to about half the viewport. Text
 * mode streams the answer and shows each tool as it runs; the budget strip
 * carries today's allowances. Voice arrives in Stage 3; its button says so.
 */
export function AssistantDrawer({ suggestions, open, onOpenChange }: Props) {
  const pageContext = useCurrentAssistantPageContext();
  const chat = useAssistantChat();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pushedHistory = useRef(false);

  const visible = open || expanded;

  // Allowances are read when the drawer comes into view, not on every page.
  useEffect(() => {
    if (visible && !chat.budget) void chat.refreshBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // The phone's back closes the sheet: opening pushes a history entry, the
  // pop that removes it closes, and the X walks back the same entry.
  useEffect(() => {
    if (!open) return;
    if (!pushedHistory.current) {
      window.history.pushState({ assistant: true }, "");
      pushedHistory.current = true;
    }
    const onPop = () => {
      pushedHistory.current = false;
      onOpenChange(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, onOpenChange]);

  const close = useCallback(() => {
    if (pushedHistory.current) {
      pushedHistory.current = false;
      window.history.back();
    }
    onOpenChange(false);
  }, [onOpenChange]);

  // The transcript follows the newest text.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.turns, chat.pending?.text, chat.pending?.tools.length]);

  const send = useCallback(() => {
    const question = draft.trim();
    if (!question || chat.pending) return;
    setDraft("");
    void chat.ask(question, pageContext);
  }, [draft, chat, pageContext]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const spendBlocked = chat.budget?.spendBlocked ?? null;
  const voiceReason = chat.budget?.voiceBlocked ?? "Live voice arrives in the next stage.";
  const title = pageContext.title ?? "this page";

  const conversation = (
    <>
      <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-3">
        {chat.turns.length === 0 && !chat.pending ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask about {title}, the stores, customers, orders, products or the market. Figures come
              from the Command Center&apos;s data; nothing is changed.
            </p>
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Try
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setDraft(s);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-3">
            {chat.turns.map((turn, index) => (
              <TurnView key={`${turn.createdAt}-${index}`} turn={turn} />
            ))}
            {chat.pending && <PendingView pending={chat.pending} />}
          </ol>
        )}
        {chat.error && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {chat.error}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t bg-background px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            name="question"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={!!chat.pending || !!spendBlocked}
            placeholder={
              spendBlocked ?? (chat.turns.length ? "Ask a follow-up…" : `Ask about ${title}…`)
            }
            aria-label="Ask the assistant"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled
            title={voiceReason}
            aria-label="Live voice"
            className="h-10 w-10 shrink-0"
          >
            <Mic className="h-4 w-4" />
          </Button>
          {chat.pending ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={chat.stop}
              aria-label="Stop"
              className="h-10 w-10 shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || !!spendBlocked}
              aria-label="Ask"
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground" aria-live="polite">
          {budgetStripText(chat.budget)}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Phone: a full sheet above the dock. */}
      {open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Assistant"
          className="fixed inset-0 z-40 flex flex-col bg-background pt-[env(safe-area-inset-top)] md:hidden"
        >
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Assistant</p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">{title}</p>
            </div>
            {chat.turns.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={chat.reset}
                aria-label="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </header>
          {conversation}
        </section>
      )}

      {/* Desktop: a bar at the foot of the page that expands to half the viewport. */}
      <section
        aria-label="Assistant"
        className={cn(
          "hidden shrink-0 flex-col border-t bg-background md:flex",
          expanded ? "h-[45dvh]" : "h-11",
        )}
      >
        <div className="flex h-11 shrink-0 items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-accent"
          >
            <Bot className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-medium">Assistant</span>
            <span className="truncate text-muted-foreground">· {title}</span>
            {expanded ? (
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
          {expanded && chat.turns.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={chat.reset}
              aria-label="New conversation"
            >
              <RotateCcw className="h-4 w-4" /> New
            </Button>
          )}
          {!expanded && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              title={voiceReason}
              aria-label="Live voice"
              className="h-8 w-8"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
        {expanded && conversation}
      </section>
    </>
  );
}

function ToolChips({ tools }: { tools: { name: string; status?: string; skipped?: string }[] }) {
  if (tools.length === 0) return null;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      <Wrench className="h-3 w-3" aria-hidden="true" />
      <span>Looked at:</span>
      {tools.map((tool, i) => {
        const skipped = tool.skipped ?? (tool.status === "skipped" ? "skipped" : undefined);
        const running = tool.status === "running";
        return (
          <span
            key={`${tool.name}-${i}`}
            title={skipped ?? tool.name}
            className={cn(
              "rounded border px-1.5 py-0.5",
              skipped ? "border-dashed line-through" : "bg-background",
              running && "animate-pulse",
            )}
          >
            {toolLabel(tool.name)}
          </span>
        );
      })}
    </p>
  );
}

function TurnView({ turn }: { turn: AssistantTurnDto }) {
  return (
    <li className="space-y-2">
      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
        {turn.question}
      </p>
      <div className="max-w-[95%] space-y-2 rounded-2xl rounded-bl-sm border bg-muted/30 px-3 py-2">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{turn.answer}</pre>
        <ToolChips tools={turn.tools} />
        {turn.sources.length > 0 && (
          <ul className="space-y-0.5 text-[11px]">
            {turn.sources.slice(0, 6).map((url) => (
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
        <p className="text-[10px] text-muted-foreground">{turn.modelName}</p>
      </div>
    </li>
  );
}

function PendingView({ pending }: { pending: PendingTurn }) {
  return (
    <li className="space-y-2" aria-busy="true">
      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
        {pending.question}
      </p>
      <div className="max-w-[95%] space-y-2 rounded-2xl rounded-bl-sm border bg-muted/30 px-3 py-2">
        {pending.text ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {pending.text}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            {pending.tools.some((t) => t.status === "running") ? "Reading the data…" : "Thinking…"}
          </p>
        )}
        <ToolChips tools={pending.tools} />
      </div>
    </li>
  );
}
