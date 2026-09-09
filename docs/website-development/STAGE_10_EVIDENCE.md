# Stage 10 — Authorized cutover and stabilization: evidence

**Prepared:** September 9, 2026 (UTC)
**Base:** `main` at `5862957` (Stage 9 candidate `05c34be` plus its verification record, PR #81)
**Branch:** `claude/website-stage-10-cutover`
**Status: Blocked** after the launch package. **No cutover action was performed.** The gate that blocks is named in §3.

## 1. What this stage was asked to do, and what existing instructions authorize

| Action | Authorized by an existing instruction? | Done |
| --- | --- | --- |
| Assemble the launch package against the candidate | Yes (the Stage 10 kickoff) | Yes, §2 |
| Commit, push, open a PR, squash-merge documentation | Yes (standing instruction of 2026-09-08) | Yes |
| Deploy to the production alias | Automatic on merge (D-11); not a new action | Happens on merge |
| Add custom domains to the Vercel project | **No.** Needs domain and DNS ownership and an executor (`RELEASE_CANDIDATE.md` §6, row 1), which arrived unfilled | Not done |
| Set `NEXT_PUBLIC_SITE_URL`, `PUBLIC_CONTENT_API_ORIGIN` on Production | Harmless in themselves, but they are part of the domain change and the Vercel connector in this session can read, not write, environment variables | Not done; proposed values recorded in `RELEASE_CANDIDATE.md` §4 |
| Lower the legacy TTL, switch DNS | **No.** Same gate | Not done |
| Set `PUBLIC_SITE_INDEXABLE=true` | **No.** Depends on the switch, on content acceptance, and on the legal review (§6 rows 2 and 3) | Not done |
| Publish the inquiry form, apply migrations | **No.** WEB-07 and WEB-10 unfilled | Not done |

The Command Center launch gates in `docs/20` §5 remain independently governed and none is accepted by this document.

## 2. Launch package (against candidate `05c34be`)

### 2.1 Candidate and checks

| Item | Evidence |
| --- | --- |
| Candidate commit | `05c34be` (PR #80). `main` at `5862957` differs only in documentation (`git diff --stat 05c34be 5862957 -- . ':!docs'` is empty, verified in this stage). |
| Gates re-run on the candidate code in this stage | `pnpm format:check` pass (whole repository); `pnpm typecheck` 0 errors; `pnpm lint` clean; `pnpm test` 99 files, 1,256 tests pass; `PUBLIC_SITE_MODE=true pnpm public-web:build` pass; `pnpm build` pass. |
| Public browser suite **against the production alias** | 68 passed, 4 skipped, chromium and mobile-chrome (`evidence/stage-10/playwright-alias.txt`). |
| CI on the candidate | Green on Node 24 (PR #80, run `34297106227`). |

### 2.2 Approved content set

As `RELEASE_CANDIDATE.md` §3: approved-as-published copy plus Stage 2–8 drafts with the interim treatments. **Content acceptance has not been recorded** (§6 row 2). The site is truthful under the interim treatments, so it can serve on the alias, but an indexable launch under the custom domain should follow acceptance.

### 2.3 Hosting and domain configuration

| Item | State now | Evidence |
| --- | --- | --- |
| Vercel project | `prj_sjyLvOa5X7VhSKodEoGSPTElo58D`, framework `nextjs`, Node `24.x`, Production from `main` | Vercel connector, `get_project` |
| Domains attached | `lifesupply-command-center.vercel.app`, `lifesupply-command-center-vidwads-projects.vercel.app`, `lifesupply-command-center-git-main-vidwads-projects.vercel.app`. **No custom domain.** | same |
| Current production deployment | `dpl_HwuhXFf32PYdxDgAdxDhLK9xcCQM` (commit `5862957`, READY) | `list_deployments`; the alias HTML carries the same id |
| Previous production deployments (rollback candidates) | `dpl_hqKvYdp6sK79gwsvevYGSikqvxgS` (`05c34be`, Stage 9), `dpl_7tEt2E79Dic3LDmuduJWSwWpEH5G` (`1e04402`, Stage 8 record), `dpl_EQYfWb62BGkMpUyb6znjGDtyCUZT` (`68d6af5`, Stage 8) | `list_deployments`, all `isRollbackCandidate: true` |
| Deployment protection | Password, Vercel Authentication, and trusted IPs all **disabled** for every deployment type | `get_project_deployment_protection` |
| Legacy host | `https://lifesupplyhealth.com/` 200 (nginx), `/contact-2/` 200; DNS A `165.232.130.127` plus an AAAA record; the legacy site is the rollback source and is untouched | `evidence/stage-10/rollback-reference-and-baselines.txt` |
| Proposed configuration for the switch | `RELEASE_CANDIDATE.md` §4 (domains, `NEXT_PUBLIC_SITE_URL`, `PUBLIC_CONTENT_API_ORIGIN`, `PUBLIC_SITE_HOSTS` on Render, `PUBLIC_SITE_INDEXABLE` last) | |

### 2.4 Migration status

None required for the public cutover. Two additive migrations prepared and un-applied (`migrations/stage-06-public-web-governance/`, `migrations/stage-07-public-inquiry/`), awaiting WEB-10 and a rehearsal target (BLK-02). Render `/api/health` reports `status: ok` with the database check `ok`; `/api/public/v1/site` 200.

### 2.5 Operating owners

`RELEASE_CANDIDATE.md` §9. Named: product owner (Vid Wadhwani), the two published channels, the Developer / Technical Admin role. **To be named:** domain and DNS, content reviewer, legal or privacy reviewer, the four operating-site owners.

### 2.6 Backup and rollback evidence

- The public cutover involves **no database change**; rollback is a DNS revert to the legacy host (live, verified above) or a Vercel redeploy of a previous production deployment (three rollback candidates listed above).
- Command Center backup and restore evidence belongs to Phase 11E (`docs/RELEASE_READINESS_STATUS.md`, 11E items) and is **not** produced by this stage; the website cutover does not depend on it because no data moves.
- The standalone `vidwad/life-supply-health` repository and its tag remain the prior public-site foundation per docs/37; the current unified site on the alias is the working reference.

### 2.7 Monitoring

| Signal | Source | Baseline now |
| --- | --- | --- |
| Public health | `GET /api/health` on the alias | 200, `surface: public-web` |
| Command Center health | `GET /api/health` on Render | 200, all checks `ok` |
| Published-content API | `GET /api/public/v1/site` on Render | 200 |
| Vercel runtime errors (7 days) | Vercel connector, `get_runtime_errors` | See D-13 below; **no error on a production deployment in the last hour** |
| 404 rate after the switch | Vercel runtime logs by route, plus the not-found page | To be captured in the stabilization record |

**D-13 (new, pre-cutover hygiene, not blocking).** The 7-day error table shows 10,091 `[auth][error] MissingSecret` events from 30 visitors on `/middleware`, `/`, `/login`, `/customers`, `/reports`, and similar routes. Every group's `lastDeployment` is a **pull-request preview** (for example `dpl_DJ1ZWZTB8gv91cYNbYN63beJRNWV`, the Stage 3 branch preview, `target: null`), never a production deployment. Cause: preview deployments run the proxy's internal-host branch because the Preview environment does not carry `PUBLIC_SITE_MODE=true`, and that branch needs `AUTH_SECRET`, which is deliberately absent on Vercel; the visitors are crawlers reaching unprotected preview URLs. Effect: a 500 on the preview, no data or secret exposure (the public build has no database and no secret). Fix, owner action in Vercel: enable Vercel Authentication for preview deployments (deployment protection is currently off for all types) and, or, set `PUBLIC_SITE_MODE=true` on the Preview environment. Not changed here: environment and protection settings are owner-only and the connector is read-only for them in this session.

### 2.8 Previous deployment reference

Before the Stage 9 merge the alias served `dpl_7tEt2E79Dic3LDmuduJWSwWpEH5G` (commit `1e04402`). That is the rollback target if the candidate must be withdrawn from the alias; the legacy host is the rollback target for the custom domain, which has not been switched.

## 3. Blocked: the exact gate

`RELEASE_CANDIDATE.md` §6, row 1: **domain and DNS ownership for `lifesupplyhealth.com`, and who executes the switch.** The decision placeholder arrived unfilled, and no existing instruction authorizes a DNS change. The cutover cannot proceed without it. Two further §6 rows gate the *indexable* launch even once the domain moves: content acceptance (row 2) and the legal or privacy review of the policy pages (row 3). The form go-live (row 4), analytics (row 5), and the operating-site links (row 6) do not block the cutover.

When the owner supplies row 1 (and ideally rows 2 and 3), Stage 10 resumes at `RELEASE_CANDIDATE.md` §8 step "Switch" with the package above unchanged, provided `main` still equals the candidate in code.

## 4. Verification performed in this stage

| Check | Result |
| --- | --- |
| Gates on the candidate code | All pass (§2.1) |
| Browser suite against the alias | 68 passed, 4 skipped |
| Alias and Render baselines | Recorded (§2.7, evidence file) |
| Legacy host and DNS | Recorded (§2.3) |
| Vercel project, deployments, protection, errors | Recorded (§2.3, §2.7) |

## 5. Deployment, migration, and external sends actually performed

None. Merging this documentation triggers the existing automatic builds only. No domain, DNS, environment, protection, migration, message, or operating-site change was made.

## 6. Stabilization

Not started: there is nothing to stabilize until the switch happens. No stabilization period is claimed.
