import { type Prisma, type ApprovalStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type AdjustmentCategory =
  | "ebitda_addback"
  | "normalization"
  | "one_time"
  | "owner_compensation"
  | "other";

export const ADJUSTMENT_CATEGORIES: AdjustmentCategory[] = [
  "ebitda_addback",
  "normalization",
  "one_time",
  "owner_compensation",
  "other",
];

const INCLUDE = {
  financialPeriod: { select: { name: true, status: true, startDate: true } },
  division: { select: { name: true, code: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.FinancialAdjustmentInclude;

export type AdjustmentRow = {
  id: string;
  periodName: string;
  periodStatus: string;
  divisionName: string | null;
  divisionCode: string | null;
  category: AdjustmentCategory;
  accountKey: string | null;
  amount: string;
  currency: string;
  description: string;
  approvalStatus: ApprovalStatus;
  approvedByLabel: string | null;
  approvedAt: Date | null;
  createdByLabel: string | null;
  createdAt: Date;
};

function mapRow(
  r: Prisma.FinancialAdjustmentGetPayload<{ include: typeof INCLUDE }>,
): AdjustmentRow {
  return {
    id: r.id,
    periodName: r.financialPeriod.name,
    periodStatus: r.financialPeriod.status,
    divisionName: r.division?.name ?? null,
    divisionCode: r.division?.code ?? null,
    category: r.category as AdjustmentCategory,
    accountKey: r.accountKey,
    amount: r.amount.toString(),
    currency: r.currency,
    description: r.description,
    approvalStatus: r.approvalStatus,
    approvedByLabel: r.approvedBy?.name ?? r.approvedBy?.email ?? null,
    approvedAt: r.approvedAt,
    createdByLabel: r.createdBy?.name ?? r.createdBy?.email ?? null,
    createdAt: r.createdAt,
  };
}

export async function listAdjustments(filters: {
  periodId?: string;
  divisionId?: string;
} = {}): Promise<AdjustmentRow[]> {
  const rows = await prisma.financialAdjustment.findMany({
    where: {
      ...(filters.periodId ? { financialPeriodId: filters.periodId } : {}),
      ...(filters.divisionId ? { divisionId: filters.divisionId } : {}),
    },
    include: INCLUDE,
    orderBy: [{ financialPeriod: { startDate: "desc" } }, { createdAt: "desc" }],
    take: 500,
  });
  return rows.map(mapRow);
}

export type CreateAdjustmentInput = {
  financialPeriodId: string;
  divisionId?: string | null;
  category: AdjustmentCategory;
  accountKey?: string | null;
  amount: number;
  currency?: string;
  description: string;
};

export async function createAdjustment(
  input: CreateAdjustmentInput,
  actor: { id: string },
): Promise<string> {
  if (!input.description.trim()) throw new Error("A description is required.");
  if (!Number.isFinite(input.amount)) throw new Error("Amount must be a number.");

  const period = await prisma.financialPeriod.findUniqueOrThrow({
    where: { id: input.financialPeriodId },
    select: { status: true },
  });
  if (period.status === "approved") {
    throw new Error("This financial period is approved and cannot accept new adjustments.");
  }

  const row = await prisma.financialAdjustment.create({
    data: {
      financialPeriodId: input.financialPeriodId,
      divisionId: input.divisionId ?? null,
      category: input.category,
      accountKey: input.accountKey ?? null,
      amount: input.amount,
      currency: input.currency ?? "CAD",
      description: input.description.trim(),
      createdById: actor.id,
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "financial_adjustment.created",
    entityType: "financial_adjustment",
    entityId: row.id,
    afterData: {
      periodId: input.financialPeriodId,
      divisionId: input.divisionId,
      category: input.category,
      amount: input.amount,
    },
  });
  return row.id;
}

export async function approveAdjustment(
  id: string,
  actor: { id: string },
): Promise<void> {
  const before = await prisma.financialAdjustment.findUniqueOrThrow({
    where: { id },
    select: { approvalStatus: true, financialPeriod: { select: { status: true } } },
  });
  if (before.approvalStatus === "approved") return;
  if (before.financialPeriod.status === "approved") {
    throw new Error("Period is approved — adjustments cannot be changed.");
  }
  await prisma.financialAdjustment.update({
    where: { id },
    data: { approvalStatus: "approved", approvedById: actor.id, approvedAt: new Date() },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "financial_adjustment.approved",
    entityType: "financial_adjustment",
    entityId: id,
    beforeData: before,
    afterData: { approvalStatus: "approved" },
  });
}

export async function rejectAdjustment(
  id: string,
  reason: string,
  actor: { id: string },
): Promise<void> {
  if (!reason.trim()) throw new Error("A rejection reason is required.");
  const before = await prisma.financialAdjustment.findUniqueOrThrow({
    where: { id },
    select: { approvalStatus: true },
  });
  await prisma.financialAdjustment.update({
    where: { id },
    data: { approvalStatus: "rejected", approvedById: actor.id, approvedAt: new Date() },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "financial_adjustment.rejected",
    entityType: "financial_adjustment",
    entityId: id,
    beforeData: before,
    afterData: { approvalStatus: "rejected", reason },
  });
}

/**
 * Sum approved adjustments for a (period, division) pair, broken down by
 * category. Used by the financial dashboard to show normalized EBITDA.
 */
export async function getApprovedAdjustmentTotals(args: {
  financialPeriodId: string;
  divisionId?: string | null;
}): Promise<{ category: AdjustmentCategory; total: number }[]> {
  const rows = await prisma.financialAdjustment.groupBy({
    by: ["category"],
    where: {
      financialPeriodId: args.financialPeriodId,
      divisionId: args.divisionId ?? null,
      approvalStatus: "approved",
    },
    _sum: { amount: true },
  });
  return rows.map((r) => ({
    category: r.category as AdjustmentCategory,
    total: Number(r._sum.amount ?? 0),
  }));
}
