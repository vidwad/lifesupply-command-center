"use client";

import { useState } from "react";

import { rejectAdjustmentAction } from "./actions";

export function RejectAdjustmentForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-destructive hover:underline"
      >
        Reject
      </button>
    );
  }

  return (
    <form action={rejectAdjustmentAction} className="space-y-2 rounded-md border bg-card p-2">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
        rows={2}
        placeholder="Why this adjustment is being rejected"
        className="w-full rounded border bg-background px-2 py-1 text-xs"
      />
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={!reason.trim()}
          className="rounded bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground disabled:opacity-40"
        >
          Confirm reject
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setReason("");
          }}
          className="rounded border px-2 py-1 text-xs hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
