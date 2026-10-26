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
