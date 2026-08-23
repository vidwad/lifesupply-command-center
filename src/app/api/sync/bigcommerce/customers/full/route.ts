/**
 * Full BC customer sync — fans out to every configured BC store, or to one
 * division's stores when `?division=` is supplied.
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

export async function POST(request: Request): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  // Mirrors the shell's Division selector (`?division=`). Absent = all divisions.
  const divisionId = new URL(request.url).searchParams.get("division");
  const jobs = await dispatchBigCommerceCustomerSync({
    mode: "full",
    actorUserId: actor.id,
    divisionId,
  });
  return Response.json({ jobs });
}
