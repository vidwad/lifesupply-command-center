/**
 * QuickBooks OAuth step 1 (Phase 6): redirect the admin to Intuit's consent
 * screen. Read-only accounting scope. State is double-submitted via an
 * httpOnly cookie and checked in the callback.
 */
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

import { PERMISSIONS } from "@/lib/permissions";
import { buildAuthorizeUrl, getQboAppConfig } from "@/server/integrations/quickbooks/client";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);

  const config = await getQboAppConfig();
  if (!config) {
    return Response.json(
      {
        error:
          "QuickBooks app credentials are not configured. Set clientId, clientSecret, and redirectUri in /admin/integrations first.",
      },
      { status: 400 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("qbo_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600,
    path: "/",
  });

  return Response.redirect(buildAuthorizeUrl(config, state), 302);
}
