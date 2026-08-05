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
| 11C-01 | Authentication and session review for Auth.js credential login | Ready for Review | Developer / Technical Admin | Written auth review | `docs/22_SECURITY_VERIFICATION_REPORT.md` §1 | None (live re-verification folds into 11C-02) | TBD (Week 2) | TBD | Full code review done; session lifetime + open-redirect hardened this phase |
| 11C-02 | Verify secure cookies, session expiry, failed-login handling, password policy, account disablement, secret rotation | Evidence Required | Developer / Technical Admin | Test results per control | Review: `docs/22` §1; live results TBD | 11B-01 (staging); finding `F-01` open | TBD (Week 2) | TBD | Code-reviewed per control; maxAge 24h set; failed-login audit/lockout is open finding F-01 |
| 11C-03 | Server-side permission enforcement tested for every sensitive module and export route | Ready for Review | Developer / Technical Admin | Route-by-route permission matrix | `docs/22` §2; `src/server/security/route-permissions.test.ts` | None | TBD (Week 2) | TBD | 24/25 routes gated (health allowlisted by design); CI now fails on any ungated new route |
| 11C-04 | Attempted horizontal and vertical privilege escalation per role | Evidence Required | Developer / Technical Admin | Negative-test results per role | Procedure: `docs/22` §11; results TBD | 11B-06 (staging + seeded roles) | TBD (Week 2) | TBD | Must be attempted access in staging — not satisfiable from the repository |
| 11C-05 | Review all customer/financial/investor/supplier export routes | Ready for Review | Developer / Technical Admin | Export route inventory with permission mapping | `docs/22` §2–§3; export assertions in `route-permissions.test.ts` | None | TBD (Week 2) | TBD | All 8 egress routes gated with `*_EXPORT` keys; export audit actions never pruned |
| 11C-06 | Confirm no credential in client bundles, logs, source maps, error responses | Evidence Required | Developer / Technical Admin | Bundle and log scan results | CI scan: `scripts/security/scan-bundle-secrets.mjs` (runs every build); runtime log review TBD | 11B-01 (staging log/source-map half) | TBD (Week 2) | TBD | Client-bundle scan now enforced in CI; staging runtime review outstanding (`GATE-05`) |
| 11C-07 | Validate AES-256-GCM vault behaviour, key-mismatch failure, credential audit events | Ready for Review | Developer / Technical Admin | Vault test results | `src/server/security/secrets.test.ts` (9 tests); review `docs/22` §5 | None | TBD (Week 2) | TBD | Round-trip, key-mismatch, tamper, not-configured all proven; audit events verified in code |
| 11C-08 | Confirm AI source-data filtering by role; review prompt-injection canary tests | Ready for Review | Developer / Technical Admin | AI filtering and canary test results | `docs/22` §6 (citing 5 existing suites) | None | TBD (Week 2) | TBD | Redaction, fencing, marker defusal, read-only canaries all covered by passing tests |
| 11C-09 | Confirm external-action feature flags remain off | Evidence Required | Product Owner | Flag state export from `/admin/feature-flags` | Code posture: `docs/22` §8; live export TBD | 11B-01 (deployed environment) | TBD (Week 2) | TBD | Flags default OFF (tested); smoke workflow fails on high-risk ON; live export needs staging/production |
| 11C-10 | CASL eligibility logic reviewed by qualified Canadian privacy/marketing counsel | Evidence Required | External Advisor | Written legal review | Review package: `src/server/services/marketing/marketing-eligibility.ts` (casl-v1) + `docs/22` §12; counsel review TBD | `DEC-08` (undecided — dependency recorded, no answer assumed) | TBD (Week 2) | TBD | Cannot be satisfied by any agent; blocks live marketing (`GATE-08`) |
| 11C-11 | Privacy-impact assessment proportionate to data stored | Evidence Required | Product Owner | Completed PIA | Starting material: `docs/22` §9 data inventory; PIA TBD | `DEC-08` | TBD (Week 2) | TBD | Owner-performed; retention table doubles as the data inventory input |
| 11C-12 | Retention/deletion rules for PII, audit logs, AI prompts/outputs, exports, supplier screenshots | Ready for Review | Product Owner | Written retention policy | Draft policy: `docs/22` §9 | None | TBD (Week 2) | TBD | Draft covers all named classes; two proposed prune jobs become follow-ups on approval |
| 11C-13 | Written security test matrix passes for all defined roles | Evidence Required | Technical Lead | Completed matrix with pass/fail per role | Matrix skeleton + automated column: `docs/22` §11; live per-role column TBD | 11B-06 (staging + seeded roles) | TBD (Week 2) | TBD | Automated controls all pass; per-role live runs outstanding |
| 11C-14 | High-risk actions require permission + flag + approval + audit evidence | Evidence Required | Technical Lead | Combined control test per high-risk action | Source canaries: `src/server/security/chokepoints.test.ts`; control table `docs/22` §7; live combined tests TBD | 11B-01 (staging) | TBD (Week 2) | TBD | Removing any gate now fails CI; live attempted-action tests outstanding |
| 11C-15 | All critical/high findings closed before production | Evidence Required | Technical Lead | Findings log with dispositions | Findings log: `docs/22` §10 (F-01…F-10 with dispositions) | Open findings F-01 (medium), F-05/F-07/F-08/F-09 (low) | TBD (Week 6) | TBD | 4 findings fixed this phase (F-03/04/06/10); F-01 recommended to close before production |

