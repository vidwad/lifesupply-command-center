# 32 — Staging Provisioning and Pricing Certification Prep

**Project:** LifeSupply Command Center
**Prepared:** August 23, 2026
**Status:** Provisioning plan. **No infrastructure has been created.** No Render change has been applied, no credential touched, no flag enabled.

This document exists because the Pricing Intelligence certification session (`docs/29`, `docs/30`, `docs/31`) is a **NO-GO for one reason: no staging environment exists.** It is the plan for removing that blocker.

`docs/21_STAGING_ENVIRONMENT_GUIDE.md` remains the authoritative provisioning runbook. It was written for Phase 11B, before Pricing Intelligence existed, and contains **zero** references to pricing. This document adds the pricing-specific layer on top; it does not replace §4 of docs/21.

---

## 1. Current state — verified 2026-08-23

| Observation | Value |
|---|---|
| Render services | `lifesupply-cc-web`, `lifesupply-cc-worker`, `lifesupply-cc-audit-retention` |
| Render services matching "staging" | **none** |
| Render databases | `lifesupply-cc-db` only |
| `render.staging.yaml` | committed, **never applied** |
| Row `11B-01` | Evidence Required |
| Committed migrations | 25 |
| `pricing.*` permission rows in the only database | **0** of 75 |
| `pricing.intelligence` flag row | **absent** → resolves OFF |
| BigCommerce-mapped variants with cost **and** sale price | **0** |

The database the application currently runs against is production, and the Pricing Intelligence module has never been provisioned in it. That is why the certification cannot start.

---

## 2. Blueprint review — `render.staging.yaml` is sufficient

Reviewed against `render.yaml` on 2026-08-23. Every isolation requirement holds:

