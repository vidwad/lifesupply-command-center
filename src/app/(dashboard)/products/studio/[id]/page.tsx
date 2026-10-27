import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ImageIcon,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
  Wrench,
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
import { MAX_OPERATOR_INSTRUCTIONS } from "@/server/services/product-studio/prompt-controls";
import { listBatchProjects } from "@/server/services/product-studio/bulk";
import { storePriceFor } from "@/server/services/product-studio/report";
import { describeStorePrice } from "@/server/services/product-studio/store-price";
import { storeImageCount, storeThumbnailImageId } from "@/server/services/products";
import { MAX_LONG_DESCRIPTION } from "@/server/services/product-studio/description";
import {
  MAX_SOURCE_PHOTOS,
  sourcePhotosLocked,
} from "@/server/services/product-studio/source-photos";
import {
  canUserPublish,
  descriptionNeedsPublish,
  latestGeneratedBySlot,
  liveImageIdForSlot,
  resolvePublishTarget,
  selectPublishItems,
} from "@/server/services/product-studio/publish-eligibility";
import { stripListingLinks } from "@/server/services/product-studio/listing-copy";
import { parseListingBlocks } from "@/server/services/product-studio/listing-format";
import {
  lastPublishedDescriptionHtml,
  listPublishLogs,
  publishFlagState,
} from "@/server/services/product-studio/publish-read";
import {
  approvedSlotCount,
  buildWorkflowSteps,
  isWorkflowBusy,
} from "@/server/services/product-studio/workflow-progress";

