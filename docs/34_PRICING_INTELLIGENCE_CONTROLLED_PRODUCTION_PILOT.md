# 34 — Pricing Intelligence Controlled Production Pilot

**Project:** LifeSupply Command Center
**Prepared:** August 23, 2026
**Status:** Plan only. **No step has been performed.** No flag enabled, no price changed, no credential touched.

> **This is a controlled pilot, not production readiness.** Nothing in this document accepts a launch gate in `docs/RELEASE_READINESS_STATUS.md` §6, and completing it does not make the Pricing Intelligence module — or the application — production-ready.

---

## 1. Product-owner decision

Recorded 2026-08-23.

- The product owner has elected to use the **current production deployment** as the pilot environment.
- **No separate staging environment will be provisioned at this time.**
- `render.staging.yaml` remains reviewed, committed, and **available but unused**. Staging may still be provisioned later; the work is paused, not deleted.
- `release/phase-11-staging` is **not** cut, and the Render Blueprint is **not** applied.
- The basis for the decision is that the Command Center is not yet used by anyone else.

`DEC-01`, `DEC-02`, and `DEC-03` (recorded 2026-08-23, `docs/33`) remain valid for whenever staging is provisioned. They are not withdrawn by this decision.

---

## 2. The risk this decision does **not** remove

**"Nobody uses the Command Center" and "nothing customer-facing can change" are different statements.**

The Command Center having no other users limits the blast radius *inside* the Command Center. It does nothing about the direction that matters: DP-6 writeback sends a `PUT` to BigCommerce and changes a **live storefront sale price**. A customer browsing the store sees that price whether or not anyone is logged into this application.

So the entire safety of this pilot rests on **which product is chosen**, not on who is using the app.

### Product selection rules

**Preferred — use this if at all possible**

- A **hidden, unpublished, or otherwise non-customer-facing** BigCommerce test product. Created for this purpose, visible to nobody, disposable.

**Acceptable only with written product-owner approval, recorded in the evidence log**

- A live product where a temporary price change is acceptable *and* can be restored immediately. The approval must name the product and state who accepted the exposure.

**Not acceptable under any circumstances**

- A high-volume product
- A product in a paid campaign
- A product where a temporary price change could mislead a customer — including anything where a lower price might be seen and relied on
- **Any bulk set of products.** One product. One price. One writeback.

---

## 3. Current environment findings — read before planning the session

Inspected 2026-08-23 against the live production database. These are not assumptions.

| Finding | Value | Consequence |
|---|---|---|
| `pricing.*` permission rows | **0** of 75 | Nobody can open `/products/pricing`. Must be fixed first — §4 |
| `pricing.intelligence` flag row | **absent** → resolves OFF | Must exist before it can be turned on |
| `pricing.writebacks` / `external.writebacks` | absent / OFF | Correct starting posture, but incidental — the module was never provisioned |
| Enabled pricing rules | **0** | `seedPricing` provides one — §4 |
| Competitors at `reviewed_allowed` | **0** | Human step; never seeded, by design |
| Products / variants | 14 / 18, **all `sourceSystem: "seed"`** | **No real BigCommerce product exists in the Command Center** |
| Variants with a `salePrice` | **0** of 18 | Every existing variant would fail the rollback prerequisite |
| BigCommerce-mapped variants (`sourceSystem: "bigcommerce"` + `sourceId`) | **0** | DP-6 resolves its write target from these. There is currently **no product the pilot can use** |
| Stores | 3, all `sourceSystem: "seed"` (`lifesupply-ca`, `wellmartmedical-com`, `amazon-us`) | Seed slugs, not BigCommerce store hashes |
| BigCommerce integration connections | 2 stores, one connection each | Mapping exists; no sync has run |

**The consequence that shapes everything below:** the pilot cannot use any product currently in the database. A **real BigCommerce product sync must run first**, and that will import real catalogue data into the production database for the first time. That is a substantive step with its own review, not a checkbox — see §5 step B2.

---

## 4. Production seed caution — **do not run `pnpm db:seed`**

`pnpm db:seed` runs `prisma/seed.ts`, which executes **seven** modules. Only three are relevant to this pilot; the other four write synthetic business records.

