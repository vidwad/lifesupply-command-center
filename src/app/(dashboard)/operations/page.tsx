import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Inbox,
  Truck,
  XCircle,
} from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import {
  ExceptionStatusBadge,
  OrderStatusBadge,
  SupplierStatusBadge,
} from "@/components/data/OrderBadges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  getOperationsDashboard,
  listActiveStores,
  type OperationsView,
} from "@/server/services/operations";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Operations Control Center" };
export const dynamic = "force-dynamic";

const VALID_VIEWS: OperationsView[] = [
  "needs_attention",
  "new",
  "awaiting_supplier",
  "needs_review",
  "in_automation",
  "delayed",
  "completed_today",
  "cancelled",
];

type SearchParams = { view?: string; store?: string };

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.DASHBOARD_OPERATIONS_VIEW);
  const params = await searchParams;

  const view = (VALID_VIEWS as string[]).includes(params.view ?? "")
    ? (params.view as OperationsView)
    : "needs_attention";

  const [data, stores] = await Promise.all([
    getOperationsDashboard({ view, storeId: params.store || undefined }),
    listActiveStores(),
  ]);

  const tabs: {
    key: OperationsView;
    label: string;
    count: number;
    tone?: "warning" | "destructive";
  }[] = [
    {
      key: "needs_attention",
      label: "Needs attention",
      count: data.counts.needsAttention,
      tone: "warning",
    },
    { key: "new", label: "New", count: data.counts.new },
    {
      key: "awaiting_supplier",
      label: "Awaiting supplier",
      count: data.counts.awaitingSupplier,
      tone: "warning",
    },
    { key: "needs_review", label: "Needs review", count: data.counts.needsReview, tone: "warning" },
    { key: "in_automation", label: "In automation", count: data.counts.inAutomation },
    { key: "delayed", label: "Delayed (>7d)", count: data.counts.delayed, tone: "destructive" },
    { key: "completed_today", label: "Completed today", count: data.counts.completedToday },
    { key: "cancelled", label: "Cancelled / refunded", count: data.counts.cancelled },
  ];

  const activeTab = tabs.find((t) => t.key === data.view);

  return (
    <div>
      <PageHeader
        title="Operations Control Center"
        description="Order queues, supplier exceptions, and operational accountability."
        breadcrumb={`${data.queue.length} ${data.queue.length === 1 ? "order" : "orders"} in ${activeTab?.label.toLowerCase() ?? "queue"}`}
        actions={
          <div className="flex items-center gap-2">
            {data.counts.flaggedExceptions > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {data.counts.flaggedExceptions} flagged
              </Badge>
            )}
            <Link
              href="/operations/exceptions"
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <AlertTriangle className="h-4 w-4" />
              Exception queue
            </Link>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* Status summary cards */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            {
              icon: Gauge,
              label: "Needs attention",
              count: data.counts.needsAttention,
              view: "needs_attention" as const,
              tone: "warning" as const,
            },
            { icon: Inbox, label: "New", count: data.counts.new, view: "new" as const },
            {
              icon: Truck,
              label: "Awaiting supplier",
              count: data.counts.awaitingSupplier,
              view: "awaiting_supplier" as const,
              tone: "warning" as const,
            },
            {
              icon: AlertTriangle,
              label: "Needs review",
              count: data.counts.needsReview,
              view: "needs_review" as const,
              tone: "warning" as const,
            },
            {
              icon: Bot,
              label: "In automation",
              count: data.counts.inAutomation,
              view: "in_automation" as const,
            },
            {
              icon: AlertTriangle,
              label: "Delayed",
              count: data.counts.delayed,
              view: "delayed" as const,
              tone: "destructive" as const,
            },
            {
              icon: CheckCircle2,
              label: "Completed today",
              count: data.counts.completedToday,
              view: "completed_today" as const,
              tone: "success" as const,
            },
            {
              icon: XCircle,
              label: "Cancelled",
              count: data.counts.cancelled,
              view: "cancelled" as const,
            },
          ].map((c) => {
            const isActive = data.view === c.view;
            const next = new URLSearchParams();
            if (c.view !== "needs_attention") next.set("view", c.view);
            if (params.store) next.set("store", params.store);
            const href = `/operations${next.toString() ? `?${next}` : ""}`;
            const tone =
              c.tone === "destructive" && c.count > 0
                ? "border-destructive/40 bg-destructive/5"
                : c.tone === "warning" && c.count > 0
                  ? "border-warning/40 bg-warning/5"
                  : c.tone === "success"
                    ? "border-success/30 bg-success/5"
                    : "";
            return (
              <Link key={c.view} href={href}>
                <Card
                  className={cn(
                    "transition-colors hover:border-primary",
                    isActive && "border-primary ring-2 ring-primary/20",
                    tone,
                  )}
                >
                  <CardContent className="flex flex-col gap-1 p-4">
                    <div className="flex items-center justify-between">
                      <c.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-2xl font-semibold tabular-nums">{c.count}</span>
                    </div>
                    <span className="text-xs leading-tight text-muted-foreground">{c.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>

        {/* Store filter */}
        {stores.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Store:
            </span>
            {[{ id: "", name: "All" }, ...stores].map((s) => {
              const isActive = (params.store ?? "") === s.id;
              const next = new URLSearchParams();
              if (data.view !== "needs_attention") next.set("view", data.view);
              if (s.id) next.set("store", s.id);
              const href = `/operations${next.toString() ? `?${next}` : ""}`;
              return (
                <Link
                  key={s.id || "all"}
                  href={href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {s.name}
                </Link>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Queue */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{activeTab?.label ?? "Queue"}</CardTitle>
              <CardDescription className="text-xs">
                Sorted by exception status, then oldest first
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.queue.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Nothing in this queue"
                  description={
                    data.view === "needs_attention"
                      ? "All caught up — no orders currently need management attention."
                      : "No orders match this filter."
                  }
                  className="m-4 border-0 bg-transparent"
                />
              ) : (
                <DataTable className="rounded-none border-0">
                  <THead>
                    <tr>
                      <TH>Order</TH>
                      <TH>Customer</TH>
                      <TH align="right">Total</TH>
                      <TH>Status</TH>
                      <TH>Supplier</TH>
                      <TH align="right">Days open</TH>
                      <TH>Flag</TH>
                      <TH align="right">Tasks</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {data.queue.map((o) => (
                      <TR key={o.id}>
                        <TD>
                          <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                            {o.orderNumber}
                          </Link>
                          <div className="text-xs text-muted-foreground">{o.storeName}</div>
                        </TD>
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
                        <TD>
                          <div className="space-y-1">
                            <OrderStatusBadge status={o.status} />
                            {o.supplierStatus !== "not_required" && (
                              <SupplierStatusBadge status={o.supplierStatus as never} />
                            )}
                          </div>
                        </TD>
                        <TD className="text-muted-foreground">
                          {o.primarySupplier ? (
                            <span>
                              {o.primarySupplier.code}
                              <div className="text-xs">{o.primarySupplier.name}</div>
                            </span>
                          ) : (
                            "—"
                          )}
                        </TD>
                        <TD
                          align="right"
                          className={cn(
                            "tabular-nums",
                            o.daysOpen > 7 && "font-medium text-destructive",
                            o.daysOpen > 3 && o.daysOpen <= 7 && "text-warning",
                          )}
                        >
                          {o.daysOpen}d
                        </TD>
                        <TD>
                          <ExceptionStatusBadge status={o.exceptionStatus as never} />
                        </TD>
                        <TD align="right">
                          {o.openTaskCount > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <ClipboardList className="h-3 w-3" />
                              {o.openTaskCount}
                            </Badge>
                          ) : (
                            <Link
                              href={{
                                pathname: "/tasks/new",
                                query: {
                                  relatedEntityType: "Order",
                                  relatedEntityId: o.id,
                                  title: `Follow up on order ${o.orderNumber}`,
                                },
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              + new
                            </Link>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>

          {/* Right column: exceptions + suppliers */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Open exceptions
                </CardTitle>
                <CardDescription className="text-xs">
                  All flagged or in-review orders, regardless of selected queue
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {data.exceptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open exceptions.</p>
                ) : (
                  <ul className="divide-y">
                    {data.exceptions.map((e) => (
                      <li key={e.id} className="py-3 first:pt-0">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/orders/${e.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {e.orderNumber}
                          </Link>
                          <span className="text-sm font-medium tabular-nums">
                            {formatCurrency(e.grandTotal, e.currency)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {e.storeName} • {e.customerLabel} • {formatDate(e.orderDate)}
                        </p>
                        {e.exceptionReason && (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground/90">
                            {e.exceptionReason}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" /> Active orders by supplier
                </CardTitle>
                <CardDescription className="text-xs">
                  Across all currently in-flight orders
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {data.supplierBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active supplier orders.</p>
                ) : (
                  <ul className="divide-y">
                    {data.supplierBreakdown.map((s) => (
                      <li
                        key={s.code}
                        className="flex items-center justify-between gap-2 py-2 first:pt-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.code} • {s.activeOrderCount} order
                            {s.activeOrderCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        <div className="text-sm font-medium tabular-nums">
                          {formatCurrency(s.activeOrderValue)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
