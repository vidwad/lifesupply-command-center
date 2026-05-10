"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createTaskAction, type TaskFormState } from "../actions";

type Props = {
  assignableUsers: { id: string; name: string | null; email: string }[];
  defaults: { title: string; relatedEntityType: string; relatedEntityId: string };
};

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const ENTITY_TYPES = [
  { value: "", label: "— None —" },
  { value: "Order", label: "Order" },
  { value: "Customer", label: "Customer" },
  { value: "Product", label: "Product" },
  { value: "Supplier", label: "Supplier" },
  { value: "Campaign", label: "Campaign" },
  { value: "Report", label: "Report" },
];

export function NewTaskForm({ assignableUsers, defaults }: Props) {
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(
    createTaskAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults.title}
          placeholder="e.g. Reroute LS-1032 to BBM01"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What needs to happen and why?"
          disabled={pending}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" disabled={pending} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedToId">Assigned to</Label>
        <select
          id="assignedToId"
          name="assignedToId"
          disabled={pending}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— Assign to me —</option>
          {assignableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="relatedEntityType">Related entity type</Label>
          <select
            id="relatedEntityType"
            name="relatedEntityType"
            defaultValue={defaults.relatedEntityType}
            disabled={pending}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ENTITY_TYPES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="relatedEntityId">Related entity ID</Label>
          <Input
            id="relatedEntityId"
            name="relatedEntityId"
            defaultValue={defaults.relatedEntityId}
            placeholder="cuid…"
            disabled={pending}
          />
        </div>
      </div>

      {state?.error && (
        <p
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
