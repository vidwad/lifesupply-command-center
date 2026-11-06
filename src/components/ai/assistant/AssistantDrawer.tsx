"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  AudioLines,
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mic,
  PhoneOff,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssistantTurnDto } from "@/server/services/ai/assistant/types";

import { budgetStripText } from "./budget-strip";
import { useCurrentAssistantPageContext } from "./page-context";
import { toolLabel } from "./tool-labels";
import { useAssistantChat, type PendingTurn } from "./use-assistant-chat";
import { useDictation } from "./use-dictation";
import { useVoiceSession, type VoiceSessionSummary } from "./use-voice-session";
import { formatSeconds, type VoiceState } from "./voice-events";

type Props = {
  suggestions: string[];
  /** The phone sheet. On a desktop the drawer manages its own expansion. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Entry =
  | { kind: "turn"; at: string; turn: AssistantTurnDto }
  | { kind: "voice"; at: string; session: VoiceSessionSummary };

/**
 * The assistant drawer (docs/43 §4.5, Stage 2 and 3, 2026-11-06). One
 * conversation, two shapes: below `md` a full-height sheet the dock's AI
 * key opens, which closes on the X or the phone's back; from `md` up a bar
 * at the foot of the page that expands to about half the viewport. Text
 * mode streams the answer and shows each tool as it runs. Live voice holds
 * a spoken conversation over WebRTC with the same tools behind it, shown as
 * a running transcript with a timer against the session limit; a finished
 * session stays in the thread. Hold-to-talk dictation fills the composer.
 * The budget strip carries today's allowances.
 */
export function AssistantDrawer({ suggestions, open, onOpenChange }: Props) {
  const pageContext = useCurrentAssistantPageContext();
  const chat = useAssistantChat();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [voiceLog, setVoiceLog] = useState<VoiceSessionSummary[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pushedHistory = useRef(false);

  const voice = useVoiceSession({
    onEnded: (summary) => {
      setVoiceLog((prev) => [...prev, summary]);
      void chat.refreshBudget();
    },
  });
  const dictation = useDictation({
    onText: (text) => {
      setDraft((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      textareaRef.current?.focus();
    },
  });

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

  const voiceActive = voice.status !== "idle" && voice.status !== "error";

  // The transcript follows the newest text.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.turns, chat.pending?.text, chat.pending?.tools.length, voice.state.lines, voiceLog]);

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

  const reset = useCallback(() => {
    chat.reset();
    setVoiceLog([]);
  }, [chat]);

  const spendBlocked = chat.budget?.spendBlocked ?? null;
  const voiceReason =
    chat.budget?.voiceBlocked ?? (chat.budget ? null : "Reading today's allowances…");
  const canStartVoice = !voiceReason && voice.status === "idle";
  const title = pageContext.title ?? "this page";
  const hasThread = chat.turns.length > 0 || voiceLog.length > 0;

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [
      ...chat.turns.map((turn) => ({ kind: "turn" as const, at: turn.createdAt, turn })),
      ...voiceLog.map((session) => ({ kind: "voice" as const, at: session.endedAt, session })),
    ];
    return list.sort((a, b) => a.at.localeCompare(b.at));
  }, [chat.turns, voiceLog]);

  const conversation = (
    <>
      <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-3">
        {!hasThread && !chat.pending && !voiceActive ? (
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
            {entries.map((entry, index) =>
              entry.kind === "turn" ? (
                <TurnView key={`turn-${entry.at}-${index}`} turn={entry.turn} />
              ) : (
                <VoiceSessionView key={`voice-${entry.at}-${index}`} session={entry.session} />
              ),
            )}
            {chat.pending && <PendingView pending={chat.pending} />}
            {voiceActive && (
              <LiveVoiceView
                status={voice.status}
                state={voice.state}
                maxSeconds={voice.maxSeconds}
                onStop={voice.stop}
              />
            )}
          </ol>
        )}
        {(chat.error || voice.error || dictation.error) && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {chat.error ?? voice.error ?? dictation.error}
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
              spendBlocked ??
              (dictation.status === "recording"
                ? "Listening…"
                : dictation.status === "transcribing"
                  ? "Transcribing…"
                  : chat.turns.length
                    ? "Ask a follow-up…"
                    : `Ask about ${title}…`)
            }
            aria-label="Ask the assistant"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          {dictation.supported && (
            <Button
              type="button"
              variant={dictation.status === "recording" ? "default" : "outline"}
              size="icon"
              disabled={!!chat.pending || !!spendBlocked || dictation.status === "transcribing"}
              onPointerDown={(event) => {
                event.preventDefault();
                void dictation.start();
              }}
              onPointerUp={dictation.stop}
              onPointerLeave={dictation.stop}
              onPointerCancel={dictation.stop}
              onContextMenu={(event) => event.preventDefault()}
              title="Hold to dictate"
              aria-label="Hold to dictate"
              aria-pressed={dictation.status === "recording"}
              className={cn(
                "h-10 w-10 shrink-0 touch-none select-none",
                dictation.status === "transcribing" && "animate-pulse",
              )}
            >
              <AudioLines className="h-4 w-4" />
            </Button>
          )}
          {voiceActive ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={voice.stop}
              aria-label="End the live conversation"
              title="End the live conversation"
              className="h-10 w-10 shrink-0"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canStartVoice}
              onClick={() => {
                voice.dismissError();
                void voice.start(pageContext);
              }}
              title={voiceReason ?? "Start a live conversation"}
              aria-label="Live voice"
              className="h-10 w-10 shrink-0"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
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
            {hasThread && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={reset}
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
            {voiceActive && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                Live {formatSeconds(voice.state.seconds)}
              </span>
            )}
            {expanded ? (
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
          {expanded && hasThread && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              aria-label="New conversation"
            >
              <RotateCcw className="h-4 w-4" /> New
            </Button>
          )}
          {!expanded && !voiceActive && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canStartVoice}
              onClick={() => {
                setExpanded(true);
                voice.dismissError();
                void voice.start(pageContext);
              }}
              title={voiceReason ?? "Start a live conversation"}
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

function TranscriptLines({ lines }: { lines: { role: "user" | "assistant"; text: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li
          key={`${line.role}-${i}`}
          className={cn(
            "max-w-[90%] rounded-2xl px-3 py-1.5 text-sm",
            line.role === "user"
              ? "ml-auto rounded-br-sm bg-primary/90 text-primary-foreground"
              : "rounded-bl-sm bg-background",
          )}
        >
          {line.text}
        </li>
      ))}
    </ul>
  );
}

function LiveVoiceView({
  status,
  state,
  maxSeconds,
  onStop,
}: {
  status: string;
  state: VoiceState;
  maxSeconds: number;
  onStop: () => void;
}) {
  const label =
    status === "connecting"
      ? "Connecting…"
      : status === "ending"
        ? "Ending…"
        : state.lines.length
          ? "Live"
          : "Listening…";
  return (
    <li
      className="space-y-2 rounded-2xl border border-destructive/30 bg-muted/30 px-3 py-2"
      aria-live="polite"
      aria-label="Live conversation"
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-destructive" />
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {formatSeconds(state.seconds)}
          {maxSeconds ? ` / ${formatSeconds(maxSeconds)}` : ""}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onStop}
          className="ml-auto h-7"
          aria-label="End the live conversation"
        >
          <PhoneOff className="h-3.5 w-3.5" /> End
        </Button>
      </div>
      <TranscriptLines lines={state.lines} />
      <ToolChips tools={state.tools} />
    </li>
  );
}

function VoiceSessionView({ session }: { session: VoiceSessionSummary }) {
  return (
    <li className="space-y-2 rounded-2xl border bg-muted/30 px-3 py-2">
      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Mic className="h-3 w-3" aria-hidden="true" />
        Live conversation, {formatSeconds(session.seconds)}
        {session.reason === "expired" ? ", ended at the session limit" : ""}
        {session.reason === "connection_lost" ? ", connection lost" : ""}
      </p>
      {session.lines.length ? (
        <TranscriptLines lines={session.lines} />
      ) : (
        <p className="text-sm text-muted-foreground">Nothing was said.</p>
      )}
    </li>
  );
}
