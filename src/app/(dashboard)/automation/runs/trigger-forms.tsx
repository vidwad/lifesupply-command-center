"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  prepareOrderAction,
  runPriceCheckAction,
  runSkuCheckAction,
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
      title="Run price check"
      description="Worker logs into the portal (live when credentials are configured; simulated otherwise), captures the price, and compares it to the mapped cost."
      state={state}
    >
      <form action={formAction} className="space-y-2">
        <SupplierProductSelect mappings={mappings} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Dispatching…" : "Run price check"}
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
      title="Run stock check"
      description="Worker captures portal availability and compares it to the recorded availability status."
      state={state}
    >
      <form action={formAction} className="space-y-2">
        <SupplierProductSelect mappings={mappings} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Dispatching…" : "Run stock check"}
        </Button>
      </form>
    </TriggerCard>
  );
}

export function SkuCheckForm({ mappings }: { mappings: Mapping[] }) {
  const [state, formAction, pending] = useActionState<AutomationActionState, FormData>(
    runSkuCheckAction,
    undefined,
  );
  return (
    <TriggerCard
      title="Run SKU check"
      description="Verify the mapped SKU exists in the portal and the product name matches. Also the selector-validation probe for the live portal."
      state={state}
    >
      <form action={formAction} className="space-y-2">
        <SupplierProductSelect mappings={mappings} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Dispatching…" : "Run SKU check"}
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
