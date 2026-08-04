import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Mail, Phone } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/data/OrderBadges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getCustomerById } from "@/server/services/customers";
import { listTasksForEntity } from "@/server/services/tasks";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  return { title: customer ? customer.displayName : "Customer" };
}

const CONSENT_BADGE: Record<string, "success" | "destructive" | "secondary" | "outline"> = {
  subscribed: "success",
  unsubscribed: "destructive",
  transactional: "secondary",
  pending: "outline",
  cleaned: "outline",
  unknown: "outline",
};

const TASK_STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  open: "outline",
  in_progress: "warning",
  blocked: "destructive",
  awaiting_approval: "warning",
  completed: "success",
  cancelled: "outline",
};

export default async function CustomerDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.CUSTOMERS_VIEW);
  const canCreateTasks = userHasPermission(user, PERMISSIONS.TASKS_CREATE);
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const tasks = await listTasksForEntity("Customer", customer.id);
  const newTaskHref = `/tasks/new?relatedEntityType=Customer&relatedEntityId=${customer.id}&title=${encodeURIComponent(`Customer service: ${customer.displayName}`)}`;

  return (
    <div>
      <PageHeader
        title={customer.displayName}
        description={`${customer.customerType} • ${customer.store?.name ?? "Unknown store"}`}
        breadcrumb={
          <Link href="/customers" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Customers
          </Link>
        }
        actions={
          <Badge variant={CONSENT_BADGE[customer.consentStatus] ?? "outline"}>
            Consent: {customer.consentStatus}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.orders.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <DataTable className="rounded-none border-0">
                  <THead>
                    <tr>
                      <TH>Order</TH>
                      <TH>Date</TH>
                      <TH>Status</TH>
                      <TH>Payment</TH>
                      <TH align="right">Total</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {customer.orders.map((o) => (
                      <TR key={o.id}>
                        <TD>
                          <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                            {o.orderNumber}
                          </Link>
                        </TD>
                        <TD className="text-muted-foreground">{formatDate(o.orderDate)}</TD>
                        <TD>
                          <OrderStatusBadge status={o.status} />
                        </TD>
                        <TD>
                          <PaymentStatusBadge status={o.paymentStatus} />
                        </TD>
                        <TD align="right" className="font-medium tabular-nums">
                          {formatCurrency(o.grandTotal, o.currency)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4" /> Customer service tasks
              </CardTitle>
              {canCreateTasks && (
                <Link
                  href={newTaskHref}
                  className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
                >
                  + New task
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tasks linked to this customer yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <Link
                        href={`/tasks/${t.id}`}
                        className="truncate font-medium hover:underline"
                      >
                        {t.title}
                      </Link>
                      <span className="flex shrink-0 items-center gap-2 text-xs">
                        <Badge variant={TASK_STATUS_BADGE[t.status] ?? "outline"}>
                          {t.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-muted-foreground">
                          {t.assignedTo?.name ?? t.assignedTo?.email ?? "unassigned"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {customer.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {customer.phone}
                </div>
              )}
              {!customer.email && !customer.phone && (
                <p className="text-muted-foreground">No contact info on file.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lifetime metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Lifetime value" value={formatCurrency(customer.lifetimeValue)} />
                <Row label="Order count" value={String(customer.orderCount)} />
                <Row
                  label="First order"
                  value={customer.firstOrderAt ? formatDate(customer.firstOrderAt) : "—"}
                />
                <Row
                  label="Last order"
                  value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "Never"}
                />
                {customer.reactivationScore != null && (
                  <Row label="Reactivation score" value={String(customer.reactivationScore)} />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Consent (CASL)</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Status" value={customer.consentStatus} />
                <Row label="Basis" value={customer.consentBasis ?? "—"} />
                <Row label="Source" value={customer.consentSource ?? "—"} />
                <Row
                  label="Obtained"
                  value={customer.consentObtainedAt ? formatDate(customer.consentObtainedAt) : "—"}
                />
                <Row
                  label="Expires"
                  value={
                    customer.consentExpiresAt ? formatDate(customer.consentExpiresAt) : "no expiry"
                  }
                />
                {customer.suppressionReason && (
                  <Row
                    label="Suppressed"
                    value={`${customer.suppressionReason}${customer.suppressedAt ? ` (${formatDate(customer.suppressedAt)})` : ""}`}
                  />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Segments</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.segmentMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not in any active segment.</p>
              ) : (
                <ul className="space-y-1.5">
                  {customer.segmentMembers.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <span>{m.segment.name}</span>
                      <Badge variant="outline">{m.segment.segmentType}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {customer.marketingContacts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Marketing engagement</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.marketingContacts.map((mc) => (
                  <dl key={mc.id} className="space-y-1.5 text-sm">
                    <Row label="Status" value={mc.status} />
                    {mc.lastCampaignSentAt && (
                      <Row label="Last sent" value={formatDateTime(mc.lastCampaignSentAt)} />
                    )}
                    {mc.lastOpenedAt && (
                      <Row label="Last opened" value={formatDateTime(mc.lastOpenedAt)} />
                    )}
                    {mc.lastClickedAt && (
                      <Row label="Last clicked" value={formatDateTime(mc.lastClickedAt)} />
                    )}
                  </dl>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