import {
  queueGenerationAction,
  queueResearchAction,
  recompilePromptsAction,
  reformatDescriptionAction,
  reviewAssetAction,
  updateDescriptionAction,
  updateSourcePhotosAction,
} from "../actions";
import { StudioActionForm } from "../studio-action-form";
import { PublishPanel } from "./publish-panel";
import { WorkflowProgress } from "./workflow-progress";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const project = await getProductStudioProject(id);
  return {
    title: project
      ? `${project.confirmedTitle ?? project.title} · Product Studio`
      : "Product Studio",
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function ProductStudioDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  await requirePermission(PERMISSIONS.AI_USE);
  const { id } = await params;
  // The publishing card is for Super Admin only, so its history and flag
  // state are not even queried for anyone else.
  const mayPublish = canUserPublish(user);
  const [project, flags, publishFlags, publishLogs, publishedDescriptionHtml] = await Promise.all([
    getProductStudioProject(id),
    getFeatureFlags([FEATURE_FLAGS.PRODUCT_STUDIO, FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION]),
    mayPublish ? publishFlagState() : Promise.resolve(null),
    mayPublish ? listPublishLogs(id) : Promise.resolve([]),
    mayPublish ? lastPublishedDescriptionHtml(id) : Promise.resolve(null),
  ]);
  if (!project) notFound();

  // Shown and published without links or citations (2026-10-26), whatever
  // the stored text holds, so what the owner reads is what the store gets.
  const cleanLongDescription = project.longDescription
    ? stripListingLinks(project.longDescription)
    : null;

  const sourceAssets = project.assets.filter((asset) => asset.kind === "source");
  const allGeneratedAssets = project.assets.filter((asset) => asset.kind === "generated");
  const generatedAssets = allGeneratedAssets.filter(
    (asset, index) =>
      allGeneratedAssets.findIndex(
        (candidate) => candidate.compositionSlot === asset.compositionSlot,
      ) === index,
  );
  const nextComposition = project.compositions.find((item) =>
    ["planned", "failed"].includes(item.status),
  );
  // Busyness must include the research phase, which runs before any
  // composition row exists. Deriving it from compositions alone left the
  // whole research stage rendering as idle with no button and no progress.
  const progressInput = {
    status: project.status,
    compositions: project.compositions,
    assets: project.assets,
  };
  const busy = isWorkflowBusy(progressInput);
  const workflowSteps = buildWorkflowSteps(progressInput);
  const approvedCount = approvedSlotCount(progressInput);
  const remainingSlots = project.compositions.filter((item) =>
    ["planned", "failed"].includes(item.status),
  ).length;
  // Research is grounded in the photographs, so a project created in bulk
  // from a product with no store image cannot research until one is added.
  const hasSourcePhotos = sourceAssets.length > 0;
  const canResearch =
    flags[FEATURE_FLAGS.PRODUCT_STUDIO] &&
    generatedAssets.length === 0 &&
    hasSourcePhotos &&
    ["draft", "failed"].includes(project.status);
  const photosLocked = sourcePhotosLocked({
    status: project.status,
    compositionCount: project.compositions.length,
  });
  // Stepping through a batch created from the products list (2026-10-26).
  const batch = project.batchId ? await listBatchProjects(project.batchId) : [];
  const batchIndex = batch.findIndex((item) => item.id === project.id);
  const batchPrevious = batchIndex > 0 ? batch[batchIndex - 1] : null;
  const batchNext = batchIndex >= 0 && batchIndex < batch.length - 1 ? batch[batchIndex + 1] : null;
  const canUseGeneration =
    flags[FEATURE_FLAGS.PRODUCT_STUDIO] && flags[FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION];
  const canGenerate = canUseGeneration && Boolean(nextComposition) && !busy;
  const summary = asRecord(project.researchSummary);
  const identity = asRecord(summary?.identifiedProduct);
  const benchmark = asRecord(summary?.benchmarkListing);

  // Everything the publishing card shows is derived by the same pure rules
  // the publish service applies, so the card can never promise what the
  // service would refuse.
  const publishTarget = mayPublish ? resolvePublishTarget(project.product) : null;
  const publishImages = mayPublish
    ? latestGeneratedBySlot(project.assets).map((asset) => ({
        assetId: asset.id,
        slot: asset.compositionSlot ?? 0,
        name:
          project.compositions.find((item) => item.slot === asset.compositionSlot)?.name ??
          "Composition",
        revision: asset.revision,
        status: asset.status,
        uploadApproved: asset.uploadApprovedAt != null,
        publishedAt: asset.publishedAt?.toISOString() ?? null,
        bigCommerceImageId: asset.bigCommerceImageId,
        replacesImageId: asset.publishedAt
          ? null
          : liveImageIdForSlot(project.assets, asset.compositionSlot ?? 0),
      }))
    : [];
  const storeImages = {
    imageCount: storeImageCount(project.product?.metadata),
    thumbnailImageId: storeThumbnailImageId(project.product?.metadata),
  };
  const storePrice = storePriceFor(project);
  const publishPending = mayPublish
    ? selectPublishItems({
        project,
        assets: project.assets,
        compositions: project.compositions,
        publishedDescriptionHtml,
        mainImageAssetId: project.mainImageAssetId,
        store: storeImages,
      }).length
    : 0;
  const descriptionChangedSincePublish =
    project.descriptionPublishedAt != null &&
    descriptionNeedsPublish({
      text: cleanLongDescription ?? "",
      descriptionPublishedAt: project.descriptionPublishedAt,
      publishedDescriptionHtml,
    });
  const formatWhen = (value: Date) => value.toISOString().replace("T", " ").slice(0, 16) + " UTC";

  return (
    <div>
      <PageHeader
        title={stripListingLinks(project.confirmedTitle ?? project.title)}
        description={stripListingLinks(project.finalDescription ?? project.shortDescription)}
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

      {project.batchId && batchIndex >= 0 ? (
        <div className="px-6 pt-6">
          <nav
            aria-label="Batch"
            className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
          >
            <Link
              href={`/products/studio?batch=${project.batchId}`}
              className="font-medium hover:underline"
            >
              Batch
            </Link>
            <span className="text-muted-foreground">
              {batchIndex + 1} of {batch.length}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · {batch.filter((item) => item._count.assets === 0).length} without a photograph ·{" "}
              {batch.filter((item) => item.status === "approved").length} approved
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline" size="sm" disabled={!batchPrevious}>
                <Link
                  href={batchPrevious ? `/products/studio/${batchPrevious.id}` : "#"}
                  aria-disabled={!batchPrevious}
                  title={
                    batchPrevious
                      ? (batchPrevious.confirmedTitle ?? batchPrevious.title)
                      : undefined
                  }
                >
                  <ChevronLeft /> Previous
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={!batchNext}>
                <Link
                  href={batchNext ? `/products/studio/${batchNext.id}` : "#"}
                  aria-disabled={!batchNext}
                  title={batchNext ? (batchNext.confirmedTitle ?? batchNext.title) : undefined}
                >
                  Next <ChevronRight />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}

      {cleanLongDescription || project.compositions.length > 0 ? (
        <div className="px-6 pt-6">
          <details className="rounded-lg border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Full product description
            </summary>
            <div className="space-y-3 border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {cleanLongDescription ? (
                // The same blocks the store will render (2026-10-26).
                parseListingBlocks(cleanLongDescription).map((block, index) =>
                  block.type === "title" ? (
                    <p key={index} className="font-medium text-foreground">
                      {block.text}
                    </p>
                  ) : block.type === "list" ? (
                    <ul key={index} className="list-disc space-y-1 pl-5">
                      {block.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={index}>
                      {block.lines.map((line, i) => (
                        <span key={i}>
                          {i > 0 ? <br /> : null}
                          {line}
                        </span>
                      ))}
                    </p>
                  ),
                )
              ) : (
                <p>No full description yet. Write one below.</p>
              )}
              {cleanLongDescription && !busy ? (
                /*
                 * Restructures the existing text into the short-paragraph and
                 * bullet form without changing its facts (2026-10-26). A guard
                 * refuses the rewrite if any number, code or measurement from
                 * the original is missing. Clears the upload mark like an edit.
                 */
                <StudioActionForm action={reformatDescriptionAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <Button type="submit" size="sm" variant="outline">
                    <Sparkles /> Reformat with AI
                  </Button>
                  <p className="mt-1 text-xs">
                    Rewrites into short paragraphs and bullet points for specifications. Every
                    figure and code in the current text must survive, or the result is refused.
                  </p>
                </StudioActionForm>
              ) : null}
              {/*
               * Editable at any point, including after approval or publishing
               * (2026-10-26). Saving strips links, clears the upload mark so the
               * edited text is selected afresh, and leaves the store unchanged
               * until it is published again.
               */}
              <details className="rounded-md border bg-background">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-foreground">
                  Edit the description
                </summary>
                <StudioActionForm action={updateDescriptionAction} className="space-y-2 p-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <textarea
                    name="longDescription"
                    rows={12}
                    maxLength={MAX_LONG_DESCRIPTION}
                    defaultValue={cleanLongDescription ?? ""}
                    className="w-full rounded-md border bg-background p-2 text-xs leading-relaxed text-foreground"
                  />
                  <p className="text-xs">
                    Plain paragraphs, separated by a blank line. Links and citations are removed on
                    save. Saving clears the &quot;approved for upload&quot; mark; a published
                    description stays on the store until the edited one is marked and published
                    again.
                  </p>
                  <Button type="submit" size="sm" variant="outline">
                    <Check /> Save description
                  </Button>
                </StudioActionForm>
              </details>
            </div>
          </details>
        </div>
      ) : null}
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
              <CardContent className="space-y-4">
                {sourceAssets.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No photograph yet. The store listing had none, so add one to four below before
                    researching.
                  </div>
                ) : (
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
                )}
                {/*
                 * Photographs can be added or replaced until research has run
                 * (2026-10-26). A project opened in bulk starts with the store's
                 * image; one photo is usually enough, three or four are better.
                 */}
                {photosLocked ? (
                  <p className="text-xs text-muted-foreground">
                    Photographs are locked once research has run, because the identity analysis and
                    every prompt were derived from them. Start a new project to use different ones.
                  </p>
                ) : (
                  <StudioActionForm
                    action={updateSourcePhotosAction}
                    className="space-y-2 rounded-md border p-3"
                  >
                    <input type="hidden" name="projectId" value={project.id} />
                    <label className="block text-xs font-medium" htmlFor="source-photos">
                      {sourceAssets.length === 0
                        ? "Add photographs"
                        : `Add or replace photographs (${sourceAssets.length} of ${MAX_SOURCE_PHOTOS})`}
                    </label>
                    <input
                      id="source-photos"
                      type="file"
                      name="referenceImages"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      required
                      className="block w-full text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG or WebP, up to 8 MiB each, {MAX_SOURCE_PHOTOS} in total. Photos of
                      the actual item, from more than one angle, give research and the generated
                      images the most to work with.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm" variant="outline" name="mode" value="add">
                        <Upload /> Add
                      </Button>
                      {sourceAssets.length > 0 ? (
                        <Button type="submit" size="sm" variant="ghost" name="mode" value="replace">
                          <RefreshCw /> Replace all
                        </Button>
                      ) : null}
                    </div>
                  </StudioActionForm>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Four researched compositions</CardTitle>
                <CardDescription>
                  Generated sequentially to control cost and let you review identity before
                  continuing.
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
                      const priorRevisions = allGeneratedAssets.filter(
                        (item) =>
                          item.compositionSlot === composition.slot && item.id !== asset?.id,
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
                              <a
                                href={`/api/product-studio/assets/${asset.id}?download=1`}
                                download
                                className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:bg-background"
                                title={`Download ${asset.fileName}`}
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </a>
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
                                {composition.sourceSeller ?? "Retailer evidence"}{" "}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                            {qa ? (
                              <div className="rounded-md bg-muted p-3 text-xs">
                                <p className="font-medium">
                                  Automated QA: {String(qa.verdict ?? "needs review")}
                                  {typeof qa.confidence === "number"
                                    ? ` (${Math.round(Number(qa.confidence) * 100)}% confident)`
                                    : ""}
                                </p>
                                <p className="mt-1 text-muted-foreground">
                                  Identity {Math.round(Number(qa.identityScore ?? 0) * 100)}% ·
                                  Condition{" "}
                                  {Math.round(Number(qa.conditionFidelityScore ?? 0) * 100)}% ·
                                  Composition {Math.round(Number(qa.compositionScore ?? 0) * 100)}%
                                </p>
                                {asStrings(qa.differences).map((difference) => (
                                  <p key={difference} className="mt-1 text-muted-foreground">
                                    • {difference}
                                  </p>
                                ))}
                                {asStrings(qa.requiredCorrections).length > 0 ? (
                                  <div className="mt-2">
                                    <p className="font-medium">Required corrections</p>
                                    {asStrings(qa.requiredCorrections).map((correction) => (
                                      <p key={correction} className="mt-1 text-muted-foreground">
                                        • {correction}
                                      </p>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                            {asset ? (
                              <div className="flex flex-wrap gap-2">
                                <StudioActionForm action={reviewAssetAction}>
                                  <input type="hidden" name="projectId" value={project.id} />
                                  <input type="hidden" name="assetId" value={asset.id} />
                                  <input type="hidden" name="decision" value="approved" />
                                  <Button type="submit" size="sm" variant="outline">
                                    <Check /> Approve
                                  </Button>
                                </StudioActionForm>
                                <StudioActionForm action={reviewAssetAction}>
                                  <input type="hidden" name="projectId" value={project.id} />
                                  <input type="hidden" name="assetId" value={asset.id} />
                                  <input type="hidden" name="decision" value="rejected" />
                                  <Button type="submit" size="sm" variant="outline">
                                    <X /> Reject
                                  </Button>
                                </StudioActionForm>
                                {asset.status === "rejected" && canUseGeneration && !busy ? (
                                  <StudioActionForm
                                    action={queueGenerationAction}
                                    className="w-full space-y-2 rounded-md border p-3"
                                  >
                                    <input type="hidden" name="projectId" value={project.id} />
                                    <input type="hidden" name="slot" value={composition.slot} />
                                    <label
                                      className="block text-xs font-medium"
                                      htmlFor={`instructions-${composition.slot}`}
                                    >
                                      Adjust and regenerate (revision {asset.revision + 1})
                                    </label>
                                    <textarea
                                      id={`instructions-${composition.slot}`}
                                      name="operatorInstructions"
                                      rows={2}
                                      maxLength={MAX_OPERATOR_INSTRUCTIONS}
                                      placeholder="Optional. e.g. Show the box only. Turn the identifier panel away from camera."
                                      className="w-full rounded-md border bg-background p-2 text-xs"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      {asStrings(qa?.requiredCorrections).length > 0 ? (
                                        <>
                                          The{" "}
                                          <strong>
                                            {asStrings(qa?.requiredCorrections).length} required
                                            correction
                                            {asStrings(qa?.requiredCorrections).length === 1
                                              ? ""
                                              : "s"}{" "}
                                            above
                                          </strong>{" "}
                                          are sent automatically — no need to copy them here. Use
                                          this box only for extra guidance.{" "}
                                        </>
                                      ) : null}
                                      Changes staging and framing only. Product identity and visible
                                      condition stay locked to your source photographs.
                                    </p>
                                    <Button type="submit" size="sm" variant="outline">
                                      <RefreshCw /> Regenerate
                                    </Button>
                                  </StudioActionForm>
                                ) : null}
                                {asset.status === "approved" && canUseGeneration && !busy ? (
                                  /*
                                   * An approved image can be revised (2026-10-26). The new
                                   * revision is reviewed and marked like any other; if this one
                                   * was published, publishing the revision replaces it on the
                                   * store. This revision stays on record below.
                                   */
                                  <details className="w-full rounded-md border">
                                    <summary className="cursor-pointer px-3 py-2 text-xs font-medium">
                                      Revise this image (revision {asset.revision + 1})
                                    </summary>
                                    <StudioActionForm
                                      action={queueGenerationAction}
                                      className="space-y-2 border-t p-3"
                                    >
                                      <input type="hidden" name="projectId" value={project.id} />
                                      <input type="hidden" name="slot" value={composition.slot} />
                                      <input type="hidden" name="revise" value="1" />
                                      <label
                                        className="block text-xs font-medium"
                                        htmlFor={`revise-${composition.slot}`}
                                      >
                                        What should change
                                      </label>
                                      <textarea
                                        id={`revise-${composition.slot}`}
                                        name="operatorInstructions"
                                        rows={2}
                                        maxLength={MAX_OPERATOR_INSTRUCTIONS}
                                        placeholder="e.g. Tighter crop on the box front. Plain white background."
                                        className="w-full rounded-md border bg-background p-2 text-xs"
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Changes staging and framing only. Product identity and
                                        visible condition stay locked to your source photographs.
                                        The new revision needs review and an upload mark before it
                                        can go to the store
                                        {asset.publishedAt
                                          ? ", where it will replace the published image"
                                          : ""}
                                        .
                                      </p>
                                      <Button type="submit" size="sm" variant="outline">
                                        <RefreshCw /> Generate revision {asset.revision + 1}
                                      </Button>
                                    </StudioActionForm>
                                  </details>
                                ) : null}
                              </div>
                            ) : null}
                            {priorRevisions.length > 0 ? (
                              <details className="text-xs">
                                <summary className="cursor-pointer font-medium">
                                  Revision history ({priorRevisions.length} prior)
                                </summary>
                                <ul className="mt-2 space-y-1">
                                  {priorRevisions.map((prior) => {
                                    const priorQa = asRecord(prior.qaResult);
                                    return (
                                      <li
                                        key={prior.id}
                                        className="flex items-center justify-between gap-2 rounded-md border p-2"
                                      >
                                        <span className="text-muted-foreground">
                                          r{prior.revision} · {prior.status.replaceAll("_", " ")}
                                          {priorQa
                                            ? ` · QA ${String(priorQa.verdict ?? "—")}`
                                            : ""}{" "}
                                          ·{" "}
                                          {prior.createdAt
                                            .toISOString()
                                            .slice(0, 16)
                                            .replace("T", " ")}
                                        </span>
                                        <a
                                          href={`/api/product-studio/assets/${prior.id}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          View
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </details>
                            ) : null}
                            <details className="text-xs">
                              <summary className="cursor-pointer font-medium">
                                View generated prompt
                              </summary>
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
                <CardDescription>
                  Long-running AI work is handled by the background worker.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <WorkflowProgress steps={workflowSteps} />
                <p className="text-xs text-muted-foreground">
                  {approvedCount} of 4 image{approvedCount === 1 ? "" : "s"} approved.
                </p>
                {!hasSourcePhotos && ["draft", "failed"].includes(project.status) ? (
                  <p className="text-sm text-muted-foreground">
                    Add at least one photograph in the card to the left before researching.
                  </p>
                ) : null}
                {canResearch ? (
                  <StudioActionForm action={queueResearchAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <Button type="submit" className="w-full">
                      <Search /> Research retailers and prices
                    </Button>
                  </StudioActionForm>
                ) : null}
                {canGenerate && nextComposition ? (
                  <div className="space-y-2">
                    <StudioActionForm action={queueGenerationAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="slot" value={nextComposition.slot} />
                      <Button type="submit" className="w-full">
                        <Sparkles /> Generate composition {nextComposition.slot}
                      </Button>
                    </StudioActionForm>
                    {remainingSlots > 1 ? (
                      <StudioActionForm action={queueGenerationAction}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="slot" value={nextComposition.slot} />
                        <input type="hidden" name="autoContinue" value="1" />
                        <Button type="submit" variant="outline" className="w-full">
                          <Layers /> Generate all {remainingSlots} remaining
                        </Button>
                      </StudioActionForm>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {remainingSlots > 1
                        ? `Runs one at a time. Stops early if image QA rejects a draft, so a drifting identity does not consume the rest.`
                        : `One composition left.`}
                    </p>
                  </div>
                ) : null}
                {busy && !canResearch && !canGenerate ? (
                  <p className="text-sm text-muted-foreground">
                    The worker is processing this project. Progress above updates automatically.
                  </p>
                ) : null}
                {!flags[FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION] &&
                project.compositions.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Image generation is off. Enable {FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION}{" "}
                    only after confirming OpenAI budget and worker capacity.
                  </p>
                ) : null}
                {project.compositions.length > 0 && !busy ? (
                  <StudioActionForm action={recompilePromptsAction} className="border-t pt-3">
                    <input type="hidden" name="projectId" value={project.id} />
                    <Button type="submit" size="sm" variant="ghost" className="w-full">
                      <Wrench /> Rebuild prompts from current rules
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Composition prompts are written once, during research. Rebuild to apply
                      prompt-rule improvements made since then. Free — no AI call, and research is
                      not changed.
                    </p>
                  </StudioActionForm>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Approval here means internally accepted draft only. Publishing to the store is a
                  separate step for a Super Admin, under its own controls.
                </p>
              </CardContent>
            </Card>

            {mayPublish && publishFlags && publishTarget ? (
              <PublishPanel
                projectId={project.id}
                target={publishTarget.target}
                targetReason={publishTarget.reason}
                disabledFlags={publishFlags.disabledFlags}
                busy={busy}
                images={publishImages}
                description={{
                  present: Boolean(cleanLongDescription),
                  preview: cleanLongDescription?.slice(0, 280) ?? "",
                  uploadApproved: project.descriptionUploadApprovedAt != null,
                  publishedAt: project.descriptionPublishedAt?.toISOString() ?? null,
                  changedSincePublish: descriptionChangedSincePublish,
                }}
                pendingCount={publishPending}
                mainImageAssetId={project.mainImageAssetId}
                store={storeImages}
                logs={publishLogs.map((log) => ({
                  id: log.id,
                  label:
                    log.kind === "description"
                      ? "Full description"
                      : "Composition " +
                        String(log.asset?.compositionSlot ?? "?") +
                        (log.asset && log.asset.revision > 1 ? ` r${log.asset.revision}` : "") +
                        (log.bigCommerceImageId != null
                          ? ` → image #${log.bigCommerceImageId}`
                          : ""),
                  status: log.status,
                  who: log.writtenBy?.name ?? log.writtenBy?.email ?? null,
                  at: formatWhen(log.writtenAt ?? log.createdAt),
                  error: log.errorMessage,
                }))}
              />
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identity and listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {identity ? (
                  <dl className="space-y-2">
                    <BriefRow label="Brand" value={identity.brand} />
                    <BriefRow label="Model" value={identity.model} />
                    <BriefRow
                      label="Confidence"
                      value={`${Math.round(Number(identity.confidence ?? 0) * 100)}%`}
                    />
                  </dl>
                ) : (
                  <p className="text-muted-foreground">
                    Identity confirmation is pending research.
                  </p>
                )}
                {summary ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Key details
                    </p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {asStrings(summary.keyDetails).map((detail) => (
                        <li key={detail}>• {detail}</li>
                      ))}
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
                <CardDescription>
                  Asking prices are evidence, not an appraisal or guaranteed sale price.
                </CardDescription>
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
                {/* The store's own listing against the range (2026-10-26). */}
                {storePrice ? (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {storePrice.storeName ?? "Our store"} today
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="text-lg font-semibold tabular-nums">
                        {formatCurrency(storePrice.price, storePrice.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        cost{" "}
                        {storePrice.cost != null
                          ? formatCurrency(storePrice.cost, storePrice.currency)
                          : "not known"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        margin{" "}
                        {storePrice.margin != null
                          ? `${Math.round(storePrice.margin * 1000) / 10}%`
                          : "—"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {describeStorePrice(storePrice)}
                    </p>
                  </div>
                ) : project.product ? (
                  <p className="text-xs text-muted-foreground">
                    No listed price on the catalogue product.
                  </p>
                ) : null}
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
                          {observation.includedAccessories
                            ? ` · incl. ${observation.includedAccessories}`
                            : ""}
                        </span>
                        {observation.notes ? (
                          <span className="block text-xs text-muted-foreground">
                            {observation.notes}
                          </span>
                        ) : null}
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
                  {project.warnings.map((warning) => (
                    <p key={warning}>• {warning}</p>
                  ))}
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
