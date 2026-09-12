# 36 — Sales Intelligence Foundation

**Status:** read-only foundation, shipped. **Not** production-certified, and it certifies nothing about the Phase 11 launch gates.
**Date:** 2026-08-24
**Scope:** a reusable sales-statistics layer over data already in the Command Center, plus an inventory of what existed before it and a plan for the historical data that is still missing.

> **The headline finding, before anything else.** The Command Center holds **93,622 orders** but only **3,283 order line items**, covering **2.5%** of orders — and only **21** of those line items resolve to a product. Every per-product statistic in this document is computed correctly and describes **less than one percent of the business**. Nothing here is ready to drive Pricing Intelligence yet. §3 quantifies it; §6 is the plan to fix it.

---

## 1. Purpose

Pricing Intelligence, the Executive Dashboard, and the Analytics page each derive revenue and margin their own way. That is three definitions of "revenue" that can disagree on the same screen, and three places to fix when one is wrong.

This layer exists so that:

- **Pricing Intelligence** can rank candidates on the same numbers management sees.
- **Dashboards and reports** stop re-deriving totals per page.
- **A single place** defines what counts as a sale, what counts as cost, and what "we don't know" looks like.
- Future analytics has something to build on that is not another bespoke query.

It is deliberately **read-only**. It computes; it never imports, syncs, reprices, or writes.

---

## 2. What already existed

Answering the question the brief asked first — *what sales-statistics capability exists, and what is missing?*

### 2.1 Database models available

| Model | Rows in production | Use for sales analysis |
|---|---:|---|
| `Order` | 93,622 | Headers: date, status, store, division, `subtotal`, `grandTotal`. **Sound.** |
| `OrderItem` | 3,283 | Line items: sku, quantity, `unitPrice`, `unitCost`, `lineSubtotal`, `estimatedGrossProfit/Margin`, product + variant FKs. **Almost entirely absent.** |
| `Product` | 51,128 | Catalogue, `sourceId` mapping, `imageStatus`. Imported 2026-08-23. |
| `ProductVariant` | 50,709 | Price, sale price, `costPrice`, stock. **47 of 50,709 have a cost.** |
| `Customer` | 74,643 | Repeat/lifetime analysis. Real BigCommerce data. |
| `WebsiteMetric` | 60 | GA4 sessions/conversions. Thin. |
| `FinancialSummary` | 16 | Period-level revenue/COGS/profit. Used by the dashboard KPIs. |
| `FinancialTransaction` | — | QuickBooks-side detail; not used by this layer. |

### 2.2 Services that already calculate sales statistics

| Where | What it does | Limitation |
|---|---|---|
| `services/dashboard/index.ts` | Top 5 products by revenue (90d); low-margin products (< 35%, 90d) | Reports one revenue figure with **no refund deduction** — gross, called revenue (§7.1). Hardcoded 90-day window and 35% threshold, unrelated to the pricing floor. |
| `services/analytics/index.ts` | GA4 sessions, conversion, revenue by channel | Website metrics, not order-level product analysis. |
| `services/pricing/runs.ts` → `selectTopProducts()` | Ranks products from order history; variant → product → SKU fallback; most-recent-unit-cost inference with source recorded | Genuinely good, but **private to Pricing Intelligence** and shaped for run building, not reporting. |
| `services/financials/*` | Period KPIs from `FinancialSummary` | Period-level; cannot attribute to a product. |

**So: real capability existed, but scattered, silent about refunds, and not reusable.**

### 2.3 Import and sync paths

| Path | Creates order headers | Creates **line items** |
|---|:--:|:--:|
| BigCommerce API order sync (`sync-orders.ts`) | ✅ | ✅ via `/v2/orders/{id}/products` |
| BigCommerce **CSV** order import (`imports/bigcommerce.ts`) | ✅ | ❌ **none** |
| BigCommerce product / customer import | n/a | n/a |
| GA4 website metrics | n/a | n/a |
| QuickBooks financial imports | n/a | n/a |

The CSV importer contains **zero** references to `orderItem` — confirmed by grep, not inference. It is header-only and cannot backfill line items.

### 2.4 Known limitations, confirmed

1. **CSV order import is header-only.** A CSV backfill route would require building a new line-item importer.
2. **Line-item history is 2.5% complete**, and only from 2023-01-24 (LifeSupply) / 2026-03-07 (Wellmart), against orders reaching back to **2012**.
3. **Cost is effectively absent.** 47 of 50,709 variants and 27 of 3,283 line items carry a usable cost. No backfill fixes this — see §6.4.
4. **No generic sales-statistics engine existed.** This document adds one.

