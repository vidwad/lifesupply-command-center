import { createHash } from "node:crypto";
import { normaliseOperatorInstructions } from "./prompt-controls";
import { parseDepictableSpec, parseProductMode } from "./depiction";
import { compileProductImagePrompt } from "./prompts";
import { rebuildCompositionBrief, rebuildIdentity, rebuildListing } from "./recompile";
import { isWorkflowBusy } from "./workflow-progress";
import { reportThumbnailFor } from "./report-thumbnails";

import type { Prisma, ProductStudioProjectStatus } from "@prisma/client";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { requireFeature } from "@/server/services/feature-flags";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_IMAGES = 4;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

export class ProductStudioInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductStudioInputError";
  }
}

function sanitizeFileName(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return safe || "reference-image";
}

export type PreparedSourceImage = {
  fileName: string;
  contentType: string;
  bytes: number;
  /** Buffer over a plain ArrayBuffer — the shape Prisma's Bytes field requires. */
  data: Buffer<ArrayBuffer>;
  contentHash: string;
  /** The report-sized JPEG, stored beside the image (report-thumbnails.ts). */
  reportThumbnail: Uint8Array<ArrayBuffer> | null;
};

/**
 * Server-side intake validation (pure with respect to the database). Every
 * rule is enforced here regardless of what the browser form allowed:
 * text bounds, 1–4 files, JPEG/PNG/WebP only, non-empty, ≤ 8 MiB each.
 * Each accepted file gets a SHA-256 content hash for provenance.
 */
export async function prepareProductStudioIntake(args: {
  title: string;
  shortDescription: string;
  files: File[];
}): Promise<{ title: string; shortDescription: string; prepared: PreparedSourceImage[] }> {
  const title = args.title.trim();
  const shortDescription = args.shortDescription.trim();
  if (title.length < 3 || title.length > 240) {
    throw new ProductStudioInputError("Title must be between 3 and 240 characters.");
  }
  if (shortDescription.length < 10 || shortDescription.length > 4000) {
    throw new ProductStudioInputError("Description must be between 10 and 4,000 characters.");
  }
  if (args.files.length < 1 || args.files.length > MAX_SOURCE_IMAGES) {
    throw new ProductStudioInputError(`Upload between 1 and ${MAX_SOURCE_IMAGES} source photos.`);
  }

  const prepared = await Promise.all(
    args.files.map(async (file) => {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        throw new ProductStudioInputError(`${file.name}: use JPEG, PNG, or WebP.`);
      }
      if (file.size < 1) {
        throw new ProductStudioInputError(`${file.name}: the file is empty.`);
      }
      if (file.size > MAX_SOURCE_BYTES) {
        throw new ProductStudioInputError(`${file.name}: each image must be 8 MiB or smaller.`);
      }
      const data = Buffer.from(await file.arrayBuffer());
      return {
        fileName: sanitizeFileName(file.name),
        contentType: file.type,
        bytes: data.byteLength,
        data,
        contentHash: createHash("sha256").update(data).digest("hex"),
        reportThumbnail: await reportThumbnailFor(data, file.type),
      };
    }),
  );
  return { title, shortDescription, prepared };
}

export async function createProductStudioProject(args: {
  actorUserId: string;
  productId?: string | null;
  title: string;
  shortDescription: string;
  files: File[];
}): Promise<string> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const { title, shortDescription, prepared } = await prepareProductStudioIntake(args);

  if (args.productId) {
    const exists = await prisma.product.count({ where: { id: args.productId, deletedAt: null } });
    if (!exists)
      throw new ProductStudioInputError("The selected catalog product no longer exists.");
  }

  const project = await prisma.productStudioProject.create({
    data: {
      productId: args.productId || null,
      createdById: args.actorUserId,
      title,
      shortDescription,
      warnings: [],
      assets: {
        create: prepared.map((asset) => ({ ...asset, kind: "source", status: "uploaded" })),
      },
    },
  });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.project_created",
    entityType: "ProductStudioProject",
    entityId: project.id,
    afterData: {
      productId: args.productId || null,
      title,
      sourceImageCount: prepared.length,
      sourceImageHashes: prepared.map((asset) => asset.contentHash),
    },
  });
  return project.id;
}

