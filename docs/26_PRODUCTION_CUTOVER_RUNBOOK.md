# 26 — Production Cutover and Stabilization Runbook

**Project:** LifeSupply Command Center
**Phase:** 11G — Controlled production cutover and stabilization
**Prepared:** August 5, 2026
**Status:** Release-control documentation only. **Production must not be deployed from this document until rows 11A–11F are Accepted in `docs/RELEASE_READINESS_STATUS.md` and every §1 gate is green.** Nothing here authorizes enabling any external-action feature flag. Only the product owner signs the go/no-go record (§6).

---

## 1. Go/no-go gate check (complete BEFORE step one of §2)

Cutover is a **no-go** while any row is unchecked. Source: register §6 (GATE-01…10).

| Gate | Evidence to attach | Green? |
|---|---|---|
| GATE-01 migration rehearsed on staging | Rehearsal log (docs/21 §6) | ☐ |
| GATE-02 all integrations reach terminal states | Sync-status audit (docs/23 §8) | ☐ |
| GATE-03 BigCommerce reconciliation within tolerance | Signed reconciliation (docs/23 §3, DEC-13) | ☐ |
| GATE-04 no unauthorized access in permission testing | Security matrix, zero open critical/high (docs/22 §11) | ☐ |
| GATE-05 no secrets in source/bundles/logs/documents | CI scan + staging log review (11C-06) | ☐ |
| GATE-06 backup restoration tested | Drill entry in OPS_RUNBOOK §9 (docs/24 §8) | ☐ |
| GATE-07 incident owner assigned | Named owner + backup in OPS_RUNBOOK §8 (DEC-09) | ☐ |
| GATE-08 CASL/suppression counsel review (only if marketing goes live) | Written review (DEC-08) — otherwise record "marketing stays off" | ☐ |
| GATE-09 no demo/seed accounts in production | Account audit (docs/25 §7) | ☐ |
| GATE-10 no external write-back enabled without tested controls | Flag export showing all external-action flags OFF | ☐ |

Also confirm: release branch `release/phase-11-production` cut per register §4; production deploy strategy per DEC-12 decided and applied; scope matches register §7 (nothing beyond "enable initially").

## 2. Cutover sequence (rows 11G-01…11G-07)

Execute in order; each step has a validation and an evidence field. Stop at any failed validation — do not improvise past it; consult §3.

| # | Step | Validation | Evidence |
|---|---|---|---|
| 1 | Deploy production infrastructure (web, worker, cron, DB) with **all high-risk flags OFF** | `/api/health`: `status: ok`, `environment: production`, "no high-risk flags on" | Deploy record + health body (11G-01) |
| 2 | Apply migrations; seed **only** roles + DEC-10 admin users (no demo data; `DEV_ADMIN_PASSWORD` explicitly set) | `prisma migrate deploy` clean; docs/25 §7 audit passes | Migration + seed logs; GATE-09 audit (11G-02) |
| 3 | Validate auth, permissions, worker registration (Inngest dashboard shows the app), cron run, storage, monitoring/alert delivery | Post-deploy checklist: login ✓, role spot-checks ✓ (docs/25 UAT-10 short form), worker ✓, cron ✓, test alert received ✓ | Checklist (11G-03) |
| 4 | Connect **one** BigCommerce store (per DEC-05 order); run a **bounded incremental** sync | Sync log terminal `success`; record counts plausible; no stuck runs | Sync log id (11G-04) |
| 5 | Reconcile that store; obtain management sign-off | Within DEC-13 tolerance or explained | Signed reconciliation — GATE-03 (11G-05) |
| 6 | Add store 2, then store 3 — sequentially, each with sync + reconciliation before the next | Same as steps 4–5 per store | Per-store records (11G-06) |
| 7 | Enable QuickBooks, then GA4, then Mailchimp **read** integrations, one at a time, each against its docs/23 certification | Each: terminal sync + spot comparison to source | Per-integration enablement record (11G-07) |

Throughout: campaign sending, all write-backs, investor distribution, AI actions, and supplier order submission stay **disabled** (register §7.2). Supplier read-only checks enable only after DEC-14 and 11D-17 evidence.

## 3. Rollback decision tree

Trip the kill-switch first (runbook §2) whenever an external-action flag is involved; it needs no deploy.

