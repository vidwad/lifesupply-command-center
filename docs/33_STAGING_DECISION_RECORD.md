# 33 — Staging Decision Record

**Project:** LifeSupply Command Center
**Prepared:** August 23, 2026
**Status:** **`DEC-01`, `DEC-02`, and `DEC-03` recorded 2026-08-23 by the product owner.** All three are scoped to **staging provisioning**. None accepts anything for production, and none accepts a launch gate in `docs/RELEASE_READINESS_STATUS.md` §6.

**Staging baseline:** `main` @ `ff5d3ca6bf8d80a8150a82398157d2a54220e874` (merge of PR #49).

`release/phase-11-staging` **has been cut from that commit** and is unmodified. The Render Blueprint has **not** been applied — that remains an owner-authorised action performed outside this repository.

---

## How to read this document

Three decisions gated staging provisioning. All three are now recorded below **and** in `docs/RELEASE_READINESS_STATUS.md` §9 — a decision counts as recorded only when it appears in both places.

Each section keeps the options and context that were on the table, so a later reader can see what was chosen *against*, not only what was chosen.

**Read the scope lines carefully.** They are not identical:

| Decision | Scope |
|---|---|
| `DEC-01` | **Accepted** for staging provisioning |
| `DEC-02` | **Accepted for staging only.** Production RTO/RPO remains **open** |
| `DEC-03` | **Deferred.** A recorded deferral, *not* an acceptance |

---

## DEC-01 — Render target, staging naming, ownership

**What the repository already proposed**

- Platform: Render, for both environments (`render.yaml`, `render.staging.yaml`).
- Staging resource names: `lifesupply-cc-staging-db`, `-staging-web`, `-staging-worker`, `-staging-audit-retention` — all prefixed so they cannot be mistaken for production at a glance, with `DEPLOY_ENV=staging` on all three services.
- Staging tracks branch `release/phase-11-staging`; production tracks `main`.
- Staging is applied as a **separate Blueprint**, not an addition to the production one.

**What was genuinely undecided:** who owns the staging resources — who pays for them, who may change or delete them, and who is called when staging breaks.

**What this blocked:** applying the blueprint at all (`11B-01`).

- **Decision:** **Accepted for staging provisioning.** Render is the target platform for staging. The committed `render.staging.yaml` naming convention stands: `lifesupply-cc-staging-db`, `lifesupply-cc-staging-web`, `lifesupply-cc-staging-worker`, `lifesupply-cc-staging-audit-retention`. Staging is separate from production and **must be applied as a separate Blueprint**.
- **Owner:** Product Owner — **Vid Wadhwani**. Technical / deployment owner — **Developer / Technical Admin**.
- **Date:** 2026-08-23
- **Rationale:** The platform, the naming, and the separate-Blueprint approach were already what the repository proposed, and the blueprint reviewed clean (`docs/32` §2). What this decision adds is the part that was actually open — named ownership, so a person is accountable for the staging resources rather than an implied one.
- **Evidence / source:** This record; `docs/RELEASE_READINESS_STATUS.md` §9; blueprint review in `docs/32` §2.
- **Scope:** Staging provisioning. Does **not** decide production platform posture, and does **not** touch `DEC-12` (production auto-deploy).

---

## DEC-02 — Database plan, backup, PITR / RTO / RPO

**What the repository proposed**

`render.staging.yaml` requests `plan: basic-256mb` for `lifesupply-cc-staging-db` — the same tier as production.

**The options, from `docs/24_RELIABILITY_AND_RECOVERY_PLAN.md` §9**

| Option | RPO (max data loss) | RTO (max downtime) | Requires |
|---|---|---|---|
| **A — snapshot only** | 24h | ~4h (restore + verify + repoint) | Daily snapshots, base Render plan |
| **B — PITR** | ≤ 15 min | ~2h | A Render plan with point-in-time recovery |
| **C — PITR + rehearsed runbook** | ≤ 15 min | ≤ 1h | Option B, plus quarterly drills and pre-provisioned standby config |

**Context weighed** (from `docs/24` §9): the Command Center is a management and reporting layer — BigCommerce, QuickBooks, and Mailchimp hold the primary records and can be re-synced, so sync-derived data is recoverable. **Command-Center-primary data — tasks, approvals, AI outputs, audit logs, investor records — is not**, and that is what drives the RPO requirement.

**What this blocked:** `11B-01`, and rows `11E-08` / `11E-11` later.

- **Decision (staging):** **Accepted.** Use the database plan currently specified in `render.staging.yaml` — `basic-256mb` — unless Render rejects or deprecates that plan at provisioning time, in which case the operator selects the nearest available tier and **records what was actually provisioned**. Staging is non-production; **no customer-facing production dependency on staging is permitted**. The staging recovery objective is best-effort restore or rebuild from migrations and seed. Evidence must record the database plan and the backup/PITR capability actually available after provisioning.
- **Decision (production):** **OPEN.** Production RTO/RPO is a separate production-readiness decision and is expressly **not** accepted here. The three options above remain on the table for it.
- **Owner:** Product Owner — **Vid Wadhwani**
- **Date:** 2026-08-23
- **Rationale:** Staging exists to be rebuilt. Its data is synthetic or re-derivable from migrations and seed, so point-in-time recovery there buys little. That reasoning deliberately does **not** transfer to production, where Command-Center-primary data cannot be re-synced from any source system — which is why production is left open rather than quietly inheriting the staging choice.
- **Evidence / source:** This record; `docs/RELEASE_READINESS_STATUS.md` §9; options and data-loss context in `docs/24` §9.
- **Scope:** Staging provisioning **only**. Rows `11E-08` and `11E-11` remain blocked on the production half.

---

## DEC-03 — Object-storage provider and retention

**What the repository proposed**

Five `S3_*` variables are declared `sync: false` on staging web and deliberately left unset. The application treats object storage as **optional**, so nothing breaks while this is undecided.

**What was undecided:** the provider (S3, Cloudflare R2, Supabase Storage, or another S3-compatible service), the retention period, and bucket naming — with `docs/21` §1.1 requiring separate staging and production buckets once chosen.

**What this blocked:** the storage component of `11B-01`; `BLK-07`.

- **Decision:** **Deferred for initial staging provisioning.** Leave all five `S3_*` values unset unless a workflow actually under test requires object storage. This is a **recorded deferral, not an acceptance**.
- **Owner:** Product Owner — **Vid Wadhwani**
- **Date:** 2026-08-23
- **Rationale:** Pricing Intelligence staging certification does not touch object storage, and the application treats storage as optional, so nothing in the immediate exercise is blocked by leaving it unset. Provider, bucket, lifecycle rules, and retention policy remain open until required for Product Studio, exports, or production readiness.
- **Evidence / source:** This record; `docs/RELEASE_READINESS_STATUS.md` §9; `docs/21` §1.1 (separate staging/production buckets when chosen); `docs/32` §6.
- **Scope:** Initial staging provisioning. **Not accepted for production readiness.** `11B-01` cannot be evidenced as complete on the storage line while this deferral stands, and `BLK-07` remains open.

---

## Still open — not required to provision staging

These do not block applying the blueprint. They **do** block the Pricing Intelligence certification session (`docs/32` §10).

| ID / role | What is needed | Blocks | Status |
|---|---|---|---|
| `DEC-05` | Which BigCommerce store is the staging/sandbox target, and who owns its credentials. Must be a sandbox or dedicated staging store — never one customers can see | `PI-CERT-07`, the whole session | **Open** |
| `DEC-PI-01` | Whether `pricing.writeback_bigcommerce` stays Super-Admin-only or moves to a narrower role. Today only Super Admin holds it, so the most dangerous steps would run as Super Admin — convenient, and not an operating model | `PI-CERT-07`, production operating model | **Open** |
| Staging operator | Runs `docs/30` steps A–K and records evidence | Session scheduling | **Not named** |
| Approver | Performs step F only. Must differ from the writer if separation of duties is to be certified | `PI-CERT-06` | **Not named** |
| Writer | Performs steps G, H, I — the live price change | `PI-CERT-07`, `PI-CERT-08` | **Not named** |
| Observer | Watches audit log and writeback log live; may call an abort | Session scheduling | **Not named** |

`DEC-12` (production auto-deploy) is deliberately **not** in scope here. Staging does not depend on it, and `render.yaml` is unchanged.

---

## What happens next

Steps 1 and 2 are **done**. Step 3 onward requires explicit product-owner authorisation and cannot be performed from this repository.

1. ~~Update `docs/RELEASE_READINESS_STATUS.md` §9 with the three decisions.~~ **Done 2026-08-23.**
2. ~~Cut `release/phase-11-staging` from the accepted baseline.~~ **Done** — cut from `ff5d3ca6bf8d80a8150a82398157d2a54220e874`, unmodified.
3. Apply `render.staging.yaml` as a **separate** Render Blueprint. *Owner-authorised action.*
4. Create the dedicated staging Inngest environment; copy its two keys.
5. Set the manual env vars, including copying the **staging** `MASTER_ENCRYPTION_KEY` to worker and cron.
6. Confirm `prisma migrate status` reports none pending; run `pnpm db:seed`. Capture output for `11B-05` and `11B-06`.
7. Configure **staging-only** BigCommerce credentials in the vault. Never production tokens.
8. Run a BigCommerce product sync so variants carry `sourceId` and a cost.
9. Open `/products/pricing/operations` and read the preflight card.

Step 9 is where you learn whether the certification session can be booked.

---

## What this document does not do

- It applies no infrastructure. The Render Blueprint has **not** been applied.
- It touches no credential, production or otherwise.
- It enables no feature flag.
- It decides nothing for production. `DEC-02`'s production half is open; `DEC-03` is a deferral, not an acceptance.
- It claims no production readiness. Recording these three decisions advances part of `11B-01`. It accepts **no** launch gate in `docs/RELEASE_READINESS_STATUS.md` §6, and **no** `PI-CERT` row.
