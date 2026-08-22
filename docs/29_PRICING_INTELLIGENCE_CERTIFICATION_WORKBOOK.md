# 29 — Pricing Intelligence Certification Workbook

**Project:** LifeSupply Command Center
**Covers:** DP-1 … DP-6C (setup, product lists, competitor observation, recommendations, approval, BigCommerce writeback, rollback, operations and reconciliation)
**Prepared:** August 22, 2026
**Status:** Procedures ready for staging execution. **Nothing in this workbook is certified.** No step here has been performed. The Pricing Intelligence chain has never contacted a real BigCommerce store from this codebase.

---

## 1. Purpose

DP-1 through DP-6C are merged and green in CI. That proves the code does what its tests say. It does **not** prove the workflow works against a real storefront, because it has never been run against one.

This workbook is the plan for finding out, safely: one staging store, one test product, one price, with a human watching each step and recording what happened.

It separates four kinds of evidence, and they are not interchangeable:

| Label | What it means | Who produces it |
|---|---|---|
| **[CI]** | Automated tests and canaries that run on every commit. Proves code posture. | Already produced; re-runs on every push |
| **[STAGING]** | A numbered step performed by a person in the staging environment, with the result recorded. | The accountable person named in §5 |
| **[SIGN-OFF]** | A human signature accepting that the staging evidence is sufficient. | Product owner only |
| **[NO-GO]** | A condition that stops the exercise or blocks production regardless of other evidence. | Anybody may call it |

**A row is never certifiable on [CI] evidence alone.** CI cannot tell you whether BigCommerce accepted the price you sent.

---

## 2. Environment assumptions

| Assumption | Why it matters | Verified by |
|---|---|---|
| A staging deployment exists, separate from production | A live price change must never reach a real storefront during certification | `docs/21_STAGING_ENVIRONMENT_GUIDE.md`; row 11B-01 |
| The staging database is **not** the production database | The exercise writes recommendations, logs, and audit rows | `docs/21` §1 isolation matrix |
| A BigCommerce **sandbox or dedicated staging store** is available with write scope on catalogue prices | Step G writes a real sale price. It must not be a store customers can see | `DEC-05`; **not yet chosen** |
| That store's credentials are configured in staging only | Production tokens must never be reachable from staging | `/admin/integrations` vault |
| At least one product in that store is designated a throwaway test product | Its price will be changed and restored | §6 |

> **The staging BigCommerce store is not yet chosen.** This is the first thing the exercise needs and it is a product-owner decision. It is tracked as a no-go item in §11 until decided.

---

## 3. Required roles

| Role in the exercise | Who | Responsible for |
|---|---|---|
| Exercise lead | Operations Manager (TBD) | Running the numbered steps, recording actual results |
| Approver | A second person holding `pricing.approve_recommendations` | Step F only — must **not** be the same person as the writer if separation of duties is being certified |
| Writer | A person holding `pricing.writeback_bigcommerce` | Steps G, H, I |
| Observer | Developer / Technical Admin (TBD) | Watching audit logs and the writeback log live; calling a no-go |
| Signer | Product Owner | §12 sign-off only |

---

## 4. Required permissions — **read this before scheduling**

The permission registry and the seeded role grants were inspected on 2026-08-22. Current state:

| Permission | Seeded roles that hold it |
|---|---|
| `pricing.view` | Super Admin, Executive, Finance Manager, Operations Manager, Product Manager |
| `pricing.manage_rules` | Super Admin, Product Manager |
| `pricing.manage_competitors` | Super Admin, Product Manager |
| `pricing.create_runs` | Super Admin, Product Manager |
| `pricing.run_checks` | Super Admin, Product Manager |
| `pricing.review_recommendations` | Super Admin, Executive, Product Manager |
| `pricing.approve_recommendations` | Super Admin, **Executive** |
| `pricing.writeback_bigcommerce` | **Super Admin only** |
| `pricing.export` | Super Admin, Executive, Finance Manager |

Two consequences the exercise must plan around:

