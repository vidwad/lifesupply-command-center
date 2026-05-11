"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";

import { approveAction, rejectAction, withdrawAction, type ApprovalActionState } from "../actions";

export function ApprovalDecisionForms({ approvalId }: { approvalId: string }) {
  const [approveState, approveFormAction, approvePending] = useActionState<
    ApprovalActionState,
    FormData
  >(approveAction, undefined);
  const [rejectState, rejectFormAction, rejectPending] = useActionState<
    ApprovalActionState,
    FormData
  >(rejectAction, undefined);

  const [notes, setNotes] = useState("");
  const state = approveState ?? rejectState;
  const notesTrimmed = notes.trim();
  const canReject = notesTrimmed.length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label
          htmlFor="decisionNotes"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Decision notes <span className="text-destructive">(required when rejecting)</span>
        </label>
        <textarea
          id="decisionNotes"
          name="decisionNotes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional for approvals. A reason is required to reject."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <form
          action={(fd) => {
            fd.set("decisionNotes", notes);
            return approveFormAction(fd);
          }}
        >
          <input type="hidden" name="approvalId" value={approvalId} />
          <Button type="submit" disabled={approvePending || rejectPending}>
            {approvePending ? "Approving…" : "Approve"}
          </Button>
        </form>
        <form
          action={(fd) => {
            fd.set("decisionNotes", notes);
            return rejectFormAction(fd);
          }}
        >
          <input type="hidden" name="approvalId" value={approvalId} />
          <Button
            type="submit"
            variant="destructive"
            disabled={approvePending || rejectPending || !canReject}
            title={canReject ? undefined : "Enter a reason before rejecting."}
          >
            {rejectPending ? "Rejecting…" : "Reject"}
          </Button>
        </form>
      </div>

      {state?.error && (
        <p
          className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-xs text-success" role="status">
          {state.ok}
        </p>
      )}
    </div>
  );
}

export function WithdrawForm({ approvalId }: { approvalId: string }) {
  return (
    <form
      action={async (fd) => {
        if (!confirm("Withdraw this approval request?")) return;
        await withdrawAction(fd);
      }}
    >
      <input type="hidden" name="approvalId" value={approvalId} />
      <button type="submit" className="text-xs text-destructive hover:underline">
        Withdraw this request
      </button>
    </form>
  );
}
