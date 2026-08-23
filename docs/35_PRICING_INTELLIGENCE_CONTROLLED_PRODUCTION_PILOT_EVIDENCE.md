# 35 — Controlled Production Pilot Evidence

**Fill this in during the pilot, not afterwards.** Plan: `docs/34_PRICING_INTELLIGENCE_CONTROLLED_PRODUCTION_PILOT.md`. Step-by-step: `docs/30_PRICING_INTELLIGENCE_STAGING_EXECUTION_CHECKLIST.md` — the procedure is unchanged, only the environment differs.

> **Status: empty. No step below has been performed.** This log is evidence of nothing until a person completes it and the product owner accepts it.
>
> **This is a production environment.** A writeback here changes a real BigCommerce storefront price. `docs/34` §2 governs which product may be used — read it before filling in the header.

---

## 1. Pilot header

| Field | Value |
|---|---|
| Date of pilot | |
| Environment | **Controlled production pilot** (no staging environment provisioned — `DEC-PI-02`) |
| Command Center deployed commit SHA | |
| `prisma migrate status` — none pending? | |
| Pricing bootstrap run? (`pnpm pricing:bootstrap --apply`) | |

## 2. Selected product — the safety decision

| Field | Value |
|---|---|
| Product name | |
| **BigCommerce product id** | |
| **BigCommerce variant id** (blank if product-scoped) | |
| Command Center `sourceId` | |
| `costPrice` in the Command Center | |
| **Pre-test sale price, read from BigCommerce** | |
| Product classification (tick one) | ☐ hidden / unpublished / non-customer-facing (**preferred**) ☐ live product with written approval ☐ *neither — STOP* |
| If live: who approved the temporary repricing, and when | |
| Confirmed NOT high-volume, NOT in a paid campaign, NOT misleading if repriced | |

> If the classification row cannot be ticked as one of the first two, the pilot does not start.

## 3. Credential and store confirmation

| Field | Value |
|---|---|
| BigCommerce connection name used | |
| Store this connection points at — **confirmed how?** | |
| Confirmed the target store is the intended one | |
| Any doubt about which storefront is on the other end? | *Any doubt = abort (`docs/34` §7)* |

## 4. Actors

| Role | Name | Notes |
|---|---|---|
| Operator | | Runs the steps |
| Approver | | Step F only |
| Writer | | Steps G–P — the live price change |
| Observer | | Watches audit + writeback logs; may call abort |
| Was the writer Super Admin? (`DEC-PI-01`) | | |
| Approver and writer are different people? | | If no, separation of duties is **not** certified by this pilot |

## 5. Feature-flag posture

| Flag | At start | During writeback | At close | Evidence |
|---|---|---|---|---|
| `pricing.intelligence` | | | | |
| `pricing.writebacks` | must be **OFF** | temporarily ON | must be **OFF** | |
| `external.writebacks` | must be **OFF** | temporarily ON | must be **OFF** | |

## 6. Identifiers produced

| Field | Value |
|---|---|
| Pricing run id | |
| Recommendation id | |
| Writeback log id | |

---

## 7. Critical tests — these nine decide the outcome

Fill every column. **"Not observed" is a valid entry; blank is not.**

| Test ID | Step | Expected | Actual | Evidence / screenshot | Audit log id | Pass / Fail |
|---|---|---|---|---|---|---|
| **A-1** | Preflight shows zero blockers | Every check ok or explained | | | | |
| **I** | ⚠ Writeback attempted with both flags **OFF** | **REFUSED**, naming the disabled flags. **If it succeeds — ABORT** | | | | |
| **K** | Approved price written | Writeback log `succeeded`; created before the API call | | | | |
| **L** | ⚠ **BigCommerce sale price changed — confirmed in the BigCommerce admin** | Store shows the approved price | | | | |
| **M** | Reconciliation | `matched` | | | | |
| **N** | Mismatch test *(skip if unsafe — record that it was skipped)* | `mismatch` after a manual store change | | | | |
| **O** | ⚠ Rollback refused while the store price differs | **REFUSED** — "the store price has changed since" | | | | |
| **P** | ⚠ **Price restored — confirmed in the BigCommerce admin** | Store shows the §2 pre-test price | | | | |
| **Q** | Both writeback flags OFF at close | Preflight re-run confirms | | | | |

