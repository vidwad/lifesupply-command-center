/**
 * CSV export of a forecast scenario (Phase 9). Includes assumption, source,
 * freshness, and limitation footer rows so the export can never masquerade
 * as actuals.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { csvResponse } from "@/server/services/exports/csv";
import {
  getForecastScenario,
  scenarioToCsv,
} from "@/server/services/financials/forecast-scenarios";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await requirePermission(PERMISSIONS.FINANCIALS_EXPORT);
  const { id } = await params;
  const scenario = await getForecastScenario(id);
  if (!scenario) {
    return Response.json({ error: "Scenario not found." }, { status: 404 });
  }
  const body = scenarioToCsv(scenario);
  const safeName = `forecast_${scenario.name.replace(/[^\w.-]+/g, "_")}_v${scenario.version}`;
  return csvResponse(`${safeName}.csv`, body);
}