### 5.4 Phase 11D — Integration certification and data reconciliation

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11D-01 | Explicitly map LifeSupply.ca, Wellmart Medical, and the U.S./Balkowitsch store | Evidence Required | Operations Manager | Store↔connection mapping visible in `/admin/integrations` | Mapping UI + `storeId` FK + `store-mapping.test.ts` [CI]; procedure `docs/23` §3; mapped-state screenshot TBD | `DEC-05`, 11B-01 | TBD (Week 3) | TBD | Repo half done since Phase 2; actual store identities await `DEC-05` |
| 11D-02 | Run BigCommerce incremental sync, then controlled full sync, per store | Evidence Required | Operations Manager | Sync logs per store with terminal statuses | Procedure `docs/23` §3; sync-log ids TBD | 11B-01, 11D-01 | TBD (Week 3) | TBD | Incremental-first order fixed in the procedure |
| 11D-03 | Validate customers, guests, orders, items, products, variants, categories, shipments, refunds, source IDs | Evidence Required | Operations Manager | Field-level validation sheet | Mapper unit tests per entity [CI]; sheet procedure `docs/23` §3; staging comparison TBD | 11D-02 | TBD (Week 3) | TBD | 10 customers/orders/products per store, field-by-field |
| 11D-04 | Reconcile daily and monthly counts, gross sales, discounts, tax, shipping, refunds, net sales | Evidence Required | Finance Manager | Reconciliation report within approved tolerance | Reconciliation workflow + `reconciliation-evaluator.test.ts` [CI]; tolerance options `docs/23` §9; staging reports TBD | 11D-02, `DEC-13` | TBD (Week 3) | TBD | Launch gate `GATE-03`; blocked on `DEC-13` tolerance choice |
| 11D-05 | Spot-check ≥25 orders per store across guest, multi-item, cancelled, partial/full refund, shipped | Evidence Required | Operations Manager | Spot-check sheet with order references | Sheet template `docs/23` §10; filled sheets TBD | 11D-02 | TBD (Week 3) | TBD | Sample composition fixed in the template |
| 11D-06 | Record BigCommerce API duration, retry behaviour, rate-limit handling | Evidence Required | Developer / Technical Admin | Timing and retry log | Procedure `docs/23` §3; finding I-02 recorded (`docs/23` §11); observed log TBD | 11D-02 | TBD (Week 3) | TBD | Client has no 429/retry/timeout handling — certification records behaviour; remediation is 11E if needed |
| 11D-07 | Validate Mailchimp audience mapping and subscriber/unsubscribe/cleaned/complaint/suppression states | Evidence Required | Marketing Manager | State mapping validation sheet | `member-mapper.test.ts` per-state [CI]; procedure `docs/23` §4; staging validation TBD | `DEC-07` | TBD (Week 3) | TBD | |
| 11D-08 | Prove suppression always overrides campaign eligibility | Ready for Review | Marketing Manager | Negative-path test result | Evaluator precedence + query exclusion + NEW export-time re-check, all tested [CI] (`marketing-eligibility.test.ts`, `chokepoints.test.ts`); staging negative-path in `docs/23` §4 | None (staging rerun folds into 11D-07/09) | TBD (Week 3) | TBD | Export-time suppression gap found and fixed this phase (finding I-01); export never auto-sends (canary) |
| 11D-09 | Use a non-customer staging audience for export/draft tests; no live sends | Evidence Required | Marketing Manager | Staging audience identifier and flag state | Rule + procedure `docs/23` §2/§4; audience id + flag export TBD | `DEC-07` | TBD (Week 3) | TBD | `mailchimp.send` must remain off; defaults OFF + kill-switch covered [CI] |
| 11D-10 | Complete QuickBooks OAuth in sandbox or approved read-only production mode | Evidence Required | Finance Manager | OAuth connection record and scope evidence | Procedure `docs/23` §5; consent-screen scope screenshot TBD | `DEC-06` | TBD (Week 4) | TBD | Redirect URI must match the Intuit app registration |
| 11D-11 | Validate P&L, balance-sheet summary, A/R, A/P, aging against QuickBooks reports | Evidence Required | Finance Manager | Side-by-side extraction comparison | `report-extractor.test.ts` [CI]; procedure `docs/23` §5; comparisons TBD | 11D-10 | TBD (Week 4) | TBD | |
| 11D-12 | Reconcile at least three closed monthly periods | Evidence Required | Finance Manager | Three-period reconciliation sheet | Procedure `docs/23` §5; sheets TBD | 11D-10 | TBD (Week 4) | TBD | Accounting source of truth — exact-or-explained, stricter than `DEC-13` commerce tolerance |
| 11D-13 | Document class/division limitations and remaining CSV-only requirements | Evidence Required | Finance Manager | Written limitations note | Note template in `docs/23` §5; content needs the live company file | 11D-11 | TBD (Week 4) | TBD | |
| 11D-14 | Confirm QuickBooks has no write scope and no write path | Ready for Review | Developer / Technical Admin | Scope inspection and code path review | `src/server/security/qbo-read-only.test.ts` [CI]: accounting scope only, sole POST is the OAuth token exchange, all API URLs are `/reports/` reads, `QUICKBOOKS_WRITEBACKS` has zero call sites | None (live scope-grant screenshot folds into 11D-10) | TBD (Week 4) | TBD | Any future write path fails CI until consciously gated |
| 11D-15 | Validate GA4 service-account access, property mapping, date ranges, timezone, currency, source/medium | Evidence Required | Marketing Manager | GA4 configuration validation sheet | `analytics.readonly` scope in client [CI]; procedure `docs/23` §6; validation TBD | `DEC-07` | TBD (Week 4) | TBD | |
| 11D-16 | Reconcile selected GA4 metrics to the GA4 interface for ≥30 days | Evidence Required | Marketing Manager | 30-day reconciliation comparison | Procedure `docs/23` §6; comparison TBD | 11D-15 | TBD (Week 4) | TBD | Directional tolerance — see `DEC-13` Option C |
| 11D-17 | Validate supplier login, SKU search, price/stock capture, mismatch detection, screenshot evidence, layout-change failure | Evidence Required | Operations Manager | Read-only supplier run evidence | Comparison + selector tests [CI]; procedure `docs/23` §7; live read-only run TBD | `DEC-14` | TBD (Week 4) | TBD | `supplier.automation` scope limited to read; mock-portal path until `DEC-14` |
| 11D-18 | Keep supplier order submission disabled | Evidence Required | Product Owner | Flag state evidence | Code posture [CI]: flag defaults OFF, `submitSupplierOrder` unconditionally throws before any portal write, chokepoint canary; deployed flag export TBD | 11B-01 (deployed environment) | TBD (Week 4) | TBD | No live submission path exists in the codebase |
| 11D-19 | Signed certification sheet per integration | Evidence Required | Product Owner | Test date, credential environment, records tested, discrepancies, disposition | Sheet template `docs/23` §10; signed sheets TBD | 11D-02…11D-18 | TBD (Week 4) | TBD | Acceptance criterion — signatures are human-only |
| 11D-20 | No integration sync remains indefinitely in `running` | Evidence Required | Developer / Technical Admin | Sync-log status audit | NEW stuck-sync audit + operator reap tooling, tested [CI] (`stuck-syncs.ts`, Automation Center card); staging rehearsal + end-of-window audit TBD (`docs/23` §8) | 11B-13 | TBD (Week 4) | TBD | Launch gate `GATE-02`; finding I-04 closed this phase |

