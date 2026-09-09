# Release candidate — LifeSupply Health public website

**Prepared:** September 9, 2026 (UTC), Stage 9. **A release candidate is not launch approval.** Stage 10 executes a cutover only through the existing release controls (`docs/37_LIFESUPPLY_PUBLIC_CUTOVER_RUNBOOK.md`, `docs/RELEASE_READINESS_STATUS.md`) and only after the product owner records the decisions in §6. Nothing in this document accepts a Phase 11 gate.

## 1. Candidate

| Item | Value |
| --- | --- |
| Candidate commit | The squash-merge of the Stage 9 pull request on `main`; recorded in `STATUS.md` (session log, Stage 9) once merged. Every check below was run on the branch commit that became it. |
| Predecessors on `main` | Stages 1–8: `fac59a4`, `19ca3d5`, `fab88e7`, `622c7a8`, `2cd81c3`, `de906d7`/`c065d3d`, `0743a56`/`ed15745`, `68d6af5`/`1e04402` |
| Public surface | Vercel project `prj_sjyLvOa5X7VhSKodEoGSPTElo58D`, Production from `main`, build `pnpm public-web:build`, database-free; alias `lifesupply-command-center-vidwads-projects.vercel.app` (`noindex` by Vercel and by `robots.ts`) |
| Internal surface | Render `lifesupply-cc-web` (web, worker, cron, database); applies `prisma/migrations/` on deploy; serves `/api/public/v1/*` for the public site |
| Custom domain | `lifesupplyhealth.com` still serves the legacy WordPress site. Domain and DNS ownership were not supplied (decision placeholder unfilled); the cutover cannot be planned in detail until they are. |

## 2. Checks on the candidate

| Check | Result |
| --- | --- |
| `pnpm format:check` | Pass (BD-01 closed: `.gitattributes` normalises line endings; the untracked Python venv is prettier-ignored) |
| `pnpm typecheck`, `pnpm lint` | Pass |
| `pnpm test` | Pass, 99 files, 1,256 tests |
| `PUBLIC_SITE_MODE=true pnpm public-web:build`, `pnpm build` | Pass |
| Playwright public suite, chromium and mobile-chrome | 68 passed, 4 skipped (`evidence/stage-09/playwright-public.txt`) |
| CI | Node 24 on both jobs (D-04 closed) |
| Production alias in a real browser (Stage 8) | No cookie, no third-party script |

## 3. Approved content set

Every public sentence renders from `src/lib/public-site/content/*.ts` or from the Command Center's published-only endpoints. Approved as published: hero, mission, vision, growth statement, the three qualified 2025 figures, the expansion-context sentence, the four 2022 releases, the contact directory, the legacy profiles. Everything else is a Stage 2–8 draft pending the product owner's review, listed per stage in `STAGE_0N_EVIDENCE.md` §3, with the interim treatments applied where a decision was not supplied (S-120 positioning; WEB-01 relationships null; WEB-03 attribution as the Clinics site states it; WEB-04 kits in development; WEB-05 nothing financing-related named; WEB-06 dated legacy titles; WEB-07/WEB-10 form unpublished). No operational record, confidential document, or invented figure is in a public asset or API response.

## 4. Hosting and domain configuration proposal

1. Add `lifesupplyhealth.com` and `www.lifesupplyhealth.com` to the Vercel project once ownership is confirmed; `www` redirects to the apex (or the reverse, per the owner), so one canonical host exists.
2. Set on the Vercel Production environment: `PUBLIC_SITE_MODE=true` (already), `NEXT_PUBLIC_SITE_URL=https://lifesupplyhealth.com`, `NEXT_PUBLIC_COMMAND_CENTER_URL` (already), `PUBLIC_CONTENT_API_ORIGIN` (Render origin), and **only after** the DNS switch is verified, `PUBLIC_SITE_INDEXABLE=true`. Until that variable is set, every page is `noindex` and `robots.txt` disallows all, whatever domain serves it.
3. Set on Render: `PUBLIC_SITE_HOSTS=lifesupplyhealth.com,www.lifesupplyhealth.com` so the proxy's host detection matches if the Render host ever receives public traffic, and `PUBLIC_SITE_ORIGINS` when the inquiry form is published.
4. Lower the legacy DNS TTL ahead of the switch; keep the WordPress host reachable at an internal address for the rollback window (docs/37).

