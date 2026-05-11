"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { runRetentionAction, type RetentionActionState } from "./actions";

export function RunRetentionButton({ retentionDays }: { retentionDays: number }) {
  const [state, formAction, pending] = useActionState<RetentionActionState, FormData>(
    runRetentionAction,
    undefined,
  );
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          <Trash2 className="h-4 w-4" />
          {pending ? "Pruning…" : `Run retention (>${retentionDays}d)`}
        </Button>
      </form>
      {state?.ok === false && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-xs text-success">
          Pruned {state.report.pruned} · preserved {state.report.preserved} · scanned{" "}
          {state.report.scanned} in {state.report.durationMs}ms
        </p>
      )}
    </div>
  );
}
