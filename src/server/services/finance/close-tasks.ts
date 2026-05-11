import { type Prisma, type MonthlyCloseStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

/**
 * Standard monthly close-task template. Used to bootstrap a period's
 * checklist; per-period rows can then be added/edited freely.
 *
 * Order matters — sortOrder follows the array index.
 */
const STANDARD_TASKS: { key: string; title: string; description?: string }[] = [
  { key: "bigcommerce_sync_review", title: "Verify BigCommerce sync totals tie to source store" },
  { key: "quickbooks_pnl_import", title: "Import QuickBooks P&L for the period" },
  { key: "bank_reconciliation", title: "Bank reconciliation complete in QuickBooks" },
  { key: "ar_aging_review", title: "Review AR aging — flag any 60+ day balances" },
  { key: "ap_aging_review", title: "Review AP aging — confirm cutoff" },
  { key: "inventory_count", title: "Confirm inventory count + COGS provisions" },
  { key: "supplier_cost_review", title: "Review supplier cost changes since last close" },
  { key: "ebitda_adjustments", title: "Enter EBITDA adjustments + addbacks" },
  { key: "budget_variance_review", title: "Review budget vs actual variances" },
  { key: "management_report_draft", title: "Draft monthly management report (AI commentary)" },
  { key: "management_report_review", title: "Owner / Finance Manager reviews + approves report" },
  { key: "period_close", title: "Mark financial period as approved" },
];

const INCLUDE = {
  financialPeriod: { select: { name: true, status: true } },
  division: { select: { name: true } },
  owner: { select: { id: true, name: true, email: true } },
  completedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.MonthlyCloseTaskInclude;

export type CloseTaskRow = {
  id: string;
  taskKey: string;
  title: string;
  description: string | null;
  periodName: string;
  periodStatus: string;
  divisionName: string | null;
  status: MonthlyCloseStatus;
  dueDate: Date | null;
  ownerLabel: string | null;
  ownerId: string | null;
  completedAt: Date | null;
  completedByLabel: string | null;
  notes: string | null;
  sortOrder: number;
};

function mapRow(
  r: Prisma.MonthlyCloseTaskGetPayload<{ include: typeof INCLUDE }>,
): CloseTaskRow {
  return {
    id: r.id,
    taskKey: r.taskKey,
    title: r.title,
    description: r.description,
    periodName: r.financialPeriod.name,
    periodStatus: r.financialPeriod.status,
    divisionName: r.division?.name ?? null,
    status: r.status,
    dueDate: r.dueDate,
    ownerLabel: r.owner?.name ?? r.owner?.email ?? null,
    ownerId: r.ownerId,
    completedAt: r.completedAt,
    completedByLabel: r.completedBy?.name ?? r.completedBy?.email ?? null,
    notes: r.notes,
    sortOrder: r.sortOrder,
  };
}

/**
 * Idempotently materialize the standard checklist for a period. Returns
 * the full row list afterwards. Existing rows are not changed.
 */
export async function seedCloseChecklist(args: {
  financialPeriodId: string;
  divisionId?: string | null;
  actor: { id: string };
}): Promise<CloseTaskRow[]> {
  let inserted = 0;
  for (const [index, task] of STANDARD_TASKS.entries()) {
    const existing = await prisma.monthlyCloseTask.findFirst({
      where: {
        financialPeriodId: args.financialPeriodId,
        divisionId: args.divisionId ?? null,
        taskKey: task.key,
      },
    });
    if (existing) continue;
    await prisma.monthlyCloseTask.create({
      data: {
        financialPeriodId: args.financialPeriodId,
        divisionId: args.divisionId ?? null,
        taskKey: task.key,
        title: task.title,
        description: task.description ?? null,
        sortOrder: index,
      },
    });
    inserted++;
  }
  if (inserted > 0) {
    await writeAudit({
      actorUserId: args.actor.id,
      action: "close_checklist.seeded",
      entityType: "financial_period",
      entityId: args.financialPeriodId,
      afterData: { divisionId: args.divisionId ?? null, inserted },
    });
  }
  return listCloseTasks({
    financialPeriodId: args.financialPeriodId,
    divisionId: args.divisionId ?? null,
  });
}

export async function listCloseTasks(filters: {
  financialPeriodId?: string;
  divisionId?: string | null;
  status?: MonthlyCloseStatus;
  ownerId?: string;
} = {}): Promise<CloseTaskRow[]> {
  const where: Prisma.MonthlyCloseTaskWhereInput = {};
  if (filters.financialPeriodId) where.financialPeriodId = filters.financialPeriodId;
  if (filters.divisionId !== undefined) where.divisionId = filters.divisionId;
  if (filters.status) where.status = filters.status;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  const rows = await prisma.monthlyCloseTask.findMany({
    where,
    include: INCLUDE,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 500,
  });
  return rows.map(mapRow);
}

export async function setCloseTaskStatus(
  id: string,
  status: MonthlyCloseStatus,
  actor: { id: string },
  notes?: string | null,
): Promise<void> {
  const before = await prisma.monthlyCloseTask.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  });
  if (before.status === status && !notes) return;

  const isCompletion = status === "done" || status === "skipped";
  await prisma.monthlyCloseTask.update({
    where: { id },
    data: {
      status,
      notes: notes ?? undefined,
      completedById: isCompletion ? actor.id : null,
      completedAt: isCompletion ? new Date() : null,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: `close_task.${status}`,
    entityType: "monthly_close_task",
    entityId: id,
    beforeData: { status: before.status },
    afterData: { status, notes: notes ?? null },
  });
}

export async function assignCloseTask(
  id: string,
  ownerId: string | null,
  actor: { id: string },
): Promise<void> {
  const before = await prisma.monthlyCloseTask.findUniqueOrThrow({
    where: { id },
    select: { ownerId: true },
  });
  await prisma.monthlyCloseTask.update({ where: { id }, data: { ownerId } });
  await writeAudit({
    actorUserId: actor.id,
    action: "close_task.assigned",
    entityType: "monthly_close_task",
    entityId: id,
    beforeData: before,
    afterData: { ownerId },
  });
}

export async function closeChecklistSummary(
  financialPeriodId: string,
): Promise<{ total: number; done: number; blocked: number; remaining: number }> {
  const rows = await prisma.monthlyCloseTask.groupBy({
    by: ["status"],
    where: { financialPeriodId },
    _count: { _all: true },
  });
  let total = 0;
  let done = 0;
  let blocked = 0;
  for (const r of rows) {
    total += r._count._all;
    if (r.status === "done" || r.status === "skipped") done += r._count._all;
    if (r.status === "blocked") blocked += r._count._all;
  }
  return { total, done, blocked, remaining: total - done };
}