---

## 3. Data quality — the honest picture

Measured against production, 2026-08-24:

| Measure | Value |
|---|---|
| Orders | 93,622 (LifeSupply 92,572 · Wellmart 1,050) |
| Order date range | **2012-01-03 → 2026-08-05** |
| Order line items | **3,283** |
| Orders carrying ≥ 1 line item | **2,317 (2.5%)** |
| Line items matched to a product | **21 (0.6%)** |
| Line items with a usable cost | **27 (0.8%)** |
| Variants with a cost | **47 of 50,709 (0.1%)** |

**Why attribution failed.** `loadProductMaps()` matches a line item to a product using the catalogue *as it exists at sync time*. The order syncs ran on 2026-08-05; the product catalogue was not imported until **2026-08-23**. So the matching had nothing to match against. This is a sequencing accident, not a mapping defect — and re-running the order sync now should attribute those items correctly.

---

## 4. Data sources and tables used

**Reads only:** `Order`, `OrderItem`, `Product`, `ProductVariant`, `Store`, `PricingRule` (for the margin floor).

**Writes:** none. Enforced by `read-only.test.ts`, which scans the shipped source for Prisma mutations, raw execute paths, `fetch`, BigCommerce imports, credential access, and feature-flag calls.

---

## 5. Mode A — historical backfill

*Not implemented as an executable import. Planned, costed, and left for a person to trigger.*

`pnpm sales:backfill:plan` inspects the database and reports gaps, causes, cost, and the right source. It writes nothing and calls nothing. There is no `--apply`, because the backfill mechanism **already exists** — it is the BigCommerce order sync — and wrapping it in a new script would add a second way to do the same thing.

### 5.1 What a backfill must handle

| Requirement | Status |
|---|---|
| Historical order headers | ✅ already synced back to 2012 |
| Historical **line items** | ❌ the gap — 91,305 orders missing |
| Product and variant mapping | ✅ exists; will now succeed given the imported catalogue |
| Customer mapping | ✅ 74,586 BigCommerce customers linked |
| Cost / margin enrichment | ⚠️ mechanism exists, **source data does not** (§6.4) |
| Import logs | ✅ `IntegrationSyncLog` per run |
| Error handling | ✅ per-order item failures isolated; run continues |
| Duplicate detection | ✅ `sourceSystem` + `sourceId` upsert; re-running is safe |
| Date-range backfill | ⚠️ `sinceIso` supports incremental; no explicit from/to window |
| Reconciliation to source totals | ⚠️ order-level reconciliation exists; no line-item reconciliation |

### 5.2 Cost of the backfill

91,305 orders × one `/v2/orders/{id}/products` call ≈ **91,305 API calls**, roughly **6.3 hours** at a conservative 4 calls/sec.

### 5.3 Recommended sequence

1. Re-run the **product** sync first (needed anyway for `F-13` image status) so the catalogue is complete and current.
2. Re-run the **order** sync with line items enabled, one store at a time.
3. Re-run `pnpm sales:backfill:plan` and confirm coverage and attribution actually moved.
4. Only then treat per-product statistics as meaningful.

### 5.4 Reconciliation approach

- **Order count and revenue** per store per month, Command Center vs BigCommerce.
- **Line-item subtotal vs order subtotal** per order — a systematic gap indicates missing lines.
- **Order revenue vs QuickBooks** per period, at summary level only; QuickBooks stays the accounting source of truth per `CLAUDE.md` §12.

---

## 6. Mode B — database analysis

Implemented in `src/server/services/sales-intelligence/`.

| Function | Returns |
|---|---|
| `getSalesOverview(range, scope)` | **Gross Sales → Refunds → Net Sales**, refund rate, AOV, units, gross profit, margin, cancelled-order value, **plus line-item and cost coverage** |
| `getProductSalesStats(range, scope, options)` | Per-product units, revenue, profit, margin, velocity, margin opportunity, cost coverage |
| `getTopProductsByRevenue` / `ByUnits` | Ranked slices |
| `getLowMarginProducts(range, scope)` | Products below the **pricing floor** margin, costed only |
| `getMarginOpportunityProducts(range, scope)` | Largest revenue shortfall against the floor |
| `getProductTrend(productId, range)` | Month-by-month units, revenue, profit |
| `getSalesDataReadiness(scope)` | The blunt verdict — see §8 |

