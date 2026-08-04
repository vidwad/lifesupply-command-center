/**
 * BC ↔ Command Center reconciliation runner (Phase 3E — docs/19).
 *
 * For one store, compares Command Center totals against BigCommerce source
 * totals and writes a ReconciliationReport. Two tiers of metrics:
 *
 *   LIFETIME COUNTS (3 cheap API calls — count endpoints / pagination meta):
 *     customers (registered), orders, products
 *
 *   DATE-RANGE DETAIL (one bounded /v2/orders header walk over the range):
 *     order count, revenue (total_inc_tax), refunds (refunded_amount),
 *     item units (items_total) — vs the CC sums for the same range.
 *
 *   INFORMATIONAL (CC-only, no BC total to compare):
 *     guest customers
 *
 * Material discrepancies (see reconciliation-evaluator) additionally raise
 * Exception rows keyed by `reconciliation:<storeId>:<metric>` so recurring
 * gaps group instead of flooding, per docs/19: reconciliation must identify
 * gaps instead of hiding them.
 */
import { prisma } from "@/server/db/client";
import { createException } from "@/server/services/exceptions";

import { GUEST_SOURCE_SYSTEM } from "./guest-customer";
import {
  evaluateReconciliation,
  type MetricInput,
  type MetricRow,
} from "./reconciliation-evaluator";

const SOURCE_SYSTEM = "bigcommerce";
const PAGE_SIZE = 250;
const HARD_CAP_ORDERS = 500_000;

export type RunReconciliationInput = {
  storeRoot: string;
  apiToken: string;
  storeId: string;
  /** Inclusive range for the date-scoped metrics. */
  rangeStart: Date;
  rangeEnd: Date;
  triggeredById?: string;
};

export type ReconciliationResult = {
  reportId: string;
  status: "ok" | "discrepancies";
  discrepancyCount: number;
  exceptionsCreated: number;
  rows: MetricRow[];
};

async function bcFetch(
  url: string,
  apiToken: string,
): Promise<
  | { ok: true; status: number; body: string }
  | { ok: false; status: number | "network"; body: string }
> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { "X-Auth-Token": apiToken, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    return { ok: false, status: "network", body: err instanceof Error ? err.message : "network" };
  }
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body: body.slice(0, 200) };
  return { ok: true, status: res.status, body };
}

/** Total from a /v3 list endpoint's meta.pagination.total (limit=1 call). */
async function fetchV3Total(
  storeRoot: string,
  apiToken: string,
  path: string,
): Promise<number | null> {
  const sep = path.includes("?") ? "&" : "?";
  const r = await bcFetch(`${storeRoot}${path}${sep}limit=1`, apiToken);
  if (!r.ok) return null;
  try {
    const parsed = JSON.parse(r.body) as { meta?: { pagination?: { total?: number } } };
    const total = parsed.meta?.pagination?.total;
    return typeof total === "number" ? total : null;
  } catch {
    return null;
  }
}

/** Total from the /v2/orders/count endpoint ({ count }). */
async function fetchOrdersCount(
  storeRoot: string,
  apiToken: string,
  query = "",
): Promise<number | null> {
  const r = await bcFetch(`${storeRoot}/v2/orders/count${query}`, apiToken);
  if (!r.ok) return null;
  try {
    const parsed = JSON.parse(r.body) as { count?: number };
    return typeof parsed.count === "number" ? parsed.count : null;
  } catch {
    return null;
  }
}

type BcRangeTotals = { count: number; revenue: number; refunds: number; itemUnits: number };

