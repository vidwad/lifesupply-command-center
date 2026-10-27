"use client";

import { useActionState } from "react";
import { Loader2, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cancelRunAction } from "../actions";

export function CancelForm({ runId }: { runId: string }): React.JSX.Element {
  const [state, action, pending] = useActionState(cancelRunAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="runId" value={runId} />
      <input
        type="text"
        name="reason"
        placeholder="Reason (optional)"
        className="h-9 rounded-md border bg-background px-2 text-sm"
      />
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Square />}
        Stop run
      </Button>
      {state?.error ? (
        <p role="alert" className="basis-full text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="basis-full text-xs text-muted-foreground">{state.ok}</p> : null}
    </form>
  );
}
