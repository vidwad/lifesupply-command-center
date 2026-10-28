/**
 * Images for the summary PDF (2026-10-28), shrunk before they are embedded.
 *
 * The report used to embed each composition and source photograph at its
 * stored size: a 1024px PNG per image, up to eight per project, fifty
 * projects per report. The PDF renderer decodes every PNG, so a report of a
 * few dozen projects needed more memory than the web service has and the
 * process was killed mid-render; the reader saw Render's 502 page while the
 * service restarted.
 *
 * Every image is now re-encoded as a JPEG no larger than REPORT_IMAGE_EDGE
 * on its long side. A JPEG is embedded as-is by the renderer, no decode, so
 * the report's memory is close to the sum of these small files. WebP, which
 * the renderer cannot embed, is converted along the way instead of left out.
 */
import sharp from "sharp";

export type ReportImage = {
  /** Report-sized JPEG bytes. */
  data: Uint8Array;
  format: "jpg" | "png";
};

/** Long-edge pixel bound; the report shows images at 232pt. */
export const REPORT_IMAGE_EDGE = 640;
const JPEG_QUALITY = 78;

/**
 * The image as a report-sized JPEG, or null when the bytes cannot be read as
 * an image. Decoding failures are swallowed rather than failing the whole
 * report over one asset.
 */
export async function shrinkForReport(
  asset: { contentType: string; data: Uint8Array } | null,
): Promise<ReportImage | null> {
  if (!asset || !asset.contentType.startsWith("image/")) return null;
  try {
    const data = await sharp(asset.data, { limitInputPixels: 64_000_000 })
      .rotate()
      .resize({
        width: REPORT_IMAGE_EDGE,
        height: REPORT_IMAGE_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return { data: new Uint8Array(data), format: "jpg" };
  } catch {
    return null;
  }
}
