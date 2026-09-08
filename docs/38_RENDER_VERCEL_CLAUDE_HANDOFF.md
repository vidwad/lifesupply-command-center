# LifeSupply Command Center — Render and Vercel Handoff

## Current architecture

The LifeSupply public website and Command Center now live in **one repository**: `vidwad/lifesupply-command-center`. Render remains the production backend and authenticated internal Command Center. Vercel is a database-free public-site deployment surface for preview and later public-domain traffic.

## Verified preview access

The public Vercel review deployment is `https://lifesupply-command-center-2ks6r71qy-vidwads-projects.vercel.app/`. On September 8, 2026, it returned `200 OK` without an SSO redirect after owner-approved Vercel Authentication removal for this preview project.

The homepage, desktop header, and mobile navigation link **Command Center login** to `https://lifesupply-cc-web.onrender.com/login?redirectTo=/dashboard`. That Render route was separately verified to render the authorized-user sign-in surface rather than dashboard content. Keep the Render destination protected; never proxy dashboard credentials or Auth.js sessions through Vercel.

```text
Visitors → Vercel public alias → LifeSupply corporate pages
               │
               └── Command Center login → Render /login → Render /dashboard

Render → PostgreSQL + publication workflow + audit + worker + internal APIs
               │
               └── published-only /api/public/v1/* → future Vercel server-side reads
```

## Claude Code operating rules

1. Run `nvm use` before local work. The repository requires Node 24 or later.
2. Keep Vercel database-free. `pnpm public-web:build` is the Vercel build contract; it must not run `prisma migrate deploy`.
3. Keep Render as the only migration executor, dashboard host, worker host, and secret-bearing backend.
4. Never change `src/proxy.ts` to allow `/dashboard`, `/admin`, `/login`, `/forgot-password`, or internal APIs on the Vercel public host.
5. Keep public DTOs strict and approval-gated. Public pages may never receive raw Prisma output, customer data, supplier data, integrations, financial workpapers, investor CRM records, or secrets.
6. Preserve the standalone public repository only until the cutover runbook authorizes archival. It is a rollback source, not an active development target.

## Local commands

| Goal | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Local Render-style app | `pnpm dev` |
| Local public-site review | `PUBLIC_SITE_MODE=true NEXT_PUBLIC_COMMAND_CENTER_URL=https://lifesupply-cc-web.onrender.com pnpm dev` |
| Type check | `pnpm typecheck` |
| Test | `pnpm test` |
| Lint | `pnpm lint` |
| Render build | `pnpm build` |
| Vercel public build | `pnpm public-web:build` |
| Public preview smoke test | `PUBLIC_SITE_BASE_URL=<Vercel-preview-URL> pnpm test:public-e2e` |

## Next implementation phases

| Phase | Command Center work | Public-site work | Approval gate |
|---|---|---|---|
| 1 | Apply additive publication migration in Render staging | Keep approved static corporate content as fallback | Technical owner |
| 2 | Build protected public-content editor/reviewer views | Read published corporate pages from strict DTOs | Content owner + approver |
| 3 | Add document, news, and metric publishing | Add cache and server-side revalidation | Finance/corporate reviewer |
| 4 | Add channel-approved BigCommerce product projection | Add browse-only product discovery | Commerce owner |
| 5 | Add `PublicInquiry` workflow with privacy controls | Add validated contact form | Privacy + operations owner |

## Vercel preview configuration

Set only `PUBLIC_SITE_MODE=true`, `NEXT_PUBLIC_COMMAND_CENTER_URL=<Render web URL>`, and `NEXT_PUBLIC_APP_URL=<Vercel alias>` in Vercel Preview and Production. The public deployment must receive no database or internal service credentials.

## Required validation before a domain cutover

Run `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm public-web:build`; verify the Vercel preview and Render dashboard login; apply and test the additive migration in Render staging; and follow `docs/37_LIFESUPPLY_PUBLIC_CUTOVER_RUNBOOK.md` without archiving the rollback source early.

For Playwright, 21st MCP, Vercel MCP, and developer-tooling guardrails, read `docs/39_TOOLING_AND_MCP_PARITY.md`. MCP credentials are local developer configuration only and must not be committed or added to Vercel or Render environments.
