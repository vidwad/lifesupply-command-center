"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { clearSecretAction, setSecretAction, type SecretActionState } from "./actions";

type Props = {
  integrationId: string;
  integrationName: string;
  hasVaultSecret: boolean;
  vaultEnabled: boolean;
};

export function IntegrationSecretForm({
  integrationId,
  integrationName,
  hasVaultSecret,
  vaultEnabled: vaultOn,
}: Props) {
  const [state, formAction, pending] = useActionState<SecretActionState, FormData>(
    setSecretAction,
    undefined,
  );
  const [reveal, setReveal] = useState(false);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="integrationId" value={integrationId} />
        <div className="relative min-w-[200px] flex-1">
          <Input
            type={reveal ? "text" : "password"}
            name="secret"
            placeholder={hasVaultSecret ? "Enter new key to rotate…" : "Paste API key…"}
            autoComplete="off"
            disabled={pending || !vaultOn}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent"
            aria-label={reveal ? "Hide" : "Show"}
            tabIndex={-1}
          >
            {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
        <Button type="submit" size="sm" disabled={pending || !vaultOn}>
          {pending ? "Saving…" : hasVaultSecret ? "Rotate" : "Save"}
        </Button>
      </form>

      {hasVaultSecret && vaultOn && (
        <form
          action={async (fd) => {
            if (!confirm(`Clear the saved key for ${integrationName}?`)) return;
            await clearSecretAction(fd);
          }}
        >
          <input type="hidden" name="integrationId" value={integrationId} />
          <button
            type="submit"
            className="text-xs text-destructive hover:underline"
            disabled={pending}
          >
            Clear vault entry
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
