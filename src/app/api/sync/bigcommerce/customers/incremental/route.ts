/**
 * Incremental BC customer sync — fans out to all configured BC stores
 * but only processes customers/orders changed since each connection's
 * lastSuccessfulSyncAt.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchBigCommerceCustomerSync } from "@/server/services/sync/bigcommerce-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const jobs = await dispatchBigCommerceCustomerSync({
    mode: "incremental",
    actorUserId: actor.id,
  });
  return Response.json({ jobs });
}
