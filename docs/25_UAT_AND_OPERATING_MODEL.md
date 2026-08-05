# 25 — UAT Scenarios and Operating Model

**Project:** LifeSupply Command Center
**Phase:** 11F — User acceptance, training, and operating model
**Prepared:** August 5, 2026
**Status:** UAT scripts, operating guides, and ownership templates ready for execution. **No UAT has been run and no ownership is assigned yet.** Execution requires a provisioned staging environment (BLK-01) and the DEC-09/DEC-10 people decisions. Only the product owner records acceptance.

Evidence labels as in docs/23–24: **[CI]** = enforced automatically; **[STAGING]** = manual evidence still required.

Open decisions this phase depends on (recorded, **not** assumed):

| Decision | Blocks | What is needed |
|---|---|---|
| `DEC-09` | 11F-06, GATE-07 | Named owners per role, including production incident owner and backup |
| `DEC-10` | 11F-01 | Initial production user list and role assignments |

---

## 1. UAT method (row 11F-03)

Scenario-based, not page-by-page: each script below is an end-to-end business workflow with preconditions, steps, an expected outcome, and a recorded result. Run in **staging** with seeded + certified-sync data, under the **least-privilege role named in the script** (never the admin account, except the admin scripts). A scenario passes only if every expected outcome holds; anything else is a defect logged per §6.

Record results in this table per run:

```text
UAT RUN RECORD
Scenario ID:        UAT-__
Tester (name/role): ____________________
Date / build SHA:   ____________________
Result:             pass | fail | blocked
Defects raised:     ____________________ (ids from §6 log)
Notes:              ____________________
```

## 2. UAT scenarios (row 11F-04)

### UAT-01 — Daily management briefing (Executive)
Preconditions: certified BigCommerce sync has run; AI briefing configured.
Steps: log in as executive → open the Executive Dashboard → generate/open the daily AI briefing → verify the briefing distinguishes facts, assumptions, and recommendations, and cites source data → attempt to access `/admin/*` directly by URL.
Expected: KPIs match the reconciliation evidence for the same period; briefing carries review status; admin routes are denied.

### UAT-02 — Delayed-order triage (Operations)
Preconditions: at least one order older than the delay thresholds (perf seed or staged data).
Steps: open Operations → review delayed-order queue → run the delay sweep → open a flagged order's timeline → create/assign a task from the exception → resolve the exception with notes.
Expected: sweep raises exceptions only for qualifying orders (3/7-day thresholds); task links back to the order; audit rows exist for each action.

### UAT-03 — Customer lookup and history (Operations / Finance)
Steps: search a known customer by name and by email → open the customer 360 → verify orders, lifetime value, consent state, and timeline match the source-system spot-check sheet (docs/23 §3) → attempt a customer data export.
Expected: values match certification evidence; export requires the `*_EXPORT` permission and writes an audit row.

### UAT-04 — Order/revenue reconciliation review (Finance)
Preconditions: reconciliation run exists (docs/23 §3 step 4).
Steps: open `/admin/reconciliation` → review the latest report per store → drill one material discrepancy (if any) → confirm the DEC-13 tolerance is the one applied.
Expected: report status and discrepancy counts match the certification sheet; discrepancies carry explanations.

### UAT-05 — Financial period review (Finance)
Steps: open Financials → select the latest closed period → compare P&L summary to the QuickBooks side-by-side sheet (docs/23 §5) → review budget variance → open the monthly close checklist.
Expected: figures match the certification evidence and are labeled management/unaudited; close tasks reflect actual state.

### UAT-06 — Report generation and approval (Executive + Finance)
Steps: generate a board report for a closed period → route it for approval → approve as the authorized role → export the approved report → verify an unauthorized role cannot approve or export.
Expected: report carries source references and unaudited labels; approval and export are audited; role boundary holds.

