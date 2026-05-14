import { revalidatePath } from "next/cache";

import type { OrderStatus, Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
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

/** Total Order rows matching filters (NOT capped — used for the page header). */
export async function countOrders(filters: ListOrdersFilters = {}): Promise<number> {
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
  return prisma.order.count({ where });
}

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

// -----------------------------------------------------------------------------
// Mutations — operational accountability per docs/02 §5.3 + §5.2
// -----------------------------------------------------------------------------

export type OrderNote = {
  id: string;
  text: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
};

export async function updateOrderStatus(args: {
  orderId: string;
  newStatus: OrderStatus;
  actorUserId: string;
}) {
  const before = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: { id: true, orderNumber: true, status: true, fulfillmentStatus: true },
  });
  if (!before) throw new Error("Order not found.");
  if (before.status === args.newStatus) return before;

  // Convenience: completed/delivered orders should also be marked fulfilled.
  const fulfillmentStatus =
    args.newStatus === "completed" || args.newStatus === "delivered"
      ? ("fulfilled" as const)
      : args.newStatus === "cancelled" || args.newStatus === "refunded"
        ? before.fulfillmentStatus
        : before.fulfillmentStatus;

  const updated = await prisma.order.update({
    where: { id: args.orderId },
    data: { status: args.newStatus, fulfillmentStatus },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "order.status_change",
    entityType: "Order",
    entityId: updated.id,
    beforeData: { status: before.status, fulfillmentStatus: before.fulfillmentStatus },
    afterData: { status: updated.status, fulfillmentStatus: updated.fulfillmentStatus },
  });

  revalidatePath(`/orders/${updated.id}`);
  revalidatePath("/orders");
  revalidatePath("/operations");
  return updated;
}

export async function resolveOrderException(args: {
  orderId: string;
  resolutionNote: string;
  actorUserId: string;
}) {
  const before = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: { id: true, orderNumber: true, exceptionStatus: true, exceptionReason: true },
  });
  if (!before) throw new Error("Order not found.");
  if (before.exceptionStatus === "resolved" || before.exceptionStatus === "none") {
    return before;
  }

  const trimmed = args.resolutionNote.trim();
  if (!trimmed) throw new Error("Resolution note is required.");

  const resolutionLine = `[Resolved ${new Date().toISOString().slice(0, 10)}] ${trimmed}`;
  const newReason = before.exceptionReason
    ? `${before.exceptionReason}\n\n${resolutionLine}`
    : resolutionLine;

  const updated = await prisma.order.update({
    where: { id: args.orderId },
    data: { exceptionStatus: "resolved", exceptionReason: newReason },
  });

  // Mirror resolution into the central Exception table so the operations
  // exception queue stays in sync. Best-effort — if no row exists nothing
  // happens, which is fine.
  await prisma.exception.updateMany({
    where: {
      entityType: "order",
      entityId: args.orderId,
      status: { in: ["open", "investigating", "blocked"] },
    },
    data: {
      status: "resolved",
      resolvedById: args.actorUserId,
      resolvedAt: new Date(),
      resolutionNotes: trimmed,
    },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "order.exception_resolved",
    entityType: "Order",
    entityId: updated.id,
    beforeData: { exceptionStatus: before.exceptionStatus },
    afterData: { exceptionStatus: updated.exceptionStatus, resolution: trimmed },
  });

  revalidatePath(`/orders/${updated.id}`);
  revalidatePath("/orders");
  revalidatePath("/operations");
  revalidatePath("/operations/exceptions");
  return updated;
}

export async function addOrderNote(args: { orderId: string; text: string; actorUserId: string }) {
  const trimmed = args.text.trim();
  if (!trimmed) throw new Error("Note cannot be empty.");

  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: { id: true, metadata: true },
  });
  if (!order) throw new Error("Order not found.");

  const actor = await prisma.user.findUnique({
    where: { id: args.actorUserId },
    select: { name: true, email: true },
  });

  const existing = (order.metadata as Prisma.JsonObject | null) ?? {};
  const existingNotes = Array.isArray(existing.notes) ? (existing.notes as OrderNote[]) : [];
  const note: OrderNote = {
    id: crypto.randomUUID(),
    text: trimmed,
    authorId: args.actorUserId,
    authorName: actor?.name ?? actor?.email ?? null,
    createdAt: new Date().toISOString(),
  };
  const newMetadata = { ...existing, notes: [...existingNotes, note] };

  await prisma.order.update({
    where: { id: args.orderId },
    data: { metadata: newMetadata as Prisma.InputJsonValue },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "order.note_added",
    entityType: "Order",
    entityId: args.orderId,
    afterData: { notePreview: trimmed.slice(0, 100) },
  });

  revalidatePath(`/orders/${args.orderId}`);
  return note;
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
