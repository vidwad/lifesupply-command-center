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
};

/**
 * Reactivation counts for the AI briefing. The dashboard page does not show
 * them, and the candidate count is a full scan of the customers table, so
 * they are loaded only when a briefing is generated (2026-10-30).
 */
export type ReactivationSummary = {
  candidateCount: number;
  activeSegmentCount: number;
  topSegmentName: string | null;
};

// -----------------------------------------------------------------------------

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));
const numOrNull = (d: Prisma.Decimal | null | undefined): number | null =>
  d == null ? null : Number(d);

function deltaPct(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

/**
 * Orders still to be fulfilled. Shipped orders are not open: the stores
 * record most completed history as "shipped", so counting them put nearly
 * every order ever imported in this KPI and made it the slowest query on the
 * page (2026-10-30).
 */
export const OPEN_ORDER_STATUSES: OrderStatus[] = [
  "received",
  "processing",
  "awaiting_supplier",
  "in_supplier_queue",
  "awaiting_human_review",
];

export const LEADERBOARD_SIZE = 5;
export const LOW_MARGIN_THRESHOLD = 0.35;
export const PRODUCT_WINDOW_DAYS = 90;

export type ProductAggregate = {
  productId: string;
  revenue: number;
  quantity: number;
  grossProfit: number;
};

export type RankedProducts = {
  top: ProductAggregate[];
  lowMargin: (ProductAggregate & { marginPct: number })[];
};

/**
 * Both leaderboards come from one aggregate of the window's order items: the
 * top sellers by revenue, and the products whose margin on that revenue is
 * below the threshold, lowest margin first.
 */
export function rankProductAggregates(rows: ProductAggregate[]): RankedProducts {
  const top = [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, LEADERBOARD_SIZE);
  const lowMargin = rows
    .filter((r) => r.revenue > 0)
    .map((r) => ({ ...r, marginPct: r.grossProfit / r.revenue }))
    .filter((r) => r.marginPct < LOW_MARGIN_THRESHOLD)
    .sort((a, b) => a.marginPct - b.marginPct)
    .slice(0, LEADERBOARD_SIZE);
  return { top, lowMargin };
}

// -----------------------------------------------------------------------------
// Cache. The dashboard is the same for every user, and its queries cost
// seconds on the production database, so one load serves every request for a
// short while. Concurrent requests share the in-flight load; a failed load is
// not kept. Regenerating the briefing clears it so the new text shows at once.
// -----------------------------------------------------------------------------

export const DASHBOARD_CACHE_TTL_MS = 60_000;

export type TtlCache<T> = {
  get(load: () => Promise<T>): Promise<T>;
  clear(): void;
};

export function createTtlCache<T>(ttlMs: number, now: () => number = Date.now): TtlCache<T> {
  let entry: { expiresAt: number; value: Promise<T> } | null = null;
  return {
    get(load) {
      const at = now();
      if (entry && entry.expiresAt > at) return entry.value;
      const value = load();
      const next = { expiresAt: at + ttlMs, value };
      entry = next;
      value.catch(() => {
        if (entry === next) entry = null;
      });
      return value;
    },
    clear() {
      entry = null;
    },
  };
}

const dashboardCache = createTtlCache<DashboardData>(DASHBOARD_CACHE_TTL_MS);

export function getDashboardData(): Promise<DashboardData> {
  return dashboardCache.get(loadDashboardData);
}

export function invalidateDashboardCache(): void {
  dashboardCache.clear();
}

// -----------------------------------------------------------------------------

async function loadDashboardData(): Promise<DashboardData> {
  const now = new Date();

  // ------- periods: everything else hangs off these two --------
  const [consolidated, currentPeriod] = await Promise.all([
    prisma.division.findUnique({ where: { code: "CONS" } }),
    prisma.financialPeriod.findFirst({
      orderBy: { startDate: "desc" },
      where: { status: { in: ["open", "imported", "under_review"] } },
    }),
  ]);

  const periodStart = currentPeriod?.startDate ?? new Date(now.getFullYear(), 0, 1);
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - PRODUCT_WINDOW_DAYS);

  // Most recently approved/closed period, for the prior-period comparison.
  const loadPrevious = async () => {
    const previousPeriod = await prisma.financialPeriod.findFirst({
      orderBy: { startDate: "desc" },
      where: {
        status: { in: ["approved", "closed"] },
        ...(currentPeriod ? { startDate: { lt: currentPeriod.startDate } } : {}),
      },
    });
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
    return { previousPeriod, previousSummary };
  };

  const loadProducts = async () => {
    const rows = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { not: null },
        order: { orderDate: { gte: windowStart }, status: { not: "cancelled" } },
      },
      _sum: { lineSubtotal: true, quantity: true, estimatedGrossProfit: true },
    });
    const aggregates: ProductAggregate[] = rows.flatMap((r) =>
      r.productId == null
        ? []
        : [
            {
              productId: r.productId,
              revenue: num(r._sum.lineSubtotal),
              quantity: r._sum.quantity ?? 0,
              grossProfit: num(r._sum.estimatedGrossProfit),
            },
          ],
    );
    const ranked = rankProductAggregates(aggregates);
    const ids = Array.from(new Set([...ranked.top, ...ranked.lowMargin].map((r) => r.productId)));
    const records =
      ids.length === 0
        ? []
        : await prisma.product.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, sku: true },
          });
    return { ranked, products: new Map(records.map((p) => [p.id, p])) };
  };

  const [
    { previousPeriod, previousSummary },
    currentSummary,
    trendPeriods,
    openOrders,
    exceptionOrders,
    awaitingSupplier,
    awaitingHumanReview,
    completedThisPeriod,
    cancelledThisPeriod,
    { ranked, products },
    exceptionList,
    priorityTaskRecords,
    briefing,
    campaignRecords,
  ] = await Promise.all([
    loadPrevious(),
    consolidated && currentPeriod
      ? prisma.financialSummary.findUnique({
          where: {
            financialPeriodId_divisionId: {
              financialPeriodId: currentPeriod.id,
              divisionId: consolidated.id,
            },
          },
        })
      : null,
    prisma.financialPeriod.findMany({
      orderBy: { startDate: "desc" },
      take: 6,
      include: {
        summaries: consolidated
          ? { where: { divisionId: consolidated.id } }
          : { where: { divisionId: "__none__" } },
      },
    }),
    prisma.order.count({ where: { status: { in: OPEN_ORDER_STATUSES } } }),
    prisma.order.count({ where: { exceptionStatus: { in: ["flagged", "in_review"] } } }),
    prisma.order.count({ where: { status: "awaiting_supplier" } }),
    prisma.order.count({ where: { status: "awaiting_human_review" } }),
    prisma.order.count({ where: { status: "completed", orderDate: { gte: periodStart } } }),
    prisma.order.count({ where: { status: "cancelled", orderDate: { gte: periodStart } } }),
    loadProducts(),
    prisma.order.findMany({
      where: { exceptionStatus: { in: ["flagged", "in_review"] } },
      orderBy: { orderDate: "desc" },
      include: {
        store: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true, companyName: true, email: true } },
      },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["open", "in_progress", "awaiting_approval", "blocked"] },
        OR: [
          { priority: { in: ["high", "urgent"] } },
          { dueDate: { lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3) } }, // due in next 3 days
        ],
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 6,
    }),
    prisma.aiOutput.findFirst({
      where: { module: "dashboard_briefing" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: { status: "sent" },
      orderBy: { sentAt: "desc" },
      take: 4,
      include: {
        metrics: { orderBy: { measuredAt: "desc" }, take: 1 },
      },
    }),
  ]);

  // ------- last 6 periods trend --------
  const trend = trendPeriods.reverse().map((p) => {
    const summary = p.summaries[0];
    return {
      period: p.name,
      revenue: num(summary?.revenue),
      grossProfit: num(summary?.grossProfit),
      isCurrent: currentPeriod?.id === p.id,
    };
  });

  // ------- product leaderboards --------
  const topProducts = ranked.top.flatMap((r) => {
    const p = products.get(r.productId);
    return p
      ? [{ id: p.id, name: p.name, sku: p.sku, revenue: r.revenue, quantity: r.quantity }]
      : [];
  });
  const lowMarginProducts = ranked.lowMargin.flatMap((r) => {
    const p = products.get(r.productId);
    return p
      ? [{ id: p.id, name: p.name, sku: p.sku, revenue: r.revenue, marginPct: r.marginPct }]
      : [];
  });

  // ------- exception orders --------
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
  };
}

// -----------------------------------------------------------------------------

export async function getReactivationSummary(): Promise<ReactivationSummary> {
  const now = Date.now();
  const [candidateCount, activeSegmentCount, topSegment] = await Promise.all([
    prisma.customer.count({
      where: {
        consentStatus: "subscribed",
        lastOrderAt: { lt: new Date(now - 1000 * 60 * 60 * 24 * 90) },
        reactivationScore: { gte: 50 },
      },
    }),
    prisma.customerSegment.count({
      where: { isActive: true, segmentType: "reactivation" },
    }),
    prisma.customerSegment.findFirst({
      where: { isActive: true, segmentType: "reactivation" },
      orderBy: { createdAt: "asc" },
      select: { name: true },
    }),
  ]);
  return { candidateCount, activeSegmentCount, topSegmentName: topSegment?.name ?? null };
}
