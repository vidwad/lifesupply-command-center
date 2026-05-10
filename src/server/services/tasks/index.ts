import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

// -----------------------------------------------------------------------------
// Lists
// -----------------------------------------------------------------------------

export type TaskListView =
  | "all"
  | "my"
  | "overdue"
  | "high_priority"
  | "awaiting_approval"
  | "completed";

export type ListTasksFilters = {
  view?: TaskListView;
  search?: string;
  /** Used by the "my tasks" view; ignored otherwise. */
  currentUserId?: string;
};

const ACTIVE_STATUSES: TaskStatus[] = ["open", "in_progress", "blocked", "awaiting_approval"];

export async function listTasks(filters: ListTasksFilters = {}) {
  const view = filters.view ?? "all";
  const where: Prisma.TaskWhereInput = {};
  const now = new Date();

  switch (view) {
    case "my":
      where.assignedToId = filters.currentUserId;
      where.status = { in: ACTIVE_STATUSES };
      break;
    case "overdue":
      where.dueDate = { lt: now };
      where.status = { in: ACTIVE_STATUSES };
      break;
    case "high_priority":
      where.priority = { in: ["high", "urgent"] };
      where.status = { in: ACTIVE_STATUSES };
      break;
    case "awaiting_approval":
      where.status = "awaiting_approval";
      break;
    case "completed":
      where.status = "completed";
      break;
    case "all":
    default:
      where.status = { in: ACTIVE_STATUSES };
      break;
  }

  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [
      // Active first, then by priority desc, then due date asc
      { status: "asc" },
      { priority: "desc" },
      { dueDate: "asc" },
    ],
    take: 100,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return tasks.map((t) => ({
    ...t,
    isOverdue: t.dueDate != null && t.dueDate < now && t.status !== "completed",
  }));
}

export type TaskListRow = Awaited<ReturnType<typeof listTasks>>[number];

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!task) return null;

  // Resolve the related entity name (order # / customer name / product name).
  let relatedEntityLabel: string | null = null;
  let relatedEntityHref: string | null = null;
  if (task.relatedEntityType && task.relatedEntityId) {
    const entityId = task.relatedEntityId;
    switch (task.relatedEntityType) {
      case "Order": {
        const order = await prisma.order.findUnique({
          where: { id: entityId },
          select: { orderNumber: true },
        });
        if (order) {
          relatedEntityLabel = `Order ${order.orderNumber}`;
          relatedEntityHref = `/orders/${entityId}`;
        }
        break;
      }
      case "Customer": {
        const customer = await prisma.customer.findUnique({
          where: { id: entityId },
          select: { firstName: true, lastName: true, companyName: true, email: true },
        });
        if (customer) {
          relatedEntityLabel =
            customer.companyName ??
            [customer.firstName, customer.lastName].filter(Boolean).join(" ") ??
            customer.email ??
            "Customer";
          relatedEntityHref = `/customers/${entityId}`;
        }
        break;
      }
      case "Product": {
        const product = await prisma.product.findUnique({
          where: { id: entityId },
          select: { name: true },
        });
        if (product) {
          relatedEntityLabel = product.name;
          relatedEntityHref = `/products/${entityId}`;
        }
        break;
      }
    }
  }

  const now = new Date();
  return {
    ...task,
    isOverdue: task.dueDate != null && task.dueDate < now && task.status !== "completed",
    relatedEntityLabel,
    relatedEntityHref,
  };
}

export type TaskDetail = NonNullable<Awaited<ReturnType<typeof getTaskById>>>;

// -----------------------------------------------------------------------------
// Mutations — server actions called from forms
// -----------------------------------------------------------------------------

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z
    .enum(["open", "in_progress", "blocked", "awaiting_approval", "completed", "cancelled"])
    .default("open"),
  dueDate: z.string().optional().nullable(),
  relatedEntityType: z
    .enum(["Order", "Customer", "Product", "Supplier", "Campaign", "Report"])
    .optional()
    .nullable(),
  relatedEntityId: z.string().optional().nullable(),
});

