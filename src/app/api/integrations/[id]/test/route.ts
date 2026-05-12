/**
 * Admin-gated "test connection" endpoint. Dispatches to the per-provider
 * ping based on the integration's type and returns a uniform JSON result
 * the admin UI renders inline.
 *
 * POST is used (not GET) because hitting an external API is a side-effect
 * — even a read-only ping costs a token / rate-limit slot.
 */

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { testIntegrationConnection } from "@/server/services/integrations/test";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const { id } = await ctx.params;
  const result = await testIntegrationConnection(id);
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