| Requirement | Result |
|---|---|
| Staging web service | ✅ `lifesupply-cc-staging-web` |
| Staging worker service | ✅ `lifesupply-cc-staging-worker` |
| Staging cron service | ✅ `lifesupply-cc-staging-audit-retention` (03:45 UTC, offset from production's 03:15 so provider logs are distinguishable) |
| Separate database | ✅ `lifesupply-cc-staging-db`, own `databaseName` and `user` |
| Names cannot be confused with production | ✅ all four prefixed `lifesupply-cc-staging-`; `DEPLOY_ENV=staging` on all three services |
| **Cannot point at `lifesupply-cc-db`** | ✅ **zero references** — every `fromDatabase` names the staging DB |
| No secret values committed | ✅ zero hardcoded key/secret/token/password values |
| `sync: false` used for secrets | ✅ every credential; `AUTH_SECRET` and `MASTER_ENCRYPTION_KEY` use `generateValue: true` so staging gets fresh ones |
| Correct build/start commands | ✅ same Dockerfile; worker overrides to `pnpm worker`; cron to the retention script |
| Same workers/cron as production | ✅ one-for-one |
| **Cannot use production BigCommerce credentials** | ✅ by construction — BigCommerce credentials live in the encrypted vault in the **database**, decrypted with `MASTER_ENCRYPTION_KEY`. Staging has its own database and its own generated key, so a production credential is neither present nor decryptable |
| **Cannot enable high-risk flags by default** | ✅ `seedGovernance` creates every flag with `enabled: false`; `isFeatureOn` resolves an absent row to `false` |

**No blueprint defect found. No change made to `render.staging.yaml`.**

---

## 3. Seed review — complete, no defect

The zero pricing rows in production are **not** a seed defect. The seed is correct and idempotent:

| Seed step | Provides |
|---|---|
| `seedAuth` | Upserts **every** key in `ALL_PERMISSION_KEYS`, which includes all nine `pricing.*` permissions. Grants Super Admin `ALL_PERMISSION_KEYS` |
| `seedGovernance` | Creates a row for every `ALL_FEATURE_FLAG_KEYS` entry with `enabled: false` — including `pricing.intelligence`, `pricing.writebacks`, `external.writebacks` |
| `seedPricing` | Upserts the `Global default` pricing rule: `minCostMultiplier 1.40`, `requiresApproval true`, `autoApproveEligible false`, `enabled true` |

Production simply has never been re-seeded since Pricing Intelligence merged. Running `pnpm db:seed` on a fresh staging database produces a correct starting state.

**Competitors are deliberately not seeded.** A competitor's `termsReviewStatus` is a human legal judgement; seeding one to `reviewed_allowed` would manufacture consent. Step B-2 of `docs/30` creates it by hand.

---

## 4. Decision blockers — Product Owner Required

None of these can be inferred from the repository. All are unresolved as of 2026-08-23.

| ID | Decision | Blocks | Status |
|---|---|---|---|
| `DEC-01` | Confirm Render as the target for staging and production; staging service naming and resource ownership | Applying the blueprint | **Product Owner Required** |
| `DEC-02` | Database plan, backup, and PITR / RTO / RPO assumptions for staging | `11B-01`; the blueprint currently proposes `basic-256mb` | **Product Owner Required** |
| `DEC-03` | Object-storage provider and retention. The `S3_*` slots are declared `sync: false` and left unset | `11B-01` storage line; app treats storage as optional | **Product Owner Required** |
| `DEC-05` | Which BigCommerce store is the staging/sandbox target, and who owns its credentials | `PI-CERT-07`; the entire certification | **Product Owner Required** |
| `DEC-PI-01` | Whether `pricing.writeback_bigcommerce` stays Super-Admin-only or moves to a narrower role | `PI-CERT-07`; production operating model | **Product Owner Required** |
| — | Staging operator (runs the steps) | Session scheduling | **Not named** |
| — | Approver (step F) | `PI-CERT-06` | **Not named** |
| — | Writer (steps G, H, I) | `PI-CERT-07`, `PI-CERT-08` | **Not named** |
| — | Observer (watches audit + logs; may call abort) | Session scheduling | **Not named** |

`DEC-12` (production auto-deploy) is **not** required for staging and is deliberately untouched — `render.yaml` still sets `autoDeploy: true` and this document does not change it.

---

## 5. Resources to provision

Applying `render.staging.yaml` as a **separate Blueprint** creates exactly four resources:

| # | Resource | Type | Plan | Branch |
|---|---|---|---|---|
| 1 | `lifesupply-cc-staging-db` | Postgres 16 | `basic-256mb` (`DEC-02`) | — |
| 2 | `lifesupply-cc-staging-web` | Web (Docker) | `starter` | `release/phase-11-staging` |
| 3 | `lifesupply-cc-staging-worker` | Background worker | `starter` | `release/phase-11-staging` |
| 4 | `lifesupply-cc-staging-audit-retention` | Cron, 03:45 UTC | `starter` | `release/phase-11-staging` |

**Prerequisite:** the branch `release/phase-11-staging` must be cut from an accepted `main` baseline first. It does not exist yet.

Plus one resource outside Render: **a dedicated Inngest environment** for staging, with its own event and signing keys. Reusing production Inngest keys would route staging events to the production worker.

---

## 6. Environment variables and secrets

Generated automatically by the blueprint — never copy these from production:

| Variable | Where |
|---|---|
| `AUTH_SECRET` | staging web (`generateValue`) |
| `MASTER_ENCRYPTION_KEY` | staging web (`generateValue`) |
| `DATABASE_URL`, `DIRECT_URL` | all three services, from `lifesupply-cc-staging-db` |

Set by hand after the first deploy (all `sync: false`):

| Variable | Service(s) | Note |
|---|---|---|
| `MASTER_ENCRYPTION_KEY` | worker, cron | **Must equal the staging web value.** A mismatch means the worker cannot decrypt vault credentials |
| `INNGEST_EVENT_KEY` | web, worker | Staging Inngest environment only |
| `INNGEST_SIGNING_KEY` | worker | Staging Inngest environment only |
| `AUTH_URL`, `NEXT_PUBLIC_APP_URL` | web | The staging URL, after Render assigns it |
| `ANTHROPIC_API_KEY` | web | Staging key so rotation is independent |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL` | web, worker | Or use the vault. Not required for the pricing exercise |
| `S3_*` (five) | web | Leave unset until `DEC-03` |
| `RESEND_API_KEY`, `INVESTOR_FROM_EMAIL` | web | Not required for the pricing exercise |
| `SUPPLIER_PORTAL_BBM01_URL` | web | Leave unset to use the in-repo mock |

**BigCommerce credentials are not environment variables.** They go in the encrypted vault at `/admin/integrations`, per store, and must be **staging/sandbox tokens** (`DEC-05`). Production tokens must never be entered into staging.

---

## 7. Migration and seed commands

After the first staging web deploy:

```sh
# 1. Migrations apply automatically — the Dockerfile CMD runs
#    `prisma migrate deploy && pnpm start` on container start.
#    Confirm rather than assume:
pnpm prisma migrate status        # expect: no pending migrations

# 2. Seed the staging database (11B-06).
pnpm db:seed
```

Expected seed output, all of which is evidence:

- `• 75 permissions` (or however many `ALL_PERMISSION_KEYS` currently holds) — **must include the nine `pricing.*` keys**
- `• feature flags: N new (default OFF)`
- `• pricing: default global rule (<id>)`

Then, before the certification can run, one more step that is **not** part of the seed:

```sh
# 3. Sync BigCommerce products so variants carry sourceId and a cost.
#    Run from /products or the Automation Center in the staging UI.
```

Without step 3 there is no candidate test product — `sourceId` is what DP-6 resolves its write target from.

---

## 8. Pricing module readiness — what must be true before `docs/30` step A

Each of these is checked by the read-only preflight on `/products/pricing/operations`.

| # | Prerequisite | Preflight check | Provided by |
|---|---|---|---|
| 1 | All nine `pricing.*` permission rows exist | `PERM-00` | `pnpm db:seed` |
| 2 | A role grants each pricing permission | `PERM-*` | Seed (Super Admin holds all; see `DEC-PI-01`) |
| 3 | `pricing.intelligence` row exists and can be turned ON | `FLAG-01` | Seed creates it OFF; a human enables it |
| 4 | `pricing.writebacks` row exists and starts OFF | `FLAG-pricing.writebacks` | Seed, `enabled: false` |
| 5 | `external.writebacks` row exists and starts OFF | `FLAG-external.writebacks` | Seed, `enabled: false` |
| 6 | At least one enabled pricing rule | `DATA-02` | `seedPricing` — `Global default` |
| 7 | At least one competitor at `reviewed_allowed` | `DATA-03` | **Human**, step B-2 — never seeded |
| 8 | BigCommerce staging credentials configured, separate from production | `STORE-02` (mapping); credentials checked at first use | **Human**, `/admin/integrations` (`DEC-05`) |
| 9 | Product sync has created variants with `sourceId` | `DATA-01` | **Human**, BigCommerce product sync |
| 10 | One controlled test product with `costPrice` **and a non-null sale price** | `DATA-01` | **Human** — see the warning below |

> **The test product must already have a sale price in BigCommerce.** DP-6B cannot clear a sale price back to null (`CLEARING_SALE_PRICE_SUPPORTED = false`, PRD §7.7). A product starting with no sale price will write successfully at step G and **refuse to roll back** at step I, leaving the test price live until someone clears it by hand.

---

## 9. Evidence to capture

### `11B-01` — staging provisioned

- Render resource inventory: the four service/database **IDs** and names
- A screenshot showing staging and production as separate Blueprints
- The staging Inngest environment name and that the worker appears connected
- Confirmation that `DATABASE_URL` on staging resolves to `lifesupply-cc-staging-db`, not `lifesupply-cc-db`

### `11B-05` — migrations

- Output of `prisma migrate status` on the clean staging database showing **no pending migrations**
- The deploy log section where `prisma migrate deploy` ran, with the applied count
- **Record the actual count observed.** There are 25 committed migrations as of 2026-08-23; the register previously said 21 and has been corrected in this change. Report what you see rather than what a document predicts

### `11B-06` — seed

- Full `pnpm db:seed` console output
- An account inventory: which users exist, which roles, which permissions
- Explicit confirmation that the nine `pricing.*` permission rows exist
- Explicit confirmation that all three pricing-relevant flags exist and are **OFF**

### `PI-CERT` preflight

- Screenshot of the **Staging readiness** card on `/products/pricing/operations` showing zero blockers
- This is step A-1 of `docs/30` and belongs in `docs/31`

---

## 10. Go / no-go criteria before scheduling the certification session

Provisioning may proceed once `DEC-01`, `DEC-02`, and `DEC-03` are recorded.

The **certification session** may be scheduled only when all of the following are true:

1. `11B-01` has a filed resource inventory
2. `11B-05` shows no pending migrations on the staging database
3. `11B-06` shows a completed seed with the nine pricing permissions and three flags present
4. `DEC-05` names the staging BigCommerce store, with staging-only credentials configured
5. `DEC-PI-01` is decided
6. Operator, approver, writer, and observer are named
7. A test product exists with a BigCommerce `sourceId`, a `costPrice`, **and a non-null sale price**
8. The preflight card reports **zero blockers**
9. `pricing.intelligence` is ON; both writeback flags are OFF

Until all nine hold, the session remains **NO-GO**.

---

## 11. What this document does not do

- It applies no Render change. Provisioning is a human action requiring product-owner authorisation.
- It touches no credential, production or otherwise.
- It enables no feature flag.
- It adds no automation, no scheduled job, and no price-writing path.
- It claims no production readiness. Provisioning staging satisfies `11B-01`, not any launch gate in `docs/RELEASE_READINESS_STATUS.md` §6.
