"use client";

/**
 * DP-6C reconcile control.
 *
 * Says "check" rather than "fix". This button reads the store and records what
 * it found; it corrects nothing, and the copy should not let anyone believe
 * otherwise on a page full of mismatch warnings.
 */
import { useActionState } from "react";
import { Loader2, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import { reconcileWritebackAction } from "./actions";

export function ReconcileForm({ writebackLogId }: { writebackLogId: string }): React.JSX.Element {
  const [state, action, pending] = useActionState(reconcileWritebackAction, undefined);

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="writebackLogId" value={writebackLogId} />
      <Button type="submit" disabled={pending} variant="outline" size="sm">
        {pending ? <Loader2 className="animate-spin" /> : <SearchCheck />}
        Reconcile this writeback log
      </Button>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
    </form>
  );
}
