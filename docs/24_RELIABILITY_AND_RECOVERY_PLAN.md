# 24 — Reliability, Performance, Backup, and Disaster-Recovery Plan

**Project:** LifeSupply Command Center
**Phase:** 11E — Reliability, performance, backup, and disaster recovery
**Prepared:** August 5, 2026
**Status:** Procedures and repository-side tooling ready for staging execution. **No reliability evidence exists yet** — every measurement, drill, and alert test below still has to be run in a provisioned staging environment (BLK-01) and recorded by the accountable person.

Evidence labels as in docs/23: **[CI]** = enforced automatically on every commit; **[STAGING]** = manual evidence still required.

Open decisions this phase depends on (recorded, **not** assumed):

| Decision | Blocks | What is needed |
|---|---|---|
| `DEC-02` | 11E-08, 11E-11 | Database plan and required backup/PITR capability (§9 presents RTO/RPO options) |
| `DEC-04` | 11E-06, 11E-07 | Error-monitoring service and alert recipients (§6 presents options) |
| `DEC-09` | 11E-12, GATE-07 | Named incident owner and backup |
| `DEC-15` | 11E-03 | Agreed performance thresholds (§3 presents options) |

---

## 1. Representative volumes (row 11E-01)

`pnpm perf:seed` (new, `scripts/perf/seed-volume.ts`) loads deterministic synthetic data for three perf stores:

| Entity | Per store | Total (3 stores) |
|---|---|---|
| Customers | 10,000 | 30,000 |
| Products | 2,000 | 6,000 |
| Orders | 25,000 | 75,000 |
| Order items | ~2.5 per order | ~185,000 |
| Tasks / exceptions / audit rows | — | 2,000 / 1,500 / 20,000 |

Safety: refuses `DEPLOY_ENV=production`; every row is tagged `perf_seed` with deterministic ids (re-runs are idempotent); `pnpm perf:seed --clean` removes exactly the synthetic rows; `--scale=0.1` for smoke runs. The perf division/stores are created `inactive` so they don't pollute operating dashboards read by real users.

**[STAGING] procedure:** run `pnpm perf:seed` against the staging database (from a workstation with the staging `DATABASE_URL`, or a one-off job), record row counts, then execute §2–§4.

## 2. Pagination and filter checks at volume (row 11E-02)

With §1 loaded, walk each large view and record load behaviour: orders list (page 1, a deep page, search, status filters), customers list (page 1, type/consent filters, search), products, tasks, exceptions, audit logs (largest table), AI outputs. Confirm pagination stays responsive on deep pages and no view attempts an unbounded fetch. Record any view that degrades in §10 findings.

## 3. Performance measurement (row 11E-03) and DEC-15 threshold options

`pnpm perf:measure` (new, `scripts/perf/measure-services.ts`) times the service layer behind the heaviest pages — executive dashboard, operations summary, orders/customers lists (page 1, deep page, filtered), automation dashboard, reactivation scoring — with warm-up, p50/p95/max, and JSON evidence output. Run after §1 in staging; attach the JSON to the register row.

**DEC-15 options** (thresholds measured at representative volume, service layer, staging hardware):

| Option | Dashboards | Paginated tables | Exports/reports | Note |
|---|---|---|---|---|
| A — standard | p95 ≤ 2.0s | p95 ≤ 1.5s | ≤ 30s / ≤ 60s | Typical internal-tool bar |
| B — strict | p95 ≤ 1.0s | p95 ≤ 0.75s | ≤ 15s / ≤ 30s | May force index/query work before launch |
| C — provisional | Accept measured baseline ±25% as the initial threshold, tighten post-launch | — | — | Fastest to certify; weakest guarantee |

The harness deliberately does not assert thresholds — 11E-03 cannot be dispositioned until DEC-15 is decided.

## 4. Contention test (row 11E-04)

**[STAGING] procedure:** with §1 volume loaded, simultaneously dispatch: a full BigCommerce-style sync for two perf stores (or the delay-sweep at minimum), a board-report generation, and two AI analyst runs. Watch: web latency during the window (re-run `pnpm perf:measure`), worker CPU/memory in Render, Postgres connection count vs plan limit, and Inngest run queue. Record saturation points. The per-store `concurrency: { limit: 1 }` on sync functions bounds worker-side contention by design [CI].

## 5. Job idempotency and retry model (row 11E-05)

**Model [CI]** (guarded by `src/server/security/reliability-canaries.test.ts`):

