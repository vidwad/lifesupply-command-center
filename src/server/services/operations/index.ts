import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

function customerLabel(
  c: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
  } | null,
): string {
  if (!c) return "—";
  if (c.companyName) return c.companyName;
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  if (name) return name;
  return c.email ?? "—";
}

export type OperationsView =
  | "needs_attention"
  | "new"
  | "awaiting_supplier"
  | "needs_review"
  | "in_automation"
  | "delayed"
  | "completed_today"
  | "cancelled";

const STATUS_BY_VIEW: Record<OperationsView, OrderStatus[]> = {
  needs_attention: ["awaiting_supplier", "in_supplier_queue", "awaiting_human_review"],
  new: ["received"],
  awaiting_supplier: ["awaiting_supplier"],
  needs_review: ["awaiting_human_review"],
  in_automation: ["in_supplier_queue"],
  delayed: [
    "received",
    "processing",
    "awaiting_supplier",
    "in_supplier_queue",
    "awaiting_human_review",
  ],
  completed_today: ["completed", "delivered"],
  cancelled: ["cancelled", "refunded"],
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "received",
  "processing",
  "awaiting_supplier",
  "in_supplier_queue",
  "awaiting_human_review",
  "shipped",
];

export type OperationsDashboard = {
  view: OperationsView;
  counts: {
    needsAttention: number;
    new: number;
    awaitingSupplier: number;
    needsReview: number;
    inAutomation: number;
    delayed: number;
    completedToday: number;
    cancelled: number;
    flaggedExceptions: number;
  };
  queue: {
    id: string;
    orderNumber: string;
    orderDate: string;
    storeName: string;
    customerLabel: string;
    customerId: string | null;
    grandTotal: number;
    currency: string;
    status: OrderStatus;
    paymentStatus: string;
    fulfillmentStatus: string;
    supplierStatus: string;
    exceptionStatus: string;
    exceptionReason: string | null;
    daysOpen: number;
    primarySupplier: { code: string; name: string } | null;
    openTaskCount: number;
  }[];
  exceptions: {
    id: string;
    orderNumber: string;
    storeName: string;
    customerLabel: string;
    grandTotal: number;
    currency: string;
    exceptionStatus: string;
    exceptionReason: string | null;
    orderDate: string;
  }[];
  supplierBreakdown: {
    code: string;
    name: string;
    activeOrderCount: number;
    activeOrderValue: number;
  }[];
};