```text
Problem observed in production
│
├─ Wrong/misleading DATA (sync, reconciliation, financial figures)?
│   ├─ Confined to one integration → disable that integration's sync
│   │   (connection status "disabled"), keep the app up, fix forward.
│   │   Re-run sync + reconciliation before re-enabling.
│   └─ Widespread / uncertain origin → freeze syncs (worker off or
│       flags), announce figures unreliable, investigate. App can stay
│       up for CC-primary work (tasks/approvals).
│
├─ APP BROKEN (errors, auth failures, blank pages)?
│   ├─ Started right after a deploy → redeploy previous build
│   │   (runbook §7). Migration in that deploy?
│   │   ├─ No  → previous build is sufficient.
│   │   └─ Yes → migrations are forward-only (no down scripts):
│   │       prefer FIX FORWARD if data is intact; RESTORE (§ below)
│   │       only if the migration corrupted data.
│   └─ Not deploy-correlated → check /api/health, Render status, DB
│       capacity; treat as incident (runbook §8 owner drives).
│
├─ SECURITY event (unauthorized access, leaked secret)?
│   → Kill-switch + rotate affected credentials (vault + env) +
│     suspend affected accounts. Preserve audit logs. Incident owner
│     decides on taking the app offline. Root-cause before any re-enable.
│
└─ DATA LOSS / corruption of CC-primary records?
    → RESTORE: stop app → restore backup into NEW database (docs/24 §8)
      → run post-restore checklist → repoint → announce the RPO window
      lost. Record in drill log.
```

Every rollback event lands in the stabilization log (§5) and the incident record (runbook §8).

## 4. Cutover checklist sign-off (row 11G-08)

```text
PRODUCTION CUTOVER CHECKLIST — SIGN-OFF
All §1 gates green (attach the table):            yes / no
Steps §2.1–§2.7 executed with evidence attached:  yes / no
Register §7 scope respected (nothing extra on):   yes / no
Rollback tree (§3) reviewed with incident owner:  yes / no
Operators have runbook access (11G-11):           yes / no

Signed (Product Owner, name/date): _______________________
```

A `v1.0.0` tag may be created **only after** this record is signed AND §5 stabilization completes AND §6 is signed (register §4.2). A `-staging` tag never implies production readiness.

## 5. Two-week stabilization (row 11G-09)

Daily review (15 minutes, incident owner + one operator), logged one row per day:

| Check | Where |
|---|---|
| Health `ok`, environment `production`, no high-risk flags on | `/api/health` |
| Sync posture: failures (24h), stuck-sync card empty | Automation Center |
| Error volume vs prior day | Render logs / DEC-04 service (`captureException` lines) |
| New exceptions triaged; tasks not piling unassigned | Operations |
| Reconciliation drift per store (spot) | `/admin/reconciliation` |
| Open defects: no new critical/high; log walked | docs/25 §6 log |
| DB capacity / worker restarts | Render metrics |

```text
STABILIZATION LOG — Day __/14   Date: ______  Reviewer: ______
Health ok? __  Syncs ok? __  Errors vs yesterday: __
New critical/high defects: __  Reconciliation drift: __
Actions taken: ________________________________________
```

Weeks with a rollback event restart the 14-day clock at the owner's discretion.

## 6. Formal production-readiness review (row 11G-10)

Held after stabilization; minutes + decision recorded. Agenda: stabilization log review; open defect log; reconciliation trend; incident/rollback events; scope-expansion requests (each external-action flag requires its GATE-10 control test before enablement); decision — **accept as production-ready / extend stabilization / roll back scope**.

```text
PRODUCTION-READINESS REVIEW — RECORD
Date / attendees: _____________________________________
Stabilization: days completed __ / rollbacks __ / open crit-high __
Decision: accepted | extended | scope rolled back
Scope changes approved (if any): ______________________
Signed (Product Owner): _______________________________
```

Only after this record says **accepted** may anyone describe the application as production-ready (CLAUDE.md §2), and only then is `v1.0.0` tagged.

## 7. Steps only the product owner (or named humans) can perform

1. Record acceptance of 11A–11F rows — this runbook is inert until then.
2. Decide DEC-12 (production deploy strategy) and cut `release/phase-11-production` at cutover time.
3. Execute §2 with the accountable roles; sign §4.
4. Run the §5 daily reviews for two weeks; hold §6 and sign the decision.
5. Any scope expansion (external-action flags) — written instruction + GATE-10 control tests first.
