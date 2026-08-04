"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { generateReportAction, type GenerateReportState } from "../actions";

type Props = {
  periods: { id: string; name: string; status: string }[];
  divisions: { id: string; code: string; name: string }[];
};

const REPORT_TYPES = [
  {
    value: "monthly_management",
    label: "Monthly management report",
    hint: "Internal monthly review for the chosen division.",
  },
  {
    value: "board",
    label: "Board report",
    hint: "Consolidated board pack: financials, trend, capital, risks. Approval required before external use.",
  },
  {
    value: "investor",
    label: "Investor & lender package",
    hint: "Concise external package with TTM figures; excludes internal task lists. Approval required; never auto-distributed.",
  },
];

export function GenerateReportForm({ periods, divisions }: Props) {
  const [state, formAction, pending] = useActionState<GenerateReportState, FormData>(
    generateReportAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reportType">Report type</Label>
        <select
          id="reportType"
          name="reportType"
          defaultValue="monthly_management"
          disabled={pending}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Board and investor packages are consolidated and must be approved before any external use;
          nothing is distributed automatically.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodId">Period</Label>
        <select
          id="periodId"
          name="periodId"
          required
          disabled={pending}
          defaultValue={periods[0]?.id ?? ""}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.status.replace("_", " ")})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="divisionCode">Division</Label>
        <select
          id="divisionCode"
          name="divisionCode"
          defaultValue="CONS"
          disabled={pending}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {divisions.map((d) => (
            <option key={d.id} value={d.code}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate"}
        </Button>
      </div>
    </form>
  );
}