### 5.5 Phase 11E — Reliability, performance, backup, and disaster recovery

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11E-01 | Load representative data volumes for all three stores | Evidence Required | Developer / Technical Admin | Volume report per entity | Seeder `scripts/perf/seed-volume.ts` + volume table `docs/24` §1; staging run TBD | 11B-01 | TBD (Week 5) | TBD | Deterministic, production-refusing, `--clean` removes exactly the synthetic rows |
| 11E-02 | Test pagination and filters across large tables | Evidence Required | Developer / Technical Admin | Timing results per view | Checklist `docs/24` §2; staging walk TBD | 11E-01 | TBD (Week 5) | TBD | Pagination added in PR #17 |
| 11E-03 | Measure dashboard, table, export, report, reconciliation, forecast performance | Evidence Required | Developer / Technical Admin | Measured timings vs thresholds | Harness `scripts/perf/measure-services.ts` (p50/p95 + JSON evidence); threshold options `docs/24` §3; staging measurements TBD | 11E-01, `DEC-15` | TBD (Week 5) | TBD | Harness measures; thresholds await `DEC-15` |
| 11E-04 | Run simultaneous sync, report, and AI jobs to find contention | Evidence Required | Developer / Technical Admin | Concurrency test results | Procedure `docs/24` §4; staging run TBD | 11E-01 | TBD (Week 5) | TBD | Per-store `limit: 1` bounds worker contention by design |
| 11E-05 | Confirm Inngest retry, idempotency, duplicate-event, timeout, partial-failure handling | Evidence Required | Developer / Technical Admin | Job-behaviour test results showing no duplicate source records | Idempotency model + canaries [CI] (`reliability-canaries.test.ts`, `docs/24` §5); staging duplicate-event/kill-worker tests TBD | 11B-01 | TBD (Week 5) | TBD | Upsert-by-source-id + per-store serialization proven at source level; findings R-02/R-03 recorded |
| 11E-06 | Alerting for web errors, worker crashes, failed syncs, queue backlog, DB capacity, cron and storage failures | Evidence Required | Developer / Technical Admin | Alert configuration and a delivered test alert | Error seam wired [CI] (`instrumentation.ts`, worker handlers, `global-error.tsx`); alert matrix `docs/24` §7; configuration + delivery TBD | `DEC-04` | TBD (Week 5) | TBD | Every captured error is now a structured, alertable log line |
| 11E-07 | Integrate an error-monitoring service before production | Evidence Required | Developer / Technical Admin | Monitoring project receiving events | Vendor-neutral seam ready (`src/server/logger/error-tracking.ts` + call-site wiring [CI]); vendor options `docs/24` §6; account + DSN TBD | `DEC-04` | TBD (Week 5) | TBD | Seam designed so the DEC-04 choice slots in without call-site changes |
| 11E-08 | Take a staging backup and restore it into a new database | Evidence Required | Developer / Technical Admin | Restore drill entry with date and outcome | Drill procedure `docs/24` §8; drill log `docs/OPS_RUNBOOK.md` §9 (still empty) | 11B-01, `DEC-02` | TBD (Week 5) | TBD | Launch gate `GATE-06` |
| 11E-09 | Verify restored login, permissions, integrations, reports, audit history | Evidence Required | Developer / Technical Admin | Post-restore verification checklist | Checklist `docs/24` §8; executed run TBD | 11E-08 | TBD (Week 5) | TBD | Includes vault-decryption check (`MASTER_ENCRYPTION_KEY`) |
| 11E-10 | Test kill switches for worker, AI, supplier automation, campaign export, distribution | Evidence Required | Product Owner | Kill-switch test results without redeployment | Procedure `docs/24` §10; staging run TBD | 11B-01 | TBD (Week 5) | TBD | Finding R-04 (non-transactional flip loop) recorded with mitigation |
| 11E-11 | Document recovery-time and recovery-point objectives | Evidence Required | Product Owner | Written RTO/RPO | Options table `docs/24` §9; decision TBD | `DEC-02` | TBD (Week 5) | TBD | CC-primary data (tasks/approvals/audit/investor) drives the RPO, not re-syncable data |
| 11E-12 | Alerts reach an assigned operator | Evidence Required | Product Owner | Alert receipt confirmation | Matrix `docs/24` §7; named operator + delivered alert TBD | `DEC-09` | TBD (Week 5) | TBD | Launch gate `GATE-07` |

