"use client";

import { useActionState, useState } from "react";

import { setStatusAction, type DiligenceActionState } from "./actions";

const TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  pending: [
    { value: "in_progress", label: "Start" },
    { value: "blocked", label: "Block" },
    { value: "not_applicable", label: "N/A" },
  ],
  in_progress: [
    { value: "done", label: "Done" },
    { value: "blocked", label: "Block" },
    { value: "pending", label: "Pause" },
  ],
  blocked: [
    { value: "in_progress", label: "Unblock" },
    { value: "not_applicable", label: "N/A" },
  ],
  done: [{ value: "in_progress", label: "Reopen" }],
  not_applicable: [{ value: "pending", label: "Reopen" }],
};

export function DiligenceStatusForm({
  id,
  opportunityId,
  currentStatus,
}: {
  id: string;
  opportunityId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState<DiligenceActionState, FormData>(
    setStatusAction,
    undefined,
  );
  const [target, setTarget] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const next = TRANSITIONS[currentStatus] ?? [];
  if (next.length === 0) return null;

  if (target) {
    return (
      <form action={formAction} className="flex flex-col gap-1 rounded border bg-card p-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value={target} />
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className="w-full rounded border bg-background px-2 py-1 text-xs"
        />
        <div className="flex gap-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
          >
            {pending ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTarget(null);
              setNotes("");
            }}
            className="rounded border px-2 py-1 text-xs"
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
