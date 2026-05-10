import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "received",
  "processing",
  "awaiting_supplier",
  "in_supplier_queue",
  "awaiting_human_review",
  "shipped",
];

export type ListSuppliersFilters = {
  search?: string;
};

export async function listSuppliers(filters: ListSuppliersFilters = {}) {
  const where: Prisma.SupplierWhereInput = { deletedAt: null };
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { supplierProducts: true } },
    },
  });

  // Active + delayed order counts per supplier (single grouped query)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activeRows = await prisma.orderItem.groupBy({
    by: ["supplierId"],
    where: {
      supplierId: { not: null },
      order: { status: { in: ACTIVE_ORDER_STATUSES } },
    },
    _count: true,
  });
  const activeMap = new Map(activeRows.map((r) => [r.supplierId ?? "", r._count]));

  const delayedRows = await prisma.orderItem.groupBy({
    by: ["supplierId"],
    where: {
      supplierId: { not: null },
      order: { status: { in: ACTIVE_ORDER_STATUSES }, orderDate: { lt: sevenDaysAgo } },
    },
    _count: true,
  });
  const delayedMap = new Map(delayedRows.map((r) => [r.supplierId ?? "", r._count]));

  const exceptionRows = await prisma.orderItem.groupBy({
    by: ["supplierId"],
    where: {
      supplierId: { not: null },
      order: { exceptionStatus: { in: ["flagged", "in_review"] } },
    },
    _count: true,
  });
  const exceptionMap = new Map(exceptionRows.map((r) => [r.supplierId ?? "", r._count]));

  return suppliers.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    type: s.type,
    portalUrl: s.portalUrl,
    websiteUrl: s.websiteUrl,
    apiAvailable: s.apiAvailable,
    automationAvailable: s.automationAvailable,
    status: s.status,
    primaryContactName: s.primaryContactName,
    primaryContactEmail: s.primaryContactEmail,
    productCount: s._count.supplierProducts,
    activeOrderItems: activeMap.get(s.id) ?? 0,
    delayedOrderItems: delayedMap.get(s.id) ?? 0,
    exceptionOrderItems: exceptionMap.get(s.id) ?? 0,
  }));
}

export type SupplierListRow = Awaited<ReturnType<typeof listSuppliers>>[number];

export async function getSupplierById(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      supplierProducts: {
        orderBy: [{ isPreferred: "desc" }, { supplierSku: "asc" }],
        include: {
          product: { select: { id: true, name: true, sku: true } },
          productVariant: { select: { id: true, sku: true } },
        },
      },
    },
  });
  if (!supplier) return null;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // ---- recent + active orders touching this supplier ----
  const orderItems = await prisma.orderItem.findMany({
    where: {
      supplierId: id,
      order: { orderDate: { gte: ninetyDaysAgo } },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true,
          exceptionStatus: true,
          grandTotal: true,
          currency: true,
          store: { select: { name: true } },
          customer: {
            select: { firstName: true, lastName: true, companyName: true, email: true },
          },
        },
      },
    },
    orderBy: { order: { orderDate: "desc" } },
  });

  // Dedupe to one row per order (a supplier may touch multiple line items per order)
  const seen = new Set<string>();
  const recentOrders: {
    id: string;
    orderNumber: string;
    orderDate: string;
    status: string;
    exceptionStatus: string;
    grandTotal: number;
    currency: string;
    storeName: string;
    customerLabel: string;
  }[] = [];
  for (const it of orderItems) {
    if (seen.has(it.order.id)) continue;
    seen.add(it.order.id);
    const c = it.order.customer;
    const customerLabel = c
      ? (c.companyName ?? [c.firstName, c.lastName].filter(Boolean).join(" ") ?? c.email ?? "—")
      : "—";
    recentOrders.push({
      id: it.order.id,
      orderNumber: it.order.orderNumber,
      orderDate: it.order.orderDate.toISOString(),
      status: it.order.status,
      exceptionStatus: it.order.exceptionStatus,
      grandTotal: num(it.order.grandTotal),
      currency: it.order.currency,
      storeName: it.order.store.name,
      customerLabel,
    });
  }

  // ---- 90-day cost performance ----
  const completedItems = orderItems.filter(
    (it) => it.order.status === "completed" || it.order.status === "delivered",
  );
  const totalSpend = completedItems.reduce((sum, it) => sum + num(it.unitCost) * it.quantity, 0);

  return {
    ...supplier,
    supplierProducts: supplier.supplierProducts.map((sp) => ({
      ...sp,
      cost: num(sp.cost),
    })),
    recentOrders: recentOrders.slice(0, 25),
    metrics: {
      activeOrderCount: recentOrders.filter((o) =>
        (ACTIVE_ORDER_STATUSES as readonly string[]).includes(o.status),
      ).length,
      completedOrderCount: completedItems.length,
      ninetyDaySpend: totalSpend,
      productMappingCount: supplier.supplierProducts.length,
      preferredMappingCount: supplier.supplierProducts.filter((sp) => sp.isPreferred).length,
    },
  };
}

export type SupplierDetail = NonNullable<Awaited<ReturnType<typeof getSupplierById>>>;
