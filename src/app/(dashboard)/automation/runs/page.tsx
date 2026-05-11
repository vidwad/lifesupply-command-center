import Link from "next/link";
import { ArrowLeft, ShieldAlert, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { isFeatureOn } from "@/server/services/feature-flags";
import { listAutomationRuns } from "@/server/services/automation/runs";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { PrepareOrderForm, PriceCheckForm, StockCheckForm } from "./trigger-forms";

export const metadata = { title: "Automation runs" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive" | "secondary" | "outline" | "default"> = {
  prepared: "outline",
  awaiting_approval: "warning",
  approved: "secondary",
  running: "secondary",
  succeeded: "success",
  failed: "destructive",
  cancelled: "outline",
};

export default async function AutomationRunsPage() {
  const user = await requirePermission(PERMISSIONS.SUPPLIERS_VIEW);
  const canRun = userHasPermission(user, PERMISSIONS.SUPPLIERS_RUN_AUTOMATION);

  const [runs, mappings, orders, automationOn, submissionOn] = await Promise.all([
    listAutomationRuns({ limit: 50 }),
    prisma.supplierProduct.findMany({
      where: { supplier: { status: "active" } },
      include: {
        supplier: { select: { code: true, name: true } },
        product: { select: { name: true, sku: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.order.findMany({
      where: { items: { some: { supplierId: { not: null } } } },
      orderBy: { orderDate: "desc" },
      take: 50,
      select: { id: true, orderNumber: true, store: { select: { name: true } } },
    }),
    isFeatureOn(FEATURE_FLAGS.SUPPLIER_AUTOMATION),
    isFeatureOn(FEATURE_FLAGS.SUPPLIER_ORDER_SUBMIT),
  ]);

  const mappingOptions = mappings.map((m) => ({
    id: m.id,
    label: `${m.supplier.code} · ${m.supplierSku}${m.product?.name ? ` — ${m.product.name}` : ""}`,
  }));
  const orderOptions = orders.map((o) => ({
    id: o.id,
    label: `${o.orderNumber} · ${o.store.name}`,
  }));

  return (
    <div>
      <PageHeader
        title="Automation runs"
        description="Supplier-portal workflow runs. Today: simulated checks + prepared orders. No live portal hits — gated by supplier.automation."
        breadcrumb={
          <Link href="/automation" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Automation
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={automationOn ? "success" : "outline"}>
              <ShieldAlert className="mr-1 h-3 w-3" />
              supplier.automation: {automationOn ? "ON" : "OFF"}
            </Badge>
            <Badge variant={submissionOn ? "destructive" : "outline"}>
              order_submit: {submissionOn ? "ON" : "OFF"}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent runs</CardTitle>
              <CardDescription className="text-xs">
                Each run records steps + evidence. Click into a run to inspect outputs and
                validation flags.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {runs.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Wrench}
                    title="No automation runs yet"
                    description="Trigger a price check, stock check, or prepared order from the panel on the right."
                  />
                </div>
              ) : (
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Workflow</TH>
                      <TH>Supplier</TH>
                      <TH>Order</TH>
                      <TH>Status</TH>
                      <TH>Triggered by</TH>
                      <TH>Started</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {runs.map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <Link
                            href={`/automation/runs/${r.id}`}
                            className="font-medium hover:underline"
                          >
                            {r.workflow.replace(/_/g, " ")}
                          </Link>
                          {r.summary && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {r.summary}
                            </div>
                          )}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {r.supplier?.code ?? "—"}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {r.order?.orderNumber ?? "—"}
                        </TD>
                        <TD>
                          <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                            {r.status.replace(/_/g, " ")}
                          </Badge>
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {r.triggeredBy?.name ?? r.triggeredBy?.email ?? "—"}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {formatDateTime(r.startedAt)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!automationOn && (
            <div className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              The <code>supplier.automation</code> flag is OFF. Enable it in{" "}
              <Link href="/admin/feature-flags" className="underline">
                /admin/feature-flags
              </Link>{" "}
              before running any workflow.
            </div>
          )}
          {canRun ? (
            <>
              <PriceCheckForm mappings={mappingOptions} />
              <StockCheckForm mappings={mappingOptions} />
              <PrepareOrderForm orders={orderOptions} />
            </>
          ) : (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              You can view automation runs but not trigger them. Requires{" "}
              <code className="rounded bg-muted px-1">{PERMISSIONS.SUPPLIERS_RUN_AUTOMATION}</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
