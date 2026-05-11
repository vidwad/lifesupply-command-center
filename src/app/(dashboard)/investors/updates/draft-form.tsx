"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { draftAction, type InvestorUpdateActionState } from "./actions";

export function InvestorUpdateDraftForm({
  periods,
}: {
  periods: { id: string; name: string; status: string }[];
}) {
  const [state, formAction, pending] = useActionState<InvestorUpdateActionState, FormData>(
    draftAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-medium">Draft an investor update with AI</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Pulls the chosen financial period&rsquo;s figures + investor distribution snapshot. The draft
          is saved in <code>draft</code>; approval + the <code>investor.distribution</code>{" "}
          feature flag are required to release.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="e.g. Q1 2026 Investor Update" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="financialPeriodId">Financial period</Label>
          <select
            id="financialPeriodId"
            name="financialPeriodId"
            required
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Choose…</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="brief">Brief</Label>
          <textarea
            id="brief"
            name="brief"
            required
            rows={4}
            placeholder="What to emphasize: strategic wins, fundraising progress, M&A activity, hiring milestones, etc."
            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm"
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
      <Button type="submit" disabled={pending}>
        {pending ? "Drafting…" : "Draft update"}
      </Button>
    </form>
  );
}