/**
 * Status filters for the project list (product owner, 2026-10-27). Each
 * groups the statuses an operator thinks of together: the four working
 * states read as "in progress".
 */
export const PROJECT_STATUS_FILTERS = {
  draft: ["draft"],
  in_progress: ["research_queued", "researching", "ready_to_generate", "generating"],
  needs_review: ["needs_review"],
  approved: ["approved"],
  failed: ["failed"],
} as const satisfies Record<string, readonly ProductStudioProjectStatus[]>;
export type ProjectStatusFilter = keyof typeof PROJECT_STATUS_FILTERS;
export const PROJECT_STATUS_FILTER_KEYS = Object.keys(
  PROJECT_STATUS_FILTERS,
) as ProjectStatusFilter[];
export const PROJECT_STATUS_FILTER_LABELS: Record<ProjectStatusFilter, string> = {
  draft: "Draft",
  in_progress: "In progress",
  needs_review: "Needs review",
  approved: "Approved",
  failed: "Failed",
};

export function parseProjectStatusFilter(
  value: string | undefined,
): ProjectStatusFilter | undefined {
  return value != null && Object.hasOwn(PROJECT_STATUS_FILTERS, value)
    ? (value as ProjectStatusFilter)
    : undefined;
}

export const PROJECT_SORT_KEYS = ["updated", "created", "title", "status", "product"] as const;
export type ProjectSortKey = (typeof PROJECT_SORT_KEYS)[number];

export function parseProjectSort(value: string | undefined): ProjectSortKey | undefined {
  return PROJECT_SORT_KEYS.includes(value as ProjectSortKey)
    ? (value as ProjectSortKey)
    : undefined;
}

/** Every branch ends with id so paging and re-renders are deterministic. */
function projectOrderBy(
  sort: ProjectSortKey | undefined,
  dir: "asc" | "desc",
  batch: boolean,
): Prisma.ProductStudioProjectOrderByWithRelationInput[] {
  switch (sort) {
    case "created":
      return [{ createdAt: dir }, { id: "asc" }];
    case "title":
      return [{ title: dir }, { id: "asc" }];
    case "status":
      return [{ status: dir }, { id: "asc" }];
    case "product":
      // A relation field cannot take a nulls placement; unlinked projects
      // sort as the database decides.
      return [{ product: { name: dir } }, { id: "asc" }];
    case "updated":
      return [{ updatedAt: dir }, { id: "asc" }];
    default:
      // A batch lists in the order it was created so it reads top to bottom;
      // otherwise the most recently worked-on project first.
      return batch ? [{ createdAt: "asc" }, { id: "asc" }] : [{ updatedAt: "desc" }, { id: "asc" }];
  }
}

export type ListProjectsFilter = {
  batchId?: string | null;
  status?: ProjectStatusFilter;
  sort?: ProjectSortKey;
  dir?: "asc" | "desc";
};

/** The where clause the list and its counts share, so they cannot disagree. */
function projectWhere(filter: ListProjectsFilter): Prisma.ProductStudioProjectWhereInput {
  const where: Prisma.ProductStudioProjectWhereInput = {};
  if (filter.batchId) where.batchId = filter.batchId;
  if (filter.status) where.status = { in: [...PROJECT_STATUS_FILTERS[filter.status]] };
  return where;
}

/**
 * How many projects each status filter would show under the current batch,
 * plus the total, for the filter pills.
 */
export async function countProductStudioProjectsByStatus(
  filter: Pick<ListProjectsFilter, "batchId">,
): Promise<Record<ProjectStatusFilter | "all", number>> {
  const grouped = await prisma.productStudioProject.groupBy({
    by: ["status"],
    where: projectWhere(filter),
    _count: { _all: true },
  });
  const byStatus = new Map(grouped.map((row) => [row.status, row._count._all]));
  const counts = { all: 0 } as Record<ProjectStatusFilter | "all", number>;
  for (const key of PROJECT_STATUS_FILTER_KEYS) {
    counts[key] = PROJECT_STATUS_FILTERS[key].reduce(
      (sum, status) => sum + (byStatus.get(status) ?? 0),
      0,
    );
  }
  counts.all = grouped.reduce((sum, row) => sum + row._count._all, 0);
  return counts;
}