## 5. Migrations

None in this candidate. Two additive migrations are prepared and un-applied: `migrations/stage-06-public-web-governance/` and `migrations/stage-07-public-inquiry/`. They are not required for the public cutover (the public site reads only published content and the endpoints return empty lists), and they must be adopted in their own PR after rehearsal (WEB-10).

## 6. Decisions required before Stage 10

| Decision | Owner | Blocks |
| --- | --- | --- |
| Domain and DNS ownership for `lifesupplyhealth.com`; who executes the switch | Product owner | The cutover itself |
| Acceptance of the Stage 2–8 drafts or the specific corrections | Product owner | Indexable launch |
| Legal or privacy review of `/privacy/`, `/terms/`, `/accessibility/` | Product owner (reviewer to name) | Indexable launch; any form |
| Whether the inquiry form goes live at cutover (needs WEB-07, WEB-10, and the migrations) | Product owner | Contact-page form only; the directory works without it |
| Analytics property and consent handling (loader deferred) | Product owner | Measurement only |
| Operating-site reciprocal links (WEB-08) | Site owners | Post-cutover only |

## 7. Accepted deferrals (proposed; the product owner accepts or reopens)

| Item | Why deferred | Effect |
| --- | --- | --- |
| Restricted investor-document delivery | No object storage (DEC-03) | Request route only |
| Inquiry form on the contact page | WEB-07, WEB-10 unfilled | Directory remains the route; endpoint refuses |
| Analytics loader and consent control | No property or approval | Inert markup only |
| Shared (cross-instance) rate limiter for the intake | Single Render instance today | Per-process limiter; hardening item |
| Retention purge job for inquiries | Table not provisioned | Specified in the migration README |
| Brand marks on brand cards; leadership portraits | Assets not supplied (WEB-08, S-104) | Text-only cards; initials |
| Product projection feed | No defined need or channel approval | Contract recorded |
| External accessibility audit | Not commissioned | Internal checks only (see Stage 9 evidence); the accessibility page states this |

## 8. Cutover and rollback record (to be completed in Stage 10)

Procedure: docs/37 §Cutover. Pre-switch: candidate deployed to Production, `NEXT_PUBLIC_SITE_URL` set, legacy TTL lowered, smoke suite green against the alias. Switch: add the domains, update DNS, verify HTTPS, verify `https://lifesupplyhealth.com/` serves the candidate, run the legacy URL map (`LEGACY_URL_MAP.md`) against the domain, then set `PUBLIC_SITE_INDEXABLE=true` and confirm `robots.txt` and the `robots` meta flip. Post-switch monitoring: Vercel runtime errors and 404 rate; Render `/api/public/v1/*` availability; the two-week stabilisation window per `docs/20` before any broader scope. Rollback: point DNS back at the legacy host (kept warm) or, if only the application is at fault, redeploy the previous Vercel production deployment; no database change is involved in the public cutover. Evidence of each step is recorded in `STAGE_10_EVIDENCE.md`.

## 9. Owners (to be named)

| Role | Person | Status |
| --- | --- | --- |
| Product owner / launch approver | Vid Wadhwani | Named in the guide |
| Domain and DNS | — | To be named |
| Content reviewer (public copy) | — | To be named |
| Legal or privacy reviewer | — | To be named |
| Investor-relations contact | invest@lifesupply.com | Published channel |
| Corporate inquiries | info@lifesupply.com | Published channel |
| Operating-site owners (×4) | — | To be named (WEB-08) |
| Technical operator (Vercel and Render) | Developer / Technical Admin | Role named in `docs/RELEASE_READINESS_STATUS.md` |
