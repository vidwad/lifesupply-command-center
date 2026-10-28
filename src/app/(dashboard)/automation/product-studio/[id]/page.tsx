import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { getProductStudioRun, isRunLive } from "@/server/services/product-studio/autopilot-read";
import {
  describeAutopilotSettings,
  parseAutopilotSettings,
} from "@/server/services/product-studio/autopilot-settings";

import {
  ITEM_STAGE_LABEL,
  ITEM_STAGE_VARIANT,
  RUN_STATUS_LABEL,
  RUN_STATUS_VARIANT,
} from "../run-status";
import { AutoRefresh } from "./auto-refresh";
import { CancelForm } from "./cancel-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const run = await getProductStudioRun(id);
  return { title: run ? `Run ${formatDateTime(run.createdAt)}` : "Unattended run" };
}

export default async function ProductStudioRunPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const canRun = userHasPermission(user, PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);
  const { id } = await params;
  const run = await getProductStudioRun(id);
  if (!run) notFound();
  const live = isRunLive(run);
  const settings = parseAutopilotSettings(run.settings);
  const stages = run.items.map((item) => item.stage);
  const count = (...which: string[]) => stages.filter((stage) => which.includes(stage)).length;
  const inProgress = count("claimed", "researching", "generating", "reviewing", "publishing");

  return (
    <div>
      {live ? <AutoRefresh seconds={10} /> : null}
      <PageHeader
        title={`Unattended run · ${formatDateTime(run.createdAt)}`}
        description={
          run.summary ??
          `${run.items.length} product${run.items.length === 1 ? "" : "s"}; ${inProgress} in progress, ${count("done")} completed, ${count("attention", "failed")} need attention, ${run.imagesGenerated} image${run.imagesGenerated === 1 ? "" : "s"} generated so far.`
        }
        breadcrumb={
          <Link
            href="/automation/product-studio"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Product Studio runs
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={RUN_STATUS_VARIANT[run.status] ?? "outline"}>
              {run.cancelRequestedAt && live
                ? "Stopping"
                : (RUN_STATUS_LABEL[run.status] ?? run.status)}
            </Badge>
            {live && canRun && !run.cancelRequestedAt ? <CancelForm runId={run.id} /> : null}
          </div>
        }
      />
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Products</CardTitle>
              <CardDescription className="text-xs">
                In the order selected. Each row&apos;s note says what happened; open the project for
                the drafts, their QA and the review record.
                {live ? " This page refreshes every ten seconds while the run is live." : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>#</TH>
                    <TH>Product</TH>
                    <TH>Stage</TH>
                    <TH align="right">Images</TH>
                    <TH align="right">Regen.</TH>
                    <TH align="right">Approved</TH>
                    <TH align="right">Published</TH>
                    <TH>Note</TH>
                  </tr>
                </THead>
                <TBody>
                  {run.items.map((item) => (
                    <TR key={item.id}>
                      <TD className="tabular-nums text-muted-foreground">{item.sortOrder + 1}</TD>
                      <TD>
                        {item.projectId ? (
                          <Link
                            href={`/products/studio/${item.projectId}`}
                            className="font-medium hover:underline"
                          >
                            {item.project?.confirmedTitle ?? item.productName}
                          </Link>
                        ) : (
                          <span className="font-medium">{item.productName}</span>
                        )}
                        {item.project ? (
                          <div className="text-xs text-muted-foreground">
                            project {item.project.status.replace(/_/g, " ")}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">project deleted</div>
                        )}
                      </TD>
                      <TD>
                        <Badge variant={ITEM_STAGE_VARIANT[item.stage] ?? "outline"}>
                          {ITEM_STAGE_LABEL[item.stage] ?? item.stage}
                        </Badge>
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {item.imagesGenerated}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {item.regenerations}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {item.approvedSlots}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {item.publishedItems}
                      </TD>
                      <TD className="max-w-md text-xs text-muted-foreground">{item.note ?? "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Criteria</CardTitle>
              <CardDescription className="text-xs">
                Frozen when the run was created.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {describeAutopilotSettings(settings).map((line) => (
                <p key={line}>• {line}</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <dl className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1">
                <dt className="text-muted-foreground">Started by</dt>
                <dd>{run.createdBy?.name ?? run.createdBy?.email ?? "—"}</dd>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDateTime(run.createdAt)}</dd>
                <dt className="text-muted-foreground">Started</dt>
                <dd>{run.startedAt ? formatDateTime(run.startedAt) : "—"}</dd>
                <dt className="text-muted-foreground">Finished</dt>
                <dd>{run.completedAt ? formatDateTime(run.completedAt) : "—"}</dd>
                <dt className="text-muted-foreground">Images</dt>
                <dd className="tabular-nums">
                  {run.imagesGenerated} of at most {settings.maxImagesTotal}
                </dd>
                <dt className="text-muted-foreground">Approval</dt>
                <dd className="break-all text-xs">{run.approvalId ?? "—"}</dd>
              </dl>
              {run.stopReason ? (
                <p className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs">
                  {run.stopReason}
                  {run.cancelledBy ? ` (${run.cancelledBy.name ?? run.cancelledBy.email})` : ""}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {settings.publishMode === "none"
                  ? "Nothing in this run was sent to a store. Approved drafts wait on each project's publishing card for a Super Admin."
                  : "Products whose images were approved were published through the same service and gates as the publishing card; each project's publish history lists every request. A product short of images that published under the run's minimum is approved, its note naming the images left out. A refused or failed publish is marked for attention and is not retried."}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
