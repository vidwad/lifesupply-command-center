/**
 * Run a BC ↔ Command Center reconciliation (Phase 3E) — fans out to all
 * configured + mapped BC stores.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchBigCommerceReconciliation } from "@/server/services/sync/bigcommerce-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const jobs = await dispatchBigCommerceReconciliation({ actorUserId: actor.id });
  return Response.json({ jobs });
}
