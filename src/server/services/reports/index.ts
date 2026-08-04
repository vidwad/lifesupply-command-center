import { revalidatePath } from "next/cache";

import type { Prisma, Report } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));
const numOrNull = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

// -----------------------------------------------------------------------------
// Listing & retrieval
// -----------------------------------------------------------------------------

export type ListReportsFilters = {
  reportType?: string;
};

export async function listReports(filters: ListReportsFilters = {}) {
  const where: Prisma.ReportWhereInput = {};
  if (filters.reportType) where.reportType = filters.reportType;

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      preparedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return reports;
}

export type ReportListRow = Awaited<ReturnType<typeof listReports>>[number];

export async function getReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      preparedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export type ReportDetail = NonNullable<Awaited<ReturnType<typeof getReportById>>>;

// -----------------------------------------------------------------------------
// Generator — Monthly Management Report
// -----------------------------------------------------------------------------

export type ReportSnapshot = {
  period: { id: string; name: string; startDate: string; endDate: string; status: string };
  division: { code: string; name: string };
  financial: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossMargin: number | null;
    operatingExpenses: number;
    operatingIncome: number;
    cash: number | null;
    accountsReceivable: number | null;
    accountsPayable: number | null;
    workingCapital: number | null;
  };
  prevFinancial: ReportSnapshot["financial"] | null;
  prevPeriod: { id: string; name: string } | null;
  operations: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    exceptionsOpen: number;
    awaitingSupplier: number;
    grossOrderRevenue: number;
  };
  topProducts: {
    id: string;
    name: string;
    sku: string | null;
    revenue: number;
    quantity: number;
  }[];
  marketing: {
    sentCampaigns: number;
    totalSent: number;
    totalOpens: number;
    totalConversions: number;
    attributedRevenue: number;
  };
  priorityTasks: { id: string; title: string; priority: string; status: string }[];
};

/**
 * Shared snapshot builder for all report generators (Phase 9). Collects the
 * financial, operations, product, marketing, and task picture for one
 * period + division.
 */
