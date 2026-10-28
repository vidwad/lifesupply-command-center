import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { getImageCandidateThumbnail } from "@/server/services/product-studio/competitor-images";

/**
 * The thumbnail of a seller image found by the seller-image search
 * (2026-10-28), for the project page to show. Only the thumbnail is stored,
 * so only the thumbnail is served; the same permission as the project's
 * own images.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  const { id } = await params;
  const candidate = await getImageCandidateThumbnail(id);
  if (!candidate?.thumbnail) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(new Uint8Array(candidate.thumbnail), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(candidate.thumbnail.byteLength),
      "Content-Disposition": `inline; filename="seller-image-${id}.jpg"`,
      "Cache-Control": "private, max-age=3600",
      ETag: `"${candidate.contentHash ?? id}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
