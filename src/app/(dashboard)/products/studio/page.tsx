import Link from "next/link";
import { ArrowLeft, LayoutGrid, List, Plus, Sparkles } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { SortHeader } from "@/components/data/SortHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import {
  listProductStudioProjects,
  parseProjectSort,
  summarizeProjectAssets,
} from "@/server/services/product-studio";

import { ProjectActions } from "./project-actions";
import { ReportBar, STUDIO_REPORT_FORM_ID } from "./report-bar";

export const metadata = { title: "Product Studio" };
export const dynamic = "force-dynamic";

type SearchParams = { batch?: string; view?: string; sort?: string; dir?: string };

function SelectBox({ id, title }: { id: string; title: string }) {
  return (
    <input
      type="checkbox"
      name="id"
      value={id}
      form={STUDIO_REPORT_FORM_ID}
      aria-label={`Select ${title} for the summary report`}
      className="h-4 w-4 accent-primary"
    />
  );
}

export default async function ProductStudioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  await requirePermission(PERMISSIONS.AI_USE);
  // Unattended runs (2026-10-27) take the Super Admin-only publish permission.
  const canAutopilot = userHasPermission(user, PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);
  const params = await searchParams;
  const batchId = params.batch?.trim() || null;
  // Two layouts (2026-10-26): the cards, and a condensed list that sorts in
  // the database. The view and the sort are view preferences carried on
  // every link; the batch is a filter.
  const view = params.view === "list" ? "list" : "cards";
  const sort = parseProjectSort(params.sort);
  const dir = params.dir === "desc" ? "desc" : "asc";
  const projects = await listProductStudioProjects({ batchId, sort, dir });
  const first = batchId ? projects[0] : null;
  const carried = { batch: batchId ?? undefined, view };
  const viewHref = (next: "cards" | "list") => {
    const qs = new URLSearchParams();
    if (batchId) qs.set("batch", batchId);
    if (next === "list") qs.set("view", "list");
    if (sort) qs.set("sort", sort);
    if (params.dir === "desc") qs.set("dir", "desc");
    const s = qs.toString();
    return `/products/studio${s ? `?${s}` : ""}`;
  };
  const rows = projects.map((project) => ({
    ...project,
    counts: summarizeProjectAssets(project.assets),
    displayTitle: project.confirmedTitle ?? project.title,
  }));

  return (
    <div>
      <PageHeader
        title="Product Studio"
        description="Retailer research, normalized market prices, four image compositions, and human review."
        breadcrumb={
          <Link href="/products" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Products
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border" role="group" aria-label="Layout">
              <Button
                asChild
                size="sm"
                variant={view === "cards" ? "secondary" : "ghost"}
                className="rounded-r-none"
              >
                <Link href={viewHref("cards")} aria-current={view === "cards" ? "page" : undefined}>
                  <LayoutGrid /> Cards
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant={view === "list" ? "secondary" : "ghost"}
                className="rounded-l-none"
              >
                <Link href={viewHref("list")} aria-current={view === "list" ? "page" : undefined}>
                  <List /> List
                </Link>
              </Button>
            </div>
            <Button asChild>
              <Link href="/products/studio/new">
                <Plus /> New project
              </Link>
            </Button>
          </div>
        }
      />
      <div className="space-y-4 p-4 md:p-6">
        {batchId ? (
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-4 text-sm">
            <p>
              <span className="font-medium">Batch of {projects.length}</span>
              <span className="text-muted-foreground">
                {" "}
                · created together from the products list. Each project page steps to the next.
              </span>
            </p>
            {first ? (
              <Button asChild size="sm" className="ml-auto">
                <Link href={`/products/studio/${first.id}`}>Open the first project</Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link href="/products/studio">All projects</Link>
            </Button>
          </div>
        ) : null}

        {projects.length > 0 ? (
          <ReportBar total={projects.length} canAutopilot={canAutopilot} />
        ) : null}

        {projects.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No Product Studio projects"
            description="Create a project with one to four authoritative product photographs."
          />
        ) : view === "list" ? (
          <DataTable>
            <THead>
              <tr>
                <TH>
                  <span className="sr-only">Select</span>
                </TH>
                <SortHeader
                  label="Project"
                  sortKey="title"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products/studio"
                  params={carried}
                />
                <SortHeader
                  label="Catalogue product"
                  sortKey="product"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products/studio"
                  params={carried}
                />
                <SortHeader
                  label="Status"
                  sortKey="status"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products/studio"
                  params={carried}
                />
                {/* Counts come from the project's asset rows after the query,
                    so these headers stay inert, like the derived columns on
                    the products list. */}
                <TH align="right">Photos</TH>
                <TH align="right">Approved</TH>
                <TH align="right">On store</TH>
                <TH align="right">Sources</TH>
                <SortHeader
                  label="Updated"
                  sortKey="updated"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products/studio"
                  params={carried}
                />
                <SortHeader
                  label="Created"
                  sortKey="created"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products/studio"
                  params={carried}
                />
              </tr>
            </THead>
            <TBody>
              {rows.map((project) => (
                <TR key={project.id}>
                  <TD>
                    <SelectBox id={project.id} title={project.displayTitle} />
                  </TD>
                  <TD>
                    <Link
                      href={`/products/studio/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.displayTitle}
                    </Link>
                  </TD>
                  <TD className="text-muted-foreground">
                    {project.product ? (
                      <>
                        {project.product.name}
                        {project.product.sku ? (
                          <span className="font-mono text-xs"> · {project.product.sku}</span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD>
                    <Badge variant="outline">{project.status.replaceAll("_", " ")}</Badge>
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {project.counts.sourceCount}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {project.counts.approvedSlots}/4
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {project.counts.publishedSlots}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {project._count.researchSources}
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {project.updatedAt.toLocaleDateString("en-CA")}
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {project.createdAt.toLocaleDateString("en-CA")}
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {rows.map((project) => (
              <Card key={project.id} className="h-full">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <SelectBox id={project.id} title={project.displayTitle} />
                      </div>
                      <div>
                        <h2 className="font-semibold leading-snug">
                          <Link href={`/products/studio/${project.id}`} className="hover:underline">
                            {project.displayTitle}
                          </Link>
                        </h2>
                        {project.product ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Catalog: {project.product.name}{" "}
                            {project.product.sku ? `· ${project.product.sku}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Badge variant="outline">{project.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {project.finalDescription ?? project.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>{project.counts.sourceCount} photos</span>
                    <span>{project.counts.approvedSlots}/4 approved</span>
                    <span>{project.counts.publishedSlots} on store</span>
                    <span>{project._count.researchSources} sources</span>
                  </div>
                  <ProjectActions projectId={project.id} assetCount={project._count.assets} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
