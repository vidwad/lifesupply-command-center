/**
 * Live BigCommerce customer export → streaming CSV.
 *
 * Streaming so an Enterprise store with hundreds of thousands of orders
 * doesn't OOM the 512MB Render worker AND so the openresty proxy in front
 * of Render starts seeing bytes immediately (the previous XLSX endpoint
 * built everything in memory and timed out / crashed with a 502).
 *
 * Audit-logged after the stream finishes via the stats promise.
 */

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PERMISSIONS } from "@/lib/permissions";
import {
  buildBigCommerceCustomerCsvStream,
  prepareBigCommerceCustomerStream,
} from "@/server/integrations/bigcommerce/customer-stream";
import { logger } from "@/server/logger";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission(PERMISSIONS.CUSTOMERS_EXPORT);
  const { id } = await ctx.params;

  const conn = await prisma.integrationConnection.findUnique({
    where: { id },
    select: { id: true, name: true, integrationType: true },
  });
  if (!conn) {
    return Response.json({ error: "Integration not found" }, { status: 404 });
  }
  if (conn.integrationType !== "bigcommerce") {
    return Response.json(
      {
        error: `Customer export is only supported for BigCommerce (got "${conn.integrationType}").`,
      },
      { status: 400 },
    );
  }

  const prep = await prepareBigCommerceCustomerStream(conn.name);
  if (!prep.ok) {
    return Response.json(
      { error: prep.message, status: prep.status },
      { status: typeof prep.status === "number" ? prep.status : 422 },
    );
  }

  const { stream, statsPromise } = buildBigCommerceCustomerCsvStream(prep);

  // Fire-and-log: audit after stream completes; don't block the response.
  statsPromise
    .then(async (stats) => {
      await writeAudit({
        actorUserId: actor.id,
        action: "export.bigcommerce_customers.csv",
        entityType: "integration_connection",
        entityId: conn.id,
        afterData: { connectionName: conn.name, ...stats },
      });
    })
    .catch((err) => {
      logger.error({ err, connectionId: conn.id }, "BC customer CSV stream failed");
    });

  const filename = `bc-customers-${slugify(conn.name)}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      // Hint to proxies + browsers to flush bytes as they arrive.
      "X-Accel-Buffering": "no",
    },
  });
}
