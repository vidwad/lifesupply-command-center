# LifeSupply Website Development — Stage Status

Prepared September 8, 2026. This tracker records the website workstream separately from Command Center Phase 11. The instruction package itself does not complete a website stage or accept a release gate.

## Current position

- Instruction baseline reviewed: main commit `148617e60a54d11c79786a66f0a75a1ed70f54cb`.
- Instruction package: branch `docs/lifesupply-website-staged-development` at `654ef4b` (PR #67). Stage 1 read it with `git show`; this tracker was initialised from that branch's copy.
- Stage 1 executed on branch `claude/website-stage-01-baseline` from the same `main` commit (PR #68, open). Documentation and evidence only.
- Stage 2 executed on branch `claude/website-stage-02-shell-home-about` from the same `main` commit, while #67 and #68 were still open; runtime work depends on neither. Intended merge order: #67, #68, then the Stage 2 PR (this tracker supersedes #68's copy).
- Stage 3 executed on branch `claude/website-stage-03-brands-clinics-shop`, **stacked explicitly on the Stage 2 branch** because `main` still lacked the Stage 2 registries and shell that every Stage 3 page builds on (#67, #68, #69 all open). Its PR is based on the Stage 2 branch. Merge order: #67 → #68 → #69 → Stage 3 PR.
- Next requested development stage: **Stage 4 — Metabolic Health and eight supply pathways** (after Stage 3 review).
- Website implementation under this plan: **In progress** — Stage 2 delivered the registries, grouped shell, Home, and About on a review branch; nothing is merged or deployed by the stage.
- Existing website/Command Center functionality: audited in `BASELINE_AUDIT.md`; the unified public site is live on the Vercel production alias, the legacy WordPress site still serves `lifesupplyhealth.com`.
- Production approval, migration application, external storefront edits, and live messaging: **Not performed.**

## Stage register

| Stage | Scope | Status | Evidence / PR | Dependencies or decisions |
| --- | --- | --- | --- | --- |
| 1 | Baseline, source reconciliation, implementation specification | **Ready for Review** | `BASELINE_AUDIT.md`, `SOURCE_REGISTER.md`, `ROUTE_AND_ACTION_MAP.md`, `IMPLEMENTATION_BACKLOG.md`, `evidence/stage-01/`; PR #68 (`claude/website-stage-01-baseline`) | Business-plan PDFs (S-62) unavailable; Render migration log and env values not readable in session; four external-site admin access unconfirmed. |
| 2 | Shell, Home, About | **Ready for Review** | `STAGE_02_EVIDENCE.md`, `evidence/stage-02/`; PR #69 (`claude/website-stage-02-shell-home-about`) | Kickoff decisions arrived unfilled; interim treatments applied (evidence §5). S-120 copy pending approval; WEB-01 relationships `null`; brand cards text-only (WEB-08). BD-02/BD-03 recorded, untouched. |
| 3 | Four brands, Clinic Solutions, Shop & Services | **Ready for Review** | `STAGE_03_EVIDENCE.md`, `evidence/stage-03/`, `OPERATING_SITE_HANDOFFS.md` (draft); PR: see session log | Stacked on the Stage 2 branch (see current position). Kickoff decisions arrived unfilled; interim treatments applied (evidence §5): WEB-01 `null` relationships, WEB-03 attribution as the Clinics site states it with no imagery, text-only brand pages. |
| 4 | Metabolic Health and eight pathways | Not started | — | Stage 3 review and merge; WEB-04; no sharps category URL exists (S-89); the `metabolic` route group is already registered as `proposed`. |
| 5 | Partners, investors, leadership, resources | Not started | — | Stage 3; reconcile Stage 4 links; WEB-05/06. |
| 6 | Publishing and document delivery | Not started | — | Stages 4–5; migration status correction (BD-05); storage decision (DEC-03/BLK-07); WEB-10. |
| 7 | Inquiry capture and handoffs | Not started | — | Stage 6; WEB-07. |
| 8 | Operating-site integration and measurement | Not started | — | Stage 7; WEB-08 access. |
| 9 | SEO, accessibility, migration and release verification | Not started | — | Earlier deliverables; BD-01–BD-06; accepted deferrals (D-07). |
| 10 | Authorized cutover and stabilization | Not started | — | Stage 9; DEC-12; existing launch approvals. |

Allowed stage statuses: Not started, In progress, Ready for Review, Blocked, Partially Complete, Accepted. Only record Accepted with actual product-owner/reviewer evidence. Record commit, PR/merge, deployment, and commercial availability separately in the stage evidence.

## Decisions to resolve through evidence

These are information needs, not instructions to interrupt the user before doing useful work. Register rows (`S-nn`) are in `SOURCE_REGISTER.md`.

| ID | Decision / verification | Needed for | Evidence gathered in Stage 1 | Safe interim treatment |
| --- | --- | --- | --- | --- |
| WEB-01 | Current entities, brand relationships, contacts and addresses | Public portfolio / contact | Entity-name variants (S-10–S-12), MDEL 13295 on three stores (S-14), Balkowitsch and Clinics relationships unstated (S-15, S-16), two competing office addresses (S-20, S-21) | Use verified facts; omit unsupported legal relationship assertions. |
| WEB-02 | Reconciled financial and customer/product metrics | Home and investors | Seven conflicting counts across legacy and operating sites (S-43–S-51) | Only the three qualified 2025 figures; do not average or combine. |
| WEB-03 | Clinic delivery partners, project attribution, imagery and service geography | Clinics pages | Services, specialties, six BC projects, "core partners" wording, verified consultation and quote URLs (S-70–S-75) | Layout with verified descriptions and approved assets only. |
| WEB-04 | Metabolic program launch status, kit contents/SKUs, compatibility and actual refill capability | Metabolic pages | No kit collection or sharps category exists on any store (S-89, S-90); verified browse URLs for K01/02/04/05/06/07 | Accurate development status and information action; no invented purchasable product. |
| WEB-05 | Current financing/public-market narrative and public vs confidential documents | Investors | 2025 figures approved as qualified (S-60); deck capture date unknown (S-64); 2022 PDF still live on legacy (S-64); $4.2M/CPC/TSXV/CSE/FendX planning-only (S-63) | Qualitative current business story and verified contact path. |
| WEB-06 | Current leadership roster and approved biographies | Team | Title differences between cards and legacy profiles (S-101); John Anderson unresolved (S-102); one portrait held (S-104) | Keep historical information clearly dated; do not imply current appointments. |
| WEB-07 | Inquiry owners, retention, consent, delivery and acknowledgment approval | Stage 7 | No intake exists (BASELINE_AUDIT §4); verified channels (S-25–S-30); action registry drafted | Working verified contact directory until live intake is ready. |
| WEB-08 | Admin/repository access and owners for all four external sites | Stage 8 | Platforms identified (WordPress ×2, BigCommerce ×3); no brand asset files held (S-135); Stage 2 brand cards render a mark automatically once `asset` is set on the registry record | Exact per-site implementation briefs and proposed status; text-only cards meanwhile. |
| WEB-09 | Current deployment/env behavior, baseline build defects and public-host isolation | Stages 1 and 9 | Recorded: D-01–D-11; probes in BASELINE_AUDIT §5; `/_global-error` failure does not reproduce on Node 24 | Record real evidence; no weakened controls or production changes. |
| WEB-10 | Content publication, migration and cutover approvals | Stages 6 and 10 | Publication tables appear applied on Render (indirect, D-09); no editor/approval workflow exists | Reviewable code/runbook; no inferred production acceptance. |

## Evidence locations

Stage 1 created:

- `docs/website-development/BASELINE_AUDIT.md`
- `docs/website-development/SOURCE_REGISTER.md`
- `docs/website-development/ROUTE_AND_ACTION_MAP.md`
- `docs/website-development/IMPLEMENTATION_BACKLOG.md`
- `docs/website-development/evidence/stage-01/` — six desktop captures (legacy corporate site, the four operating sites, the unified production alias; 2026-09-08, 1440 px) and `baseline-checks-148617e.txt`

Stage 3 created `docs/website-development/STAGE_03_EVIDENCE.md`, `docs/website-development/evidence/stage-03/` (the twelve Stage 3 pages at 390, 768, and 1440 px; both new menu groups; local browser-suite log), and the draft `docs/website-development/OPERATING_SITE_HANDOFFS.md`.

Stage 2 created `docs/website-development/STAGE_02_EVIDENCE.md` and `docs/website-development/evidence/stage-02/` (Home, About, open menus, and footer at 390, 768, and 1440 px; local browser-suite log).

Later stages create or update `docs/website-development/STAGE_NN_EVIDENCE.md`. Stage 8 maintains `OPERATING_SITE_HANDOFFS.md`. Stage 9 prepares `RELEASE_CANDIDATE.md` referencing the existing cutover runbook. Record screenshots in an appropriate repository evidence folder or durable PR artifact, avoiding confidential content and excessive binary churn.

## Session log

| Date | Stage | Change | Verification | Next action |
| --- | --- | --- | --- | --- |
| 2026-09-08 | Instructions | Comprehensive website guide and one-stage execution workflow prepared. Existing root instructions preserved with a scoped entry point. | Documentation validation recorded in the instruction PR (#67). | Execute Stage 1 only when the product owner supplies the kickoff prompt. |
| 2026-09-08 | 1 | Baseline audit, source register, route/action map, backlog, and evidence produced on `claude/website-stage-01-baseline` from `148617e`. No runtime change. | At `148617e`, Node 24.14.0 / pnpm 10.0.0: `format:check` fail (423 CRLF files, environment; CI green on the same commit), `typecheck` pass, `lint` pass, `test` pass (82 files, 1,092 tests), `public-web:build` pass, `build` pass; Playwright smoke against the production alias: 23 passed, 1 skipped (`evidence/stage-01/public-smoke-production-alias-148617e.txt`). Host-isolation and health probes recorded (D-02, D-03). | PR #68 opened for review (not merged). Product owner reviews Stage 1; resolve order-1 decisions in `IMPLEMENTATION_BACKLOG.md` §16; then issue the Stage 2 prompt. |
| 2026-09-08 | 2 | Brand, route, and action registries; grouped navigation with utility links and a four-brand footer; Home and About page contracts; content model split; canaries and browser tests extended. Branch `claude/website-stage-02-shell-home-about` from `148617e`. | typecheck, lint pass; `pnpm test` 83 files / 1,114 tests pass; public and normal builds pass; local Playwright 31 passed, 3 skipped; repository `format:check` fails only on pre-existing CRLF files (BD-01). CI green on PR #69. Automatic Vercel preview `dpl_CpmiSA8QXWx7LuTpXAkcSasJoTPw` (not a deployment by the stage): Playwright 31 passed, 3 skipped; D-02 and D-03 reproduce there unchanged. | PR #69 open for review (not merged). Product owner reviews Stage 2; supplies S-120, WEB-01, and asset decisions or accepts the interim treatments; merges #67, #68, #69 in that order; then issues the Stage 3 prompt. |
| 2026-09-08 | 3 | Portfolio map, four brand pages, technology and fulfilment, Clinic Solutions hub and three children, Shop & Services, Contact intent routing; registry extensions (verified categories, store links, thirteen actions); nine routes flipped live; draft operating-site handoffs. Branch `claude/website-stage-03-brands-clinics-shop` stacked on the Stage 2 branch (`3993cac`). | typecheck, lint pass; `pnpm test` 83 files / 1,123 tests pass; normal and public builds pass; local Playwright 39 passed, 3 skipped; 44 external URLs verified 200; repository `format:check` fails only on pre-existing CRLF files (BD-01). | Product owner reviews Stage 3; supplies WEB-01, WEB-03, and asset decisions or accepts the interim treatments; merges #67, #68, #69, then the Stage 3 PR; then issues the Stage 4 prompt. |
