"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createDivisionAction,
  updateDivisionAction,
  type DivisionActionState,
} from "./actions";

type Division = {
  id: string;
  name: string;
  code: string;
  type: string | null;
  jurisdiction: string | null;
  parentDivisionId: string | null;
  isActive: boolean;
};

const TYPE_OPTIONS = ["operating", "holding", "geographic", "consolidated"] as const;

export function CreateDivisionForm({
  parents,
}: {
  parents: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DivisionActionState, FormData>(
    createDivisionAction,
    undefined,
  );

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add division
      </Button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
      }}
      className="space-y-3 rounded-md border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">New division</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <DivisionFields parents={parents} />
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Creating…" : "Create division"}
      </Button>
    </form>
  );
}

export function EditDivisionForm({
  division,
  parents,
}: {
  division: Division;
  parents: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DivisionActionState, FormData>(
    updateDivisionAction,
    undefined,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded p-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-card p-3">
      <input type="hidden" name="divisionId" value={division.id} />
      <DivisionFields parents={parents.filter((p) => p.id !== division.id)} division={division} />
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      )}
      {state?.ok && <p className="text-xs text-success">{state.ok}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DivisionFields({
  division,
  parents,
}: {
  division?: Division;
  parents: { id: string; name: string }[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={division?.name ?? ""} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          defaultValue={division?.code ?? ""}
          required
          autoCapitalize="characters"
          maxLength={32}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={division?.type ?? ""}
          className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">—</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jurisdiction">Jurisdiction</Label>
        <Input
          id="jurisdiction"
          name="jurisdiction"
          defaultValue={division?.jurisdiction ?? ""}
          placeholder="CA, US…"
          maxLength={8}
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="parentDivisionId">Parent division</Label>
        <select
          id="parentDivisionId"
          name="parentDivisionId"
          defaultValue={division?.parentDivisionId ?? ""}
          className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">— None (top-level)</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={division?.isActive ?? true}
            className="h-4 w-4 rounded border-input"
          />
          Active
        </label>
        <input type="hidden" name="isActive" value="false" />
      </div>
    </div>
  );
}
