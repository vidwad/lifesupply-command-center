"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { runDelaySweepAction, type SweepActionState } from "./sweep-actions";

export function SweepButton() {
  const [state, formAction, pending] = useActionState<SweepActionState, FormData>(
    runDelaySweepAction,
    undefined,
  );
  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Dispatching…" : "Run delay sweep now"}
      </Button>
      {state?.error && <p className="text-[10px] text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-[10px] text-success">{state.ok}</p>}
    </form>
  );
}
