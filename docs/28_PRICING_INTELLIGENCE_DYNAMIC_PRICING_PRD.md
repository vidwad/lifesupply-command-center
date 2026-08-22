# LifeSupply Command Center — Pricing Intelligence / Dynamic Pricing PRD

**Prepared:** August 19, 2026  
**Repository:** `vidwad/lifesupply-command-center`  
**Status:** Product-owner-approved feature design and implementation instruction document  
**Scope:** Guarded pricing intelligence, competitor price monitoring, recommendation workflow, and approval-gated BigCommerce pricing updates  
**Initial implementation branch:** `claude/dp-01-pricing-foundation`  
**Initial implementation PR title:** `Pricing Intelligence foundation: competitors, rules, runs, recommendations, guardrails`

---

## 1. Executive Summary

LifeSupply should add a guarded **Pricing Intelligence** module to the Command Center to monitor competitor pricing, protect margin, and optimize sale pricing for high-volume products across connected BigCommerce stores.

The product owner wants the system to support two product-selection methods:

1. User uploads a product list.
2. User selects the top 1,500 purchased products from a specific connected BigCommerce store.

The system should then cycle through approximately **300 products per day**, compare each selected product against up to **five configured competitor online stores**, and recommend sale-price changes that keep LifeSupply cheaper than competitors whenever possible, subject to a strict minimum margin floor.

Default pricing rule:

```text
Minimum floor price = 140% of cost price
```

This means no recommendation may set a sale price below:

```text
cost_price * 1.40
```

If LifeSupply is not currently the cheapest, the system should recommend a lower sale price only when the resulting price remains above the floor. If LifeSupply is already the cheapest and there is room to increase the sale price while remaining cheaper than competitors, the system should recommend an increase that improves margin without losing the "best price" position.

This feature must be built as a **guarded intelligence and approval system**, not as an uncontrolled autonomous repricing bot.

---

## 2. Strategic Objective

The purpose of Pricing Intelligence is to create a disciplined margin and competitiveness engine for LifeSupply.

The module should help management:

- Protect gross margin.
- Avoid unnecessary underpricing.
- Recover margin where LifeSupply is already meaningfully cheaper than competitors.
- Identify products where LifeSupply cannot compete without violating margin-floor rules.
- Identify missing or unreliable cost data.
- Monitor competitor price movements.
- Prioritize the highest-impact products first.
- Create auditable recommendations before any price is changed.
- Maintain a safe approval process before BigCommerce writebacks.

The goal is not simply to be the lowest price at any cost. The goal is:

```text
Lowest defensible market price + protected gross margin + auditable approval workflow
```

---

## 3. Current Codebase Fit

The current Command Center already contains several foundations that make this feature practical:

- `ProductVariant` stores `price`, `salePrice`, and `costPrice`.
- `SupplierProduct` stores supplier cost and supplier SKU mapping.
- `OrderItem` exists and can be used to rank top purchased products by units, revenue, or gross profit.
- Connected stores already exist through the `Store` and `IntegrationConnection` models.
- Feature flags already exist for dangerous external actions.
- Permissions already exist for product updates and BigCommerce approval-style workflows.
- Audit logging and approval patterns already exist.
- Inngest worker infrastructure already exists for scheduled/background work.

This feature should extend those foundations rather than inventing a separate pricing system.

---

## 4. Non-Negotiable Guardrails

Pricing Intelligence must follow these rules:

1. **Read-only first.** The first implementation must collect competitor data and create recommendations only.
2. **No autonomous BigCommerce price changes in the first implementation.**
3. **No price below the floor.** Default floor is `cost * 1.40` unless a stricter store/product rule applies.
4. **No recommendation if cost is missing.** Missing cost creates a blocked item requiring data cleanup.
5. **No recommendation if competitor match confidence is low.** Low confidence means review required.
6. **No recommendation if competitor evidence is stale.** Evidence freshness must be tracked.
7. **No recommendation based on out-of-stock competitor listings unless explicitly allowed.**
8. **No recommendation for locked products.** Product-level and run-level locks must be respected.
9. **No price writeback without permission, approval, feature flag, and audit log.**
10. **No bypassing competitor access controls.** Do not bypass CAPTCHAs, authentication, bot protections, paywalls, or technical restrictions.
11. **Respect competitor terms and rate limits.** Each competitor setup must include a terms-review status.
12. **Every observation must preserve evidence.** Store URL, observed price, currency, confidence, timestamp, and extraction method.
13. **Every recommendation must preserve the calculation.** Store cost, floor, competitor prices, current price, recommended price, expected margin, and reason.
14. **Every writeback must be reversible.** Store old price, new price, BigCommerce response, actor, approval, and rollback instructions.
15. **Feature flags must default off.** Especially pricing writebacks.

---

## 5. Feature Flags

Add the following feature flags:

```text
pricing.intelligence
pricing.writebacks
```

Recommended behavior:

- `pricing.intelligence` enables the Pricing Intelligence module and read-only recommendation workflows.
- `pricing.writebacks` enables approval-gated BigCommerce price updates.
- `pricing.writebacks` must default to OFF.
- `pricing.writebacks` must also require the existing `external.writebacks` flag to be ON before any BigCommerce update can occur.

Writeback execution must require all of the following:

```text
pricing.intelligence = ON
pricing.writebacks = ON
external.writebacks = ON
user has pricing.writeback_bigcommerce permission
recommendation is approved
competitor evidence is fresh
audit log entry is created
```

