import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type DivisionRow = {
  id: string;
  name: string;
  code: string;
  type: string | null;
  jurisdiction: string | null;
  parentDivisionId: string | null;
  parentDivisionName: string | null;
  isActive: boolean;
  storeCount: number;
};

const DIVISION_TYPES = ["operating", "holding", "geographic", "consolidated"] as const;
export type DivisionType = (typeof DIVISION_TYPES)[number];
export const DIVISION_TYPE_OPTIONS = DIVISION_TYPES;

export async function listDivisions(): Promise<DivisionRow[]> {
  const divisions = await prisma.division.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      parentDivision: { select: { name: true } },
      _count: { select: { stores: true } },
    },
  });
  return divisions.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    type: d.type,
    jurisdiction: d.jurisdiction,
    parentDivisionId: d.parentDivisionId,
    parentDivisionName: d.parentDivision?.name ?? null,
    isActive: d.isActive,
    storeCount: d._count.stores,
  }));
}

export type DivisionInput = {
  name: string;
  code: string;
  type?: string | null;
  jurisdiction?: string | null;
  parentDivisionId?: string | null;
  isActive: boolean;
};

export async function createDivision(input: DivisionInput, actor: { id: string }) {
  const data = normalize(input);
  const created = await prisma.division.create({ data });
  await writeAudit({
    actorUserId: actor.id,
    action: "division.created",
    entityType: "division",
    entityId: created.id,
    afterData: data,
  });
  return created;
}

export async function updateDivision(id: string, input: DivisionInput, actor: { id: string }) {
  const before = await prisma.division.findUniqueOrThrow({
    where: { id },
    select: {
      name: true,
      code: true,
      type: true,
      jurisdiction: true,
      parentDivisionId: true,
      isActive: true,
    },
  });
  if (input.parentDivisionId === id) throw new Error("A division cannot be its own parent.");
  const data = normalize(input);
  await prisma.division.update({ where: { id }, data });
  await writeAudit({
    actorUserId: actor.id,
    action: "division.updated",
    entityType: "division",
    entityId: id,
    beforeData: before,
    afterData: data,
  });
}

function normalize(input: DivisionInput) {
  return {
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    type: input.type?.trim() || null,
    jurisdiction: input.jurisdiction?.trim() || null,
    parentDivisionId: input.parentDivisionId || null,
    isActive: input.isActive,
  };
}
