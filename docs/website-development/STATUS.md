# LifeSupply Website Development — Stage Status

Prepared September 8, 2026. This tracker records the website workstream separately from Command Center Phase 11. The instruction package itself does not complete a website stage or accept a release gate.

## Current position

- Instruction baseline reviewed: main commit `148617e60a54d11c79786a66f0a75a1ed70f54cb`.
- Next requested development stage: **Stage 1 — Baseline, source reconciliation, and implementation specification**.
- Website implementation under this plan: **Not started**.
- Existing website/Command Center functionality: re-audit in Stage 1; not represented as absent by this tracker.
- Production approval, migration application, external storefront edits, and live messaging: **Not performed by this instruction package**.

## Stage register

| Stage | Scope | Status | Evidence / PR | Dependencies or decisions |
|---|---|---|---|---|
| 1 | Baseline, source reconciliation, implementation specification | Not started | — | Current repository and public-site access; identify unavailable business sources. |
| 2 | Shell, Home, About | Not started | — | Stage 1 evidence and actionable baseline. |
| 3 | Four brands, Clinic Solutions, Shop & Services | Not started | — | Stage 2; source and asset verification. |
| 4 | Metabolic Health and eight pathways | Not started | — | Stage 3; configuration and availability evidence. |
| 5 | Partners, investors, leadership, resources | Not started | — | Stage 3; reconcile Stage 4 links; approved corporate materials. |
| 6 | Publishing and document delivery | Not started | — | Stages 4–5; existing permission/migration controls. |
| 7 | Inquiry capture and handoffs | Not started | — | Stage 6; routing ownership, privacy and delivery decisions. |
| 8 | Operating-site integration and measurement | Not started | — | Stage 7; site/property access for external changes. |
| 9 | SEO, accessibility, migration and release verification | Not started | — | Earlier deliverables and explicit accepted deferrals. |
| 10 | Authorized cutover and stabilization | Not started | — | Stage 9 and existing launch approvals. |

Allowed stage statuses: Not started, In progress, Ready for Review, Blocked, Partially Complete, Accepted. Only record Accepted with actual product-owner/reviewer evidence. Record commit, PR/merge, deployment, and commercial availability separately in the stage evidence.

## Decisions to resolve through evidence

These are information needs, not instructions to interrupt the user before doing useful work.

| ID | Decision / verification | Needed for | Safe interim treatment |
|---|---|---|---|
| WEB-01 | Current entities, brand relationships, contacts and addresses | Public portfolio / contact | Use verified facts; omit unsupported legal relationship assertions. |
| WEB-02 | Reconciled financial and customer/product metrics | Home and investors | Omit disputed metrics; do not average or combine incompatible counts. |
| WEB-03 | Clinic delivery partners, project attribution, imagery and service geography | Clinics pages | Prepare layout with verified descriptions and approved assets only. |
| WEB-04 | Metabolic program launch status, kit contents/SKUs, compatibility and actual refill capability | Metabolic pages | Accurate development status and information action; no invented purchasable product. |
| WEB-05 | Current financing/public-market narrative and public vs confidential documents | Investors | Qualitative current business story and verified contact path. |
| WEB-06 | Current leadership roster and approved biographies | Team | Keep historical information clearly dated; do not imply current appointments. |
| WEB-07 | Inquiry owners, retention, consent, delivery and acknowledgment approval | Stage 7 | Working verified contact directory until live intake is ready. |
| WEB-08 | Admin/repository access and owners for all four external sites | Stage 8 | Exact per-site implementation briefs and proposed status. |
| WEB-09 | Current deployment/env behavior, baseline build defects and public-host isolation | Stages 1 and 9 | Record real evidence; no weakened controls or production changes. |
| WEB-10 | Content publication, migration and cutover approvals | Stages 6 and 10 | Reviewable code/runbook; no inferred production acceptance. |

## Evidence locations

Stage 1 creates:

- `docs/website-development/BASELINE_AUDIT.md`
- `docs/website-development/SOURCE_REGISTER.md`
- `docs/website-development/ROUTE_AND_ACTION_MAP.md`
- `docs/website-development/IMPLEMENTATION_BACKLOG.md`

Later stages create or update `docs/website-development/STAGE_NN_EVIDENCE.md`. Stage 8 maintains `OPERATING_SITE_HANDOFFS.md`. Stage 9 prepares `RELEASE_CANDIDATE.md` referencing the existing cutover runbook. Record screenshots in an appropriate repository evidence folder or durable PR artifact, avoiding confidential content and excessive binary churn.

## Session log

| Date | Stage | Change | Verification | Next action |
|---|---|---|---|---|
| 2026-09-08 | Instructions | Comprehensive website guide and one-stage execution workflow prepared. Existing root instructions preserved with a scoped entry point. | Documentation validation recorded in the instruction PR. | Execute Stage 1 only when the product owner supplies the kickoff prompt. |
