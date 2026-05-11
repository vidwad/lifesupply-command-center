import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
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

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

const interactionSchema = z.object({
  investorId: z.string().min(1),
  interactionType: z.enum(["meeting", "email", "call", "document_shared"]),
  interactionDate: z.string().min(1),
  summary: z.string().max(2000).optional(),
  nextAction: z.string().max(500).optional(),
  actorUserId: z.string().min(1),
});

export async function logInvestorInteraction(input: z.input<typeof interactionSchema>) {
  const parsed = interactionSchema.parse(input);

  const investor = await prisma.investor.findUnique({
    where: { id: parsed.investorId },
    select: { id: true, name: true },
  });
  if (!investor) throw new Error("Investor not found.");

  const interaction = await prisma.investorInteraction.create({
    data: {
      investorId: parsed.investorId,
      interactionType: parsed.interactionType,
      interactionDate: new Date(parsed.interactionDate),
      summary: parsed.summary?.trim() || null,
      nextAction: parsed.nextAction?.trim() || null,
      createdById: parsed.actorUserId,
    },
  });

  await writeAudit({
    actorUserId: parsed.actorUserId,
    action: "investor.interaction_logged",
    entityType: "InvestorInteraction",
    entityId: interaction.id,
    afterData: {
      investorName: investor.name,
      interactionType: parsed.interactionType,
      hasNextAction: !!parsed.nextAction?.trim(),
    },
  });

  revalidatePath(`/investors/${parsed.investorId}`);
  revalidatePath("/investors");
  return interaction;
}
