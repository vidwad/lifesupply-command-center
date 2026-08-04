/**
 * Exception → task routing (Phase 8 — docs/17 §6 "Task assignment from
 * exceptions"). Turns an exception into an actionable, assigned task with
 * full origin attribution (sourceType "exception" + sourceId), and moves the
 * exception to `investigating` so the queues reflect that someone owns it.
 *
 * Duplicate-safe: an exception that already has an active task is skipped,
 * so the bulk action can be re-run without flooding the task list.
 */
import type { ExceptionSeverity } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { createTask } from "@/server/services/tasks";

/** Bounded so "select all" can't create hundreds of tasks in one click. */
export const BULK_TASK_CAP = 20;

const PRIORITY_BY_SEVERITY: Record<ExceptionSeverity, "low" | "medium" | "high" | "urgent"> = {
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "urgent",
};

/** Exception.entityType values (lowercase) → Task relatedEntityType enum. */
const TASK_ENTITY_BY_EXCEPTION_ENTITY: Record<
  string,
  "Order" | "Customer" | "Product" | "Supplier"
> = {
  order: "Order",
  customer: "Customer",
  product: "Product",
  supplier: "Supplier",
};

export type ExceptionTaskDraft = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  relatedEntityType: "Order" | "Customer" | "Product" | "Supplier" | null;
  relatedEntityId: string | null;
};

/** Pure mapping — exported for tests. */
export function buildTaskDraftFromException(ex: {
  id: string;
  title: string;
  description: string | null;
  severity: ExceptionSeverity;
  entityType: string | null;
  entityId: string | null;
}): ExceptionTaskDraft {
  const relatedType = ex.entityType
    ? (TASK_ENTITY_BY_EXCEPTION_ENTITY[ex.entityType] ?? null)
    : null;
  const title = `Resolve exception: ${ex.title}`.slice(0, 200);
  const description = [
    ex.description?.trim() || null,
    `Created from exception ${ex.id}. Resolve the underlying issue, then mark the exception resolved in /operations/exceptions.`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 2000);
  return {
    title,
    description,
    priority: PRIORITY_BY_SEVERITY[ex.severity],
    relatedEntityType: relatedType,
    relatedEntityId: relatedType ? ex.entityId : null,
  };
}

export type CreateFromExceptionResult = {
  exceptionId: string;
  taskId: string | null;
  created: boolean;
  reason?: string;
};

export async function createTaskFromException(args: {
  exceptionId: string;
  actorUserId: string;
  assignedToId?: string | null;
}): Promise<CreateFromExceptionResult> {
  const ex = await prisma.exception.findUnique({
    where: { id: args.exceptionId },
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      status: true,
      entityType: true,
      entityId: true,
      recurringKey: true,
    },
  });
  if (!ex)
    return { exceptionId: args.exceptionId, taskId: null, created: false, reason: "not_found" };
  if (ex.status === "resolved" || ex.status === "dismissed") {
    return { exceptionId: ex.id, taskId: null, created: false, reason: "already_closed" };
  }

  const existing = await prisma.task.findFirst({
    where: {
      sourceType: "exception",
      sourceId: ex.id,
      status: { in: ["open", "in_progress", "blocked", "awaiting_approval"] },
    },
    select: { id: true },
  });
  if (existing) {
    return { exceptionId: ex.id, taskId: existing.id, created: false, reason: "task_exists" };
  }

  const draft = buildTaskDraftFromException(ex);
  const task = await createTask({
    ...draft,
    createdById: args.actorUserId,
    assignedToId: args.assignedToId ?? args.actorUserId,
    sourceType: "exception",
    sourceId: ex.id,
    metadata: {
      exceptionId: ex.id,
      recurringKey: ex.recurringKey,
      exceptionEntityType: ex.entityType,
      exceptionEntityId: ex.entityId,
    },
  });

  // Someone now owns it — move an untouched exception to investigating.
  if (ex.status === "open") {
    await prisma.exception.update({
      where: { id: ex.id },
      data: { status: "investigating", assignedToId: args.assignedToId ?? args.actorUserId },
    });
  }
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "exception.task_created",
    entityType: "exception",
    entityId: ex.id,
    afterData: { taskId: task.id, assignedToId: args.assignedToId ?? args.actorUserId },
  });
  return { exceptionId: ex.id, taskId: task.id, created: true };
}

export async function bulkCreateTasksFromExceptions(args: {
  exceptionIds: string[];
  actorUserId: string;
  assignedToId?: string | null;
}): Promise<{
  created: number;
  skipped: number;
  capped: boolean;
  results: CreateFromExceptionResult[];
}> {
  const ids = [...new Set(args.exceptionIds)];
  const capped = ids.length > BULK_TASK_CAP;
  const slice = ids.slice(0, BULK_TASK_CAP);

  const results: CreateFromExceptionResult[] = [];
  for (const exceptionId of slice) {
    results.push(
      await createTaskFromException({
        exceptionId,
        actorUserId: args.actorUserId,
        assignedToId: args.assignedToId,
      }),
    );
  }
  return {
    created: results.filter((r) => r.created).length,
    skipped: results.filter((r) => !r.created).length,
    capped,
    results,
  };
}