export async function listProductStudioProjects(filter: ListProjectsFilter = {}) {
  return prisma.productStudioProject.findMany({
    where: projectWhere(filter),
    orderBy: projectOrderBy(filter.sort, filter.dir ?? "asc", Boolean(filter.batchId)),
    take: 100,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      // Small per-asset rows for the list's photo, approval and publish
      // counts (2026-10-26); never the bytes.
      assets: {
        select: {
          kind: true,
          status: true,
          compositionSlot: true,
          revision: true,
          publishedAt: true,
        },
      },
      _count: { select: { assets: true, researchSources: true, compositions: true } },
    },
  });
}

/** Counts the list and the report both show for a project. */
export function summarizeProjectAssets(
  assets: readonly {
    kind: string;
    status: string;
    compositionSlot: number | null;
    revision: number;
    publishedAt: Date | null;
  }[],
): { sourceCount: number; approvedSlots: number; publishedSlots: number } {
  const latest = new Map<number, (typeof assets)[number]>();
  for (const asset of assets) {
    if (asset.kind !== "generated" || asset.compositionSlot == null) continue;
    const current = latest.get(asset.compositionSlot);
    if (!current || asset.revision > current.revision) latest.set(asset.compositionSlot, asset);
  }
  return {
    sourceCount: assets.filter((asset) => asset.kind === "source").length,
    approvedSlots: [...latest.values()].filter((asset) => asset.status === "approved").length,
    publishedSlots: new Set(
      assets
        .filter((asset) => asset.kind === "generated" && asset.publishedAt)
        .map((asset) => asset.compositionSlot),
    ).size,
  };
}

export async function getProductStudioProject(id: string) {
  return prisma.productStudioProject.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          storeId: true,
          sourceSystem: true,
          sourceId: true,
          metadata: true,
          store: { select: { name: true } },
          // The store's own price and cost, read as the products list reads
          // them: the primary variant, then the preferred supplier's cost.
          variants: {
            select: { sku: true, price: true, costPrice: true },
            orderBy: { sku: "asc" },
            take: 1,
          },
          supplierProducts: { where: { isPreferred: true }, select: { cost: true }, take: 1 },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
      assets: {
        select: {
          id: true,
          kind: true,
          compositionSlot: true,
          revision: true,
          fileName: true,
          contentType: true,
          bytes: true,
          contentHash: true,
          width: true,
          height: true,
          prompt: true,
          modelName: true,
          status: true,
          qaResult: true,
          uploadApprovedAt: true,
          publishedAt: true,
          bigCommerceImageId: true,
          autoReviewedAt: true,
          createdAt: true,
        },
        orderBy: [{ kind: "asc" }, { compositionSlot: "asc" }, { revision: "desc" }],
      },
      autopilotRun: { select: { id: true, status: true, createdAt: true } },
      researchSources: { orderBy: { capturedAt: "asc" } },
      priceObservations: { orderBy: { price: "asc" } },
      compositions: { orderBy: { slot: "asc" } },
    },
  });
}

export async function getProductStudioAsset(id: string) {
  return prisma.productStudioAsset.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true,
      fileName: true,
      contentType: true,
      bytes: true,
      data: true,
      contentHash: true,
      status: true,
    },
  });
}

/**
 * Refuses a manual step while an unattended run owns the project
 * (2026-10-27). The run re-derives its next step from the project's rows, so
 * a person's research, generation, review or deletion landing in between
 * would be acted on, or deleted under, by the worker.
 */
