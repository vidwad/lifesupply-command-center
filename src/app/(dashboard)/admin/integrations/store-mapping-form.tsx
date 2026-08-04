"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { setStoreMappingAction, type FieldActionState } from "./actions";

type StoreOption = { id: string; name: string };

type Props = {
  integrationId: string;
  currentStoreId: string | null;
  stores: StoreOption[];
};

export function StoreMappingForm({ integrationId, currentStoreId, stores }: Props) {
  const [state, formAction, pending] = useActionState<FieldActionState, FormData>(
    setStoreMappingAction,
    undefined,
  );

  return (
    <div className="space-y-1.5">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="integrationId" value={integrationId} />
        <select
          name="storeId"
          defaultValue={currentStoreId ?? ""}
          disabled={pending}
          className="h-9 min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">— Not mapped —</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save mapping"}
        </Button>
      </form>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-xs text-success">{state.ok}</p>}
      {stores.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No BigCommerce stores exist yet. Create one under{" "}
          <span className="font-medium">Admin → Stores</span> first.
        </p>
      )}
    </div>
  );
}
