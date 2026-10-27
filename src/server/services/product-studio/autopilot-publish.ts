/**
 * The publishing step of an unattended run (product owner, 2026-10-27).
 *
 * THE ONLY MODULE OUTSIDE THE PUBLISH SERVER ACTIONS THAT MAY IMPORT THE
 * PUBLISH SERVICE, and so the only path by which content reaches a store
 * without a person pressing "Publish" on that project. It is called once per
 * product, at the end of the product's run, and only when the run's frozen
 * settings ask for publishing. It does what a Super Admin would do on the
 * publishing card, in order, through the same service with the same gates:
 *
 *   1. The run's Approval row must exist and be approved.
 *   2. The run's creator must still hold the publish permission NOW, read
 *      from the database rather than from any snapshot taken at creation.
 *   3. The three publish flags are checked by the service itself; a run
 *      with a publish mode is also refused at creation while they are off.
 *   4. Each approved, unpublished latest draft is marked for upload; the
 *      description is marked when the mode includes it and the store either
 *      has none or the mode says replace; the first composition is chosen as
 *      the main image when the mode says so.
 *   5. publishProductStudioProject sends them, writing its log row before
 *      every request and stopping at the first failure, as always.
 *
 * Nothing here talks to BigCommerce directly; the client is reachable only
 * through the publish service, and the publish canaries hold that.
 */
import { prisma } from "@/server/db/client";

import type { AutopilotSettings } from "./autopilot-settings";
import { ProductStudioInputError } from "./index";
import { latestGeneratedBySlot, PUBLISH_PERMISSION } from "./publish-eligibility";
import { flagsBlockingPublish } from "./publish-read";
import {
  publishProductStudioProject,
  setAssetUploadMark,
  setDescriptionUploadMark,
  setMainImage,
} from "./publish";

export type RunPublishOutcome =
  | { status: "published"; publishedItems: number; message: string }
  | { status: "nothing"; message: string }
  | { status: "refused" | "failed"; publishedItems: number; message: string };

/** The permission keys a user holds right now, from their roles in the database. */
export async function loadCurrentPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
      userRoles: {
        select: {
          role: {
            select: { rolePermissions: { select: { permission: { select: { key: true } } } } },
          },
        },
      },
    },
  });
  if (!user || user.status !== "active") return [];
  return [
    ...new Set(
      user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.key)),
    ),
  ];
}

/** Whether a synced store description has any text once its markup is removed. */
export function storeDescriptionIsEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  return (
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim().length === 0
  );
}

export async function publishForRun(args: {
  runId: string;
  approvalId: string | null;
  projectId: string;
  actorUserId: string;
  settings: AutopilotSettings;
}): Promise<RunPublishOutcome> {
  if (args.settings.publishMode === "none") {
    return { status: "nothing", message: "The run does not publish." };
  }
  // ---- 1. The approval that authorised this run -------------------------
  const approval = args.approvalId
    ? await prisma.approval.findUnique({
        where: { id: args.approvalId },
        select: { status: true, relatedEntityId: true },
      })
    : null;
  if (!approval || approval.status !== "approved" || approval.relatedEntityId !== args.runId) {
    return {
      status: "refused",
      publishedItems: 0,
      message: "Publishing refused: the run's approval record is missing or not approved.",
    };
  }
  // ---- 2. The creator's authority, as of now ------------------------------
  const actorPermissions = await loadCurrentPermissions(args.actorUserId);
  if (!actorPermissions.includes(PUBLISH_PERMISSION)) {
    return {
      status: "refused",
      publishedItems: 0,
      message: "Publishing refused: the run's creator no longer holds the publish permission.",
    };
  }
  // ---- 3. The flags, named here so the note is specific -------------------
  const off = await flagsBlockingPublish();
  if (off.length > 0) {
    return {
      status: "refused",
      publishedItems: 0,
      message: "Publishing refused: these flags are off: " + off.join(", ") + ".",
    };
  }

  const project = await prisma.productStudioProject.findUnique({
    where: { id: args.projectId },
    select: {
      id: true,
      longDescription: true,
      descriptionPublishedAt: true,
      descriptionUploadApprovedAt: true,
      mainImageAssetId: true,
      product: { select: { description: true } },
      assets: {
        select: {
          id: true,
          kind: true,
          compositionSlot: true,
          revision: true,
          status: true,
          fileName: true,
          contentType: true,
          bytes: true,
          contentHash: true,
          uploadApprovedAt: true,
          publishedAt: true,
          bigCommerceImageId: true,
        },
      },
    },
  });
  if (!project) {
    return { status: "failed", publishedItems: 0, message: "The project was deleted." };
  }

  // ---- 4. The marks a Super Admin would set on the publishing card --------
  const common = { actorUserId: args.actorUserId, actorPermissions };
  const latest = latestGeneratedBySlot(project.assets).filter(
    (asset) =>
      asset.compositionSlot != null && asset.compositionSlot <= args.settings.imagesPerProduct,
  );
  const marked: string[] = [];
  for (const asset of latest) {
    if (asset.status !== "approved" || asset.publishedAt || asset.uploadApprovedAt) continue;
    await setAssetUploadMark({ ...common, assetId: asset.id, marked: true });
    marked.push(`image ${String(asset.compositionSlot)}`);
  }
  const wantsDescription =
    args.settings.publishMode === "images_and_description" || args.settings.publishMode === "all";
  if (wantsDescription && project.longDescription && !project.descriptionUploadApprovedAt) {
    const storeHasText = !storeDescriptionIsEmpty(project.product?.description);
    if (args.settings.descriptionMode === "replace" || !storeHasText) {
      try {
        await setDescriptionUploadMark({ ...common, projectId: project.id, marked: true });
        marked.push("description");
      } catch (error) {
        // "The store already has this description" is not a failure: there
        // is nothing to send. Anything else is.
        if (!(error instanceof ProductStudioInputError)) throw error;
      }
    }
  }
  if (args.settings.publishMode === "all" && !project.mainImageAssetId) {
    const first = latest.find(
      (asset) => asset.compositionSlot === 1 && asset.status === "approved",
    );
    if (first) {
      await setMainImage({ ...common, projectId: project.id, assetId: first.id });
      marked.push("main image");
    }
  }

  // ---- 5. The publish itself, through the one service ---------------------
  try {
    const result = await publishProductStudioProject({ ...common, projectId: project.id });
    const sent = result.items.filter((item) => item.status === "succeeded").length;
    if (result.status === "succeeded") {
      return {
        status: "published",
        publishedItems: sent,
        message:
          result.message + (marked.length ? " Marked for upload: " + marked.join(", ") + "." : ""),
      };
    }
    return { status: "failed", publishedItems: sent, message: result.message };
  } catch (error) {
    if (error instanceof ProductStudioInputError) {
      // The service refused: nothing marked (everything was already on the
      // store), no linked store product, a busy project, or a gate.
      const nothing = /Nothing is marked for upload/.test(error.message);
      return nothing
        ? { status: "nothing", message: "Nothing new to publish; the store already has it all." }
        : { status: "refused", publishedItems: 0, message: "Publishing refused: " + error.message };
    }
    throw error;
  }
}
