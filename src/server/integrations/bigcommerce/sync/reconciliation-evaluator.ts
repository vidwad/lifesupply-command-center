/**
 * Pure evaluation logic for BC ↔ Command Center reconciliation (Phase 3E —
 * docs/19). No I/O: given raw metric pairs, produce delta rows and decide
 * which discrepancies are MATERIAL (worth an Exception) vs noise.
 *
 * Materiality: a discrepancy is material only when BOTH the absolute delta
 * exceeds a floor AND the relative delta exceeds a percentage threshold.
 * Rationale: counts drift by a handful of rows mid-sync (BC totals move while
 * we walk), and tiny percentages on huge bases are noise — requiring both
 * keeps the signal honest. Tolerances are constants here so they're easy to
 * tune and are pinned by unit tests.
 *
 * Metrics with no BC-side value (bcValue null) are informational — never
 * material.
 */

export type MetricKind = "count" | "money";

export type MetricInput = {
  /** Stable metric key, e.g. "orders.range.count". */
  metric: string;
  /** Human label for reports, e.g. "Orders (range)". */
  label: string;
  kind: MetricKind;
  ccValue: number;
  /** Null when BigCommerce offers no comparable total (informational row). */
  bcValue: number | null;
  /** Optional context shown in the report row. */
  note?: string;
};

export type MetricRow = MetricInput & {
  /** cc − bc; null for informational rows. */
  delta: number | null;
  /** |delta| / max(|bc|, 1); null for informational rows. */
  deltaPct: number | null;
  material: boolean;
};

export const TOLERANCES: Record<MetricKind, { absFloor: number; pctFloor: number }> = {
  // Counts: ignore gaps under 3 rows or under 0.5% of the BC total.
  count: { absFloor: 3, pctFloor: 0.005 },
  // Money: ignore gaps under $25 or under 0.5% of the BC total.
  money: { absFloor: 25, pctFloor: 0.005 },
};

export function evaluateMetric(input: MetricInput): MetricRow {
  if (input.bcValue == null) {
    return { ...input, delta: null, deltaPct: null, material: false };
  }
  const delta = input.ccValue - input.bcValue;
  const deltaPct = Math.abs(delta) / Math.max(Math.abs(input.bcValue), 1);
  const tol = TOLERANCES[input.kind];
  const material = Math.abs(delta) >= tol.absFloor && deltaPct >= tol.pctFloor;
  return { ...input, delta, deltaPct, material };
}

export function evaluateReconciliation(inputs: MetricInput[]): {
  rows: MetricRow[];
  discrepancyCount: number;
  status: "ok" | "discrepancies";
} {
  const rows = inputs.map(evaluateMetric);
  const discrepancyCount = rows.filter((r) => r.material).length;
  return { rows, discrepancyCount, status: discrepancyCount > 0 ? "discrepancies" : "ok" };
}
