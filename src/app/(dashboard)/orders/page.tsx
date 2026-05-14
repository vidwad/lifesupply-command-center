import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { ExportButton } from "@/components/data/ExportButton";
import {
  ExceptionStatusBadge,
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/data/OrderBadges";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import {
  countOrders,
  listOrders,
  type ListOrdersFilters,
} from "@/server/services/orders";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { SyncButtons } from "@/components/sync/SyncButtons";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Awaiting supplier", value: "awaiting_supplier" },
  { label: "Needs review", value: "awaiting_human_review" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
] as const;

type SearchParams = { status?: string; q?: string; exceptions?: string };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.ORDERS_VIEW);
  const params = await searchParams;
  const canExport = userHasPermission(user, PERMISSIONS.ORDERS_EXPORT);

  const filters: ListOrdersFilters = {
    status: STATUS_FILTERS.some((s) => s.value === params.status)
      ? (params.status as ListOrdersFilters["status"])
      : undefined,
    search: params.q?.trim() || undefined,
    exceptionsOnly: params.exceptions === "1",
  };

  const [orders, totalOrders] = await Promise.all([
    listOrders(filters),
    countOrders(filters),
  ]);
  const activeStatus = filters.status ?? "";
  const showingCapped = totalOrders > orders.length;

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Normalized order management across BigCommerce stores."
        breadcrumb={
          showingCapped
            ? `${totalOrders.toLocaleString()} orders (showing first ${orders.length.toLocaleString()})`
            : `${totalOrders.toLocaleString()} ${totalOrders === 1 ? "order" : "orders"}`
        }
        actions={
          <div className="flex items-center gap-3">
            <SyncButtons entity="orders" />
            {canExport ? (
              <ExportButton
                href={`/api/exports/orders${params.status || params.exceptions ? `?${new URLSearchParams({ ...(params.status && { status: params.status }), ...(params.exceptions && { exceptions: params.exceptions }) }).toString()}` : ""}`}
              />
            ) : null}
          </div>
        }
      />

      <div className="space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const isActive = activeStatus === f.value;
            const next = new URLSearchParams();
            if (f.value) next.set("status", f.value);
            if (params.q) next.set("q", params.q);
            if (params.exceptions) next.set("exceptions", params.exceptions);
            const href = `/orders${next.toString() ? `?${next}` : ""}`;
            return (
              <Link
                key={f.value || "all"}
                href={href}
                className={
                  isActive
                    ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                }
              >
                {f.label}
              </Link>
            );
          })}
          <ExceptionsToggle active={!!filters.exceptionsOnly} status={activeStatus} q={params.q} />
          <form action="/orders" className="ml-auto flex items-center gap-2">
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            {filters.exceptionsOnly && <input type="hidden" name="exceptions" value="1" />}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search order # or customer…"
              className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders match these filters"
            description="Adjust filters or run pnpm db:seed to populate sample orders."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Date</TH>
                <TH>Store</TH>
                <TH>Customer</TH>
                <TH align="right">Total</TH>
                <TH align="right">Margin</TH>
                <TH>Status</TH>
                <TH>Payment</TH>
                <TH>Fulfillment</TH>
                <TH>Flags</TH>
              </tr>
            </THead>
            <TBody>
              {orders.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                      {o.orderNumber}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                    </div>
                  </TD>
                  <TD className="text-muted-foreground">{formatDate(o.orderDate)}</TD>
                  <TD className="text-muted-foreground">{o.store.name}</TD>
                  <TD>
                    {o.customerId ? (
                      <Link href={`/customers/${o.customerId}`} className="hover:underline">
                        {o.customerLabel}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{o.customerLabel}</span>
                    )}
                  </TD>
                  <TD align="right" className="font-medium tabular-nums">
                    {formatCurrency(o.grandTotal, o.currency)}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {o.estimatedGrossMargin != null
                      ? formatPercent(o.estimatedGrossMargin, 1)
                      : "—"}
                  </TD>
                  <TD>
                    <OrderStatusBadge status={o.status} />
                  </TD>
                  <TD>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </TD>
                  <TD>
                    <FulfillmentStatusBadge status={o.fulfillmentStatus} />
                  </TD>
                  <TD>
                    <ExceptionStatusBadge status={o.exceptionStatus} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}

function ExceptionsToggle({ active, status, q }: { active: boolean; status: string; q?: string }) {
  const next = new URLSearchParams();
  if (status) next.set("status", status);
  if (q) next.set("q", q);
  if (!active) next.set("exceptions", "1");
  const href = `/orders${next.toString() ? `?${next}` : ""}`;
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground"
          : "rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
      }
    >
      Exceptions only
    </Link>
  );
}
