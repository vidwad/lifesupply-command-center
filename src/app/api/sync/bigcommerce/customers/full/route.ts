/**
 * Full BC customer sync — fans out to all configured BC stores.
 *
 * Returns immediately with a list of dispatched jobs (one per store).
 * The actual sync runs on the Background Worker; the UI polls
 * /api/sync/jobs/:id to track progress.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchBigCommerceCustomerSync } from "@/server/services/sync/bigcommerce-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const jobs = await dispatchBigCommerceCustomerSync({
    mode: "full",
    actorUserId: actor.id,
  });
  return Response.json({ jobs });
}
