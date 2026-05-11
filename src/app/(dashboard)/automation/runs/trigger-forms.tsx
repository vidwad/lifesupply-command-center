"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  prepareOrderAction,
  runPriceCheckAction,
  runStockCheckAction,
  type AutomationActionState,
} from "./actions";

type Mapping = { id: string; label: string };
type OrderOption = { id: string; label: string };

export function PriceCheckForm({ mappings }: { mappings: Mapping[] }) {
  const [state, formAction, pending] = useActionState<AutomationActionState, FormData>(
    runPriceCheckAction,
    undefined,
  );
  return (
    <TriggerCard
      title="Run price check (simulated)"
      description="Capture the latest mapped supplier cost. No live portal hit yet."
      state={state}
    >
      <form action={formAction} className="space-y-2">
        <SupplierProductSelect mappings={mappings} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Running…" : "Run price check"}
        </Button>
      </form>
    </TriggerCard>
  );
}

export function StockCheckForm({ mappings }: { mappings: Mapping[] }) {
  const [state, formAction, pending] = useActionState<AutomationActionState, FormData>(
    runStockCheckAction,
    undefined,
  );
  return (
    <TriggerCard
      title="Run stock check (simulated)"
      description="Capture the last-known availability status from the SupplierProduct table."
      state={state}
    >
      <form action={formAction} className="space-y-2">
        <SupplierProductSelect mappings={mappings} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Running…" : "Run stock check"}
        </Button>
      </form>
    </TriggerCard>
  );
}

export function PrepareOrderForm({ orders }: { orders: OrderOption[] }) {
  const [state, formAction, pending] = useActionState<AutomationActionState, FormData>(
    prepareOrderAction,
    undefined,
  );
  return (
    <TriggerCard
      title="Prepare supplier order"
      description="Group order items by supplier, validate against mapped cost, raise an approval. NO live submission."
      state={state}
    >
      <form action={formAction} className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Order
        </label>
        <select
          name="orderId"
          required
          className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Choose an order…</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Preparing…" : "Prepare order"}
        </Button>
      </form>
    </TriggerCard>
  );
}

function SupplierProductSelect({ mappings }: { mappings: Mapping[] }) {
  return (
    <>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Supplier product
      </label>
      <select
        name="supplierProductId"
        required
        className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
      >
        <option value="">Choose a mapping…</option>
        {mappings.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </>
  );
}

function TriggerCard({
  title,
  description,
  state,
  children,
}: {
  title: string;
  description: string;
  state: AutomationActionState;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
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
          {state.runId && (
            <>
              {" — "}
              <Link
                href={`/automation/runs/${state.runId}`}
                className="text-primary hover:underline"
              >
                view run
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
