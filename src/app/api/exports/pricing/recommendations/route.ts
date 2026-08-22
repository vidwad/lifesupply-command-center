/**
 * DP-4 export of price recommendations.
 *
 * Read-only. Requires pricing.export and emits only rows already stored. Like
 * the DP-2 run export it is deliberately NOT gated on pricing.intelligence:
 * that flag gates creating and mutating pricing work, and tripping it must stop
 * new activity rather than withhold a queue someone may need to review
 * precisely because the flag was tripped. Exporting contacts nothing external.
 *
 * Emits proposals and, since DP-5, the internal decision recorded on each one.
 * It decides nothing itself and writes no price anywhere. An approved_by value
 * means a person accepted the proposal internally, NOT that a store price
 * changed — writeback is DP-6.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import { listRecommendations } from "@/server/services/pricing/recommendations";
import { writebackState } from "@/server/services/pricing/rollback-read";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const money = (value: unknown): string => (value == null ? "" : Number(value).toFixed(2));
const ratio = (value: unknown): string => (value == null ? "" : Number(value).toFixed(4));

/** The writeback log a row's status refers to: rolled back, else succeeded, else newest. */
function latestLog(row: {
  writebackLogs: {
    id: string;
    status: string;
    writtenAt: Date | null;
    rollbackAt: Date | null;
    rollbackPayload: unknown;
    writtenBy: { name: string | null; email: string | null } | null;
  }[];
}) {
  return (
    row.writebackLogs.find((log) => log.status === "rolled_back") ??
    row.writebackLogs.find((log) => log.status === "succeeded") ??
    row.writebackLogs[0] ??
    null
  );
}

/** The most recent rollback attempt's outcome or error, if any was recorded. */
function latestRollbackNote(row: Parameters<typeof latestLog>[0]): string | null {
  const log = latestLog(row);
  const payload = log?.rollbackPayload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const attempts = (payload as Record<string, unknown>).rollbackAttempts;
  if (!Array.isArray(attempts) || attempts.length === 0) return null;
  const last = attempts[attempts.length - 1] as Record<string, unknown>;
  const parts = [last.outcome, last.reason, last.errorMessage].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  return parts.length > 0 ? parts.join(": ") : null;
}

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
      // DP-5 decision columns. Identity is by email so a spreadsheet reader can
      // tell two people with the same display name apart.
      {
        key: "approved_by",
        label: "approved_by",
        get: (r) => r.approvedBy?.email ?? r.approvedBy?.name ?? "",
      },
      { key: "approved_at", label: "approved_at", get: (r) => r.approvedAt },
      {
        key: "rejected_by",
        label: "rejected_by",
        get: (r) => r.rejectedBy?.email ?? r.rejectedBy?.name ?? "",
      },
      { key: "rejected_at", label: "rejected_at", get: (r) => r.rejectedAt },
      { key: "rejection_reason", label: "rejection_reason", get: (r) => r.rejectionReason ?? "" },
      // DP-6/6B. Read from the writeback log, not inferred from the
      // recommendation status: a failed write leaves the row `approved`, and a
      // rolled-back one still reads `written_back`.
      {
        key: "writeback_status",
        label: "writeback_status",
        get: (r) => writebackState(r.writebackLogs),
      },
      { key: "writeback_log_id", label: "writeback_log_id", get: (r) => latestLog(r)?.id ?? "" },
      { key: "written_at", label: "written_at", get: (r) => latestLog(r)?.writtenAt ?? "" },
      {
        key: "written_by",
        label: "written_by",
        get: (r) => latestLog(r)?.writtenBy?.email ?? latestLog(r)?.writtenBy?.name ?? "",
      },
      { key: "rollback_at", label: "rollback_at", get: (r) => latestLog(r)?.rollbackAt ?? "" },
      {
        key: "rollback_status",
        label: "rollback_status",
        get: (r) => (latestLog(r)?.status === "rolled_back" ? "rolled_back" : ""),
      },
      {
        key: "rollback_reason_or_error",
        label: "rollback_reason_or_error",
        get: (r) => latestRollbackNote(r) ?? "",
      },
    ],
    rows,
  });

  return csvResponse("pricing-recommendations.csv", body);
}
