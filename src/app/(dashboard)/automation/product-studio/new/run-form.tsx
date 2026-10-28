"use client";

/**
 * The run form (2026-10-27). Every criterion the service enforces is here,
 * with the defaults from autopilot-settings; scores are entered as whole
 * percentages, as the project page shows them. The worst-case image count is
 * recomputed as the fields change so the spend is visible before the run
 * starts.
 */
import { useActionState, useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_AUTOPILOT_SETTINGS,
  MAX_PARALLEL_PRODUCTS,
  MAX_RUN_IMAGES,
  MAX_RUN_PRODUCTS,
  PUBLISH_MODE_LABEL,
  PUBLISH_MODES,
} from "@/server/services/product-studio/autopilot-settings";

import { createRunAction } from "../actions";

type Props = {
  projectIds: string[];
  disabledReason: string | null;
  /** Whether the publish flags are on, so a publish mode may be chosen. */
  publishAvailable: boolean;
  /** Selected projects with no catalogue product: a publish mode would be refused for them. */
  unlinkedCount: number;
};

function Field({
  id,
  label,
  help,
  children,
}: {
  id: string;
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
  );
}

export function RunForm({
  projectIds,
  disabledReason,
  publishAvailable,
  unlinkedCount,
}: Props): React.JSX.Element {
  const [state, action, pending] = useActionState(createRunAction, undefined);
  const d = DEFAULT_AUTOPILOT_SETTINGS;
  const [publishMode, setPublishMode] = useState<string>(d.publishMode);
  const [imagesPerProduct, setImagesPerProduct] = useState(d.imagesPerProduct);
  const [maxRegenerations, setMaxRegenerations] = useState(d.maxRegenerationsPerSlot);
  const [maxImagesTotal, setMaxImagesTotal] = useState(
    Math.min(
      MAX_RUN_IMAGES,
      d.imagesPerProduct * (1 + d.maxRegenerationsPerSlot) * Math.max(projectIds.length, 1),
    ),
  );
  const worstCase = useMemo(
    () => Math.min(maxImagesTotal, imagesPerProduct * (1 + maxRegenerations) * projectIds.length),
    [imagesPerProduct, maxRegenerations, maxImagesTotal, projectIds.length],
  );
  const disabled = pending || projectIds.length === 0 || disabledReason != null;

  return (
    <form action={action} className="space-y-6">
      {projectIds.map((id) => (
        <input key={id} type="hidden" name="projectId" value={id} />
      ))}

      <section className="grid gap-4 sm:grid-cols-2">
        <Field
          id="minImageScore"
          label="Minimum image score (%)"
          help="The lowest of a draft's identity, condition and composition QA scores must reach this to be approved. Below it the draft is rejected and regenerated. A QA verdict of reject or garbled text always regenerates."
        >
          <Input
            id="minImageScore"
            name="minImageScore"
            type="number"
            min={50}
            max={100}
            step={1}
            defaultValue={Math.round(d.minImageScore * 100)}
            required
          />
        </Field>
        <Field
          id="maxRegenerationsPerSlot"
          label="Regenerations per image"
          help="Extra attempts after the first image. When they run out the slot is left rejected for a person and the product is marked for attention."
        >
          <Input
            id="maxRegenerationsPerSlot"
            name="maxRegenerationsPerSlot"
            type="number"
            min={0}
            max={4}
            step={1}
            defaultValue={d.maxRegenerationsPerSlot}
            onChange={(event) => setMaxRegenerations(Number(event.target.value) || 0)}
            required
          />
        </Field>
        <Field
          id="minIdentityConfidence"
          label="Minimum identity confidence (%)"
          help="Research must be at least this sure it found the exact product before any image is generated. Below it the product stops, unspent, for a person to confirm the model."
        >
          <Input
            id="minIdentityConfidence"
            name="minIdentityConfidence"
            type="number"
            min={50}
            max={100}
            step={1}
            defaultValue={Math.round(d.minIdentityConfidence * 100)}
            required
          />
        </Field>
        <Field
          id="imagesPerProduct"
          label="Images per product"
          help="Compositions 1 to n are generated; the research still plans all four."
        >
          <Input
            id="imagesPerProduct"
            name="imagesPerProduct"
            type="number"
            min={1}
            max={4}
            step={1}
            defaultValue={d.imagesPerProduct}
            onChange={(event) => setImagesPerProduct(Number(event.target.value) || 1)}
            required
          />
        </Field>
        <Field
          id="maxProducts"
          label="Maximum products"
          help={`The run refuses to start with more products than this. Up to ${MAX_RUN_PRODUCTS}.`}
        >
          <Input
            id="maxProducts"
            name="maxProducts"
            type="number"
            min={1}
            max={MAX_RUN_PRODUCTS}
            step={1}
            defaultValue={Math.max(d.maxProducts, projectIds.length)}
            required
          />
        </Field>
        <Field
          id="maxImagesTotal"
          label="Image ceiling for the run"
          help={`Generation stops across the run once this many images exist, regenerations included; remaining products are marked for attention. Up to ${MAX_RUN_IMAGES}.`}
        >
          <Input
            id="maxImagesTotal"
            name="maxImagesTotal"
            type="number"
            min={1}
            max={MAX_RUN_IMAGES}
            step={1}
            defaultValue={maxImagesTotal}
            onChange={(event) => setMaxImagesTotal(Number(event.target.value) || 1)}
            required
          />
        </Field>
        <Field
          id="parallelProducts"
          label="Products at a time"
          help={`How many products are worked in parallel. Up to ${MAX_PARALLEL_PRODUCTS}.`}
        >
          <Input
            id="parallelProducts"
            name="parallelProducts"
            type="number"
            min={1}
            max={MAX_PARALLEL_PRODUCTS}
            step={1}
            defaultValue={d.parallelProducts}
            required
          />
        </Field>
        <Field
          id="stopAfterConsecutiveFailures"
          label="Stop after consecutive failures"
          help="If this many products fail one after another (a provider outage, say), the run stops rather than failing the rest."
        >
          <Input
            id="stopAfterConsecutiveFailures"
            name="stopAfterConsecutiveFailures"
            type="number"
            min={1}
            max={10}
            step={1}
            defaultValue={d.stopAfterConsecutiveFailures}
            required
          />
        </Field>
      </section>

      <section className="space-y-3 rounded-md border p-4 text-sm">
        <div className="space-y-1.5">
          <Label htmlFor="publishMode">Publish to BigCommerce</Label>
          <select
            id="publishMode"
            name="publishMode"
            defaultValue="none"
            disabled={!publishAvailable}
            onChange={(event) => setPublishMode(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
          >
            {PUBLISH_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {PUBLISH_MODE_LABEL[mode]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {publishAvailable
              ? "Once a product's images are approved, the run publishes through the same service and gates as the publishing card: its log row before every request, stopping at the first failure. A refused or failed publish leaves the product for your attention; nothing is retried on its own."
              : "Publishing from a run needs product_studio.publish and external.writebacks on. They are off, so this run leaves approved drafts for a Super Admin to publish."}
          </p>
        </div>
        {publishMode !== "none" && unlinkedCount > 0 ? (
          <p
            role="alert"
            className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs"
          >
            {unlinkedCount === 1
              ? "One selected project is not linked to a catalogue product. Its images will be approved, but publishing will be refused because there is no store listing to write to. Link it on its project page first, or run it without publishing."
              : `${String(unlinkedCount)} selected projects are not linked to a catalogue product. Their images will be approved, but publishing will be refused because there is no store listing to write to. Link them on their project pages first, or run without publishing.`}
          </p>
        ) : null}
        {publishMode === "images_and_description" || publishMode === "all" ? (
          <div className="space-y-1.5">
            <Label htmlFor="descriptionMode">Store description</Label>
            <select
              id="descriptionMode"
              name="descriptionMode"
              defaultValue="replace"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="replace">Replace the store description with the new one.</option>
              <option value="fill_empty">Write it only where the store has no description.</option>
            </select>
          </div>
        ) : null}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="createTask"
            value="1"
            defaultChecked={d.createTask}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            Open a Task for me listing the products that need attention when the run finishes.
          </span>
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 p-4 text-sm">
        <p>
          <span className="font-medium">
            {projectIds.length} product{projectIds.length === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · worst case {worstCase} image{worstCase === 1 ? "" : "s"} generated, each with its own
            QA pass; research runs once per product.
          </span>
        </p>
        <Button type="submit" variant="destructive" className="ml-auto" disabled={disabled}>
          {pending ? <Loader2 className="animate-spin" /> : <Play />}
          Start unattended run
        </Button>
      </div>
      {disabledReason ? (
        <p role="alert" className="text-xs text-destructive">
          {disabledReason}
        </p>
      ) : null}
      {state?.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
