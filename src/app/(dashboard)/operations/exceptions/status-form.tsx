"use client";

import { useActionState, useState } from "react";

import {
  setStatusAction,
  type ExceptionActionState,
} from "./actions";

type Props = {
  id: string;
  currentStatus: string;
};

const TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  open: [
    { value: "investigating", label: "Investigating" },
    { value: "blocked", label: "Blocked" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismiss" },
  ],
  investigating: [
    { value: "blocked", label: "Blocked" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismiss" },
  ],
  blocked: [
    { value: "investigating", label: "Investigating" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismiss" },
  ],
  resolved: [{ value: "open", label: "Reopen" }],
  dismissed: [{ value: "open", label: "Reopen" }],
};

export function ExceptionStatusForm({ id, currentStatus }: Props) {
  const [state, formAction, pending] = useActionState<ExceptionActionState, FormData>(
    setStatusAction,
    undefined,
  );
  const [target, setTarget] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const next = TRANSITIONS[currentStatus] ?? [];
  if (next.length === 0) return null;

  if (target) {
    const requireNotes = target === "resolved";
    return (
      <form action={formAction} className="flex flex-col gap-2 rounded-md border bg-card p-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value={target} />
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required={requireNotes}
          rows={2}
          placeholder={
            requireNotes ? "Resolution notes (required)" : "Notes (optional)"
          }
          className="w-full rounded border bg-background px-2 py-1 text-xs"
        />
        <div className="flex gap-1">
          <button
            type="submit"
            disabled={pending || (requireNotes && !notes.trim())}
            className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTarget(null);
              setNotes("");
            }}
            className="rounded border px-2 py-1 text-xs hover:bg-accent"
          >
            Cancel
          </button>
        </div>
        {state?.error && (
          <span className="text-xs text-destructive" role="alert">
            {state.error}
          </span>
        )}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {next.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => setTarget(t.value)}
          className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
