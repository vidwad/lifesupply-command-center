# 31 — Pricing Intelligence Staging Evidence Log

**Fill this in during the exercise, not afterwards.** Run sheet: `docs/30_PRICING_INTELLIGENCE_STAGING_EXECUTION_CHECKLIST.md`. Full procedure and sign-off: `docs/29_PRICING_INTELLIGENCE_CERTIFICATION_WORKBOOK.md`.

> **Status: empty. No step below has been performed.** Every row is unfilled. This log is evidence of nothing until a person completes it and the product owner signs `docs/29` §12.

---

> **Path change (2026-08-23).** The product owner has elected to run this exercise as a **controlled production pilot** rather than in a provisioned staging environment — see `docs/34_PRICING_INTELLIGENCE_CONTROLLED_PRODUCTION_PILOT.md`. The procedure below is unchanged and still applies; only the environment differs. Read `docs/34` §2 (product selection) and §7 (abort criteria) before starting. Pilot evidence covers **one product in one store** and is not staging certification, not multi-store, not concurrency, not automation, not bulk, and **not production readiness**. Staging provisioning is deferred, not deleted.

## Exercise header — complete before step A

| Field | Value |
|---|---|
| Date of exercise | |
| Environment (must be staging) | |
| BigCommerce store name | |
| BigCommerce store hash | |
| Test product name | |
| **BigCommerce product id** | |
| **BigCommerce variant id** (blank if product-scoped) | |
| Test product sale price **before anything** (G-0) | |
| Pricing run id | |
| Recommendation id | |
| Writeback log id | |
| Operator (runs the steps) | |
| Approver (step F) | |
| Writer (steps G, H, I) | |
| Was the writer Super Admin? (`DEC-PI-01`) | |
| Observer | |
| Separation of duties certified? (approver ≠ writer) | |

---

## Critical tests — these nine decide the outcome

Fill every column. **"Not observed" is a valid entry; blank is not.**

| Test ID | Step name | Expected result | Actual result | Evidence link / screenshot | Audit log id | BigCommerce product id | BigCommerce variant id | Pass / Fail | Owner | Date | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **A-1** | Preflight shows zero blockers | Zero blockers; every check ok or explained | | | | | | | | | |
| **G-1** | ⚠ Writeback refused with flags OFF | **Refused**, naming `pricing.writebacks` and `external.writebacks`. Audit `pricing.writeback_refused`. **If it succeeds — ABORT** | | | | | | | | | |
| **G-7** | ⚠ BigCommerce sale price changed after approved writeback | Confirmed **in the BigCommerce admin** that sale price = the approved recommended price | | | | | | | | | |
| **H-1** | Reconciliation matched | Status `matched`; observed price = written price | | | | | | | | | |
| **H-4** | Reconciliation mismatch after manual store change | Status `mismatch`; required action = "find out what changed this price before acting" | | | | | | | | | |
| **I-1** | ⚠ Rollback refused while store price differs | **Refused**, "the store price has changed since" | | | | | | | | | |
| **I-3** | ⚠ Rollback restored original sale price | Confirmed **in the BigCommerce admin** that sale price = the G-0 value | | | | | | | | | |
| **K-2** | Writeback flags turned off again | Preflight reports both `pricing.writebacks` and `external.writebacks` OFF | | | | | | | | | |
| **K-3** | Final test product price confirmed | The price left on the store is recorded and intended | | | | | | | | | |

---

## Supporting tests

Copy rows as needed. Not every step needs a screenshot, but every step needs an actual result.