1. **Only Super Admin can write back, roll back, or reconcile.** No other seeded role holds `pricing.writeback_bigcommerce`. Steps G, H, and I therefore require a Super Admin account, or a deliberate decision to grant the permission to a narrower role first. Running the most dangerous steps as Super Admin is convenient and is *not* what production should look like.
2. **Separation of duties is achievable but not enforced by the seed.** Executive can approve and cannot write back; Super Admin can do both. If the exercise is run entirely by one Super Admin, it certifies the workflow but **not** the separation of duties. Record which was done.

> **Decision required (`DEC-PI-01`):** which role should hold `pricing.writeback_bigcommerce` in production. Until decided, note in the evidence table that the writer was Super Admin.

The `/products/pricing/operations` page runs a read-only preflight that reports the live answer for the environment you are in — use it rather than trusting this table, which reflects the seed.

---

## 5. Required feature-flag posture

| Flag | At preflight | During steps B–F | During steps G–I | After the exercise |
|---|---|---|---|---|
| `pricing.intelligence` | ON | ON | ON | Leave as the environment requires |
| `pricing.writebacks` | **OFF** | **OFF** | ON (staging only) | **OFF** |
| `external.writebacks` | **OFF** | **OFF** | ON (staging only) | **OFF** |

Rules:

- Both writeback flags are **OFF in every environment today**, verified 2026-08-22 (`external.writebacks` row exists and is off; the other two have no row, and an absent row resolves to false).
- Step G-1 **verifies the refusal with flags off before enabling them.** Enabling first would skip the most valuable negative test in the exercise.
- Flags are turned on in **staging only**, for the duration of steps G–I, and turned off again at step K. Production flags are never touched by this workbook.
- Tripping the kill switch turns both off. That is the intended emergency stop for this exercise — see §10.

---

## 6. Required test product and data

The test product must satisfy every one of these, or steps will refuse for reasons unrelated to what is being certified:

| Requirement | Why | Where checked |
|---|---|---|
| Exists in the staging BigCommerce store | It is the write target | Store admin |
| Synced into the Command Center with `sourceSystem = "bigcommerce"` and a `sourceId` | Writeback resolves its target from this | Preflight `DATA-01` |
| Has a `costPrice` | No cost → no floor → recommendation blocks | Preflight `DATA-01` |
| Has a current sale price **or** regular price | No effective price → nothing to compare | Step C |
| Has a **non-null** current sale price | A null prior sale price cannot be rolled back — see §9 | Step G-0 |
| Is not a product any customer or process depends on | Its price will change | Human judgement |
| Ideally is a variant, and separately a product-level item | The two write to different endpoints | §8 note |

Also required: one enabled `PricingRule`, and — for step D only — at least one competitor at `reviewed_allowed`.

> **Choose a product whose sale price is currently set.** DP-6B cannot clear a sale price back to null (`CLEARING_SALE_PRICE_SUPPORTED = false`, PRD §7.7). If the test product starts with no sale price, the writeback will succeed and the rollback will refuse, leaving the test price live until someone clears it by hand.

---

## 7. Preflight [STAGING] — step A

Open `/products/pricing/operations`. The **Staging readiness** card runs the read-only preflight. Record its output.

| Step | Action | Expected |
|---|---|---|
| A-1 | Read the preflight card | Zero blockers. Each blocker names what to fix |
| A-2 | Confirm `pricing.intelligence` is ON | `FLAG-01` ok |
| A-3 | Confirm `pricing.writebacks` is OFF | `FLAG-pricing.writebacks` ok |
| A-4 | Confirm `external.writebacks` is OFF | `FLAG-external.writebacks` ok |
| A-5 | Confirm no kill-switch breach | Both flags off is consistent with the kill switch having been tripped or never enabled — confirm which, from the audit log |
| A-6 | Confirm store↔connection mapping | `STORE-02` ok — exactly one connection per store |
| A-7 | Confirm the test product's BigCommerce ids | Record product id and variant id in the evidence table |
| A-8 | Confirm cost, floor basis, and current sale price | `DATA-01`, `DATA-02` ok |
| A-9 | Confirm the required users exist and can sign in | §4 — note whether the writer is Super Admin |

**Do not proceed with any blocker outstanding.**

---

## 8. The exercise [STAGING] — steps B … K

Each step records: what was done, what was observed, the audit log id, and pass/fail. Use the table in §13.

