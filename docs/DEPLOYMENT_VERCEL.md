# LifeSupply Public Website on Vercel

> **Selected role: public front end only.** Render remains the authenticated LifeSupply Command Center, PostgreSQL, background-worker, audit, publishing, and database-migration platform. Vercel hosts the public corporate website from the same repository without database access or internal service secrets.

## Deployment model

| Component | Host | Responsibility | Required secrets |
|---|---|---|---|
| LifeSupply public website | Vercel | Corporate pages, approved public content, public assets, investor context, and external dashboard-login link | None for initial static foundation |
| Command Center | Render | Auth.js login, `/dashboard`, internal APIs, Prisma/PostgreSQL, publication approvals, audits, documents, worker, and cron | Existing Render secrets only |
| Public-read API | Render | Published-only DTOs at `/api/public/v1/*` | Render database connection only |

The public Vercel deployment deliberately does not run Prisma migrations and must not receive `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `MASTER_ENCRYPTION_KEY`, supplier credentials, or integration keys.

## Vercel configuration

The repository `vercel.json` uses `pnpm public-web:build`, which runs `next build` without `prisma migrate deploy`. Create or retain the `lifesupply-command-center` Vercel project linked to `vidwad/lifesupply-command-center` and use the following non-secret configuration values for both Preview and Production environments.

| Key | Value |
|---|---|
| `PUBLIC_SITE_MODE` | `true` |
| `NEXT_PUBLIC_COMMAND_CENTER_URL` | Render web-service URL, initially `https://lifesupply-cc-web.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | The assigned Vercel alias for the selected environment |

Do not attach `lifesupplyhealth.com` yet. The Vercel alias is the review environment. When the public domain is ready, set `PUBLIC_SITE_MODE=false` and `PUBLIC_SITE_HOSTS=lifesupplyhealth.com,www.lifesupplyhealth.com`; preserve `NEXT_PUBLIC_COMMAND_CENTER_URL` so the public login link still routes to Render.

## Dashboard login behavior

The public LifeSupply header, mobile navigation, and homepage provide a **Command Center login** link. It opens the Render-hosted `/login?redirectTo=/dashboard` route directly. This is intentionally an external link because Auth.js safely accepts only same-origin internal return paths. The public Vercel host blocks `/login`, `/forgot-password`, `/dashboard`, `/admin`, and non-curated API routes.

## Render requirements

Render remains the only place to apply `prisma migrate deploy`. Keep `PUBLIC_SITE_MODE` unset and do not set `PUBLIC_SITE_HOSTS` on the Render internal host. Its own `AUTH_URL` and `NEXT_PUBLIC_APP_URL` must remain set to the Render Command Center origin so authentication cookies and internal redirects stay consistent.

The published-only `/api/public/v1/*` boundary may be called server-to-server from Vercel after public data has been approved and seeded. Do not expose any internal API route, raw Prisma model, database credential, or operational secret through Vercel.

## Preview acceptance checks

1. The Vercel alias renders the LifeSupply corporate homepage and all approved public routes.
2. The homepage and header login link opens the Render `/login` page and returns an authenticated user to Render `/dashboard`.
3. Vercel returns the public homepage for blocked internal paths instead of exposing dashboard or internal API content.
4. The Render `/api/health` and strict `/api/public/v1/site` endpoints behave as documented; the latter returns no operational fields.
5. Vercel has no database, Auth.js, worker, or integration secrets.

## Custom-domain cutover

Domain attachment is intentionally deferred. Before adding `lifesupplyhealth.com`, apply the additive publication migration in Render staging, validate approval/publish/unpublish workflows, confirm rollback to the Vercel alias, and secure explicit business approval of public content and investor disclosures.

For the full rollout and rollback process, see `docs/37_LIFESUPPLY_PUBLIC_CUTOVER_RUNBOOK.md` and `docs/38_RENDER_VERCEL_CLAUDE_HANDOFF.md`.
