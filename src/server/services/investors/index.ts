import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type ListInvestorsFilters = {
  status?: string;
  search?: string;
};

export async function listInvestors(filters: ListInvestorsFilters = {}) {
  const where: Prisma.InvestorWhereInput = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { organization: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const investors = await prisma.investor.findMany({
    where,
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { interactions: true } },
      interactions: {
        orderBy: { interactionDate: "desc" },
        take: 1,
        select: { interactionDate: true },
      },
    },
  });

  return investors.map((i) => ({
    id: i.id,
    name: i.name,
    organization: i.organization,
    email: i.email,
    investorType: i.investorType,
    status: i.status,
    interactionCount: i._count.interactions,
    lastInteractionAt: i.interactions[0]?.interactionDate ?? null,
  }));
}

export type InvestorListRow = Awaited<ReturnType<typeof listInvestors>>[number];

export async function getInvestorById(id: string) {
  const investor = await prisma.investor.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { interactionDate: "desc" },
        include: { createdBy: { select: { name: true, email: true } } },
      },
    },
  });
  return investor;
}

export type InvestorDetail = NonNullable<Awaited<ReturnType<typeof getInvestorById>>>;
