"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  regenerateBriefingAction,
  type RegenerateBriefingState,
} from "@/app/(dashboard)/dashboard/actions";

export function RegenerateBriefingButton() {
  const [state, formAction, pending] = useActionState<RegenerateBriefingState, FormData>(
    regenerateBriefingAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <RefreshCw className={pending ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
        {pending ? "Generating…" : "Regenerate"}
      </Button>
      {state?.status === "error" && (
        <p className="max-w-xs text-right text-xs text-destructive" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