### UAT-07 — Campaign planning without sending (Marketing)
Steps: review reactivation candidates (verify suppressed customers are absent) → draft a campaign with AI → request approval → approve as marketing manager → attempt export with `mailchimp.send` OFF.
Expected: draft carries an eligibility snapshot; export is refused while the flag is off; every step is audited. **No email is ever sent.**

### UAT-08 — AI output review (any AI user + reviewer)
Steps: run an AI analyst/agent request → open `/ai-analyst/outputs` → review and approve/reject the output → accept one agent recommendation into a task.
Expected: prompt/output/model/user are logged; only a human can accept a recommendation; the created task records `ai_recommendation` provenance.

### UAT-09 — Supplier exception handling (Operations)
Preconditions: supplier automation flag ON in staging only; mock portal unless DEC-14 authorises live.
Steps: run a read-only price/stock check → force a mismatch (wrong expected price) → verify the exception and evidence screenshot → attempt order submission.
Expected: mismatch pauses the workflow into an exception; evidence is viewable via the authenticated route; submission is refused regardless of approval state.

### UAT-10 — Access-boundary spot checks (Admin)
Steps: for each role in the docs/22 §11 matrix, log in as a staging user with only that role → confirm navigation shows only permitted modules → probe two denied routes directly by URL and two denied API endpoints.
Expected: every denial holds server-side (not just hidden navigation); denials are clean errors, not crashes. Feeds 11C-04/11C-13 evidence as well.

## 3. Role operating guides (row 11F-02)

One page per role; expand during training as questions arise. All roles: log in with your named account (never shared), work is audited, AI outputs and forecasts always require human review before action.

- **Executive** — Start at the Executive Dashboard and daily briefing (UAT-01 flow). Treat all figures as management/unaudited; QuickBooks remains the accounting record. Use Reports for board/investor packages — only approved reports leave the building, via the audited export.
- **Finance** — Own reconciliation (§UAT-04), period review (UAT-05), and report approval (UAT-06). QuickBooks is the source of truth; the Command Center never writes to it. Escalate any unexplained reconciliation discrepancy before sign-off.
- **Operations** — Live in the Operations queues: delayed orders, exceptions, tasks (UAT-02), customer 360 (UAT-03), supplier checks (UAT-09). Use saved views for recurring triage. A stuck sync shows in the Automation Center — reap it only after confirming the worker isn't mid-run (runbook §10).
- **Marketing** — Reactivation and campaigns are approval-gated end to end (UAT-07). Suppression always wins and is re-checked at export; never work around it. Live sending stays off until CASL counsel review (GATE-08) and the owner enables the flag.
- **Product/Catalog** — Products, variants, categories, and data-quality flags sync read-only from BigCommerce. Fix source data in BigCommerce; the Command Center highlights gaps (missing images/descriptions/cost) but does not push changes.
- **Administrator** — Owns users/roles, integrations (`/admin/integrations`), feature flags, and audit logs. The kill-switch (`/admin/feature-flags`) disables all external-action capability without a deploy — trip it first in any incident (runbook §2). Never enable an external-action flag without the owner's written instruction and the GATE-10 control tests.

## 4. Dashboard data provenance (row 11F-05)

Until the named certification evidence exists, treat every figure as **seeded/demo**. This table is the annotation the acceptance criterion requires; re-verify it during UAT and correct anything that mislabels.

| Surface | Data source today | Becomes trustworthy when |
|---|---|---|
| Executive Dashboard KPIs | Seeded fixtures until first certified BigCommerce sync | 11D-02/04 certified per store |
| Operations queues / exceptions / tasks | Command Center primary (real once users act); order data as above | 11D-02 + live usage |
| Customers / Orders / Products modules | BigCommerce sync (seeded until then) | 11D-02/03/05 certified |
| Financial dashboards & close | QuickBooks sync/import (seeded until then); adjustments are CC-primary | 11D-11/12 certified |
| Forecasting | **Always model output** — labeled `FORECAST — NOT ACTUAL RESULTS` | Never "actuals"; inputs improve with 11D |
| Marketing / reactivation | Consent from Mailchimp sync; scores derived | 11D-07/08 certified |
| GA4 analytics | GA4 daily sync (empty/seeded until then) | 11D-15/16 certified |
| Supplier snapshots | Portal captures (mock until DEC-14) | 11D-17 certified |
| AI briefings/outputs | Derived from the above — inherit their provenance | Underlying sources certified |
| Investor/M&A modules | Command Center primary (manually entered) | Owner review of entered data |