---

## 6. Permissions

Add dedicated pricing permissions rather than overloading general product permissions:

```text
pricing.view
pricing.manage_rules
pricing.manage_competitors
pricing.create_runs
pricing.run_checks
pricing.review_recommendations
pricing.approve_recommendations
pricing.writeback_bigcommerce
pricing.export
```

Suggested access model:

- Management / Admin: all permissions.
- Product Manager: view, manage rules, manage competitors, create runs, run checks, review recommendations.
- Pricing Approver: review and approve recommendations.
- Operations: view only, if required.
- Finance: view and export, especially margin/floor reports.
- AI Agent / Worker: no direct permission; server-side service functions must still enforce flags, statuses, and approvals.

---

## 7. Product Selection Requirements

The system must allow two ways to build a pricing run.

### 7.1 Uploaded Product List

Supported formats:

- CSV
- XLSX, if existing spreadsheet handling supports it; otherwise CSV first.

Minimum upload fields:

```text
store_identifier
sku
product_id_optional
variant_id_optional
product_name_optional
current_price_optional
current_sale_price_optional
cost_price_optional
competitor_url_1_optional
competitor_url_2_optional
competitor_url_3_optional
competitor_url_4_optional
competitor_url_5_optional
price_lock_optional
notes_optional
```

Mapping priority:

1. ProductVariant by store + source ID.
2. ProductVariant by SKU + store.
3. Product by source ID.
4. Product by SKU.
5. Manual review if no confident match.

Upload should create a draft `PricingRun` and `PricingRunItem` records. The run should not start until the user previews and confirms the mapped product list.

### 7.2 Top 1,500 Purchased Products

The user should be able to create a pricing run from synced BigCommerce data.

Inputs:

```text
store
ranking_basis: units | revenue | gross_profit | order_count
lookback_window: 30d | 90d | 180d | 365d | all_time
limit: default 1500
include_inactive: false by default
include_out_of_stock: false by default
exclude_locked: true by default
```

Recommended ranking should use `OrderItem` grouped by product variant where possible, falling back to product/SKU when variant linkage is missing.

The run should snapshot the selected items at creation time so later changes to order data do not change the target list mid-run.

---

## 7.3 DP-2 implementation notes and deferrals

Recorded 2026-08-21 during the DP-2A corrective pass, so the PRD matches what is
actually built.

**CSV only.** DP-2 accepts CSV uploads. XLSX is **deferred** — it needs a parser
dependency and a sheet-selection UI, and every source an operator has can export
CSV. Tracked as **DP-2C**. UI copy states this at the point of upload.

**Preview before create.** Implemented as a two-phase submit: the first submit
validates, selects, and returns a preview showing totals, blocked counts by
reason, duplicate SKUs, and a sample of rows with blocked ones first. Nothing is
written until a second submit carries `confirm=1`. For uploads, the parsed CSV
text is echoed through the confirm submit because a `File` cannot survive the
round trip; uploads are capped at 1 MB, well above a 1,500-row list.

**Input bounds.** `rankingBasis`, `lookbackWindow`, and `targetCount` are
validated against allow-lists server-side. `targetCount` is capped at **1,500**
— the PRD target size. The cap exists because target count drives how many
products a later phase will fetch competitor prices for, and an accidental
150,000 would commit the operation to a workload nobody sized. Raising it is a
product-owner decision, not a form input.

**Cost provenance.** When a cost is inferred from order history rather than the
catalogue, the run item records `costSource = "order_history"` plus the source
order-item id and order date in `metadata.costSourceRef`, so an auditor can see
which line the figure came from and how stale it is. Order lines are queried
newest-first so "most recent" is literally true.

**Uploaded metadata.** Fields with no column of their own — upload row number,
competitor URL, supplier SKU, notes, store, unmatched product/variant ids, and
parse errors — are preserved in `PricingRunItem.metadata.upload`. DP-2 creates
**no** `ProductCompetitorUrl` records; a supplied competitor URL is retained as
evidence for DP-3 to act on.

**Feature-flag posture.** `pricing.intelligence` gates **creation and
mutation**. Existing runs remain readable and exportable on permission alone
(`pricing.view` / `pricing.export`). Tripping the flag — or the global kill
switch — must stop new activity, not hide the blocked-row fix-list an operator
may need precisely because it was tripped. Reading or exporting a stored run
contacts nothing external.

**Deferred to DP-2C:** XLSX upload support.

---

## 7.4 DP-4 implementation notes and deviations

Recorded 2026-08-21 during the DP-4 build, so the PRD matches what is actually
built. Each item below is a place where the written DP-4 instruction met a
schema or product constraint; none of them relaxes a launch gate.

**Blocked outcomes do not create `PriceRecommendation` rows.**
`recommendedSalePrice` is a non-nullable `Decimal` column. Storing a blocked
outcome would therefore mean inventing a price that a reviewer could later act
on, and storing the floor or the current price would make a block look like a
proposal. Blocked outcomes are recorded on the `PricingRunItem`
(`recommendationType`, plus the reason under `metadata.recommendation`) and
counted in the grouped generation audit. Management can still see why a
recommendation was not created; there is simply no fabricated price attached to
it. Adding a nullable price column, or a separate outcome table, would let
blocked rows join the queue — tracked as **DP-4A** if wanted.

