import { renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";

import { writeAudit } from "@/server/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { getReportById, type ReportSnapshot } from "@/server/services/reports";
import { ReportPdfDocument } from "@/server/services/reports/pdf-document";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const actor = await requirePermission(PERMISSIONS.REPORTS_EXPORT);
  const { id } = await ctx.params;

  const report = await getReportById(id);
  if (!report) notFound();

  const snapshot = (report.metadata as unknown as ReportSnapshot | null) ?? null;

  const buffer = await renderToBuffer(
    ReportPdfDocument({
      title: report.title,
      status: report.status,
      preparedBy: report.preparedBy?.name ?? report.preparedBy?.email ?? "system",
      generatedAt: report.createdAt,
      summary: report.summary,
      snapshot,
    }),
  );

  await writeAudit({
    actorUserId: actor.id,
    action: "export.report.pdf",
    entityType: "report",
    entityId: report.id,
    afterData: { title: report.title, bytes: buffer.length },
  });

  const safeName = report.title.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