export async function assertNotUnderAutopilot(
  project: { autopilotRunId: string | null },
  what: string,
): Promise<void> {
  if (!project.autopilotRunId) return;
  const run = await prisma.productStudioRun.findUnique({
    where: { id: project.autopilotRunId },
    select: { status: true },
  });
  if (run && ["queued", "running"].includes(run.status)) {
    throw new ProductStudioInputError(
      `${what} is unavailable while an unattended run is processing this project. ` +
        "Wait for the run to finish, or stop it from the Automation Center.",
    );
  }
}

export async function queueProductStudioResearch(args: {
  projectId: string;
  actorUserId: string;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const project = await prisma.productStudioProject.findUniqueOrThrow({
    where: { id: args.projectId },
    include: { _count: { select: { assets: { where: { kind: "generated" } } } } },
  });
  await assertNotUnderAutopilot(project, "Research");
  if (project._count.assets > 0) {
    throw new ProductStudioInputError(
      "Research cannot be replaced after image generation. Start a new project to preserve provenance.",
    );
  }
  // A project created in bulk may have no photograph yet (the store had none);
  // research is grounded in the photographs, so there must be at least one.
  const sourceCount = await prisma.productStudioAsset.count({
    where: { projectId: args.projectId, kind: "source" },
  });
  if (sourceCount === 0) {
    throw new ProductStudioInputError(
      "Add at least one authoritative photograph before researching this product.",
    );
  }
  if (["research_queued", "researching", "generating"].includes(project.status)) {
    throw new ProductStudioInputError("This project already has work in progress.");
  }
  await prisma.productStudioProject.update({
    where: { id: args.projectId },
    data: { status: "research_queued", errorMessage: null },
  });
  await inngest.send({
    id: `product-studio-research-${args.projectId}-${Date.now()}`,
    name: "product-studio/research.requested",
    data: args,
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.research_queued",
    entityType: "ProductStudioProject",
    entityId: args.projectId,
  });
}

export async function queueProductStudioGeneration(args: {
  projectId: string;
  slot: number;
  actorUserId: string;
  /** Operator staging/framing guidance appended to the researched prompt. */
  operatorInstructions?: string | null;
  /** Chain the remaining planned slots after this one succeeds. */
  autoContinue?: boolean;
  /**
   * Revise an image that is already approved (2026-10-26): a new revision is
   * generated and reviewed again; the approved one stays on record, and if it
   * was published, the revision replaces it on the store when published.
   */
  revise?: boolean;
}): Promise<void> {
  await Promise.all([
    requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO),
    requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION),
  ]);
  if (![1, 2, 3, 4].includes(args.slot)) {
    throw new ProductStudioInputError("Composition slot must be between 1 and 4.");
  }
  const composition = await prisma.productStudioComposition.findUnique({
    where: { projectId_slot: { projectId: args.projectId, slot: args.slot } },
    include: { project: { select: { autopilotRunId: true } } },
  });
  if (!composition) throw new ProductStudioInputError("Research this project before generating.");
  await assertNotUnderAutopilot(composition.project, "Image generation");
  if (["queued", "generating"].includes(composition.status)) {
    throw new ProductStudioInputError(`Composition ${args.slot} is already ${composition.status}.`);
  }
  const busy = await prisma.productStudioComposition.count({
    where: { projectId: args.projectId, status: { in: ["queued", "generating"] } },
  });
  if (busy > 0) {
    throw new ProductStudioInputError(
      "Generate one composition at a time. Wait for the current image to finish.",
    );
  }

  await prisma.$transaction([
    prisma.productStudioComposition.update({
      where: { id: composition.id },
      data: { status: "queued", errorMessage: null },
    }),
    prisma.productStudioProject.update({
      where: { id: args.projectId },
      data: { status: "generating", errorMessage: null },
    }),
  ]);
  // Validate before dispatch so a too-long instruction fails in the request
  // rather than inside a worker job the operator cannot see.
  let operatorInstructions: string | null;
  try {
    operatorInstructions = normaliseOperatorInstructions(args.operatorInstructions);
  } catch (error) {
    // Surfaces as a field-level message rather than a 500. prompt-controls
    // cannot throw ProductStudioInputError directly without an import cycle.
    throw new ProductStudioInputError(
      error instanceof Error ? error.message : "Instructions could not be read.",
    );
  }
  await inngest.send({
    id: `product-studio-generate-${args.projectId}-${args.slot}-${Date.now()}`,
    name: "product-studio/image.requested",
    data: { ...args, operatorInstructions },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.image_queued",
    entityType: "ProductStudioProject",
    entityId: args.projectId,
    afterData: { slot: args.slot, operatorInstructions, revise: args.revise === true },
  });
}

