import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type ListOrdersFilters = {
  status?: OrderStatus;
  storeId?: string;
  exceptionsOnly?: boolean;
  search?: string;
};

const num = (d: Prisma.Decimal | null | undefined): number => (d == null ? 0 : Number(d));

export async function listOrders(filters: ListOrdersFilters = {}) {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.exceptionsOnly) where.exceptionStatus = { in: ["flagged", "in_review"] };
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { customer: { companyName: { contains: q, mode: "insensitive" } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderDate: "desc" },
    take: 100,
    include: {
      store: { select: { id: true, name: true } },
      customer: {
        select: { id: true, firstName: true, lastName: true, companyName: true, email: true },
      },
      _count: { select: { items: true } },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    orderDate: o.orderDate,
    status: o.status,
    paymentStatus: o.paymentStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    supplierStatus: o.supplierStatus,
    exceptionStatus: o.exceptionStatus,
    grandTotal: num(o.grandTotal),
    estimatedGrossMargin: o.estimatedGrossMargin == null ? null : Number(o.estimatedGrossMargin),
    currency: o.currency,
    itemCount: o._count.items,
    store: o.store,
    customerLabel: customerLabel(o.customer),
    customerId: o.customer?.id ?? null,
  }));
}

export type OrderListRow = Awaited<ReturnType<typeof listOrders>>[number];

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      store: true,
      division: true,
      customer: true,
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
          productVariant: { select: { id: true, sku: true, optionSummary: true } },
          supplier: { select: { id: true, name: true, code: true } },
          supplierProduct: { select: { id: true, supplierSku: true, cost: true } },
        },
      },
    },
  });
  if (!order) return null;

  return {
    ...order,
    grandTotal: num(order.grandTotal),
    subtotal: num(order.subtotal),
    shippingTotal: num(order.shippingTotal),
    taxTotal: num(order.taxTotal),
    discountTotal: num(order.discountTotal),
    estimatedGrossProfit:
      order.estimatedGrossProfit == null ? null : Number(order.estimatedGrossProfit),
    estimatedGrossMargin:
      order.estimatedGrossMargin == null ? null : Number(order.estimatedGrossMargin),
    items: order.items.map((it) => ({
      ...it,
      unitPrice: num(it.unitPrice),
      unitCost: it.unitCost == null ? null : Number(it.unitCost),
      lineSubtotal: num(it.lineSubtotal),
      lineTax: num(it.lineTax),
      lineTotal: num(it.lineTotal),
      estimatedGrossProfit:
        it.estimatedGrossProfit == null ? null : Number(it.estimatedGrossProfit),
      estimatedGrossMargin:
        it.estimatedGrossMargin == null ? null : Number(it.estimatedGrossMargin),
      supplierCost: it.supplierProduct?.cost == null ? null : Number(it.supplierProduct.cost),
    })),
    customerLabel: customerLabel(order.customer),
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

export async function getRelatedTasks(orderId: string) {
  return prisma.task.findMany({
    where: { relatedEntityType: "Order", relatedEntityId: orderId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      assignedToId: true,
    },
  });
}

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
