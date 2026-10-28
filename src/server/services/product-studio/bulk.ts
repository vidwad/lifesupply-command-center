/**
 * Bulk project creation from the products list (product owner, 2026-10-26).
 *
 * Select products, open them in Product Studio together: one project per
 * product, seeded with the product's first store image as its authoritative
 * photograph when the store has one. The projects share a batch id so the
 * project page can step through them.
 *
 * NO AI SPEND HAPPENS HERE. Creation only: no research, no generation, no
 * event is sent. Each project is researched from its own page, or not at
 * all. A canary holds this module to that.
 *
 * The seeded photo is the catalogue's own image, usually the manufacturer's,
 * so it is treated as a new, sealed product's reference rather than a
 * photograph of a particular unit. An operator can add or replace photos on
 * the project page until research has run.
 */
import { createHash, randomUUID } from "node:crypto";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { requireFeature } from "@/server/services/feature-flags";

import { ProductStudioInputError } from "./index";

export const MAX_BATCH_SIZE = 50;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

/** Hosts the store serves product images from. Nothing else is fetched. */
const IMAGE_HOSTS = [".bigcommerce.com", ".mybigcommerce.com"];

export function isStoreImageHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" && IMAGE_HOSTS.some((suffix) => hostname.toLowerCase().endsWith(suffix))
    );
  } catch {
    return false;
  }
}

type StoreImage = { url: string; isThumbnail: boolean; sortOrder: number };

/**
 * The store's primary image for a product from the synced BigCommerce
 * payload: the thumbnail if one is flagged, else the lowest sort order, at
 * the largest size the store publishes.
 */
export function firstStoreImageUrl(metadata: unknown): string | null {
  const raw =
    metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>).bcRaw : null;
  const images =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>).images : undefined;
  if (!Array.isArray(images)) return null;
  const candidates: StoreImage[] = [];
  for (const value of images) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    const url =
      typeof record.url_zoom === "string"
        ? record.url_zoom
        : typeof record.url_standard === "string"
          ? record.url_standard
          : null;
    if (!url || !isStoreImageHost(url)) continue;
    candidates.push({
      url,
      isThumbnail: record.is_thumbnail === true,
      sortOrder:
        typeof record.sort_order === "number" ? record.sort_order : Number.MAX_SAFE_INTEGER,
    });
  }
  candidates.sort((a, b) =>
    a.isThumbnail !== b.isThumbnail ? (a.isThumbnail ? -1 : 1) : a.sortOrder - b.sortOrder,
  );
  return candidates[0]?.url ?? null;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** The store's HTML description as plain prose, within the intake bounds. */
export function storeDescriptionToText(html: string | null | undefined, productName: string) {
  const text = (html ?? "")
    .replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
      if (code.startsWith("#x")) return String.fromCodePoint(parseInt(code.slice(2), 16));
      if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10));
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  const fallback = "Imported from the store listing for " + productName.trim() + ".";
  const chosen = text.length >= 10 ? text : fallback;
  return chosen.length > 4000 ? chosen.slice(0, 3997).trimEnd() + "…" : chosen;
}

export type SeedOutcome =
  | { ok: true; fileName: string; contentType: string; data: Buffer<ArrayBuffer>; bytes: number }
  | { ok: false; reason: string };

function extensionFor(contentType: string): string {
  return contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
}

/** Fetches the store image, bounded in host, type, size and time. */
export async function fetchStoreImage(url: string): Promise<SeedOutcome> {
  if (!isStoreImageHost(url)) return { ok: false, reason: "Image is not on a store host." };
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      cache: "no-store",
    });
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Image fetch failed." };
  }
  if (!response.ok) return { ok: false, reason: "Image fetch returned HTTP " + response.status };
  const contentType = (response.headers.get("content-type") ?? "").split(";")[0]!.trim();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return { ok: false, reason: "Image is " + (contentType || "an unknown type") + "." };
  }
  const buffer = Buffer.from(await response.arrayBuffer()) as Buffer<ArrayBuffer>;
  if (buffer.byteLength === 0) return { ok: false, reason: "Image is empty." };
  if (buffer.byteLength > MAX_SOURCE_BYTES) return { ok: false, reason: "Image exceeds 8 MiB." };
  return {
    ok: true,
    fileName: "store-image-1." + extensionFor(contentType),
    contentType,
    data: buffer,
    bytes: buffer.byteLength,
  };
}