**`manual_review` absorbs the missing-floor case.** The DP-4 type list has no
`blocked_missing_floor`. When no floor is stored and none can be derived, the
engine returns `manual_review` naming the floor as the missing input. When a
floor is absent but a cost and multiplier exist, the engine derives one and says
so in the reason, as the fallback rule requires.

**`maxDecreasePct` annotates rather than blocks.** DP-4's decrease rule is
explicit: a target at or above the floor becomes a `reduce`. An earlier draft of
this engine blocked cuts beyond `maxDecreasePct`, which withheld exactly the
rows a reviewer most needs to see and contradicted the written rule. A large cut
now produces a normal `reduce` whose reason carries a `NOTE:` that the drop
exceeds the guideline. The floor remains the hard rail, and every row requires
approval regardless.

**Currency screening is largely inert until a currency is stored.** There is no
`Store.currency` column, so the run currency is read from
`PricingRun.metadata.currency` and is normally null, which makes the per-
observation currency check unable to fire. To cover the unsafe case that needs
no known base, the engine refuses outright — `manual_review` — when the usable
observations for one item quote more than one currency. A single observation in
the wrong currency is still not detectable. Adding `Store.currency` closes this
and is the recommended fix.

**Generation is synchronous, not an Inngest job.** DP-3 needed a worker because
it made rate-limited outbound requests. DP-4 contacts nothing and is bounded
arithmetic over rows already in the database, so a background worker would add
failure modes without buying anything. The pass is capped at
`MAX_ITEMS_PER_GENERATION` (2000), matching DP-2's list ceiling.

**Confidence is the driving observation's, not a blend.** The proposal is
derived from the single cheapest usable observation, so the confidence reported
is that observation's. A blended or agreement-weighted score would describe
evidence that did not set the price.

## 7.5 DP-5 implementation notes and decisions

Recorded 2026-08-22 during the DP-5 build. Two of these change behaviour agreed
in an earlier phase, so they are called out rather than buried.

**Approval is internal. It queues nothing.** Approving sets `status=approved`,
`approvedById`, and `approvedAt` on the `PriceRecommendation`, plus a mirrored
workflow status on the `PricingRunItem`. No product price, no variant price, no
`PriceWritebackLog`, no external call. An `approved_by` value in the export
means a person accepted a proposal internally, not that a store price moved.

**Self-approval is NOT blocked.** The general approvals module enforces
separation of duties by permission rather than identity, and DP-5 follows it.
The case is also weaker here than in an authoring flow: the user who ran
generation did not choose the price, the engine did, so blocking them from
deciding would add friction without adding control. The real control is that
`pricing.approve_recommendations` is a distinct permission from
`pricing.review_recommendations`, which is what generates the queue. If the
product owner wants a hard identity split, the hook is `canApprove` in
`services/pricing/approval.ts` and `PriceRecommendation` would need a
`generatedById` column, which it does not have today.

**Rejection now suppresses regeneration — a DP-4 behaviour change.** Through
DP-4, `isStillLive` returned false for every decided status, so a rejected
recommendation was regenerated identically on the next pass: the reviewer says
no and the system silently asks again. `approved` and `written_back` now always
suppress, and `rejected` suppresses until its evidence horizon (`expiresAt`)
passes. The rejection was of a price derived from THAT evidence, so re-asking on
fresher evidence is legitimate and re-asking on the same evidence is not.
`expired` and `failed` still regenerate freely.

**Expiry is evaluated against the clock, not the stored status.** Nothing sweeps
rows to `expired` on a timer, so a row can be past its horizon while still
reading `ready_for_review`. Approval re-checks the clock, and refusing an
expired row also retires it to `expired` — housekeeping that only ever moves a
row OUT of the reviewable state.

**Approval re-validates price, floor, and cost.** The stored floor and cost are
re-checked at decision time rather than trusted from generation. A proposal that
no longer clears its own floor is not approvable however it got that way.

**Rejection is deliberately looser than approval.** A time-expired
`ready_for_review` row is still rejectable: refusing would strand rows in the
queue with no way to clear them. Rejection does require a reason of at least
three characters, normalised for CRLF before measuring.

**The DP-4 sign-off copy was superseded.** DP-4 required the pages to read "No
recommendation has been approved. No price has been changed. Approval and
writeback are later phases." Two of those sentences became false the moment
approval shipped, and a canary was enforcing them. Both pages now carry the DP-5
wording — "Approved recommendations are internal approvals only. No BigCommerce
price change occurs until a later controlled writeback phase." — which keeps the
load-bearing promise. The generate form keeps its DP-4 wording, still true of it.

**The UI predicate runs the full server check (DP-5A).** The first version of
`showsApproveControl` checked only permission, status, and expiry while its own
comment claimed to match the server, so a row with no floor, no cost, or a
below-floor price still rendered an Approve button the action then refused.
Approve and reject are now separate predicates: approve delegates to
`canApprove` in full, and reject deliberately does NOT — rejection exists partly
to clear rows that can never be approved, and gating it on approvability would
strand exactly those rows. When approve is unavailable the page states the
refusal reason rather than silently omitting the button. The server remains the
enforcement layer either way; the UI simply no longer offers impossible actions.

**No bulk approve.** Decisions are one at a time. A bulk control is the obvious
next convenience, but it is also the obvious way to approve a hundred prices
without reading them, and DP-6 writeback has not been built yet. Deferred until
there is an operator with a real queue to argue from.

