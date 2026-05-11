"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createStoreAction,
  updateStoreAction,
  type StoreActionState,
} from "./actions";

type Store = {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  sourceSystem: string | null;
  externalStoreId: string | null;
  status: string;
  divisionId: string;
};

const PLATFORMS = ["bigcommerce", "amazon", "manual", "other"] as const;
const STATUSES = ["active", "inactive", "archived"] as const;

export function CreateStoreForm({
  divisions,
}: {
  divisions: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<StoreActionState, FormData>(
    createStoreAction,
    undefined,
  );

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add store
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">New store</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <StoreFields divisions={divisions} />
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Creating…" : "Create store"}
      </Button>
    </form>
  );
}

export function EditStoreForm({
  store,
  divisions,
}: {
  store: Store;
  divisions: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<StoreActionState, FormData>(
    updateStoreAction,
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
      <input type="hidden" name="storeId" value={store.id} />
      <StoreFields store={store} divisions={divisions} />
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

function StoreFields({
  store,
  divisions,
}: {
  store?: Store;
  divisions: { id: string; name: string }[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={store?.name ?? ""} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="divisionId">Division</Label>
        <select
          id="divisionId"
          name="divisionId"
          required
          defaultValue={store?.divisionId ?? ""}
          className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Choose…</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="platform">Platform</Label>
        <select
          id="platform"
          name="platform"
          defaultValue={store?.platform ?? "manual"}
          className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={store?.status ?? "active"}
          className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="url">Storefront URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          defaultValue={store?.url ?? ""}
          placeholder="https://"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sourceSystem">Source system</Label>
        <Input
          id="sourceSystem"
          name="sourceSystem"
          defaultValue={store?.sourceSystem ?? ""}
          placeholder="bigcommerce, amazon, manual…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="externalStoreId">External store ID</Label>
        <Input
          id="externalStoreId"
          name="externalStoreId"
          defaultValue={store?.externalStoreId ?? ""}
          placeholder="store_hash, marketplace_id…"
        />
      </div>
    </div>
  );
}
