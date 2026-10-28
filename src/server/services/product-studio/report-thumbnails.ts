/**
 * Stored report thumbnails (2026-10-28).
 *
 * Shrinking images at report time (report-images.ts) stopped the PDF from
 * exhausting the web service's memory, but each image still had to be read
 * from the database at full size and decoded on half a CPU before it could
 * be shrunk. A report of a few dozen projects took longer than Render's
 * proxy waits for a response and the reader saw a 504 instead.
 *
 * Each asset now carries `reportThumbnail`, the report-sized JPEG, written
 * when the asset is created. Assets from before this column are filled in
 * two ways: lazily, the first time a report needs one, and by the worker
 * once at start-up, one asset at a time so its memory stays flat. The
 * report reads thumbnails alone, a few hundred kilobytes for fifty projects
 * instead of a gigabyte. A thumbnail is a derived cache, never business
 * data, so writing one is not audited and does not bump `updatedAt`.
 */
import { prisma } from "@/server/db/client";
import { logger } from "@/server/logger";

import { shrinkForReport, type ReportImage } from "./report-images";

/** The thumbnail bytes for a new asset, or null when the bytes are not an image. */
export async function reportThumbnailFor(
  data: Uint8Array,
  contentType: string,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const image = await shrinkForReport({ contentType, data });
  // A fresh copy over a plain ArrayBuffer, the shape Prisma's Bytes input takes.
  return image ? new Uint8Array(image.data) : null;
}

/**
 * Writes a thumbnail for an asset that has none. Raw SQL on purpose: Prisma's
 * `update` would also bump `updatedAt`, which this cache fill must not do.
 */
async function storeReportThumbnail(assetId: string, data: Uint8Array): Promise<void> {
  await prisma.$executeRaw`UPDATE "product_studio_assets" SET "reportThumbnail" = ${Buffer.from(data)} WHERE "id" = ${assetId} AND "reportThumbnail" IS NULL`;
}

export type ReportImageLookup = {
  image: ReportImage | null;
  /** The asset has an image but no stored thumbnail, and the budget was spent. */
  pending: boolean;
};

/**
 * The report image for an asset: the stored thumbnail when there is one;
 * otherwise, while the caller's budget lasts, made from the full image now
 * and stored for next time; otherwise pending. The budget bounds how many
 * full-size reads one request makes.
 */
export async function reportImageForAsset(
  assetId: string,
  budget: { remaining: number },
): Promise<ReportImageLookup> {
  const cached = await prisma.productStudioAsset.findUnique({
    where: { id: assetId },
    select: { reportThumbnail: true },
  });
  if (!cached) return { image: null, pending: false };
  if (cached.reportThumbnail) {
    return { image: { data: cached.reportThumbnail, format: "jpg" }, pending: false };
  }
  if (budget.remaining <= 0) return { image: null, pending: true };
  budget.remaining -= 1;
  const full = await prisma.productStudioAsset.findUnique({
    where: { id: assetId },
    select: { contentType: true, data: true },
  });
  const image = await shrinkForReport(full);
  if (image) await storeReportThumbnail(assetId, image.data);
  return { image, pending: false };
}

/**
 * Fills the thumbnail of every asset that lacks one, newest first, one at a
 * time. Idempotent and safe to run on every worker start: once the column
 * is full it costs one query. Returns the number filled.
 */
export async function backfillReportThumbnails(args?: { limit?: number }): Promise<number> {
  const limit = args?.limit ?? Number.POSITIVE_INFINITY;
  let filled = 0;
  let skipped = 0;
  const seen = new Set<string>();
  while (filled < limit) {
    const next = await prisma.productStudioAsset.findFirst({
      where: { reportThumbnail: null, id: { notIn: [...seen] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, contentType: true, data: true },
    });
    if (!next) break;
    seen.add(next.id);
    const image = await shrinkForReport(next);
    if (!image) {
      skipped += 1;
      continue;
    }
    await storeReportThumbnail(next.id, image.data);
    filled += 1;
  }
  if (filled > 0 || skipped > 0) {
    logger.info({ filled, skipped }, "[product-studio] report thumbnails backfilled");
  }
  return filled;
}
