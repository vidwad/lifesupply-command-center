import { createHash } from "node:crypto";
import { normaliseOperatorInstructions } from "./prompt-controls";
import { isWorkflowBusy } from "./workflow-progress";

import type { Prisma } from "@prisma/client";

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

export async function listProductStudioProjects() {
  return prisma.productStudioProject.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      _count: { select: { assets: true, researchSources: true, compositions: true } },
    },
  });
}

export async function getProductStudioProject(id: string) {
  return prisma.productStudioProject.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true } },
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
          createdAt: true,
        },
        orderBy: [{ kind: "asc" }, { compositionSlot: "asc" }, { revision: "desc" }],
      },
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

export async function queueProductStudioResearch(args: {
  projectId: string;
  actorUserId: string;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const project = await prisma.productStudioProject.findUniqueOrThrow({
    where: { id: args.projectId },
    include: { _count: { select: { assets: { where: { kind: "generated" } } } } },
  });
  if (project._count.assets > 0) {
    throw new ProductStudioInputError(
      "Research cannot be replaced after image generation. Start a new project to preserve provenance.",
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
  });
  if (!composition) throw new ProductStudioInputError("Research this project before generating.");
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
  const operatorInstructions = normaliseOperatorInstructions(args.operatorInstructions);
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
    afterData: { slot: args.slot, operatorInstructions },
  });
}

export async function reviewProductStudioAsset(args: {
  assetId: string;
  actorUserId: string;
  decision: "approved" | "rejected";
}): Promise<void> {
  // Fail closed with the rest of the workflow when the module is disabled;
  // stored records stay intact and readable either way.
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const asset = await prisma.productStudioAsset.findUniqueOrThrow({ where: { id: args.assetId } });
  if (asset.kind !== "generated") {
    throw new ProductStudioInputError("Only generated draft images can be approved or rejected.");
  }
  if (asset.compositionSlot == null) {
    throw new ProductStudioInputError("Generated asset is missing its composition slot.");
  }
  await prisma.productStudioAsset.update({
    where: { id: asset.id },
    data: { status: args.decision },
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
    afterData: { projectId: asset.projectId, compositionSlot: asset.compositionSlot },
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
