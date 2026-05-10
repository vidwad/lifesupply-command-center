import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Plug, User as UserIcon, Wrench } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { ExceptionStatusBadge, OrderStatusBadge } from "@/components/data/OrderBadges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getSupplierById } from "@/server/services/suppliers";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supplier = await getSupplierById(id);
  return { title: supplier ? supplier.name : "Supplier" };
}

export default async function SupplierDetailPage({ params }: Props) {
  await requirePermission(PERMISSIONS.SUPPLIERS_VIEW);
  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) notFound();

  return (
    <div>
      <PageHeader
        title={supplier.name}
        description={`${supplier.code}${supplier.type ? ` • ${supplier.type}` : ""}`}
        breadcrumb={
          <Link href="/suppliers" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Suppliers
          </Link>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{supplier.status}</Badge>
            {supplier.apiAvailable && (
              <Badge variant="success">
                <Plug className="mr-1 h-3 w-3" /> API
              </Badge>
            )}
            {supplier.automationAvailable && (
              <Badge variant="warning">
                <Wrench className="mr-1 h-3 w-3" /> Automation
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent orders (last 90 days)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {supplier.recentOrders.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No orders touched this supplier in the last 90 days.
                </p>
              ) : (
                <DataTable className="rounded-none border-0">
                  <THead>
                    <tr>
                      <TH>Order</TH>
                      <TH>Date</TH>
                      <TH>Customer</TH>
                      <TH>Status</TH>
                      <TH>Flag</TH>
                      <TH align="right">Total</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {supplier.recentOrders.map((o) => (
                      <TR key={o.id}>
                        <TD>
                          <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                            {o.orderNumber}
                          </Link>
                          <div className="text-xs text-muted-foreground">{o.storeName}</div>
                        </TD>
                        <TD className="text-muted-foreground">{formatDate(o.orderDate)}</TD>
                        <TD className="text-muted-foreground">{o.customerLabel}</TD>
                        <TD>
                          <OrderStatusBadge status={o.status as never} />
                        </TD>
                        <TD>
                          <ExceptionStatusBadge status={o.exceptionStatus as never} />
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Product mappings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {supplier.supplierProducts.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No products mapped yet.</p>
              ) : (
                <DataTable className="rounded-none border-0">
                  <THead>
                    <tr>
                      <TH>Product</TH>
                      <TH>Supplier SKU</TH>
                      <TH align="right">Cost</TH>
                      <TH>Availability</TH>
                      <TH>Preferred</TH>
                      <TH>Last checked</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {supplier.supplierProducts.map((sp) => (
                      <TR key={sp.id}>
                        <TD>
                          {sp.product ? (
                            <Link
                              href={`/products/${sp.product.id}`}
                              className="font-medium hover:underline"
                            >
                              {sp.product.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              {sp.supplierProductName ?? "—"}
                            </span>
                          )}
                          {sp.product?.sku && (
                            <div className="text-xs text-muted-foreground">{sp.product.sku}</div>
                          )}
                        </TD>
                        <TD className="font-mono text-xs">{sp.supplierSku}</TD>
                        <TD align="right" className="tabular-nums">
                          {formatCurrency(sp.cost, sp.currency)}
                        </TD>
                        <TD className="text-muted-foreground">{sp.availabilityStatus}</TD>
                        <TD>
                          {sp.isPreferred ? (
                            <Badge variant="success">Preferred</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {sp.lastCheckedAt ? formatDateTime(sp.lastCheckedAt) : "—"}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>

          {supplier.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance — 90 days</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Active orders" value={String(supplier.metrics.activeOrderCount)} />
                <Row label="Completed (90d)" value={String(supplier.metrics.completedOrderCount)} />
                <Row label="90-day spend" value={formatCurrency(supplier.metrics.ninetyDaySpend)} />
                <Row label="Mapped products" value={String(supplier.metrics.productMappingCount)} />
                <Row
                  label="Preferred mappings"
                  value={String(supplier.metrics.preferredMappingCount)}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Connectivity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Code" value={supplier.code} />
              <Row label="Type" value={supplier.type ?? "—"} />
              <Row label="API available" value={supplier.apiAvailable ? "Yes" : "No"} />
              <Row
                label="Automation"
                value={supplier.automationAvailable ? "Available (manual mode)" : "Not yet"}
              />
              {supplier.portalUrl && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Portal
                  </span>
                  <a
                    href={supplier.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {supplier.websiteUrl && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Website
                  </span>
                  <a
                    href={supplier.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Primary contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {supplier.primaryContactName && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3 w-3 text-muted-foreground" />
                  <span>{supplier.primaryContactName}</span>
                </div>
              )}
              {supplier.primaryContactEmail && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {supplier.primaryContactEmail}
                </div>
              )}
              {!supplier.primaryContactName && !supplier.primaryContactEmail && (
                <p className="text-muted-foreground">No contact on file.</p>
              )}
            </CardContent>
          </Card>
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