### 5.6 Phase 11F — User acceptance, training, and operating model

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11F-01 | Identify initial production users and assign least-privilege roles | Evidence Required | Product Owner | User/role assignment list | Template `docs/25` §5; list awaits `DEC-10` | `DEC-10` | TBD (Week 6) | TBD | |
| 11F-02 | Operating guides for executive, finance, operations, marketing, product, admin users | Ready for Review | Product Owner | Role-specific guides | `docs/25` §3 (all six roles) | None | TBD (Week 6) | TBD | Expand during training as questions arise |
| 11F-03 | Scenario-based UAT rather than page-by-page review | Evidence Required | Product Owner | Executed UAT scenarios with results | Scripts UAT-01…10 + run-record template `docs/25` §1–§2; execution TBD | 11B-01 | TBD (Week 6) | TBD | Scripts written; execution needs staging + testers |
| 11F-04 | Test briefing, delay triage, customer lookup, reconciliation, financial review, report approval, campaign planning, AI review, supplier exceptions | Evidence Required | Product Owner | Per-workflow UAT results | One scenario per workflow (`docs/25` §2, UAT-01…09); results TBD | 11F-03 | TBD (Week 6) | TBD | UAT-10 adds access-boundary spot checks feeding 11C-04/13 |
| 11F-05 | Confirm which dashboards rely on live, imported, seeded, assumed, or forecast data | Ready for Review | Product Owner | Data-provenance annotation per dashboard | Provenance table `docs/25` §4 | 11D-19 (labels shift as certifications land) | TBD (Week 6) | TBD | Prevents seeded figures being read as actuals; re-verify during UAT |
| 11F-06 | Define ownership of credentials, failed syncs, consent decisions, reconciliation, report approval, incidents | Evidence Required | Product Owner | Ownership matrix with primary and backup | Matrix template `docs/25` §5; names await `DEC-09` | `DEC-09` | TBD (Week 6) | TBD | Acceptance criterion; AI agents may never be owners |
| 11F-07 | Establish support and defect-priority process | Ready for Review | Product Owner | Written severity and response policy | `docs/25` §6 | None | TBD (Week 6) | TBD | Critical/high block cutover by definition |
| 11F-08 | UAT defects classified; critical/high closed | Evidence Required | Product Owner | Defect log with dispositions | Log format `docs/25` §6; populated log TBD | 11F-03 | TBD (Week 6) | TBD | Exit: zero open critical/high |
| 11F-09 | Production seed/demo accounts and data removed or explicitly isolated | Evidence Required | Developer / Technical Admin | Account and data audit | Audit procedure `docs/25` §7; seed guard + perf-seed --clean [CI]; production audit TBD | 11B-06 | TBD (Week 7) | TBD | Launch gate `GATE-09` |

