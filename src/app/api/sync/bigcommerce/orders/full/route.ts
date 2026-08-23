/**
 * Full BC order sync — fans out to every configured BC store, or to one
 * division's stores when `?division=` is supplied.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchBigCommerceSync } from "@/server/services/sync/bigcommerce-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  // Mirrors the shell's Division selector (`?division=`). Absent = all divisions.
  const divisionId = new URL(request.url).searchParams.get("division");
  const jobs = await dispatchBigCommerceSync({
    entity: "orders",
    mode: "full",
    actorUserId: actor.id,
    divisionId,
  });
  return Response.json({ jobs });
}