### 6.1 Coverage is returned, not assumed

`getSalesOverview` returns `lineItemCoverage` and `costCoverage` alongside the figures. A caller showing "£X revenue" from 2.5% of orders without showing that ratio is misrepresenting the data, and the service makes it awkward to do so accidentally.

### 6.2 Use cases — Pricing Intelligence

- Candidate ranking by revenue, units, or margin opportunity.
- Low-margin identification against the **rule's own floor**, not an unrelated threshold.
- Velocity as a risk signal — a fast mover deserves more caution when repricing.
- `getSalesDataReadiness()` as a precondition check before a pricing run is trusted.

### 6.3 Use cases — management reporting

Store and division summaries, trend over any range, top products, margin opportunity totals, and AOV.

### 6.4 The limit no backfill lifts

Backfilling orders recovers **units and revenue**. It does **not** recover **cost**. BigCommerce carries almost no `cost_price` (47 of 50,709 variants), so gross profit and margin remain unknown for nearly every product no matter how many orders are imported.

Margin analysis needs a cost source — supplier price lists, QuickBooks COGS, or the Pricing Intelligence CSV upload path. That is a separate product decision and is the **real** blocker for margin-driven pricing, not the order backfill.

---

## 7. Policy decisions, and why

### 7.1 Refunds are included in Gross Sales and deducted to reach Net — `DEC-SI-01`

**Decision (product owner, 2026-08-24):** *"Refunds should be included in sales but shown separately as a deduction to produce Net Sales."*

```
    Gross Sales          20,463,182.16
      less Refunds       (2,572,457.46)
    ─────────────────────────────────
    = Net Sales          17,890,724.70      refund rate 12.57%
```

A refunded order **is** a sale — it happened and was billed — and the refund reverses it. So it belongs in gross, with the reversal shown as its own line.

**Cancelled orders are different in kind** and stay out of gross entirely. A cancelled order never became a sale, so there is nothing to reverse and nothing to deduct. Including it would not be a presentation choice, it would be wrong — see §7.6 for why it would also be catastrophic here.

`getSalesOverview()` returns `grossSales`, `refunds`, `netSales`, `refundRate`, and `cancelled` separately. The old `revenue` field is retained as a deprecated alias for `grossSales`, so nothing silently changes meaning.

#### How the refund amount is established — and why 98% of it is inferred

`Order.refundedTotal` is the right field and supports partial refunds. In production it is populated on only **196 of 9,376** refunded orders.

| Source | Value | Orders |
|---|---:|---:|
| **Recorded** — `refundedTotal > 0`, trusted whatever the status | $46,882.03 | 221 |
| **Inferred** — `refunded` status, no recorded amount → full order value | $2,525,575.43 | 9,153 |
| **Unquantified** — known partial, amount never recorded | *excluded* | 27 |
| **Total deducted** | **$2,572,457.46** | |

**Only 1.8% of the deduction is measured.** The rest is inferred from status because the amount was never captured. `RefundBreakdown.confidence` reports this, and any UI showing the refund line should show it too: a deduction that is 98% estimated is a materially different claim from one that is 98% measured, and the number alone cannot tell them apart.

Believing `refundedTotal` alone would report **$46,882** of refunds against **$2.59M** of refunded orders — a 55× understatement, and a net sales figure overstated by $2.5M.

**Unquantified partials** are counted but never valued. Inferring a full refund for an order known to be *partially* refunded would overstate it — 27 production orders, up to $17,366 of order value. Both guessing high and silently treating it as zero would be wrong, so the count is surfaced as a stated limit: the refund total is an understatement of known size.

#### Two data-quality findings this exposed

1. **`refundedTotal` is barely synced.** 9,180 orders assert a refund with a recorded amount of zero. Worth fixing at the sync, after which the inference disappears and confidence rises toward 100%.
2. **Order status and payment status disagree on ~5,000 orders.** 3,327 have `status = refunded` with a payment status that is neither refunded nor partially refunded (3,274 of them say `paid`); 1,756 have a refunded payment status without a refunded order status. This layer trusts order status as the business-level signal, but the disagreement is unexplained and worth investigating.

#### Still outstanding: the Executive Dashboard

The dashboard excludes only `cancelled` and reports a single revenue figure with **no refund deduction at all** — so it shows gross while calling it revenue. That is now inconsistent with this layer, which is explicit about which is which.

