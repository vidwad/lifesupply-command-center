/**
 * Product Studio publishing to BigCommerce (product owner, 2026-10-22).
 *
 * THE ONLY MODULE IN THE APPLICATION THAT CHANGES A STOREFRONT LISTING'S
 * IMAGES OR DESCRIPTION, and the second external write-back after the
 * sale-price writeback. The controls are stacked the same way:
 *
 *   1. product_studio.enabled, product_studio.publish and external.writebacks
 *      must ALL be on. The last two sit in the kill set, so tripping it stops
 *      writes here.
 *   2. The caller must hold products.approve_bigcommerce_update, which only
 *      Super Admin has. Reviewing a draft is explicitly not enough, and neither
 *      is marking it for upload.
 *   3. Only drafts that a reviewer approved AND a Super Admin then marked
 *      "approved for upload" are sent, each once; the description likewise.
 *   4. A ProductStudioPublishLog row exists BEFORE each request goes out,
 *      carrying the store's prior description and image list, so a crash
 *      mid-write still leaves evidence of what was there.
 *   5. A pre-write read of the live product must succeed. Without it there is
 *      no record to restore from.
 *
 * One project per call, items sent one after another, and the run stops at
 * the first failure. There is no scheduler, no bulk path and no Inngest
 * function in this file. Two callers exist: the publish server actions (a
 * person pressing "Publish" on one project), and since 2026-10-27 the
 * unattended-run publish module, autopilot-publish.ts, which calls this once
 * per product at the end of that product's run, only when the run's frozen
 * settings ask for publishing, under an Approval row the Super Admin wrote
 * when creating the run, and with that person's permissions re-read from the
 * database at the moment of publishing. Every gate below applies to both.
 *
 * Only an image is added, and only the description is replaced. Name, price,
 * SKU, inventory, visibility, the thumbnail and existing images are untouched,
 * and the client module offers no method that could change them.
 *
 * READ-ONLY helpers live in publish-read.ts so a page render never loads this
 * module. Only the publish server actions and autopilot-publish.ts may import
 * this file.
 */
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import {
  buildDescriptionRequestPayload,
  buildImageDeleteRequestPayload,
  buildImageRequestPayload,
  buildImageUpdateRequestPayload,
  deleteBigCommerceProductImage,
  readBigCommerceProductContent,
  updateBigCommerceProductImage,
  uploadBigCommerceProductImage,
  writeBigCommerceProductDescription,
} from "@/server/integrations/bigcommerce/catalog-publish";
import { storeImageCount, storeThumbnailImageId } from "@/server/services/products";
import { resolveStoreCredentials } from "@/server/integrations/bigcommerce/store-credentials";
import { logger } from "@/server/logger";

import { ProductStudioInputError } from "./index";
import { stripListingLinks } from "./listing-copy";
import {
  assetCanBeMarked,
  canPublish,
  descriptionNeedsPublish,
  descriptionToHtml,
  latestGeneratedBySlot,
  PUBLISH_PERMISSION,
  resolvePublishTarget,
  selectPublishItems,
  type PublishCandidate,
  type PublishTarget,
} from "./publish-eligibility";
import { flagsBlockingPublish, lastPublishedDescriptionHtml } from "./publish-read";
import { isWorkflowBusy } from "./workflow-progress";

const json = (value: unknown) => JSON.parse(JSON.stringify(value ?? null)) as never;

const ASSET_SELECT = {
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
} as const;

async function loadProject(projectId: string) {
  const row = await prisma.productStudioProject.findUnique({
    where: { id: projectId },
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
        },
      },
      assets: { select: ASSET_SELECT },
      compositions: { select: { slot: true, name: true, status: true } },
    },
  });
  if (!row) throw new ProductStudioInputError("Project not found.");
  return row;
}

type Loaded = Awaited<ReturnType<typeof loadProject>>;

function auditContext(row: Loaded, target: PublishTarget | null) {
  return {
    projectId: row.id,
    projectTitle: row.confirmedTitle ?? row.title,
    productId: row.productId,
    storeId: target?.storeId ?? null,
    sku: target?.sku ?? null,
    bigCommerceProductId: target?.sourceProductId ?? null,
  };
}

