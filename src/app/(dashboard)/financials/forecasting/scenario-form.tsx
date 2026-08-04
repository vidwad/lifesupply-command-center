"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { createScenarioAction, type ForecastActionState } from "./actions";

const METHODS = [
  { value: "trailing_average", label: "Trailing average (hold recent mean flat)" },
  { value: "linear_trend", label: "Linear trend (extrapolate the fitted line)" },
  { value: "seasonal_naive", label: "Seasonal naive (same month last year)" },
];

const inputCls =
  "h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ScenarioForm() {
  const [state, formAction, pending] = useActionState<ForecastActionState, FormData>(
    createScenarioAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Scenario name</Label>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          placeholder="e.g. Base case FY27, Supplier +8% stress"
          className={inputCls}
        />
        <p className="text-xs text-muted-foreground">
          Re-using a name saves a new version — nothing is overwritten.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="method">Projection method</Label>
          <select id="method" name="method" className={inputCls} defaultValue="trailing_average">
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="horizonMonths">Horizon (months)</Label>
          <input
            id="horizonMonths"
            name="horizonMonths"
            type="number"
            min={1}
            max={24}
            defaultValue={12}
            className={inputCls}
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Scenario assumptions (all optional)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <Field
            name="revenueGrowthPctMonthly"
            label="Revenue growth %/month"
            placeholder="e.g. 2"
          />
          <Field
            name="grossMarginDeltaPp"
            label="Gross margin change (pp)"
            placeholder="e.g. -1.5"
          />
          <Field
            name="supplierCostIncreasePct"
            label="Supplier cost increase %"
            placeholder="e.g. 5"
          />
          <Field
            name="reactivationRevenueMonthly"
            label="Reactivation revenue $/month"
            placeholder="e.g. 10000"
          />
          <Field
            name="marketingRoiMultiplier"
            label="Marketing ROI multiplier"
            placeholder="default 1"
          />
          <Field
            name="incrementalMarginPct"
            label="Incremental revenue margin %"
            placeholder="defaults to baseline"
          />
          <Field
            name="financingCashInjection"
            label="Financing injection $ (one-time)"
            placeholder="e.g. 250000"
          />
          <Field
            name="acquisitionRevenueMonthly"
            label="Acquisition revenue $/month"
            placeholder="e.g. 20000"
          />
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes / rationale</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={2000}
          placeholder="What question does this scenario answer?"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
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
        {pending ? "Generating…" : "Generate scenario"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <input
        id={name}
        name={name}
        type="number"
        step="any"
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}
