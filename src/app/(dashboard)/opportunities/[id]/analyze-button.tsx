"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { analyzeOpportunityAction, type AnalyzeState } from "./actions";

export function AnalyzeOpportunityButton({
  opportunityId,
  hasExisting,
}: {
  opportunityId: string;
  hasExisting: boolean;
}) {
  const [state, formAction, pending] = useActionState<AnalyzeState, FormData>(
    analyzeOpportunityAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <Sparkles className={pending ? "h-3 w-3 animate-pulse" : "h-3 w-3"} />
        {pending ? "Analyzing…" : hasExisting ? "Re-run analysis" : "Generate AI analysis"}
      </Button>
      {state?.status === "error" && (
        <p
          className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
