/**
 * Product Studio publish eligibility — pure rules, no Prisma, no HTTP.
 *
 * Shared by the write service (to refuse) and the project page (to explain),
 * so the two can never disagree about what is required. Everything here is
 * a function of the rows passed in.
 *
 * What may be published (product owner, 2026-10-22):
 *   - a generated draft that a reviewer approved AND a Super Admin then
 *     marked "approved for upload", once per draft;
 *   - the full description, once a Super Admin marked it "approved for
 *     upload", once per project.
 * Internal approval alone publishes nothing. The upload mark alone publishes
 * nothing. Only the explicit publish action, under three flags and the
 * Super Admin-only permission, sends anything to the store.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";

import { MAX_IMAGE_ALT_LENGTH } from "@/server/integrations/bigcommerce/catalog-publish";

import { stripListingLinks } from "./listing-copy";

/**
 * All three must be on. external.writebacks is the platform gate for any
 * BigCommerce write; product_studio.publish is this capability's own; both
 * sit in the kill set, so tripping the kill switch stops this path.
 */
export const REQUIRED_PUBLISH_FLAGS = [
  FEATURE_FLAGS.PRODUCT_STUDIO,
  FEATURE_FLAGS.PRODUCT_STUDIO_PUBLISH,
  FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
] as const;

/** Held by Super Admin only (prisma/seed/auth.ts gives it to no other role). */
export const PUBLISH_PERMISSION = PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE;

export function canUserPublish(user: { permissions: readonly string[] } | null | undefined) {
  return Boolean(user?.permissions.includes(PUBLISH_PERMISSION));
}

export type LinkedProduct = {
  id: string;
  name: string;
  sku: string | null;
  storeId: string | null;
  sourceSystem: string | null;
  sourceId: string | null;
  store?: { name: string } | null;
};

export type PublishTarget = {
  storeId: string;
  storeName: string | null;
  productId: string;
  productName: string;
  sku: string | null;
  /** The BigCommerce product id, as text. */
  sourceProductId: string;
};

/**
 * The store product this project would write to. A project links to a
 * catalogue product only through its optional product record, and that
 * record must have been synced from BigCommerce for a store with an id.
 */
export function resolvePublishTarget(product: LinkedProduct | null | undefined): {
  target: PublishTarget | null;
  reason: string | null;
} {
  if (!product) {
    return {
      target: null,
      reason:
        "This project is not linked to a catalogue product. Start a project from a product page " +
        "to publish to its store listing.",
    };
  }
  if (!product.storeId) {
    return {
      target: null,
      reason: 'Product "' + product.name + '" has no store, so there is nowhere to publish to.',
    };
  }
  const system = product.sourceSystem?.trim().toLowerCase() ?? "";
  const sourceId = product.sourceId?.trim() ?? "";
  if (system !== "bigcommerce" || !sourceId) {
    return {
      target: null,
      reason:
        'Product "' +
        product.name +
        '" is not mapped to a BigCommerce product id, so it cannot be published to.',
    };
  }
  return {
    target: {
      storeId: product.storeId,
      storeName: product.store?.name ?? null,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      sourceProductId: sourceId,
    },
    reason: null,
  };
}

export type PublishableAsset = {
  id: string;
  kind: "source" | "generated";
  compositionSlot: number | null;
  revision: number;
  status: string;
  fileName: string;
  contentType: string;
  bytes: number;
  contentHash: string;
  uploadApprovedAt: Date | null;
  publishedAt: Date | null;
};

export type PublishCandidate =
  | {
      kind: "image";
      assetId: string;
      slot: number;
      revision: number;
      fileName: string;
      contentType: string;
      bytes: number;
      contentHash: string;
      altText: string;
    }
  | { kind: "description"; text: string };

/** The latest revision of each generated slot, which is the only one that counts. */
export function latestGeneratedBySlot<T extends PublishableAsset>(assets: readonly T[]): T[] {
  const bySlot = new Map<number, T>();
  for (const asset of assets) {
    if (asset.kind !== "generated" || asset.compositionSlot == null) continue;
    const current = bySlot.get(asset.compositionSlot);
    if (!current || asset.revision > current.revision) bySlot.set(asset.compositionSlot, asset);
  }
  return [...bySlot.values()].sort((a, b) => a.compositionSlot! - b.compositionSlot!);
}

