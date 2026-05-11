"use client";

import { useActionState, useState } from "react";
import { Send, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  exportToMailchimpAction,
  requestApprovalAction,
  type CampaignActionState,
} from "./actions";

export function RequestApprovalButton({
  campaignId,
  disabled,
  disabledReason,
}: {
  campaignId: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [state, formAction, pending] = useActionState<CampaignActionState, FormData>(
    requestApprovalAction,
    undefined,
  );

  if (!open) {
    return (
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        <Send className="h-4 w-4" /> Request approval
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm">
      <input type="hidden" name="campaignId" value={campaignId} />
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Notes for approver (optional)
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

export function ExportToMailchimpButton({
  campaignId,
  disabled,
  disabledReason,
}: {
  campaignId: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, formAction, pending] = useActionState<CampaignActionState, FormData>(
    exportToMailchimpAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="campaignId" value={campaignId} />
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        disabled={pending || disabled}
        title={disabled ? disabledReason : undefined}
      >
        <Upload className="h-4 w-4" />
        {pending ? "Exporting…" : "Export to Mailchimp"}
      </Button>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
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