## 7.6 DP-6 implementation notes and decisions

Recorded 2026-08-22 during the DP-6 build. This is the first phase that can
change a customer-facing price, so the decisions below are stated rather than
left to be inferred from the code.

**Both writeback flags remain OFF.** `external.writebacks` exists and is OFF;
`pricing.writebacks` and `pricing.intelligence` have no row at all, and an
absent row resolves to false. Nothing in this phase enables a flag anywhere.

**The kill switch needs no separate check.** `KILL_SET` already contains
`external.writebacks` and `pricing.writebacks`, so tripping the kill switch
turns both off and the flag gate stops the write. Adding an independent
kill-switch test would have been a second mechanism to keep in sync with the
first, and a weaker guarantee than the one already in place.

**The HTTP call lives in the integration layer, not in services/pricing.** The
pricing canaries assert that no file under `services/pricing` performs outbound
HTTP except the DP-3 collector. Putting the request in
`integrations/bigcommerce/price-writeback.ts` keeps that guarantee true and
leaves the writeback service auditable as pure orchestration. That client is
deliberately narrow: it can read a price and set `sale_price`, and there is no
generic "update product" helper in it for a later phase to reach for.

**Only `sale_price` is sent, proved by inspecting the request body.** The
payload is built as a single-key object literal rather than spread from a
caller-supplied object, so no caller can smuggle another field into a price
update. A test asserts `Object.keys(body)` is exactly `["sale_price"]`.

**A pre-write read is mandatory.** If the live price cannot be read, the write
is refused rather than attempted. A writeback with nothing to restore is a
one-way change to a customer-facing price, and the read is the whole rollback
story. This is stricter than "record what we can and proceed".

**A failed write leaves the recommendation `approved`, not `failed`.** The
recommendation is still a sound proposal that a human blessed; what failed is
one attempt to deliver it, and that lives on the `PriceWritebackLog`. Marking
the recommendation `failed` would destroy a human approval because of a network
blip and force a re-approval to retry. A failed attempt therefore does not block
a later retry, but a SUCCEEDED one does — permanently, by design.

**The local `ProductVariant` price is not updated.** BigCommerce is the source
of truth for catalogue prices and the app syncs them inward. Writing the local
mirror from this side would create a second writer for a field the sync owns and
would mask a write that silently did not take. The next product sync brings the
value back.

**Variant writes never fall back to the product.** BigCommerce addresses a
variant as `/products/{id}/variants/{id}`, so a variant-scoped item with no
resolvable parent product id cannot be targeted. That case refuses rather than
writing the product, which would reprice every variant of it.

**Store routing is by explicit link, and ambiguity refuses.** The connection is
found via `IntegrationConnection.storeId`. Zero linked connections refuses;
more than one also refuses rather than picking the first, because picking would
silently choose which storefront gets repriced.

**Rollback is not implemented.** Evidence is captured — old regular and sale
price from the live read, the local values, the target, the full request and
response payloads, actor and timestamp — but no restore action exists.
Recommended as **DP-6B** before any real use.

**No bulk, scheduled, or autonomous path.** One recommendation per explicit
button press. Canaries assert the service contains no loop feeding the write
call, no Inngest registration, and that no background function or worker
entrypoint can reach it.

## 7.7 DP-6B implementation notes and decisions

Recorded 2026-08-22. Rollback is a live price change, so it is gated exactly as
hard as the forward write and the decisions below are stated rather than left to
be inferred.

**A changed store price refuses, with no override.** Rollback restores a price
captured at DP-6 write time. Before writing, the live sale price is read and
must still equal what DP-6 wrote (within half a cent). If it has moved, that
movement was someone or something else's decision, and reverting it would make
rollback a way to silently clobber an unreviewed change. DP-6B refuses and says
so. There is deliberately no force flag; adding one is a product-owner decision.

**A prior state of "no sale price" refuses.** `writeBigCommerceSalePrice`
rejects non-positive prices, and BigCommerce's semantics for clearing
`sale_price` — null vs 0 vs omission — have never been exercised against a real
store from this codebase. Guessing would mean either writing a real price of
$0.00 or sending an unverified null to a live storefront. `CLEARING_SALE_PRICE_SUPPORTED`
is therefore `false`, and such a rollback refuses with an instruction to clear
the price manually in BigCommerce. Flipping it requires a verified clearing path
AND an observed round trip against a real store, not a docs reading.

**An absent evidence key is not the same as a recorded null.** The prior price
comes from `rollbackPayload.liveBefore.salePrice` first, then the stored
`oldSalePrice` column, then nothing. A recorded `null` means "there was no sale
price"; an ABSENT key means we never captured it. Conflating them would let a
rollback clear a price on no evidence, so only an explicitly present null counts.

**The recommendation and run item keep `written_back`.** The writeback is
historical fact — it happened — and the log's `rolled_back` status is where the
current state lives. `PriceWritebackLog.status` already has `rolled_back`, so no
migration was needed, and inventing a recommendation status would have required
an enum migration for something the log already expresses. The queue's state
helper reads the log, not the recommendation.

**A failed rollback leaves the log `succeeded`.** The DP-6 write really did
happen and is still the live state; only the attempt to undo it failed. Marking
the log `rolled_back` would claim a store change that never occurred. The
attempt is appended to `rollbackPayload.rollbackAttempts` with its error.

