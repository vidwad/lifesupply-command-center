"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createOpportunityAction,
  updateOpportunityAction,
  type OpportunityFormState,
} from "./actions";

const TYPE_OPTIONS = [
  { value: "acquisition", label: "Acquisition" },
  { value: "supplier", label: "Supplier" },
  { value: "financing", label: "Financing" },
  { value: "marketing", label: "Marketing" },
  { value: "product", label: "Product" },
  { value: "operational", label: "Operational" },
  { value: "technology", label: "Technology" },
  { value: "partnership", label: "Partnership" },
  { value: "cost_reduction", label: "Cost reduction" },
];

const STATUS_OPTIONS = [
  { value: "identified", label: "Identified" },
  { value: "evaluating", label: "Evaluating" },
  { value: "committed", label: "Committed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
  { value: "on_hold", label: "On hold" },
];

const RISK_OPTIONS = [
  { value: "", label: "—" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "—" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

type Mode = "create" | "edit";

type Defaults = {
  id?: string;
  title?: string;
  opportunityType?: string;
  status?: string;
  strategicRationale?: string | null;
  estimatedRevenueImpact?: number | null;
  /** Stored as 0..1; rendered as percent (multiply by 100) */
  estimatedMarginImpact?: number | null;
  estimatedCost?: number | null;
  riskRating?: string | null;
  priority?: string | null;
  ownerId?: string | null;
  nextAction?: string | null;
  /** ISO yyyy-mm-dd */
  dueDate?: string | null;
};

type Props = {
  mode: Mode;
  defaults?: Defaults;
  ownerOptions: { id: string; name: string | null; email: string }[];
};

export function OpportunityForm({ mode, defaults = {}, ownerOptions }: Props) {
  const action = mode === "create" ? createOpportunityAction : updateOpportunityAction;
  const [state, formAction, pending] = useActionState<OpportunityFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && defaults.id && (
        <input type="hidden" name="opportunityId" value={defaults.id} />
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults.title ?? ""}
          placeholder="e.g. Acquire BBM01 product line"
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="opportunityType">Type</Label>
          <select
            id="opportunityType"
            name="opportunityType"
            required
            defaultValue={defaults.opportunityType ?? "acquisition"}
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status ?? "identified"}
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="strategicRationale">Strategic rationale</Label>
        <textarea
          id="strategicRationale"
          name="strategicRationale"
          rows={4}
          defaultValue={defaults.strategicRationale ?? ""}
          placeholder="Why this matters and what it changes."
          disabled={pending}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="estimatedRevenueImpact">Revenue impact (CAD)</Label>
          <Input
            id="estimatedRevenueImpact"
            name="estimatedRevenueImpact"
            type="number"
            step="0.01"
            defaultValue={defaults.estimatedRevenueImpact ?? ""}
            disabled={pending}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedMarginImpact">Margin uplift (%)</Label>
          <Input
            id="estimatedMarginImpact"
            name="estimatedMarginImpact"
            type="number"
            step="0.1"
            defaultValue={
              defaults.estimatedMarginImpact != null
                ? (defaults.estimatedMarginImpact * 100).toFixed(1)
                : ""
            }
            disabled={pending}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedCost">Cost / investment (CAD)</Label>
          <Input
            id="estimatedCost"
            name="estimatedCost"
            type="number"
            step="0.01"
            defaultValue={defaults.estimatedCost ?? ""}
            disabled={pending}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={defaults.priority ?? ""}
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value || "_"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="riskRating">Risk</Label>
          <select
            id="riskRating"
            name="riskRating"
            defaultValue={defaults.riskRating ?? ""}
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {RISK_OPTIONS.map((o) => (
              <option key={o.value || "_"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaults.dueDate ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerId">Owner</Label>
        <select
          id="ownerId"
          name="ownerId"
          defaultValue={defaults.ownerId ?? ""}
          disabled={pending}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— Assign to me —</option>
          {ownerOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name ?? o.email}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextAction">Next action</Label>
        <Input
          id="nextAction"
          name="nextAction"
          defaultValue={defaults.nextAction ?? ""}
          placeholder="What needs to happen next?"
          disabled={pending}
        />
      </div>

      {state?.error && (
        <p
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
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

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create opportunity" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
