# Website improvement program — plan

**Opened:** September 9, 2026. **Owner of record:** product owner (Vid). **Coordinator:** Claude Code, with Codex used for content rewriting, design proposals, and independent review.

This program improves the existing public site at the Vercel production alias. It is not a rebuild. It supplements, and does not replace, `docs/website-development/CLAUDE.md` (the website workstream brief), `docs/website-development/SOURCE_REGISTER.md` (the Stage 1 source register), and `docs/website-development/STATUS.md` (the per-change status table).

## Companion documents

| Document | Purpose |
| --- | --- |
| `docs/website-content-evidence.md` | Evidence register for every material public claim this program touches |
| `docs/website-change-log.md` | What changed, per stage, with the merge commit |
| `docs/website-qa-report.md` | Checks, browser verification, and deployment verification |
| `docs/website-asset-manifest.md` | Diagrams and images: placement, crop, alt text, provenance |

## Baseline (September 9, 2026)

- Repository `vidwad/lifesupply-command-center`, default branch `main`, unprotected, admin access confirmed.
- Next.js 16, React 19, Tailwind v4, TypeScript strict. Public copy lives only in `src/lib/public-site/content/*.ts`; pages compose it from `src/components/public-site/`.
- Routes, navigation, and redirects derive from `src/lib/public-site/routes.ts`. Outbound destinations derive from `src/lib/public-site/actions.ts`.
- Guard rails: `src/lib/public-site/public-boundary.test.ts` and `registry.test.ts` (source-scanning canaries), `tests/e2e/lifesupply-public.spec.ts` (Playwright, desktop and mobile projects).
- Deployment: Vercel builds production from `main`; the public surface is database-free. The Command Center, database, workers, and internal APIs stay on Render.
- Baseline captures of ten routes at 1440 px and 390 px are held with the Stage 0 evidence.

## Decisions taken for this program

1. **Financial figures are static.** The count-up animation is removed from every reported figure so numbers render immediately. The enlarged card treatment the product owner asked for on 2026-09-09 is kept.
2. **No new financial figure is published.** Only the three approved 2025 annual-report measures (net sales, gross profit, net income) and the three qualified operating figures already in the content model appear, each with period, currency, entity, and basis.
3. **Inquiry routing uses verified channels.** `info@lifesupply.com`, `invest@lifesupply.com`, and `abdul@lifesupply.com` are the only destinations in the action registry. A submitting form is not activated unless approved server-side delivery exists on the public surface; the fallback is a category-specific mail route with a useful subject. A false success state is never shown.
4. **Development status stays visible.** Pharmacy Solutions and metabolic-health supply services remain "in development" or "under evaluation"; neither is presented as a purchasable service.
5. **Existing URLs are preserved.** Any route change carries a redirect, recorded in `docs/website-development/LEGACY_URL_MAP.md`.

## Stages

| Stage | Scope | Branch |
| --- | --- | --- |
| 0 | Discovery, baseline captures, evidence register, this plan, instruction update | `claude/web-stage-0-discovery` |
| 1 | Content and information architecture: page purpose, audience, primary action, status; rewritten copy in the content model | `claude/web-stage-1-content` |
| 2 | Page and component implementation: hero, homepage sequence, clinic pathways, store routes, static figures, internal wording removed | `claude/web-stage-2-implementation` |
| 3 | Visuals: diagrams and imagery, crops, loading, text equivalents, manifest | `claude/web-stage-3-visuals` |
| 4 | Inquiries and measurement: routing or safe fallback, validation, existing analytics | `claude/web-stage-4-inquiries` |
| 5 | Final QA, independent Codex review, deployment verification | `claude/web-stage-5-qa` |

Each stage runs the repository's checks (`pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `PUBLIC_SITE_MODE=true pnpm build`, Playwright), then commits, pushes, opens a pull request, waits for the required checks, and squash-merges.

## Risks and unresolved items

| Item | Treatment |
| --- | --- |
| No approved server-side inquiry delivery on the database-free public surface | Keep verified mail routes; do not activate a form that cannot deliver |
| Custom domain still points at the legacy WordPress site | Out of scope; the product owner deferred cutover, indexing, and DNS |
| Clinic project imagery attribution is not established for third-party work | Publish no project image that implies LifeSupply performed work it did not |
| Financing presentation (August 25, 2026) is source material, not approved public detail | Reference its existence and date only; publish no terms, targets, or projections |
