"use client";

/**
 * DP-5 approve / reject controls.
 *
 * Rendered only when the server-side predicate says a decision is available,
 * so the page never offers a control the action would refuse. The copy is
 * explicit that approving is an internal state change: the whole risk of this
 * phase is someone reading "Approve" as "publish this price".
 */
import { useActionState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { approveRecommendationAction, rejectRecommendationAction } from "./actions";

export function ApproveForm({ recommendationId }: { recommendationId: string }): React.JSX.Element {
  const [state, action, pending] = useActionState(approveRecommendationAction, undefined);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="recommendationId" value={recommendationId} />
      <p className="text-xs text-muted-foreground">
        <strong>
          Approval marks this recommendation as internally approved only. It does not update
          BigCommerce or change any product price.
        </strong>
      </p>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Check />}
        Approve recommendation
      </Button>
    </form>
  );
}

export function RejectForm({ recommendationId }: { recommendationId: string }): React.JSX.Element {
  const [state, action, pending] = useActionState(rejectRecommendationAction, undefined);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="recommendationId" value={recommendationId} />
      <div className="space-y-1.5">
        <Label htmlFor="rejectionReason">Rejection reason (required)</Label>
        <textarea
          id="rejectionReason"
          name="rejectionReason"
          rows={3}
          required
          minLength={3}
          maxLength={1000}
          placeholder="Why is this price wrong? The next reviewer sees this."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? <Loader2 className="animate-spin" /> : <X />}
        Reject recommendation
      </Button>
    </form>
  );
}
