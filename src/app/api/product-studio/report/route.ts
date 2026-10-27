import { renderToBuffer } from "@react-pdf/renderer";

import { PERMISSIONS } from "@/lib/permissions";
import { writeAudit } from "@/server/audit";
import { requirePermission } from "@/server/permissions";
import {
  buildProductStudioReport,
  MAX_REPORT_PROJECTS,
} from "@/server/services/product-studio/report";
import { ProductStudioReportDocument } from "@/server/services/product-studio/report-document";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Product Studio summary PDF for the selected projects (2026-10-26).
 * `?id=` repeated, up to fifty. The same two permissions as the Studio
 * pages; read-only and audited.
 */
export async function GET(request: Request) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  await requirePermission(PERMISSIONS.AI_USE);
  const ids = new URL(request.url).searchParams.getAll("id");
  if (ids.length === 0) {
    return new Response("Select at least one project.", { status: 400 });
  }
  if (ids.length > MAX_REPORT_PROJECTS) {
    return new Response(`Select at most ${MAX_REPORT_PROJECTS} projects per report.`, {
      status: 400,
    });
  }

  const report = await buildProductStudioReport({
    ids,
    preparedBy: actor.name ?? actor.email ?? "system",
  });
  if (report.projects.length === 0) {
    return new Response("None of the selected projects were found.", { status: 404 });
  }
  const buffer = await renderToBuffer(ProductStudioReportDocument({ report }));

  await writeAudit({
    actorUserId: actor.id,
    action: "export.product_studio.report",
    entityType: "ProductStudioProject",
    afterData: {
      projectIds: report.projects.map((project) => project.id),
      missing: report.missing,
      bytes: buffer.length,
    },
  });

  const stamp = report.generatedAt.toISOString().slice(0, 10);
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="product-studio-summary-${stamp}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
