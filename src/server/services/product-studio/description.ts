/**
 * Editing the full description after research (product owner, 2026-10-26).
 *
 * Research writes the first draft; an operator may rewrite it at any point,
 * including after it was marked for upload or published. Three things follow
 * from an edit:
 *
 *   - links and citations are stripped, as they are from research output;
 *   - the "approved for upload" mark is cleared, so the edited text has to be
 *     selected again by a Super Admin before it can go to the store; and
 *   - a published description is left on the store until the edited one is
 *     marked and published again, which replaces it (publish-eligibility
 *     compares the current text with what was last sent).
 *
 * Internal state only: nothing here reaches BigCommerce.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { requireFeature } from "@/server/services/feature-flags";

import { ProductStudioInputError } from "./index";
import { stripListingLinks } from "./listing-copy";
import { missingFacts } from "./listing-format";
import { reformatListingDescription } from "./openai";

export const MIN_LONG_DESCRIPTION = 20;
export const MAX_LONG_DESCRIPTION = 8000;

export async function updateProductStudioLongDescription(args: {
  projectId: string;
  actorUserId: string;
  longDescription: string;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const text = stripListingLinks(args.longDescription.replace(/\r\n/g, "\n"));
  if (text.length < MIN_LONG_DESCRIPTION || text.length > MAX_LONG_DESCRIPTION) {
    throw new ProductStudioInputError(
      "The full description must be between " +
        String(MIN_LONG_DESCRIPTION) +
        " and " +
        String(MAX_LONG_DESCRIPTION).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
        " characters, not counting any links, which are removed.",
    );
  }
  const project = await prisma.productStudioProject.findUnique({
    where: { id: args.projectId },
    select: { id: true, longDescription: true, descriptionUploadApprovedAt: true },
  });
  if (!project) throw new ProductStudioInputError("Project not found.");
  if ((project.longDescription ?? "") === text) {
    throw new ProductStudioInputError("The description is unchanged.");
  }
  await prisma.productStudioProject.update({
    where: { id: project.id },
    data: {
      longDescription: text,
      // The edited text must be selected for the store afresh.
      descriptionUploadApprovedAt: null,
      descriptionUploadApprovedById: null,
    },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.description_edited",
    entityType: "ProductStudioProject",
    entityId: project.id,
    beforeData: { longDescription: project.longDescription },
    afterData: {
      longDescription: text,
      uploadMarkCleared: project.descriptionUploadApprovedAt != null,
      note: "Internal edit only. Nothing was sent to any store.",
    },
  });
}

/**
 * Restructures the full description with the model (2026-10-26): short
 * paragraphs and titled bullet sections, the same vocabulary research now
 * writes. The rewrite may regroup and reorder; it may not lose anything, so
 * the result is refused unless every fact token in the original survives.
 * Recorded as an AI output and audited; clears the upload mark like an edit.
 */
export async function reformatProductStudioDescription(args: {
  projectId: string;
  actorUserId: string;
}): Promise<void> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const project = await prisma.productStudioProject.findUnique({
    where: { id: args.projectId },
    select: {
      id: true,
      title: true,
      confirmedTitle: true,
      longDescription: true,
      descriptionUploadApprovedAt: true,
    },
  });
  if (!project) throw new ProductStudioInputError("Project not found.");
  const original = stripListingLinks(project.longDescription ?? "");
  if (original.length < MIN_LONG_DESCRIPTION) {
    throw new ProductStudioInputError("There is no full description to reformat yet.");
  }
  const call = await reformatListingDescription({
    title: project.confirmedTitle ?? project.title,
    longDescription: original,
  });
  const text = stripListingLinks(call.longDescription.replace(/\r\n/g, "\n"));
  const lost = missingFacts(original, text);
  // The call is recorded whether or not its result is accepted.
  await prisma.aiOutput.create({
    data: {
      userId: args.actorUserId,
      modelProvider: "openai",
      modelName: call.modelName,
      module: "product_studio_description_reformat",
      prompt: call.prompt,
      output: call.rawOutput,
      sourceReferences: { projectId: project.id, originalLength: original.length },
      tokenUsage: call.usage,
      status: lost.length > 0 ? "rejected" : "generated",
      rejectionReason:
        lost.length > 0 ? "Facts missing from the rewrite: " + lost.join(", ") : null,
      assumptions: [],
      warnings: [],
      confidence: null,
    },
  });
  if (lost.length > 0) {
    throw new ProductStudioInputError(
      "The rewrite was refused because it lost " +
        String(lost.length) +
        " figure" +
        (lost.length === 1 ? "" : "s") +
        " or code" +
        (lost.length === 1 ? "" : "s") +
        " from the original (" +
        lost.slice(0, 6).join(", ") +
        (lost.length > 6 ? ", …" : "") +
        "). The description is unchanged; try again or edit it by hand.",
    );
  }
  if (text.length < MIN_LONG_DESCRIPTION || text.length > MAX_LONG_DESCRIPTION) {
    throw new ProductStudioInputError("The rewrite came back outside the allowed length.");
  }
  await prisma.productStudioProject.update({
    where: { id: project.id },
    data: {
      longDescription: text,
      descriptionUploadApprovedAt: null,
      descriptionUploadApprovedById: null,
    },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.description_reformatted",
    entityType: "ProductStudioProject",
    entityId: project.id,
    beforeData: { longDescription: project.longDescription },
    afterData: {
      longDescription: text,
      modelName: call.modelName,
      uploadMarkCleared: project.descriptionUploadApprovedAt != null,
      note: "Structure only; every fact token from the original was verified present.",
    },
  });
}