## 8. Supporting tests

| Test ID | Step | Expected | Actual | Evidence | Audit log id | Pass / Fail |
|---|---|---|---|---|---|---|
| A-0 | Pricing permissions exist | `PERM-00` ok | | | | |
| B | Migrations current | None pending | | | | |
| B2 | BigCommerce product sync run | ≥1 variant with `sourceSystem: bigcommerce` + `sourceId` | | | | |
| C | Flag rows exist | All three present | | | | |
| E-5 | Guardrail — missing cost | `blocked_missing_cost`, no row | | | | |
| E-6 | Guardrail — below floor | `blocked_margin_floor`, no below-floor price | | | | |
| F-3 | Approval changed no store price | Confirmed **in BigCommerce** — unchanged | | | | |
| G-3 | User without writeback permission sees no button | Panel hidden | | | | |
| K-2 | Writeback log fully populated | Old/new prices, request, response, rollback payload | | | | |
| G-8 | Local `ProductVariant` price untouched | Unchanged | | | | |
| G-11 | Second writeback refused | "A successful writeback already exists" | | | | |
| I-5 | Recommendation still `written_back` after rollback | Log carries current state | | | | |
| I-8 | Second rollback refused | "Already rolled back" | | | | |
| J-4 | No writeback/rollback/bulk buttons on operations page | Only view / export / reconcile | | | | |

## 9. Audit entries observed

Every visible action must have one.

| Audit log id | Action | Entity | Actor | Timestamp | Notes |
|---|---|---|---|---|---|
| | `pricing.recommendation_approved` | PriceRecommendation | | | |
| | `pricing.writeback_refused` | PriceRecommendation | | | flags-OFF test |
| | `pricing.writeback_requested` | PriceRecommendation | | | |
| | `pricing.writeback_succeeded` | PriceRecommendation | | | |
| | `pricing.writeback_reconciliation_completed` | PriceWritebackLog | | | matched |
| | `pricing.writeback_reconciliation_completed` | PriceWritebackLog | | | mismatch |
| | `pricing.writeback_rollback_refused` | PriceWritebackLog | | | price-changed test |
| | `pricing.writeback_rollback_succeeded` | PriceWritebackLog | | | |

## 10. Deviations, surprises, and findings

A finding here is a useful outcome, not a failure of the pilot.

| # | Step | What happened | Why it matters | Raised as | Owner |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

## 11. Final price state

| Field | Value |
|---|---|
| Pre-test sale price (from §2) | |
| Post-write sale price, confirmed in BigCommerce | |
| Post-rollback sale price, confirmed in BigCommerce | |
| **Final price left on the storefront** | |
| Does the final price match the pre-test price? | |
| If not — why, and who accepted it | |

## 12. Outcome

| Field | Value |
|---|---|
| All nine critical tests passed? | |
| Any abort criterion met? (`docs/34` §7) | |
| Both writeback flags OFF at close | |
| Result: **Pass / Fail / Incomplete** | |
| Recorded by | |
| Date | |

---

## 13. Product-owner acceptance

**Claude Code may prepare and populate this log. It may never sign this section.**

| Field | Value |
|---|---|
| Evidence reviewed by | |
| Signature | |
| Date | |
| Disposition | ☐ Accept ☐ Accept with findings ☐ Reject |
| Findings accepted, if any | |

### What acceptance does and does not mean

Accepting this evidence certifies **the manual Pricing Intelligence workflow on ONE product in ONE store, performed once, by hand**.

It does **not** certify, and must not be described as certifying:

- Production readiness of Pricing Intelligence or the application
- Automation of any kind — none exists and none was exercised
- Bulk writeback, bulk rollback, or bulk reconciliation — none exists
- Multiple stores
- Concurrency — there is still no concurrency guard
- Volume or performance behaviour
- That a silently coerced price would be caught — there is still no post-write verification

Where a `PI-CERT` row in `docs/RELEASE_READINESS_STATUS.md` is evidenced by this pilot, its Evidence location must say so — **"controlled production pilot, one product, `<date>`"** — so a later reader cannot mistake its scope. Rows move to **Ready for Review** on a passing pilot; only the product owner moves them to **Accepted**.