/** Whether a draft may carry the upload mark at all. */
export function assetCanBeMarked(
  asset: PublishableAsset,
  all: readonly PublishableAsset[],
): { ok: true } | { ok: false; reason: string } {
  if (asset.kind !== "generated" || asset.compositionSlot == null) {
    return { ok: false, reason: "Only generated draft images can be marked for upload." };
  }
  if (asset.status !== "approved") {
    return { ok: false, reason: "Approve the draft in review before marking it for upload." };
  }
  const latest = latestGeneratedBySlot(all).find(
    (item) => item.compositionSlot === asset.compositionSlot,
  );
  if (latest && latest.id !== asset.id) {
    return { ok: false, reason: "A newer revision of this composition exists; mark that one." };
  }
  if (asset.publishedAt) {
    return { ok: false, reason: "This draft has already been published." };
  }
  return { ok: true };
}

export function buildImageAltText(args: { title: string; compositionName: string }): string {
  const text = (args.title.trim() + " — " + args.compositionName.trim()).trim();
  return text.length > MAX_IMAGE_ALT_LENGTH ? text.slice(0, MAX_IMAGE_ALT_LENGTH - 1) + "…" : text;
}

/**
 * Everything marked for upload and not yet published, in the order it will
 * be sent: images by slot, then the description.
 */
export function selectPublishItems(args: {
  project: {
    title: string;
    confirmedTitle: string | null;
    longDescription: string | null;
    descriptionUploadApprovedAt: Date | null;
    descriptionPublishedAt: Date | null;
  };
  assets: readonly PublishableAsset[];
  compositions: readonly { slot: number; name: string }[];
}): PublishCandidate[] {
  const items: PublishCandidate[] = [];
  const title = args.project.confirmedTitle ?? args.project.title;
  for (const asset of latestGeneratedBySlot(args.assets)) {
    if (asset.status !== "approved" || !asset.uploadApprovedAt || asset.publishedAt) continue;
    const composition = args.compositions.find((item) => item.slot === asset.compositionSlot);
    items.push({
      kind: "image",
      assetId: asset.id,
      slot: asset.compositionSlot!,
      revision: asset.revision,
      fileName: asset.fileName,
      contentType: asset.contentType,
      bytes: asset.bytes,
      contentHash: asset.contentHash,
      altText: buildImageAltText({
        title,
        compositionName: composition?.name ?? "Composition " + String(asset.compositionSlot),
      }),
    });
  }
  // Stripped again here, not only at research time, so a project researched
  // before the no-links rule never publishes a link to another seller.
  const text = stripListingLinks(args.project.longDescription ?? "");
  if (text && args.project.descriptionUploadApprovedAt && !args.project.descriptionPublishedAt) {
    items.push({ kind: "description", text });
  }
  return items;
}

export type PublishVerdict =
  | { allowed: true; items: PublishCandidate[]; target: PublishTarget }
  | {
      allowed: false;
      reason: "missing_target" | "nothing_marked" | "project_busy";
      message: string;
    };

export function canPublish(args: {
  target: PublishTarget | null;
  targetReason: string | null;
  items: PublishCandidate[];
  busy: boolean;
}): PublishVerdict {
  if (!args.target) {
    return {
      allowed: false,
      reason: "missing_target",
      message: args.targetReason ?? "This project has no BigCommerce product to publish to.",
    };
  }
  if (args.busy) {
    return {
      allowed: false,
      reason: "project_busy",
      message: "The worker is still processing this project. Publish once it is idle.",
    };
  }
  if (args.items.length === 0) {
    return {
      allowed: false,
      reason: "nothing_marked",
      message:
        "Nothing is marked for upload. Mark approved images or the description as approved for " +
        "upload first.",
    };
  }
  return { allowed: true, items: args.items, target: args.target };
}

const escapeHtml = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * The description is stored as plain prose. BigCommerce renders the field
 * as HTML, so each paragraph becomes a <p> with its characters escaped: the
 * text can carry no markup of its own, and nothing in it can become a tag.
 */
export function descriptionToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => "<p>" + escapeHtml(paragraph).replace(/\n/g, "<br>") + "</p>")
    .join("\n");
}
