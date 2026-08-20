import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { getProductStudioAsset } from "@/server/services/product-studio";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  const { id } = await params;
  const asset = await getProductStudioAsset(id);
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });

  const fileName = asset.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  // ?download=1 serves the same bytes as an attachment. Same permission check,
  // same asset — only the disposition differs, so there is no second surface to
  // secure.
  const download = new URL(request.url).searchParams.get("download") === "1";
  const disposition = download ? "attachment" : "inline";
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Length": String(asset.bytes),
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "private, max-age=3600",
      ETag: `"${asset.contentHash}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
