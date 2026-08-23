# 30 — Pricing Intelligence Staging Execution Checklist

**Use this at the keyboard.** The reasoning, the full expected results, and the sign-off tables live in `docs/29_PRICING_INTELLIGENCE_CERTIFICATION_WORKBOOK.md`. This page is the condensed run sheet.

Record results in `docs/31_PRICING_INTELLIGENCE_STAGING_EVIDENCE_LOG.md` as you go, not afterwards.

> **Nothing here is certified.** No step below has been performed. This exercise certifies the manual workflow on **one product in one staging store** — not volume, concurrency, multiple stores, or automation.

---

> **Path change (2026-08-23).** The product owner has elected to run this exercise as a **controlled production pilot** rather than in a provisioned staging environment — see `docs/34_PRICING_INTELLIGENCE_CONTROLLED_PRODUCTION_PILOT.md`. The procedure below is unchanged and still applies; only the environment differs. Read `docs/34` §2 (product selection) and §7 (abort criteria) before starting. Pilot evidence covers **one product in one store** and is not staging certification, not multi-store, not concurrency, not automation, not bulk, and **not production readiness**. Staging provisioning is deferred, not deleted.

## Before you book the session

Five things must be settled or the exercise cannot start. All are human decisions.

| # | Decision | Owner | Status |
|---|---|---|---|
| 1 | Which BigCommerce **staging/sandbox store** (`DEC-05`) | Product Owner | **TBD** |
| 2 | Which **test product** — must already have a sale price set | Operations Manager | **TBD** |
| 3 | Who is the **staging operator** (runs the steps) | Product Owner | **TBD** |
| 4 | Who is the **approver** (step F only) | Product Owner | **TBD** |
| 5 | Who is the **writer** (steps G, H, I) — and whether writeback stays Super-Admin-only or moves to a narrower role (`DEC-PI-01`) | Product Owner | **TBD** |

**And one environment fix:** the target database must be re-seeded so the nine `pricing.*` permission rows exist. As of 2026-08-22 the deployed database had **zero** of them — see `docs/29` §4.1. Without this, nobody can open `/products/pricing` at all.

---

## Required setup

| Item | Requirement |
|---|---|
| Environment | Staging only. Never production. Staging DB must not be the production DB |
| Store | BigCommerce sandbox or dedicated staging store, credentials configured in staging only |
| Test product | Synced with `sourceSystem = bigcommerce` + `sourceId`, has `costPrice`, **has a current sale price**, and is disposable |
| Users | Operator, approver, writer (may be the same person only if you accept not certifying separation of duties), observer |
| Flags at start | `pricing.intelligence` **ON** · `pricing.writebacks` **OFF** · `external.writebacks` **OFF** |
| Open beside you | The BigCommerce admin for the test product. Several steps must be confirmed there, not in this app |

---

## A — Preflight

Open `/products/pricing/operations` → **Staging readiness** card.

- [ ] **A-0** `PERM-00` ok — pricing permissions exist in this database (if not: re-seed, then restart)
- [ ] **A-1** Zero blockers overall → **record in evidence log**
- [ ] **A-2** `pricing.intelligence` ON
- [ ] **A-3** `pricing.writebacks` OFF
- [ ] **A-4** `external.writebacks` OFF
- [ ] **A-5** Kill-switch state understood (both flags off is consistent with a trip — confirm which, from the audit log)
- [ ] **A-6** `STORE-02` ok — exactly one connection per store
- [ ] **A-7** Test product's BigCommerce product id and variant id written into the evidence log
- [ ] **A-8** `DATA-01`, `DATA-02` ok — costed mapped variant, enabled rule
- [ ] **A-9** Operator, approver, writer can all sign in. **Note whether the writer is Super Admin**

**Do not continue with any blocker outstanding.**

---

## B–C — Setup and run

- [ ] **B-1** Pricing rule exists; record `minCostMultiplier`
- [ ] **B-2/B-3** Competitor exists; record its terms status (`pending` is refused — not a bug)
- [ ] **B-4** Nothing was created by looking
- [ ] **C-1** Build a run containing **only** the test product → status `draft`
- [ ] **C-2** Item shows cost, floor, effective price; floor = cost × multiplier
- [ ] **C-3** No observations, recommendations, or writeback logs yet

---

## D — Observation (read-only)

- [ ] **D-1** Run a competitor check at the smallest test batch
- [ ] **D-2** Observation rows stored with evidence text, status, confidence
- [ ] **D-3** No recommendation created
- [ ] **D-4** **No writeback log exists**
- [ ] **D-5** Any skipped competitor names its reason

---

## E — Recommendation

- [ ] **E-1** Generate → rows created, or a stated reason none were
- [ ] **E-2** Shows `requires approval`, status `ready_for_review`
- [ ] **E-3** Reason text names the observations, floor, and arithmetic
- [ ] **E-4** No approval, no writeback
- [ ] **E-5** **Guardrail:** clear the item's cost → regenerate → `blocked_missing_cost`, no row
- [ ] **E-6** **Guardrail:** floor above competitor price → regenerate → `blocked_margin_floor`, no below-floor price

---

## F — Approval

- [ ] **F-1** As a `pricing.view`-only user: no approve button
- [ ] **F-2** As approver: approve → status `approved`, actor and timestamp recorded
- [ ] **F-3** **Check BigCommerce directly — price did NOT change.** This is the point of DP-5
- [ ] **F-4** Audit `pricing.recommendation_approved`
- [ ] **F-5** On a second recommendation: reject with a reason (reason required)
- [ ] **F-6** Rejected recommendation is not regenerated on the next pass

---

## G — Writeback ⚠ **first live price change**