async function auditRefusal(args: {
  actorUserId: string;
  row: Loaded;
  target: PublishTarget | null;
  reason: string;
  message: string;
}): Promise<void> {
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.publish_refused",
    entityType: "ProductStudioProject",
    entityId: args.row.id,
    beforeData: { status: args.row.status },
    afterData: {
      ...auditContext(args.row, args.target),
      refusedBecause: args.reason,
      message: args.message,
    },
  });
}

function requirePublishPermission(actorPermissions: readonly string[]): boolean {
  // Re-asserted here, independently of the action layer: this module must
  // not be callable with a project and no proof of authority.
  return actorPermissions.includes(PUBLISH_PERMISSION);
}

// ---------------------------------------------------------------------------
// Marking for upload: internal state only, nothing leaves the Command Center.
// ---------------------------------------------------------------------------

/**
 * Sets or clears the "approved for upload" mark on one approved draft. Needs
 * the publish permission because the mark decides what the publish action
 * sends; it is the selection step of the same approval.
 */
export async function setAssetUploadMark(args: {
  assetId: string;
  actorUserId: string;
  actorPermissions: readonly string[];
  marked: boolean;
}): Promise<void> {
  if (!requirePublishPermission(args.actorPermissions)) {
    throw new ProductStudioInputError(
      "Only a Super Admin can mark Product Studio content for upload to BigCommerce.",
    );
  }
  const asset = await prisma.productStudioAsset.findUnique({
    where: { id: args.assetId },
    select: { ...ASSET_SELECT, projectId: true },
  });
  if (!asset) throw new ProductStudioInputError("Draft not found.");
  if (args.marked) {
    const siblings = await prisma.productStudioAsset.findMany({
      where: { projectId: asset.projectId },
      select: ASSET_SELECT,
    });
    const verdict = assetCanBeMarked(asset, siblings);
    if (!verdict.ok) throw new ProductStudioInputError(verdict.reason);
  } else if (asset.publishedAt) {
    throw new ProductStudioInputError(
      "This draft has already been published; its mark is part of the record.",
    );
  }
  await prisma.productStudioAsset.update({
    where: { id: asset.id },
    data: args.marked
      ? { uploadApprovedAt: new Date(), uploadApprovedById: args.actorUserId }
      : { uploadApprovedAt: null, uploadApprovedById: null },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: args.marked ? "product_studio.upload_mark_set" : "product_studio.upload_mark_cleared",
    entityType: "ProductStudioAsset",
    entityId: asset.id,
    afterData: {
      projectId: asset.projectId,
      compositionSlot: asset.compositionSlot,
      revision: asset.revision,
      note: "Internal selection only. Nothing was sent to any store.",
    },
  });
}

/**
 * Chooses which draft becomes the listing's main image on the store
 * (2026-10-26), or clears the choice so the store keeps its current one
 * (or, when it has none, the first published draft takes it). Internal
 * state only; the publish action applies it.
 */
export async function setMainImage(args: {
  projectId: string;
  assetId: string | null;
  actorUserId: string;
  actorPermissions: readonly string[];
}): Promise<void> {
  if (!requirePublishPermission(args.actorPermissions)) {
    throw new ProductStudioInputError(
      "Only a Super Admin can choose the main image for BigCommerce.",
    );
  }
  const project = await prisma.productStudioProject.findUnique({
    where: { id: args.projectId },
    select: { id: true, mainImageAssetId: true, assets: { select: ASSET_SELECT } },
  });
  if (!project) throw new ProductStudioInputError("Project not found.");
  if (args.assetId) {
    const latest = latestGeneratedBySlot(project.assets);
    const chosen = latest.find((asset) => asset.id === args.assetId);
    if (!chosen) {
      throw new ProductStudioInputError(
        "Choose the latest revision of a composition on this project.",
      );
    }
    if (chosen.status !== "approved") {
      throw new ProductStudioInputError(
        "Approve the draft in review before making it the main image.",
      );
    }
  }
  await prisma.productStudioProject.update({
    where: { id: project.id },
    data: { mainImageAssetId: args.assetId },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: args.assetId ? "product_studio.main_image_set" : "product_studio.main_image_cleared",
    entityType: "ProductStudioProject",
    entityId: project.id,
    beforeData: { mainImageAssetId: project.mainImageAssetId },
    afterData: {
      mainImageAssetId: args.assetId,
      note: "Internal choice only. Applied on the next publish; nothing was sent.",
    },
  });
}

