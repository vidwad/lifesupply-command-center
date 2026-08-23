# 35 — Controlled Production Pilot Evidence

**Fill this in during the pilot, not afterwards.** Plan: `docs/34_PRICING_INTELLIGENCE_CONTROLLED_PRODUCTION_PILOT.md`. Step-by-step: `docs/30_PRICING_INTELLIGENCE_STAGING_EXECUTION_CHECKLIST.md` — the procedure is unchanged, only the environment differs.

> **Status: ATTEMPTED 2026-08-23 — HALTED AT PREFLIGHT. No pricing step was performed.** The pilot was authorised by the product owner and stopped before step A. **No flag was changed, no price was changed, no writeback log exists** — in either database.
>
> Production state was read directly on 2026-08-23 after `F-7` (all earlier database observations came from a local dev database). Four blockers were found; **two are now cleared**:
>
> | Blocker | State |
> |---|---|
> | No `pricing.*` permissions — nav hidden for everyone | **Cleared** — bootstrap applied to production, 9 permissions + 22 grants |
> | No pricing rule — no margin floor defined (`F-9`) | **Cleared** — `Global default` created, floor 1.40× |
> | Products never synced — 14 seed products, BB V6222 absent (`F-4`) | **Outstanding** — root cause found (`F-10`), fix on a branch |
> | `F-6` — BigCommerce carries no cost data, so the floor cannot be computed even after a sync | **Outstanding — the substantive blocker** |
>
> Safety finding `F-8` (`pricing.writebacks` found ON in production) was **closed** by the product owner on 2026-08-23. All three writeback-related flags are now in the required starting posture.
>
> This log is evidence of nothing until a person completes it and the product owner accepts it.
>
> **This is a production environment.** A writeback here changes a real BigCommerce storefront price. `docs/34` §2 governs which product may be used — read it before filling in the header.

---

## 1. Pilot header

| Field | Value |
|---|---|
| Date of pilot | 2026-08-23 — **attempted, halted at preflight** |
| Environment | **Controlled production pilot** (no staging environment provisioned — `DEC-PI-02`) |
| Command Center deployed commit SHA | `aeffdb1c35b9834b4dbe00231fe3b206fd41efd0` (`main`) — **local checkout; the commit deployed on Render was not verified** |
| `prisma migrate status` — none pending? | 25 applied, schema up to date — **against the LOCAL database only** (`F-7`) |
| Pricing bootstrap run? (`pnpm pricing:bootstrap --apply`) | **Yes — applied to PRODUCTION 2026-08-23** (`lifesupply_cc` @ Render Oregon, via the external connection string). Dry run reviewed first. Created: **9** `pricing.*` permissions, **22** role grants across Super Admin / Executive / Finance Manager / Operations Manager / Product Manager, and the **`Global default`** pricing rule (floor **1.40×**, `requiresApproval=true`, `autoApproveEligible=false`, batch 300, enabled). **No flag was created or changed** — all three already existed. Verified after: 9/9 permissions, 22/22 grants, rule present. Unchanged: 0 runs / 0 recommendations / 0 writeback logs / 0 competitors; 14 products / 18 variants / 74,643 customers / 93,622 orders.<br><br>An earlier run of the same command was applied to the **local** database by mistake (`F-7`); that run is not evidence of anything in production |

## 2. Selected product — the safety decision

| Field | Value |
|---|---|
| Product name | BB V6222 — CS/50 EXTENSION SET MICROBORE, SYRINGE PUMP FLUID PATH ID 0.02" (SKU `BB V6222`) |
| **BigCommerce product id** | **69815** |
| **BigCommerce variant id** (blank if product-scoped) | **70894** (single variant, same SKU) |
| Command Center `sourceId` | **None yet.** Product is not in the Command Center: every product/variant row is `sourceSystem: "seed"` and there are **zero** BigCommerce-mapped variants. A sync must run first (`F-4`) |
| `costPrice` in the Command Center | Would import as **0** — BigCommerce reports `cost_price: 0`. **This blocks the pilot**, see `F-6` |
| **Pre-test sale price, read from BigCommerce** | **149.99 CAD** (regular price 170.44). Non-null, so rollback is possible. Read 2026-08-23 via GET |
| Product classification (tick one) | ☐ hidden / unpublished / non-customer-facing (**preferred**) ☑ live product with written approval ☐ *neither — STOP* |
| If live: who approved the temporary repricing, and when | Product owner (Vid Wadhwani), 2026-08-23, in-session: *"I authorize the controlled production pilot … Authorization for the writeback + rollback sequence specifically"* |
| Confirmed NOT high-volume, NOT in a paid campaign, NOT misleading if repriced | **Not confirmed.** Raised with the product owner; not answered before the pilot halted |