async function buildSnapshotForPeriod(args: { periodId: string; divisionCode?: string }): Promise<{
  snapshot: ReportSnapshot;
  period: { id: string; name: string; startDate: Date; endDate: Date; status: string };
  division: { id: string; code: string; name: string };
}> {
  const period = await prisma.financialPeriod.findUniqueOrThrow({ where: { id: args.periodId } });
  const division = await prisma.division.findUniqueOrThrow({
    where: { code: args.divisionCode ?? "CONS" },
  });

  // ---- previous period
  const previousPeriod = await prisma.financialPeriod.findFirst({
    where: { startDate: { lt: period.startDate } },
    orderBy: { startDate: "desc" },
  });

  // ---- financial summaries
  const summary = await prisma.financialSummary.findUnique({
    where: {
      financialPeriodId_divisionId: { financialPeriodId: period.id, divisionId: division.id },
    },
  });
  if (!summary) {
    throw new Error(`No financial summary for ${division.code} in ${period.name}.`);
  }
  const prevSummary = previousPeriod
    ? await prisma.financialSummary.findUnique({
        where: {
          financialPeriodId_divisionId: {
            financialPeriodId: previousPeriod.id,
            divisionId: division.id,
          },
        },
      })
    : null;

  // ---- operations counts within the period (across all stores in the division for now)
  const orderWhere: Prisma.OrderWhereInput = {
    orderDate: { gte: period.startDate, lte: period.endDate },
    ...(division.code !== "CONS" ? { divisionId: division.id } : {}),
  };
  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    exceptionsOpen,
    awaitingSupplier,
    revenueAgg,
  ] = await Promise.all([
    prisma.order.count({ where: orderWhere }),
    prisma.order.count({ where: { ...orderWhere, status: "completed" } }),
    prisma.order.count({ where: { ...orderWhere, status: "cancelled" } }),
    prisma.order.count({
      where: { ...orderWhere, exceptionStatus: { in: ["flagged", "in_review"] } },
    }),
    prisma.order.count({ where: { ...orderWhere, status: "awaiting_supplier" } }),
    prisma.order.aggregate({
      where: { ...orderWhere, status: { not: "cancelled" } },
      _sum: { grandTotal: true },
    }),
  ]);

  // ---- top products in period
  const topRows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: { ...orderWhere, status: { not: "cancelled" } },
    },
    _sum: { lineSubtotal: true, quantity: true },
    orderBy: { _sum: { lineSubtotal: "desc" } },
    take: 5,
  });
  const topProductIds = topRows.map((r) => r.productId).filter((id): id is string => id != null);
  const topProductRecords = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true },
  });
  const topProductMap = new Map(topProductRecords.map((p) => [p.id, p]));
  const topProducts = topRows
    .map((r) => {
      const p = r.productId ? topProductMap.get(r.productId) : undefined;
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        revenue: num(r._sum.lineSubtotal),
        quantity: r._sum.quantity ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  // ---- marketing in period
  const sentCampaigns = await prisma.campaign.findMany({
    where: { status: "sent", sentAt: { gte: period.startDate, lte: period.endDate } },
    include: { metrics: { orderBy: { measuredAt: "desc" }, take: 1 } },
  });
  const marketing = sentCampaigns.reduce(
    (acc, c) => {
      const m = c.metrics[0];
      return {
        sentCampaigns: acc.sentCampaigns + 1,
        totalSent: acc.totalSent + (m?.sentCount ?? 0),
        totalOpens: acc.totalOpens + (m?.openCount ?? 0),
        totalConversions: acc.totalConversions + (m?.conversionCount ?? 0),
        attributedRevenue: acc.attributedRevenue + num(m?.attributedRevenue),
      };
    },
    { sentCampaigns: 0, totalSent: 0, totalOpens: 0, totalConversions: 0, attributedRevenue: 0 },
  );

  // ---- priority tasks (still open + high/urgent)
  const priorityTaskRecords = await prisma.task.findMany({
    where: {
      status: { in: ["open", "in_progress", "blocked", "awaiting_approval"] },
      priority: { in: ["high", "urgent"] },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    take: 5,
    select: { id: true, title: true, priority: true, status: true },
  });

  const snapshot: ReportSnapshot = {
    period: {
      id: period.id,
      name: period.name,
      startDate: period.startDate.toISOString(),
      endDate: period.endDate.toISOString(),
      status: period.status,
    },
    division: { code: division.code, name: division.name },
    financial: {
      revenue: num(summary.revenue),
      cogs: num(summary.cogs),
      grossProfit: num(summary.grossProfit),
      grossMargin: numOrNull(summary.grossMargin),
      operatingExpenses: num(summary.operatingExpenses),
      operatingIncome: num(summary.operatingIncome),
      cash: numOrNull(summary.cash),
      accountsReceivable: numOrNull(summary.accountsReceivable),
      accountsPayable: numOrNull(summary.accountsPayable),
      workingCapital: numOrNull(summary.workingCapital),
    },
    prevFinancial: prevSummary
      ? {
          revenue: num(prevSummary.revenue),
          cogs: num(prevSummary.cogs),
          grossProfit: num(prevSummary.grossProfit),
          grossMargin: numOrNull(prevSummary.grossMargin),
          operatingExpenses: num(prevSummary.operatingExpenses),
          operatingIncome: num(prevSummary.operatingIncome),
          cash: numOrNull(prevSummary.cash),
          accountsReceivable: numOrNull(prevSummary.accountsReceivable),
          accountsPayable: numOrNull(prevSummary.accountsPayable),
          workingCapital: numOrNull(prevSummary.workingCapital),
        }
      : null,
    prevPeriod: previousPeriod ? { id: previousPeriod.id, name: previousPeriod.name } : null,
    operations: {
      totalOrders,
      completedOrders,
      cancelledOrders,
      exceptionsOpen,
      awaitingSupplier,
      grossOrderRevenue: num(revenueAgg._sum.grandTotal),
    },
    topProducts,
    marketing,
    priorityTasks: priorityTaskRecords,
  };

  return { snapshot, period, division };
}

/**
 * Source references + freshness stamp for every generated report
 * (docs/19 §9 acceptance: "reports cite source periods and data freshness";
 * docs/11 §8 controls: closed?/unaudited/QuickBooks sync timestamp).
 */
async function buildSourceReferences(period: { id: string; name: string; status: string }) {
  const qbo = await prisma.integrationConnection.findFirst({
    where: { integrationType: "quickbooks" },
    orderBy: { updatedAt: "desc" },
    select: { lastSuccessfulSyncAt: true },
  });
  const periodClosed = period.status === "approved" || period.status === "closed";
  return {
    sourcePeriods: [{ id: period.id, name: period.name, status: period.status }],
    dataFreshness: {
      qboLastSuccessfulSyncAt: qbo?.lastSuccessfulSyncAt?.toISOString() ?? null,
      periodClosed,
      unaudited: true,
      generatedAt: new Date().toISOString(),
    },
  };
}

type GeneratedReportInput = {
  title: string;
  reportType: string;
  period: { id: string; name: string; startDate: Date; endDate: Date; status: string };
  division: { code: string };
  preparedById: string;
  summary: string;
  metadata: Prisma.InputJsonValue;
};

async function createGeneratedReport(input: GeneratedReportInput): Promise<Report> {
  const sourceReferences = await buildSourceReferences(input.period);
  const report = await prisma.report.create({
    data: {
      title: input.title,
      reportType: input.reportType,
      periodStart: input.period.startDate,
      periodEnd: input.period.endDate,
      status: "generated",
      preparedById: input.preparedById,
      summary: input.summary,
      metadata: input.metadata,
      sourceReferences: sourceReferences as unknown as Prisma.InputJsonValue,
    },
  });
  await writeAudit({
    actorUserId: input.preparedById,
    action: "report.generate",
    entityType: "Report",
    entityId: report.id,
    afterData: {
      reportType: input.reportType,
      period: input.period.name,
      division: input.division.code,
    },
  });
  revalidatePath("/reports");
  return report;
}

export async function generateMonthlyManagementReport(args: {
  periodId: string;
  divisionCode?: string;
  preparedById: string;
}): Promise<Report> {
  const { snapshot, period, division } = await buildSnapshotForPeriod(args);
  return createGeneratedReport({
    title: `Monthly Management Report — ${period.name} (${division.code})`,
    reportType: "monthly_management",
    period,
    division,
    preparedById: args.preparedById,
    summary: buildSummaryText(snapshot),
    metadata: snapshot as unknown as Prisma.InputJsonValue,
  });
}

/**
 * Board report (docs/11 §9): the management snapshot plus board-level
 * context — revenue trend, capital raise status, open opportunities, and
 * risk signals. Consolidated only. Approval required before external use;
 * distribution stays manual.
 */
export async function generateBoardReport(args: {
  periodId: string;
  preparedById: string;
}): Promise<Report> {
  const { snapshot, period, division } = await buildSnapshotForPeriod({
    periodId: args.periodId,
  });

  const [trendPeriods, highExceptions, capitalRaises, openOpportunities] = await Promise.all([
    prisma.financialPeriod.findMany({
      where: { periodType: "month", startDate: { lte: period.startDate } },
      orderBy: { startDate: "desc" },
      take: 6,
      select: {
        name: true,
        summaries: {
          where: { OR: [{ divisionId: null }, { division: { code: "CONS" } }] },
          select: { divisionId: true, revenue: true, grossProfit: true },
        },
      },
    }),
    prisma.exception.count({
      where: {
        status: { in: ["open", "investigating", "blocked"] },
        severity: { in: ["high", "urgent"] },
      },
    }),
    prisma.capitalRaise.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, targetAmount: true },
    }),
    prisma.opportunity.count({ where: { status: { notIn: ["closed_won", "closed_lost"] } } }),
  ]);

  const trend = trendPeriods
    .reverse()
    .map((tp) => {
      const s = tp.summaries.find((x) => x.divisionId === null) ?? tp.summaries[0];
      return s
        ? { period: tp.name, revenue: num(s.revenue), grossProfit: num(s.grossProfit) }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const boardExtras = {
    revenueTrend: trend,
    highSeverityExceptions: highExceptions,
    capitalRaises: capitalRaises.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      targetAmount: num(c.targetAmount),
    })),
    openOpportunities,
  };

  const summary =
    `Board report for ${period.name} (consolidated, unaudited). ` +
    buildSummaryText(snapshot) +
    ` Risk signals: ${highExceptions} high/urgent exceptions open. ` +
    `Capital: ${capitalRaises.length} raise${capitalRaises.length === 1 ? "" : "s"} on record; ` +
    `${openOpportunities} open strategic opportunit${openOpportunities === 1 ? "y" : "ies"}. ` +
    `Distribution requires approval; this document is not auto-distributed.`;

  return createGeneratedReport({
    title: `Board Report — ${period.name}`,
    reportType: "board",
    period,
    division,
    preparedById: args.preparedById,
    summary,
    metadata: { ...snapshot, boardExtras } as unknown as Prisma.InputJsonValue,
  });
}

