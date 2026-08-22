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
          <option value="">Full daily batch ({dailyBatchSize} products)</option>
          <option value="5">Test run — 5 products</option>
          <option value="10">Test run — 10 products</option>
          <option value="25">Test run — 25 products</option>
        </select>
      </div>
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>
          <strong>
            Batch size means products, not competitor URLs. Each product may check up to five
            approved competitor URLs.
          </strong>
        </p>
        <p>
          <strong>
            This is read-only. It creates competitor observations only. It does not create
            recommendations, approvals, or BigCommerce price changes.
          </strong>
        </p>
        <p>
          Only competitors marked <code>reviewed_allowed</code> are checked. Pending or restricted
          competitors are skipped.
        </p>
        <p>
          The actual number of checks may be lower than the product batch size because of missing
          URLs, blocked items, robots.txt, or competitor rate limits.
        </p>
        <p>
          Read-only GET requests to pages you configured or uploaded. No logins, no form
          submissions, no carts.
        </p>
      </div>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? <Loader2 className="animate-spin" /> : <Search />}
        Run read-only competitor check
      </Button>
    </form>
  );
}
