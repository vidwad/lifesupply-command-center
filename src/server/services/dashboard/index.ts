import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

// -----------------------------------------------------------------------------
// Type-safe shape returned to the page. Numbers are coerced to plain `number`
// at the boundary so React Server → Client serialization stays simple.
// -----------------------------------------------------------------------------

export type DashboardKpi = {
  current: number;
  previous: number | null;
  deltaPct: number | null;
};

export type DashboardData = {
  period: { id: string; name: string; status: string } | null;
  previousPeriod: { id: string; name: string } | null;

  revenue: DashboardKpi;
  grossProfit: DashboardKpi;
  grossMargin: { current: number | null; previous: number | null };
  operatingIncome: DashboardKpi;
  cash: { current: number | null };
  workingCapital: { current: number | null };

  operations: {
    openOrders: number;
    exceptionOrders: number;
    awaitingSupplier: number;
    awaitingHumanReview: number;
    completedThisPeriod: number;
    cancelledThisPeriod: number;
  };

  trend: { period: string; revenue: number; grossProfit: number; isCurrent: boolean }[];

  topProducts: {
    id: string;
    name: string;
    sku: string | null;
    revenue: number;
    quantity: number;
  }[];

  lowMarginProducts: {
    id: string;
    name: string;
    sku: string | null;
    revenue: number;
    marginPct: number;
  }[];

  exceptions: {
    id: string;
    orderNumber: string;
    storeName: string;
    customerLabel: string;
    grandTotal: number;
    exceptionStatus: string;
    exceptionReason: string | null;
    orderDate: string;
  }[];

  priorityTasks: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
    isOverdue: boolean;
    relatedEntityType: string | null;
  }[];

  aiBriefing: {
    id: string;
    output: string;
    createdAt: string;
    modelName: string;
    status: string;
  } | null;

  campaigns: {
    id: string;
    name: string;
    status: string;
    sentCount: number;
    openRate: number | null;
    attributedRevenue: number;
  }[];

  reactivation: {
    candidateCount: number;
    activeSegmentCount: number;
    topSegmentName: string | null;
  };
};

// -----------------------------------------------------------------------------

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));
const numOrNull = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

