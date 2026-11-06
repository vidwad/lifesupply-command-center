"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TaskDraft } from "@/server/services/ai/assistant/task-draft";

export const TASKS_ROUTE = "/api/ai/assistant/tasks";

type Created = { id: string; href: string; title: string };

/**
 * Tasks the assistant drafted (docs/43 Stage 4, 2026-11-06). The draft is
 * shown as the tool returned it; nothing exists until the person presses
 * Create, which posts to the tasks route and shows the link to the task.
 */
export function DraftCards({
  drafts,
  aiOutputId,
}: {
  drafts: TaskDraft[];
  aiOutputId: string | null;
}) {
  if (!drafts.length) return null;
  return (
    <ul className="space-y-2" aria-label="Task drafts">
      {drafts.map((draft, index) => (
        <DraftCard key={`${draft.title}-${index}`} draft={draft} aiOutputId={aiOutputId} />
      ))}
    </ul>
  );
}

function DraftCard({ draft, aiOutputId }: { draft: TaskDraft; aiOutputId: string | null }) {
  const [state, setState] = useState<
    | { status: "draft" }
    | { status: "creating" }
    | { status: "created"; task: Created }
    | { status: "error"; message: string }
  >({ status: "draft" });

  const create = async () => {
    setState({ status: "creating" });
    try {
      const res = await fetch(TASKS_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, aiOutputId }),
      });
      const json = (await res.json().catch(() => null)) as (Created & { error?: string }) | null;
      if (!res.ok || !json?.id)
        throw new Error(json?.error ?? `The task was not created (${res.status}).`);
      setState({ status: "created", task: json });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "The task was not created.",
      });
    }
  };

  const meta = [
    draft.priority,
    draft.dueDate ? `due ${draft.dueDate}` : null,
    draft.relatedEntityType
      ? `${draft.relatedEntityType.toLowerCase()} ${draft.relatedEntityId}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rounded-md border bg-background p-3 text-sm">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <ClipboardList className="h-3 w-3" aria-hidden="true" /> Task draft
      </p>
      <p className="mt-1 font-medium">{draft.title}</p>
      {draft.description && <p className="mt-1 text-muted-foreground">{draft.description}</p>}
      {meta && <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>}
      <div className="mt-2 flex items-center gap-2">
        {state.status === "created" ? (
          <a
            href={state.task.href}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Created
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={create}
            disabled={state.status === "creating"}
            aria-label={`Create task: ${draft.title}`}
          >
            {state.status === "creating" ? "Creating…" : "Create task"}
          </Button>
        )}
        {state.status === "error" && (
          <span role="alert" className="text-xs text-destructive">
            {state.message}
          </span>
        )}
      </div>
    </li>
  );
}
