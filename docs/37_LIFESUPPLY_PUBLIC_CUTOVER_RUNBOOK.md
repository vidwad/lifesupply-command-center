# LifeSupply Health Public Site Cutover Runbook

## Purpose

This runbook consolidates the LifeSupply Health public website into the LifeSupply Command Center repository. The Command Center is the single repository, governed publication authority, and private operational backend. The public site and internal console remain separate deployment surfaces and hostnames.

> **Do not archive `vidwad/life-supply-health` until this runbook has passed in staging and the production rollback window has closed.** That repository and its `life-supply-health-foundation-v0.1.0` tag are the rollback source for the current public-site foundation.

## Target deployment model

| Deployment target | Source | Hostname | Required environment posture |
|---|---|---|---|
| Public website | This repository, Vercel public-web build | Vercel preview alias first; `lifesupplyhealth.com` later | `PUBLIC_SITE_MODE=true` for preview; database-free build; only public routes and external Render login link |
| Internal Command Center | This repository, Render Docker service | Existing Render Command Center hostname | `PUBLIC_SITE_MODE` unset; Auth.js, Prisma/PostgreSQL, publishing workflow, and operational secrets remain enabled |
| Background worker | This repository, same consolidation commit | No public hostname | Existing Inngest, browser automation, and integration credentials only |

One repository does not imply one process, one hostname, one secret set, or one public attack surface. The Vercel public-web deployment must not receive `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `MASTER_ENCRYPTION_KEY`, browser-automation, supplier-portal, integration-vault, or internal action secrets. Render remains the only migration executor.

## Database migration

The additive migration `20260907235000_public_web_foundation` creates the publication-domain tables and enums. It is intentionally un-applied in this branch.

1. Back up the production database and verify restore procedures.
2. Apply the migration in a staging database with `pnpm prisma migrate deploy`.
3. Run `pnpm prisma generate` and the full test suite.
4. Verify seeded roles receive `PUBLIC_WEB_EDIT` and `PUBLIC_WEB_APPROVE` only as intended.
5. Publish a controlled staging corporate page and verify that `/api/public/v1/site` returns only published, time-valid DTO fields.
6. Repeat the migration through the approved production release workflow after change approval.

No offering terms, investor CRM contacts, supplier data, customer data, integration connections, orders, financial workpapers, or regulated-health workflows are public-web content.

## Required publish workflow

For every public record, provide a source reference, business owner, content type, status, public visibility flag, effective date, and expiry or archive date where relevant. The permitted lifecycle is:

```text
draft → under_review → approved → published → archived
```

An editor may prepare a record. A user with `PUBLIC_WEB_APPROVE` must approve a record before `publishedAt` is set. Publishing, unpublishing, document replacement, metric changes, and delivery attempts must create audit events.

## Public routes and API

The Vercel public host serves the root corporate pages and legacy WordPress-compatible aliases. It blocks dashboard, admin, login, password, and non-public API paths by returning visitors to the public homepage. Its **Command Center login** action opens the Render-hosted `/login?redirectTo=/dashboard` route directly. The Render host serves the strict published-only `/api/public/v1/*` and `/api/health` endpoints; public readers use those endpoints server-to-server after publication content is approved.

Use the public endpoint server-to-server from a dedicated public-web deployment if the public site is later separated from the Command Center runtime. Never ship Command Center bearer tokens to browser code.

## Staging acceptance checklist

- [ ] Public host renders `/`, `/about-us/`, `/our-operations/`, `/our-team/`, `/investor-relations/`, `/news/`, `/contact/`, `/contact-2/`, `/shop/`, and retained leadership profile routes.
- [ ] Public host redirects `/dashboard`, `/admin`, `/api/integrations/*`, `/api/exports/*`, and `/api/sync/*` to `/`.
- [ ] Render host allows `/api/health` and `/api/public/v1/site`; the public endpoint returns no operational or customer fields.
- [ ] Vercel homepage, header, and mobile navigation open the Render `/login?redirectTo=/dashboard` route for Command Center access.
- [ ] Internal host continues to require Auth.js access for dashboard pages and non-public APIs.
- [ ] Published content appears only after approval, while drafts and archived records never appear in public API responses.
- [ ] A simulated database outage yields the generic no-store `503` public API response rather than a stack trace or internal data.
- [ ] Original brand assets, investor context, and dates render as expected on desktop and mobile.
- [ ] Public, internal, and worker deployments use distinct environment-variable sets.

## Current validation status

The consolidation branch passes TypeScript validation and **1,057 tests across 80 test files**. The focused public-host, DTO, and route-permission checks pass. GitHub Actions also completes the normal `prisma generate && next build` production build successfully on Node 24.

The sandbox default Node 22 runtime reproduced a `/_global-error` prerender `useContext` issue on both this branch and unchanged Command Center `main`. A similar Next.js 16 production build issue has been reported upstream.[1] The hosted Node 24 build does not reproduce the failure. This repository therefore pins the supported runtime to Node 24 through `.nvmrc` and the `engines` field.

Use Node 24 or later for local and deployment builds. Do **not** treat `--debug-prerender` as a production build command; it was used only to diagnose the Node 22 environment behavior.

## Rollback

If staging or production verification fails:

1. Restore the prior public domain deployment or route `lifesupplyhealth.com` back to the standalone Life Supply Health deployment.
2. Revert the Command Center release commit; do not roll back the database destructively, as this migration is additive.
3. Mark affected public records as archived or remove public-host configuration while the issue is investigated.
4. Keep the standalone repository and its release tag unchanged until a new unified release has been stable for the agreed rollback window.

## Claude Code continuation order

1. Implement publication CRUD views under `/public-web`, using the new approval permissions and audit helper.
2. Add server-side page/news/document readers that replace static public content one domain at a time.
3. Add signed publish-event webhooks and cache/path revalidation after public content reads are stable.
4. Add product discovery from a channel-approved BigCommerce projection; keep checkout external.
5. Add public contact routing only after privacy, retention, spam-defense, and service-level ownership rules are approved.
6. Resolve the normal Next.js production build issue before domain cutover.

## References

[1]: https://github.com/vercel/next.js/issues/95741 "Next.js issue #95741 — global-error prerender useContext failure"
