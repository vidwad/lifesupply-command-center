"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { requestApprovalAction, type ReportActionState } from "./actions";

export function RequestApprovalButton({
  reportId,
  disabled,
}: {
  reportId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [state, formAction, pending] = useActionState<ReportActionState, FormData>(
    requestApprovalAction,
    undefined,
  );

  if (!open) {
    return (
      <Button
        size="sm"
        variant="default"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={
          disabled
            ? "Approval can only be requested for generated / under-review reports."
            : undefined
        }
      >
        <Send className="h-4 w-4" /> Request approval
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm"
    >
      <input type="hidden" name="reportId" value={reportId} />
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Notes for reviewer (optional)
      </label>
      <textarea
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Anything the approver should know."
        className="rounded border bg-background px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Submitting…" : "Submit"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setNotes("");
          }}
        >
          Cancel
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-xs text-success">
          {state.ok}
        </p>
      )}
    </form>
  );
}