**Rollback attempts are appended, never overwritten.** Refused, in-flight,
failed, and successful attempts all append to `rollbackAttempts`, and the DP-6
pre-write evidence underneath is never modified. A rollback that loses the
evidence it depends on would be self-defeating.

**Rollback shares the forward write's client, not a second one.** It calls
`writeBigCommerceSalePrice`, so the "sale_price only" proof in the client covers
rollback too, and there is exactly one module able to send a price to a store
plus one able to restore one — both named in the canaries.

**The page never loads the rollback service.** `rollback-read.ts` holds the
display helpers, mirroring the DP-6A split. It touches no Prisma at all; the
availability check it exposes stops short of the live-price comparison, because
that needs a store request and a page render must not make one. A rollback whose
store price has since moved will therefore still show a button and be refused on
submit — the alternative is an outbound request per log on every page view.

**No bulk rollback.** One writeback log per explicit press, enforced by canary:
no loop, no scheduler, no background path, and no multi-select in the UI.

## 8. Competitor Setup Requirements

Add setup screens for competitor stores under:

```text
/products/pricing/competitors
```

Each competitor should store:

```text
name
baseUrl
enabled
country
currency
searchUrlTemplate
productUrlPattern
rateLimitPerHour
termsReviewStatus: pending | reviewed_allowed | reviewed_restricted | disabled
requiresManualUrlMapping
notes
lastSuccessfulCheckAt
lastFailedCheckAt
failureCount
createdAt
updatedAt
```

Competitor setup must support three matching modes:

### Mode 1 — Direct Product URL Mapping

Best first version. The system stores one or more competitor product URLs per LifeSupply product/variant.

### Mode 2 — Search URL Template

Example:

```text
https://competitor.example/search?q={sku}
```

The worker searches by SKU or product name and records confidence.

### Mode 3 — Manual Review Required

If no confident match exists, the item is flagged for manual URL mapping.

Do not implement broad web search in the first version unless the product owner explicitly approves it.

---

## 9. Pricing Rules

Add setup screens for pricing rules under:

```text
/products/pricing/rules
```

A pricing rule should be configurable globally and optionally per store/category/product/variant.

Fields:

```text
name
storeId optional
categoryId optional
productId optional
productVariantId optional
minCostMultiplier default 1.40
defaultUndercutAmount default 0.01
defaultUndercutPct optional
maxIncreasePct default 10%
maxDecreasePct default 20%
dailyBatchSize default 300
minConfidence default 0.85
evidenceFreshnessHours default 48
requiresApproval default true
autoApproveEligible default false
enabled
notes
```

Precedence:

1. ProductVariant-specific rule.
2. Product-specific rule.
3. Category-specific rule.
4. Store-specific rule.
5. Global default rule.

---

## 10. Pricing Calculation Requirements

For each pricing run item, calculate:

```text
costPrice
floorPrice = costPrice * minCostMultiplier
currentRegularPrice
currentSalePrice
currentEffectivePrice = currentSalePrice if present, otherwise currentRegularPrice
validCompetitorPrices
lowestCompetitorPrice
recommendedSalePrice
recommendationType
marginBefore
marginAfter
confidence
reason
```

### Cost Source Priority

Use the first available reliable source:

1. `ProductVariant.costPrice`
2. Preferred `SupplierProduct.cost`
3. Most recently checked supplier cost from supplier automation evidence, when available
4. Latest `OrderItem.unitCost` if it is reliable
5. Uploaded cost from the run file
6. Blocked — missing cost

If cost source is not definitive, record the cost source and confidence.

### Recommendation Types

Use these statuses:

```text
increase
reduce
no_change
blocked_margin_floor
blocked_missing_cost
blocked_low_confidence
blocked_no_competitor_match
blocked_stale_evidence
manual_review
```

### Decrease Rule

If LifeSupply current effective price is higher than the lowest valid competitor:

```text
target = lowestCompetitorPrice - undercutAmount
```

If `target >= floorPrice`, recommend reducing to `target`.

If `target < floorPrice`, block with:

```text
blocked_margin_floor
```

### Increase Rule

If LifeSupply current effective price is already lower than the lowest valid competitor:

```text
target = lowestCompetitorPrice - undercutAmount
```

Recommend increasing only if:

- `target > currentEffectivePrice`
- `target >= floorPrice`
- increase does not exceed `maxIncreasePct`
- match confidence is high
- evidence is fresh
- product is not locked

If `target` is too large an increase, cap at:

```text
currentEffectivePrice * (1 + maxIncreasePct)
```

but only if capped price remains below the lowest valid competitor.

### No Change Rule

Return `no_change` when:

- LifeSupply is already cheapest and there is no safe room to increase.
- Competitor difference is below materiality threshold.
- Price change would be too small to justify operational risk.

---

## 11. Data Model — Proposed Prisma Models

The implementation should add dedicated models. Field names should be adjusted to fit existing naming conventions.

### PricingCompetitor

```text
id
name
baseUrl
enabled
country
currency
searchUrlTemplate
productUrlPattern
rateLimitPerHour
termsReviewStatus
requiresManualUrlMapping
notes
lastSuccessfulCheckAt
lastFailedCheckAt
failureCount
createdAt
updatedAt
```

### PricingRule

