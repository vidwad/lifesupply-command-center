import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  ImageIcon,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { formatCurrency } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { getFeatureFlags } from "@/server/services/feature-flags";
import { getProductStudioProject } from "@/server/services/product-studio";

import { queueGenerationAction, queueResearchAction, reviewAssetAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const project = await getProductStudioProject(id);
  return { title: project ? `${project.confirmedTitle ?? project.title} · Product Studio` : "Product Studio" };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function ProductStudioDetailPage({ params }: Props) {
  await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  await requirePermission(PERMISSIONS.AI_USE);
  const { id } = await params;
  const [project, flags] = await Promise.all([
    getProductStudioProject(id),
    getFeatureFlags([
      FEATURE_FLAGS.PRODUCT_STUDIO,
      FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION,
    ]),
  ]);
  if (!project) notFound();

  const sourceAssets = project.assets.filter((asset) => asset.kind === "source");
  const allGeneratedAssets = project.assets.filter((asset) => asset.kind === "generated");
  const generatedAssets = allGeneratedAssets.filter(
    (asset, index) =>
      allGeneratedAssets.findIndex((candidate) => candidate.compositionSlot === asset.compositionSlot) ===
      index,
  );
  const nextComposition = project.compositions.find((item) =>
    ["planned", "failed"].includes(item.status),
  );
  const busy = project.compositions.some((item) => ["queued", "generating"].includes(item.status));
  const canResearch =
    flags[FEATURE_FLAGS.PRODUCT_STUDIO] &&
    generatedAssets.length === 0 &&
    ["draft", "failed"].includes(project.status);
  const canGenerate =
    flags[FEATURE_FLAGS.PRODUCT_STUDIO] &&
    flags[FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION] &&
    Boolean(nextComposition) &&
    !busy;
  const summary = asRecord(project.researchSummary);
  const identity = asRecord(summary?.identifiedProduct);
  const benchmark = asRecord(summary?.benchmarkListing);

  return (
    <div>
      <PageHeader
        title={project.confirmedTitle ?? project.title}
        description={project.finalDescription ?? project.shortDescription}
        breadcrumb={
          <Link href="/products/studio" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Product Studio
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{project.status.replaceAll("_", " ")}</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={`/products/studio/${project.id}`}>
                <RefreshCw /> Refresh
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {project.errorMessage ? (
          <div className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">The last workflow stopped safely.</p>
              <p className="mt-1">{project.errorMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authoritative source photographs</CardTitle>
                <CardDescription>
                  Every generated draft must preserve the product and visible condition shown here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {sourceAssets.map((asset) => (
                    <div key={asset.id} className="space-y-2">
                      <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                        <Image
                          src={`/api/product-studio/assets/${asset.id}`}
                          alt={`Authoritative source: ${asset.fileName}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 220px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{asset.fileName}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Four researched compositions</CardTitle>
                <CardDescription>
                  Generated sequentially to control cost and let you review identity before continuing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.compositions.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Run retailer research to create four cited composition briefs and prompts.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {project.compositions.map((composition) => {
                      const asset = generatedAssets.find(
                        (item) => item.compositionSlot === composition.slot,
                      );
                      const attributes = asRecord(composition.attributes);
                      const qa = asRecord(asset?.qaResult);
                      return (
                        <article key={composition.id} className="overflow-hidden rounded-lg border">
                          {asset ? (
                            <div className="relative aspect-square bg-muted">
                              <Image
                                src={`/api/product-studio/assets/${asset.id}`}
                                alt={`Generated composition ${composition.slot}: ${composition.name}`}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-muted/50">
                              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Composition {composition.slot}
                                </p>
                                <h3 className="font-semibold">{composition.name}</h3>
                              </div>
                              <Badge variant="outline">
                                {(asset?.status ?? composition.status).replaceAll("_", " ")}
                                {asset && asset.revision > 1 ? ` · r${asset.revision}` : ""}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{composition.rationale}</p>
                            <dl className="grid gap-1 text-xs">
                              <BriefRow label="Layout" value={attributes?.layout} />
                              <BriefRow label="Lighting" value={attributes?.lighting} />
                              <BriefRow label="Angle" value={attributes?.cameraAngle} />
                            </dl>
                            {composition.sourceUrl ? (
                              <a
                                href={composition.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                {composition.sourceSeller ?? "Retailer evidence"} <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                            {qa ? (
                              <div className="rounded-md bg-muted p-3 text-xs">
                                <p className="font-medium">Automated QA: {String(qa.verdict ?? "needs review")}</p>
                                <p className="mt-1 text-muted-foreground">
                                  Identity {Math.round(Number(qa.identityScore ?? 0) * 100)}% · Condition{" "}
                                  {Math.round(Number(qa.conditionFidelityScore ?? 0) * 100)}% · Composition{" "}
                                  {Math.round(Number(qa.compositionScore ?? 0) * 100)}%
                                </p>
                                {asStrings(qa.differences).map((difference) => (
                                  <p key={difference} className="mt-1 text-muted-foreground">• {difference}</p>
                                ))}
                              </div>
                            ) : null}
                            {asset ? (
                              <div className="flex gap-2">
                                <form action={reviewAssetAction}>
                                  <input type="hidden" name="projectId" value={project.id} />
                                  <input type="hidden" name="assetId" value={asset.id} />
                                  <input type="hidden" name="decision" value="approved" />
                                  <Button type="submit" size="sm" variant="outline">
                                    <Check /> Approve
                                  </Button>
                                </form>
                                <form action={reviewAssetAction}>
                                  <input type="hidden" name="projectId" value={project.id} />
                                  <input type="hidden" name="assetId" value={asset.id} />
                                  <input type="hidden" name="decision" value="rejected" />
                                  <Button type="submit" size="sm" variant="outline">
                                    <X /> Reject
                                  </Button>
                                </form>
                              </div>
                            ) : null}
                            <details className="text-xs">
                              <summary className="cursor-pointer font-medium">View generated prompt</summary>
                              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-muted-foreground">
                                {composition.prompt}
                              </pre>
                            </details>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workflow</CardTitle>
                <CardDescription>Long-running AI work is handled by the background worker.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canResearch ? (
                  <form action={queueResearchAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <Button type="submit" className="w-full">
                      <Search /> Research retailers and prices
                    </Button>
                  </form>
                ) : null}
                {canGenerate && nextComposition ? (
                  <form action={queueGenerationAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="slot" value={nextComposition.slot} />
                    <Button type="submit" className="w-full">
                      <Sparkles /> Generate composition {nextComposition.slot}
                    </Button>
                  </form>
                ) : null}
                {busy ? (
                  <p className="text-sm text-muted-foreground">
                    Work is in progress. Refresh this page after the worker completes.
                  </p>
                ) : null}
                {!flags[FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION] && project.compositions.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Image generation is off. Enable {FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION}{" "}
                    only after confirming OpenAI budget and worker capacity.
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  No result is published externally. Approval here means internally accepted draft only.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identity and listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {identity ? (
                  <dl className="space-y-2">
                    <BriefRow label="Brand" value={identity.brand} />
                    <BriefRow label="Model" value={identity.model} />
                    <BriefRow label="Confidence" value={`${Math.round(Number(identity.confidence ?? 0) * 100)}%`} />
                  </dl>
                ) : (
                  <p className="text-muted-foreground">Identity confirmation is pending research.</p>
                )}
                {summary ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Key details</p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {asStrings(summary.keyDetails).map((detail) => <li key={detail}>• {detail}</li>)}
                    </ul>
                  </div>
                ) : null}
                {benchmark && typeof benchmark.url === "string" ? (
                  <div className="rounded-md border p-3">
                    <a
                      href={benchmark.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Benchmark: {String(benchmark.sellerName ?? "seller listing")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Copy: {String(benchmark.whyStrongDescription ?? "—")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hero: {String(benchmark.whyStrongHero ?? "—")}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Market range</CardTitle>
                <CardDescription>Asking prices are evidence, not an appraisal or guaranteed sale price.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.marketLow != null && project.marketHigh != null ? (
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatCurrency(Number(project.marketLow), project.currency)}–
                    {formatCurrency(Number(project.marketHigh), project.currency)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Pending research.</p>
                )}
                <div className="space-y-2">
                  {project.priceObservations.map((observation) => (
                    <a
                      key={observation.id}
                      href={observation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-3 rounded-md border p-2 text-sm hover:bg-accent"
                    >
                      <span>
                        <span className="font-medium">{observation.sellerName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {observation.condition ?? "Condition not stated"}
                        </span>
                      </span>
                      <span className="whitespace-nowrap tabular-nums">
                        {formatCurrency(Number(observation.price), observation.currency)}
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Research sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.researchSources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border p-3 text-sm hover:bg-accent"
                  >
                    <span className="flex items-center justify-between gap-2 font-medium">
                      {source.sellerName} <ExternalLink className="h-3 w-3" />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{source.notes}</span>
                  </a>
                ))}
                {project.researchSources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No research sources yet.</p>
                ) : null}
              </CardContent>
            </Card>

            {project.warnings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Warnings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-warning">
                  {project.warnings.map((warning) => <p key={warning}>• {warning}</p>)}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function BriefRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{typeof value === "string" || typeof value === "number" ? value : "—"}</dd>
    </div>
  );
}
