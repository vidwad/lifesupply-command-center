import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { summarizeProjectAssets } from "@/server/services/product-studio";
import {
  autopilotFlagState,
  listRunCandidates,
} from "@/server/services/product-studio/autopilot-read";
import { listBatchProjects } from "@/server/services/product-studio/bulk";

import { RunForm } from "./run-form";

export const metadata = { title: "New unattended run" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ id?: string | string[]; batch?: string }>;

/**
 * The run form. Projects arrive as `?id=` from the Product Studio list's
 * checkboxes, or as `?batch=` from a batch just created on the products list.
 */
export default async function NewProductStudioRunPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);
  const params = await searchParams;
  const fromQuery = Array.isArray(params.id) ? params.id : params.id ? [params.id] : [];
  const batchId = params.batch?.trim() || null;
  const fromBatch = batchId ? (await listBatchProjects(batchId)).map((item) => item.id) : [];
  const candidates = await listRunCandidates([...fromQuery, ...fromBatch]);
  const flags = await autopilotFlagState();

  const blocked = candidates.filter(
    (project) =>
      (project.autopilotRun && ["queued", "running"].includes(project.autopilotRun.status)) ||
      project.status === "archived",
  );
  const eligible = candidates.filter((project) => !blocked.includes(project));
  const disabledReason = !flags.enabled
    ? "Unattended runs are disabled until these flags are on: " + flags.disabledFlags.join(", ")
    : blocked.length > 0
      ? "Remove the projects marked unavailable from your selection and try again."
      : eligible.length === 0
        ? "Select at least one project on the Product Studio list first."
        : null;

  return (
    <div>
      <PageHeader
        title="New unattended run"
        description="The worker researches each product, generates its images, approves or regenerates each draft from its QA scores, and leaves the product approved or marked for attention. You will not be asked anything until it finishes."
        breadcrumb={
          <Link
            href="/automation/product-studio"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Product Studio runs
          </Link>
        }
        actions={
          <Badge variant={flags.enabled ? "destructive" : "outline"}>
            <ShieldAlert className="mr-1 h-3 w-3" />
            product_studio.autopilot: {flags.enabled ? "ON" : "OFF"}
          </Badge>
        }
      />
      <div className="grid gap-6 p-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Criteria</CardTitle>
              <CardDescription className="text-xs">
                Frozen when the run starts; a run reads the same criteria from its first product to
                its last. Starting the run is the approval for everything it does.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RunForm
                projectIds={eligible.map((project) => project.id)}
                disabledReason={disabledReason}
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {candidates.length} project{candidates.length === 1 ? "" : "s"} selected
              </CardTitle>
              <CardDescription className="text-xs">
                What each one already has. Work already done is kept: research is not repeated,
                approved images are not regenerated, and only slots without an approved draft are
                worked.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {candidates.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Nothing selected. Tick projects on the{" "}
                  <Link href="/products/studio" className="underline">
                    Product Studio list
                  </Link>{" "}
                  and choose &ldquo;Run unattended&rdquo;.
                </p>
              ) : (
                <DataTable className="rounded-none border-0">
                  <THead>
                    <tr>
                      <TH>Project</TH>
                      <TH>Status</TH>
                      <TH align="right">Photos</TH>
                      <TH align="right">Approved</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {candidates.map((project) => {
                      const counts = summarizeProjectAssets(
                        project.assets.map((asset) => ({ ...asset, publishedAt: null })),
                      );
                      const unavailable = blocked.includes(project);
                      return (
                        <TR key={project.id}>
                          <TD>
                            <Link
                              href={`/products/studio/${project.id}`}
                              className="font-medium hover:underline"
                            >
                              {project.confirmedTitle ?? project.title}
                            </Link>
                            {project.product ? (
                              <div className="text-xs text-muted-foreground">
                                {project.product.sku ?? project.product.name}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Not linked to a catalogue product
                              </div>
                            )}
                          </TD>
                          <TD>
                            {unavailable ? (
                              <Badge variant="destructive">unavailable</Badge>
                            ) : (
                              <Badge variant="outline">{project.status.replace(/_/g, " ")}</Badge>
                            )}
                          </TD>
                          <TD align="right" className="tabular-nums">
                            {counts.sourceCount}
                          </TD>
                          <TD align="right" className="tabular-nums">
                            {counts.approvedSlots}
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
