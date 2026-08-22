"use client";

/**
 * DP-6 writeback control.
 *
 * The only button in Pricing Intelligence that changes something a customer can
 * see. The copy says so plainly and lists every gate, because an operator
 * should never have to infer from a button label that this one is different
 * from the approve button sitting next to it in the same workflow.
 */
import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

import { writeRecommendationToBigCommerceAction } from "./actions";

export function WritebackForm({
  recommendationId,
  disabledFlags,
}: {
  recommendationId: string;
  disabledFlags: string[];
}): React.JSX.Element {
  const [state, action, pending] = useActionState(
    writeRecommendationToBigCommerceAction,
    undefined,
  );
  const blocked = disabledFlags.length > 0;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="recommendationId" value={recommendationId} />
      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="text-destructive">
          <strong>
            This will update the BigCommerce sale price. This is the first phase that can change
            store pricing.
          </strong>
        </p>
        <p>
          The writeback requires pricing.intelligence, pricing.writebacks, external.writebacks,
          pricing.writeback_bigcommerce, an approved recommendation, and a complete audit log.
        </p>
        <p>
          Only the sale price changes. Regular price, cost, inventory, title, description, SKU, and
          images are not touched. The current store price is read and recorded first so the change
          can be reversed.
        </p>
      </div>
      {blocked ? (
        <p className="text-xs text-destructive">
          Writeback is currently disabled. These flags are off: {disabledFlags.join(", ")}. Enable
          them in /admin/feature-flags. If the kill switch was tripped, that is why.
        </p>
      ) : null}
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
      <Button type="submit" disabled={pending || blocked} variant="destructive">
        {pending ? <Loader2 className="animate-spin" /> : <Upload />}
        Write approved price to BigCommerce
      </Button>
    </form>
  );
}
