"use client";

/**
 * DP-2 run builder forms. Both submit through server actions that re-check
 * pricing.create_runs; nothing here contacts a competitor site.
 */
import { useActionState } from "react";
import { Loader2, ListPlus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createTopProductsRunAction, createUploadRunAction, type RunActionState } from "./actions";

type StoreOption = { id: string; name: string };

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function Feedback({ state }: { state: RunActionState }): React.JSX.Element | null {
  if (state?.error) return <p className="text-xs text-destructive">{state.error}</p>;
  if (state?.ok) return <p className="text-xs text-muted-foreground">{state.ok}</p>;
  return null;
}

function StoreField({ stores }: { stores: StoreOption[] }): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="storeId">Store</Label>
      <select id="storeId" name="storeId" className={selectClass} required>
        <option value="">Choose a store…</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TopProductsForm({
  stores,
  defaultBatchSize,
}: {
  stores: StoreOption[];
  defaultBatchSize: number;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(createTopProductsRunAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <StoreField stores={stores} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lookbackWindow">Lookback window</Label>
          <select
            id="lookbackWindow"
            name="lookbackWindow"
            className={selectClass}
            defaultValue="90"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
            <option value="365">Last 365 days</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rankingBasis">Ranking basis</Label>
          <select
            id="rankingBasis"
            name="rankingBasis"
            className={selectClass}
            defaultValue="revenue"
          >
            <option value="revenue">Revenue</option>
            <option value="units">Units sold</option>
            <option value="gross_profit">Estimated gross profit</option>
            <option value="margin_opportunity">Margin opportunity</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetCount">Target count</Label>
          <Input id="targetCount" name="targetCount" type="number" min={1} defaultValue={1500} />
        </div>
        <div className="space-y-1.5">
          <Label>Daily batch size</Label>
          <p className="flex h-10 items-center text-sm text-muted-foreground">
            {defaultBatchSize} / day — from the active pricing rule
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Products without a cost basis are kept in the list but blocked, so you can see what needs a
        cost before any future price check.
      </p>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <ListPlus />}
        Build draft list
      </Button>
    </form>
  );
}

export function UploadForm({ stores }: { stores: StoreOption[] }): React.JSX.Element {
  const [state, action, pending] = useActionState(createUploadRunAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <StoreField stores={stores} />
      <div className="space-y-1.5">
        <Label htmlFor="file">CSV file</Label>
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
        <p className="text-xs text-muted-foreground">
          Required columns: <code>sku</code> and one of <code>current_price</code> /{" "}
          <code>current_sale_price</code>. Recommended: <code>cost_price</code> — rows without a
          cost are imported but blocked. Optional: <code>product_name</code>,{" "}
          <code>competitor_url_optional</code>, <code>product_id</code>, <code>variant_id</code>,{" "}
          <code>store</code>, <code>supplier_sku</code>, <code>notes</code>.
        </p>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Upload />}
        Upload and build draft list
      </Button>
    </form>
  );
}