> If the classification row cannot be ticked as one of the first two, the pilot does not start.
>
> **Note.** This product is published and customer-facing at `https://lifesupply.ca/bb-v6222-cs-50-extension-set-microbore-syringe-pump-fluid-path-id-0-02/` — the "acceptable only with written product-owner approval" category in `docs/34` §2, **not** the preferred hidden/unpublished category. `docs/34` §2 prefers a disposable, non-customer-facing product; that preference stands and should be revisited when the pilot is re-attempted.

## 3. Credential and store confirmation

| Field | Value |
|---|---|
| BigCommerce connection name used | `BigCommerce — LifeSupply.ca` |
| Store this connection points at — **confirmed how?** | **Confirmed 2026-08-23.** `GET /v2/store` with a store hash supplied by the product owner returned **HTTP 200**: name *"Lifesupply.ca — Canadian Wellness Shopping Destination"*, domain `lifesupply.ca`, secure URL `https://lifesupply.ca`, status `live`, plan *Enterprise Store Base Monthly*, currency **CAD**, 36,003 products |
| Confirmed the target store is the intended one | **YES** — domain matches the product URL supplied by the product owner |
| Any doubt about which storefront is on the other end? | **No.** The §7 abort criterion is cleared |

**Production connection state, read 2026-08-23** — credential *field names* and last-4 only; nothing was decrypted:

| Connection | `storeHash` last-4 | Fields present | Store linked | Last successful sync |
|---|---|---|---|---|
| `BigCommerce — LifeSupply.ca` | `6ccf` → `76ccf` ✅ | apiToken, clientId, storeHash | yes | 2026-08-05 |
| `BigCommerce — WellmartMedical.com` | `odq8` → `75wm96odq8` ✅ | apiToken, clientId, storeHash | yes | 2026-08-05 |
| `BigCommerce — Balkowitsch Worldwide` | `p3b4` → `vkmglkp3b4` ✅ | apiToken, clientId, storeHash | **no** — `storeId` is null | never |

All three hashes match [`bc-customer-enrichment/src/bc_enrichment/config.py`](../bc-customer-enrichment/src/bc_enrichment/config.py), which has carried them all along. **No credential change is required in production.**

> **Withdrawn.** An earlier version of this section reported the LifeSupply.ca hash as wrong and the other two connections as missing credentials. Both claims came from a **local** development database (`F-7`) and are not true of production. The `/v2/store` 404 that prompted the investigation was the local connection's stale hash, not production's.

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

**Production values, read directly 2026-08-23:**

| Flag | Required at start | **Actual in production** | During writeback | At close |
|---|---|---|---|---|
| `pricing.intelligence` | ON | **ON** ✅ | not reached | unchanged |
| `pricing.writebacks` | **OFF** | was **ON** ❌ → **set OFF by the product owner, 2026-08-23** ✅ (`F-8`) | *never enabled* | **OFF** |
| `external.writebacks` | **OFF** | **OFF** ✅ | *never enabled* | **OFF** |
| `quickbooks.writebacks` | (not in scope) | OFF | — | — |