/** Sets or clears the "approved for upload" mark on the full description. */
export async function setDescriptionUploadMark(args: {
  projectId: string;
  actorUserId: string;
  actorPermissions: readonly string[];
  marked: boolean;
}): Promise<void> {
  if (!requirePublishPermission(args.actorPermissions)) {
    throw new ProductStudioInputError(
      "Only a Super Admin can mark Product Studio content for upload to BigCommerce.",
    );
  }
  const project = await prisma.productStudioProject.findUnique({
    where: { id: args.projectId },
    select: { id: true, longDescription: true, descriptionPublishedAt: true },
  });
  if (!project) throw new ProductStudioInputError("Project not found.");
  const text = stripListingLinks(project.longDescription ?? "");
  if (args.marked && !text) {
    throw new ProductStudioInputError(
      "This project has no full description yet. Run research or write one on the project page.",
    );
  }
  // A published description may be marked again once it has been edited
  // (2026-10-26): publishing then replaces the store's copy. While the text
  // still matches what the store has, there is nothing to send.
  if (
    args.marked &&
    project.descriptionPublishedAt &&
    !descriptionNeedsPublish({
      text,
      descriptionPublishedAt: project.descriptionPublishedAt,
      publishedDescriptionHtml: await lastPublishedDescriptionHtml(project.id),
    })
  ) {
    throw new ProductStudioInputError(
      "The store already has this description. Edit it first; the edited text can then be marked " +
        "and published to replace it.",
    );
  }
  await prisma.productStudioProject.update({
    where: { id: project.id },
    data: args.marked
      ? { descriptionUploadApprovedAt: new Date(), descriptionUploadApprovedById: args.actorUserId }
      : { descriptionUploadApprovedAt: null, descriptionUploadApprovedById: null },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: args.marked ? "product_studio.upload_mark_set" : "product_studio.upload_mark_cleared",
    entityType: "ProductStudioProject",
    entityId: project.id,
    afterData: { field: "longDescription", note: "Internal selection only. Nothing was sent." },
  });
}

// ---------------------------------------------------------------------------
// The publish action.
// ---------------------------------------------------------------------------

export type PublishItemResult = {
  kind: PublishCandidate["kind"];
  label: string;
  status: "succeeded" | "failed";
  message: string;
  logId: string;
};

export type PublishResult = {
  status: "succeeded" | "failed";
  items: PublishItemResult[];
  message: string;
};

/**
 * Publishes everything marked for upload on one project to its BigCommerce
 * product. Images first, by slot, then the description; the run stops at the
 * first failure so a partial result is never silently completed.
 */
