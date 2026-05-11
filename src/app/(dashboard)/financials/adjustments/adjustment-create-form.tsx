"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createAdjustmentAction,
  type AdjustmentActionState,
} from "./actions";

const CATEGORIES = [
  { value: "ebitda_addback", label: "EBITDA addback" },
  { value: "normalization", label: "Normalization" },
  { value: "one_time", label: "One-time item" },
  { value: "owner_compensation", label: "Owner compensation" },
  { value: "other", label: "Other" },
];

type Props = {
  periods: { id: string; name: string; status: string }[];
  divisions: { id: string; name: string }[];
};

export function AdjustmentCreateForm({ periods, divisions }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AdjustmentActionState, FormData>(
    createAdjustmentAction,
    undefined,
  );

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Add adjustment
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-card p-4">
      <h2 className="text-sm font-medium">New adjustment</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="periodId">Period</Label>
          <select
            id="periodId"
            name="periodId"
            required
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Choose…</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id} disabled={p.status === "approved"}>
                {p.name}
                {p.status === "approved" ? " (locked)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="divisionId">Division</Label>
          <select
            id="divisionId"
            name="divisionId"
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">— Consolidated</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            required
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Choose…</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountKey">Account key (optional)</Label>
          <Input
            id="accountKey"
            name="accountKey"
            placeholder="e.g. revenue, ebitda"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="amount">Amount (CAD)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            required
            inputMode="decimal"
            placeholder="Negative numbers reduce; positives add."
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Why this adjustment exists. Reviewers will see this."
          />
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
      {state?.ok && (
        <p role="status" className="text-xs text-success">
          {state.ok}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Save adjustment (pending approval)"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