export async function getOperationsDashboard(args: {
  view?: OperationsView;
  storeId?: string;
}): Promise<OperationsDashboard> {
  const view = args.view ?? "needs_attention";
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // ---- counts (always full, not affected by storeId) ----
  const [
    needsAttentionCount,
    newCount,
    awaitingSupplierCount,
    needsReviewCount,
    inAutomationCount,
    delayedCount,
    completedTodayCount,
    cancelledCount,
    flaggedExceptionsCount,
  ] = await Promise.all([
    prisma.order.count({ where: { status: { in: STATUS_BY_VIEW.needs_attention } } }),
    prisma.order.count({ where: { status: "received" } }),
    prisma.order.count({ where: { status: "awaiting_supplier" } }),
    prisma.order.count({ where: { status: "awaiting_human_review" } }),
    prisma.order.count({ where: { status: "in_supplier_queue" } }),
    prisma.order.count({
      where: { status: { in: ACTIVE_STATUSES }, orderDate: { lt: sevenDaysAgo } },
    }),
    prisma.order.count({
      where: {
        status: { in: ["completed", "delivered"] },
        updatedAt: { gte: today },
      },
    }),
    prisma.order.count({ where: { status: { in: ["cancelled", "refunded"] } } }),
    prisma.order.count({ where: { exceptionStatus: { in: ["flagged", "in_review"] } } }),
  ]);

  // ---- queue rows (filtered by view + optional store) ----
  const queueWhere: Prisma.OrderWhereInput = {};
  if (view === "delayed") {
    queueWhere.status = { in: STATUS_BY_VIEW.delayed };
    queueWhere.orderDate = { lt: sevenDaysAgo };
  } else if (view === "completed_today") {
    queueWhere.status = { in: STATUS_BY_VIEW.completed_today };
    queueWhere.updatedAt = { gte: today };
  } else {
    queueWhere.status = { in: STATUS_BY_VIEW[view] };
  }
  if (args.storeId) queueWhere.storeId = args.storeId;

  const queueRows = await prisma.order.findMany({
    where: queueWhere,
    orderBy: [{ exceptionStatus: "asc" }, { orderDate: "asc" }],
    take: 100,
    include: {
      store: { select: { name: true } },
      customer: {
        select: { id: true, firstName: true, lastName: true, companyName: true, email: true },
      },
      items: {
        select: {
          supplier: { select: { code: true, name: true } },
        },
        take: 1,
      },
    },
  });

  // Open task counts per queued order (avoid N+1 by grouping)
  const queueIds = queueRows.map((o) => o.id);
  const taskGroups =
    queueIds.length > 0
      ? await prisma.task.groupBy({
          by: ["relatedEntityId"],
          where: {
            relatedEntityType: "Order",
            relatedEntityId: { in: queueIds },
            status: { in: ["open", "in_progress", "blocked", "awaiting_approval"] },
          },
          _count: { _all: true },
        })
      : [];
  const taskCountByOrderId = new Map(
    taskGroups.map((g) => [g.relatedEntityId ?? "", g._count._all]),
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const queue = queueRows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    orderDate: o.orderDate.toISOString(),
    storeName: o.store.name,
    customerLabel: customerLabel(o.customer),
    customerId: o.customer?.id ?? null,
    grandTotal: num(o.grandTotal),
    currency: o.currency,
    status: o.status,
    paymentStatus: o.paymentStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    supplierStatus: o.supplierStatus,
    exceptionStatus: o.exceptionStatus,
    exceptionReason: o.exceptionReason,
    daysOpen: Math.max(0, Math.floor((now.getTime() - o.orderDate.getTime()) / msPerDay)),
    primarySupplier: o.items[0]?.supplier ?? null,
    openTaskCount: taskCountByOrderId.get(o.id) ?? 0,
  }));

  // ---- exceptions panel (always shown, independent of selected view) ----
  const exceptionRows = await prisma.order.findMany({
    where: { exceptionStatus: { in: ["flagged", "in_review"] } },
    orderBy: { orderDate: "desc" },
    take: 8,
    include: {
      store: { select: { name: true } },
      customer: {
        select: { firstName: true, lastName: true, companyName: true, email: true },
      },
    },
  });
  const exceptions = exceptionRows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    storeName: o.store.name,
    customerLabel: customerLabel(o.customer),
    grandTotal: num(o.grandTotal),
    currency: o.currency,
    exceptionStatus: o.exceptionStatus,
    exceptionReason: o.exceptionReason,
    orderDate: o.orderDate.toISOString(),
  }));

  // ---- supplier breakdown (active orders touching each supplier) ----
  const supplierItemRows = await prisma.orderItem.findMany({
    where: {
      supplierId: { not: null },
      order: { status: { in: ACTIVE_STATUSES } },
    },
    select: {
      supplier: { select: { code: true, name: true } },
      order: { select: { id: true, grandTotal: true } },
    },
  });
  const supplierAgg = new Map<
    string,
    { code: string; name: string; orderIds: Set<string>; value: number }
  >();
  for (const row of supplierItemRows) {
    if (!row.supplier) continue;
    const key = row.supplier.code;
    let entry = supplierAgg.get(key);
    if (!entry) {
      entry = { code: row.supplier.code, name: row.supplier.name, orderIds: new Set(), value: 0 };
      supplierAgg.set(key, entry);
    }
    if (!entry.orderIds.has(row.order.id)) {
      entry.orderIds.add(row.order.id);
      entry.value += num(row.order.grandTotal);
    }
  }
  const supplierBreakdown = Array.from(supplierAgg.values())
    .map((s) => ({
      code: s.code,
      name: s.name,
      activeOrderCount: s.orderIds.size,
      activeOrderValue: s.value,
    }))
    .sort((a, b) => b.activeOrderCount - a.activeOrderCount);

  return {
    view,
    counts: {
      needsAttention: needsAttentionCount,
      new: newCount,
      awaitingSupplier: awaitingSupplierCount,
      needsReview: needsReviewCount,
      inAutomation: inAutomationCount,
      delayed: delayedCount,
      completedToday: completedTodayCount,
      cancelled: cancelledCount,
      flaggedExceptions: flaggedExceptionsCount,
    },
    queue,
    exceptions,
    supplierBreakdown,
  };
}

export async function listActiveStores() {
  return prisma.store.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
