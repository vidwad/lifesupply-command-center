# LifeSupply Health Public Site Consolidation

## Decision

The LifeSupply Command Center repository is the authoritative repository for the public LifeSupply Health website and the internal Command Center. The public site is a first-class Next.js experience within this repository; it is not a second database, a separate content authority, or a browser-level client of internal APIs.

The Command Center remains the approval authority for corporate pages, leadership, news, investor documents, metric snapshots, product discovery, and contact channels. Operational data, customer records, supplier terms, investor CRM records, integrations, credentials, orders, and regulated-health workflows remain private.

## Current implementation

The consolidation branch adds a public corporate route surface at the root of the same Next.js application. Public routes retain WordPress-compatible paths for `/`, `/about-us/`, `/our-operations/`, `/our-team/`, `/investor-relations/`, `/news/`, `/contact/`, `/contact-2/`, `/shop/`, and retained historical leadership profile slugs.

The public host is selected by `PUBLIC_SITE_HOSTS` in production or `PUBLIC_SITE_MODE=true` for an explicit local public preview. On a public host, the request proxy permits only public pages, `/api/public/*`, and `/api/health`; it redirects dashboard, admin, and all other API paths to the public homepage. On the internal host, the existing authenticated Command Center behavior remains in force.

## Visual verification

On September 7, 2026, the unified public homepage and Investor Relations page were reviewed against the Next.js public preview. The public homepage rendered the original LifeSupply mark, approved corporate navigation, corporate content, and responsive layout without invoking the internal dashboard. The Investor Relations route rendered the dated 2025 unaudited financial-context cards and disclosure notice without exposing internal investor or operational records.

## Publication foundation

The branch introduces additive `PublicContentItem`, `PublicDocument`, `PublicMetricSnapshot`, and `PublicContactChannel` models with `draft`, `under_review`, `approved`, `published`, and `archived` states. A strict public DTO contract and `GET /api/public/v1/site` read model expose only published, time-valid, allowlisted fields.

> **Correction (September 8, 2026, website Stage 6):** the Render production API behaviour shows `20260907235000_public_web_foundation` **is applied** in production (D-09); the sentence below described the state when this document was written. The Render container applies every migration in `prisma/migrations/` on deploy, so later additive migrations are prepared under `docs/website-development/migrations/` until WEB-10 approves them.

The included migration is intentionally **not applied** by this branch. Apply it only through the Command Center’s normal staging and production migration process after backup and release approval.

## Cutover requirements

Before assigning `lifesupplyhealth.com` to this public deployment, set `PUBLIC_SITE_HOSTS=lifesupplyhealth.com,www.lifesupplyhealth.com` on the public web target. Keep the internal Command Center hostname separate and do not set `PUBLIC_SITE_MODE` outside explicit local previews.

The standalone `vidwad/life-supply-health` repository remains a rollback source until the unified public route set, migration, public host protection, and public deployment have been verified in staging and production. Do not archive it until that verification is complete.