```text
id
name
storeId optional
categoryId optional
productId optional
productVariantId optional
minCostMultiplier
defaultUndercutAmount
defaultUndercutPct optional
maxIncreasePct
maxDecreasePct
dailyBatchSize
minConfidence
evidenceFreshnessHours
requiresApproval
autoApproveEligible
enabled
notes
createdAt
updatedAt
```

### PricingRun

```text
id
storeId
sourceType: upload | top_products
rankingBasis
lookbackWindow
targetCount
dailyBatchSize
status: draft | queued | running | paused | completed | failed | cancelled
createdById
startedAt
completedAt
lastBatchAt
metadata
createdAt
updatedAt
```

### PricingRunItem

```text
id
pricingRunId
storeId
productId optional
productVariantId optional
sku
productName
currentRegularPrice
currentSalePrice
currentEffectivePrice
costPrice
costSource
floorPrice
lowestCompetitorPrice
recommendedSalePrice
recommendationType
confidence
status: pending | checked | recommendation_ready | approved | rejected | blocked | written_back | failed
blockedReason
lastCheckedAt
metadata
createdAt
updatedAt
```

### CompetitorPriceObservation

```text
id
pricingRunItemId
competitorId
competitorUrl
observedRegularPrice
observedSalePrice
observedEffectivePrice
currency
availability
shippingNote
taxNote
matchConfidence
extractionMethod: direct_url | search_template | manual | ai_assisted
rawEvidenceText
evidenceRef
checkedAt
status: valid | invalid | unavailable | low_confidence | failed
errorMessage
createdAt
```

### PriceRecommendation

```text
id
pricingRunItemId
oldRegularPrice
oldSalePrice
recommendedSalePrice
floorPrice
costPrice
marginBefore
marginAfter
lowestCompetitorPrice
undercutAmount
recommendationType
reason
requiresApproval
status: draft | ready_for_review | approved | rejected | expired | written_back | failed
approvedById optional
approvedAt optional
rejectedById optional
rejectedAt optional
rejectionReason optional
expiresAt
createdAt
updatedAt
```

### PriceWritebackLog

```text
id
recommendationId
storeId
productId optional
productVariantId optional
sourceSystem
sourceProductId optional
sourceVariantId optional
oldRegularPrice
oldSalePrice
newSalePrice
status: queued | succeeded | failed | rolled_back
requestPayload
responsePayload
errorMessage
writtenById optional
writtenAt optional
rollbackPayload optional
rollbackAt optional
createdAt
```

### Optional Future Model: ProductCompetitorUrl

Add if useful for durable direct URL mapping:

```text
id
productId optional
productVariantId optional
competitorId
competitorUrl
matchConfidence
verifiedAt
verifiedById optional
status: active | needs_review | disabled
notes
createdAt
updatedAt
```

---

## 12. Page and Route Structure

Recommended UI location:

```text
Products & Catalog → Pricing Intelligence
```

Recommended routes:

```text
/products/pricing
/products/pricing/competitors
/products/pricing/rules
/products/pricing/runs
/products/pricing/runs/new
/products/pricing/runs/[id]
/products/pricing/recommendations
/products/pricing/recommendations/[id]
/products/pricing/upload
/products/pricing/writebacks
```

Initial implementation should include only:

```text
/products/pricing
/products/pricing/competitors
/products/pricing/rules
```

Later phases add runs, uploads, checks, recommendations, approvals, and writebacks.

---

## 13. Worker / Agent Design

This should be a deterministic worker first, with optional AI only for low-confidence product matching.

### Deterministic worker responsibilities

- Select next 300 due products.
- Fetch configured competitor URLs or search templates.
- Extract price data using deterministic selectors or structured parsers.
- Normalize currency.
- Apply availability rules.
- Calculate cost floor.
- Generate recommendations.
- Store evidence.
- Raise blocked/manual-review states.
- Create audit logs.

### AI-assisted responsibilities, later only

- Compare product title/description to determine likely match.
- Extract price from messy page text where deterministic parser fails.
- Explain recommendation reasoning for management.
- Summarize daily pricing report.

AI must not independently approve or write prices.

---

## 14. Approval and Writeback Workflow

Initial writeback behavior must be disabled.

When writebacks are eventually implemented, the workflow must be:

```text
Recommendation created
  → Human review
  → Approval row created or recommendation approved by authorized user
  → Feature flags checked
  → Evidence freshness checked
  → Permission checked
  → BigCommerce update executed
  → Writeback log stored
  → Audit log stored
  → ProductVariant local price refreshed from BigCommerce or updated with source reference
```

BigCommerce writebacks should start with one-product manual updates before any batch operation is allowed.

The first writeback version should update only `salePrice`, not regular price, unless the product owner explicitly approves regular-price changes.

---

## 15. Implementation Phases

## DP-0 — Documentation and Design Control

Objective: establish the feature plan, scope, guardrails, and staged implementation.

Deliverables:

- This PRD/instruction document.
- Confirm the first build is read-only and approval-based.
- Confirm writebacks are out of scope until DP-6.

## DP-1 — Foundation: Schema, Permissions, Flags, Setup Pages

Objective: create the durable foundation for Pricing Intelligence.

Deliverables:

- Prisma models and migration.
- Feature flags.
- Permissions.
- Seed data.
- Main Pricing Intelligence landing page.
- Competitor setup page.
- Pricing rules setup page.
- Audit logs for competitor/rule changes.
- No competitor crawling.
- No pricing runs.
- No BigCommerce writebacks.

