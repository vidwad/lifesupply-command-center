"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";

import { decideAiOutputAction, type ReviewActionState } from "./actions";

export function ReviewForm({ outputId, status }: { outputId: string; status: string }) {
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(
    decideAiOutputAction,
    undefined,
  );
  const [rejecting, setRejecting] = useState(false);

  const canReview = status === "generated";
  const canDecide = status === "generated" || status === "reviewed";
  const canArchive = status !== "archived";

  return (
    <form action={formAction} className="space-y-1.5">
      <input type="hidden" name="outputId" value={outputId} />
      <div className="flex flex-wrap gap-1.5">
        {canReview && (
          <Button
            type="submit"
            name="decision"
            value="reviewed"
            size="sm"
            variant="outline"
            disabled={pending}
          >
            Mark reviewed
          </Button>
        )}
        {canDecide && (
          <Button type="submit" name="decision" value="approved" size="sm" disabled={pending}>
            Approve
          </Button>
        )}
        {canDecide &&
          (rejecting ? (
            <Button
              type="submit"
              name="decision"
              value="rejected"
              size="sm"
              variant="destructive"
              disabled={pending}
            >
              Confirm reject
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setRejecting(true)}>
              Reject…
            </Button>
          ))}
        {canArchive && (
          <Button
            type="submit"
            name="decision"
            value="archived"
            size="sm"
            variant="ghost"
            disabled={pending}
          >
            Archive
          </Button>
        )}
      </div>
      {rejecting && (
        <textarea
          name="rejectionReason"
          required
          rows={2}
          placeholder="Why is this output rejected? (required)"
          className="w-full rounded-md border bg-background px-2 py-1 text-xs"
        />
      )}
      {state?.error && <p className="text-[10px] text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-[10px] text-success">{state.ok}</p>}
    </form>
  );
}
