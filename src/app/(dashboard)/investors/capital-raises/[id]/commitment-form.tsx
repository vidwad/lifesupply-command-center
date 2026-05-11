"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createCommitmentAction,
  type CapitalRaiseActionState,
} from "../actions";

const COMMITMENT_STATUSES = ["soft", "signed", "funded"];

export function CommitmentCreateForm({
  capitalRaiseId,
  investors,
}: {
  capitalRaiseId: string;
  investors: { id: string; name: string; organization: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CapitalRaiseActionState, FormData>(
    createCommitmentAction,
    undefined,
  );

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add commitment
      </Button>
    );
  }
  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-card p-4">
      <input type="hidden" name="capitalRaiseId" value={capitalRaiseId} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="investorId">Investor</Label>
          <select
            id="investorId"
            name="investorId"
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">— Use label below instead</option>
            {investors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
                {i.organization ? ` · ${i.organization}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="investorLabel">Label (if not in CRM)</Label>
          <Input id="investorLabel" name="investorLabel" placeholder="e.g. Acme Family Office" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (CAD)</Label>
          <Input id="amount" name="amount" type="number" min={1} step={1000} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="soft"
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {COMMITMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save commitment"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