## DP-2 — Product List Builder

Objective: allow users to create draft pricing runs from upload or top-products selection.

Deliverables:

- CSV upload.
- Top 1,500 product selector by store/date/ranking.
- Draft `PricingRun` and `PricingRunItem` creation.
- Mapping preview.
- Manual correction for unmatched SKUs.
- No competitor crawling.
- No writebacks.

## DP-3 — Read-Only Competitor Price Collection

Objective: run read-only checks against configured competitor URLs/templates.

Deliverables:

- Worker event/function.
- Daily batch size of 300.
- Competitor observations.
- Evidence records.
- Rate limiting.
- Error handling.
- Confidence scoring.
- No recommendations that change prices yet.
- No writebacks.

## DP-4 — Recommendation Engine

Objective: turn observations into pricing recommendations.

Deliverables:

- Floor-price calculation.
- Lowest competitor calculation.
- Increase/decrease/no-change/blocked recommendations.
- Margin before/after.
- Confidence and reason text.
- Review queue.
- CSV export of recommendations.
- No writebacks.

## DP-5 — Approval Workflow

Objective: allow authorized users to approve/reject/hold/lock recommendations.

Deliverables:

- Recommendation review page.
- Approve/reject/hold actions.
- Required reason on rejection.
- Audit logs.
- Optional Approval model integration.
- No writebacks.

## DP-6 — Controlled BigCommerce Writeback

Objective: allow approved recommendations to update BigCommerce sale price.

Deliverables:

- Feature-flag-gated writeback service.
- Permission-gated writeback action.
- Single-product update first.
- Writeback logs.
- Audit logs.
- Rollback data.
- Manual verification before batch updates.

## DP-7 — Limited Automation

Objective: introduce constrained automation only after staging and production evidence.

Deliverables:

- Auto-approval rules for low-risk changes only.
- Daily caps.
- Product/category exclusions.
- Drift monitoring.
- Alerts and rollback.

DP-7 must not be built without explicit product-owner approval after DP-1 through DP-6 have been validated.

---

## 16. Initial Implementation Instructions — DP-1 Only

The first implementation PR should build DP-1 only.

Branch:

```text
claude/dp-01-pricing-foundation
```

PR title:

```text
Pricing Intelligence foundation: competitors, rules, runs, recommendations, guardrails
```

### DP-1 Scope

Implement:

1. Prisma models for pricing intelligence.
2. Migration.
3. Feature flags.
4. Permissions.
5. Seed data.
6. Main landing page at `/products/pricing`.
7. Competitor setup page at `/products/pricing/competitors`.
8. Pricing rules page at `/products/pricing/rules`.
9. Server actions/services for competitor and rule CRUD.
10. Server-side permission enforcement.
11. Audit logs for create/update/delete of competitor and pricing rules.
12. Basic navigation from Products & Catalog to Pricing Intelligence.
13. Empty-state language that clearly states read-only foundation is being set up.

### DP-1 Explicit Non-Scope

Do not implement:

- Competitor crawling.
- AI product matching.
- Pricing run creation.
- Upload parser.
- Top-1500 selector.
- Price recommendations.
- Approval queue.
- BigCommerce sale-price updates.
- Any automated writeback.
- Any external website access.

### DP-1 Acceptance Criteria

DP-1 is complete when:

- Prisma schema compiles.
- Migration is generated.
- Seed data includes pricing permissions and feature flags.
- Pricing pages are permission-gated.
- Competitor records can be created, edited, disabled, and deleted/archived.
- Pricing rules can be created/edited/disabled.
- Default global rule uses `minCostMultiplier = 1.40` and `dailyBatchSize = 300`.
- All material setup changes write audit logs.
- No external competitor website is contacted.
- No BigCommerce writeback code path exists or is reachable.
- All verification commands pass.

### Required Verification

Run:

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

---

## 17. Testing Requirements

DP-1 tests should include:

- Permission registry includes pricing permissions.
- Feature flag registry includes pricing flags.
- Default flags are seeded OFF unless explicitly intended otherwise.
- Pricing writeback flag defaults OFF.
- Competitor CRUD requires `pricing.manage_competitors`.
- Pricing rule CRUD requires `pricing.manage_rules`.
- Pricing landing page requires `pricing.view`.
- Audit log writes for competitor/rule changes.
- Validation rejects invalid URLs, negative multipliers, zero/negative batch sizes, and unsafe rule values.

Future tests should include:

- Cost-floor calculation.
- Competitor comparison.
- Recommendation generation.
- Approval enforcement.
- BigCommerce writeback gating.
- Rollback logging.
- Low-confidence match handling.
- Rate-limit handling.

---

## 18. Product Owner Decisions Needed Before DP-2+

The product owner should decide:

1. Which store is first: LifeSupply.ca, Wellmart Medical, or U.S./Balkowitsch.
2. Whether the top-products ranking should prioritize revenue, units, gross profit, or margin opportunity.
3. Whether competitor prices should include shipping or taxes.
4. Whether out-of-stock competitor prices count.
5. Whether currencies need conversion.
6. Whether the undercut should be `$0.01`, `$0.50`, `1%`, or configurable by store/category.
7. Whether some categories should be excluded.
8. Whether certain suppliers/MAP/MSRP products require lockouts.
9. Whether competitor terms have been reviewed.
10. Whether direct URL mapping or search template mode should be used first.