> **This session changed no flag, in either database.** The bootstrap creates flags disabled and has no code path that enables one; nothing else run here wrote a flag. `pricing.writebacks` was already ON in production before today.
>
> **Why that is not currently exploitable, and why it must still be corrected.** A writeback requires `pricing.writebacks` **and** `external.writebacks` **and** the `pricing.writeback_bigcommerce` permission **and** an approved recommendation. In production `external.writebacks` is OFF, no `pricing.*` permission row exists, and there are zero recommendations — so nothing can currently write. But `pricing.writebacks` being ON removes one of four independent guards and contradicts both the pilot's required starting posture (`docs/30` "Required setup") and `CLAUDE.md` §2, which requires writeback flags to stay disabled until their gate is signed.

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
| A-0 | Pricing permissions exist | `PERM-00` ok | **Pass (production)** — 9 `pricing.*` rows + 22 role grants created; production had 0 | Bootstrap dry run + apply output, then direct production DB query, 2026-08-23 | n/a (bootstrap is not an in-app action) | Pass |
| B | Migrations current | None pending | **Local only** — 25 applied there. **Production migration status was not checked** (`F-7`); the bootstrap succeeded against the production schema, which implies it is current, but that is inference rather than evidence | `prisma migrate status` (local) | | Not verified |
| B2 | BigCommerce product sync run | ≥1 variant with `sourceSystem: bigcommerce` + `sourceId` | **Not run.** Production products/variants are 100% `sourceSystem: "seed"` (14/18). Customers and orders **are** real BigCommerce data (74,586 / 93,610), so the customer and order syncs work — only the product sync has never run | Production DB query, 2026-08-23 | | Blocked |
| C | Flag rows exist | All three present | **Pass (production)** — all three present; `pricing.intelligence` ON, the two writeback flags OFF | §5 | | Pass |
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

> **Re-verified against production 2026-08-23** after `F-7`. Each row below is now marked with the database it describes. Two findings were **withdrawn** — they were artefacts of the local database and are not true of production.