- Every sync persists via **upsert keyed by source id** (`sourceSystem_sourceId`; GA4 by `storeId_date`; QBO periods by name). Child rows (order items, shipments, variants) upsert then prune with a `deleteMany` scoped to the parent and `sourceId NOT IN (seen)` — re-running a sync, or an Inngest retry, converges to the same state instead of duplicating.
- BigCommerce sync functions are serialized per store (`concurrency: { limit: 1, key: "event.data.storeId" }`), so a retry can never race its own store.
- Supplier portal checks carry `retries: 0` — automatic retries must never hammer a supplier portal; failures surface as exceptions for a human.
- All other functions inherit Inngest's default retries, which is safe **because** of the upsert model above.

**[STAGING] procedure:** (a) send the same sync event twice in quick succession and verify record counts don't double; (b) kill the worker mid-sync, let Render restart it, verify the Inngest retry completes without duplicate rows and the sync log reaches a terminal state (or is caught by the stuck-sync card, docs/23 §8); (c) record results per function.

**Known gaps (findings §10):** QBO financial summaries use a non-atomic find-then-create (R-02); no function declares an Inngest `idempotency` key (R-03) — both bounded by the `limit: 1` serialization, recorded rather than fixed under the feature freeze.

## 6. Error tracking and the DEC-04 seam (rows 11E-06/11E-07)

**Wired this phase [CI]:**

- `src/instrumentation.ts` — Next.js `onRequestError` reports every uncaught server request error through `captureException`.
- `src/app/global-error.tsx` — root error boundary; users get a recoverable page (with the error digest) instead of a blank screen.
- `src/worker.ts` — `unhandledRejection` / `uncaughtException` handlers report through the same seam; uncaught exceptions exit 1 so Render restarts the worker.
- The seam itself (`src/server/logger/error-tracking.ts`) writes structured, secret-redacting pino logs today and is designed for a vendor client to be slotted into `captureException` without touching call sites.

**DEC-04 options** (recorded, not decided):

| Option | Service | Notes |
|---|---|---|
| A | Sentry (SaaS) | Documented swap-in already in the seam header: add `@sentry/nextjs`, run the wizard, replace the seam body. Best Next.js support. |
| B | GlitchTip (self-hosted, Sentry-compatible) | Same SDK; hosting/ops burden on us |
| C | Log-only + Render log alerts | No new vendor; alerting matches on the structured `"captureException"` log line. Weakest triage (no grouping/source maps). |

Until DEC-04 is decided, Option C is effectively live: every captured error is a structured log line that Render log-based alerts can match.

## 7. Alert matrix (rows 11E-06/11E-12, launch gate GATE-07)

| Condition | Signal source | Alert mechanism (owner configures) |
|---|---|---|
| Web 5xx / uncaught request errors | `"captureException"` + `source:"next.onRequestError"` log lines | Render log alert (or DEC-04 service) |
| Worker crash / crash-loop | Render service events; `"worker.fatal"` / `"worker.uncaughtException"` logs | Render notification + log alert |
| Failed syncs | `IntegrationSyncLog.status=failed`; Automation Center "Failed (24h)" | Daily ops check + staging-smoke workflow; alert on repeated failures |
| Stuck syncs (GATE-02) | Automation Center stuck-sync card (docs/23 §8) | Ops check; reap + investigate worker |
| Queue backlog | Inngest dashboard run queue | Inngest notification settings |
| DB capacity / connections | Render Postgres metrics | Render threshold alert |
| Cron failure (audit retention) | Render cron run status (exit 1 on failure) | Render cron-failure notification |
| Storage failures (S3, when DEC-03 lands) | `captureException` from evidence/export writes | Log alert |
| High-risk flag ON in wrong environment | `/api/health` `feature_flags` detail (now covers all six external-action flags) | `staging-smoke.yml` fails on high-risk ON |

**GATE-07:** every alert above must reach the named incident owner/backup (DEC-09, runbook §8 — still TBD). A delivered test alert is the required evidence for 11E-12.

## 8. Backup and restore drill (rows 11E-08/11E-09, launch gate GATE-06)

**[STAGING] procedure:**