/**
 * Investor / lender package (docs/11 §10): concise external-facing package —
 * consolidated financial highlights, trailing-twelve-month revenue, and
 * capital raise status. Deliberately EXCLUDES internal task lists and any
 * customer-identifiable data. Must be approved before external use and is
 * never auto-distributed (investor.distribution flag governs release
 * elsewhere).
 */
export async function generateInvestorLenderPackage(args: {
  periodId: string;
  preparedById: string;
}): Promise<Report> {
  const { snapshot, period, division } = await buildSnapshotForPeriod({
    periodId: args.periodId,
  });

  const ttmPeriods = await prisma.financialPeriod.findMany({
    where: { periodType: "month", startDate: { lte: period.startDate } },
    orderBy: { startDate: "desc" },
    take: 12,
    select: {
      name: true,
      summaries: {
        where: { OR: [{ divisionId: null }, { division: { code: "CONS" } }] },
        select: { divisionId: true, revenue: true, grossProfit: true },
      },
    },
  });
  let ttmRevenue = 0;
  let ttmGrossProfit = 0;
  let ttmMonths = 0;
  for (const tp of ttmPeriods) {
    const s = tp.summaries.find((x) => x.divisionId === null) ?? tp.summaries[0];
    if (!s) continue;
    ttmRevenue += num(s.revenue);
    ttmGrossProfit += num(s.grossProfit);
    ttmMonths++;
  }

  const capitalRaises = await prisma.capitalRaise.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { name: true, status: true, targetAmount: true },
  });

  // External package: strip internal task list from the stored snapshot.
  const externalSnapshot = { ...snapshot, priorityTasks: [] };
  const investorExtras = {
    trailingTwelveMonths: {
      months: ttmMonths,
      revenue: Math.round(ttmRevenue * 100) / 100,
      grossProfit: Math.round(ttmGrossProfit * 100) / 100,
    },
    capitalRaises: capitalRaises.map((c) => ({
      name: c.name,
      status: c.status,
      targetAmount: num(c.targetAmount),
    })),
  };

  const summary =
    `Investor/lender package for ${period.name} (consolidated, unaudited management figures). ` +
    `Revenue ${snapshot.financial.revenue.toFixed(0)} with gross profit ${snapshot.financial.grossProfit.toFixed(0)} in the period; ` +
    `trailing ${ttmMonths} months: revenue ${ttmRevenue.toFixed(0)}, gross profit ${ttmGrossProfit.toFixed(0)}. ` +
    `Working capital ${snapshot.financial.workingCapital?.toFixed(0) ?? "n/a"}; cash ${snapshot.financial.cash?.toFixed(0) ?? "n/a"}. ` +
    `Figures are internal management numbers pending accountant review. ` +
    `APPROVAL REQUIRED before sharing externally; distribution is manual and governed separately.`;

  return createGeneratedReport({
    title: `Investor & Lender Package — ${period.name}`,
    reportType: "investor",
    period,
    division,
    preparedById: args.preparedById,
    summary,
    metadata: { ...externalSnapshot, investorExtras } as unknown as Prisma.InputJsonValue,
  });
}

