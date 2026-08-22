"use client";

/**
 * DP-4 generation control.
 *
 * States plainly that it creates proposals only. The button sits next to a
 * competitor-check button that also changes nothing, so the distinction the
 * operator needs is what each one produces, not whether it is safe.
 */
import { useActionState } from "react";
import { Calculator, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { generateRecommendationsAction } from "./actions";

export function GenerateRecommendationsForm({ runId }: { runId: string }): React.JSX.Element {
  const [state, action, pending] = useActionState(generateRecommendationsAction, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="runId" value={runId} />
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>
          <strong>This creates recommendations only. It does not approve or write prices.</strong>
        </p>
        <p>
          Every recommendation is created with <code>requires approval</code> set and status{" "}
          <code>ready_for_review</code>. No product, variant, or BigCommerce price is touched.
        </p>
        <p>
          Only fresh, valid observations at or above the rule&apos;s minimum confidence are used. A
          proposal is never placed below the floor price stored on the run item.
        </p>
        <p>
          Items that already have a live recommendation are skipped rather than duplicated. Re-run a
          competitor check first if the evidence has expired.
        </p>
      </div>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? <Loader2 className="animate-spin" /> : <Calculator />}
        Generate recommendations
      </Button>
    </form>
  );
}
