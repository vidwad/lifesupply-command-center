"use client";

import { useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import type { ImportActionState } from "./actions";

type Props = {
  title: string;
  description: string;
  expectedColumns: string[];
  showStoreSelect?: boolean;
  stores?: { id: string; name: string }[];
  fileAccept?: string;
  action: (
    prev: ImportActionState,
    formData: FormData,
  ) => Promise<ImportActionState>;
};

export function ImportForm({
  title,
  description,
  expectedColumns,
  showStoreSelect,
  stores,
  fileAccept = ".csv,text/csv",
  action,
}: Props) {
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    action,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
      }}
      className="space-y-4 rounded-md border bg-card p-4"
    >
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Expected columns
        </Label>
        <div className="flex flex-wrap gap-1">
          {expectedColumns.map((col) => (
            <code
              key={col}
              className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]"
            >
              {col}
            </code>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Header is required on row 1. Extra columns are ignored. Common BigCommerce / QuickBooks
          export header variants are supported.
        </p>
      </div>

      {showStoreSelect && stores && (
        <div className="space-y-1.5">
          <Label htmlFor="storeId">Store</Label>
          <select
            id="storeId"
            name="storeId"
            required
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Choose a store…</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="file">CSV file</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept={fileAccept}
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
            {state.status === "completed"
              ? "Import completed."
              : state.status === "completed_with_warnings"
                ? "Import completed with warnings."
                : "Import failed."}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs">
            <li>{state.recordsProcessed} rows processed</li>
            <li>{state.recordsCreated} created</li>
            <li>{state.recordsUpdated} updated</li>
            <li>{state.recordsFailed} failed</li>
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
                {state.warnings.length > 25 && (
                  <li>… {state.warnings.length - 25} more</li>
                )}
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
