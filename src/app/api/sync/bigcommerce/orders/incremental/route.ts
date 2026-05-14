/**
 * Incremental BC order sync — fans out to all configured BC stores
 * but only processes orders changed since each connection's
 * lastSuccessfulSyncAt.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchBigCommerceSync } from "@/server/services/sync/bigcommerce-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const jobs = await dispatchBigCommerceSync({
    entity: "orders",
    mode: "incremental",
    actorUserId: actor.id,
  });
  return Response.json({ jobs });
}
