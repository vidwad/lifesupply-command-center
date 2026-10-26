/**
 * Adding and replacing a project's authoritative photographs (product owner,
 * 2026-10-26).
 *
 * The photographs are the sole visual authority for research and every
 * generated draft, so they can change only BEFORE research has run. Once
 * compositions exist, the identity analysis and the prompts were derived from
 * the photographs on record, and swapping them underneath would make that
 * provenance false; the page says so and offers a new project instead.
 *
 * Up to four photographs in total, the same bounds as intake. "Replace"
 * removes the current set first; "add" appends to it.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { requireFeature } from "@/server/services/feature-flags";

import { prepareProductStudioIntake, ProductStudioInputError } from "./index";

export const MAX_SOURCE_PHOTOS = 4;

/** Whether the project's photographs may still change. Pure, for the page too. */
export function sourcePhotosLocked(project: { status: string; compositionCount: number }): boolean {
  // Research writes compositions; a queued or running research must not see
  // the photographs change beneath it either.
  return project.compositionCount > 0 || !["draft", "failed"].includes(project.status);
}

export async function updateSourcePhotos(args: {
  projectId: string;
  actorUserId: string;
  files: File[];
  mode: "add" | "replace";
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const project = await prisma.productStudioProject.findUnique({
    where: { id: args.projectId },
    select: {
      id: true,
      status: true,
      title: true,
      shortDescription: true,
      _count: { select: { compositions: true, assets: { where: { kind: "source" } } } },
    },
  });
  if (!project) throw new ProductStudioInputError("Project not found.");
  if (
    sourcePhotosLocked({ status: project.status, compositionCount: project._count.compositions })
  ) {
    throw new ProductStudioInputError(
      "Photographs are locked once research has run, because the identity analysis and every " +
        "prompt were derived from them. Start a new project to use different photographs.",
    );
  }
  const existing = args.mode === "replace" ? 0 : project._count.assets;
  if (args.files.length === 0) throw new ProductStudioInputError("Choose at least one photograph.");
  if (existing + args.files.length > MAX_SOURCE_PHOTOS) {
    throw new ProductStudioInputError(
      "A project holds at most " +
        String(MAX_SOURCE_PHOTOS) +
        " photographs; this one has " +
        String(existing) +
        ". Replace the set or add fewer.",
    );
  }
  // Reuses the intake validation (type, size, hash) with the project's own
  // title and description, which already passed it.
  const { prepared } = await prepareProductStudioIntake({
    title: project.title,
    shortDescription: project.shortDescription,
    files: args.files,
  });
  await prisma.$transaction(async (tx) => {
    if (args.mode === "replace") {
      await tx.productStudioAsset.deleteMany({ where: { projectId: project.id, kind: "source" } });
    }
    await tx.productStudioAsset.createMany({
      data: prepared.map((asset) => ({
        ...asset,
        projectId: project.id,
        kind: "source" as const,
        status: "uploaded" as const,
      })),
    });
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action:
      args.mode === "replace"
        ? "product_studio.source_photos_replaced"
        : "product_studio.source_photos_added",
    entityType: "ProductStudioProject",
    entityId: project.id,
    beforeData: { sourceImageCount: project._count.assets },
    afterData: {
      sourceImageCount: existing + prepared.length,
      sourceImageHashes: prepared.map((asset) => asset.contentHash),
    },
  });
}
