/**
 * Auth-gated "test connection" endpoint for a BigCommerce integration. Pings
 * BC's /v2/store with the stored credentials and returns a structured JSON
 * result. Never echoes the secret back. Requires ADMIN_MANAGE_INTEGRATIONS.
 *
 * Usage (signed in as admin, in browser):
 *   /api/integrations/bigcommerce/test?name=BigCommerce%20%E2%80%94%20LifeSupply.ca
 */

import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { pingBigCommerceByConnectionName } from "@/server/integrations/bigcommerce/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);

  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return Response.json(
      { ok: false, error: "Missing ?name= query parameter (e.g. 'BigCommerce — LifeSupply.ca')" },
      { status: 400 },
    );
  }

  const result = await pingBigCommerceByConnectionName(name);
  const httpStatus = result.ok ? 200 : 422;
  return Response.json(result, { status: httpStatus });
}
