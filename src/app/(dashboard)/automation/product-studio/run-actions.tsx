"use client";

/**
 * Deleting a finished run's record from its row (product owner, 2026-11-04).
 * A two-step inline confirm, as on the Product Studio list: a stray tap must
 * not be enough, and the confirm names what goes and what stays. The server
 * refuses a run still in progress, so the page only offers this on finished
 * runs.
 */
import { useActionState, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteRunAction } from "./actions";

export function RunActions({ runId, items }: { runId: string; items: number }): React.JSX.Element {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteRunAction, undefined);

  if (!confirming) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setConfirming(true)}
        aria-label="Delete this run's record"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="runId" value={runId} />
      <span className="text-xs text-muted-foreground">
        Delete this run and its {items} product {items === 1 ? "row" : "rows"}? Projects, images and
        approvals stay.
      </span>
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Confirm
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </Button>
      {state?.error ? (
        <p role="alert" className="basis-full text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
