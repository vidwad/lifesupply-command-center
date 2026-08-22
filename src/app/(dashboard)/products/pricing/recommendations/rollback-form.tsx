"use client";

/**
 * DP-6B rollback control.
 *
 * Like the writeback button, this changes a live storefront price, and the copy
 * says so rather than leaving the operator to infer it from the word "rollback"
 * — which sounds like undoing something internal.
 */
import { useActionState } from "react";
import { Loader2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { rollBackWritebackAction } from "./actions";

export function RollbackForm({
  writebackLogId,
  recommendationId,
  restoreTo,
  disabledFlags,
}: {
  writebackLogId: string;
  recommendationId: string;
  restoreTo: number | null;
  disabledFlags: string[];
}): React.JSX.Element {
  const [state, action, pending] = useActionState(rollBackWritebackAction, undefined);
  const blocked = disabledFlags.length > 0;

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="writebackLogId" value={writebackLogId} />
      <input type="hidden" name="recommendationId" value={recommendationId} />
      <p className="text-xs text-destructive">
        <strong>
          This will change the live BigCommerce sale price back to the previously recorded value
          from the writeback log.
        </strong>
        {restoreTo == null ? null : <> Restoring to ${restoreTo.toFixed(2)}.</>}
      </p>
      <p className="text-xs text-muted-foreground">
        Rollback requires pricing.intelligence, pricing.writebacks, external.writebacks,
        pricing.writeback_bigcommerce, a successful writeback log, rollback evidence, and a
        successful pre-rollback store read.
      </p>
      <p className="text-xs text-muted-foreground">
        If the store price has changed since the writeback, the rollback is refused rather than
        overwriting whatever changed it.
      </p>
      {blocked ? (
        <p className="text-xs text-destructive">
          Rollback is currently disabled. These flags are off: {disabledFlags.join(", ")}.
        </p>
      ) : null}
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
      <Button type="submit" disabled={pending || blocked} variant="destructive" size="sm">
        {pending ? <Loader2 className="animate-spin" /> : <Undo2 />}
        Rollback this BigCommerce sale price
      </Button>
    </form>
  );
}