### B — Setup (DP-1)

| Step | Action | Expected |
|---|---|---|
| B-1 | Open `/products/pricing`, confirm or create a pricing rule | Rule visible, `minCostMultiplier` recorded |
| B-2 | Open `/products/pricing/competitors`, confirm a competitor exists | Terms status visible |
| B-3 | Confirm its terms status | Only `reviewed_allowed` will be contacted. `pending` is refused — this is not a bug |
| B-4 | Confirm no observation or recommendation was created by any of the above | Counts on `/products/pricing/operations` unchanged |

### C — Product list / run (DP-2)

| Step | Action | Expected |
|---|---|---|
| C-1 | Build a run containing the single test product | Run created as `draft` |
| C-2 | Open the run, confirm the item | Cost, floor, and effective price populated; floor = cost × multiplier |
| C-3 | Confirm nothing else happened | No observations, no recommendations, no writeback logs |

### D — Read-only observation (DP-3)

| Step | Action | Expected |
|---|---|---|
| D-1 | Run a competitor check with the smallest test batch | Queued; worker picks it up |
| D-2 | Confirm observations stored | `CompetitorPriceObservation` rows with evidence text, status, confidence |
| D-3 | Confirm no recommendation was created | Recommendation count unchanged |
| D-4 | Confirm no BigCommerce write | No `PriceWritebackLog` rows exist |
| D-5 | Confirm robots/terms posture held | Any skipped competitor names its reason |

### E — Recommendation (DP-4)

| Step | Action | Expected |
|---|---|---|
| E-1 | Generate recommendations for the run | Rows created, or a stated reason none were |
| E-2 | Open the recommendation | `requires approval`, status `ready_for_review` |
| E-3 | Read the reason text | Names the observations, the floor, and the arithmetic |
| E-4 | Confirm no approval or writeback occurred | Status unchanged; no writeback log |
| E-5 | **Guardrail test:** temporarily clear the item's cost, regenerate | Blocked with `blocked_missing_cost`; no row created |
| E-6 | **Guardrail test:** set the floor above the competitor price, regenerate | `blocked_margin_floor`; no price proposed below floor |

### F — Approval (DP-5)

| Step | Action | Expected |
|---|---|---|
| F-1 | As a user with `pricing.view` only, confirm no approve button | Controls hidden |
| F-2 | As the approver, approve the recommendation | Status `approved`, approver and timestamp recorded |
| F-3 | Confirm the BigCommerce price did **not** change | Check the store directly. This is the point of DP-5 |
| F-4 | Confirm audit entry | `pricing.recommendation_approved` with actor and prices |
| F-5 | On a second recommendation, reject with a reason | Reason required and stored |
| F-6 | Confirm a rejected recommendation is not regenerated on the next pass | DP-5 suppresses until the evidence horizon passes |

### G — Writeback (DP-6) — **the first live price change**

| Step | Action | Expected |
|---|---|---|
| G-0 | Record the test product's current sale price **from BigCommerce directly** | Written down before anything changes |
| G-1 | **With both flags still OFF**, press "Write approved price to BigCommerce" | **Refused**, naming the disabled flags. Audit `pricing.writeback_refused`. **If this succeeds, stop the exercise — that is a no-go** |
| G-2 | Enable `pricing.writebacks` and `external.writebacks` in **staging only** | Flag change audited |
| G-3 | As a user without `pricing.writeback_bigcommerce`, confirm no button | Panel hidden |
| G-4 | As the writer, press the button | Succeeds |
| G-5 | Confirm `PriceWritebackLog` exists with `status = succeeded` | Old price, new price, request and response payloads, rollback payload all populated |
| G-6 | Confirm the log was created **before** the API call | The row exists even if the call had failed — inspect `createdAt` versus `writtenAt` |
| G-7 | **Confirm the BigCommerce sale price actually changed** | Check the store directly. This is the certification |
| G-8 | Confirm the local `ProductVariant.salePrice` did **not** change | BigCommerce owns it; the sync brings it back later |
| G-9 | Confirm recommendation and run item are `written_back` | |
| G-10 | Confirm audit entries | `pricing.writeback_requested` and `pricing.writeback_succeeded` |
| G-11 | Press the button again | **Refused** — a successful writeback already exists |

