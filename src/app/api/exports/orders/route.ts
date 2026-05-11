import { OrderStatus, type Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

const VALID_ORDER_STATUSES = new Set<string>(Object.values(OrderStatus));

export async function GET(req: Request) {
  const actor = await requirePermission(PERMISSIONS.ORDERS_EXPORT);
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && VALID_ORDER_STATUSES.has(statusParam) ? (statusParam as OrderStatus) : undefined;
  const exceptionsOnly = searchParams.get("exceptions") === "1";

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(exceptionsOnly ? { exceptionStatus: { not: "none" } } : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderDate: "desc" },
    include: {
      store: { select: { name: true } },
      customer: { select: { email: true, firstName: true, lastName: true, companyName: true } },
      _count: { select: { items: true } },
    },
    take: 5000,
  });

  const csv = toCsv({
    headers: [
      { key: "orderNumber", label: "Order #", get: (o) => o.orderNumber },
      { key: "orderDate", label: "Order Date", get: (o) => o.orderDate.toISOString().slice(0, 10) },
      { key: "store", label: "Store", get: (o) => o.store.name },
      {
        key: "customer",
        label: "Customer",
        get: (o) => {
          if (o.customer?.companyName) return o.customer.companyName;
          const fullName = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(" ");
          if (fullName) return fullName;
          return o.customer?.email ?? "";
        },
      },
      { key: "email", label: "Email", get: (o) => o.customer?.email ?? "" },
      { key: "status", label: "Status", get: (o) => o.status },
      { key: "paymentStatus", label: "Payment", get: (o) => o.paymentStatus },
      { key: "fulfillmentStatus", label: "Fulfillment", get: (o) => o.fulfillmentStatus },
      { key: "exceptionStatus", label: "Exception", get: (o) => o.exceptionStatus },
      { key: "items", label: "Items", get: (o) => o._count.items },
      { key: "subtotal", label: "Subtotal", get: (o) => o.subtotal.toString() },
      { key: "discountTotal", label: "Discount", get: (o) => o.discountTotal.toString() },
      { key: "shippingTotal", label: "Shipping", get: (o) => o.shippingTotal.toString() },
      { key: "taxTotal", label: "Tax", get: (o) => o.taxTotal.toString() },
      { key: "grandTotal", label: "Grand Total", get: (o) => o.grandTotal.toString() },
      { key: "currency", label: "Currency", get: (o) => o.currency },
      {
        key: "estimatedGrossMargin",
        label: "Est Margin",
        get: (o) => (o.estimatedGrossMargin ? o.estimatedGrossMargin.toString() : ""),
      },
    ],
    rows: orders,
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "export.orders.csv",
    entityType: "order",
    afterData: { rows: orders.length, status, exceptionsOnly },
  });

  return csvResponse(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