export async function reviewProductStudioAsset(args: {
  assetId: string;
  actorUserId: string;
  decision: "approved" | "rejected";
  /**
   * Set when an unattended run decides from the QA scores (2026-10-27). The
   * draft is stamped as automatically reviewed and the audit entry says so;
   * the run holds the project's lock, so the manual-step guard is skipped.
   */
  automatic?: { runId: string; score: number; reason: string | null };
}): Promise<void> {
  // Fail closed with the rest of the workflow when the module is disabled;
  // stored records stay intact and readable either way.
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const asset = await prisma.productStudioAsset.findUniqueOrThrow({
    where: { id: args.assetId },
    include: { project: { select: { autopilotRunId: true } } },
  });
  if (!args.automatic) await assertNotUnderAutopilot(asset.project, "Review");
  if (asset.kind !== "generated") {
    throw new ProductStudioInputError("Only generated draft images can be approved or rejected.");
  }
  if (asset.compositionSlot == null) {
    throw new ProductStudioInputError("Generated asset is missing its composition slot.");
  }
  await prisma.productStudioAsset.update({
    where: { id: asset.id },
    data: { status: args.decision, autoReviewedAt: args.automatic ? new Date() : null },
  });
  await prisma.productStudioComposition.update({
    where: {
      projectId_slot: {
        projectId: asset.projectId,
        slot: asset.compositionSlot,
      },
    },
    data: { status: args.decision === "rejected" ? "failed" : "generated" },
  });
  const approvedSlots = await prisma.productStudioAsset.findMany({
    where: { projectId: asset.projectId, kind: "generated", status: "approved" },
    distinct: ["compositionSlot"],
    select: { compositionSlot: true },
  });
  await prisma.productStudioProject.update({
    where: { id: asset.projectId },
    data: { status: approvedSlots.length === 4 ? "approved" : "needs_review" },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: `product_studio.asset_${args.decision}`,
    entityType: "ProductStudioAsset",
    entityId: asset.id,
    afterData: {
      projectId: asset.projectId,
      compositionSlot: asset.compositionSlot,
      ...(args.automatic
        ? {
            automatic: true,
            runId: args.automatic.runId,
            lowestQaScore: args.automatic.score,
            reason: args.automatic.reason,
          }
        : { automatic: false }),
    },
  });
}

/**
 * Permanently deletes a project and its working artefacts.
 *
 * Child rows (assets, research sources, price observations, compositions)
 * cascade at the database level. AiOutput and AuditLog rows reference the
 * project by string rather than foreign key, so the record of what was
 * generated, by which model, for which actor, deliberately survives the
 * deletion — the working artefacts go, the evidence trail does not.
 */
export async function deleteProductStudioProject(args: {
  projectId: string;
  actorUserId: string;
}): Promise<void> {
  const project = await prisma.productStudioProject.findUniqueOrThrow({
    where: { id: args.projectId },
    include: {
      compositions: { select: { slot: true, status: true } },
      _count: { select: { assets: true, researchSources: true, priceObservations: true } },
    },
  });

  await assertNotUnderAutopilot(project, "Deletion");
  // Refuse while a worker job is in flight. Deleting mid-run would leave the
  // job writing to rows that no longer exist.
  if (isWorkflowBusy({ status: project.status, compositions: project.compositions, assets: [] })) {
    throw new ProductStudioInputError(
      "This project has work in progress. Wait for the worker to finish before deleting it.",
    );
  }

  // Captured before the delete so the audit entry describes what was removed.
  const beforeData = {
    title: project.confirmedTitle ?? project.title,
    status: project.status,
    productId: project.productId,
    assets: project._count.assets,
    researchSources: project._count.researchSources,
    priceObservations: project._count.priceObservations,
    compositions: project.compositions.length,
  };

  await prisma.productStudioProject.delete({ where: { id: project.id } });

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.project_deleted",
    entityType: "ProductStudioProject",
    entityId: project.id,
    beforeData,
  });
}

