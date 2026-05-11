"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { logInteractionAction, type LogInteractionState } from "./actions";

const TYPE_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "document_shared", label: "Document shared" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LogInteractionForm({ investorId }: { investorId: string }) {
  const [state, formAction, pending] = useActionState<LogInteractionState, FormData>(
    logInteractionAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="investorId" value={investorId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="interactionType">Type</Label>
          <select
            id="interactionType"
            name="interactionType"
            defaultValue="meeting"
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="interactionDate">Date</Label>
          <Input
            id="interactionDate"
            name="interactionDate"
            type="date"
            defaultValue={todayISO()}
            required
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="summary">Summary</Label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          placeholder="What was discussed / shared?"
          disabled={pending}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="nextAction">Next action (optional)</Label>
        <Input
          id="nextAction"
          name="nextAction"
          placeholder="e.g. Send forecast deck by Friday"
          disabled={pending}
        />
      </div>

      {state?.error && (
        <p
          className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-xs text-success" role="status">
          {state.ok}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Logging…" : "Log interaction"}
        </Button>
      </div>
    </form>
  );
}