| # | Step | What happened | Why it matters | Raised as | Owner |
|---|---|---|---|---|---|
| ~~**F-1**~~ | §3 | **WITHDRAWN — local-database artefact.** The `/v2/store` 404 came from the **local** connection's wrong store hash. **Production holds the correct hash** (`storeHash` last-4 `6ccf` = `76ccf`), together with matching `apiToken` and `clientId`, and last synced successfully 2026-08-05 | No production action required. The store identity confirmation in §3 stands on its own merits | Withdrawn | — |
| ~~**F-2**~~ | §3 | **WITHDRAWN — local-database artefact.** In **production** all three BigCommerce connections are fully credentialed with correct hashes: LifeSupply.ca `…6ccf`, WellmartMedical.com `…odq8` (= `75wm96odq8`), Balkowitsch `…p3b4` (= `vkmglkp3b4`). The missing-credential rows were local only | The *configured* status is accurate in production. One residual nit: the Balkowitsch connection has `storeId = null`, so it is not linked to a Store row | Withdrawn — minor nit retained | Developer |
| **F-8** | §5 | **RESOLVED 2026-08-23.** `pricing.writebacks` was found **ON** in production and has since been set **OFF** by the product owner. `pricing.intelligence` is also ON; `external.writebacks` is OFF | Removes one of the four independent guards on an external price write, and contradicts the required pilot starting posture (`docs/30`) and `CLAUDE.md` §2. Not currently exploitable — `external.writebacks` is OFF, no `pricing.*` permission exists, and there are no recommendations — but it should be OFF until the writeback gate is signed. **Set it OFF at `/admin/feature-flags` before the pilot begins**, and turn it on only for the writeback step | **Safety finding — closed** | Product Owner |
| ~~**F-9**~~ | §7 A-8 | **RESOLVED 2026-08-23.** Production had no pricing rule (0 rows). The bootstrap created `Global default` — floor 1.40×, approval required, auto-approve off, enabled | Without an enabled rule there is no `minCostMultiplier`, so no margin floor is defined and the engine has nothing to defend a price against. The bootstrap creates the `Global default` rule (1.40 floor, approval required) — but it has only been run against the local database | Prerequisite | Developer |
| **F-2** | §3 | `WellmartMedical.com` is marked *configured* but holds **no** `storeHash` or `apiToken`. `Balkowitsch Worldwide` likewise | A connection's status field can read *configured* while the connection is unusable. The status is not derived from a successful ping, so the UI overstates readiness | Defect (status accuracy) | Developer |
| **F-3** | §2 | The nominated product is **published and customer-facing**, not the hidden/disposable product `docs/34` §2 prefers | Widens blast radius: a mispriced live SKU is visible to customers for the duration of the pilot. Approved in writing, so permitted — but a hidden product remains the better choice | Risk (accepted, revisit) | Product Owner |
| **F-4** | §2 | **Confirmed in production.** The **product** catalogue is entirely synthetic — 14 products / 18 variants, all `sourceSystem: "seed"`; zero BigCommerce-mapped variants; zero variants with a sale price; no SKU matching `V6222`. **Customers and orders, by contrast, are real** — 74,586 BigCommerce customers (+47 guest) and 93,610 BigCommerce orders. So the customer and order syncs have run; the **product sync never has** | A BigCommerce product sync must run before any real SKU can be selected. Pilot prerequisite, not optional. Note this is a first-time import of ~36,000 products into production — it should be scoped or run deliberately, not as an afterthought | Prerequisite | Developer |
| **F-10** | `F-4` prerequisite | **Incremental BigCommerce catalog sync was permanently broken — HTTP 422 on every run.** `sinceIso` came from `lastSuccessfulSyncAt.toISOString()`, which emits milliseconds; the v3 catalog endpoint rejects them (`date_modified:min=…42.796Z` → 422; `…42Z` → 200, verified against the live API 2026-08-23). Every `products.incremental` run in production failed on page 1 and imported **zero** products. Categories are fetched unfiltered, so 937 categories still imported and the run looked productive | This is why the production catalogue is still 100% seed data despite the connection being correctly credentialed since 2026-08-05. **Fixed** on `claude/sync-division-filter-and-catalog-422`: `bigCommerceTimestamp()` truncates to seconds, applied to all three sync jobs so the bug cannot reappear on another endpoint | **Defect — fixed, not yet merged** | Developer |
| **F-11** | *(reporting)* | **A failed sync was reported to the operator as success.** The product owner ran an incremental sync and was shown *"Done · 0 created, 0 updated · 14s"*; the underlying `IntegrationSyncLog` row read `status: failed` with the 422 above. The status panel derived its wording from per-record counts, and a job that fails on page 1 has `recordsFailed === 0`, so a total failure rendered as a clean finish. `errorSummary` was never displayed | **The more serious of the two.** It makes every sync failure invisible to whoever runs it, and it is how `F-10` went unnoticed for weeks. Anyone reading the UI would reasonably conclude the catalogue was already current. **Fixed** on the same branch: job status now decides the wording and `errorSummary` is shown | **Defect — fixed, not yet merged** | Developer |
| **F-12** | *(scope)* | Sync buttons ignored the shell's **Division** selector — full and incremental both fanned out to every configured BigCommerce store regardless of the filter | For a first-time import of ~36,000 products this is the difference between loading one division and loading the whole estate. **Fixed** on the same branch: `?division=` is passed to the dispatch route; out-of-division stores are skipped **with a reason** rather than dropped silently, and the confirm dialog states the scope before a full sync runs. Reconciliation is deliberately left estate-wide | Enhancement — requested by the product owner 2026-08-23 | Developer |
| **F-7** | *(method error)* | **Every Command Center database observation made on 2026-08-23 was against `localhost/lifesupply_cc`, not the Render production database.** `.env` sets `DATABASE_URL`/`DIRECT_URL` to localhost; production injects its own via `fromDatabase: lifesupply-cc-db` (`render.yaml:58-64`). Detected only when the product owner reported the Pricing Intelligence nav still missing after re-login | **Invalidates every DB-derived claim below and above unless re-run against production.** The bootstrap did **not** reach production, which is the actual reason the nav is hidden: production still has no `pricing.view` row, so `SidebarNav` filters the entries out for everyone. Note `DEPLOY_ENV=production` gates only the script's confirmation prompt — it does not select a database, so it gave no protection here and would not have | Method error | Developer (Claude Code) |
| **F-6** | §2 / engine | **The BigCommerce catalogue carries almost no cost data.** In a 3,000-product sample: **1** product with `cost_price > 0` (0.03%), **2** with `sale_price > 0` (0.07%), and **zero** with both. The nominated product BB V6222 has `cost_price: 0` | **Blocks the pilot, and is a finding about the feature itself.** `positive()` in `recommendation.ts:110` requires `> 0`, so cost `0` is treated as *no cost*: the engine returns `blocked_missing_cost` and generates no recommendation. The margin floor (cost × 1.40) is Pricing Intelligence's primary protection against writing a loss-making price — with no cost data it cannot be computed for effectively the entire catalogue. `sync-products.ts:181` and `variant-mapper.ts:72` show the BigCommerce sync is the **only** writer of `ProductVariant.costPrice`; there is no supplier or QuickBooks path feeding it | **Blocker** (pilot) + design gap (feature) | Product Owner (cost data source) / Developer |
| **F-5** | §4 | **Confirmed in production.** One user account: `vidwadhwani@gmail.com`, active, Super Admin. Every other role has zero users. (The local database's sole user is a different account, `admin@lifesupply.local` — which is how `F-7` should have been caught sooner) | Operator / approver / writer / observer cannot be different people. **Separation of duties cannot be certified by this pilot** — `docs/34` and `docs/30` both require distinct actors | Limitation | Product Owner |

## 11. Final price state

| Field | Value |
|---|---|
| Pre-test sale price (from §2) | Never read — store unreachable |
| Post-write sale price, confirmed in BigCommerce | n/a — no write was attempted |
| Post-rollback sale price, confirmed in BigCommerce | n/a — no rollback was attempted |
| **Final price left on the storefront** | **Unchanged.** No price was written by the Command Center at any point |
| Does the final price match the pre-test price? | Yes, trivially — nothing was written |
| If not — why, and who accepted it | n/a |

## 12. Outcome

| Field | Value |
|---|---|
| All nine critical tests passed? | **No — none was run.** The pilot halted before step A |
| Any abort criterion met? (`docs/34` §7) | Met on first attempt (*"uncertainty about whether credentials point to the intended store"*), then **cleared** — store confirmed as lifesupply.ca. The pilot is now blocked by `F-6`, a data prerequisite rather than an abort criterion |
| Both writeback flags OFF at close | **Yes** — and OFF throughout. Neither was ever enabled |
| Result: **Pass / Fail / Incomplete** | **Incomplete — halted at preflight.** Not a failure of the pricing gates: no gate was exercised. The environment was not in a state where the pilot could legitimately begin |
| Recorded by | Claude Code, 2026-08-23 |
| Date | 2026-08-23 |

**What must be true before this pilot is re-attempted** (in order — each depends on the one before):

Done:

- ~~**`F-7`** — read production state directly.~~ **Done 2026-08-23**, via the Render external connection string.
- ~~**`F-1` / `F-1b`** — working BigCommerce credentials pointing at the intended store.~~ **Already correct in production**; both findings withdrawn.
- ~~**`F-2`** — credentials on the other two connections.~~ **Already present in production**; withdrawn.

Outstanding, in order:

1. ~~**`F-8`** — set `pricing.writebacks` OFF.~~ **Done 2026-08-23** by the product owner.
2. ~~**`F-7b`** — run the pricing bootstrap against production.~~ **Done 2026-08-23** — 9 permissions, 22 grants, `Global default` rule (`F-9`). The UI becomes visible on next sign-in, since permissions are baked into the JWT at login.
3. **`F-6`** — decide where cost comes from. Effectively no product in the BigCommerce catalogue has one (1 in 3,000), so the margin floor cannot be computed and every recommendation returns `blocked_missing_cost`. Options: populate `cost_price` in BigCommerce, or use the built-in **CSV upload** path, where `costSource` records `"upload"` and an operator-supplied cost overrides the catalogue. **For the pilot alone, one truthful cost on one product is enough.** — *Product Owner (the figure) / Developer (the file)*
4. **`F-4`** — merge the `F-10` fix, then run a **full** BigCommerce product sync so the test SKU exists as a BigCommerce-mapped variant. Incremental cannot work here: there is no watermark to be incremental from, and until `F-10` ships it returns 422 regardless. The upload path supplies cost but **cannot** substitute for the sync: the writeback resolves its target from `Product.sourceId` / `ProductVariant.sourceId` on the database rows, not from the CSV's id columns. Note this is a first-time import of ~36,000 products into production. — *Developer*
5. **`F-3`** — re-select the test product from the synced catalogue, preferring a hidden / unpublished SKU over the live one nominated on 2026-08-23. — *Product Owner*
6. **`F-5`** — additional user accounts, or explicit written acceptance that separation of duties will not be certified by this pilot. — *Product Owner*

> **Note on step 3.** Setting a cost purely to unblock the pilot would make the floor a fiction and the guardrail untested. The cost used must be the real landed cost of the test product, or the exercise certifies nothing about the margin floor — which is the single most important gate in the feature.

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
