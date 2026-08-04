/**
 * Run the GA4 daily metric read sync (Phase 6) — fans out to all configured
 * GA4 connections that are mapped to a Store.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchGa4DailySync } from "@/server/services/sync/qbo-ga4-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const jobs = await dispatchGa4DailySync({ actorUserId: actor.id });
  return Response.json({ jobs });
}
