"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { submitOrderAction, type AutomationActionState } from "../actions";

export function SubmitOrderForm({ runId, disabled }: { runId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState<AutomationActionState, FormData>(
    submitOrderAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="runId" value={runId} />
      <Button type="submit" variant="destructive" disabled={pending || disabled}>
        {pending ? "Submitting…" : "Submit to supplier"}
      </Button>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-xs text-success">
          {state.ok}
        </p>
      )}
    </form>
  );
}
