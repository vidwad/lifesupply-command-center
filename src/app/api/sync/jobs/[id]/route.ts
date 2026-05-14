/**
 * Sync job status — polled by the UI to render progress.
 *
 * Returns the IntegrationSyncLog row plus a few derived UI-friendly
 * fields. Cheap by design (single Prisma query) so the UI can poll
 * every couple of seconds without putting load on the DB.
 */
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const { id } = await ctx.params;

  const log = await prisma.integrationSyncLog.findUnique({
    where: { id },
    select: {
      id: true,
      syncType: true,
      status: true,
      startedAt: true,
      completedAt: true,
      recordsProcessed: true,
      recordsCreated: true,
      recordsUpdated: true,
      recordsFailed: true,
      errorSummary: true,
      metadata: true,
      integrationConnection: { select: { name: true } },
    },
  });

  if (!log) {
    return Response.json({ error: "Sync job not found" }, { status: 404 });
  }

  const durationMs = log.completedAt
    ? log.completedAt.getTime() - log.startedAt.getTime()
    : Date.now() - log.startedAt.getTime();

  return Response.json({
    id: log.id,
    syncType: log.syncType,
    status: log.status,
    isFinished:
      log.status === "success" ||
      log.status === "failed" ||
      log.status === "partial",
    startedAt: log.startedAt.toISOString(),
    completedAt: log.completedAt?.toISOString() ?? null,
    durationMs,
    recordsProcessed: log.recordsProcessed,
    recordsCreated: log.recordsCreated,
    recordsUpdated: log.recordsUpdated,
    recordsFailed: log.recordsFailed,
    errorSummary: log.errorSummary,
    metadata: log.metadata,
    connectionName: log.integrationConnection.name,
  });
}