// -----------------------------------------------------------------------------
// Report status transitions — approve / distribute / archive
//
// Per docs/11 §3 + CLAUDE.md §15, board / investor / lender reports must go
// through approval before distribution. We model that as:
//   draft → generated → under_review → approved → archived
// `setReportStatus` does the transition + audit. `requestReportApproval`
// raises an `Approval` row that surfaces in /approvals.
// -----------------------------------------------------------------------------

export class ReportTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportTransitionError";
  }
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["generated", "archived"],
  generated: ["under_review", "approved", "archived"],
  under_review: ["approved", "draft", "archived"],
  approved: ["archived"],
  archived: [],
};

export async function setReportStatus(args: {
  reportId: string;
  status: "draft" | "generated" | "under_review" | "approved" | "archived";
  actor: { id: string };
}) {
  const before = await prisma.report.findUniqueOrThrow({
    where: { id: args.reportId },
    select: { id: true, status: true, title: true, reportType: true },
  });
  if (before.status === args.status) return before;
  const allowed = ALLOWED_TRANSITIONS[before.status] ?? [];
  if (!allowed.includes(args.status)) {
    throw new ReportTransitionError(
      `Cannot move report from "${before.status}" to "${args.status}". Allowed: ${allowed.join(", ") || "(none)"}`,
    );
  }
  const updated = await prisma.report.update({
    where: { id: args.reportId },
    data: {
      status: args.status,
      ...(args.status === "approved"
        ? { approvedById: args.actor.id, approvedAt: new Date() }
        : {}),
    },
  });
  await writeAudit({
    actorUserId: args.actor.id,
    action: `report.${args.status}`,
    entityType: "report",
    entityId: args.reportId,
    beforeData: { status: before.status },
    afterData: { status: args.status, reportType: before.reportType },
  });
  revalidatePath("/reports");
  revalidatePath(`/reports/${args.reportId}`);
  return updated;
}