### 5.7 Phase 11G — Controlled production cutover and stabilization

| ID | Requirement | Status | Accountable role | Evidence required | Evidence location | Blocker / dependency | Target date | Decision / approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 11G-01 | Deploy production infrastructure with all high-risk flags off | Evidence Required | Developer / Technical Admin | Deployment record and flag state | Sequence + validation `docs/26` §2.1; execution gated on acceptance | 11A–11F Accepted | TBD (Week 7) | TBD | |
| 11G-02 | Apply migrations and seed only required roles/admin users | Evidence Required | Developer / Technical Admin | Migration and seed logs | `docs/26` §2.2 + GATE-09 audit (`docs/25` §7) | 11G-01 | TBD (Week 7) | TBD | Demo fixtures never reach production |
| 11G-03 | Validate auth, permissions, health, worker registration, cron, storage, monitoring | Evidence Required | Developer / Technical Admin | Post-deploy validation checklist | `docs/26` §2.3 | 11G-01 | TBD (Week 7) | TBD | Includes delivered test alert |
| 11G-04 | Connect one BigCommerce store and run a bounded incremental sync | Evidence Required | Operations Manager | Bounded sync log | `docs/26` §2.4 | 11G-03, `DEC-05` | TBD (Week 7) | TBD | |
| 11G-05 | Reconcile and obtain management sign-off before adding stores | Evidence Required | Finance Manager | Signed reconciliation | `docs/26` §2.5 | 11G-04, `DEC-13` | TBD (Week 7) | TBD | Launch gate `GATE-03` |
| 11G-06 | Add second and third stores sequentially | Evidence Required | Operations Manager | Per-store sync and reconciliation records | `docs/26` §2.6 | 11G-05 | TBD (Week 7) | TBD | |
| 11G-07 | Enable QuickBooks, GA4, Mailchimp read integrations one at a time | Evidence Required | Product Owner | Per-integration enablement record | `docs/26` §2.7 | 11D-19 | TBD (Week 7) | TBD | |
| 11G-08 | Signed production cutover checklist | Evidence Required | Product Owner | Signed checklist | Template `docs/26` §4; signature owner-only | 11G-01…11G-07 | TBD (Week 7) | TBD | Required before any `v1.0.0` tag |
| 11G-09 | Two-week stabilization with daily review | Evidence Required | Product Owner | Daily review log | Checklist + log template `docs/26` §5 | 11G-08 | TBD (Weeks 8–9) | TBD | Rollback events may restart the clock |
| 11G-10 | Formal production-readiness review before expanding scope | Evidence Required | Product Owner | Review minutes and decision | Agenda + record template `docs/26` §6 | 11G-09 | TBD (Week 9) | TBD | Only this record makes "production-ready" a permitted description |
| 11G-11 | Backup, rollback, and incident procedures available to operators | Ready for Review | Technical Lead | Operator-accessible runbook | `docs/OPS_RUNBOOK.md` + `docs/24` §8 + rollback tree `docs/26` §3 | 11E-08 (drill), `DEC-09` (owner) | TBD (Week 7) | TBD | Procedures written; drill + named owner still outstanding |

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
| 2026-08-05 | Phase 11F/11G documentation and release-control package (prepared at the product owner's direction; execution still gated on 11A–11F acceptance): `docs/25_UAT_AND_OPERATING_MODEL.md` (UAT scenarios UAT-01–10 with run records, six role operating guides, dashboard data-provenance table, ownership-matrix template awaiting DEC-09/DEC-10, defect-severity policy, GATE-09 seed/demo audit procedure) and `docs/26_PRODUCTION_CUTOVER_RUNBOOK.md` (go/no-go gate table, seven-step cutover sequence with validations, rollback decision tree, cutover sign-off template, two-week stabilization checklist/log, production-readiness review record). Rows 11F-01–09 and 11G-01–11 moved to Ready for Review / Evidence Required; no row Accepted; no deployment performed; no flag enabled. | Claude Code (Phase 11F/11G) |
| 2026-08-05 | Phase 11E repository-side delivery: `docs/24_RELIABILITY_AND_RECOVERY_PLAN.md` (volume/perf/contention/idempotency procedures, alert matrix, restore-drill checklist for GATE-06, RTO/RPO options for DEC-02, DEC-04 monitoring options, DEC-15 threshold options, findings R-01–R-07). New tooling: `pnpm perf:seed` deterministic volume seeder (production-refusing), `pnpm perf:measure` service-timing harness. Error-reporting seam wired: `src/instrumentation.ts` onRequestError, root `global-error.tsx`, worker process-level handlers; health probe now covers all six external-action flags; reliability canaries added. Runbook §10 now points at the Automation Center stuck-sync reap. Rows 11E-01–12 moved to Evidence Required; no row Accepted; `DEC-02`/`DEC-04`/`DEC-09`/`DEC-15` remain unanswered. | Claude Code (Phase 11E) |
| 2026-08-05 | Phase 11D repository-side delivery: `docs/23_INTEGRATION_CERTIFICATION_WORKBOOK.md` (per-integration certification sheets, staging procedures, DEC-13 tolerance options, findings I-01–I-07). New automated guards: `qbo-read-only.test.ts` (no write scope/path), stuck-sync audit + operator reap tooling with Automation Center card (GATE-02), export-time suppression re-check in `exportCampaignToMailchimp` with per-status tests and chokepoint canaries (finding I-01 fixed), shared suppressed-status constant (I-03 fixed). Rows 11D-01–20 moved to Ready for Review / Evidence Required; no row Accepted; `DEC-05`/`DEC-06`/`DEC-07`/`DEC-13`/`DEC-14` remain unanswered — dependencies recorded, no answers assumed. | Claude Code (Phase 11D) |
| 2026-08-05 | Phase 11C repository-side delivery: `docs/22_SECURITY_VERIFICATION_REPORT.md` (auth/session review, route matrix, export inventory, vault verification, AI posture, chokepoint controls, retention draft, findings log F-01–F-10, role matrix skeleton). New automated guards: `secrets.test.ts`, `route-permissions.test.ts`, `chokepoints.test.ts`; CI client-bundle secret scan (GATE-05). Hardening under the gate-fix freeze exception: session maxAge 24h/updateAge 1h, same-origin `redirectTo`, deployed-environment seed-password guard (GATE-09). Rows 11C-01–15 moved to Ready for Review / Evidence Required; no row Accepted; `DEC-08` remains unanswered. | Claude Code (Phase 11C) |
| 2026-08-04 | Phase 11B repository-side delivery: `render.staging.yaml` staging blueprint, `docs/21_STAGING_ENVIRONMENT_GUIDE.md` (isolation design, connection matrix, provisioning runbook, smoke checklist, migration rehearsal + rollback, DEC-12 options), `.github/workflows/staging-smoke.yml`, CI schema-only `DIRECT_URL` (`BLK-03` resolved pending review), `/api/health` `environment` field. Rows 11B-01–14 moved to Ready for Review / Evidence Required; no row Accepted; `DEC-12` deliberately unanswered. | Claude Code (Phase 11B) |
