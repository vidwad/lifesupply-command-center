/**
 * DP-6C writeback operational export.
 *
 * Read-only. Requires pricing.export and emits only rows already stored plus
 * reconciliation observations already recorded in the audit log. It contacts
 * no external system — exporting is not the same as reconciling, and this
 * route deliberately cannot trigger a store read.
 *
 * Like the other pricing exports it is NOT gated on pricing.intelligence: that
 * flag gates creating and mutating pricing work, and an operator may need this
 * report precisely because something was tripped.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { csvResponse, toCsv } from "@/server/services/exports/csv";
import {
  latestReconciliations,
  listWritebackOperations,
} from "@/server/services/pricing/operations-read";
import { latestRollbackAttempt } from "@/server/services/pricing/reconciliation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const money = (value: unknown): string => (value == null ? "" : Number(value).toFixed(2));

/** The restored price, read from the rollback attempt that succeeded. */
function rollbackSalePrice(rollbackPayload: unknown): string {
  if (!rollbackPayload || typeof rollbackPayload !== "object" || Array.isArray(rollbackPayload)) {
    return "";
  }
  const attempts = (rollbackPayload as Record<string, unknown>).rollbackAttempts;
  if (!Array.isArray(attempts)) return "";
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    const attempt = attempts[i];
    if (!attempt || typeof attempt !== "object") continue;
    const record = attempt as Record<string, unknown>;
    if (record.outcome !== "rolled_back") continue;
    const value = Number(record.intendedRollbackSalePrice);
    return Number.isFinite(value) ? value.toFixed(2) : "";
  }
  return "";
}

export async function GET(): Promise<Response> {
  await requirePermission(PERMISSIONS.PRICING_EXPORT);

  const [rows, reconciliations] = await Promise.all([
    listWritebackOperations({ take: 5000 }),
    latestReconciliations(),
  ]);
  type Row = (typeof rows)[number];
  const obs = (r: Row) => reconciliations.get(r.id);

  const body = toCsv<Row>({
    headers: [
      { key: "store", label: "store", get: (r) => r.store.name },
      { key: "sku", label: "sku", get: (r) => r.recommendation?.pricingRunItem?.sku ?? "" },
      {
        key: "product_name",
        label: "product_name",
        get: (r) => r.recommendation?.pricingRunItem?.productName ?? "",
      },
      { key: "recommendation_id", label: "recommendation_id", get: (r) => r.recommendationId },
      { key: "writeback_log_id", label: "writeback_log_id", get: (r) => r.id },
      {
        key: "recommendation_status",
        label: "recommendation_status",
        get: (r) => r.recommendation?.status ?? "",
      },
      { key: "writeback_status", label: "writeback_status", get: (r) => r.status },
      { key: "rollback_at", label: "rollback_at", get: (r) => r.rollbackAt },
      {
        key: "written_by",
        label: "written_by",
        get: (r) => r.writtenBy?.email ?? r.writtenBy?.name ?? "",
      },
      { key: "written_at", label: "written_at", get: (r) => r.writtenAt },
      { key: "old_sale_price", label: "old_sale_price", get: (r) => money(r.oldSalePrice) },
      { key: "new_sale_price", label: "new_sale_price", get: (r) => money(r.newSalePrice) },
      {
        key: "rollback_sale_price",
        label: "rollback_sale_price",
        get: (r) => rollbackSalePrice(r.rollbackPayload),
      },
      {
        key: "current_reconciliation_status",
        label: "current_reconciliation_status",
        get: (r) => obs(r)?.status ?? "not_checked",
      },
      {
        key: "last_reconciled_at",
        label: "last_reconciled_at",
        get: (r) => obs(r)?.observedAt ?? "",
      },
      {
        key: "live_sale_price_observed",
        label: "live_sale_price_observed",
        get: (r) => money(obs(r)?.observedSalePrice),
      },
      { key: "mismatch_reason", label: "mismatch_reason", get: (r) => obs(r)?.reason ?? "" },
      {
        key: "error_message",
        label: "error_message",
        // The writeback's own error, else the last rollback attempt's.
        get: (r) => r.errorMessage ?? latestRollbackAttempt(r.rollbackPayload)?.errorMessage ?? "",
      },
      {
        key: "required_action",
        label: "required_action",
        get: (r) => obs(r)?.requiredAction ?? "",
      },
    ],
    rows,
  });

  return csvResponse("pricing-writebacks.csv", body);
}