/**
 * Raise an Approval row for a report so it appears in /approvals. Used by
 * the report detail page's "Request approval" button. Does NOT change the
 * report status itself — that happens when an authorized user decides on
 * the Approval row.
 */
export async function requestReportApproval(args: {
  reportId: string;
  requestedById: string;
  notes?: string | null;
}) {
  const report = await prisma.report.findUniqueOrThrow({
    where: { id: args.reportId },
    select: { id: true, title: true, status: true },
  });
  if (report.status !== "generated" && report.status !== "under_review") {
    throw new ReportTransitionError(
      `Approval can only be requested for reports in "generated" or "under_review" state (current: "${report.status}").`,
    );
  }
  const existing = await prisma.approval.findFirst({
    where: {
      approvalType: "report",
      relatedEntityType: "Report",
      relatedEntityId: report.id,
      status: "pending",
    },
  });
  if (existing) {
    throw new ReportTransitionError("An approval request for this report is already pending.");
  }
  const approval = await prisma.approval.create({
    data: {
      approvalType: "report",
      relatedEntityType: "Report",
      relatedEntityId: report.id,
      requestSummary: args.notes
        ? `Approve report: ${report.title}\n\n${args.notes}`
        : `Approve report: ${report.title}`,
      requestedById: args.requestedById,
      status: "pending",
    },
  });
  // Also nudge the report into review state if it was still generated.
  if (report.status === "generated") {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "under_review" },
    });
  }
  await writeAudit({
    actorUserId: args.requestedById,
    action: "report.approval_requested",
    entityType: "report",
    entityId: report.id,
    afterData: { approvalId: approval.id },
  });
  revalidatePath("/approvals");
  revalidatePath(`/reports/${report.id}`);
  return approval;
}

function buildSummaryText(s: ReportSnapshot): string {
  const fmt = (n: number) =>
    n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
  const pct = (n: number | null) => (n == null ? "n/a" : `${(n * 100).toFixed(1)}%`);
  const delta = (cur: number, prev: number | null) => {
    if (prev == null || prev === 0) return "n/a";
    const d = (cur - prev) / prev;
    return `${d >= 0 ? "+" : ""}${(d * 100).toFixed(1)}%`;
  };

  const lines: string[] = [];
  lines.push(
    `${s.division.name} closed ${s.period.name} with ${fmt(s.financial.revenue)} in revenue (${delta(s.financial.revenue, s.prevFinancial?.revenue ?? null)} vs ${s.prevPeriod?.name ?? "prior"}), gross margin ${pct(s.financial.grossMargin)}, and operating income of ${fmt(s.financial.operatingIncome)}.`,
  );
  if (s.financial.cash != null) {
    lines.push(
      `Cash position: ${fmt(s.financial.cash)}; working capital ${s.financial.workingCapital != null ? fmt(s.financial.workingCapital) : "n/a"}.`,
    );
  }
  lines.push(
    `Operations: ${s.operations.totalOrders} orders in period (${s.operations.completedOrders} completed, ${s.operations.cancelledOrders} cancelled), ${s.operations.exceptionsOpen} flagged exceptions still open at report time.`,
  );
  if (s.marketing.sentCampaigns > 0) {
    lines.push(
      `Marketing: ${s.marketing.sentCampaigns} campaigns sent, ${s.marketing.totalSent.toLocaleString()} contacts reached, ${fmt(s.marketing.attributedRevenue)} attributed revenue.`,
    );
  }
  return lines.join("\n\n");
}
