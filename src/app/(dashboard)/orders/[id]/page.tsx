import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ClipboardList, MessageSquare } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import {
  ExceptionStatusBadge,
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
  SupplierStatusBadge,
} from "@/components/data/OrderBadges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatDateTime, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { customerDisplayName } from "@/server/services/customers";
import { getOrderById, getRelatedTasks, type OrderNote } from "@/server/services/orders";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { AddNoteForm, ResolveExceptionForm, UpdateStatusForm } from "./order-actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);
  return { title: order ? `Order ${order.orderNumber}` : "Order" };
}

export default async function OrderDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.ORDERS_VIEW);
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const tasks = await getRelatedTasks(order.id);
  const canUpdate = userHasPermission(user, PERMISSIONS.ORDERS_UPDATE);
  const canResolveException = userHasPermission(user, PERMISSIONS.ORDERS_MANAGE_EXCEPTIONS);
  const exceptionOpen =
    order.exceptionStatus === "flagged" || order.exceptionStatus === "in_review";

  const metadata = (order.metadata ?? null) as { notes?: OrderNote[] } | null;
  const notes: OrderNote[] = Array.isArray(metadata?.notes) ? metadata.notes : [];

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`${order.store.name} • ${formatDateTime(order.orderDate)}`}
        breadcrumb={
          <Link href="/orders" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Orders
          </Link>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
            <FulfillmentStatusBadge status={order.fulfillmentStatus} />
            <SupplierStatusBadge status={order.supplierStatus} />
            <ExceptionStatusBadge status={order.exceptionStatus} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {order.exceptionReason && (
            <Card
              className={
                exceptionOpen ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5"
              }
            >
              <CardHeader className="pb-3">
                <CardTitle
                  className={
                    exceptionOpen
                      ? "flex items-center gap-2 text-base text-warning"
                      : "flex items-center gap-2 text-base text-success"
                  }
                >
                  <AlertTriangle className="h-4 w-4" />
                  {exceptionOpen ? "Exception" : "Exception (resolved)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="whitespace-pre-wrap leading-relaxed">{order.exceptionReason}</p>
                {exceptionOpen && canResolveException && (
                  <div className="border-t pt-3">
                    <ResolveExceptionForm orderId={order.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {canUpdate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Update order status</CardTitle>
              </CardHeader>
              <CardContent>
                <UpdateStatusForm orderId={order.id} currentStatus={order.status} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Line items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>Product</TH>
                    <TH align="right">Qty</TH>
                    <TH align="right">Unit price</TH>
                    <TH align="right">Unit cost</TH>
                    <TH align="right">Margin</TH>
                    <TH>Supplier</TH>
                    <TH align="right">Line total</TH>
                  </tr>
                </THead>
                <TBody>
                  {order.items.map((it) => (
                    <TR key={it.id}>
                      <TD>
                        <div className="font-medium">{it.productName}</div>
                        <div className="text-xs text-muted-foreground">{it.sku}</div>
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {it.quantity}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {formatCurrency(it.unitPrice, order.currency)}
                      </TD>
                      <TD align="right" className="tabular-nums text-muted-foreground">
                        {it.unitCost != null ? formatCurrency(it.unitCost, order.currency) : "—"}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {it.estimatedGrossMargin != null
                          ? formatPercent(it.estimatedGrossMargin, 1)
                          : "—"}
                      </TD>
                      <TD className="text-muted-foreground">
                        {it.supplier ? (
                          <span>
                            {it.supplier.name}
                            {it.supplierProduct?.supplierSku && (
                              <span className="ml-1 text-xs">
                                ({it.supplierProduct.supplierSku})
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TD>
                      <TD align="right" className="font-medium tabular-nums">
                        {formatCurrency(it.lineTotal, order.currency)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order totals</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                <Total label="Subtotal" value={formatCurrency(order.subtotal, order.currency)} />
                {order.discountTotal > 0 && (
                  <Total
                    label="Discount"
                    value={`-${formatCurrency(order.discountTotal, order.currency)}`}
                  />
                )}
                <Total
                  label="Shipping"
                  value={formatCurrency(order.shippingTotal, order.currency)}
                />
                <Total label="Tax (HST)" value={formatCurrency(order.taxTotal, order.currency)} />
                <Total
                  label="Grand total"
                  value={formatCurrency(order.grandTotal, order.currency)}
                  emphasis
                />
                <Total
                  label="Estimated GP"
                  value={
                    order.estimatedGrossProfit != null
                      ? formatCurrency(order.estimatedGrossProfit, order.currency)
                      : "—"
                  }
                />
                <Total
                  label="Estimated GM"
                  value={
                    order.estimatedGrossMargin != null
                      ? formatPercent(order.estimatedGrossMargin, 1)
                      : "—"
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> Internal notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No notes yet. Add the first one below.
                </p>
              ) : (
                <ul className="divide-y">
                  {notes.map((n) => (
                    <li key={n.id} className="space-y-1 py-3 first:pt-0">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.text}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {n.authorName ?? "Unknown"} • {formatDateTime(n.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {canUpdate && (
                <div className="border-t pt-3">
                  <AddNoteForm orderId={order.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {order.customer ? (
                <>
                  <Link
                    href={`/customers/${order.customer.id}`}
                    className="font-medium hover:underline"
                  >
                    {customerDisplayName(order.customer)}
                  </Link>
                  {order.customer.email && (
                    <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    {order.customer.customerType}
                  </Badge>
                </>
              ) : (
                <p className="text-muted-foreground">No customer linked</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Source & store</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Store" value={order.store.name} />
              <Row label="Division" value={order.division?.name ?? "—"} />
              <Row
                label="Source system"
                value={
                  order.sourceSystem ? `${order.sourceSystem} (${order.sourceId ?? "n/a"})` : "—"
                }
              />
              <Row label="Currency" value={order.currency} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4" /> Related tasks
              </CardTitle>
              <Link
                href={{
                  pathname: "/tasks/new",
                  query: {
                    relatedEntityType: "Order",
                    relatedEntityId: order.id,
                    title: `Follow up on order ${order.orderNumber}`,
                  },
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                + New
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground">No tasks linked to this order.</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((t) => (
                    <li key={t.id} className="rounded border bg-muted/20 p-2">
                      <Link
                        href={`/tasks/${t.id}`}
                        className="flex items-start justify-between gap-2"
                      >
                        <span className="font-medium hover:underline">{t.title}</span>
                        <Badge variant={t.priority === "urgent" ? "destructive" : "secondary"}>
                          {t.priority}
                        </Badge>
                      </Link>
                      {t.dueDate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due {formatDate(t.dueDate)} • {t.status.replace("_", " ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Total({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={emphasis ? "text-lg font-semibold tabular-nums" : "text-sm tabular-nums"}>
        {value}
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