## 5. Ownership matrix (row 11F-06 — template; names are DEC-09/DEC-10)

An area is **not operational** until both columns hold a named human. An AI agent must never be listed.

| Area | Primary owner | Backup |
|---|---|---|
| Integration credentials (per system: BC ×3, QBO, Mailchimp, GA4, supplier) | TBD | TBD |
| Failed / stuck syncs (daily Automation Center check) | TBD | TBD |
| Customer consent decisions & suppression disputes | TBD | TBD |
| Financial reconciliation & period sign-off | TBD | TBD |
| Report approval (board / investor / lender) | TBD | TBD |
| Production incidents (GATE-07; runbook §8) | TBD | TBD |
| Feature flags & kill-switch authority | TBD | TBD |
| User/role administration | TBD | TBD |
| UAT defect triage (§6) | TBD | TBD |

## 6. Support and defect-priority process (rows 11F-07/11F-08)

| Severity | Definition | Response | Launch rule |
|---|---|---|---|
| Critical | Data loss/corruption, security breach, wrong financial figures presented as reconciled, whole-app outage | Same day; kill-switch if external action involved | Blocks cutover (11F-08, GATE items) |
| High | A §2 workflow unusable for its role; wrong data with no workaround; permission boundary defect | 2 business days | Blocks cutover |
| Medium | Workflow usable with workaround; cosmetic-but-misleading data labels | Before end of stabilization | Logged; scheduled |
| Low | Cosmetic, wording, convenience | Backlog | Logged |

Intake: one defect log (tracker or sheet) with id, scenario ref, severity, reporter, disposition. Triage by the §5 defect owner. During stabilization (docs/26 §5) the daily review walks the open log. **Exit criterion for 11F-08: zero open critical/high.**

## 7. Seed/demo account isolation audit (row 11F-09, launch gate GATE-09)

**[CI] posture:** the seed refuses to create the admin user with the dev fallback password in any deployed environment (`NODE_ENV=production` or `DEPLOY_ENV` set) unless `DEV_ADMIN_PASSWORD` is explicitly provided — guarded since Phase 11C. Perf-seed data is tagged and removable (`pnpm perf:seed --clean`) and its stores are `inactive`.

**[STAGING→PRODUCTION] audit procedure (run at cutover, 11G-02):**
1. Production seeds **only** required roles and the named admin users from DEC-10 — never the demo dataset (`seedOperating`/`seedTransactions`/`seedManagement`/`seedStrategic` fixtures stay out of production).
2. Query production `users` and verify every account maps to a DEC-10 person; disable anything else.
3. Verify no `perf_seed` rows and no seed-fixture stores/customers exist in production.
4. Verify the admin password is not the dev fallback (attempt it; expect failure) and every account has a unique strong credential.
5. Record the audit output — this is the GATE-09 evidence.

## 8. Steps only the product owner (or named humans) can perform

1. **Decide DEC-10** (initial users + roles) and **DEC-09** (owners incl. incident owner/backup); fill the §5 matrix and runbook §8.
2. Provision staging (BLK-01) and complete 11D certification — §2 scenarios depend on certified data.
3. Nominate testers per role and execute UAT-01…10, recording §1 run records and §6 defects.
4. Close all critical/high defects (11F-08).
5. Run training walkthroughs using §3 guides; collect sign-offs.
6. Record row dispositions in `docs/RELEASE_READINESS_STATUS.md` — acceptance is owner-only.
