"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createInvestorAction, updateInvestorAction, type InvestorFormState } from "./actions";

const TYPE_OPTIONS = [
  { value: "", label: "—" },
  { value: "vc", label: "VC" },
  { value: "angel", label: "Angel" },
  { value: "family_office", label: "Family office" },
  { value: "lender", label: "Lender" },
  { value: "strategic", label: "Strategic" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "prospect", label: "Prospect" },
  { value: "engaged", label: "Engaged" },
  { value: "committed", label: "Committed" },
  { value: "declined", label: "Declined" },
  { value: "closed", label: "Closed" },
];

type Mode = "create" | "edit";

type Defaults = {
  id?: string;
  name?: string;
  organization?: string | null;
  email?: string | null;
  phone?: string | null;
  investorType?: string | null;
  status?: string;
  notes?: string | null;
};

export function InvestorForm({ mode, defaults = {} }: { mode: Mode; defaults?: Defaults }) {
  const action = mode === "create" ? createInvestorAction : updateInvestorAction;
  const [state, formAction, pending] = useActionState<InvestorFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && defaults.id && (
        <input type="hidden" name="investorId" value={defaults.id} />
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults.name ?? ""}
          placeholder="Investor name or contact"
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            name="organization"
            defaultValue={defaults.organization ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="investorType">Type</Label>
          <select
            id="investorType"
            name="investorType"
            defaultValue={defaults.investorType ?? ""}
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value || "_"} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults.email ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={defaults.phone ?? ""} disabled={pending} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaults.status ?? "prospect"}
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

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={defaults.notes ?? ""}
          disabled={pending}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
          {pending ? "Saving…" : mode === "create" ? "Create investor" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
