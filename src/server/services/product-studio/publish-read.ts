/**
 * Product Studio publish READ-ONLY queries and state.
 *
 * Mirrors the pricing split: a page render must never load the module that
 * owns the write path. The project page needs publish history and flag state
 * to explain itself; it has no business importing a module that, two imports
 * down, holds a BigCommerce client capable of changing a live listing.
 *
 * publish.ts may import from here, and nothing here may import the
 * BigCommerce client or the write service. Everything in this file is a
 * SELECT or a flag read.
 */
import { prisma } from "@/server/db/client";
import { isFeatureOn } from "@/server/services/feature-flags";

import { REQUIRED_PUBLISH_FLAGS } from "./publish-eligibility";

/** Which of the required flags are currently off. */
export async function flagsBlockingPublish(): Promise<string[]> {
  const off: string[] = [];
  for (const flag of REQUIRED_PUBLISH_FLAGS) {
    if (!(await isFeatureOn(flag))) off.push(flag);
  }
  return off;
}

/** Whether publishing is currently possible at all, for UI explanation. */
export async function publishFlagState(): Promise<{ enabled: boolean; disabledFlags: string[] }> {
  const disabledFlags = await flagsBlockingPublish();
  return { enabled: disabledFlags.length === 0, disabledFlags };
}

/** Publish history for one project, newest first, for the project page. */
export async function listPublishLogs(projectId: string) {
  return prisma.productStudioPublishLog.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      status: true,
      assetId: true,
      bigCommerceImageId: true,
      errorMessage: true,
      writtenAt: true,
      createdAt: true,
      writtenBy: { select: { id: true, name: true, email: true } },
      asset: { select: { compositionSlot: true, revision: true, fileName: true } },
    },
  });
}
