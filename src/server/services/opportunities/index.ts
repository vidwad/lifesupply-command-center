import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

const num = (d: Prisma.Decimal | null | undefined): number | null => (d == null ? null : Number(d));

export type ListOpportunitiesFilters = {
  status?: string;
  opportunityType?: string;
  search?: string;
};

export async function listOpportunities(filters: ListOpportunitiesFilters = {}) {
  const where: Prisma.OpportunityWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.opportunityType) where.opportunityType = filters.opportunityType;
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { strategicRationale: { contains: q, mode: "insensitive" } },
    ];
  }

  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    include: {
      owner: { select: { id: true, name: true, email: true } },
      acquisitionTarget: { select: { companyName: true } },
    },
  });

  return opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    opportunityType: o.opportunityType,
    status: o.status,
    priority: o.priority,
    riskRating: o.riskRating,
    estimatedRevenueImpact: num(o.estimatedRevenueImpact),
    estimatedMarginImpact: num(o.estimatedMarginImpact),
    estimatedCost: num(o.estimatedCost),
    nextAction: o.nextAction,
    dueDate: o.dueDate,
    owner: o.owner,
    targetCompanyName: o.acquisitionTarget?.companyName ?? null,
  }));
}

export type OpportunityListRow = Awaited<ReturnType<typeof listOpportunities>>[number];

export async function getOpportunityById(id: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      acquisitionTarget: true,
    },
  });
  if (!opportunity) return null;
  return {
    ...opportunity,
    estimatedRevenueImpact: num(opportunity.estimatedRevenueImpact),
    estimatedMarginImpact: num(opportunity.estimatedMarginImpact),
    estimatedCost: num(opportunity.estimatedCost),
    acquisitionTarget: opportunity.acquisitionTarget
      ? {
          ...opportunity.acquisitionTarget,
          revenueEstimate: num(opportunity.acquisitionTarget.revenueEstimate),
          ebitdaEstimate: num(opportunity.acquisitionTarget.ebitdaEstimate),
        }
      : null,
  };
}

export type OpportunityDetail = NonNullable<Awaited<ReturnType<typeof getOpportunityById>>>;

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

const opportunityWriteSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  opportunityType: z.enum([
    "acquisition",
    "supplier",
    "financing",
    "marketing",
    "product",
    "operational",
    "technology",
    "partnership",
    "cost_reduction",
  ]),
  status: z
    .enum([
      "identified",
      "evaluating",
      "committed",
      "in_progress",
      "completed",
      "declined",
      "on_hold",
    ])
    .default("identified"),
  strategicRationale: z.string().max(4000).optional().nullable(),
  estimatedRevenueImpact: z.number().nullable().optional(),
  estimatedMarginImpact: z.number().nullable().optional(),
  estimatedCost: z.number().nullable().optional(),
  riskRating: z.enum(["low", "medium", "high"]).optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  ownerId: z.string().optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

function toDecimal(n: number | null | undefined, scale = 2): Prisma.Decimal | null {
  if (n == null) return null;
  return new Prisma.Decimal(n.toFixed(scale));
}

export async function createOpportunity(
  input: z.input<typeof opportunityWriteSchema> & { actorUserId: string },
) {
  const parsed = opportunityWriteSchema.parse(input);

  const opportunity = await prisma.opportunity.create({
    data: {
      title: parsed.title,
      opportunityType: parsed.opportunityType,
      status: parsed.status,
      strategicRationale: parsed.strategicRationale?.trim() || null,
      estimatedRevenueImpact: toDecimal(parsed.estimatedRevenueImpact, 2),
      estimatedMarginImpact: toDecimal(parsed.estimatedMarginImpact, 4),
      estimatedCost: toDecimal(parsed.estimatedCost, 2),
      riskRating: parsed.riskRating ?? null,
      priority: parsed.priority ?? null,
      ownerId: parsed.ownerId || input.actorUserId,
      nextAction: parsed.nextAction?.trim() || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    },
  });

  await writeAudit({
    actorUserId: input.actorUserId,
    action: "opportunity.create",
    entityType: "Opportunity",
    entityId: opportunity.id,
    afterData: {
      title: opportunity.title,
      opportunityType: opportunity.opportunityType,
      status: opportunity.status,
    },
  });
  revalidatePath("/opportunities");
  return opportunity;
}

export async function updateOpportunity(
  input: z.input<typeof opportunityWriteSchema> & {
    opportunityId: string;
    actorUserId: string;
  },
) {
  const parsed = opportunityWriteSchema.parse(input);
  const before = await prisma.opportunity.findUnique({
    where: { id: input.opportunityId },
    select: { id: true, title: true, status: true, opportunityType: true },
  });
  if (!before) throw new Error("Opportunity not found.");

  const opportunity = await prisma.opportunity.update({
    where: { id: input.opportunityId },
    data: {
      title: parsed.title,
      opportunityType: parsed.opportunityType,
      status: parsed.status,
      strategicRationale: parsed.strategicRationale?.trim() || null,
      estimatedRevenueImpact: toDecimal(parsed.estimatedRevenueImpact, 2),
      estimatedMarginImpact: toDecimal(parsed.estimatedMarginImpact, 4),
      estimatedCost: toDecimal(parsed.estimatedCost, 2),
      riskRating: parsed.riskRating ?? null,
      priority: parsed.priority ?? null,
      ownerId: parsed.ownerId || input.actorUserId,
      nextAction: parsed.nextAction?.trim() || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    },
  });

  await writeAudit({
    actorUserId: input.actorUserId,
    action: "opportunity.update",
    entityType: "Opportunity",
    entityId: opportunity.id,
    beforeData: { title: before.title, status: before.status, type: before.opportunityType },
    afterData: {
      title: opportunity.title,
      status: opportunity.status,
      type: opportunity.opportunityType,
    },
  });
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunity.id}`);
  return opportunity;
}
