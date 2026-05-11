import { revalidatePath } from "next/cache";

import type { ApprovalStatus, Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

// -----------------------------------------------------------------------------
// Approval types → required permission to approve/reject
// -----------------------------------------------------------------------------

const APPROVE_PERMISSION_BY_TYPE: Record<string, PermissionKey | null> = {
  campaign: PERMISSIONS.MARKETING_APPROVE_CAMPAIGN,
  financial_summary: PERMISSIONS.FINANCIALS_APPROVE,
  report: PERMISSIONS.REPORTS_APPROVE,
  supplier_order: PERMISSIONS.SUPPLIERS_APPROVE_ORDER_AUTOMATION,
  external_update: PERMISSIONS.ORDERS_APPROVE_EXTERNAL_UPDATE,
  investor_material: PERMISSIONS.INVESTORS_APPROVE_MATERIALS,
};

export const APPROVAL_TYPE_LABEL: Record<string, string> = {
  campaign: "Marketing campaign",
  financial_summary: "Financial summary",
  report: "Report",
  supplier_order: "Supplier order",
  external_update: "External update",
  investor_material: "Investor material",
};

export function approvePermissionFor(type: string): PermissionKey | null {
  return APPROVE_PERMISSION_BY_TYPE[type] ?? null;
}

export function canUserApprove(
  user: { permissions: string[] } | null | undefined,
  type: string,
): boolean {
  if (!user) return false;
  const required = approvePermissionFor(type);
  if (!required) return false;
  return user.permissions.includes(required);
}

// -----------------------------------------------------------------------------
// Resolve a friendly label + href for the related entity
// -----------------------------------------------------------------------------

async function resolveRelatedEntity(
  entityType: string | null,
  entityId: string | null,
): Promise<{ label: string | null; href: string | null }> {
  if (!entityType || !entityId) return { label: null, href: null };

  switch (entityType) {
    case "Campaign": {
      const campaign = await prisma.campaign.findUnique({
        where: { id: entityId },
        select: { name: true },
      });
      return { label: campaign?.name ?? null, href: "/marketing" };
    }
    case "FinancialPeriod": {
      const period = await prisma.financialPeriod.findUnique({
        where: { id: entityId },
        select: { name: true },
      });
      return {
        label: period ? `Financial close — ${period.name}` : null,
        href: period ? `/financials?period=${entityId}` : null,
      };
    }
    case "Order": {
      const order = await prisma.order.findUnique({
        where: { id: entityId },
        select: { orderNumber: true },
      });
      return {
        label: order ? `Order ${order.orderNumber}` : null,
        href: `/orders/${entityId}`,
      };
    }
    case "Report": {
      const report = await prisma.report.findUnique({
        where: { id: entityId },
        select: { title: true },
      });
      return { label: report?.title ?? null, href: `/reports/${entityId}` };
    }
    default:
      return { label: null, href: null };
  }
}

// -----------------------------------------------------------------------------
// Listing
// -----------------------------------------------------------------------------

export type ApprovalView =
  | "pending"
  | "my_requests"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "all";

const STATUS_BY_VIEW: Record<ApprovalView, ApprovalStatus[] | undefined> = {
  pending: ["pending"],
  my_requests: undefined,
  approved: ["approved"],
  rejected: ["rejected"],
  withdrawn: ["withdrawn"],
  all: undefined,
};

export type ListApprovalsFilters = {
  view?: ApprovalView;
  currentUserId?: string;
};

export async function listApprovals(filters: ListApprovalsFilters = {}) {
  const view = filters.view ?? "pending";
  const where: Prisma.ApprovalWhereInput = {};

  const statuses = STATUS_BY_VIEW[view];
  if (statuses) where.status = { in: statuses };
  if (view === "my_requests") {
    where.requestedById = filters.currentUserId;
  }

  const records = await prisma.approval.findMany({
    where,
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
    take: 100,
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  });

  const enriched = await Promise.all(
    records.map(async (r) => {
      const related = await resolveRelatedEntity(r.relatedEntityType, r.relatedEntityId);
      return {
        id: r.id,
        approvalType: r.approvalType,
        status: r.status,
        requestSummary: r.requestSummary,
        decisionNotes: r.decisionNotes,
        requestedAt: r.requestedAt.toISOString(),
        decidedAt: r.decidedAt?.toISOString() ?? null,
        requestedBy: r.requestedBy,
        approver: r.approver,
        relatedEntityType: r.relatedEntityType,
        relatedEntityId: r.relatedEntityId,
        relatedEntityLabel: related.label,
        relatedEntityHref: related.href,
      };
    }),
  );

  return enriched;
}

export type ApprovalListRow = Awaited<ReturnType<typeof listApprovals>>[number];

export async function getApprovalById(id: string) {
  const record = await prisma.approval.findUnique({
    where: { id },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) return null;
  const related = await resolveRelatedEntity(record.relatedEntityType, record.relatedEntityId);
  return {
    ...record,
    relatedEntityLabel: related.label,
    relatedEntityHref: related.href,
  };
}

export type ApprovalDetail = NonNullable<Awaited<ReturnType<typeof getApprovalById>>>;

// -----------------------------------------------------------------------------
// Counts (tab badges)
// -----------------------------------------------------------------------------

export async function getApprovalCounts(currentUserId: string) {
  const [pending, mine, approved, rejected] = await Promise.all([
    prisma.approval.count({ where: { status: "pending" } }),
    prisma.approval.count({ where: { requestedById: currentUserId } }),
    prisma.approval.count({ where: { status: "approved" } }),
    prisma.approval.count({ where: { status: "rejected" } }),
  ]);
  return { pending, mine, approved, rejected };
}

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export class ApprovalPermissionError extends Error {
  constructor(public readonly approvalType: string) {
    super(`You do not have permission to decide on a ${approvalType} approval.`);
    this.name = "ApprovalPermissionError";
  }
}

async function decide(args: {
  approvalId: string;
  decision: "approved" | "rejected";
  decisionNotes: string;
  actor: { id: string; permissions: string[] };
}) {
  const before = await prisma.approval.findUnique({
    where: { id: args.approvalId },
    select: {
      id: true,
      approvalType: true,
      status: true,
      relatedEntityType: true,
      relatedEntityId: true,
    },
  });
  if (!before) throw new Error("Approval not found.");
  if (before.status !== "pending") {
    throw new Error(`Approval is already ${before.status} and cannot be changed.`);
  }
  if (!canUserApprove(args.actor, before.approvalType)) {
    throw new ApprovalPermissionError(before.approvalType);
  }

  // Per docs/13 §10 a rejection must capture a reason so it remains
  // explainable in audit. Approvals may proceed without notes.
  const trimmedNotes = args.decisionNotes.trim();
  if (args.decision === "rejected" && !trimmedNotes) {
    throw new Error("A rejection reason is required.");
  }

  const updated = await prisma.approval.update({
    where: { id: args.approvalId },
    data: {
      status: args.decision,
      decisionNotes: trimmedNotes || null,
      approverId: args.actor.id,
      decidedAt: new Date(),
    },
  });

  // Side-effects on linked entities: when a financial-summary approval is
  // approved, mark the corresponding FinancialSummary rows as approved too.
  if (
    args.decision === "approved" &&
    before.approvalType === "financial_summary" &&
    before.relatedEntityType === "FinancialPeriod" &&
    before.relatedEntityId
  ) {
    await prisma.financialSummary.updateMany({
      where: { financialPeriodId: before.relatedEntityId },
      data: { approvalStatus: "approved" },
    });
    await prisma.financialPeriod.update({
      where: { id: before.relatedEntityId },
      data: { status: "approved" },
    });
  }

  // Side-effect: when a campaign approval is decided, transition the
  // Campaign row. Approval moves to "scheduled" (the export step picks it
  // up); rejection moves it back to "draft" for revision. Per CLAUDE.md §13
  // we deliberately stop short of "sent" — the actual Mailchimp export is
  // a separate, feature-flag-gated action even after approval.
  if (
    before.approvalType === "campaign" &&
    before.relatedEntityType === "Campaign" &&
    before.relatedEntityId
  ) {
    if (args.decision === "approved") {
      await prisma.campaign.update({
        where: { id: before.relatedEntityId },
        data: {
          status: "scheduled",
          approvedById: args.actor.id,
          approvedAt: new Date(),
        },
      });
    } else {
      await prisma.campaign.update({
        where: { id: before.relatedEntityId },
        data: { status: "draft" },
      });
    }
  }

  // Side-effect: when an investor-material approval is decided, transition
  // the InvestorUpdate row. Approval moves to "approved"; rejection moves
  // it back to "draft". Releasing the update is a separate action that
  // requires the investor.distribution FeatureFlag — we never auto-release.
  if (
    before.approvalType === "investor_material" &&
    before.relatedEntityType === "InvestorUpdate" &&
    before.relatedEntityId
  ) {
    if (args.decision === "approved") {
      await prisma.investorUpdate.update({
        where: { id: before.relatedEntityId },
        data: {
          status: "approved",
          approvedById: args.actor.id,
          approvedAt: new Date(),
        },
      });
    } else {
      await prisma.investorUpdate.update({
        where: { id: before.relatedEntityId },
        data: { status: "draft" },
      });
    }
  }

  // Side-effect: when a report approval is approved or rejected, transition
  // the Report row. Approval moves it to "approved"; rejection moves it
  // back to "draft" so the prepared can revise and re-request.
  if (
    before.approvalType === "report" &&
    before.relatedEntityType === "Report" &&
    before.relatedEntityId
  ) {
    if (args.decision === "approved") {
      await prisma.report.update({
        where: { id: before.relatedEntityId },
        data: {
          status: "approved",
          approvedById: args.actor.id,
          approvedAt: new Date(),
        },
      });
    } else {
      await prisma.report.update({
        where: { id: before.relatedEntityId },
        data: { status: "draft" },
      });
    }
  }

  await writeAudit({
    actorUserId: args.actor.id,
    action: args.decision === "approved" ? "approval.approved" : "approval.rejected",
    entityType: "Approval",
    entityId: updated.id,
    beforeData: { status: before.status },
    afterData: {
      status: updated.status,
      approvalType: before.approvalType,
      decisionNotes: updated.decisionNotes,
    },
  });

  revalidatePath("/approvals");
  revalidatePath(`/approvals/${updated.id}`);
  if (before.relatedEntityType === "FinancialPeriod") revalidatePath("/financials");
  if (before.relatedEntityType === "Campaign" && before.relatedEntityId) {
    revalidatePath("/marketing");
    revalidatePath("/marketing/reactivation");
    revalidatePath(`/marketing/campaigns/${before.relatedEntityId}`);
  }
  if (before.relatedEntityType === "Report" && before.relatedEntityId) {
    revalidatePath("/reports");
    revalidatePath(`/reports/${before.relatedEntityId}`);
  }
  if (before.relatedEntityType === "InvestorUpdate" && before.relatedEntityId) {
    revalidatePath("/investors/updates");
    revalidatePath(`/investors/updates/${before.relatedEntityId}`);
  }
  return updated;
}

export async function approve(args: {
  approvalId: string;
  decisionNotes: string;
  actor: { id: string; permissions: string[] };
}) {
  return decide({ ...args, decision: "approved" });
}

export async function reject(args: {
  approvalId: string;
  decisionNotes: string;
  actor: { id: string; permissions: string[] };
}) {
  return decide({ ...args, decision: "rejected" });
}

export async function withdraw(args: { approvalId: string; actorUserId: string }) {
  const before = await prisma.approval.findUnique({
    where: { id: args.approvalId },
    select: { id: true, requestedById: true, status: true, approvalType: true },
  });
  if (!before) throw new Error("Approval not found.");
  if (before.status !== "pending") {
    throw new Error(`Approval is ${before.status} and cannot be withdrawn.`);
  }
  if (before.requestedById !== args.actorUserId) {
    throw new Error("Only the original requester can withdraw an approval.");
  }

  const updated = await prisma.approval.update({
    where: { id: args.approvalId },
    data: { status: "withdrawn", decidedAt: new Date() },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "approval.withdrawn",
    entityType: "Approval",
    entityId: updated.id,
    beforeData: { status: before.status },
    afterData: { status: updated.status, approvalType: before.approvalType },
  });

  revalidatePath("/approvals");
  revalidatePath(`/approvals/${updated.id}`);
  return updated;
}