Not changed here. Altering a headline figure management may have been reading for months is a product-owner decision. **Recommended follow-up: migrate the dashboard onto `getSalesOverview()` so both show the same gross → refunds → net.**

### 7.2 A zero cost means unknown, never free

`positiveOrNull()` requires a strictly positive value. This matches `positive()` in the pricing engine and the upload parser's *"treats a zero cost as absent, never as a zero floor"* — and avoids the trap that produced a fabricated 100% margin across 50,024 variants (`docs/35` F-16).

Consequence: gross profit and margin are `null`, not `0`, when cost is unknown. **A missing margin and a zero margin are different facts.**

### 7.3 Margin opportunity is derived from the pricing rule

Target margin = `(m − 1) / m` where `m` is the enabled rule's `minCostMultiplier` — the same multiplier `floorPrice()` uses. At the shipped 1.40 default that is 28.57%. Deriving rather than hardcoding is what keeps "low margin" here and "below floor" there describing the same thing. With no enabled rule, opportunity is `null` rather than assuming a default.

### 7.4 Unattributed line items are excluded, not guessed

A line item with no `productId` is omitted from per-product statistics. Attributing by SKU string would silently mis-state revenue. The readiness report counts what this excludes.

### 7.5 Per-product figures are GROSS — there is no per-product net

`OrderItem` carries **no refund column**. Refunds are recorded only at order level, so a refund cannot be attributed to the line it reversed.

Splitting an order-level refund pro-rata across its lines would invent per-product detail the source system never captured — and a partial refund is rarely pro-rata anyway: it is usually one returned item out of several.

So a product's revenue in `getProductSalesStats()` **includes sales later refunded**. Read product rankings as *"what sold"*, not *"what was kept"*, and use `getSalesOverview()` for the gross → refunds → net picture.

### 7.6 Cancelled orders contain junk that would swamp every figure

Production holds two cancelled orders from 2021-11-08 valued at **$25,298,900** and **$22,999,000**, against a non-cancelled maximum of **$65,930**.

Those two alone are $48.3M of the $52.8M cancelled total. The whole cancelled population is 3,415 orders averaging $15,454 — versus $227 for everything else.

This is a second, independent reason to keep cancelled out of Gross Sales: quite apart from the accounting principle, including them would more than triple reported sales on the strength of two bad records. `getSalesOverview()` reports `cancelled.orderCount` and `cancelled.value` separately so the population stays visible rather than merely absent.

**Follow-up:** those two orders should be investigated. They look like test data or a data-entry error, and they are still sitting in the production database.

### 7.7 Opportunity is scaled to costed revenue only

Extrapolating a known margin across uncosted lines would invent a number. Opportunity is computed on the costed portion, and `costCoverage` says how much of the product that is.

---

## 8. Readiness report

`getSalesDataReadiness()` answers: **"do we have enough historical sales data to run pricing analytics?"**

Verdicts: `ready` · `partial` · `insufficient`. Thresholds: `MIN_RANKABLE_PRODUCTS = 50`, `MIN_LINE_ITEM_COVERAGE = 0.8`.

**Today production returns `insufficient`**, with blockers naming the 2.5% coverage, 21 attributable line items, and near-total absence of cost.

Every other function will happily return a confident-looking number from three line items. This is the one that says so.

---

## 9. What is deliberately not here

- **No UI.** Service and tests only, per the brief.
- **No import or backfill execution.** Planning only.
- **No dashboard rewiring.** The dashboard's refund treatment (§7.1) is flagged, not changed.
- **No new schema.** No migration.
- **No caching or materialised aggregates.** Add when a real query proves too slow, not before.

---

## 10. Future work

1. **Resolve §7.1** — decide whether refunds count, then make dashboard and this layer agree.
2. **Re-run the order sync** to attribute the existing 3,283 line items.
3. **Backfill line items** for the remaining 91,305 orders.
4. **Choose a cost source** — the actual blocker for margin analysis.
5. **Migrate dashboard and Pricing Intelligence** onto this layer so one definition serves all.
6. **Line-item reconciliation** against BigCommerce order totals.
7. **Denormalised per-product aggregates** if reporting queries become slow.

---

## 11. Relationship to Phase 11

This adds a read-only reporting capability. It **does not**:

- change any launch gate in `docs/20` §5,
- enable any feature flag,
- write to any source-of-truth system,
- constitute a claim of production readiness.

It does widen the surface area that Phase 11C/11D/11E evidence must cover, per `BLK-09`.
