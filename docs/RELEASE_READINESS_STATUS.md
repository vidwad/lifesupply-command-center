# Release Readiness Status — LifeSupply Command Center

**Document status:** Active Phase 11 release-readiness register
**Prepared:** August 4, 2026
**Controlling plan:** `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md`
**Repository:** `vidwad/lifesupply-command-center`
**Primary audience:** Product owner, technical lead, Claude Code, Codex

---

## 1. Purpose and standing

This register is the single place where Phase 11 readiness is tracked. Every Phase 11
requirement and every launch gate records its status, accountable role, required evidence,
evidence location, blockers, target date, and approval decision.

**The application is NOT production-ready.** Phases 1–10 are code-complete and merged, which
makes the repository a *release candidate*. Production readiness is a separate, evidence-backed
determination that has not been made and must not be claimed until the launch gates in
§6 are satisfied and signed.

Rules for using this register:

- No row may be moved to **Accepted** without the evidence named in its "Evidence required" cell
  existing at the location named in "Evidence location".
- No row may be marked complete by an AI agent. Agents may propose **Ready for Review**; only the
  product owner or delegated technical lead records **Accepted**.
- `TBD` means genuinely undetermined. It must not be replaced with an assumption.
- Deferrals are only valid as **Deferred by Written Decision**, with the decision recorded in the
  "Decision / approval" cell.

---

## 2. Baseline record (Phase 11A)

| Item | Value |
|---|---|
| Baseline commit SHA | `6db79b24d88a2a267fae839d9e7f962bfbb68c63` |
| Short SHA | `6db79b2` |
| Branch | `main` |
| Baseline content | Merge commit of PR #17 — "Post-roadmap follow-ups: AI output review UI, pagination, accounting-close agent" |
| Baseline date | August 4, 2026, 21:28:34 UTC |
| CI workflow | `.github/workflows/ci.yml` (workflow name `CI`) |
| CI run at baseline | Run `30952484455`, event `push`, branch `main` — **success** |
| CI jobs at baseline | `Typecheck + lint + format + tests` — success; `Production build` — success |
| CI run URL | https://github.com/vidwad/lifesupply-command-center/actions/runs/30952484455 |
| Package manager | pnpm 10.0.0 (`package.json` → `packageManager`) |
| `package.json` version | `0.0.1` — see decision `DEC-11` |

### 2.1 Merged Phase 1–10 history

All roadmap phases are merged into `main`. Verified via `gh pr list --state merged` and
`git log`; each merge commit is an ancestor of the baseline.

| PR | Merge commit | Merged (UTC) | Title |
|---|---|---|---|
| #3 | `54cf726` | 2026-08-04 04:53:33 | Phase 1 — Production worker and deployment foundation |
| #4 | `d4efa3e` | 2026-08-04 05:16:21 | Phase 2 — Store, integration, and sync reconciliation |
| #5 | `abda424` | 2026-08-04 05:38:26 | Phase 3A — Guest customer identity |
| #6 | `ac3ab32` | 2026-08-04 05:53:54 | Phase 3B — Order line items |
| #7 | `4860767` | 2026-08-04 06:09:06 | Phase 3C — Products, variants, and categories |
| #8 | `1624c84` | 2026-08-04 06:23:24 | Phase 3D — Fulfillments, refunds, and transactions |
| #9 | `4a8ce26` | 2026-08-04 06:36:22 | Phase 3E — Reconciliation |
| #10 | `dbdaaec` | 2026-08-04 06:55:07 | Phase 4 — Customer identity, consent, and Mailchimp suppression sync |
| #11 | `c1f2091` | 2026-08-04 15:51:27 | Phase 5 — Full LifeSupply Campaign Builder |
| #12 | `779154a` | 2026-08-04 16:15:58 | Phase 6 — QuickBooks and GA4 read-only API integrations |
| #13 | `4940712` | 2026-08-04 16:41:53 | Phase 7 — Supplier automation production hardening |
| #14 | `96442a2` | 2026-08-04 17:24:02 | Phase 8 — Operations, fulfillment, and customer-service workflow depth |
| #15 | `404788f` | 2026-08-04 18:15:11 | Phase 9 — Management reporting, forecasting, and scenario planning |
| #16 | `f05caea` | 2026-08-04 21:07:56 | Phase 10 — Phase 3 AI agent operating layer |
| #17 | `6db79b2` | 2026-08-04 21:28:34 | Post-roadmap follow-ups: AI output review UI, pagination, accounting-close agent |

Phases 1–10 are retained as historical implementation evidence in
`docs/19_CURRENT_DEVELOPMENT_ROADMAP.md`. They must not be rerun unless the product owner
explicitly reopens a completed phase.

---

## 3. Status vocabulary

These are the only permitted values in the **Status** column.

| Status | Meaning |
|---|---|
| **Not Started** | No work has begun. The work package has not been opened. |
| **In Progress** | Work has begun and is not yet ready for review. |
| **Blocked** | Work cannot proceed until a named blocker or dependency clears. |
| **Evidence Required** | Implementation or design is done, but the required proof does not yet exist — typically because it needs a deployed environment, live credentials, or a business decision. |
| **Ready for Review** | Work and evidence are complete and submitted for product-owner or technical-lead review. |
| **Accepted** | Reviewed and signed off. Recorded only by the product owner or delegated technical lead. |
| **Deferred by Written Decision** | Consciously excluded from the current release, with the decision and rationale recorded in the "Decision / approval" cell. |

