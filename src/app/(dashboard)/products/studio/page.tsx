import Link from "next/link";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { listProductStudioProjects } from "@/server/services/product-studio";

import { ProjectActions } from "./project-actions";

export const metadata = { title: "Product Studio" };
export const dynamic = "force-dynamic";

export default async function ProductStudioPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  await requirePermission(PERMISSIONS.AI_USE);
  const projects = await listProductStudioProjects();

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
          <Button asChild>
            <Link href="/products/studio/new">
              <Plus /> New project
            </Link>
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        {projects.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No Product Studio projects"
            description="Create a project with one to four authoritative product photographs."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="h-full">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold leading-snug">
                        <Link href={`/products/studio/${project.id}`} className="hover:underline">
                          {project.confirmedTitle ?? project.title}
                        </Link>
                      </h2>
                      {project.product ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Catalog: {project.product.name}{" "}
                          {project.product.sku ? `· ${project.product.sku}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline">{project.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {project.finalDescription ?? project.shortDescription}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{project._count.assets} assets</span>
                    <span>{project._count.researchSources} sources</span>
                    <span>{project._count.compositions}/4 concepts</span>
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
