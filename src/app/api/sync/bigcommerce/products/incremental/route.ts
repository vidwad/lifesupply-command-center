/**
 * Incremental BC catalog sync (products modified since last successful sync;
 * categories always full) — fans out to all configured BC stores.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchBigCommerceSync } from "@/server/services/sync/bigcommerce-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const jobs = await dispatchBigCommerceSync({
    entity: "products",
    mode: "incremental",
    actorUserId: actor.id,
  });
  return Response.json({ jobs });
}
