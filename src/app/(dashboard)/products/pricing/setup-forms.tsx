"use client";

import { useActionState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  deleteCompetitorAction,
  deleteRuleAction,
  saveCompetitorAction,
  saveRuleAction,
  setCompetitorEnabledAction,
  setRuleEnabledAction,
  type PricingActionState,
} from "./actions";

type ActionFn = (previous: PricingActionState, formData: FormData) => Promise<PricingActionState>;

function Feedback({ state }: { state: PricingActionState }) {
  if (state?.error) {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
      >
        {state.error}
      </p>
    );
  }
  if (state?.ok) return <p className="text-sm text-success">{state.ok}</p>;
  return null;
}

function Field(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      {props.label}
      {props.children}
      {props.hint ? (
        <span className="block text-xs font-normal text-muted-foreground">{props.hint}</span>
      ) : null}
    </label>
  );
}

function Checkbox(props: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={props.name}
        defaultChecked={props.defaultChecked}
        className="h-4 w-4 rounded border"
      />
      {props.label}
    </label>
  );
}

/** Enable/disable + delete buttons shared by both setup tables. */
export function RowActions(props: { id: string; enabled: boolean; kind: "competitor" | "rule" }) {
  const enabledAction: ActionFn =
    props.kind === "competitor" ? setCompetitorEnabledAction : setRuleEnabledAction;
  const deleteAction: ActionFn =
    props.kind === "competitor" ? deleteCompetitorAction : deleteRuleAction;
  const [toggleState, toggleFormAction, togglePending] = useActionState<
    PricingActionState,
    FormData
  >(enabledAction, undefined);
  const [deleteState, deleteFormAction, deletePending] = useActionState<
    PricingActionState,
    FormData
  >(deleteAction, undefined);

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <form action={toggleFormAction}>
          <input type="hidden" name="id" value={props.id} />
          <input type="hidden" name="enabled" value={props.enabled ? "false" : "true"} />
          <Button type="submit" size="sm" variant="outline" disabled={togglePending}>
            {props.enabled ? "Disable" : "Enable"}
          </Button>
        </form>
        <form action={deleteFormAction}>
          <input type="hidden" name="id" value={props.id} />
          <Button type="submit" size="sm" variant="outline" disabled={deletePending}>
            <Trash2 /> Delete
          </Button>
        </form>
      </div>
      <Feedback state={toggleState ?? deleteState} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competitor form (create + edit)
// ---------------------------------------------------------------------------

export type CompetitorFormValues = {
  id?: string;
  name?: string;
  baseUrl?: string;
  country?: string | null;
  currency?: string;
  searchUrlTemplate?: string | null;
  productUrlPattern?: string | null;
  rateLimitPerHour?: number;
  termsReviewStatus?: string;
  requiresManualUrlMapping?: boolean;
  enabled?: boolean;
  notes?: string | null;
};

const selectClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CompetitorForm({ values = {} }: { values?: CompetitorFormValues }) {
  const [state, formAction, pending] = useActionState<PricingActionState, FormData>(
    saveCompetitorAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <Input name="name" defaultValue={values.name} required minLength={2} maxLength={120} />
        </Field>
        <Field
          label="Base URL"
          hint="Stored for research traceability only — never contacted in this phase."
        >
          <Input name="baseUrl" type="url" defaultValue={values.baseUrl} required />
        </Field>
        <Field label="Country (optional)">
          <Input name="country" defaultValue={values.country ?? ""} maxLength={56} />
        </Field>
        <Field label="Currency">
          <Input name="currency" defaultValue={values.currency ?? "CAD"} required maxLength={3} />
        </Field>
        <Field
          label="Search URL template (optional)"
          hint="Must contain {sku}, {query}, or {name} — used by a later phase, never fetched today."
        >
          <Input name="searchUrlTemplate" defaultValue={values.searchUrlTemplate ?? ""} />
        </Field>
        <Field label="Product URL pattern (optional)">
          <Input name="productUrlPattern" defaultValue={values.productUrlPattern ?? ""} />
        </Field>
        <Field label="Rate limit per hour" hint="Cap for future read-only checks (1–600).">
          <Input
            name="rateLimitPerHour"
            type="number"
            min={1}
            max={600}
            defaultValue={values.rateLimitPerHour ?? 60}
            required
          />
        </Field>
        <Field label="Terms review status">
          <select
            name="termsReviewStatus"
            defaultValue={values.termsReviewStatus ?? "pending"}
            className={selectClass}
          >
            <option value="pending">pending</option>
            <option value="reviewed_allowed">reviewed_allowed</option>
            <option value="reviewed_restricted">reviewed_restricted</option>
            <option value="disabled">disabled</option>
          </select>
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea name="notes" defaultValue={values.notes ?? ""} rows={2} className={selectClass} />
      </Field>
      <div className="flex flex-wrap gap-4">
        <Checkbox
          name="requiresManualUrlMapping"
          label="Requires manual URL mapping"
          defaultChecked={values.requiresManualUrlMapping ?? false}
        />
        <Checkbox name="enabled" label="Enabled" defaultChecked={values.enabled ?? true} />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        {values.id ? "Save competitor" : "Add competitor"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Pricing rule form (create + edit)
// ---------------------------------------------------------------------------

export type RuleFormValues = {
  id?: string;
  name?: string;
  storeId?: string | null;
  minCostMultiplier?: number;
  defaultUndercutAmount?: number;
  defaultUndercutPct?: number | null;
  maxIncreasePct?: number;
  maxDecreasePct?: number;
  dailyBatchSize?: number;
  minConfidence?: number;
  evidenceFreshnessHours?: number;
  autoApproveEligible?: boolean;
  enabled?: boolean;
  notes?: string | null;
};

export function RuleForm({
  values = {},
  stores,
}: {
  values?: RuleFormValues;
  stores: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<PricingActionState, FormData>(
    saveRuleAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {/* Approval cannot be turned off in this phase — enforced server-side too. */}
      <input type="hidden" name="requiresApproval" value="on" />
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Name">
          <Input name="name" defaultValue={values.name} required minLength={2} maxLength={120} />
        </Field>
        <Field label="Store scope (optional)" hint="Leave global to apply everywhere.">
          <select name="storeId" defaultValue={values.storeId ?? ""} className={selectClass}>
            <option value="">Global (all stores)</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Min cost multiplier" hint="Price floor: sale ≥ cost × this. Never below 1.">
          <Input
            name="minCostMultiplier"
            type="number"
            step="0.01"
            min={1}
            max={10}
            defaultValue={values.minCostMultiplier ?? 1.4}
            required
          />
        </Field>
        <Field label="Undercut amount ($)">
          <Input
            name="defaultUndercutAmount"
            type="number"
            step="0.01"
            min={0}
            defaultValue={values.defaultUndercutAmount ?? 0.01}
            required
          />
        </Field>
        <Field label="Undercut percent (optional)">
          <Input
            name="defaultUndercutPct"
            type="number"
            step="0.01"
            min={0}
            max={50}
            defaultValue={values.defaultUndercutPct ?? ""}
          />
        </Field>
        <Field label="Max increase %">
          <Input
            name="maxIncreasePct"
            type="number"
            step="0.01"
            min={0}
            max={100}
            defaultValue={values.maxIncreasePct ?? 10}
            required
          />
        </Field>
        <Field label="Max decrease %">
          <Input
            name="maxDecreasePct"
            type="number"
            step="0.01"
            min={0}
            max={100}
            defaultValue={values.maxDecreasePct ?? 20}
            required
          />
        </Field>
        <Field label="Daily batch size" hint="1–2000 items per day.">
          <Input
            name="dailyBatchSize"
            type="number"
            min={1}
            max={2000}
            defaultValue={values.dailyBatchSize ?? 300}
            required
          />
        </Field>
        <Field label="Min match confidence" hint="0–1.">
          <Input
            name="minConfidence"
            type="number"
            step="0.01"
            min={0}
            max={1}
            defaultValue={values.minConfidence ?? 0.85}
            required
          />
        </Field>
        <Field label="Evidence freshness (hours)">
          <Input
            name="evidenceFreshnessHours"
            type="number"
            min={1}
            max={720}
            defaultValue={values.evidenceFreshnessHours ?? 48}
            required
          />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea name="notes" defaultValue={values.notes ?? ""} rows={2} className={selectClass} />
      </Field>
      <div className="flex flex-wrap gap-4">
        <Checkbox name="enabled" label="Enabled" defaultChecked={values.enabled ?? true} />
      </div>
      {/* Rendered as static text, not a disabled input: a disabled checkbox
          submits nothing, so the field would silently fall to false anyway —
          and a control that looks settable invites the question of why it is
          not. The server rejects autoApproveEligible outright. */}
      <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Auto-approve: off</p>
        <p className="mt-1">
          Auto-approval is unavailable until a later product-owner-approved automation phase. Every
          recommendation requires human approval in this phase; that setting cannot be turned off.
        </p>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        {values.id ? "Save rule" : "Add rule"}
      </Button>
    </form>
  );
}
