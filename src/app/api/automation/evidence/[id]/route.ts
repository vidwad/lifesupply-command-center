/**
 * Serve a stored automation evidence payload (screenshot/artifact) to
 * authenticated reviewers (Phase 7). Bytes live in Postgres — see
 * src/server/services/automation/evidence.ts.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { getEvidencePayload } from "@/server/services/automation/evidence";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await requirePermission(PERMISSIONS.SUPPLIERS_VIEW);
  const { id } = await params;

  const payload = await getEvidencePayload(id);
  if (!payload) {
    return Response.json(
      { error: "Evidence not found or has no stored payload." },
      { status: 404 },
    );
  }

  return new Response(new Uint8Array(payload.bytes), {
    headers: {
      "Content-Type": payload.contentType,
      "Content-Length": String(payload.bytes.length),
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${(payload.label ?? payload.id).replace(/[^\w.-]/g, "_")}${payload.contentType === "image/png" ? ".png" : ""}"`,
    },
  });
}
