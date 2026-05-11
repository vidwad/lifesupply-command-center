"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { importBudgetAction, type BudgetImportState } from "./actions";

const EXPECTED_COLUMNS = ["period", "account", "amount"];
const ACCOUNT_KEYS = [
  "revenue",
  "cogs",
  "gross_profit",
  "operating_expenses",
  "operating_income",
  "ebitda",
];

export function BudgetImportForm({
  divisions,
}: {
  divisions: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<BudgetImportState, FormData>(
    importBudgetAction,
    undefined,
  );
  const currentYear = new Date().getUTCFullYear();

  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-medium">Import budget</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          One row per (period, account). Periods must already exist by name. Existing budget lines
          for the same combination are overwritten — safe to re-run after corrections.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Expected columns
        </Label>
        <div className="flex flex-wrap gap-1">
          {EXPECTED_COLUMNS.map((c) => (
            <code key={c} className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              {c}
            </code>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          account ∈ {ACCOUNT_KEYS.join(", ")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Budget name</Label>
          <Input id="name" name="name" required placeholder="e.g. FY26 Plan" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            name="year"
            type="number"
            min={2000}
            max={2100}
            defaultValue={currentYear}
            required
          />
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="file">CSV file</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
        />
      </div>

      {state && state.ok === false && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {state && state.ok && (
        <div
          role="status"
          className="space-y-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm"
        >
          <p className="font-medium">
            {state.rowsFailed === 0
              ? "Import completed."
              : `Import completed with ${state.rowsFailed} failure${state.rowsFailed === 1 ? "" : "s"}.`}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs">
            <li>{state.rowsProcessed} rows processed</li>
            <li>{state.rowsCreated} new lines</li>
            <li>{state.rowsUpdated} lines updated</li>
          </ul>
          {state.warnings.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                {state.warnings.length} warning{state.warnings.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                {state.warnings.slice(0, 25).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Importing…" : "Run import"}
      </Button>
    </form>
  );
}