function deltaPct(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

const OPEN_ORDER_STATUSES: OrderStatus[] = [
  "received",
  "processing",
  "awaiting_supplier",
  "in_supplier_queue",
  "awaiting_human_review",
  "shipped",
];

// -----------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData> {
  // ------- periods --------
  const consolidated = await prisma.division.findUnique({ where: { code: "CONS" } });

  const currentPeriod = await prisma.financialPeriod.findFirst({
    orderBy: { startDate: "desc" },
    where: { status: { in: ["open", "imported", "under_review"] } },
  });
  // Most recently approved/closed period — for prior-period comparison
  const previousPeriod = await prisma.financialPeriod.findFirst({
    orderBy: { startDate: "desc" },
    where: {
      status: { in: ["approved", "closed"] },
      ...(currentPeriod ? { startDate: { lt: currentPeriod.startDate } } : {}),
    },
  });

  const currentSummary =
    consolidated && currentPeriod
      ? await prisma.financialSummary.findUnique({
          where: {
            financialPeriodId_divisionId: {
              financialPeriodId: currentPeriod.id,
              divisionId: consolidated.id,
            },
          },
        })
      : null;

  const previousSummary =
    consolidated && previousPeriod
      ? await prisma.financialSummary.findUnique({
          where: {
            financialPeriodId_divisionId: {
              financialPeriodId: previousPeriod.id,
              divisionId: consolidated.id,
            },
          },
        })
      : null;

  // ------- last 6 periods trend --------
  const trendPeriods = await prisma.financialPeriod.findMany({
    orderBy: { startDate: "desc" },
    take: 6,
    include: {
      summaries: consolidated
        ? { where: { divisionId: consolidated.id } }
        : { where: { divisionId: "__none__" } },
    },
  });
  const trend = trendPeriods.reverse().map((p) => {
    const summary = p.summaries[0];
    return {
      period: p.name,
      revenue: num(summary?.revenue),
      grossProfit: num(summary?.grossProfit),
      isCurrent: currentPeriod?.id === p.id,
    };
  });

  // ------- operations counts (live from orders) --------
  const periodStart = currentPeriod?.startDate ?? new Date(new Date().getFullYear(), 0, 1);

  const [
    openOrders,
    exceptionOrders,
    awaitingSupplier,
    awaitingHumanReview,
    completedThisPeriod,
    cancelledThisPeriod,
  ] = await Promise.all([
    prisma.order.count({ where: { status: { in: OPEN_ORDER_STATUSES } } }),
    prisma.order.count({ where: { exceptionStatus: { in: ["flagged", "in_review"] } } }),
    prisma.order.count({ where: { status: "awaiting_supplier" } }),
    prisma.order.count({ where: { status: "awaiting_human_review" } }),
    prisma.order.count({
      where: { status: "completed", orderDate: { gte: periodStart } },
    }),
    prisma.order.count({
      where: { status: "cancelled", orderDate: { gte: periodStart } },
    }),
  ]);

  // ------- top products by revenue (last 90 days) --------
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const topRows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: { orderDate: { gte: ninetyDaysAgo }, status: { not: "cancelled" } },
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

  // ------- low-margin products (margin < 35%, last 90 days) --------
  const lowMarginRows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: { orderDate: { gte: ninetyDaysAgo }, status: { not: "cancelled" } },
    },
    _sum: { lineSubtotal: true, estimatedGrossProfit: true },
  });
  const lowMargin = lowMarginRows
    .map((r) => {
      const revenue = num(r._sum.lineSubtotal);
      const gp = num(r._sum.estimatedGrossProfit);
      const margin = revenue > 0 ? gp / revenue : 0;
      return { productId: r.productId, revenue, margin };
    })
    .filter((r) => r.productId != null && r.margin < 0.35 && r.revenue > 0)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 5);
  const lowMarginIds = lowMargin.map((r) => r.productId).filter((id): id is string => id != null);
  const lowMarginRecords = await prisma.product.findMany({
    where: { id: { in: lowMarginIds } },
    select: { id: true, name: true, sku: true },
  });
  const lowMarginMap = new Map(lowMarginRecords.map((p) => [p.id, p]));
  const lowMarginProducts = lowMargin
    .map((r) => {
      const p = r.productId ? lowMarginMap.get(r.productId) : undefined;
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        revenue: r.revenue,
        marginPct: r.margin,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  // ------- exception orders --------
  const exceptionList = await prisma.order.findMany({
    where: { exceptionStatus: { in: ["flagged", "in_review"] } },
    orderBy: { orderDate: "desc" },
    include: {
      store: { select: { name: true } },
      customer: { select: { firstName: true, lastName: true, companyName: true, email: true } },
    },
    take: 5,
  });
  const exceptions = exceptionList.map((o) => {
    const customerLabel =
      o.customer?.companyName ??
      [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(" ") ??
      o.customer?.email ??
      "Unknown";
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      storeName: o.store.name,
      customerLabel,
      grandTotal: num(o.grandTotal),
      exceptionStatus: o.exceptionStatus,
      exceptionReason: o.exceptionReason,
      orderDate: o.orderDate.toISOString(),
    };
  });

  // ------- priority tasks --------
  const now = new Date();
  const priorityTaskRecords = await prisma.task.findMany({
    where: {
      status: { in: ["open", "in_progress", "awaiting_approval", "blocked"] },
      OR: [
        { priority: { in: ["high", "urgent"] } },
        { dueDate: { lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3) } }, // due in next 3 days
      ],
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    take: 6,
  });
  const priorityTasks = priorityTaskRecords.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate?.toISOString() ?? null,
    isOverdue: t.dueDate != null && t.dueDate < now,
    relatedEntityType: t.relatedEntityType,
  }));

  // ------- AI briefing (latest dashboard_briefing) --------
  const briefing = await prisma.aiOutput.findFirst({
    where: { module: "dashboard_briefing" },
    orderBy: { createdAt: "desc" },
  });
  const aiBriefing = briefing
    ? {
        id: briefing.id,
        output: briefing.output,
        createdAt: briefing.createdAt.toISOString(),
        modelName: briefing.modelName,
        status: briefing.status,
      }
    : null;

  // ------- campaign performance (recent sent campaigns) --------
  const campaignRecords = await prisma.campaign.findMany({
    where: { status: "sent" },
    orderBy: { sentAt: "desc" },
    take: 4,
    include: {
      metrics: { orderBy: { measuredAt: "desc" }, take: 1 },
    },
  });
  const campaigns = campaignRecords.map((c) => {
    const m = c.metrics[0];
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      sentCount: m?.sentCount ?? 0,
      openRate: m && m.sentCount > 0 ? m.openCount / m.sentCount : null,
      attributedRevenue: num(m?.attributedRevenue),
    };
  });

  // ------- reactivation summary --------
  const reactivationCandidates = await prisma.customer.count({
    where: {
      consentStatus: "subscribed",
      lastOrderAt: { lt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90) },
      reactivationScore: { gte: 50 },
    },
  });
  const segmentCount = await prisma.customerSegment.count({
    where: { isActive: true, segmentType: "reactivation" },
  });
  const topSegment = await prisma.customerSegment.findFirst({
    where: { isActive: true, segmentType: "reactivation" },
    orderBy: { createdAt: "asc" },
    select: { name: true },
  });

  // ------- assemble --------
  const revenueCurrent = num(currentSummary?.revenue);
  const revenuePrev = numOrNull(previousSummary?.revenue);
  const grossProfitCurrent = num(currentSummary?.grossProfit);
  const grossProfitPrev = numOrNull(previousSummary?.grossProfit);
  const operatingIncomeCurrent = num(currentSummary?.operatingIncome);
  const operatingIncomePrev = numOrNull(previousSummary?.operatingIncome);

  return {
    period: currentPeriod
      ? { id: currentPeriod.id, name: currentPeriod.name, status: currentPeriod.status }
      : null,
    previousPeriod: previousPeriod ? { id: previousPeriod.id, name: previousPeriod.name } : null,

    revenue: {
      current: revenueCurrent,
      previous: revenuePrev,
      deltaPct: deltaPct(revenueCurrent, revenuePrev),
    },
    grossProfit: {
      current: grossProfitCurrent,
      previous: grossProfitPrev,
      deltaPct: deltaPct(grossProfitCurrent, grossProfitPrev),
    },
    grossMargin: {
      current: numOrNull(currentSummary?.grossMargin),
      previous: numOrNull(previousSummary?.grossMargin),
    },
    operatingIncome: {
      current: operatingIncomeCurrent,
      previous: operatingIncomePrev,
      deltaPct: deltaPct(operatingIncomeCurrent, operatingIncomePrev),
    },
    cash: { current: numOrNull(currentSummary?.cash) },
    workingCapital: { current: numOrNull(currentSummary?.workingCapital) },

    operations: {
      openOrders,
      exceptionOrders,
      awaitingSupplier,
      awaitingHumanReview,
      completedThisPeriod,
      cancelledThisPeriod,
    },

    trend,
    topProducts,
    lowMarginProducts,
    exceptions,
    priorityTasks,
    aiBriefing,
    campaigns,
    reactivation: {
      candidateCount: reactivationCandidates,
      activeSegmentCount: segmentCount,
      topSegmentName: topSegment?.name ?? null,
    },
  };
}
