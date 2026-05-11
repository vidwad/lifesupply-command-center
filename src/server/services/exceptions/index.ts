import {
  type ExceptionSeverity,
  type ExceptionState,
  type ExceptionType,
  Prisma,
} from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type ExceptionRow = {
  id: string;
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionState;
  title: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  recurringKey: string | null;
  source: string | null;
  ageHours: number;
  assignedTo: { id: string; name: string | null; email: string } | null;
  resolvedBy: { id: string; name: string | null; email: string } | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
};

const ROW_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true } },
  resolvedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ExceptionInclude;

function mapRow(
  row: Prisma.ExceptionGetPayload<{ include: typeof ROW_INCLUDE }>,
): ExceptionRow {
  const ageMs = Date.now() - row.createdAt.getTime();
  return {
    id: row.id,
    exceptionType: row.exceptionType,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description,
    entityType: row.entityType,
    entityId: row.entityId,
    recurringKey: row.recurringKey,
    source: row.source,
    ageHours: Math.max(0, Math.floor(ageMs / 3_600_000)),
    assignedTo: row.assignedTo,
    resolvedBy: row.resolvedBy,
    resolvedAt: row.resolvedAt,
    resolutionNotes: row.resolutionNotes,
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export type ExceptionFilters = {
  status?: ExceptionState | "active";
  severity?: ExceptionSeverity;
  exceptionType?: ExceptionType;
  assignedToId?: string;
  search?: string;
};

const ACTIVE_STATES: ExceptionState[] = ["open", "investigating", "blocked"];

export async function listExceptions(filters: ExceptionFilters = {}): Promise<ExceptionRow[]> {
  const where: Prisma.ExceptionWhereInput = {};
  if (filters.status === "active") where.status = { in: ACTIVE_STATES };
  else if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.exceptionType) where.exceptionType = filters.exceptionType;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { entityId: { contains: filters.search, mode: "insensitive" } },
      { recurringKey: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.exception.findMany({
    where,
    include: ROW_INCLUDE,
    orderBy: [
      { status: "asc" }, // open first
      { severity: "desc" }, // urgent first within status
      { createdAt: "asc" }, // oldest first within severity (aging)
    ],
    take: 500,
  });
  return rows.map(mapRow);
}

export async function countActiveExceptions(): Promise<number> {
  return prisma.exception.count({ where: { status: { in: ACTIVE_STATES } } });
}

// ---------------------------------------------------------------------------
// Mutations — every write goes through writeAudit
// ---------------------------------------------------------------------------

export type CreateExceptionInput = {
  exceptionType: ExceptionType;
  severity?: ExceptionSeverity;
  title: string;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  recurringKey?: string | null;
  source?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function createException(
  input: CreateExceptionInput,
  actor?: { id: string },
): Promise<string> {
  const created = await prisma.exception.create({
    data: {
      exceptionType: input.exceptionType,
      severity: input.severity ?? "medium",
      title: input.title,
      description: input.description ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      recurringKey: input.recurringKey ?? null,
      source: input.source ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
  await writeAudit({
    actorUserId: actor?.id ?? null,
    action: "exception.created",
    entityType: "exception",
    entityId: created.id,
    afterData: {
      type: created.exceptionType,
      severity: created.severity,
      title: created.title,
      sourceEntity: created.entityType,
    },
  });
  return created.id;
}

export async function assignException(
  id: string,
  assignedToId: string | null,
  actor: { id: string },
): Promise<void> {
  const before = await prisma.exception.findUniqueOrThrow({
    where: { id },
    select: { assignedToId: true },
  });
  await prisma.exception.update({ where: { id }, data: { assignedToId } });
  await writeAudit({
    actorUserId: actor.id,
    action: "exception.assigned",
    entityType: "exception",
    entityId: id,
    beforeData: before,
    afterData: { assignedToId },
  });
}

export async function setExceptionStatus(
  id: string,
  status: ExceptionState,
  actor: { id: string },
  resolutionNotes?: string | null,
): Promise<void> {
  const before = await prisma.exception.findUniqueOrThrow({
    where: { id },
    select: { status: true, resolvedAt: true },
  });
  if (before.status === status) return;

  const isResolution = status === "resolved" || status === "dismissed";
  if (isResolution && status === "resolved" && !resolutionNotes?.trim()) {
    throw new Error("Resolution notes are required to mark an exception resolved.");
  }

  await prisma.exception.update({
    where: { id },
    data: {
      status,
      resolutionNotes: resolutionNotes ?? undefined,
      resolvedById: isResolution ? actor.id : null,
      resolvedAt: isResolution ? new Date() : null,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: `exception.${status}`,
    entityType: "exception",
    entityId: id,
    beforeData: before,
    afterData: { status, resolutionNotes: resolutionNotes ?? null },
  });
}
