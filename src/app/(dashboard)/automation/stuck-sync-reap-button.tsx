"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { reapStuckSyncsAction, type ReapActionState } from "./stuck-sync-actions";

export function StuckSyncReapButton() {
  const [state, formAction, pending] = useActionState<ReapActionState, FormData>(
    reapStuckSyncsAction,
    undefined,
  );
  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Reaping…" : "Mark stuck syncs failed"}
      </Button>
      {state?.error && <p className="text-[10px] text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-[10px] text-success">{state.ok}</p>}
    </form>
  );
}