### H — Reconciliation (DP-6C)

| Step | Action | Expected |
|---|---|---|
| H-1 | On `/products/pricing/operations`, reconcile the log | Status `matched`; observed price equals written price |
| H-2 | Confirm audit entries only | `pricing.writeback_reconciliation_completed`; **no** change to the writeback log row |
| H-3 | **Mismatch test:** change the sale price manually in BigCommerce to a third value | Store now differs from the log |
| H-4 | Reconcile again | Status `mismatch`; required action reads "find out what changed this price before acting" |
| H-5 | Confirm the mismatch count on the dashboard | Increments |
| H-6 | Restore the store price to the DP-6 written value manually | Needed for step I |

### I — Rollback (DP-6B)

| Step | Action | Expected |
|---|---|---|
| I-1 | **While the store price still differs (before H-6)**, attempt rollback | **Refused** — "the store price has changed since". This is the DP-6B guardrail |
| I-2 | After restoring at H-6, attempt rollback | Succeeds |
| I-3 | **Confirm the BigCommerce sale price is back to the G-0 value** | Check the store directly |
| I-4 | Confirm `PriceWritebackLog.status = rolled_back` and `rollbackAt` set | |
| I-5 | Confirm recommendation and run item are **still** `written_back` | The writeback is historical fact; the log carries current state |
| I-6 | Confirm `rollbackAttempts` on the log records both the refusal and the success | Appended, not overwritten |
| I-7 | Confirm audit entries | `..._rollback_requested`, `..._rollback_refused`, `..._rollback_succeeded` |
| I-8 | Attempt rollback again | **Refused** — already rolled back |
| I-9 | Reconcile once more | `matched` against the restored price |

### J — Operations dashboard (DP-6C)

| Step | Action | Expected |
|---|---|---|
| J-1 | Confirm counts reflect the exercise | `written_back`, `rolled_back`, `mismatch` as observed |
| J-2 | Exercise each filter | Each returns the expected rows |
| J-3 | Export the CSV | Downloads; rollback and reconciliation columns populated |
| J-4 | Confirm no writeback, rollback, or bulk buttons on this page | Only "View recommendation", "Export CSV", "Reconcile this writeback log" |
| J-5 | Read the required-action text as if you were an operator who was not present | Comprehensible without this workbook. Record any wording that was not |

### K — Stand down

| Step | Action | Expected |
|---|---|---|
| K-1 | Turn `pricing.writebacks` and `external.writebacks` **OFF** | Flag change audited |
| K-2 | Re-run the preflight | Both flags report OFF again |
| K-3 | Confirm the test product's price in BigCommerce is where you intend to leave it | Explicitly recorded, not assumed |
| K-4 | Export the audit log for the exercise window | Attached to the evidence pack |

---

## 9. Known limitations the exercise must work around

These are properties of the current build, not defects to be found. Record that each was observed rather than treating it as a failure.

| Limitation | Effect on the exercise | Source |
|---|---|---|
| A null prior sale price cannot be restored | Choose a test product **with** a sale price, or rollback will refuse | PRD §7.7 |
| No post-write verification | G-7 must be checked by a human in the store; the system reports success from the API response alone | PRD §7.6 |
| No concurrency guard | Do not have two people press write or rollback simultaneously | PRD §7.6 |
| Reconciliation is one log at a time | Expected; there is deliberately no bulk reader | PRD §7.8 |
| The rollback button appears before the live-price check | A rollback whose store price has moved shows a button and is refused on submit — I-1 tests exactly this | PRD §7.7 |
| `needs_reconciliation` does not age out | A check from weeks ago still counts as done | PRD §7.8 |
| BigCommerce request/response shapes are unverified | The whole point of the exercise | PRD §7.6 |

---

## 10. Abort and rollback criteria

**Stop the exercise immediately if:**

- G-1 succeeds — a writeback with flags off means the gate is not holding.
- A price changes on any product that is not the designated test product.
- A writeback or rollback occurs that nobody pressed a button for.
- The audit log is missing an entry for an action that visibly happened.
- Reconciliation reports `possible_landed_write` on a log nobody expected.