- [ ] **G-0** Write down the test product's **current sale price from BigCommerce** → evidence log
- [ ] **G-1** ⚠ **With both flags still OFF**, press "Write approved price to BigCommerce" → **must be REFUSED**, naming the disabled flags. Audit `pricing.writeback_refused`
      **If this succeeds — STOP. Abort the exercise.**
- [ ] **G-2** Enable `pricing.writebacks` + `external.writebacks` — **staging only**
- [ ] **G-3** As a user without `pricing.writeback_bigcommerce`: no button
- [ ] **G-4** As writer: press → succeeds
- [ ] **G-5** `PriceWritebackLog` `status = succeeded`, old/new prices, request + response + rollback payloads populated
- [ ] **G-6** Log `createdAt` precedes `writtenAt` — the row existed before the call
- [ ] **G-7** ⚠ **Confirm in the BigCommerce admin that the sale price actually changed.** This is the certification
- [ ] **G-8** Local `ProductVariant.salePrice` did **not** change
- [ ] **G-9** Recommendation and run item are `written_back`
- [ ] **G-10** Audit `..._writeback_requested` and `..._writeback_succeeded`
- [ ] **G-11** Press again → **refused**, a successful writeback already exists

---

## H — Reconciliation

- [ ] **H-1** Reconcile the log → **`matched`**; observed = written → evidence log
- [ ] **H-2** Audit entry only — the writeback log row is unchanged
- [ ] **H-3** Change the sale price **manually in BigCommerce** to a third value
- [ ] **H-4** Reconcile again → **`mismatch`**; required action reads "find out what changed this price before acting"
- [ ] **H-5** Dashboard mismatch count increments
- [ ] **H-6** Restore the store price to the **G-4 written value** manually (needed for I-2)

---

## I — Rollback

- [ ] **I-1** ⚠ **Before H-6** (while the store price still differs): attempt rollback → **must be REFUSED**, "the store price has changed since"
- [ ] **I-2** After H-6: attempt rollback → succeeds
- [ ] **I-3** ⚠ **Confirm in the BigCommerce admin the sale price is back to the G-0 value**
- [ ] **I-4** Log `status = rolled_back`, `rollbackAt` set
- [ ] **I-5** Recommendation and run item **still** `written_back` (the log carries current state)
- [ ] **I-6** `rollbackAttempts` records both the refusal and the success — appended, not overwritten
- [ ] **I-7** Audit `..._rollback_requested`, `..._rollback_refused`, `..._rollback_succeeded`
- [ ] **I-8** Attempt again → refused, already rolled back
- [ ] **I-9** Reconcile once more → `matched` against the restored price

> **Order matters:** I-1 must be attempted *before* H-6 restores the price. If you restore first, the refusal test is gone.

---

## J — Operations dashboard

- [ ] **J-1** Counts reflect the exercise
- [ ] **J-2** Each filter returns the expected rows
- [ ] **J-3** CSV export downloads; rollback and reconciliation columns populated
- [ ] **J-4** No writeback, rollback, or bulk buttons — only "View recommendation", "Export CSV", "Reconcile this writeback log"
- [ ] **J-5** Required-action text is comprehensible without this workbook. **Record any wording that was not**

---

## K — Stand down (do not skip)

- [ ] **K-1** Turn `pricing.writebacks` and `external.writebacks` **OFF**
- [ ] **K-2** Re-run preflight → both report OFF → evidence log
- [ ] **K-3** Confirm the test product's final price in BigCommerce is where you intend to leave it → evidence log
- [ ] **K-4** Export the audit log for the exercise window → attach to the evidence pack

---

## Evidence to capture

| Kind | What |
|---|---|
| Screenshots | Preflight card (A-1); G-1 refusal message; BigCommerce product page **before** (G-0), **after write** (G-7), **after rollback** (I-3); H-4 mismatch row; J-3 export |
| Audit log ids | Every `pricing.*` action performed — approval, writeback requested/succeeded/refused, rollback requested/refused/succeeded, reconciliation completed |
| Identifiers | BigCommerce product id and variant id; recommendation id; writeback log id |
| Files | The J-3 CSV export; the K-4 audit export |

---

## Pass criteria

All twelve must hold:

1. Preflight blockers clear before step B
2. **G-1 refused with flags off**
3. **G-7 confirmed in the BigCommerce admin**, not from this app's own report
4. G-8 local variant price untouched
5. G-11 second writeback refused
6. H-1 `matched`; H-4 `mismatch` after a manual change
7. **I-1 refused while the store price differed**
8. **I-3 confirmed in the BigCommerce admin**
9. I-5 recommendation stayed `written_back`
10. Every action has a matching audit entry
11. Both flags OFF at K-2
12. Final price recorded at K-3

---

## Abort criteria — stop immediately

- **G-1 succeeds** (a writeback with flags off means the gate is not holding)
- A price changes on any product other than the test product
- A writeback or rollback occurs that nobody pressed a button for
- An action visibly happened with no audit entry
- Reconciliation reports `possible_landed_write` on a log nobody expected

**How to stop:** trip the kill switch at `/admin/feature-flags` — it turns both writeback flags off and every gate then refuses. Restore the test product's price by hand. Record what happened.

---

## Known behaviours — not defects

Record these as observed rather than raising them as failures. Full list in `docs/29` §9.

- A null prior sale price **cannot** be restored — that is why the test product must start with one
- No post-write verification exists — G-7 and I-3 must be human-checked in the store
- No concurrency guard — do not have two people press write or rollback at once
- The rollback button appears before the live-price check, so a moved price shows a button and is refused on submit (that is exactly what I-1 tests)
- Reconciliation is one log at a time by design