export type BatchEntry = {
  productId: string;
  productName: string;
  projectId: string | null;
  seeded: boolean;
  note: string | null;
};

export type BatchResult = { batchId: string; entries: BatchEntry[] };

/**
 * The unattended-run form's address for a batch (2026-10-28). A product that
 * already had a live project is not re-created, so that project carries its
 * original batch id, not this one; the form would miss it if it were sent
 * the batch alone. Those projects travel as `id=` beside the batch, and the
 * form merges the two. Before this, selecting products that had all been
 * opened in the Studio once reached the form with nothing selected.
 */
export function runFormHrefForBatch(result: BatchResult): string {
  const qs = new URLSearchParams({ batch: result.batchId });
  for (const entry of result.entries) {
    if (entry.projectId && entry.note?.startsWith("Already")) qs.append("id", entry.projectId);
  }
  return "/automation/product-studio/new?" + qs.toString();
}

/**
 * Creates one project per selected product, in the order selected, under one
 * batch id. A product that already has a live project is not duplicated; its
 * existing project is reported instead.
 */
export async function createProductStudioBatch(args: {
  actorUserId: string;
  productIds: string[];
}): Promise<BatchResult> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const ids = [...new Set(args.productIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) throw new ProductStudioInputError("Select at least one product.");
  if (ids.length > MAX_BATCH_SIZE) {
    throw new ProductStudioInputError(
      "Select at most " + String(MAX_BATCH_SIZE) + " products per batch.",
    );
  }
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      metadata: true,
      studioProjects: {
        where: { status: { notIn: ["failed", "archived"] } },
        select: { id: true },
        take: 1,
      },
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const batchId = randomUUID();
  const entries: BatchEntry[] = [];

  for (const id of ids) {
    const product = byId.get(id);
    if (!product) {
      entries.push({
        productId: id,
        productName: id,
        projectId: null,
        seeded: false,
        note: "Product not found.",
      });
      continue;
    }
    const existing = product.studioProjects[0];
    if (existing) {
      entries.push({
        productId: id,
        productName: product.name,
        projectId: existing.id,
        seeded: false,
        note: "Already has a project; opened that one instead.",
      });
      continue;
    }
    const imageUrl = firstStoreImageUrl(product.metadata);
    const seed = imageUrl ? await fetchStoreImage(imageUrl) : null;
    const title = product.name.trim().slice(0, 240).padEnd(3, ".");
    const project = await prisma.productStudioProject.create({
      data: {
        productId: product.id,
        createdById: args.actorUserId,
        batchId,
        title,
        shortDescription: storeDescriptionToText(product.description, product.name),
        warnings: [],
        assets: seed?.ok
          ? {
              create: [
                {
                  kind: "source",
                  status: "uploaded",
                  fileName: seed.fileName,
                  contentType: seed.contentType,
                  bytes: seed.bytes,
                  data: seed.data,
                  contentHash: createHash("sha256").update(seed.data).digest("hex"),
                },
              ],
            }
          : undefined,
      },
      select: { id: true },
    });
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "product_studio.project_created",
      entityType: "ProductStudioProject",
      entityId: project.id,
      afterData: {
        productId: product.id,
        title,
        batchId,
        seededFromStore: seed?.ok === true,
        storeImageUrl: seed?.ok ? imageUrl : null,
        sourceImageCount: seed?.ok ? 1 : 0,
        note: "Created in bulk from the products list. No research or generation was queued.",
      },
    });
    entries.push({
      productId: product.id,
      productName: product.name,
      projectId: project.id,
      seeded: seed?.ok === true,
      note: seed
        ? seed.ok
          ? null
          : "Store image could not be used (" + seed.reason + "); add a photo on the project page."
        : "The store has no image; add a photo on the project page.",
    });
  }

  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.batch_created",
    entityType: "ProductStudioBatch",
    entityId: batchId,
    afterData: {
      requested: ids.length,
      created: entries.filter((entry) => entry.projectId && !entry.note?.startsWith("Already"))
        .length,
      seeded: entries.filter((entry) => entry.seeded).length,
    },
  });
  return { batchId, entries };
}

/** The projects in a batch, in creation order, for stepping through them. */
export async function listBatchProjects(batchId: string) {
  return prisma.productStudioProject.findMany({
    where: { batchId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      confirmedTitle: true,
      status: true,
      _count: { select: { assets: { where: { kind: "source" } } } },
    },
  });
}