/**
 * Rebuilds every stored composition prompt for a project using the CURRENT
 * prompt compiler and the research already on disk.
 *
 * Why this exists: composition.prompt is written once at research time, so
 * improvements to the compiler never reach existing projects. This is a pure
 * rebuild — no provider call, no cost, and researchSummary is not touched, so
 * provenance and the "research cannot be replaced after generation" rule hold.
 *
 * Note what it cannot do: a project researched before productMode existed has
 * no stored classification, so it recompiles as "used" — the conservative mode.
 * Getting new_sealed treatment requires fresh research on a new project.
 */
export async function recompileProductStudioPrompts(args: {
  projectId: string;
  actorUserId: string;
}): Promise<{ recompiled: number; unchanged: number }> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const project = await prisma.productStudioProject.findUniqueOrThrow({
    where: { id: args.projectId },
    include: { compositions: { orderBy: { slot: "asc" } } },
  });

  await assertNotUnderAutopilot(project, "Recompiling prompts");
  if (isWorkflowBusy({ status: project.status, compositions: project.compositions, assets: [] })) {
    throw new ProductStudioInputError(
      "This project has work in progress. Wait for the worker to finish before recompiling prompts.",
    );
  }
  if (project.compositions.length === 0) {
    throw new ProductStudioInputError("Research this project before recompiling prompts.");
  }

  const identity = rebuildIdentity(project.researchSummary);
  const listing = rebuildListing(project.researchSummary, {
    title: project.confirmedTitle ?? project.title,
    shortDescription: project.finalDescription ?? project.shortDescription,
  });
  const identityRecord = (
    project.researchSummary && typeof project.researchSummary === "object"
      ? (project.researchSummary as Record<string, unknown>).identifiedProduct
      : null
  ) as Record<string, unknown> | null;
  const mode = parseProductMode(identityRecord?.productMode);
  const depictableSpec = parseDepictableSpec(identityRecord?.depictableSpec);

  let recompiled = 0;
  let unchanged = 0;
  for (const composition of project.compositions) {
    const prompt = compileProductImagePrompt({
      title: listing.title,
      shortDescription: listing.shortDescription,
      identity,
      composition: rebuildCompositionBrief(composition),
      mode,
      depictableSpec,
    });
    if (prompt === composition.prompt) {
      unchanged += 1;
      continue;
    }
    await prisma.productStudioComposition.update({
      where: { id: composition.id },
      data: { prompt },
    });
    recompiled += 1;
  }

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.prompts_recompiled",
    entityType: "ProductStudioProject",
    entityId: project.id,
    afterData: { recompiled, unchanged, mode, depictableSpecCount: depictableSpec.length },
  });

  return { recompiled, unchanged };
}

export function compositionAttributes(input: {
  purpose: string;
  layout: string;
  background: string;
  lighting: string;
  cameraAngle: string;
  productOrientation: string;
  productPlacement: string;
  shadowTreatment: string;
  cropAndNegativeSpace: string;
  depthOfField: string;
  props: string[];
  accessoriesExclude: string[];
  conditionMustShow: string[];
  negativeConstraints: string[];
}): Prisma.InputJsonValue {
  return {
    purpose: input.purpose,
    layout: input.layout,
    background: input.background,
    lighting: input.lighting,
    cameraAngle: input.cameraAngle,
    productOrientation: input.productOrientation,
    productPlacement: input.productPlacement,
    shadowTreatment: input.shadowTreatment,
    cropAndNegativeSpace: input.cropAndNegativeSpace,
    depthOfField: input.depthOfField,
    props: input.props,
    accessoriesExclude: input.accessoriesExclude,
    conditionMustShow: input.conditionMustShow,
    negativeConstraints: input.negativeConstraints,
  };
}