**Owner convention.** The "Accountable role" column names a *role*, using the role vocabulary in
`docs/06_SECURITY_AND_PERMISSIONS.md` §4. Named individuals are deliberately **not** invented in
this register. The only named contact currently recorded anywhere in the repository is the owner
entry in `docs/OPS_RUNBOOK.md` §8. Assigning named people to these roles is decision `DEC-09`.

**Target dates.** All target dates are `TBD` pending product-owner scheduling. The indicative week
shown in parentheses is taken from the eight-to-nine-week program in
`docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §7 and is not a committed date.

---

## 4. Release branch and version-tag convention

This convention is **defined but not yet exercised.** No release branch has been cut and no tag has
been created. `git tag -l` on the baseline returns no tags.

### 4.1 Branches

| Branch pattern | Purpose |
|---|---|
| `main` | Integration branch. Always CI-green. Not automatically production-promoted once `DEC-12` is implemented. |
| `agent/*`, `claude/*` | Agent work packages. One Phase 11 work package per branch. |
| `release/phase-11-staging` | First staging release branch, cut from an accepted `main` baseline. Deploys to staging only. |
| `release/phase-11-production` | Production release branch. **Not to be cut until the §6 launch gates are Accepted.** |
| `hotfix/*` | Defect fixes against an active release branch during stabilization. |

### 4.2 Tags

| Tag pattern | Meaning | Environment |
|---|---|---|
| `v0.9.0-staging` | First Phase 11 staging release candidate | Staging only |
| `v0.9.N-staging` | Subsequent staging candidates; increment `N` per redeploy | Staging only |
| `v0.9.N-rc.M` | Release candidate promoted for cutover rehearsal | Staging / rehearsal |
| `v1.0.0` | **Reserved.** First production release. May only be created after Phase 11G cutover sign-off. | Production |

Rules:

- A `-staging` tag never implies production readiness and must not be described as a production release.
- Tags are created from a release branch, never from an agent branch.
- The tag creating a production release requires a signed cutover checklist (`11G-08`).
- `package.json` currently declares version `0.0.1`, which does not match this convention. Aligning
  the package version with the tag scheme is decision `DEC-11`; it is deliberately **not** changed in
  Phase 11A because bumping the version would imply a release that has not been authorised.

---

## 5. Phase 11 readiness register

Granularity: each row is a distinct verifiable requirement drawn from the "Required work" and
"Acceptance criteria" of the corresponding work package in
`docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §4. Closely coupled bullets are grouped into a
single row where they share one piece of evidence.

### 5.1 Phase 11A — Baseline freeze and development-control update

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11A-01 | Confirm `main` contains PRs #3–#17 | Ready for Review | Developer / Technical Admin | Merged-PR list with merge commits, verified as ancestors of baseline | This document §2.1 | None | TBD (Week 1) | TBD | Verified via `gh pr list --state merged` and `git log` |
| 11A-02 | Record authoritative baseline commit SHA | Ready for Review | Developer / Technical Admin | SHA recorded in a controlling document | This document §2 | None | TBD (Week 1) | TBD | `6db79b24d88a2a267fae839d9e7f962bfbb68c63` |
| 11A-03 | Record CI status at the baseline | Ready for Review | Developer / Technical Admin | CI run ID, per-job conclusions, run URL | This document §2 | None | TBD (Week 1) | TBD | Run `30952484455`, both jobs success |
| 11A-04 | `CLAUDE.md` states Phase 11 is the immediate next phase | Ready for Review | Product Owner | Control file with no Phase 1 "next phase" statement | `CLAUDE.md` §2, §9 | None | TBD (Week 1) | TBD | Repository-wide grep for stale next-phase statements is clean |
| 11A-05 | Phase 11 plan retained as the single canonical document | Ready for Review | Product Owner | One Phase 11 plan file, no duplicate under another name | `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` | None | TBD (Week 1) | TBD | No duplicate plan created |
| 11A-06 | Release-readiness register exists with required fields | Ready for Review | Product Owner | This register, with all nine field types | `docs/RELEASE_READINESS_STATUS.md` | None | TBD (Week 1) | TBD | This document |
| 11A-07 | Phase 1–10 roadmap marked implemented but retained | Ready for Review | Product Owner | Archived-status banner on the roadmap | `docs/19_CURRENT_DEVELOPMENT_ROADMAP.md` §1, §2, §4 | None | TBD (Week 1) | TBD | Retained as historical implementation evidence |
| 11A-08 | Release branch and version-tag convention documented | Ready for Review | Technical Lead | Written convention covering staging and production | This document §4 | None | TBD (Week 1) | TBD | Defined only; no branch cut, no tag created |
| 11A-09 | Feature freeze declared until launch gates are met | Ready for Review | Product Owner | Freeze statement in the control file | `CLAUDE.md` §2, §9 | None | TBD (Week 1) | TBD | Exception: defects and gate-required changes |
| 11A-10 | Every Phase 11 gate has an evidence owner and status | Ready for Review | Product Owner | Register rows covering all packages and all §6 gates | This document §5, §6 | Named owners are `DEC-09` | TBD (Week 1) | TBD | Roles assigned; named individuals TBD by design |
| 11A-11 | Release scope and out-of-scope items are explicit | Ready for Review | Product Owner | Enable/disable lists for first production release | `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §6; this document §7 | None | TBD (Week 1) | TBD | Mirrored into §7 for sign-off |

### 5.2 Phase 11B — Staging infrastructure and release pipeline

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11B-01 | Provision staging web, worker, cron, database, Inngest, storage | Evidence Required | Developer / Technical Admin | Staging resource inventory with service IDs | `render.staging.yaml`; inventory TBD after apply | `DEC-01`, `DEC-02`, `DEC-03`; owner-only Render/Inngest steps (`docs/21` §8) | TBD (Week 1) | TBD | Blueprint + runbook ready (PR `claude/phase-11b-staging-foundation`); provisioning not executed |
| 11B-02 | Environment-safe blueprint separation or controlled duplicate process | Ready for Review | Developer / Technical Admin | Separate staging blueprint + isolation design | `render.staging.yaml`; `docs/21_STAGING_ENVIRONMENT_GUIDE.md` §1 | None | TBD (Week 1) | TBD | Two-blueprint design with isolation matrix; production `render.yaml` unchanged pending `DEC-12` |
| 11B-03 | Confirm `DATABASE_URL` / `DIRECT_URL` behaviour for web, worker, migration, cron | Ready for Review | Developer / Technical Admin | Per-process connection matrix | `docs/21_STAGING_ENVIRONMENT_GUIDE.md` §2 | None | TBD (Week 1) | TBD | Only the web container migrates; CI schema-only `DIRECT_URL` added (`BLK-03`) |
| 11B-04 | Set and validate all staging environment variables | Evidence Required | Developer / Technical Admin | Staging variable checklist, values not recorded | `docs/21_STAGING_ENVIRONMENT_GUIDE.md` §3; validation TBD | 11B-01, `DEC-06`, `DEC-07` | TBD (Week 1) | TBD | Checklist written; validation needs a provisioned staging |
| 11B-05 | Run every committed migration on staging | Evidence Required | Developer / Technical Admin | Migration log showing 21/21 applied on a clean staging DB | Procedure: `docs/21` §6.2; log TBD | 11B-01 | TBD (Week 2) | TBD | Rehearsal procedure documented; run needs staging (feeds `GATE-01`) |
| 11B-06 | Seed only approved staging users, roles, flags, synthetic data | Evidence Required | Developer / Technical Admin | Seed run log and account inventory | Policy: `docs/21` §4 step 8; log TBD | 11B-01 | TBD (Week 2) | TBD | Synthetic-only policy documented; execution needs staging |
| 11B-07 | Post-deployment staging smoke-test workflow | Evidence Required | Developer / Technical Admin | Smoke-test workflow file and a passing run | `.github/workflows/staging-smoke.yml`; passing run TBD | 11B-01 | TBD (Week 2) | TBD | Credential-free workflow committed; passing run needs staging |
| 11B-08 | Release approval and rollback steps in the pipeline | Evidence Required | Technical Lead | Documented approval gate and rehearsed rollback | `docs/21_STAGING_ENVIRONMENT_GUIDE.md` §6.3; rehearsal TBD | 11B-01 | TBD (Week 2) | TBD | Approval gate + failure-mode rollback table documented; rehearsal needs staging |
| 11B-09 | Prevent automatic production deploy from every merge to `main` | Evidence Required | Technical Lead | Render auto-deploy configuration evidence | Proposal + exact diffs: `docs/21` §7; Render evidence TBD | `DEC-12` (undecided — dependency recorded, no answer assumed) | TBD (Week 2) | TBD | Options A (autoDeploy false) and B (release branch, recommended) designed; `render.yaml` deliberately unchanged |
| 11B-10 | Staging deployment recreatable from repository instructions | Evidence Required | Developer / Technical Admin | Clean-room rebuild performed from docs alone | Runbook: `docs/21` §4; rebuild record TBD | 11B-01…11B-08 | TBD (Week 2) | TBD | Instructions written; clean-room rebuild needs staging |
| 11B-11 | Web, DB, worker, cron, Inngest all healthy in staging | Evidence Required | Developer / Technical Admin | Health screenshots/logs per service | Checklist: `docs/21` §5.3; captures TBD | 11B-01 | TBD (Week 2) | TBD | Per-service checks defined; `/api/health` now reports `environment` |
| 11B-12 | `/api/health` exposes only non-sensitive information | Ready for Review | Developer / Technical Admin | Reviewed health-endpoint response body | `src/app/api/health/route.ts`; review + sample body: `docs/21` §5.2 | None | TBD (Week 2) | TBD | Code-reviewed this phase; only status enums, uptime, environment label, flag posture — no secrets |
| 11B-13 | A background job reaches a terminal status in staging | Evidence Required | Developer / Technical Admin | Sync log transitioning `running` → terminal state | Procedure: `docs/21` §5.3 row 5; log TBD | 11B-01 | TBD (Week 2) | TBD | Test procedure defined (credential-less sync or delay sweep); run needs staging |
| 11B-14 | Migration and rollback procedures documented and rehearsed | Evidence Required | Technical Lead | Rehearsal record with date and outcome | Procedures: `docs/21` §6; rehearsal record TBD | 11B-05 | TBD (Week 2) | TBD | Documented; rehearsal needs staging |

### 5.3 Phase 11C — Security, privacy, and permissions verification

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11C-01 | Authentication and session review for Auth.js credential login | Not Started | Developer / Technical Admin | Written auth review | TBD | 11B-01 | TBD (Week 2) | TBD | |
| 11C-02 | Verify secure cookies, session expiry, failed-login handling, password policy, account disablement, secret rotation | Not Started | Developer / Technical Admin | Test results per control | TBD | 11B-01 | TBD (Week 2) | TBD | |
| 11C-03 | Server-side permission enforcement tested for every sensitive module and export route | Not Started | Developer / Technical Admin | Route-by-route permission matrix | TBD | None | TBD (Week 2) | TBD | Partly automatable without staging |
| 11C-04 | Attempted horizontal and vertical privilege escalation per role | Not Started | Developer / Technical Admin | Negative-test results per role | TBD | 11B-06 | TBD (Week 2) | TBD | Must be attempted access, not code reading |
| 11C-05 | Review all customer/financial/investor/supplier export routes | Not Started | Developer / Technical Admin | Export route inventory with permission mapping | TBD | None | TBD (Week 2) | TBD | |
| 11C-06 | Confirm no credential in client bundles, logs, source maps, error responses | Not Started | Developer / Technical Admin | Bundle and log scan results | TBD | 11B-01 | TBD (Week 2) | TBD | Launch gate `GATE-05` |
| 11C-07 | Validate AES-256-GCM vault behaviour, key-mismatch failure, credential audit events | Not Started | Developer / Technical Admin | Vault test results | TBD | 11B-01 | TBD (Week 2) | TBD | `docs/06_SECURITY_AND_PERMISSIONS.md` §8 |
| 11C-08 | Confirm AI source-data filtering by role; review prompt-injection canary tests | Not Started | Developer / Technical Admin | AI filtering and canary test results | TBD | None | TBD (Week 2) | TBD | |
| 11C-09 | Confirm external-action feature flags remain off | Not Started | Product Owner | Flag state export from `/admin/feature-flags` | TBD | 11B-01 | TBD (Week 2) | TBD | Launch gate `GATE-10` |
| 11C-10 | CASL eligibility logic reviewed by qualified Canadian privacy/marketing counsel | Not Started | External Advisor | Written legal review | TBD | `DEC-08` | TBD (Week 2) | TBD | Blocks any live campaign — `GATE-08` |
| 11C-11 | Privacy-impact assessment proportionate to data stored | Not Started | Product Owner | Completed PIA | TBD | `DEC-08` | TBD (Week 2) | TBD | |
| 11C-12 | Retention/deletion rules for PII, audit logs, AI prompts/outputs, exports, supplier screenshots | Not Started | Product Owner | Written retention policy | TBD | None | TBD (Week 2) | TBD | `AUDIT_RETENTION_DAYS` defaults to 365 |
| 11C-13 | Written security test matrix passes for all defined roles | Not Started | Technical Lead | Completed matrix with pass/fail per role | TBD | 11C-01…11C-09 | TBD (Week 2) | TBD | Acceptance criterion |
| 11C-14 | High-risk actions require permission + flag + approval + audit evidence | Not Started | Technical Lead | Combined control test per high-risk action | TBD | 11C-03, 11C-09 | TBD (Week 2) | TBD | Acceptance criterion |
| 11C-15 | All critical/high findings closed before production | Not Started | Technical Lead | Findings log with dispositions | TBD | 11C-13 | TBD (Week 6) | TBD | Launch gate `GATE-04` |

### 5.4 Phase 11D — Integration certification and data reconciliation

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11D-01 | Explicitly map LifeSupply.ca, Wellmart Medical, and the U.S./Balkowitsch store | Not Started | Operations Manager | Store↔connection mapping visible in `/admin/integrations` | TBD | `DEC-05` | TBD (Week 3) | TBD | `IntegrationConnection.storeId` exists since Phase 2 |
| 11D-02 | Run BigCommerce incremental sync, then controlled full sync, per store | Not Started | Operations Manager | Sync logs per store with terminal statuses | TBD | 11B-01, 11D-01 | TBD (Week 3) | TBD | |
| 11D-03 | Validate customers, guests, orders, items, products, variants, categories, shipments, refunds, source IDs | Not Started | Operations Manager | Field-level validation sheet | TBD | 11D-02 | TBD (Week 3) | TBD | |
| 11D-04 | Reconcile daily and monthly counts, gross sales, discounts, tax, shipping, refunds, net sales | Not Started | Finance Manager | Reconciliation report within approved tolerance | TBD | 11D-02, `DEC-13` | TBD (Week 3) | TBD | Launch gate `GATE-03` |
| 11D-05 | Spot-check ≥25 orders per store across guest, multi-item, cancelled, partial/full refund, shipped | Not Started | Operations Manager | Spot-check sheet with order references | TBD | 11D-02 | TBD (Week 3) | TBD | |
| 11D-06 | Record BigCommerce API duration, retry behaviour, rate-limit handling | Not Started | Developer / Technical Admin | Timing and retry log | TBD | 11D-02 | TBD (Week 3) | TBD | |
| 11D-07 | Validate Mailchimp audience mapping and subscriber/unsubscribe/cleaned/complaint/suppression states | Not Started | Marketing Manager | State mapping validation sheet | TBD | `DEC-07` | TBD (Week 3) | TBD | |
| 11D-08 | Prove suppression always overrides campaign eligibility | Not Started | Marketing Manager | Negative-path test result | TBD | 11D-07 | TBD (Week 3) | TBD | |
| 11D-09 | Use a non-customer staging audience for export/draft tests; no live sends | Not Started | Marketing Manager | Staging audience identifier and flag state | TBD | 11D-07 | TBD (Week 3) | TBD | `mailchimp.send` must remain off |
| 11D-10 | Complete QuickBooks OAuth in sandbox or approved read-only production mode | Not Started | Finance Manager | OAuth connection record and scope evidence | TBD | `DEC-06` | TBD (Week 4) | TBD | Redirect URI must match the Intuit app registration |
| 11D-11 | Validate P&L, balance-sheet summary, A/R, A/P, aging against QuickBooks reports | Not Started | Finance Manager | Side-by-side extraction comparison | TBD | 11D-10 | TBD (Week 4) | TBD | |
| 11D-12 | Reconcile at least three closed monthly periods | Not Started | Finance Manager | Three-period reconciliation sheet | TBD | 11D-10 | TBD (Week 4) | TBD | |
| 11D-13 | Document class/division limitations and remaining CSV-only requirements | Not Started | Finance Manager | Written limitations note | TBD | 11D-11 | TBD (Week 4) | TBD | |
| 11D-14 | Confirm QuickBooks has no write scope and no write path | Not Started | Developer / Technical Admin | Scope inspection and code path review | TBD | 11D-10 | TBD (Week 4) | TBD | |
| 11D-15 | Validate GA4 service-account access, property mapping, date ranges, timezone, currency, source/medium | Not Started | Marketing Manager | GA4 configuration validation sheet | TBD | `DEC-07` | TBD (Week 4) | TBD | |
| 11D-16 | Reconcile selected GA4 metrics to the GA4 interface for ≥30 days | Not Started | Marketing Manager | 30-day reconciliation comparison | TBD | 11D-15 | TBD (Week 4) | TBD | |
| 11D-17 | Validate supplier login, SKU search, price/stock capture, mismatch detection, screenshot evidence, layout-change failure | Not Started | Operations Manager | Read-only supplier run evidence | TBD | `DEC-14` | TBD (Week 4) | TBD | `supplier.automation` scope limited to read |
| 11D-18 | Keep supplier order submission disabled | Not Started | Product Owner | Flag state evidence | TBD | None | TBD (Week 4) | TBD | |
| 11D-19 | Signed certification sheet per integration | Not Started | Product Owner | Test date, credential environment, records tested, discrepancies, disposition | TBD | 11D-02…11D-18 | TBD (Week 4) | TBD | Acceptance criterion |
| 11D-20 | No integration sync remains indefinitely in `running` | Not Started | Developer / Technical Admin | Sync-log status audit | TBD | 11B-13 | TBD (Week 4) | TBD | Launch gate `GATE-02` |

### 5.5 Phase 11E — Reliability, performance, backup, and disaster recovery

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11E-01 | Load representative data volumes for all three stores | Not Started | Developer / Technical Admin | Volume report per entity | TBD | 11B-01 | TBD (Week 5) | TBD | |
| 11E-02 | Test pagination and filters across large tables | Not Started | Developer / Technical Admin | Timing results per view | TBD | 11E-01 | TBD (Week 5) | TBD | Pagination added in PR #17 |
| 11E-03 | Measure dashboard, table, export, report, reconciliation, forecast performance | Not Started | Developer / Technical Admin | Measured timings vs thresholds | TBD | 11E-01, `DEC-15` | TBD (Week 5) | TBD | Thresholds not yet agreed |
| 11E-04 | Run simultaneous sync, report, and AI jobs to find contention | Not Started | Developer / Technical Admin | Concurrency test results | TBD | 11E-01 | TBD (Week 5) | TBD | |
| 11E-05 | Confirm Inngest retry, idempotency, duplicate-event, timeout, partial-failure handling | Not Started | Developer / Technical Admin | Job-behaviour test results showing no duplicate source records | TBD | 11B-01 | TBD (Week 5) | TBD | |
| 11E-06 | Alerting for web errors, worker crashes, failed syncs, queue backlog, DB capacity, cron and storage failures | Not Started | Developer / Technical Admin | Alert configuration and a delivered test alert | TBD | `DEC-04` | TBD (Week 5) | TBD | |
| 11E-07 | Integrate an error-monitoring service before production | Not Started | Developer / Technical Admin | Monitoring project receiving events | TBD | `DEC-04` | TBD (Week 5) | TBD | Not present at baseline |
| 11E-08 | Take a staging backup and restore it into a new database | Not Started | Developer / Technical Admin | Restore drill entry with date and outcome | `docs/OPS_RUNBOOK.md` §9 (drill log, currently empty) | 11B-01 | TBD (Week 5) | TBD | Launch gate `GATE-06` |
| 11E-09 | Verify restored login, permissions, integrations, reports, audit history | Not Started | Developer / Technical Admin | Post-restore verification checklist | TBD | 11E-08 | TBD (Week 5) | TBD | |
| 11E-10 | Test kill switches for worker, AI, supplier automation, campaign export, distribution | Not Started | Product Owner | Kill-switch test results without redeployment | TBD | 11B-01 | TBD (Week 5) | TBD | `docs/OPS_RUNBOOK.md` §2 |
| 11E-11 | Document recovery-time and recovery-point objectives | Not Started | Product Owner | Written RTO/RPO | TBD | `DEC-02` | TBD (Week 5) | TBD | |
| 11E-12 | Alerts reach an assigned operator | Not Started | Product Owner | Alert receipt confirmation | TBD | `DEC-09` | TBD (Week 5) | TBD | Launch gate `GATE-07` |

### 5.6 Phase 11F — User acceptance, training, and operating model

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11F-01 | Identify initial production users and assign least-privilege roles | Not Started | Product Owner | User/role assignment list | TBD | `DEC-10` | TBD (Week 6) | TBD | |
| 11F-02 | Operating guides for executive, finance, operations, marketing, product, admin users | Not Started | Product Owner | Role-specific guides | TBD | None | TBD (Week 6) | TBD | |
| 11F-03 | Scenario-based UAT rather than page-by-page review | Not Started | Product Owner | Executed UAT scenarios with results | TBD | 11B-01 | TBD (Week 6) | TBD | |
| 11F-04 | Test briefing, delay triage, customer lookup, reconciliation, financial review, report approval, campaign planning, AI review, supplier exceptions | Not Started | Product Owner | Per-workflow UAT results | TBD | 11F-03 | TBD (Week 6) | TBD | |
| 11F-05 | Confirm which dashboards rely on live, imported, seeded, assumed, or forecast data | Not Started | Product Owner | Data-provenance annotation per dashboard | TBD | 11D-19 | TBD (Week 6) | TBD | Prevents seeded figures being read as actuals |
| 11F-06 | Define ownership of credentials, failed syncs, consent decisions, reconciliation, report approval, incidents | Not Started | Product Owner | Ownership matrix with primary and backup | TBD | `DEC-09` | TBD (Week 6) | TBD | Acceptance criterion |
| 11F-07 | Establish support and defect-priority process | Not Started | Product Owner | Written severity and response policy | TBD | None | TBD (Week 6) | TBD | |
| 11F-08 | UAT defects classified; critical/high closed | Not Started | Product Owner | Defect log with dispositions | TBD | 11F-03 | TBD (Week 6) | TBD | |
| 11F-09 | Production seed/demo accounts and data removed or explicitly isolated | Not Started | Developer / Technical Admin | Account and data audit | TBD | 11B-06 | TBD (Week 7) | TBD | Launch gate `GATE-09` |

### 5.7 Phase 11G — Controlled production cutover and stabilization

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11G-01 | Deploy production infrastructure with all high-risk flags off | Not Started | Developer / Technical Admin | Deployment record and flag state | TBD | 11A–11F Accepted | TBD (Week 7) | TBD | |
| 11G-02 | Apply migrations and seed only required roles/admin users | Not Started | Developer / Technical Admin | Migration and seed logs | TBD | 11G-01 | TBD (Week 7) | TBD | |
| 11G-03 | Validate auth, permissions, health, worker registration, cron, storage, monitoring | Not Started | Developer / Technical Admin | Post-deploy validation checklist | TBD | 11G-01 | TBD (Week 7) | TBD | |
| 11G-04 | Connect one BigCommerce store and run a bounded incremental sync | Not Started | Operations Manager | Bounded sync log | TBD | 11G-03 | TBD (Week 7) | TBD | |
| 11G-05 | Reconcile and obtain management sign-off before adding stores | Not Started | Finance Manager | Signed reconciliation | TBD | 11G-04 | TBD (Week 7) | TBD | Launch gate `GATE-03` |
| 11G-06 | Add second and third stores sequentially | Not Started | Operations Manager | Per-store sync and reconciliation records | TBD | 11G-05 | TBD (Week 7) | TBD | |
| 11G-07 | Enable QuickBooks, GA4, Mailchimp read integrations one at a time | Not Started | Product Owner | Per-integration enablement record | TBD | 11D-19 | TBD (Week 7) | TBD | |
| 11G-08 | Signed production cutover checklist | Not Started | Product Owner | Signed checklist | TBD | 11G-01…11G-07 | TBD (Week 7) | TBD | Required before any `v1.0.0` tag |
| 11G-09 | Two-week stabilization with daily review | Not Started | Product Owner | Daily review log | TBD | 11G-08 | TBD (Weeks 8–9) | TBD | |
| 11G-10 | Formal production-readiness review before expanding scope | Not Started | Product Owner | Review minutes and decision | TBD | 11G-09 | TBD (Week 9) | TBD | |
| 11G-11 | Backup, rollback, and incident procedures available to operators | Not Started | Technical Lead | Operator-accessible runbook | `docs/OPS_RUNBOOK.md` | 11E-08, `DEC-09` | TBD (Week 7) | TBD | Acceptance criterion |

---

## 6. Non-negotiable launch gates

Production is a **no-go** while any gate below is not Accepted. Source:
`docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §5.

| ID | Gate (no-go if true) | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval |
|---|---|---|---|---|---|---|---|---|
| GATE-01 | A migration has not been rehearsed on staging | Not Started | Developer / Technical Admin | Staging migration rehearsal log | TBD | 11B-05 | TBD (Week 2) | TBD |
| GATE-02 | A critical integration cannot reach a terminal success/failure state | Not Started | Developer / Technical Admin | Terminal-state evidence per integration | TBD | 11D-20 | TBD (Week 4) | TBD |
| GATE-03 | BigCommerce order/revenue/refund reconciliation is materially unresolved | Not Started | Finance Manager | Reconciliation within agreed tolerance | TBD | 11D-04, `DEC-13` | TBD (Week 3) | TBD |
| GATE-04 | Permission testing identifies unauthorized access to sensitive data | Not Started | Technical Lead | Security matrix with no open critical/high | TBD | 11C-13, 11C-15 | TBD (Week 6) | TBD |
| GATE-05 | Secrets present in source, client bundles, logs, or shared documents | Not Started | Developer / Technical Admin | Secret-exposure scan results | TBD | 11C-06 | TBD (Week 2) | TBD |
| GATE-06 | Backup restoration has not been tested | Not Started | Developer / Technical Admin | Completed restore drill | `docs/OPS_RUNBOOK.md` §9 | 11E-08 | TBD (Week 5) | TBD |
| GATE-07 | There is no assigned incident owner | Not Started | Product Owner | Named incident owner and backup | `docs/OPS_RUNBOOK.md` §8 | `DEC-09` | TBD (Week 6) | TBD |
| GATE-08 | CASL/suppression logic not reviewed before live marketing use | Not Started | External Advisor | Written counsel review | TBD | 11C-10, `DEC-08` | TBD (Week 2) | TBD |
| GATE-09 | Demo credentials or uncontrolled seed accounts remain active | Not Started | Developer / Technical Admin | Account audit showing removal/isolation | TBD | 11F-09 | TBD (Week 7) | TBD |
| GATE-10 | Any external write-back or distribution feature enabled without tested approval and audit controls | Not Started | Product Owner | Flag state plus approval/audit control tests | TBD | 11C-09, 11C-14 | TBD (Week 6) | TBD |

---

## 7. Release scope for the first production release

Recorded here for explicit sign-off. Source: `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §6.

### 7.1 In scope — enable initially

- Secure login and role-based dashboards.
- Read-only BigCommerce synchronization and reconciliation.
- Operations exceptions, tasks, and saved views.
- Read-only QuickBooks, GA4, and Mailchimp integrations, **after** certification.
- Internal reports and forecasts clearly labelled management/unaudited or forecast.
- AI analysis and drafting for approved internal users, with output review.
- Read-only supplier price/stock checks, after controlled validation.

### 7.2 Out of scope — keep disabled

- Customer email sending from the Command Center.
- BigCommerce write-backs.
- QuickBooks write-backs.
- Supplier order submission.
- Investor material distribution.
- AI-initiated external or business-data mutations.
- Autonomous or scheduled AI-agent actions.

Scope approval: **TBD**.

---

## 8. Open readiness blockers

Blockers identified during Phase 11A that are not resolvable by documentation alone.

| ID | Blocker | Impact | Raised | Owner role | Proposed resolution | Status |
|---|---|---|---|---|---|---|
| BLK-01 | `render.yaml` sets `autoDeploy: true` on `main` for web, worker, and cron, so every merge deploys the live environment. This conflicts with Phase 11B requirement "prevent automatic production deployment directly from every merge to `main`" and with the controlled-cutover model in 11G. | Unreviewed code can reach the live environment without a release gate. | 2026-08-04 | Technical Lead | Both candidate fixes designed with exact diffs in `docs/21_STAGING_ENVIRONMENT_GUIDE.md` §7 (Option B recommended); `render.yaml` annotated but deliberately unchanged. Awaiting `DEC-12`, then a one-line blueprint change + sync. | Open — awaiting `DEC-12` |
| BLK-02 | No staging environment exists. The only deployed environment is the live Render stack, so every Phase 11B–11F evidence item currently has nowhere to run. | Blocks the majority of Phase 11 evidence. | 2026-08-04 | Product Owner | `render.staging.yaml` + provisioning runbook (`docs/21` §4) are ready to apply; remaining work is the owner-only Render/Inngest steps in `docs/21` §8. Requires `DEC-01`, `DEC-02`, `DEC-03`. | Open — blueprint ready to apply |
| BLK-03 | `.github/workflows/ci.yml` sets no `DIRECT_URL`, but `prisma/schema.prisma` declares `directUrl = env("DIRECT_URL")`. CI passes today only because `prisma generate` does not resolve `directUrl`; any CI step invoking `prisma migrate`/`validate` would fail with P1012. | Latent CI break the first time migration verification is added to the pipeline. | 2026-08-04 | Developer / Technical Admin | Schema-only `DIRECT_URL` added to the CI env block (PR `claude/phase-11b-staging-foundation`); CI still never opens a DB connection. | Resolved — pending review |
| BLK-04 | No error-monitoring service is integrated at the baseline, though `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §11E requires one before production and `docs/16_DEPLOYMENT_AND_ENVIRONMENT.md` §11 requires error monitoring. | `GATE-07` and 11E-06/11E-07 cannot be satisfied. | 2026-08-04 | Technical Lead | Select and integrate in 11E. Requires `DEC-04`. | Open |
| BLK-05 | `docs/OPS_RUNBOOK.md` §9 restore-drill log is empty and §8 incident contacts list `TBD` for tech lead and hosting owners. | `GATE-06` and `GATE-07` cannot be closed. | 2026-08-04 | Product Owner | Complete in 11E/11F. Requires `DEC-09`. | Open |
| BLK-06 | No named owners exist for any Phase 11 role. Every "Accountable role" in this register is a role, not a person. | No gate can reach **Accepted** without an accountable person. | 2026-08-04 | Product Owner | Assign named owners. Requires `DEC-09`. | Open |
| BLK-07 | Object storage is referenced throughout the plan and `docs/16_DEPLOYMENT_AND_ENVIRONMENT.md` §6, but no `S3_*` values are configured in `render.yaml` for any environment. | Supplier evidence, exports, and report artefacts may not persist as designed. | 2026-08-04 | Technical Lead | `S3_*` variables reserved (`sync: false`) in `render.staging.yaml` so the blueprint carries the slots; app treats storage as optional today (supplier evidence persists in Postgres since Phase 7). Provider choice + bucket provisioning await `DEC-03`. | Open — awaiting `DEC-03` |

---

## 9. Product-owner decisions required

Source: `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` §9, extended with decisions surfaced during
Phase 11A. All are **TBD**.

| ID | Decision | Needed by | Decision | Decided on |
|---|---|---|---|---|
| DEC-01 | Confirm Render as the target for staging and production | 11B | TBD | TBD |
| DEC-02 | Database plan and required backup/PITR capability | 11B | TBD | TBD |
| DEC-03 | Object-storage provider and retention period | 11B | TBD | TBD |
| DEC-04 | Error-monitoring service and alert recipients | 11E | TBD | TBD |
| DEC-05 | The three authoritative BigCommerce stores and credential owners | 11D | TBD | TBD |
| DEC-06 | QuickBooks staging: sandbox or restricted production read access | 11D | TBD | TBD |
| DEC-07 | GA4 properties and Mailchimp audiences | 11D | TBD | TBD |
| DEC-08 | Who performs legal/privacy review of CASL rules | 11C | TBD | TBD |
| DEC-09 | Named owners per role, including production incident owner and backup | 11A/11F | TBD | TBD |
| DEC-10 | Initial production user list and role assignments | 11F | TBD | TBD |
| DEC-11 | Whether `package.json` version tracks the release-tag scheme in §4.2 | 11B | TBD | TBD |
| DEC-12 | Whether production deploys move from `main` auto-deploy to a release branch | 11B | TBD | TBD |
| DEC-13 | Acceptable reconciliation tolerance for BigCommerce and QuickBooks | 11D | TBD | TBD |
| DEC-14 | Whether live supplier-portal read-only testing is authorised, and by whom | 11D | TBD | TBD |
| DEC-15 | Agreed performance thresholds for dashboards, tables, exports, reports | 11E | TBD | TBD |

---

## 10. Change log

| Date | Change | Author |
|---|---|---|
| 2026-08-04 | Register created during Phase 11A. Baseline `6db79b2` recorded, PR #3–#17 history verified, CI status recorded, status vocabulary and release/tag convention defined, blockers `BLK-01`–`BLK-07` and decisions `DEC-01`–`DEC-15` raised. | Claude Code (Phase 11A) |
| 2026-08-04 | Phase 11B repository-side delivery: `render.staging.yaml` staging blueprint, `docs/21_STAGING_ENVIRONMENT_GUIDE.md` (isolation design, connection matrix, provisioning runbook, smoke checklist, migration rehearsal + rollback, DEC-12 options), `.github/workflows/staging-smoke.yml`, CI schema-only `DIRECT_URL` (`BLK-03` resolved pending review), `/api/health` `environment` field. Rows 11B-01–14 moved to Ready for Review / Evidence Required; no row Accepted; `DEC-12` deliberately unanswered. | Claude Code (Phase 11B) |
