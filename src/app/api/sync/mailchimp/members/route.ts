/**
 * Run the Mailchimp subscriber/suppression read sync (Phase 4). Requires the
 * marketing.sync_mailchimp permission — this touches customer consent data.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { dispatchMailchimpMemberSync } from "@/server/services/sync/mailchimp-dispatch";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.MARKETING_SYNC_MAILCHIMP);
  const result = await dispatchMailchimpMemberSync({ actorUserId: actor.id });
  return Response.json(result);
}