/** Walk /v2/orders headers over the date range, summing reporting totals. */
async function fetchBcRangeTotals(
  storeRoot: string,
  apiToken: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<BcRangeTotals | null> {
  const totals: BcRangeTotals = { count: 0, revenue: 0, refunds: 0, itemUnits: 0 };
  const range =
    `&min_date_created=${encodeURIComponent(rangeStart.toISOString())}` +
    `&max_date_created=${encodeURIComponent(rangeEnd.toISOString())}`;

  type BcOrderHeader = {
    total_inc_tax?: string | number;
    refunded_amount?: string | number;
    items_total?: number;
  };

  let page = 1;
  while (totals.count < HARD_CAP_ORDERS) {
    const url = `${storeRoot}/v2/orders?limit=${PAGE_SIZE}&page=${page}${range}`;
    const r = await bcFetch(url, apiToken);
    if (!r.ok) {
      if (r.status === 404) break; // past last page / empty range
      return null; // range totals unavailable — report as informational
    }
    if (r.status === 204 || r.body.trim() === "") break;
    let orders: BcOrderHeader[];
    try {
      orders = JSON.parse(r.body) as BcOrderHeader[];
    } catch {
      break;
    }
    if (!Array.isArray(orders) || orders.length === 0) break;
    for (const o of orders) {
      totals.count++;
      totals.revenue += Number(o.total_inc_tax) || 0;
      totals.refunds += Number(o.refunded_amount) || 0;
      totals.itemUnits += typeof o.items_total === "number" ? o.items_total : 0;
    }
    if (orders.length < PAGE_SIZE) break;
    page++;
  }
  return totals;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export async function runBigCommerceReconciliation(
  input: RunReconciliationInput,
): Promise<ReconciliationResult> {
  const { storeRoot, apiToken, storeId, rangeStart, rangeEnd } = input;

  // ---- BC-side totals ----
  const [bcCustomers, bcProducts, bcOrdersLifetime, bcRange] = await Promise.all([
    fetchV3Total(storeRoot, apiToken, "/v3/customers"),
    fetchV3Total(storeRoot, apiToken, "/v3/catalog/products"),
    fetchOrdersCount(storeRoot, apiToken),
    fetchBcRangeTotals(storeRoot, apiToken, rangeStart, rangeEnd),
  ]);

  // ---- CC-side totals ----
  const rangeWhere = { storeId, orderDate: { gte: rangeStart, lte: rangeEnd } };
  const [ccCustomers, ccGuests, ccProducts, ccOrdersLifetime, ccRangeAgg, ccItemUnits] =
    await Promise.all([
      prisma.customer.count({ where: { storeId, sourceSystem: SOURCE_SYSTEM } }),
      prisma.customer.count({ where: { storeId, sourceSystem: GUEST_SOURCE_SYSTEM } }),
      prisma.product.count({ where: { storeId, sourceSystem: SOURCE_SYSTEM } }),
      prisma.order.count({ where: { storeId, sourceSystem: SOURCE_SYSTEM } }),
      prisma.order.aggregate({
        where: { ...rangeWhere, sourceSystem: SOURCE_SYSTEM },
        _count: { id: true },
        _sum: { grandTotal: true, refundedTotal: true },
      }),
      prisma.orderItem.aggregate({
        where: { sourceSystem: SOURCE_SYSTEM, order: rangeWhere },
        _sum: { quantity: true },
      }),
    ]);

  const inputs: MetricInput[] = [
    {
      metric: "customers.lifetime.count",
      label: "Registered customers (lifetime)",
      kind: "count",
      ccValue: ccCustomers,
      bcValue: bcCustomers,
    },
    {
      metric: "customers.guests.count",
      label: "Guest customers (CC-only)",
      kind: "count",
      ccValue: ccGuests,
      bcValue: null,
      note: "Guests are derived from order billing emails; BigCommerce has no comparable total.",
    },
    {
      metric: "products.lifetime.count",
      label: "Products (lifetime)",
      kind: "count",
      ccValue: ccProducts,
      bcValue: bcProducts,
    },
    {
      metric: "orders.lifetime.count",
      label: "Orders (lifetime)",
      kind: "count",
      ccValue: ccOrdersLifetime,
      bcValue: bcOrdersLifetime,
    },
    {
      metric: "orders.range.count",
      label: "Orders (range)",
      kind: "count",
      ccValue: ccRangeAgg._count.id,
      bcValue: bcRange?.count ?? null,
    },
    {
      metric: "orders.range.revenue",
      label: "Revenue (range)",
      kind: "money",
      ccValue: round2(Number(ccRangeAgg._sum.grandTotal ?? 0)),
      bcValue: bcRange ? round2(bcRange.revenue) : null,
    },
    {
      metric: "orders.range.refunds",
      label: "Refunds (range)",
      kind: "money",
      ccValue: round2(Number(ccRangeAgg._sum.refundedTotal ?? 0)),
      bcValue: bcRange ? round2(bcRange.refunds) : null,
    },
    {
      metric: "order_items.range.units",
      label: "Order item units (range)",
      kind: "count",
      ccValue: ccItemUnits._sum.quantity ?? 0,
      bcValue: bcRange?.itemUnits ?? null,
    },
  ];

  const { rows, discrepancyCount, status } = evaluateReconciliation(inputs);

  const report = await prisma.reconciliationReport.create({
    data: {
      storeId,
      triggeredById: input.triggeredById ?? null,
      rangeStart,
      rangeEnd,
      status,
      metrics: rows as object[],
      discrepancyCount,
    },
  });

  // Exceptions for material gaps — grouped by a stable recurring key.
  let exceptionsCreated = 0;
  for (const row of rows) {
    if (!row.material) continue;
    await createException(
      {
        exceptionType: "integration_sync",
        severity: "high",
        title: `Reconciliation gap: ${row.label}`,
        description:
          `Command Center has ${row.ccValue.toLocaleString()} vs BigCommerce ` +
          `${row.bcValue?.toLocaleString()} (delta ${row.delta?.toLocaleString()}, ` +
          `${((row.deltaPct ?? 0) * 100).toFixed(2)}%). Report ${report.id}.`,
        entityType: "store",
        entityId: storeId,
        recurringKey: `reconciliation:${storeId}:${row.metric}`,
        source: "reconciliation",
        metadata: { reportId: report.id, ...row },
      },
      input.triggeredById ? { id: input.triggeredById } : undefined,
    );
    exceptionsCreated++;
  }

  return { reportId: report.id, status, discrepancyCount, exceptionsCreated, rows };
}