| Test ID | Step name | Expected result | Actual result | Evidence link / screenshot | Audit log id | BigCommerce product id | BigCommerce variant id | Pass / Fail | Owner | Date | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A-0 | Pricing permissions exist in this database | `PERM-00` ok | | | | | | | | | |
| A-6 | Exactly one connection per store | `STORE-02` ok | | | | | | | | | |
| A-9 | Operator, approver, writer can sign in | All three; writer's role recorded | | | | | | | | | |
| B-3 | Competitor terms status recorded | Only `reviewed_allowed` is contacted | | | | | | | | | |
| C-2 | Run item shows cost, floor, effective price | Floor = cost × multiplier | | | | | | | | | |
| C-3 | Nothing auto-created | No observations, recommendations, or writeback logs | | | | | | | | | |
| D-2 | Observation evidence stored | Rows with evidence text, status, confidence | | | | | | | | | |
| D-4 | No BigCommerce write from observation | No writeback log exists | | | | | | | | | |
| E-2 | Recommendation requires approval | `requires approval`, `ready_for_review` | | | | | | | | | |
| E-5 | Guardrail — missing cost | `blocked_missing_cost`, no row created | | | | | | | | | |
| E-6 | Guardrail — below floor | `blocked_margin_floor`, no below-floor price | | | | | | | | | |
| F-1 | View-only user sees no approve control | Controls hidden | | | | | | | | | |
| F-3 | Approval changed no store price | Confirmed **in BigCommerce** — unchanged | | | | | | | | | |
| F-5 | Rejection requires a reason | Reason required and stored | | | | | | | | | |
| G-0 | Pre-write price recorded from the store | Value written into the header above | | | | | | | | | |
| G-3 | User without writeback permission sees no button | Panel hidden | | | | | | | | | |
| G-5 | Writeback log fully populated | Old/new prices, request, response, rollback payload | | | | | | | | | |
| G-6 | Log created before the API call | `createdAt` precedes `writtenAt` | | | | | | | | | |
| G-8 | Local variant price untouched | `ProductVariant.salePrice` unchanged | | | | | | | | | |
| G-11 | Second writeback refused | "A successful writeback already exists" | | | | | | | | | |
| H-2 | Reconciliation wrote audit only | Writeback log row unchanged | | | | | | | | | |
| I-4 | Log marked rolled_back | `status = rolled_back`, `rollbackAt` set | | | | | | | | | |
| I-5 | Recommendation still written_back | Recommendation and run item unchanged | | | | | | | | | |
| I-6 | Rollback attempts appended | Both the refusal and the success recorded | | | | | | | | | |
| I-8 | Second rollback refused | "Already rolled back" | | | | | | | | | |
| J-3 | CSV export | Downloads; rollback and reconciliation columns populated | | | | | | | | | |
| J-4 | No dangerous controls on operations page | Only view / export / reconcile | | | | | | | | | |
| J-5 | Required-action copy is understandable | Any confusing wording recorded verbatim | | | | | | | | | |
| K-4 | Audit log exported for the window | File attached to the evidence pack | | | | | | | | | |

---

## Audit entries observed

One row per audit entry seen. `docs/29` requires every visible action to have one.

| Audit log id | Action | Entity type | Entity id | Actor | Timestamp | Notes |
|---|---|---|---|---|---|---|
| | `pricing.recommendation_approved` | PriceRecommendation | | | | |
| | `pricing.writeback_refused` | PriceRecommendation | | | | G-1 |
| | `pricing.writeback_requested` | PriceRecommendation | | | | |
| | `pricing.writeback_succeeded` | PriceRecommendation | | | | |
| | `pricing.writeback_reconciliation_completed` | PriceWritebackLog | | | | H-1 |
| | `pricing.writeback_reconciliation_completed` | PriceWritebackLog | | | | H-4 (mismatch) |
| | `pricing.writeback_rollback_refused` | PriceWritebackLog | | | | I-1 |
| | `pricing.writeback_rollback_requested` | PriceWritebackLog | | | | |
| | `pricing.writeback_rollback_succeeded` | PriceWritebackLog | | | | |

---

## Deviations, surprises, and findings

Anything that did not match the expected result, plus anything that worked but was confusing. A finding here is a useful outcome, not a failure of the exercise.

| # | Step | What happened | Why it matters | Raised as | Owner |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

---

## Outcome

| Field | Value |
|---|---|
| All nine critical tests passed? | |
| Any abort criterion met? (`docs/30`) | |
| Both flags OFF at close | |
| Final store price | |
| Overall result: **Pass / Fail / Incomplete** | |
| Recorded by | |
| Date | |

A pass here certifies **the manual workflow on one product in one staging store**. It does not certify volume, concurrency, multiple stores, or automation — none of which exist.

Certification is not complete until the product owner signs `docs/29` §12. Claude Code may prepare and populate this log; it may never sign it.
