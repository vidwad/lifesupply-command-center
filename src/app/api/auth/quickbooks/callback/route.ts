/**
 * QuickBooks OAuth step 2 (Phase 6): verify state, exchange the code for
 * tokens (stored encrypted on the QuickBooks connection), audit, and bounce
 * back to /admin/integrations.
 */
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

import { PERMISSIONS } from "@/lib/permissions";
import { writeAudit } from "@/server/audit";
import { exchangeAuthCode } from "@/server/integrations/quickbooks/client";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("qbo_oauth_state")?.value;
  cookieStore.delete("qbo_oauth_state");

  const redirectTo = (query: string) =>
    Response.redirect(new URL(`/admin/integrations${query}`, url.origin), 302);

  if (!state || !expectedState || state !== expectedState) {
    return redirectTo("?qbo=state_mismatch");
  }
  if (!code || !realmId) {
    return redirectTo("?qbo=missing_code");
  }

  try {
    const { connectionId } = await exchangeAuthCode({ code, realmId });
    await writeAudit({
      actorUserId: actor.id,
      action: "integration.quickbooks_connected",
      entityType: "IntegrationConnection",
      entityId: connectionId,
      afterData: { realmIdLastFour: realmId.slice(-4) },
    });
    return redirectTo("?qbo=connected");
  } catch (err) {
    await writeAudit({
      actorUserId: actor.id,
      action: "integration.quickbooks_connect_failed",
      entityType: "IntegrationConnection",
      afterData: { error: err instanceof Error ? err.message.slice(0, 200) : "unknown" },
    });
    return redirectTo("?qbo=error");
  }
}
