import type { Prisma } from "@prisma/client";

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
