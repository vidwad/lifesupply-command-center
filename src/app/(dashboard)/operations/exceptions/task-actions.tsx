"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  bulkCreateTasksAction,
  createTaskFromExceptionAction,
  type ExceptionActionState,
} from "./actions";

/** Per-row "Create task" button. */
export function CreateTaskButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<ExceptionActionState, FormData>(
    createTaskFromExceptionAction,
    undefined,
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Creating…" : "Create task"}
      </Button>
      {state?.error && <p className="mt-1 text-[10px] text-destructive">{state.error}</p>}
      {state?.ok && <p className="mt-1 text-[10px] text-success">{state.ok}</p>}
    </form>
  );
}

/**
 * Bulk bar. The row checkboxes live inside the server-rendered table and
 * point here via the HTML `form` attribute (form="bulk-task-form"), so the
 * table itself stays a server component.
 */
export function BulkTaskBar() {
  const [state, formAction, pending] = useActionState<ExceptionActionState, FormData>(
    bulkCreateTasksAction,
    undefined,
  );
  return (
    <form
      id="bulk-task-form"
      action={formAction}
      className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-3 py-2"
    >
      <p className="text-xs text-muted-foreground">
        Select exceptions below, then create one task per exception (max 20 per run; closed or
        already-tasked exceptions are skipped).
      </p>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create tasks for selected"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.ok && (
        <p className="text-xs text-success">
          {state.ok}{" "}
          <Link href="/tasks" className="text-primary hover:underline">
            View tasks →
          </Link>
        </p>
      )}
    </form>
  );
}
