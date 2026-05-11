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

const investorWriteSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
  organization: z.string().max(200).optional().nullable(),
  email: z.string().email("Invalid email.").optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  investorType: z
    .enum(["angel", "vc", "family_office", "lender", "strategic", "other"])
    .optional()
    .nullable(),
  status: z.enum(["prospect", "engaged", "committed", "declined", "closed"]).default("prospect"),
  notes: z.string().max(4000).optional().nullable(),
});

export async function createInvestor(
  input: z.input<typeof investorWriteSchema> & { actorUserId: string },
) {
  const parsed = investorWriteSchema.parse(input);
  const investor = await prisma.investor.create({
    data: {
      name: parsed.name,
      organization: parsed.organization?.trim() || null,
      email: parsed.email?.trim() || null,
      phone: parsed.phone?.trim() || null,
      investorType: parsed.investorType ?? null,
      status: parsed.status,
      notes: parsed.notes?.trim() || null,
    },
  });
  await writeAudit({
    actorUserId: input.actorUserId,
    action: "investor.create",
    entityType: "Investor",
    entityId: investor.id,
    afterData: { name: investor.name, status: investor.status },
  });
  revalidatePath("/investors");
  return investor;
}

export async function updateInvestor(
  input: z.input<typeof investorWriteSchema> & { investorId: string; actorUserId: string },
) {
  const parsed = investorWriteSchema.parse(input);
  const before = await prisma.investor.findUnique({
    where: { id: input.investorId },
    select: { id: true, name: true, status: true },
  });
  if (!before) throw new Error("Investor not found.");

  const investor = await prisma.investor.update({
    where: { id: input.investorId },
    data: {
      name: parsed.name,
      organization: parsed.organization?.trim() || null,
      email: parsed.email?.trim() || null,
      phone: parsed.phone?.trim() || null,
      investorType: parsed.investorType ?? null,
      status: parsed.status,
      notes: parsed.notes?.trim() || null,
    },
  });
  await writeAudit({
    actorUserId: input.actorUserId,
    action: "investor.update",
    entityType: "Investor",
    entityId: investor.id,
    beforeData: { name: before.name, status: before.status },
    afterData: { name: investor.name, status: investor.status },
  });
  revalidatePath("/investors");
  revalidatePath(`/investors/${investor.id}`);
  return investor;
}

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
