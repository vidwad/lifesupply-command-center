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
import { AssistantPageContext } from "@/components/ai/assistant/page-context";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import {
  countOrders,
  listOrders,
  ORDERS_PAGE_SIZE,
  type ListOrdersFilters,
} from "@/server/services/orders";
import { Pagination } from "@/components/data/Pagination";
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

type SearchParams = {
  status?: string;
  q?: string;
  exceptions?: string;
  page?: string;
  /** The app shell's Division selector, as `context-params.ts` writes it. */
  division?: string;
};

/**
 * The page's own filters plus the shell's division, for every link and form
 * the page builds (2026-11-03). Before this, a status chip, the search box
 * or the next page rebuilt the address without the division, so the
 * selector appeared to have no effect on this screen.
 */
function carried(params: SearchParams): Record<string, string | undefined> {
  return {
    status: params.status || undefined,
    q: params.q || undefined,
    exceptions: params.exceptions || undefined,
    division: params.division?.trim() || undefined,
  };
}

/** The query string for a set of filters, empty when none apply. */
function queryString(entries: Record<string, string | undefined>): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) if (value) next.set(key, value);
  const s = next.toString();
  return s ? `?${s}` : "";
}

function ordersHref(entries: Record<string, string | undefined>): string {
  return `/orders${queryString(entries)}`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.ORDERS_VIEW);
  const params = await searchParams;
  const canExport = userHasPermission(user, PERMISSIONS.ORDERS_EXPORT);

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const filters: ListOrdersFilters = {
    status: STATUS_FILTERS.some((s) => s.value === params.status)
      ? (params.status as ListOrdersFilters["status"])
      : undefined,
    search: params.q?.trim() || undefined,
    exceptionsOnly: params.exceptions === "1",
    // Honours the Division selector in the app shell. Absent = all divisions.
    divisionId: params.division?.trim() || undefined,
    page,
  };
  const carry = carried(params);

  const [orders, totalOrders] = await Promise.all([listOrders(filters), countOrders(filters)]);
  const activeStatus = filters.status ?? "";

  return (
    <div>
      <AssistantPageContext
        value={{
          route: "/orders",
          title: "Orders",
          filters: {
            ...(filters.status && { status: filters.status }),
            ...(filters.exceptionsOnly && { exceptions: "only" }),
            ...(filters.search && { search: filters.search }),
            page: String(page),
          },
          divisionId: filters.divisionId,
          figures: [{ label: "Orders matching", value: totalOrders.toLocaleString() }],
        }}
      />
      <PageHeader
        title="Orders"
        description="Normalized order management across BigCommerce stores."
        breadcrumb={`${totalOrders.toLocaleString()} ${totalOrders === 1 ? "order" : "orders"}`}
        actions={
          <div className="flex items-center gap-3">
            <SyncButtons entity="orders" />
            {canExport ? (
              <ExportButton
                href={`/api/exports/orders${queryString({ status: carry.status, exceptions: carry.exceptions, division: carry.division })}`}
              />
            ) : null}
          </div>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const isActive = activeStatus === f.value;
            const href = ordersHref({ ...carry, status: f.value || undefined });
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
          <ExceptionsToggle active={!!filters.exceptionsOnly} carry={carry} />
          <form action="/orders" className="ml-auto flex items-center gap-2">
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            {filters.exceptionsOnly && <input type="hidden" name="exceptions" value="1" />}
            {carry.division && <input type="hidden" name="division" value={carry.division} />}
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

        <Pagination
          basePath="/orders"
          page={page}
          pageSize={ORDERS_PAGE_SIZE}
          totalCount={totalOrders}
          params={carry}
        />
      </div>
    </div>
  );
}

function ExceptionsToggle({
  active,
  carry,
}: {
  active: boolean;
  carry: Record<string, string | undefined>;
}) {
  const href = ordersHref({ ...carry, exceptions: active ? undefined : "1" });
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