**How to stop:** trip the kill switch (`/admin/feature-flags`), which turns `pricing.writebacks` and `external.writebacks` off. Both gates then refuse. Then restore the test product's price by hand and record what happened.

**Rollback of the exercise itself:** the test product's price is restored either by step I or by hand. There is nothing else to undo — no production data is touched.

---

## 11. No-go criteria for production

Independent of how the staging exercise goes, production remains blocked while any of these is true:

| No-go | Why |
|---|---|
| The staging BigCommerce store is not chosen (`DEC-05`) | The exercise cannot run |
| `DEC-PI-01` is undecided — which role holds `pricing.writeback_bigcommerce` | Running production writebacks as Super Admin is not an operating model |
| No post-write verification exists | A silently coerced price reads as a clean write |
| No concurrency guard exists | Two operators can both produce a succeeded log |
| The Phase 11 launch gates in `docs/RELEASE_READINESS_STATUS.md` §6 are unsigned | Standing condition |
| Any exercise step recorded a Fail without a written disposition | |

---

## 12. Sign-off

No signature below may be recorded by anyone other than the named human. Claude Code may prepare this workbook and propose "Ready for Review"; it may never sign.

| Area | Evidence reviewed | Accountable | Signature | Date | Disposition |
|---|---|---|---|---|---|
| Preflight (A) | | Operations Manager | | | |
| Setup and runs (B, C) | | Product Manager | | | |
| Observation (D) | | Operations Manager | | | |
| Recommendation (E) | | Product Manager | | | |
| Approval (F) | | Executive | | | |
| Writeback (G) | | Product Owner | | | |
| Reconciliation (H) | | Operations Manager | | | |
| Rollback (I) | | Product Owner | | | |
| Operations dashboard (J) | | Operations Manager | | | |
| Stand-down (K) | | Developer / Technical Admin | | | |
| **Overall certification** | | **Product Owner** | | | |

---

## 13. Evidence capture table

Copy one row per step performed. Leave nothing blank — "not observed" is a valid and useful entry.

| Test ID | Area | Preconditions | Steps | Expected result | Actual result | Evidence link / screenshot | Audit log id | BigCommerce product / variant id | Pass / Fail | Owner | Date | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A-1 | Preflight | | | Zero blockers | | | | | | | | |
| G-1 | Writeback | Flags OFF | Press write | Refused, flags named | | | | | | | | |
| G-7 | Writeback | Flags ON | Check store directly | Sale price changed | | | | | | | | |
| H-4 | Reconciliation | Store changed at H-3 | Reconcile | `mismatch` | | | | | | | | |
| I-1 | Rollback | Store price differs | Press rollback | Refused | | | | | | | | |
| I-3 | Rollback | Store restored | Press rollback | Price back to G-0 value | | | | | | | | |
| … | | | | | | | | | | | | |

---

## 14. Pass / fail criteria

**The exercise passes only if all of these hold:**

1. Every blocker in the preflight was clear before step B.
2. G-1 refused with flags off.
3. G-7 was confirmed **in the BigCommerce admin**, not from the application's own report.
4. G-8 confirmed the local variant price was untouched.
5. G-11 refused a second writeback.
6. H-1 reported `matched`; H-4 reported `mismatch` after a manual change.
7. I-1 refused while the store price differed.
8. I-3 was confirmed **in the BigCommerce admin**.
9. I-5 confirmed the recommendation stayed `written_back`.
10. Every action has a corresponding audit entry.
11. Both flags are OFF at K-2.
12. The test product's final price is recorded at K-3.

**The exercise fails if** any abort criterion in §10 was met, or if any of the twelve above cannot be evidenced.

A pass certifies **the manual workflow on one product in one staging store**. It does not certify volume, concurrency, multiple stores, or automation — none of which exist yet.

---

## 15. What this workbook does not do

- It does not enable any flag. Step G-2 instructs a human to.
- It does not run itself. Every step is performed by a person.
- It does not touch production.
- It does not certify anything. §12 is unsigned.
- It does not make the application production-ready. See `docs/RELEASE_READINESS_STATUS.md` §6.
