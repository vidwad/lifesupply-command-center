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
