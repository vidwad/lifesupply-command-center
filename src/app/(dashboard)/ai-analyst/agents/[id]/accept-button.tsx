"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { acceptRecommendationAction, type AgentActionState } from "../actions";

export function AcceptRecommendationButton({
  runId,
  index,
  alreadyAccepted,
}: {
  runId: string;
  index: number;
  alreadyAccepted: boolean;
}) {
  const [state, formAction, pending] = useActionState<AgentActionState, FormData>(
    acceptRecommendationAction,
    undefined,
  );
  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="runId" value={runId} />
      <input type="hidden" name="recommendationIndex" value={index} />
      <Button type="submit" size="sm" variant="outline" disabled={pending || alreadyAccepted}>
        {alreadyAccepted ? "Task created" : pending ? "Creating…" : "Create task"}
      </Button>
      {state?.error && <p className="text-[10px] text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-[10px] text-success">{state.ok}</p>}
    </form>
  );
}