1. Confirm the staging Postgres backup posture in Render matches runbook §3.2 (daily snapshot; PITR per DEC-02).
2. Take a manual backup (Render snapshot, or `pg_dump` with the staging URL).
3. Restore into a **new** database instance — never over the source.
4. Point a scratch web service (or local app) at the restored DB and run the post-restore checklist:
   - [ ] Login with a seeded staging account succeeds; a wrong password fails.
   - [ ] Role-gated pages match the permission matrix (spot-check one allowed + one denied route per role).
   - [ ] `/admin/integrations` shows connections and store mappings; credential fields still decrypt (same `MASTER_ENCRYPTION_KEY`) — check "N of M set" badges.
   - [ ] Orders/customers/products counts equal the source DB's counts at backup time.
   - [ ] A saved report renders; audit-log history is present and ends at the backup point.
   - [ ] `/api/health` reports `database: ok` and the expected `environment`.
5. Record the drill in runbook §9 (date, duration, outcome, gaps). This entry is the GATE-06 evidence.

## 9. RTO/RPO options (row 11E-11, DEC-02 — decision required)

| Option | RPO (max data loss) | RTO (max downtime) | Requires |
|---|---|---|---|
| A — snapshot-only | 24h | ~4h (restore + verify + repoint) | Daily snapshots (base Render plan) |
| B — PITR | ≤ 15min | ~2h | Render plan with point-in-time recovery |
| C — PITR + rehearsed runbook | ≤ 15min | ≤ 1h | Option B + quarterly drills + pre-provisioned standby config |

Context for the owner: the Command Center is a management/reporting layer — source systems (BigCommerce, QuickBooks, Mailchimp) hold the primary records and can be re-synced, so lost sync-derived data is recoverable; **Command-Center-primary data (tasks, approvals, AI outputs, audit logs, investor records) is not**, and drives the RPO requirement. Recommendation to consider: Option B for production, Option A acceptable for staging.

## 10. Kill-switch verification (row 11E-10)

**[STAGING] procedure:** enable a low-risk flag (e.g. `forecasting.enabled`), then trip the kill-switch from `/admin/feature-flags` (permission `admin.manage_system_settings`, reason required). Verify — without any redeploy — that: the high-risk flags read OFF, `/api/health` `feature_flags` detail returns "no high-risk flags on", the `feature_flag.kill_switch_tripped` audit row exists, and gated features refuse to run. Repeat the disable check for: worker-driven sync (dispatch refused / run cancelled at pickup), AI actions, supplier automation, campaign export, investor distribution.

Known limitation (finding R-04): the kill-switch flips flags in a loop, not a transaction — a mid-loop DB failure could leave a partial lockout. Mitigation: re-trip until the audit row lists zero `flippedKeys`.

## 11. Findings (Phase 11E)

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| R-01 | — (closed) | No instrumentation hook, no error boundaries, no process-level rejection handlers — server errors could die silently | **Fixed this phase** — §6 wiring, canary-guarded |
| R-02 | Low | QBO financial summaries persist via non-atomic findFirst→update/create (no unique constraint) | Bounded by `concurrency: limit 1`; add a unique constraint + upsert post-freeze |
| R-03 | Low | No Inngest `idempotency` keys declared | Safe today via upsert model + per-store serialization [CI]; revisit if concurrency ever widens |
| R-04 | Low | Kill-switch flag loop is not transactional | Documented mitigation §10; wrap in `$transaction` post-freeze |
| R-05 | Low | `/api/health` does not observe worker liveness or queue depth | Mitigated by Inngest dashboard + stuck-sync card; a worker-heartbeat row is a post-freeze candidate |
| R-06 | — (closed) | `INVESTOR_DISTRIBUTION` was missing from the health high-risk probe list | **Fixed this phase** — probe now covers all six external-action flags, canary-guarded |
| R-07 | Info | Structured pino logger adopted in only a handful of server files; most rely on the seam + console | Acceptable — `captureException` is the alerting chokepoint; broaden adoption opportunistically |

## 12. Steps only the product owner (or named humans) can perform

1. **Decide DEC-02** (backup/PITR plan → §9 option), **DEC-04** (error-monitoring service + recipients → §6 option), **DEC-09** (incident owner + backup → runbook §8), **DEC-15** (performance thresholds → §3 option).
2. Provision staging (BLK-01) — every [STAGING] item depends on it.
3. Configure the §7 alert mechanisms in Render/Inngest (and the DEC-04 service, once chosen) and send a test alert to the named operator (GATE-07 / 11E-12 evidence).
4. Run the §1–§5 volume, performance, contention, and idempotency procedures in staging and attach the evidence.
5. Execute the §8 backup-restore drill and record it in runbook §9 (GATE-06 evidence).
6. Execute the §10 kill-switch verification and record results.
7. Record row dispositions in `docs/RELEASE_READINESS_STATUS.md` — acceptance is owner-only.