| Module | Writes | Safe in production? |
|---|---|---|
| `auth.ts` | permissions, roles, rolePermissions, users — all `upsert`, keyed on stable identifiers | **Yes** — idempotent. Upserts the owner user by email |
| `governance.ts` | featureFlag rows, `enabled: false`, guarded by `if (existing) continue` | **Yes** — idempotent, creates nothing enabled |
| `pricing.ts` | the `Global default` pricing rule, `upsert` by name | **Yes** — idempotent |
| `operating.ts` | divisions, **stores, customers, products, productVariants**, suppliers, categories, marketing contacts, customer segments | **NO** — synthetic catalogue and customer data |
| `transactions.ts` | **orders, orderItems** | **NO** — synthetic orders |
| `management.ts` | **campaigns, financial summaries, reports, tasks, approvals, AI outputs**, integration sync logs | **NO** — synthetic business records |
| `strategic.ts` | **investors, acquisition targets, opportunities, investor interactions** | **NO** — synthetic investor and M&A data |

**Verdict: a full seed is NOT appropriate for production.** Four of seven modules inject demo data. Recommending it would be recommending that fabricated customers, orders, financial summaries, and investor records be written into a live database.

> Note: the production database **already contains** this seed data (10 customers, 12 orders, 14 products, 4 investors, 5 campaigns), so a re-run would be largely idempotent in practice. That does not make it the right instruction. The pilot needs three things, and the correct action is to do those three things — not to re-run a fixture loader over a live database and rely on its upserts.

### Recommended: a targeted pricing bootstrap

What the pilot actually needs is exactly:

1. The nine `pricing.*` permission rows, granted to the roles the registry already defines
2. Feature-flag rows for `pricing.intelligence`, `pricing.writebacks`, `external.writebacks` — **all created OFF**
3. The `Global default` pricing rule

It must create **no** demo data, **no** synthetic customers/orders/products, **enable no flag**, and **touch no credential**.

**Not implemented in this change.** Two routes exist and the choice is the product owner's:

- **Route A — targeted script.** Add `scripts/bootstrap/pricing-only.ts` that calls only the permission/role portion of `seedAuth`, plus `seedGovernance` and `seedPricing`. Small, reviewable, testable, and re-runnable. Recommended if the pilot is likely to be repeated or if another environment is provisioned later.
- **Route B — runbook.** A short documented sequence performed by the Developer / Technical Admin using existing admin screens and a one-off invocation of the three safe modules. No new code. Adequate for a single pilot.

I recommend **Route A**, but have deliberately not written it: it is a production-touching script and should be built against a decision, with its own review, rather than smuggled into a planning document.

---

## 5. Prerequisites

Each must be true and evidenced before step G of §6.

| # | Prerequisite | How confirmed |
|---|---|---|
| 1 | Production app deployed from the accepted `main` baseline | Render deploy SHA matches `main` |
| 2 | Database migrations current | `prisma migrate status` reports none pending |
| 3 | Nine `pricing.*` permission rows exist | Preflight `PERM-00` |
| 4 | Pricing feature-flag rows exist | Preflight `FLAG-*` |
| 5 | `pricing.intelligence` can be turned ON by a human | Admin flag screen |
| 6 | `pricing.writebacks` starts **OFF** | Preflight |
| 7 | `external.writebacks` starts **OFF** | Preflight |
| 8 | One enabled pricing rule | Preflight `DATA-02` |
| 9 | One competitor manually reviewed and marked `reviewed_allowed` | Human, `/products/pricing/competitors` |
| 10 | BigCommerce credentials confirmed to be the **intended** store | §7 abort criterion — verify before, not during |
| 11 | One controlled test product selected per §2 | Written into the evidence log |
| 12 | Test product has BigCommerce product id, variant id if applicable, `sourceId` in the Command Center, `costPrice`, **and a non-null sale price** | Preflight `DATA-01` + BigCommerce admin |
| 13 | Operator, approver, writer, observer named | Evidence log header |
| 14 | `DEC-PI-01` decided, **or explicitly deferred for the pilot** and recorded as such | `docs/33` |

> **Prerequisite 12 is currently unmet and cannot be met by any existing row** — see §3. A real BigCommerce product sync must run first.

---

## 6. Execution sequence

Run with `docs/31` open. Record as you go.

