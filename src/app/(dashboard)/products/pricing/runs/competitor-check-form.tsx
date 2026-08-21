"use client";

/**
 * DP-3 read-only competitor check control.
 *
 * Deliberately explicit that it changes no prices: this is the first pricing
 * action that reaches outside the building, and the operator should not have to
 * infer what it does from the button label.
 */
import { useActionState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { requestCompetitorCheckAction } from "./actions";

export function CompetitorCheckForm({
  runId,
  dailyBatchSize,
}: {
  runId: string;
  dailyBatchSize: number;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(requestCompetitorCheckAction, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="runId" value={runId} />
      <div className="space-y-1.5">
        <Label htmlFor="batchSize">Batch size</Label>
        <select
          id="batchSize"
          name="batchSize"
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Full daily batch ({dailyBatchSize})</option>
          <option value="5">Test run — 5 items</option>
          <option value="10">Test run — 10 items</option>
          <option value="25">Test run — 25 items</option>
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Fetches only the competitor product pages configured or uploaded for these items, from
        competitors whose terms review is <strong>allowed</strong>. Read-only GET requests, rate
        limited per competitor, no logins and no form submissions.{" "}
        <strong>No recommendations or price changes are made in this phase.</strong>
      </p>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? <Loader2 className="animate-spin" /> : <Search />}
        Run read-only competitor check
      </Button>
    </form>
  );
}
