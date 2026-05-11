"use client";

import { useActionState, useState } from "react";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  tripKillSwitchAction,
  type KillSwitchState,
} from "./kill-switch-actions";

export function KillSwitchPanel({ riskyEnabledCount }: { riskyEnabledCount: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState<KillSwitchState, FormData>(
    tripKillSwitchAction,
    undefined,
  );

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
        <div className="flex-1">
          <h3 className="text-sm font-medium">Kill-switch — disable all high-risk capabilities</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            One click to flip OFF: <code>supplier.automation</code>,{" "}
            <code>supplier.order_submit</code>, <code>external.writebacks</code>,{" "}
            <code>quickbooks.writebacks</code>, <code>ai.actions</code>,{" "}
            <code>mailchimp.send</code>, <code>investor.distribution</code>. Read-only flags are
            untouched. Action is audit-logged with the reason.
          </p>
          {riskyEnabledCount > 0 && (
            <p className="mt-2 text-xs font-medium text-destructive">
              {riskyEnabledCount} high-risk flag{riskyEnabledCount === 1 ? " is" : "s are"}{" "}
              currently enabled.
            </p>
          )}
        </div>
      </div>
      {!open ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Trip kill-switch
          </Button>
        </div>
      ) : (
        <form action={formAction} className="mt-3 space-y-2">
          <textarea
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            required
            placeholder="Why are you tripping the kill-switch? (required, audit-logged)"
            className="w-full rounded border bg-background px-2 py-1 text-xs"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={pending || !reason.trim()}
            >
              {pending ? "Tripping…" : "Confirm — disable all"}
            </Button>
          </div>
          {state?.ok === false && (
            <p role="alert" className="text-xs text-destructive">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p role="status" className="text-xs text-success">
              Tripped. {state.flippedCount} flag{state.flippedCount === 1 ? "" : "s"} flipped off
              ({state.alreadyOffCount} already off).
            </p>
          )}
        </form>
      )}
    </div>
  );
}