| Step | Action | Must be true |
|---|---|---|
| **A** | Confirm production baseline | Deployed SHA = accepted `main` |
| **B** | Confirm migrations | `prisma migrate status`: none pending |
| **B2** | **Run a BigCommerce product sync** so at least one variant carries `sourceSystem: "bigcommerce"` and a `sourceId` | Real catalogue data enters the database for the first time — review before running |
| **C** | Confirm pricing permissions and flag rows exist | Preflight `PERM-00`, `FLAG-*` |
| **D** | Confirm starting flags | `pricing.intelligence` as intentionally set; `pricing.writebacks` **OFF**; `external.writebacks` **OFF** |
| **E** | Select the controlled BigCommerce product per §2 | Recorded, with approval note if it is a live product |
| **F** | **Confirm its current sale price directly in BigCommerce** | Written into the evidence log before anything changes |
| **G** | Turn `pricing.intelligence` ON — only when ready | Flag change audited |
| **H** | Product list → observation → recommendation → approval | Per `docs/30` steps C–F |
| **I** | ⚠ **Attempt writeback with both writeback flags still OFF** | **Must REFUSE.** If it succeeds — **abort** |
| **J** | Enable `pricing.writebacks` + `external.writebacks` **for this single writeback only** | Flag change audited |
| **K** | Write the approved price | Log `succeeded`; created before the API call |
| **L** | ⚠ **Confirm in the BigCommerce admin that the price changed** | Not from this app's own report |
| **M** | Reconcile | `matched` |
| **N** | Mismatch test — **only if safe on this product** | Change the price manually, reconcile → `mismatch`, then restore to the step-K value |
| **O** | Roll back | Attempt while the price differs first → must refuse; then restore and roll back |
| **P** | ⚠ **Confirm in the BigCommerce admin that the price is restored** | Equals the step-F value |
| **Q** | Turn both writeback flags **OFF** | Re-run preflight to confirm |
| **R** | Record evidence and outcome | `docs/31` outcome table |

Step N is optional. If the chosen product is live, or if a second price change carries any exposure, **skip it and record that it was skipped** rather than accepting risk for a nice-to-have test.

---

## 7. Abort criteria — stop immediately

- **A writeback succeeds while the flags are OFF** (step I). The gate is not holding.
- **Any non-test product's price changes.**
- **No audit entry exists for an action that visibly happened.**
- **Rollback refuses and the price cannot be restored quickly.**
- **The BigCommerce product turns out not to be controlled or safe** — published when believed hidden, in a campaign, high-volume.
- **The operator cannot confirm the final price.**
- **Any uncertainty about whether the credentials point at the intended store.** Do not proceed on an assumption about which storefront is on the other end of the API token.

**How to stop:** trip the kill switch at `/admin/feature-flags` — it turns `pricing.writebacks` and `external.writebacks` off, and every gate then refuses. Restore the product's price by hand in BigCommerce. Record what happened, including what was left in what state.

---

## 8. What a successful pilot does and does not establish

**Establishes:** that the manual workflow — list, observe, recommend, approve, write, reconcile, roll back — functions end to end against a real BigCommerce store, on **one product**, with the gates refusing when they should.

**Does not establish, and must not be described as establishing:**

- Production readiness of Pricing Intelligence or the application
- Volume or performance behaviour
- Concurrency safety — there is still no concurrency guard
- Multi-store behaviour — one store only
- Bulk workflows — none exist and none are certified
- Automation — none exists and none is certified
- That a silently coerced price would be caught — there is still no post-write verification

`PI-CERT-01…12` remain **Evidence Required** until pilot evidence is captured and the product owner signs. **Pilot evidence is not staging certification evidence and is not broad production readiness.** Where a `PI-CERT` row is satisfied by pilot evidence, the evidence entry must say so — "controlled production pilot, one product, <date>" — so a later reader is not misled about its scope.

---

## 9. Relationship to the staging documents

| Document | Status |
|---|---|
| `docs/29` Certification Workbook | Still authoritative for the **procedure**. Steps A–K apply unchanged; the environment differs |
| `docs/30` Execution Checklist | Still the run sheet. Read `docs/34` §2 and §7 alongside it |
| `docs/31` Evidence Log | Still the evidence template. Record the environment as **controlled production pilot** in the header |
| `docs/32` Staging Provisioning | **Paused by product-owner decision.** Blueprint remains reviewed and available |
| `docs/33` Staging Decision Record | `DEC-01`/`DEC-02`/`DEC-03` remain valid for whenever staging is provisioned |

The original staging path is **deferred, not deleted**. If the pilot surfaces problems that need repeated destructive testing, provisioning staging becomes the obvious next move and everything needed for it is already in place.