export async function publishProductStudioProject(args: {
  actorUserId: string;
  actorPermissions: readonly string[];
  projectId: string;
}): Promise<PublishResult> {
  const row = await loadProject(args.projectId);

  // ---- Gate 1: permission, re-asserted independently of the action layer ----
  if (!requirePublishPermission(args.actorPermissions)) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: null,
      reason: "missing_permission",
      message: "Caller lacks products.approve_bigcommerce_update.",
    });
    throw new ProductStudioInputError(
      "You do not have permission to publish to BigCommerce. Approving a draft does not grant it.",
    );
  }

  // ---- Gate 2: all three flags -------------------------------------------
  const off = await flagsBlockingPublish();
  if (off.length > 0) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: null,
      reason: "feature_disabled",
      message: "Disabled flags: " + off.join(", "),
    });
    throw new ProductStudioInputError(
      "Publishing is disabled. These flags must all be on: " +
        off.join(", ") +
        ". If the kill switch was tripped, that is why.",
    );
  }

  // ---- Gate 3: eligibility ------------------------------------------------
  const { target, reason: targetReason } = resolvePublishTarget(row.product);
  const items = selectPublishItems({
    project: row,
    assets: row.assets,
    compositions: row.compositions,
    publishedDescriptionHtml: await lastPublishedDescriptionHtml(row.id),
    mainImageAssetId: row.mainImageAssetId,
    store: {
      imageCount: storeImageCount(row.product?.metadata),
      thumbnailImageId: storeThumbnailImageId(row.product?.metadata),
    },
  });
  const verdict = canPublish({
    target,
    targetReason,
    items,
    busy: isWorkflowBusy({
      status: row.status,
      compositions: row.compositions,
      assets: row.assets,
    }),
  });
  if (!verdict.allowed) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target,
      reason: verdict.reason,
      message: verdict.message,
    });
    throw new ProductStudioInputError(verdict.message);
  }
  const resolvedTarget = verdict.target;

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.publish_requested",
    entityType: "ProductStudioProject",
    entityId: row.id,
    beforeData: { status: row.status },
    afterData: {
      ...auditContext(row, resolvedTarget),
      items: verdict.items.map((item) =>
        item.kind === "image"
          ? { kind: "image", slot: item.slot, assetId: item.assetId, main: item.isMainImage }
          : item.kind === "main_image"
            ? { kind: "main_image", slot: item.slot, assetId: item.assetId, imageId: item.imageId }
            : { kind: "description" },
      ),
    },
  });

  // ---- Gate 4: credentials for THIS store --------------------------------
  const credentialOutcome = await resolveStoreCredentials(resolvedTarget.storeId);
  if (!credentialOutcome.ok) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: resolvedTarget,
      reason: "missing_credentials",
      message: credentialOutcome.reason,
    });
    throw new ProductStudioInputError(credentialOutcome.reason);
  }
  const credentials = credentialOutcome.credentials;

  // ---- Gate 5: pre-write read, so rollback evidence exists ---------------
  const before = await readBigCommerceProductContent({
    credentials,
    productId: resolvedTarget.sourceProductId,
  });
  if (!before.ok) {
    await auditRefusal({
      actorUserId: args.actorUserId,
      row,
      target: resolvedTarget,
      reason: "pre_write_read_failed",
      message: before.message,
    });
    throw new ProductStudioInputError(
      "Could not read the current BigCommerce listing, so there would be no record to restore " +
        "from. Refusing to publish. " +
        before.message,
    );
  }
  const beforeSnapshot = json({
    capturedAt: new Date().toISOString(),
    bigCommerceProductId: resolvedTarget.sourceProductId,
    live: before.snapshot,
  });
  const existingImageCount = before.snapshot.images.length;

  const results: PublishItemResult[] = [];
  const common = {
    projectId: row.id,
    projectTitle: row.confirmedTitle ?? row.title,
    storeId: resolvedTarget.storeId,
    productId: resolvedTarget.productId,
    sourceProductId: resolvedTarget.sourceProductId,
    writtenById: args.actorUserId,
  };

  for (const [index, item] of verdict.items.entries()) {
    if (item.kind === "image") {
      const label = "Composition " + String(item.slot) + " (r" + String(item.revision) + ")";
      // A revision of a published image replaces it (2026-10-26): the new
      // file takes the old image's position and thumbnail flag, and the old
      // image is removed afterwards. The old image is identified only by the
      // id this system recorded when it uploaded it, and only if the store
      // still lists it.
      const replaced =
        item.replacesImageId != null
          ? (before.snapshot.images.find((image) => image.id === item.replacesImageId) ?? null)
          : null;
      const request = {
        productId: resolvedTarget.sourceProductId,
        fileName: item.fileName,
        contentType: item.contentType,
        contentHash: item.contentHash,
        bytes: item.bytes,
        altText: item.altText,
        // The chosen main image goes first and takes the thumbnail flag; the
        // store clears the flag on its previous main image itself.
        sortOrder: item.isMainImage ? 0 : (replaced?.sortOrder ?? existingImageCount + index),
        isThumbnail: item.isMainImage || replaced?.isThumbnail === true,
      };
      // The log row exists before the request goes out.
      const log = await prisma.productStudioPublishLog.create({
        data: {
          ...common,
          assetId: item.assetId,
          kind: "image",
          status: "queued",
          requestPayload: json({
            ...buildImageRequestPayload(request),
            replaces: replaced
              ? {
                  imageId: replaced.id,
                  isThumbnail: replaced.isThumbnail,
                  sortOrder: replaced.sortOrder,
                  then: buildImageDeleteRequestPayload({
                    productId: resolvedTarget.sourceProductId,
                    imageId: replaced.id!,
                  }),
                }
              : null,
          }),
          beforeSnapshot,
        },
        select: { id: true },
      });
      const bytes = await prisma.productStudioAsset.findUnique({
        where: { id: item.assetId },
        select: { data: true },
      });
      const outcome = bytes
        ? await uploadBigCommerceProductImage({ credentials, request, data: bytes.data })
        : ({
            ok: false,
            status: "refused",
            message: "Draft bytes not found.",
            response: null,
          } as const);
      if (!outcome.ok) {
        await prisma.productStudioPublishLog.update({
          where: { id: log.id },
          data: {
            status: "failed",
            errorMessage: outcome.message,
            responsePayload: json(outcome.response ?? null),
          },
        });
        await writeAudit({
          actorUserId: args.actorUserId,
          action: "product_studio.publish_failed",
          entityType: "ProductStudioAsset",
          entityId: item.assetId,
          afterData: {
            ...auditContext(row, resolvedTarget),
            logId: log.id,
            error: outcome.message,
          },
        });
        logger.error(
          { projectId: row.id, assetId: item.assetId, logId: log.id, status: outcome.status },
          "product studio image publish failed",
        );
        results.push({
          kind: "image",
          label,
          status: "failed",
          message: outcome.message,
          logId: log.id,
        });
        break;
      }
      const writtenAt = new Date();
      // Only after the replacement is on the store is the old image removed,
      // so a failed upload never leaves the listing one image short.
      let removal: { ok: boolean; message: string | null; response: unknown } | null = null;
      if (replaced?.id != null) {
        const removed = await deleteBigCommerceProductImage({
          credentials,
          productId: resolvedTarget.sourceProductId,
          imageId: replaced.id,
        });
        removal = removed.ok
          ? { ok: true, message: null, response: removed.response }
          : { ok: false, message: removed.message, response: removed.response ?? null };
      }
      await prisma.productStudioPublishLog.update({
        where: { id: log.id },
        data: {
          status: "succeeded",
          writtenAt,
          bigCommerceImageId: outcome.imageId,
          responsePayload: json({ upload: outcome.response, removal }),
          errorMessage:
            removal && !removal.ok
              ? "Replacement uploaded, but the previous image #" +
                String(replaced?.id) +
                " could not be removed: " +
                (removal.message ?? "unknown error") +
                ". Remove it from the BigCommerce control panel."
              : null,
        },
      });
      await prisma.productStudioAsset.update({
        where: { id: item.assetId },
        data: { publishedAt: writtenAt, bigCommerceImageId: outcome.imageId },
      });
      await writeAudit({
        actorUserId: args.actorUserId,
        action: "product_studio.publish_succeeded",
        entityType: "ProductStudioAsset",
        entityId: item.assetId,
        afterData: {
          ...auditContext(row, resolvedTarget),
          logId: log.id,
          bigCommerceImageId: outcome.imageId,
          replacedImageId: replaced?.id ?? null,
          replacedImageRemoved: removal ? removal.ok : null,
        },
      });
      results.push({
        kind: "image",
        label,
        status: "succeeded",
        message: replaced
          ? "Replaced image #" +
            String(replaced.id) +
            " with image id " +
            String(outcome.imageId ?? "unknown") +
            (removal && !removal.ok
              ? ", but the old image could not be removed: " + (removal.message ?? "unknown error")
              : "") +
            "."
          : "Added to the listing as image id " + String(outcome.imageId ?? "unknown") + ".",
        logId: log.id,
      });
      continue;
    }

    if (item.kind === "main_image") {
      // A draft already on the store becomes its main image in place
      // (2026-10-26): one PUT setting the thumbnail flag and first position.
      const label = "Composition " + String(item.slot) + " (r" + String(item.revision) + ")";
      const update = {
        productId: resolvedTarget.sourceProductId,
        imageId: item.imageId,
        isThumbnail: true,
        sortOrder: 0,
      };
      const log = await prisma.productStudioPublishLog.create({
        data: {
          ...common,
          assetId: item.assetId,
          kind: "image",
          status: "queued",
          requestPayload: json({ ...buildImageUpdateRequestPayload(update), promotesToMain: true }),
          beforeSnapshot,
        },
        select: { id: true },
      });
      const outcome = await updateBigCommerceProductImage({ credentials, ...update });
      if (!outcome.ok) {
        await prisma.productStudioPublishLog.update({
          where: { id: log.id },
          data: {
            status: "failed",
            errorMessage: outcome.message,
            responsePayload: json(outcome.response ?? null),
          },
        });
        await writeAudit({
          actorUserId: args.actorUserId,
          action: "product_studio.publish_failed",
          entityType: "ProductStudioAsset",
          entityId: item.assetId,
          afterData: {
            ...auditContext(row, resolvedTarget),
            logId: log.id,
            error: outcome.message,
          },
        });
        results.push({
          kind: "main_image",
          label,
          status: "failed",
          message: "Could not make it the main image: " + outcome.message,
          logId: log.id,
        });
        break;
      }
      await prisma.productStudioPublishLog.update({
        where: { id: log.id },
        data: {
          status: "succeeded",
          writtenAt: new Date(),
          bigCommerceImageId: item.imageId,
          responsePayload: json(outcome.response),
        },
      });
      await writeAudit({
        actorUserId: args.actorUserId,
        action: "product_studio.publish_succeeded",
        entityType: "ProductStudioAsset",
        entityId: item.assetId,
        afterData: {
          ...auditContext(row, resolvedTarget),
          logId: log.id,
          bigCommerceImageId: item.imageId,
          promotedToMain: true,
        },
      });
      results.push({
        kind: "main_image",
        label,
        status: "succeeded",
        message: "Now the listing's main image (image id " + String(item.imageId) + ").",
        logId: log.id,
      });
      continue;
    }

    // The description.
    const html = descriptionToHtml(item.text);
    const log = await prisma.productStudioPublishLog.create({
      data: {
        ...common,
        kind: "description",
        status: "queued",
        requestPayload: json(
          buildDescriptionRequestPayload({ productId: resolvedTarget.sourceProductId, html }),
        ),
        beforeSnapshot,
      },
      select: { id: true },
    });
    const outcome = await writeBigCommerceProductDescription({
      credentials,
      productId: resolvedTarget.sourceProductId,
      html,
    });
    if (!outcome.ok) {
      await prisma.productStudioPublishLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          errorMessage: outcome.message,
          responsePayload: json(outcome.response ?? null),
        },
      });
      await writeAudit({
        actorUserId: args.actorUserId,
        action: "product_studio.publish_failed",
        entityType: "ProductStudioProject",
        entityId: row.id,
        afterData: { ...auditContext(row, resolvedTarget), logId: log.id, error: outcome.message },
      });
      logger.error(
        { projectId: row.id, logId: log.id, status: outcome.status },
        "product studio description publish failed",
      );
      results.push({
        kind: "description",
        label: "Full description",
        status: "failed",
        message: outcome.message,
        logId: log.id,
      });
      break;
    }
    const writtenAt = new Date();
    await prisma.productStudioPublishLog.update({
      where: { id: log.id },
      data: { status: "succeeded", writtenAt, responsePayload: json(outcome.response) },
    });
    await prisma.productStudioProject.update({
      where: { id: row.id },
      data: { descriptionPublishedAt: writtenAt },
    });
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "product_studio.publish_succeeded",
      entityType: "ProductStudioProject",
      entityId: row.id,
      afterData: { ...auditContext(row, resolvedTarget), logId: log.id, field: "description" },
    });
    results.push({
      kind: "description",
      label: "Full description",
      status: "succeeded",
      message: "The listing's description was replaced.",
      logId: log.id,
    });
  }

  // The local Product row is deliberately not updated: BigCommerce owns
  // description and image status, and the next sync brings them back.
  const failed = results.filter((item) => item.status === "failed");
  const sent = results.length - failed.length;
  const remaining = verdict.items.length - results.length;
  // A project whose content reached the store is approved (product owner,
  // 2026-10-28): what a Super Admin chose to publish is the listing now,
  // whatever drafts were rejected along the way. Only a complete, successful
  // publish does this, and only from needs_review; a failure leaves the
  // status alone so the page still says what is outstanding.
  if (failed.length === 0 && sent > 0 && row.status === "needs_review") {
    await prisma.productStudioProject.update({
      where: { id: row.id },
      data: { status: "approved" },
    });
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "product_studio.project_approved_on_publish",
      entityType: "ProductStudioProject",
      entityId: row.id,
      beforeData: { status: row.status },
      afterData: { status: "approved", publishedItems: sent },
    });
  }
  return {
    status: failed.length > 0 ? "failed" : "succeeded",
    items: results,
    message:
      failed.length > 0
        ? String(sent) +
          " item" +
          (sent === 1 ? "" : "s") +
          " published, then " +
          failed[0]!.label +
          " failed" +
          (remaining > 0 ? " and " + String(remaining) + " more were not attempted" : "") +
          ". Fix the cause and publish again; what succeeded is not resent."
        : String(sent) + " item" + (sent === 1 ? "" : "s") + " published to BigCommerce.",
  };
}