export type CreateTaskInput = z.input<typeof createTaskSchema> & {
  createdById: string;
  assignedToId?: string | null;
};

export async function createTask(input: CreateTaskInput) {
  const parsed = createTaskSchema.parse(input);

  const dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;

  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      description: parsed.description ?? null,
      priority: parsed.priority as TaskPriority,
      status: parsed.status as TaskStatus,
      dueDate,
      relatedEntityType: parsed.relatedEntityType ?? null,
      relatedEntityId: parsed.relatedEntityId ?? null,
      sourceType: "manual",
      assignedToId: input.assignedToId ?? input.createdById,
      createdById: input.createdById,
    },
  });

  await writeAudit({
    actorUserId: input.createdById,
    action: "task.create",
    entityType: "Task",
    entityId: task.id,
    afterData: {
      title: task.title,
      priority: task.priority,
      status: task.status,
      relatedEntityType: task.relatedEntityType,
      relatedEntityId: task.relatedEntityId,
    },
  });

  revalidatePath("/tasks");
  if (task.relatedEntityType === "Order" && task.relatedEntityId) {
    revalidatePath(`/orders/${task.relatedEntityId}`);
  }

  return task;
}

const updateStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["open", "in_progress", "blocked", "awaiting_approval", "completed", "cancelled"]),
  actorUserId: z.string().min(1),
});

export async function updateTaskStatus(input: z.input<typeof updateStatusSchema>) {
  const parsed = updateStatusSchema.parse(input);

  const before = await prisma.task.findUnique({
    where: { id: parsed.taskId },
    select: { id: true, status: true, relatedEntityType: true, relatedEntityId: true },
  });
  if (!before) throw new Error("Task not found");

  const completedAt = parsed.status === "completed" ? new Date() : null;
  const task = await prisma.task.update({
    where: { id: parsed.taskId },
    data: { status: parsed.status as TaskStatus, completedAt },
  });

  await writeAudit({
    actorUserId: parsed.actorUserId,
    action: "task.status_change",
    entityType: "Task",
    entityId: task.id,
    beforeData: { status: before.status },
    afterData: { status: task.status },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);
  if (before.relatedEntityType === "Order" && before.relatedEntityId) {
    revalidatePath(`/orders/${before.relatedEntityId}`);
  }
  return task;
}

const assignSchema = z.object({
  taskId: z.string().min(1),
  assignedToId: z.string().min(1).nullable(),
  actorUserId: z.string().min(1),
});

export async function assignTask(input: z.input<typeof assignSchema>) {
  const parsed = assignSchema.parse(input);

  const before = await prisma.task.findUnique({
    where: { id: parsed.taskId },
    select: { assignedToId: true },
  });
  if (!before) throw new Error("Task not found");

  const task = await prisma.task.update({
    where: { id: parsed.taskId },
    data: { assignedToId: parsed.assignedToId },
  });

  await writeAudit({
    actorUserId: parsed.actorUserId,
    action: "task.assign",
    entityType: "Task",
    entityId: task.id,
    beforeData: { assignedToId: before.assignedToId },
    afterData: { assignedToId: task.assignedToId },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);
  return task;
}

// -----------------------------------------------------------------------------
// Counts for tab badges
// -----------------------------------------------------------------------------

export async function getTaskCounts(currentUserId: string) {
  const now = new Date();
  const [active, mine, overdue, highPriority, awaitingApproval] = await Promise.all([
    prisma.task.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.task.count({
      where: { assignedToId: currentUserId, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.task.count({
      where: { dueDate: { lt: now }, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.task.count({
      where: { priority: { in: ["high", "urgent"] }, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.task.count({ where: { status: "awaiting_approval" } }),
  ]);
  return { active, mine, overdue, highPriority, awaitingApproval };
}

// -----------------------------------------------------------------------------
// Assignable users (for select dropdowns)
// -----------------------------------------------------------------------------

export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}
