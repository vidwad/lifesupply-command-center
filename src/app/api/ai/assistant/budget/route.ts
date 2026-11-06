/**
 * Today's assistant allowances for the drawer's budget strip (2026-11-06).
 * Read on open, so the strip is current after another tab or person spent.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { getAssistantBudgetSummary } from "@/server/services/ai/assistant/budget-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  return Response.json(await getAssistantBudgetSummary(user.id), {
    headers: { "Cache-Control": "no-store" },
  });
}
