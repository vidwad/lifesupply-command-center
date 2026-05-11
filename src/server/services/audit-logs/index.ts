import { type Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type AuditLogFilters = {
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  pageSize?: number;
};

export type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  beforeData: Prisma.JsonValue | null;
  afterData: Prisma.JsonValue | null;
  actor: { id: string; name: string | null; email: string } | null;
};

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function listAuditLogs(filters: AuditLogFilters): Promise<{
  rows: AuditLogRow[];
  nextCursor: string | null;
}> {
  const take = Math.min(Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  const where: Prisma.AuditLogWhereInput = {};
  if (filters.actorId) where.actorUserId = filters.actorId;
  if (filters.action) where.action = { contains: filters.action, mode: "insensitive" };
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }
  if (filters.search) {
    where.OR = [
      { action: { contains: filters.search, mode: "insensitive" } },
      { entityType: { contains: filters.search, mode: "insensitive" } },
      { entityId: { contains: filters.search, mode: "insensitive" } },
      { actor: { email: { contains: filters.search, mode: "insensitive" } } },
      { actor: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      action: true,
      entityType: true,
      entityId: true,
      ipAddress: true,
      userAgent: true,
      beforeData: true,
      afterData: true,
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const hasMore = rows.length > take;
  const trimmed = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? (trimmed[trimmed.length - 1]?.id ?? null) : null;
  return { rows: trimmed, nextCursor };
}

export async function listAuditLogActors(): Promise<
  { id: string; name: string | null; email: string }[]
> {
  return prisma.user.findMany({
    where: { auditLogs: { some: {} } },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true },
  });
}

export async function listAuditLogEntityTypes(): Promise<string[]> {
  const grouped = await prisma.auditLog.groupBy({
    by: ["entityType"],
    where: { entityType: { not: null } },
    orderBy: { entityType: "asc" },
  });
  return grouped
    .map((g) => g.entityType)
    .filter((t): t is string => typeof t === "string" && t.length > 0);
}
