"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { clearFieldAction, setFieldAction, type FieldActionState } from "./actions";

type Props = {
  integrationId: string;
  integrationName: string;
  fieldName: string;
  fieldLabel: string;
  isSet: boolean;
  isSecret: boolean;
  isMultiline: boolean;
  placeholder?: string;
  vaultEnabled: boolean;
};

export function IntegrationFieldForm({
  integrationId,
  integrationName,
  fieldName,
  fieldLabel,
  isSet,
  isSecret,
  isMultiline,
  placeholder,
  vaultEnabled: vaultOn,
}: Props) {
  const [state, formAction, pending] = useActionState<FieldActionState, FormData>(
    setFieldAction,
    undefined,
  );
  const [reveal, setReveal] = useState(false);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="integrationId" value={integrationId} />
        <input type="hidden" name="fieldName" value={fieldName} />
        <div className="relative min-w-[200px] flex-1">
          {isMultiline ? (
            <textarea
              name="value"
              rows={3}
              placeholder={placeholder ?? (isSet ? "Enter new value to rotate…" : "Paste value…")}
              autoComplete="off"
              disabled={pending || !vaultOn}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
          ) : (
            <>
              <Input
                type={isSecret && !reveal ? "password" : "text"}
                name="value"
                placeholder={placeholder ?? (isSet ? "Enter new value to rotate…" : "Paste value…")}
                autoComplete="off"
                disabled={pending || !vaultOn}
                className={isSecret ? "pr-10" : undefined}
              />
              {isSecret && (
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label={reveal ? "Hide" : "Show"}
                  tabIndex={-1}
                >
                  {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              )}
            </>
          )}
        </div>
        <Button type="submit" size="sm" disabled={pending || !vaultOn}>
          {pending ? "Saving…" : isSet ? "Rotate" : "Save"}
        </Button>
      </form>

      {isSet && vaultOn && (
        <form
          action={async (fd) => {
            if (!confirm(`Clear ${fieldLabel} for ${integrationName}?`)) return;
            await clearFieldAction(fd);
          }}
        >
          <input type="hidden" name="integrationId" value={integrationId} />
          <input type="hidden" name="fieldName" value={fieldName} />
          <button
            type="submit"
            className="text-xs text-destructive hover:underline"
            disabled={pending}
          >
            Clear this value
          </button>
        </form>
      )}

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
