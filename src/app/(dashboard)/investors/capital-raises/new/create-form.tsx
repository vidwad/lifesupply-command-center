"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createCapitalRaiseAction,
  type CapitalRaiseActionState,
} from "../actions";

const ROUND_TYPES = [
  "seed",
  "series_a",
  "series_b",
  "bridge",
  "convertible",
  "credit_facility",
  "preferred_equity",
  "other",
];

export function CapitalRaiseCreateForm() {
  const [state, formAction, pending] = useActionState<CapitalRaiseActionState, FormData>(
    createCapitalRaiseAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Round name</Label>
          <Input id="name" name="name" required placeholder="e.g. LifeSupply Series A" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roundType">Round type</Label>
          <select
            id="roundType"
            name="roundType"
            required
            defaultValue=""
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Choose…</option>
            {ROUND_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetAmount">Target amount (CAD)</Label>
          <Input
            id="targetAmount"
            name="targetAmount"
            type="number"
            min={1}
            step={1000}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preMoneyValuation">Pre-money valuation (optional)</Label>
          <Input
            id="preMoneyValuation"
            name="preMoneyValuation"
            type="number"
            min={0}
            step={10000}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Description (optional)</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Use of proceeds, target close date, terms summary…"
            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create round"}
      </Button>
    </form>
  );
}
