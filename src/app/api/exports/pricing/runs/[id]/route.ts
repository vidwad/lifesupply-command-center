/**
 * DP-2 export of draft pricing-run items.
 *
 * Read-only. Requires pricing.export in addition to authentication, and emits
 * only data already stored on the run — the export is how an operator gets the
 * blocked-row list out to fix costs, so it deliberately includes blocked rows
 * and their reasons rather than only the checkable ones.
 *
 * Deliberately NOT gated on pricing.intelligence (DP-2A posture decision): the
 * flag gates building and mutating runs. Tripping it must stop new activity,
 * not withhold the fix-list from an operator who may need it precisely because
 * the flag was tripped. Exporting stored rows contacts nothing external.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import { getPricingRun } from "@/server/services/pricing/runs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const money = (value: unknown): string => (value == null ? "" : Number(value).toFixed(2));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await requirePermission(PERMISSIONS.PRICING_EXPORT);
  const { id } = await params;
  const run = await getPricingRun(id);
  if (!run) return Response.json({ error: "Not found" }, { status: 404 });

  const body = toCsv({
    headers: [
      { key: "sku", label: "sku", get: (r: (typeof run.items)[number]) => r.sku },
      { key: "product_name", label: "product_name", get: (r) => r.productName ?? "" },
      { key: "current_price", label: "current_price", get: (r) => money(r.currentRegularPrice) },
      {
        key: "current_sale_price",
        label: "current_sale_price",
        get: (r) => money(r.currentSalePrice),
      },
      {
        key: "effective_price",
        label: "effective_price",
        get: (r) => money(r.currentEffectivePrice),
      },
      { key: "cost_price", label: "cost_price", get: (r) => money(r.costPrice) },
      { key: "cost_source", label: "cost_source", get: (r) => r.costSource ?? "" },
      { key: "floor_price", label: "floor_price", get: (r) => money(r.floorPrice) },
      { key: "status", label: "status", get: (r) => r.status },
      { key: "blocked_reason", label: "blocked_reason", get: (r) => r.blockedReason ?? "" },
      { key: "product_id", label: "product_id", get: (r) => r.productId ?? "" },
      { key: "variant_id", label: "variant_id", get: (r) => r.productVariantId ?? "" },
    ],
    rows: run.items,
  });

  return csvResponse(`pricing-run-${run.id}.csv`, body);
}
