/**
 * Run the QuickBooks read-only report sync (Phase 6).
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchQboReportSync } from "@/server/services/sync/qbo-ga4-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const result = await dispatchQboReportSync({ actorUserId: actor.id });
  return Response.json(result);
}
