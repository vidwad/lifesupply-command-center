# LifeSupply Command Center

## Phase 11 — Deployment Readiness, Integration Validation, and Controlled Production Launch

**Prepared:** August 4, 2026  
**Repository:** `vidwad/lifesupply-command-center`  
**Authoritative baseline:** `main` at commit `6db79b24d88a2a267fae839d9e7f962bfbb68c63` (merge of PR #17)  
**Status:** Active controlling plan. Phase 11 is the sole active workstream.  
**Readiness register:** `docs/RELEASE_READINESS_STATUS.md`

---

## 1. Executive conclusion

The LifeSupply Command Center has moved well beyond an MVP. All ten phases in `docs/19_CURRENT_DEVELOPMENT_ROADMAP.md` have been implemented and merged, including production-worker configuration, multi-store mapping, complete BigCommerce commerce synchronization, consent and Mailchimp controls, campaign planning, QuickBooks and GA4 read integrations, supplier-automation hardening, operations workflows, forecasting, reporting, and a guarded AI-agent layer.

The principal risk is no longer missing application breadth. It is the difference between code-complete and operationally deployable. Many integrations and migrations have been validated through unit tests, fixtures, builds, or sandbox logic but have not yet been proven together against a dedicated staging environment using representative data and production-like credentials. The next stage should therefore be a controlled production-readiness program, not another broad feature-development cycle.

The recommended next stage is **Phase 11 — Deployment Readiness, Integration Validation, and Controlled Production Launch**, divided into seven tightly governed work packages:

1. Baseline and roadmap reconciliation.
2. Staging infrastructure and release pipeline.
3. Security, privacy, and access-control validation.
4. Live integration and data-reconciliation validation.
5. Reliability, performance, backup, and disaster-recovery validation.
6. Business user acceptance and operational readiness.
7. Controlled production cutover and stabilization.

No additional strategic modules should be added until the Phase 11 go-live gates are satisfied.

---

## 2. Evidence-based current-state assessment

### 2.1 What is complete in the repository

Recent merged work demonstrates that the original roadmap sequence has been completed:

| Roadmap area | Current evidence |
|---|---|
| Production worker | Render worker, Inngest Connect, environment guidance, verification and stalled-job runbook merged in Phase 1 |
| Multi-store mapping | Explicit `IntegrationConnection.storeId` mapping and validation merged in Phase 2 |
| Commerce data foundation | Guest identity, order items, catalog, shipments/refunds, and reconciliation merged through Phase 3E |
| Consent and suppression | CASL-oriented consent model and Mailchimp read sync merged in Phase 4 |
| Campaign Builder | Structured consumer/B2B reactivation program builder merged in Phase 5 |
| QuickBooks and GA4 | Read-only OAuth/service-account integrations and worker jobs merged in Phase 6 |
| Supplier automation | Read-only checks, durable evidence, exception creation, and kill-switch posture merged in Phase 7 |
| Operations workflows | Delay sweeps, task routing, exception lifecycle, saved views, customer-service workflows merged in Phase 8 |
| Reporting and forecasting | Versioned scenarios, approval gates, board and investor/lender packages merged in Phase 9 |
| AI operating layer | Read-only agent registry, structured outputs, permission filtering, prompt-injection controls, review UI merged in Phase 10 and follow-up PR #17 |

The latest follow-up reports 313 passing tests and a successful production build. That is a strong development baseline, but it is not yet proof of production readiness.

### 2.2 Documentation that was stale — resolved in Phase 11A

> **Resolved 2026-08-04 (Phase 11A).** `CLAUDE.md` and `docs/19_CURRENT_DEVELOPMENT_ROADMAP.md` previously described Phase 1 as the immediate next phase even though Phases 1–10 and post-roadmap follow-ups were already merged. That was a development-control risk: a new agent session could have repeated completed work. Both documents now state the current position, and a repository-wide check finds no remaining "Phase 1 is next" statement.

The controlling documents state, and must continue to state:

- Phases 1–10 are code-complete and merged, and are retained as historical implementation evidence.
- The application is code-complete for the original roadmap but is **not** yet declared production-ready.
- Phase 11 is the sole active workstream.
- Feature expansion is frozen except for defects or changes required to pass a Phase 11 launch gate.
- Work proceeds one Phase 11 work package at a time.

Further documentation reconciled during Phase 11A:

- `docs/16_DEPLOYMENT_AND_ENVIRONMENT.md` — deployment platform and environment-variable names aligned with the implemented configuration.
- `docs/DEPLOYMENT_VERCEL.md` — marked as a non-selected alternative rather than *the* production runbook.
- `docs/OPS_RUNBOOK.md` §8 — hosting rows completed from deployment evidence; human contacts remain `TBD`.

### 2.3 Main readiness gaps

The following must be treated as unresolved until verified with evidence:

- Render staging and production resources actually provisioned from the current blueprint.
- Dedicated web, worker, cron, PostgreSQL, and Inngest services operating together.
- All pending Prisma migrations successfully rehearsed on a staging clone.
- Staging and production secrets separated, complete, and rotated where necessary.
- BigCommerce synchronization proven against each intended store with representative data volumes.
- QuickBooks OAuth and reports sync proven in sandbox or a controlled read-only production connection.
- GA4 service-account access and store/property mappings proven.
- Mailchimp audience, suppression, and campaign metrics read sync proven.
- Supplier portal automation proven against the actual portal without order submission.
- CASL eligibility policy reviewed by a qualified Canadian privacy/marketing-law adviser before any live campaign.
- Role and permission matrix validated by attempted unauthorized access, not merely by code inspection.
- Backup creation and restoration actually tested.
- Performance proven with realistic order, customer, item, product, audit-log, and AI-output volumes.
- Operational ownership, escalation, and user training completed.

---

## 3. Recommended deployment architecture

Use Render as the primary operating environment for the current architecture because the application requires a continuously running background worker and Playwright/Chromium capability.

### Staging

- `lifesupply-cc-staging-web`
- `lifesupply-cc-staging-worker`
- `lifesupply-cc-staging-audit-retention`
- Dedicated staging PostgreSQL database
- Dedicated Inngest staging environment
- Separate staging object-storage bucket
- Sandbox or read-only integration credentials
- Test email sender/domain that cannot reach real customer lists
- All external write-back and distribution flags off

### Production

- `lifesupply-cc-web`
- `lifesupply-cc-worker`
- `lifesupply-cc-audit-retention`
- Dedicated production PostgreSQL database with backup/PITR support
- Dedicated Inngest production environment
- Dedicated private object-storage bucket
- Production credentials held in Render secrets or the approved encrypted vault
- Custom domain and HTTPS
- Error monitoring and operational alerts

Staging and production must never share databases, Inngest keys, storage buckets, auth secrets, encryption keys, supplier credentials, email audiences, or OAuth redirect registrations.

---

## 4. Phase 11 work packages

## 11A — Baseline freeze and development-control update

**Delivery:** branch `agent/phase-11-deployment-readiness-plan`, PR #18. Phase 11A is delivered on the
existing Phase 11 branch rather than a new one, to avoid a duplicate plan document and a second
pull request.

### Objective

Create an authoritative code and documentation baseline for deployment readiness.

### Required work

- Confirm `main` contains PRs #3 through #17.
- Record the baseline commit SHA and successful CI status.
- Update `CLAUDE.md` so Phase 11 is the immediate next phase.
- Add `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` using this plan as the basis.
- Add `docs/RELEASE_READINESS_STATUS.md` with owner, status, evidence link, blocker, and decision fields.
- Mark the old Phase 1–10 roadmap as implemented but retain it as historical development evidence.
- Create a release branch or tag convention, such as `release/phase-11-staging` and `v0.9.0-staging`.
- Freeze new features until launch gates are met.

### Acceptance criteria

- No controlling document identifies Phase 1 as the next phase.
- Every Phase 11 gate has an evidence owner and status.
- CI passes on the recorded baseline.
- Release scope and out-of-scope items are explicit.

### Scope boundary

Phase 11A is documentation and development control only. It does not provision infrastructure, cut a
release branch, create a tag, configure credentials, or change product behaviour. The branch and tag
convention is *defined* in `docs/RELEASE_READINESS_STATUS.md` §4 and deliberately left unexercised.

## 11B — Staging infrastructure and release pipeline

### Objective

Create a complete production-like staging environment and prove repeatable deployment.

### Required work

- Provision staging web, worker, cron, database, Inngest, and private storage.
- Separate the existing Render blueprint into environment-safe configuration or document a controlled duplicate-blueprint process.
- Confirm `DATABASE_URL` and `DIRECT_URL` behavior for web, worker, migration, and cron processes.
- Set and validate staging auth, encryption, Inngest, email, AI, storage, and integration variables.
- Run every committed migration in staging.
- Seed only approved staging users, roles, permissions, feature flags, and synthetic data.
- Add a staging smoke-test workflow after deployment.
- Add release approval and rollback steps.
- Prevent automatic production deployment directly from every merge to `main` until the stabilization period is complete.

### Acceptance criteria

- A clean staging deployment can be recreated from repository instructions.
- Web, database, worker, cron, and Inngest show healthy status.
- `/api/health` reports only non-sensitive health information.
- A background test job progresses from queued/running to a terminal status.
- Migration and rollback procedures are documented and rehearsed.

## 11C — Security, privacy, and permissions verification

### Objective

Prove that sensitive operational, financial, customer, investor, supplier, and AI data is protected in practice.

### Required work

- Complete an authentication and session review for Auth.js credential login.
- Confirm secure cookies, session expiry, failed-login handling, password policy, account disablement, and secret rotation procedures.
- Test server-side permission enforcement for every sensitive module and export route.
- Attempt horizontal and vertical privilege escalation using test accounts for each role.
- Review all routes that export customer, financial, investor, or supplier data.
- Confirm every credential is server-side and absent from client bundles, logs, source maps, and error responses.
- Validate AES-256-GCM vault behavior, key mismatch failure, and credential audit events.
- Confirm AI source-data filtering by role and review prompt-injection canary tests.
- Confirm external-action feature flags remain off.
- Review CASL eligibility logic with qualified counsel before enabling customer campaign exports or sends.
- Complete a privacy-impact assessment proportionate to the data actually stored.
- Define retention and deletion rules for customer PII, audit logs, AI prompts/outputs, exports, and supplier screenshots.

### Acceptance criteria

- A written security test matrix passes for all defined roles.
- No secret or sensitive field is exposed through client code or logs.
- High-risk actions require permission, flag, approval, and audit evidence.
- CASL and privacy review decisions are documented.
- All critical/high findings are closed before production.

## 11D — Integration certification and data reconciliation

### Objective

Prove each external integration independently and then prove end-to-end data integrity.

### BigCommerce certification

- Explicitly map LifeSupply.ca, Wellmart Medical, and the U.S./Balkowitsch store as applicable.
- Run incremental sync first, followed by controlled full sync.
- Validate customers, guests, orders, items, products, variants, categories, shipments, refunds, and source IDs.
- Reconcile daily and monthly order counts, gross sales, discounts, tax, shipping, refunds, and net sales.
- Spot-check at least 25 orders per store, including guest, multi-item, cancelled, partially refunded, fully refunded, and shipped orders.
- Record API duration, retry behavior, and rate-limit handling.

### Mailchimp certification

- Validate audience mapping and subscriber, unsubscribe, cleaned, complaint, and suppression states.
- Prove suppression always overrides campaign eligibility.
- Use a non-customer staging audience for any export or draft test.
- Do not enable live sends.

### QuickBooks certification

- Complete OAuth in sandbox or approved read-only production mode.
- Validate P&L, balance-sheet summary, A/R, A/P, and aging extraction against QuickBooks reports.
- Reconcile at least three closed monthly periods.
- Document class/division limitations and any remaining CSV-only requirements.
- Confirm there is no write scope or write path.

### GA4 certification

- Validate service-account access, property mapping, date ranges, timezone, currency, and source/medium aggregation.
- Reconcile selected metrics to the GA4 interface for at least 30 days.

### Supplier portal certification

- Validate login, SKU search, price capture, stock capture, mismatch detection, screenshot evidence, and layout-change failure handling.
- Keep supplier order submission disabled.
- Run only approved read-only tests against the live supplier portal.

### Acceptance criteria

- Each integration has a signed certification sheet with test date, credential environment, records tested, discrepancies, and disposition.
- Reconciliation differences are within approved tolerances or explained.
- No integration sync remains indefinitely in `running`.
- All mappings are explicit and visible to administrators.

## 11E — Reliability, performance, backup, and disaster recovery

### Objective

Prove the platform remains reliable under representative operating conditions and can recover from failure.

### Required work

- Load representative data volumes for all three stores.
- Test pagination and filters across large customers, orders, products, tasks, exceptions, audit logs, and AI outputs.
- Measure dashboard, table, export, report, reconciliation, and forecast performance.
- Run simultaneous sync, report, and AI jobs to identify database or worker contention.
- Confirm Inngest retry, idempotency, duplicate-event, timeout, and partial-failure handling.
- Set alerting for web errors, worker crashes, failed syncs, queue backlog, database capacity, cron failures, and storage failures.
- Integrate an error-monitoring service such as Sentry before production.
- Take a staging database backup and restore it into a new database.
- Verify restored login, permissions, integrations, reports, and audit history.
- Test disabling worker, AI, supplier automation, campaign export, and external distribution using kill switches.
- Document recovery-time and recovery-point objectives.

### Acceptance criteria

- Agreed performance thresholds are met with representative volume.
- Retry and idempotency tests do not duplicate source records.
- Backup restoration is successfully demonstrated.
- Alerts reach an assigned operator.
- Kill switches can be applied without a new code deployment.

## 11F — User acceptance, training, and operating model

### Objective

Confirm that LifeSupply personnel can safely operate the system and interpret its outputs.

### Required work

- Identify initial production users and assign least-privilege roles.
- Prepare short operating guides for executive, finance, operations, marketing, product, and administrator users.
- Run scenario-based UAT rather than page-by-page visual review.
- Test daily briefing, delayed-order triage, customer lookup, reconciliation, financial review, report approval, campaign planning, AI output review, and supplier exception handling.
- Confirm which dashboards rely on live data, imported data, seeded data, assumptions, or forecasts.
- Define who owns integration credentials, failed syncs, customer consent decisions, financial reconciliation, report approval, and production incidents.
- Establish a support and defect-priority process.

### Acceptance criteria

- Every critical workflow has a business owner and backup owner.
- UAT defects are classified and critical/high defects are closed.
- Users understand that AI outputs and forecasts require review.
- Production seed/demo accounts and data are removed or explicitly isolated.

## 11G — Controlled production cutover and stabilization

### Objective

Launch the platform with limited scope, rapid rollback, and enhanced monitoring.

### Recommended launch sequence

1. Deploy production infrastructure with all high-risk feature flags off.
2. Apply migrations and seed only required roles/admin users.
3. Validate authentication, permissions, health checks, worker registration, cron, storage, and monitoring.
4. Connect one BigCommerce store and run a bounded incremental sync.
5. Reconcile and obtain management sign-off.
6. Add the second and third stores sequentially.
7. Enable QuickBooks, GA4, and Mailchimp read integrations one at a time.
8. Keep campaign sending, BigCommerce write-back, QuickBooks write-back, investor distribution, AI actions, and supplier order submission disabled.
9. Operate a two-week stabilization period with daily review.
10. Hold a formal production-readiness review before expanding permissions or enabling any external action.

### Acceptance criteria

- Production cutover checklist is signed.
- No unresolved critical/high security or data-integrity defect exists.
- Production totals reconcile to source systems.
- Backup, rollback, and incident procedures are available to operators.
- Stabilization metrics remain within approved thresholds.

---

## 5. Non-negotiable launch gates

Production should be a **no-go** if any of the following applies:

- A migration has not been rehearsed on staging.
- A critical integration cannot reach a terminal success/failure state.
- BigCommerce order/revenue/refund reconciliation is materially unresolved.
- Permission testing identifies unauthorized access to customer, financial, investor, supplier, or admin data.
- Secrets are present in source, client bundles, logs, or shared documents.
- Backup restoration has not been tested.
- There is no assigned incident owner.
- CASL/suppression logic has not been reviewed before live marketing use.
- Demo credentials or uncontrolled seed accounts remain active.
- Any external write-back or distribution feature is enabled without its approval and audit controls being tested.

---

## 6. Recommended launch scope

The first production release should be deliberately narrow:

### Enable initially

- Secure login and role-based dashboards.
- Read-only BigCommerce synchronization and reconciliation.
- Operations exceptions, tasks, and saved views.
- Read-only QuickBooks, GA4, and Mailchimp integrations after certification.
- Internal reports and forecasts clearly labeled as management/unaudited or forecast.
- AI analysis and drafting for approved internal users, with output review.
- Read-only supplier price/stock checks after controlled validation.

### Keep disabled initially

- Customer email sending from the Command Center.
- BigCommerce write-backs.
- QuickBooks write-backs.
- Supplier order submission.
- Investor material distribution.
- AI-initiated external or business-data mutations.
- Autonomous or scheduled AI-agent actions.

---

## 7. Suggested timeline

| Week | Focus | Exit result |
|---|---|---|
| 1 | 11A baseline; 11B staging infrastructure | Repeatable staging deployment and current control documents |
| 2 | 11C security/permissions; migration rehearsal | Security matrix and clean staging migration |
| 3 | BigCommerce and Mailchimp certification | Commerce and consent reconciliation evidence |
| 4 | QuickBooks, GA4, supplier certification | Read integrations and supplier checks certified |
| 5 | 11E performance, backup, alerts, recovery | Restore test and reliability report |
| 6 | 11F UAT, training, operating ownership | Business sign-off and resolved launch blockers |
| 7 | 11G controlled cutover | Limited production launch |
| 8–9 | Stabilization | Formal production-readiness acceptance |

This is an indicative eight-to-nine-week program. It can be compressed if infrastructure and credentials are already available, but the go/no-go gates should not be compressed.

---

## 8. Claude Code execution sequence

Claude Code should run one work package at a time on a dedicated branch. It should not implement all of Phase 11 in one session.

### Prompt 1 — Baseline and control-document update — COMPLETE

> Delivered on branch `agent/phase-11-deployment-readiness-plan` via PR #18 on 2026-08-04. Retained
> for the record. The original text proposed a new branch `claude/phase-11a-readiness-baseline`;
> the product owner directed delivery on the existing Phase 11 branch instead, so no second branch
> or duplicate pull request was created.

```text
Read CLAUDE.md, docs/19_CURRENT_DEVELOPMENT_ROADMAP.md, the merged PRs #3 through #17, docs/16_DEPLOYMENT_AND_ENVIRONMENT.md, docs/DEPLOYMENT_RENDER.md, docs/OPS_RUNBOOK.md, docs/06_SECURITY_AND_PERMISSIONS.md, and docs/15_TESTING_AND_QA_PLAN.md.

The prior roadmap phases are complete. Run Phase 11A only: reconcile the controlling documentation with the current main branch, add docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md and docs/RELEASE_READINESS_STATUS.md, mark Phases 1–10 implemented, and declare Phase 11 the active workstream. Do not add product features.

Run the required verification, commit, push, and update the PR. Report the baseline SHA, documents changed, verification results, and any conflict between documentation and code.
```

### Prompt 2 — Staging infrastructure

```text
Run Phase 11B only from docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md.

Inspect render.yaml, Dockerfile, package scripts, migration behavior, health checks, Inngest worker registration, cron configuration, environment validation, storage configuration, CI, deployment documentation, and rollback guidance. Create a production-like staging design with strict environment separation and a repeatable smoke-test checklist. Make only code/config/doc changes required for staging deployability. Do not configure real secrets or perform production deployment.

Create branch claude/phase-11b-staging-foundation. Run typecheck, lint, format check, tests, and build. Commit, push, and open a PR. Report all manual Render, Inngest, database, storage, and OAuth steps separately.
```

### Prompt 3 — Security and permissions verification

```text
Run Phase 11C only from docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md.

Build and execute a security/permission verification matrix covering authentication, sessions, role boundaries, API authorization, exports, credential vault behavior, audit logging, AI context filtering, feature flags, approval gates, and client/log secret exposure. Add automated tests where practical and produce a manual penetration/UAT checklist for tests that require deployed staging. Do not broaden features and do not enable external actions.

Create branch claude/phase-11c-security-verification. Stop and report any critical vulnerability immediately. Run all verification commands, commit, push, and open a PR.
```

### Prompt 4 — Integration certification harness

```text
Run Phase 11D only from docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md.

Prepare the staging certification workflow for BigCommerce, Mailchimp, QuickBooks, GA4, and the read-only supplier portal. Add safe diagnostics, reconciliation evidence, operator-visible mapping/status information, test fixtures, and certification checklists where missing. Do not add write scopes, send campaigns, submit supplier orders, or mutate source systems. Use sandbox/read-only credentials only when supplied through approved environment configuration.

Create branch claude/phase-11d-integration-certification. Run full verification, commit, push, and open a PR. Clearly distinguish automated evidence from manual staging evidence still required.
```

### Prompt 5 — Reliability and recovery

```text
Run Phase 11E only from docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md.

Implement or document representative-volume testing, job idempotency and retry tests, observability, alerts, backup/restore rehearsal, kill-switch verification, and disaster-recovery procedures. Add Sentry or the approved equivalent if not already present. Do not tune by weakening security or removing audit controls.

Create branch claude/phase-11e-reliability-recovery. Run full verification, commit, push, and open a PR. Report measured thresholds, remaining capacity risks, and manual restore evidence required.
```

### Prompt 6 — UAT and production cutover package

```text
Run Phases 11F and 11G as documentation and release-control work only after 11A–11E are accepted.

Produce role-specific UAT scenarios, a production cutover checklist, rollback decision tree, stabilization dashboard/checklist, ownership matrix, defect-severity rules, and a formal go/no-go sign-off record. Do not deploy production or enable external-action feature flags without the product owner's explicit instruction.

Create branch claude/phase-11fg-uat-cutover. Run applicable verification, commit, push, and open a PR.
```

---

## 9. Product-owner decisions required early

The following decisions should be made in Week 1 because they affect infrastructure or certification:

- Confirm Render as the target for staging and production.
- Choose database plan and required backup/PITR capability.
- Choose object storage provider and retention period.
- Choose error monitoring and alert recipients.
- Identify the three authoritative BigCommerce stores and owners of each credential.
- Decide whether QuickBooks staging will use sandbox or restricted production read access.
- Identify GA4 properties and Mailchimp audiences.
- Identify who will perform legal/privacy review of CASL rules.
- Identify the initial production user list and role assignments.
- Identify production incident owner and backup.

---

## 10. Final recommendation

Freeze feature expansion and treat the application as a release candidate. The next investment should be directed toward proving that the system can be deployed, secured, reconciled, recovered, and operated—not toward adding more modules. The repository already contains substantial functional breadth; the greatest increase in enterprise value now comes from converting that breadth into a controlled, evidence-backed, dependable management platform.

