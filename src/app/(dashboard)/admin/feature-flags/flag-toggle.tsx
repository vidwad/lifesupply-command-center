"use client";

import { useActionState } from "react";

import {
  toggleFeatureFlagAction,
  type FeatureFlagActionState,
} from "./actions";

type Props = {
  flagKey: string;
  enabled: boolean;
};

/**
 * Single-row toggle. Renders both the "enable" and "disable" buttons so the
 * server action receives an explicit value — no hidden three-state inputs.
 */
export function FlagToggle({ flagKey, enabled }: Props) {
  const [state, formAction, pending] = useActionState<FeatureFlagActionState, FormData>(
    toggleFeatureFlagAction,
    undefined,
  );

  return (
    <div className="flex items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="key" value={flagKey} />
        <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
        <button
          type="submit"
          disabled={pending}
          className={
            enabled
              ? "rounded-md border border-destructive/50 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              : "rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          }
          aria-pressed={enabled}
        >
          {pending ? "…" : enabled ? "Disable" : "Enable"}
        </button>
      </form>
      {state?.error && (
        <span className="text-xs text-destructive" role="alert">
          {state.error}
        </span>
      )}
      {state?.ok && (
        <span className="text-xs text-success" role="status">
          ✓
        </span>
      )}
    </div>
  );
}
