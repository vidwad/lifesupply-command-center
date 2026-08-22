/**
 * DP-4 export of price recommendations.
 *
 * Read-only. Requires pricing.export and emits only rows already stored. Like
 * the DP-2 run export it is deliberately NOT gated on pricing.intelligence:
 * that flag gates creating and mutating pricing work, and tripping it must stop
 * new activity rather than withhold a queue someone may need to review
 * precisely because the flag was tripped. Exporting contacts nothing external.
 *
 * Emits proposals. It approves nothing and writes no price anywhere.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import { listRecommendations } from "@/server/services/pricing/recommendations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const money = (value: unknown): string => (value == null ? "" : Number(value).toFixed(2));
const ratio = (value: unknown): string => (value == null ? "" : Number(value).toFixed(4));

export async function GET(request: Request): Promise<Response> {
  await requirePermission(PERMISSIONS.PRICING_EXPORT);

  const url = new URL(request.url);
  const rows = await listRecommendations({
    status: url.searchParams.get("status") ?? undefined,
    pricingRunId: url.searchParams.get("runId") ?? undefined,
    take: 5000,
  });
  type Row = (typeof rows)[number];

  const body = toCsv<Row>({
    headers: [
      { key: "store", label: "store", get: (r) => r.pricingRunItem.store.name },
      { key: "run_id", label: "run_id", get: (r) => r.pricingRunItem.pricingRun.id },
      { key: "sku", label: "sku", get: (r) => r.pricingRunItem.sku },
      {
        key: "product_name",
        label: "product_name",
        get: (r) => r.pricingRunItem.productName ?? "",
      },
      {
        key: "current_regular_price",
        label: "current_regular_price",
        get: (r) => money(r.oldRegularPrice),
      },
      {
        key: "current_sale_price",
        label: "current_sale_price",
        get: (r) => money(r.oldSalePrice),
      },
      {
        key: "current_effective_price",
        label: "current_effective_price",
        get: (r) => money(r.pricingRunItem.currentEffectivePrice),
      },
      { key: "cost_price", label: "cost_price", get: (r) => money(r.costPrice) },
      { key: "floor_price", label: "floor_price", get: (r) => money(r.floorPrice) },
      {
        key: "lowest_competitor_price",
        label: "lowest_competitor_price",
        get: (r) => money(r.lowestCompetitorPrice),
      },
      {
        key: "recommended_sale_price",
        label: "recommended_sale_price",
        get: (r) => money(r.recommendedSalePrice),
      },
      {
        key: "recommendation_type",
        label: "recommendation_type",
        get: (r) => r.recommendationType,
      },
      { key: "margin_before", label: "margin_before", get: (r) => ratio(r.marginBefore) },
      { key: "margin_after", label: "margin_after", get: (r) => ratio(r.marginAfter) },
      {
        key: "confidence",
        label: "confidence",
        get: (r) => ratio(r.pricingRunItem.confidence),
      },
      { key: "status", label: "status", get: (r) => r.status },
      { key: "reason", label: "reason", get: (r) => r.reason ?? "" },
      { key: "expires_at", label: "expires_at", get: (r) => r.expiresAt },
    ],
    rows,
  });

  return csvResponse("pricing-recommendations.csv", body);
}
