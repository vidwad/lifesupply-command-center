# 33 — Staging Decision Record

**Project:** LifeSupply Command Center
**Prepared:** August 23, 2026
**Status:** **TEMPLATE — no decision has been recorded.** Every `Decision:` field below is blank and must be completed by the product owner. Claude Code prepared the options and the context; it has not decided anything and must not.

**Staging baseline candidate:** `main` @ `ff5d3ca6bf8d80a8150a82398157d2a54220e874` (merge of PR #49).

`release/phase-11-staging` **has not been cut.** It is not created until `DEC-01`, `DEC-02`, and `DEC-03` below are recorded.

---

## How to use this document

Three decisions gate staging provisioning. Each section below gives what the repository already proposes, the real options with their sources, and what the decision blocks — so the choice can be made from evidence rather than from a blank form.

Fill in `Decision`, `Owner`, `Date`, `Rationale`, and `Evidence / source`. Then update the matching row in `docs/RELEASE_READINESS_STATUS.md` §9. A decision is recorded when it appears in **both** places.

---

## DEC-01 — Render target, staging naming, ownership

**What the repository already proposes**

- Platform: Render, for both environments (`render.yaml`, `render.staging.yaml`).
- Staging resource names: `lifesupply-cc-staging-db`, `-staging-web`, `-staging-worker`, `-staging-audit-retention` — all prefixed so they cannot be mistaken for production at a glance, with `DEPLOY_ENV=staging` on all three services.
- Staging tracks branch `release/phase-11-staging`; production tracks `main`.
- Staging is applied as a **separate Blueprint**, not an addition to the production one.

**What is actually undecided**

1. Is Render confirmed as the target for both environments, or is another platform under consideration?
2. Is the `lifesupply-cc-staging-*` naming accepted as-is?
3. **Who owns the staging resources** — who pays for them, who may change or delete them, and who is called when staging breaks?

**What this blocks:** applying the blueprint at all (`11B-01`).

- **Decision:**
- **Owner:**
- **Date:**
- **Rationale:**
- **Evidence / source:**

---

## DEC-02 — Database plan, backup, PITR / RTO / RPO

**What the repository already proposes**

`render.staging.yaml` requests `plan: basic-256mb` for `lifesupply-cc-staging-db` — the same tier as production. That is a placeholder, not a decision.

**The options, from `docs/24_RELIABILITY_AND_RECOVERY_PLAN.md` §9**

| Option | RPO (max data loss) | RTO (max downtime) | Requires |
|---|---|---|---|
| **A — snapshot only** | 24h | ~4h (restore + verify + repoint) | Daily snapshots, base Render plan |
| **B — PITR** | ≤ 15 min | ~2h | A Render plan with point-in-time recovery |
| **C — PITR + rehearsed runbook** | ≤ 15 min | ≤ 1h | Option B, plus quarterly drills and pre-provisioned standby config |

**Context the owner should weigh** (quoted from `docs/24` §9): the Command Center is a management and reporting layer — BigCommerce, QuickBooks, and Mailchimp hold the primary records and can be re-synced, so sync-derived data is recoverable. **Command-Center-primary data — tasks, approvals, AI outputs, audit logs, investor records — is not**, and that is what drives the RPO requirement.

`docs/24` §9 offers this for consideration, **not as a decision**: Option B for production, Option A acceptable for staging.

**This decision has two parts.** Staging and production may legitimately differ, and the record should state both. A staging plan choice does not commit production.

**What this blocks:** `11B-01`, and rows `11E-08` / `11E-11` later.

- **Decision (staging):**
- **Decision (production):**
- **Owner:**
- **Date:**
- **Rationale:**
- **Evidence / source:**

---

## DEC-03 — Object-storage provider and retention

**What the repository already proposes**

Five `S3_*` variables are declared `sync: false` on staging web and deliberately left unset. The application treats object storage as **optional**, so nothing breaks while this is undecided.

**What is undecided**

1. Which provider — S3, Cloudflare R2, Supabase Storage, or another S3-compatible service.
2. Retention period for stored evidence and reports.
3. Bucket naming, and confirmation that **staging and production use separate buckets** (`docs/21` §1.1 requires this).

**Worth knowing before deciding:** the Pricing Intelligence certification exercise does **not** need object storage. `DEC-03` blocks the storage line of `11B-01`, not the pricing session. If the goal is to get the certification unblocked quickly, this decision can be recorded as an explicit deferral — but it must be recorded as one, not silently skipped, or `11B-01` cannot be evidenced completely.

**What this blocks:** the storage component of `11B-01`; `BLK-07`.

- **Decision:**
- **Owner:**
- **Date:**
- **Rationale:**
- **Evidence / source:**

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

## What happens once DEC-01, DEC-02, and DEC-03 are recorded

In order, per `docs/32` §5 and `docs/21` §4:

1. Update `docs/RELEASE_READINESS_STATUS.md` §9 with the three decisions.
2. Cut `release/phase-11-staging` from the accepted baseline — currently `ff5d3ca6bf8d80a8150a82398157d2a54220e874`.
3. Apply `render.staging.yaml` as a **separate** Render Blueprint. *Owner-authorised action; not performed from this repository.*
4. Create the dedicated staging Inngest environment; copy its two keys.
5. Set the manual env vars, including copying the **staging** `MASTER_ENCRYPTION_KEY` to worker and cron.
6. Confirm `prisma migrate status` reports none pending; run `pnpm db:seed`. Capture output for `11B-05` and `11B-06`.
7. Configure **staging-only** BigCommerce credentials in the vault. Never production tokens.
8. Run a BigCommerce product sync so variants carry `sourceId` and a cost.
9. Open `/products/pricing/operations` and read the preflight card.

Step 9 is where you learn whether the certification session can be booked.

---

## What this document does not do

- It records no decision. Every `Decision:` field is blank by design.
- It cuts no branch. `release/phase-11-staging` does not exist.
- It applies no infrastructure and touches no credential.
- It enables no feature flag.
- It claims no production readiness. Recording these three decisions satisfies part of `11B-01` — no launch gate in `docs/RELEASE_READINESS_STATUS.md` §6.
