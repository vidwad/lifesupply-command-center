import { type Prisma, type DiligenceCategory, type DiligenceStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

const STANDARD_CHECKLIST: {
  category: DiligenceCategory;
  itemKey: string;
  title: string;
  description?: string;
}[] = [
  // ---- financial
  { category: "financial", itemKey: "fin_audited_statements", title: "Obtain audited statements (last 3 years)" },
  { category: "financial", itemKey: "fin_management_accounts", title: "Review monthly management accounts (last 24 months)" },
  { category: "financial", itemKey: "fin_revenue_concentration", title: "Top-10 customer concentration analysis" },
  { category: "financial", itemKey: "fin_working_capital", title: "Working capital + cash flow review" },
  // ---- legal
  { category: "legal", itemKey: "legal_corp_records", title: "Corporate records + shareholder register" },
  { category: "legal", itemKey: "legal_contracts", title: "Material contracts (top customers + top suppliers)" },
  { category: "legal", itemKey: "legal_ip", title: "IP + trademark + domain ownership" },
  { category: "legal", itemKey: "legal_litigation", title: "Open / threatened litigation" },
  // ---- operational
  { category: "operational", itemKey: "ops_supplier_agreements", title: "Supplier agreements + pricing" },
  { category: "operational", itemKey: "ops_inventory", title: "Inventory levels + valuation method" },
  { category: "operational", itemKey: "ops_systems", title: "Systems + tooling inventory" },
  // ---- commercial
  { category: "commercial", itemKey: "comm_pipeline", title: "Sales pipeline + win-rate trends" },
  { category: "commercial", itemKey: "comm_customer_references", title: "Customer references (3 active, 1 lost)" },
  // ---- regulatory
  { category: "regulatory", itemKey: "reg_licenses", title: "Health-canada / FDA registrations + product licenses" },
  { category: "regulatory", itemKey: "reg_data_privacy", title: "PIPEDA + HIPAA posture review" },
  // ---- HR
  { category: "hr", itemKey: "hr_org_chart", title: "Org chart + key-employee retention plan" },
  { category: "hr", itemKey: "hr_comp_benefits", title: "Compensation + benefits review" },
];

const INCLUDE = {
  opportunity: { select: { id: true, title: true, opportunityType: true } },
  owner: { select: { id: true, name: true, email: true } },
  completedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.DiligenceItemInclude;

export type DiligenceItemRow = Prisma.DiligenceItemGetPayload<{ include: typeof INCLUDE }>;

export async function listDiligenceItems(filters: {
  opportunityId?: string;
  status?: DiligenceStatus;
  ownerId?: string;
} = {}): Promise<DiligenceItemRow[]> {
  return prisma.diligenceItem.findMany({
    where: {
      ...(filters.opportunityId ? { opportunityId: filters.opportunityId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    },
    include: INCLUDE,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    take: 500,
  });
}

export async function seedDiligenceChecklist(args: {
  opportunityId: string;
  actor: { id: string };
}): Promise<DiligenceItemRow[]> {
  let inserted = 0;
  for (const [index, item] of STANDARD_CHECKLIST.entries()) {
    const existing = await prisma.diligenceItem.findFirst({
      where: { opportunityId: args.opportunityId, itemKey: item.itemKey },
    });
    if (existing) continue;
    await prisma.diligenceItem.create({
      data: {
        opportunityId: args.opportunityId,
        category: item.category,
        itemKey: item.itemKey,
        title: item.title,
        description: item.description ?? null,
        sortOrder: index,
      },
    });
    inserted++;
  }
  if (inserted > 0) {
    await writeAudit({
      actorUserId: args.actor.id,
      action: "diligence_checklist.seeded",
      entityType: "opportunity",
      entityId: args.opportunityId,
      afterData: { inserted },
    });
  }
  return listDiligenceItems({ opportunityId: args.opportunityId });
}

export async function setDiligenceItemStatus(
  id: string,
  status: DiligenceStatus,
  actor: { id: string },
  notes?: string | null,
): Promise<void> {
  const before = await prisma.diligenceItem.findUniqueOrThrow({
    where: { id },
    select: { status: true, opportunityId: true },
  });
  if (before.status === status && !notes) return;

  const isCompletion = status === "done" || status === "not_applicable";
  await prisma.diligenceItem.update({
    where: { id },
    data: {
      status,
      notes: notes ?? undefined,
      completedById: isCompletion ? actor.id : null,
      completedAt: isCompletion ? new Date() : null,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: `diligence_item.${status}`,
    entityType: "diligence_item",
    entityId: id,
    beforeData: { status: before.status },
    afterData: { status, notes: notes ?? null },
  });
}

export async function diligenceSummary(
  opportunityId: string,
): Promise<{ total: number; done: number; blocked: number; remaining: number }> {
  const rows = await prisma.diligenceItem.groupBy({
    by: ["status"],
    where: { opportunityId },
    _count: { _all: true },
  });
  let total = 0;
  let done = 0;
  let blocked = 0;
  for (const r of rows) {
    total += r._count._all;
    if (r.status === "done" || r.status === "not_applicable") done += r._count._all;
    if (r.status === "blocked") blocked += r._count._all;
  }
  return { total, done, blocked, remaining: total - done };
}
