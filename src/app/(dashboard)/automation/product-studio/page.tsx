import Link from "next/link";
import { ArrowLeft, Bot, ShieldAlert } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import {
  autopilotFlagState,
  listProductStudioRuns,
} from "@/server/services/product-studio/autopilot-read";

import { RUN_STATUS_LABEL, RUN_STATUS_VARIANT } from "./run-status";

export const metadata = { title: "Product Studio runs" };
export const dynamic = "force-dynamic";

export default async function ProductStudioRunsPage() {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const canRun = userHasPermission(user, PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);
  const [runs, flags] = await Promise.all([listProductStudioRuns(), autopilotFlagState()]);

  return (
    <div>
      <PageHeader
        title="Product Studio runs"
        description="Unattended runs: research, images, automatic QA review and regeneration for a selected list of products, with no further input. Super Admin only."
        breadcrumb={
          <Link href="/automation" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Automation
          </Link>
        }
        actions={
          <Badge variant={flags.enabled ? "destructive" : "outline"}>
            <ShieldAlert className="mr-1 h-3 w-3" />
            product_studio.autopilot: {flags.enabled ? "ON" : "OFF"}
          </Badge>
        }
      />
      <div className="space-y-4 p-6">
        <Card>
          <CardContent className="space-y-2 py-4 text-sm">
            <p>
              A run starts from a selection: tick projects on the{" "}
              <Link href="/products/studio" className="underline">
                Product Studio list
              </Link>{" "}
              or products on the{" "}
              <Link href="/products" className="underline">
                products list
              </Link>{" "}
              and choose &ldquo;Run unattended&rdquo;. The run form sets the criteria; this page is
              the record.
            </p>
            {!flags.enabled ? (
              <p className="text-xs text-muted-foreground">
                Runs are disabled until these flags are on: {flags.disabledFlags.join(", ")}.
                Existing records stay readable.
              </p>
            ) : null}
            {!canRun ? (
              <p className="text-xs text-muted-foreground">
                You can view runs but not start or stop them. Requires{" "}
                <code className="rounded bg-muted px-1">
                  {PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE}
                </code>
                .
              </p>
            ) : null}
          </CardContent>
        </Card>

        {runs.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No unattended runs yet"
            description="Select projects in Product Studio and choose Run unattended to start one."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Run</TH>
                <TH>Status</TH>
                <TH align="right">Products</TH>
                <TH align="right">Done</TH>
                <TH align="right">Attention</TH>
                <TH align="right">Images</TH>
                <TH>Started by</TH>
                <TH>Created</TH>
                <TH>Finished</TH>
              </tr>
            </THead>
            <TBody>
              {runs.map((run) => {
                const stages = run.items.map((item) => item.stage);
                const done = stages.filter((stage) => stage === "done").length;
                const attention = stages.filter(
                  (stage) => stage === "attention" || stage === "failed",
                ).length;
                return (
                  <TR key={run.id}>
                    <TD>
                      <Link
                        href={`/automation/product-studio/${run.id}`}
                        className="font-medium hover:underline"
                      >
                        {formatDateTime(run.createdAt)}
                      </Link>
                      {run.summary ? (
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {run.summary}
                        </div>
                      ) : null}
                    </TD>
                    <TD>
                      <Badge variant={RUN_STATUS_VARIANT[run.status] ?? "outline"}>
                        {run.cancelRequestedAt && run.status === "running"
                          ? "Stopping"
                          : (RUN_STATUS_LABEL[run.status] ?? run.status)}
                      </Badge>
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {run._count.items}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {done}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {attention}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {run.imagesGenerated}
                    </TD>
                    <TD className="text-xs text-muted-foreground">
                      {run.createdBy?.name ?? run.createdBy?.email ?? "—"}
                    </TD>
                    <TD className="text-xs text-muted-foreground">
                      {formatDateTime(run.createdAt)}
                    </TD>
                    <TD className="text-xs text-muted-foreground">
                      {run.completedAt ? formatDateTime(run.completedAt) : "—"}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
