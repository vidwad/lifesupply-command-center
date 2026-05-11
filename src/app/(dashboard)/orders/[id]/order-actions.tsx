"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  addNoteAction,
  resolveExceptionAction,
  updateOrderStatusAction,
  type OrderActionState,
} from "./actions";

const STATUS_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "processing", label: "Processing" },
  { value: "awaiting_supplier", label: "Awaiting supplier" },
  { value: "in_supplier_queue", label: "In supplier queue" },
  { value: "awaiting_human_review", label: "Awaiting human review" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const;

// -----------------------------------------------------------------------------

export function UpdateStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(
    updateOrderStatusAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="status"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            New status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={currentStatus}
            disabled={pending}
            className="h-9 min-w-[200px] rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Update"}
        </Button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}

// -----------------------------------------------------------------------------

export function ResolveExceptionForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(
    resolveExceptionAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="space-y-1">
        <label
          htmlFor="resolutionNote"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Resolution note
        </label>
        <textarea
          id="resolutionNote"
          name="resolutionNote"
          rows={2}
          required
          disabled={pending}
          placeholder="Describe how this was resolved…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Resolving…" : "Mark resolved"}
        </Button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}

// -----------------------------------------------------------------------------

export function AddNoteForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(
    addNoteAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <textarea
        name="text"
        rows={2}
        required
        disabled={pending}
        placeholder="Add an internal note for this order…"
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Add note"}
        </Button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}

// -----------------------------------------------------------------------------

function FormFeedback({ state }: { state: OrderActionState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p
        className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive"
        role="alert"
      >
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="text-xs text-success" role="status">
        {state.ok}
      </p>
    );
  }
  return null;
}
