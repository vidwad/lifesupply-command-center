import { type Prisma, type CapitalRaiseStatus, type CommitmentStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

const RAISE_INCLUDE = {
  owner: { select: { id: true, name: true, email: true } },
  commitments: {
    include: {
      investor: { select: { id: true, name: true, organization: true, status: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  },
} satisfies Prisma.CapitalRaiseInclude;

export type CapitalRaiseDetail = Prisma.CapitalRaiseGetPayload<{ include: typeof RAISE_INCLUDE }>;

export async function listCapitalRaises(filters: {
  status?: CapitalRaiseStatus;
} = {}): Promise<
  (Prisma.CapitalRaiseGetPayload<object> & {
    committedAmount: number;
    fundedAmount: number;
    softAmount: number;
    commitmentCount: number;
  })[]
> {
  const rows = await prisma.capitalRaise.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    orderBy: [{ openedAt: "desc" }, { createdAt: "desc" }],
    include: { commitments: true },
  });
  return rows.map((r) => {
    const totals = r.commitments.reduce(
      (acc, c) => {
        const amt = Number(c.amount);
        if (c.status === "soft") acc.soft += amt;
        if (c.status === "signed") acc.committed += amt;
        if (c.status === "funded") {
          acc.funded += amt;
          acc.committed += amt;
        }
        return acc;
      },
      { soft: 0, committed: 0, funded: 0 },
    );
    const { commitments: _commitments, ...rest } = r;
    void _commitments;
    return {
      ...rest,
      committedAmount: totals.committed,
      fundedAmount: totals.funded,
      softAmount: totals.soft,
      commitmentCount: r.commitments.length,
    };
  });
}

export async function getCapitalRaise(id: string): Promise<CapitalRaiseDetail | null> {
  return prisma.capitalRaise.findUnique({ where: { id }, include: RAISE_INCLUDE });
}

export type CreateCapitalRaiseInput = {
  name: string;
  roundType: string;
  targetAmount: number;
  preMoneyValuation?: number | null;
  description?: string | null;
};

export async function createCapitalRaise(
  input: CreateCapitalRaiseInput,
  actor: { id: string },
): Promise<string> {
  if (!input.name.trim()) throw new Error("Round name is required.");
  if (!input.roundType.trim()) throw new Error("Round type is required.");
  if (!Number.isFinite(input.targetAmount) || input.targetAmount <= 0) {
    throw new Error("Target amount must be a positive number.");
  }
  const created = await prisma.capitalRaise.create({
    data: {
      name: input.name.trim(),
      roundType: input.roundType.trim(),
      targetAmount: input.targetAmount,
      preMoneyValuation: input.preMoneyValuation ?? null,
      description: input.description?.trim() || null,
      ownerId: actor.id,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "capital_raise.created",
    entityType: "capital_raise",
    entityId: created.id,
    afterData: {
      name: created.name,
      roundType: created.roundType,
      targetAmount: input.targetAmount,
    },
  });
  return created.id;
}

export async function setCapitalRaiseStatus(
  id: string,
  status: CapitalRaiseStatus,
  actor: { id: string },
): Promise<void> {
  const before = await prisma.capitalRaise.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  });
  if (before.status === status) return;

  const updates: Prisma.CapitalRaiseUpdateInput = { status };
  if (status === "open" && before.status === "planning") updates.openedAt = new Date();
  if (status === "closed" || status === "cancelled") updates.closedAt = new Date();

  await prisma.capitalRaise.update({ where: { id }, data: updates });
  await writeAudit({
    actorUserId: actor.id,
    action: `capital_raise.${status}`,
    entityType: "capital_raise",
    entityId: id,
    beforeData: before,
    afterData: { status },
  });
}

// ---------------------------------------------------------------------------
// Commitments
// ---------------------------------------------------------------------------

export type CreateCommitmentInput = {
  capitalRaiseId: string;
  investorId?: string | null;
  investorLabel?: string | null;
  amount: number;
  status?: CommitmentStatus;
  effectiveAt?: Date | null;
  notes?: string | null;
};

export async function createCommitment(
  input: CreateCommitmentInput,
  actor: { id: string },
): Promise<string> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Commitment amount must be a positive number.");
  }
  if (!input.investorId && !input.investorLabel?.trim()) {
    throw new Error("Pick an investor or enter an investor label.");
  }
  const created = await prisma.capitalRaiseCommitment.create({
    data: {
      capitalRaiseId: input.capitalRaiseId,
      investorId: input.investorId ?? null,
      investorLabel: input.investorLabel?.trim() || null,
      amount: input.amount,
      status: input.status ?? "soft",
      effectiveAt: input.effectiveAt ?? null,
      notes: input.notes?.trim() || null,
      createdById: actor.id,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "capital_commitment.created",
    entityType: "capital_raise_commitment",
    entityId: created.id,
    afterData: {
      capitalRaiseId: input.capitalRaiseId,
      amount: input.amount,
      status: created.status,
      investorId: input.investorId,
    },
  });
  return created.id;
}

export async function setCommitmentStatus(
  id: string,
  status: CommitmentStatus,
  actor: { id: string },
): Promise<void> {
  const before = await prisma.capitalRaiseCommitment.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  });
  if (before.status === status) return;
  await prisma.capitalRaiseCommitment.update({
    where: { id },
    data: {
      status,
      effectiveAt: status === "funded" || status === "signed" ? new Date() : undefined,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: `capital_commitment.${status}`,
    entityType: "capital_raise_commitment",
    entityId: id,
    beforeData: before,
    afterData: { status },
  });
}
