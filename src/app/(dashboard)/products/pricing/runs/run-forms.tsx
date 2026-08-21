"use client";

/**
 * DP-2 run builder forms.
 *
 * Both forms submit twice: once to preview, once to confirm. The confirm submit
 * replays the exact inputs that produced the preview — for uploads that means
 * echoing the parsed CSV text, since a File cannot survive the round trip.
 */
import { useActionState } from "react";
import { CheckCircle2, ListPlus, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  buildTopProductsRunAction,
  buildUploadRunAction,
  type RunActionState,
  type RunPreview,
} from "./actions";

type StoreOption = { id: string; name: string };

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const money = (value: number | null): string => (value == null ? "—" : "$" + value.toFixed(2));

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

/** Preview panel plus the confirm submit. Nothing is stored until this runs. */
function PreviewPanel({
  preview,
  pending,
}: {
  preview: RunPreview;
  pending: boolean;
}): React.JSX.Element {
  const s = preview.summary;
  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">Preview — nothing has been saved yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Confirm below to create the draft run. Blocked rows are kept so you can see what needs a
          cost or a price before any future price check.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total", s.total],
          ["Ready", s.pending],
          ["Blocked", s.blocked],
          ["Missing cost", s.missingCost],
          ["Duplicates", s.duplicates],
          ["Invalid price", s.invalidPrice],
          ["Below floor", s.belowFloor],
          ["Unmatched", s.unmatched],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border bg-background p-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {preview.duplicateSkus.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Duplicate SKUs: {preview.duplicateSkus.slice(0, 10).join(", ")}
          {preview.duplicateSkus.length > 10 ? ` +${preview.duplicateSkus.length - 10} more` : ""}
        </p>
      ) : null}

      <div className="max-h-72 overflow-auto rounded-md border bg-background">
        <table className="w-full text-xs">
          <thead className="sticky top-0 border-b bg-muted/60 text-left">
            <tr>
              <th className="px-2 py-1.5">SKU</th>
              <th className="px-2 py-1.5">Product</th>
              <th className="px-2 py-1.5 text-right">Price</th>
              <th className="px-2 py-1.5 text-right">Cost</th>
              <th className="px-2 py-1.5">Cost source</th>
              <th className="px-2 py-1.5 text-right">Floor</th>
              <th className="px-2 py-1.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {preview.sample.map((row, index) => (
              <tr key={row.sku + ":" + String(index)} className="border-b last:border-0">
                <td className="px-2 py-1.5 font-mono">{row.sku || "—"}</td>
                <td className="px-2 py-1.5">{row.productName ?? "—"}</td>
                <td className="px-2 py-1.5 text-right">{money(row.effectivePrice)}</td>
                <td className="px-2 py-1.5 text-right">{money(row.costPrice)}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{row.costSource}</td>
                <td className="px-2 py-1.5 text-right">{money(row.floorPrice)}</td>
                <td className="px-2 py-1.5">
                  {row.status === "blocked"
                    ? (row.blockedReason ?? "blocked").replaceAll("_", " ")
                    : "ready"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing the first {preview.sample.length} rows, blocked ones first.
      </p>

      <input type="hidden" name="confirm" value="1" />
      {Object.entries(preview.inputs).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      {preview.csvText ? <input type="hidden" name="csvText" value={preview.csvText} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
        Confirm and create draft run
      </Button>
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
  const [state, action, pending] = useActionState(buildTopProductsRunAction, undefined);
  const preview = state?.preview;

  return (
    <form action={action} className="space-y-4">
      {preview ? (
        <>
          <p className="text-xs text-muted-foreground">
            Reviewing the selection below. Change an input and preview again, or confirm to save.
          </p>
          <PreviewPanel preview={preview} pending={pending} />
        </>
      ) : (
        <>
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
              <Label htmlFor="targetCount">Target count (max 1500)</Label>
              <Input
                id="targetCount"
                name="targetCount"
                type="number"
                min={1}
                max={1500}
                defaultValue={1500}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Daily batch size</Label>
              <p className="flex h-10 items-center text-sm text-muted-foreground">
                {defaultBatchSize} / day — from the active pricing rule
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Nothing is saved on this step. You will see a preview of the selection, including rows
            blocked for a missing cost, before anything is created.
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <ListPlus />}
            Preview selection
          </Button>
        </>
      )}
      <Feedback state={state} />
    </form>
  );
}

export function UploadForm({ stores }: { stores: StoreOption[] }): React.JSX.Element {
  const [state, action, pending] = useActionState(buildUploadRunAction, undefined);
  const preview = state?.preview;

  return (
    <form action={action} className="space-y-4">
      {preview ? (
        <>
          <input type="hidden" name="fileName" value={preview.inputs.fileName ?? "upload.csv"} />
          <PreviewPanel preview={preview} pending={pending} />
        </>
      ) : (
        <>
          <StoreField stores={stores} />
          <div className="space-y-1.5">
            <Label htmlFor="file">CSV file</Label>
            <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
            <p className="text-xs text-muted-foreground">
              CSV only in this phase — XLSX is deferred to a later DP phase. Export your spreadsheet
              as CSV first. Maximum 1 MB; a 1500-row list is well under this.
            </p>
            <p className="text-xs text-muted-foreground">
              Required: <code>sku</code>, plus <code>current_price</code> or{" "}
              <code>current_sale_price</code>. Recommended: <code>cost_price</code> — rows without a
              cost are imported but blocked. Optional: <code>product_name</code>,{" "}
              <code>competitor_url_optional</code>, <code>product_id</code>, <code>variant_id</code>
              , <code>store</code>, <code>supplier_sku</code>, <code>notes</code>.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            Preview upload
          </Button>
        </>
      )}
      <Feedback state={state} />
    </form>
  );
}
