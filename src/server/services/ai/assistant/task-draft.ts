/**
 * A task the assistant proposes (docs/43 Stage 4, 2026-11-06). Pure: the
 * shape the `draft_task` tool returns, as the drawer shows it and as the
 * tasks route accepts it when the person presses Create. Nothing here
 * writes; the existing task service creates the row under the person.
 */
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_ENTITY_TYPES = [
  "Order",
  "Customer",
  "Product",
  "Supplier",
  "Campaign",
  "Report",
] as const;
export type TaskEntityType = (typeof TASK_ENTITY_TYPES)[number];

export type TaskDraft = {
  title: string;
  description?: string;
  priority: TaskPriority;
  /** YYYY-MM-DD */
  dueDate?: string;
  relatedEntityType?: TaskEntityType;
  relatedEntityId?: string;
};

const str = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

/** Keeps a draft to the task schema's fields and sizes; null without a title. */
export function normaliseTaskDraft(raw: unknown): TaskDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title, 200);
  if (!title) return null;
  const draft: TaskDraft = {
    title,
    priority: (TASK_PRIORITIES as readonly string[]).includes(String(r.priority))
      ? (r.priority as TaskPriority)
      : "medium",
  };
  const description = str(r.description, 2000);
  if (description) draft.description = description;
  const dueDate = str(r.dueDate, 10);
  if (dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !Number.isNaN(Date.parse(dueDate))) {
    draft.dueDate = dueDate;
  }
  const type = str(r.relatedEntityType, 20);
  const id = str(r.relatedEntityId, 80);
  if (type && id && (TASK_ENTITY_TYPES as readonly string[]).includes(type)) {
    draft.relatedEntityType = type as TaskEntityType;
    draft.relatedEntityId = id;
  }
  return draft;
}

/** The drafts among a turn's tool calls: every draft_task that ran. */
export function draftsFromToolCalls(
  calls: { name: string; arguments: Record<string, unknown>; skipped?: string }[],
): TaskDraft[] {
  return calls
    .filter((c) => c.name === "draft_task" && !c.skipped)
    .map((c) => normaliseTaskDraft(c.arguments))
    .filter((d): d is TaskDraft => d !== null);
}
