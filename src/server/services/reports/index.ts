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

export async function generateMonthlyManagementReport(args: {
  periodId: string;
  divisionCode?: string;
  preparedById: string;
}): Promise<Report> {
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

  const summaryText = buildSummaryText(snapshot);

  const report = await prisma.report.create({
    data: {
      title: `Monthly Management Report — ${period.name} (${division.code})`,
      reportType: "monthly_management",
      periodStart: period.startDate,
      periodEnd: period.endDate,
      status: "generated",
      preparedById: args.preparedById,
      summary: summaryText,
      metadata: snapshot as unknown as Prisma.InputJsonValue,
    },
  });

  await writeAudit({
    actorUserId: args.preparedById,
    action: "report.generate",
    entityType: "Report",
    entityId: report.id,
    afterData: { reportType: "monthly_management", period: period.name, division: division.code },
  });

  revalidatePath("/reports");
  return report;
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