---

## 19. Suggested PR Summary Template

Use this summary for the initial DP-1 PR:

```text
## Summary
Adds the guarded Pricing Intelligence foundation for future dynamic-pricing workflows. This PR creates the data model, permissions, feature flags, seed data, and setup screens for competitors and pricing rules.

## What is included
- Pricing Intelligence PRD/instruction document
- Prisma models and migration for competitors, rules, runs, run items, observations, recommendations, and writeback logs
- Pricing feature flags
- Pricing permissions
- Pricing landing page
- Competitor setup page
- Pricing rules setup page
- Audit logging for setup changes

## Guardrails
- No competitor crawling
- No AI matching
- No pricing runs
- No recommendations
- No BigCommerce price writebacks
- pricing.writebacks defaults OFF

## Verification
- pnpm typecheck
- pnpm lint
- pnpm format:check
- pnpm test
- pnpm build
```

---

## 20. Claude Code Prompt for DP-1

Use the prompt below to implement the first coding phase.

```text
Please read:
- CLAUDE.md
- docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md
- docs/RELEASE_READINESS_STATUS.md
- docs/28_PRICING_INTELLIGENCE_DYNAMIC_PRICING_PRD.md
- prisma/schema.prisma
- src/lib/permissions.ts
- src/lib/feature-flags.ts
- existing seed files under prisma/seed
- existing Products & Catalog pages and services
- existing audit logging utilities
- existing approval and BigCommerce integration guardrails

The product owner has approved a new guarded Pricing Intelligence / Dynamic Pricing feature. This is an explicit new feature request, but it must be built safely and incrementally.

Implement DP-1 only: Pricing Intelligence foundation.

Create a branch:
claude/dp-01-pricing-foundation

Objective:
Add the durable foundation for a future dynamic-pricing workflow that will eventually compare selected BigCommerce products against competitor stores, enforce a minimum price floor of 140% of cost, and create approval-gated recommendations before any BigCommerce sale-price update. DP-1 must not contact competitor websites and must not update BigCommerce.

Required work:
1. Add Prisma models for:
   - PricingCompetitor
   - PricingRule
   - PricingRun
   - PricingRunItem
   - CompetitorPriceObservation
   - PriceRecommendation
   - PriceWritebackLog
   - ProductCompetitorUrl if helpful for direct URL mapping
2. Generate a migration.
3. Add feature flags:
   - pricing.intelligence
   - pricing.writebacks
   pricing.writebacks must default OFF.
4. Add permissions:
   - pricing.view
   - pricing.manage_rules
   - pricing.manage_competitors
   - pricing.create_runs
   - pricing.run_checks
   - pricing.review_recommendations
   - pricing.approve_recommendations
   - pricing.writeback_bigcommerce
   - pricing.export
5. Add seed data for the new permissions and feature flags.
6. Add a Pricing Intelligence entry or sub-entry under Products & Catalog, following the existing navigation conventions.
7. Create initial pages:
   - /products/pricing
   - /products/pricing/competitors
   - /products/pricing/rules
8. Add server-side services/actions for competitor CRUD and pricing-rule CRUD.
9. Enforce server-side permissions on every page/action.
10. Add audit logs for create/update/delete/disable actions for competitors and pricing rules.
11. Add validation for URLs, currencies, positive multipliers, batch size, confidence thresholds, and enabled/disabled states.
12. Seed or create a default global pricing rule using:
   - minCostMultiplier = 1.40
   - dailyBatchSize = 300
   - requiresApproval = true
   - enabled = true
13. Ensure empty states and page copy clearly explain that this is a read-only setup foundation and that competitor crawling/writebacks are not active yet.

Explicit non-scope:
- Do not build competitor crawling.
- Do not build AI product matching.
- Do not build top-1500 product selection yet.
- Do not build product upload yet.
- Do not build pricing-run execution yet.
- Do not create price recommendations yet.
- Do not create approval workflow yet.
- Do not call BigCommerce update endpoints.
- Do not write prices to BigCommerce.
- Do not access competitor websites.
- Do not enable autonomous pricing.

Guardrails:
- pricing.writebacks must be OFF by default.
- Any future writeback must require pricing.writebacks, external.writebacks, permission, approval, and audit logging.
- Keep all external writebacks disabled in this phase.
- Preserve the current Phase 11 release-readiness controls unless the product owner explicitly directs otherwise.

Tests:
Add tests where the project structure supports them for:
- permission registry additions
- feature flag registry additions
- pricing rule validation
- competitor validation
- audit logging behavior if practical
- absence of writeback/crawling execution paths in DP-1

Run:
- pnpm typecheck
- pnpm lint
- pnpm format:check
- pnpm test
- pnpm build

Deliverable:
- Branch name
- Commit SHA
- PR link if created
- Files changed
- Migration name
- New models
- New permissions
- New feature flags
- Routes added
- Test/build results
- Confirmation that no competitor crawling and no BigCommerce writebacks were implemented
- Recommended DP-2 prompt for Product List Builder
```

---

## 21. Final Reminder

This feature is strategically valuable, but it must remain conservative until proven.

Build order:

```text
Setup → product list → read-only competitor observations → recommendations → approval → controlled writeback → limited automation
```

Do not skip directly to autonomous repricing.
