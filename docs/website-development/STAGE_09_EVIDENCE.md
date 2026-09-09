# Stage 9 — SEO, accessibility, migration, and release verification: evidence

**Prepared:** September 9, 2026 (UTC)
**Base:** `main` at `1e04402` (Stage 8 merged as PR #78, verification record #79)
**Branch:** `claude/website-stage-09-release-verification`
**Predecessors:** Stages 1 to 8 on `main` in order. Not stacked.
**Decisions supplied with the kickoff:** none. No WordPress export (the live legacy sitemap was used instead, and it matches Stage 1's inventory exactly); no custom-domain or DNS ownership; no analytics or consent approval (no loader added); WEB-07/WEB-10 unchanged (form still unpublished, migrations still prepared).

## 1. Work plan

Legacy inventory and keep/redirect/archive map; `/contact-2/` permanent redirect after confirming trailing-slash behaviour; canonical URLs, metadata, sitemap, robots, social preview, structured data; noindex posture for the alias, previews, drafts, the preview route, and everything until an explicit switch; a useful not-found page; scoped fixes for BD-01, D-02, D-03, D-04, D-12, and the retained-profile route; registry-derived route map; browser checks at 320/375/390/768/1440 with keyboard, zoom, reduced motion, contrast, empty and error states; provisional lab performance; `RELEASE_CANDIDATE.md`.

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Legacy map | `docs/website-development/LEGACY_URL_MAP.md` (new) | 21 legacy pages: 19 kept at the same address, `/contact-2/` redirected, `/ross-jelveh/` redirect preserved; feeds, WordPress APIs, and admin paths archived (404); assets replaced or archived with provenance. Trailing slash confirmed: slashed requests answer 308 to the unslashed canonical. |
| Redirects | `next.config.ts` | `/contact-2` → `/contact` and `/ross-jelveh` → `/ross-jelveh-2`, permanent (308). `src/app/contact-2/page.tsx` removed; the registry row stays `redirect`. |
| SEO helpers | `src/lib/public-site/seo.ts` (new) | `siteOrigin()` (`NEXT_PUBLIC_SITE_URL`, default the custom domain), `isIndexable()` (`PUBLIC_SITE_INDEXABLE=true` only), `canonicalPath()`/`canonicalUrl()` (unslashed), `publicMetadata()` (title, description, canonical, Open Graph, Twitter card, robots), `organizationJsonLd()` and `webSiteJsonLd()` (only facts already published; no `sameAs` to the stores, WEB-01). |
| Metadata sweep | 32 static public route files, 4 dynamic route files, `src/app/page.tsx` | Every public route builds its metadata through `publicMetadata()` with its own path; the homepage adds Organization and WebSite JSON-LD on the public host only. |
| Sitemap and robots | `src/app/sitemap.ts`, `src/app/robots.ts` (new) | 54 canonical URLs from the registry, the kit slugs, and the profile slugs; robots disallows everything until the switch, then disallows `/api/`, `/public-web/`, `/public-web-preview/`. |
| Social preview | `public/lsh/og-default.jpg` (new, 1200×630, 21 KB) | Cropped from the existing hero poster; no new photography. |
| Not-found | `src/app/not-found.tsx` (new) | Public host: the site shell with the navigation as recovery links and a Contact link; Command Center host: a plain message. Real 404 status; never a redirect. |
| D-03 and D-12 | `src/lib/public-site/public-paths.ts` (new), `src/proxy.ts` (scoped boundary change), `src/proxy.test.ts` (new) | The public host is decided **before** the Auth.js wrapper: public API and health pass; internal families (every `(dashboard)` and `(auth)` group plus the preview route, asserted against the directory listing) go home; registered public families and retained profiles pass; anything else falls through to a real 404. The wrapper is never invoked on the public host, so no Auth.js cookie is set. The internal host is unchanged. |
| D-02 | `src/app/api/health/route.ts` | On the public surface (`PUBLIC_SITE_MODE=true` or no `DATABASE_URL`) the probe answers 200 with `surface: "public-web"` and a skipped database check; the Command Center surface keeps the full checks. |
| D-04 | `.github/workflows/ci.yml` | Node 20 → 24 on both jobs, matching `.nvmrc` and `engines`. |
| BD-01 | `.gitattributes` (new), `.prettierignore` | `* text=auto eol=lf` with binary exceptions; the working copy was normalised through git; the untracked Python venv is prettier-ignored. `pnpm format:check` passes on the whole repository for the first time. |
| Profile route | `src/app/[slug]/page.tsx` | `force-dynamic` removed; pre-rendered from the content model with `generateStaticParams` and `dynamicParams = false`. |
| Contrast | `src/styles/globals.css`, `src/lib/public-site/contrast.test.ts` (new) | Surface token `#f0f0f0` → `#f1f1f1` (one step, imperceptible) so brand-red eyebrows on surface clear 4.5:1 (4.488 → 4.53). Eleven palette pairings asserted at AA. |
| Route map | `docs/website-development/ROUTE_AND_ACTION_MAP.md` | Registry-derived route and action tables appended (54 routes, 37 actions) and declared authoritative. |
| Tests | `proxy.test.ts`, `contrast.test.ts`; canaries updated (health literal moved, contact-2 route removed); four browser tests (real 404 and redirects, sitemap and robots, canonical/OG/robots meta and JSON-LD, no sideways scroll at 320/375 and at 200% zoom) | See §4. |
| Release candidate | `docs/website-development/RELEASE_CANDIDATE.md` (new) | Candidate, checks, content set, hosting and domain proposal, migrations, decisions, accepted deferrals, cutover and rollback record, owners. |

Untouched: Auth.js configuration, Prisma, migrations, workers, package versions, Render and Vercel configuration files, credentials, any operating site, the privacy page.

## 3. Content and business claims

No public sentence about the business changed. New visible text: the not-found page copy and the structured data (name, site, logo, published address, two published contact channels).

## 4. Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, no local database used by the public build, `main` base `1e04402`.

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm format:check` | **Pass, whole repository** | BD-01 closed. |
| `pnpm typecheck`, `pnpm lint` | Pass | |
| `pnpm test` | Pass, 99 files, 1,256 tests | Up from 1,243: proxy (6), contrast (11), canary updates. |
| `PUBLIC_SITE_MODE=true pnpm public-web:build`, `pnpm build` | Pass | `/sitemap.xml` and `/robots.txt` static; `/_not-found` present. |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` | 68 passed, 4 skipped | `evidence/stage-09/playwright-public.txt`. New: real 404 with recovery page; `/contact-2` 308 and `/about-us/` 308; sitemap of canonical URLs and robots disallow; canonical link, OG image, `noindex` meta, valid JSON-LD; no sideways scroll at 320 and 375 on seven routes and at 200% zoom (640 px viewport). |
| Local probes | `evidence/stage-09/local-probes.txt` | D-02: `/api/health` 200 `surface: public-web`. D-03: `/customers`, `/orders`, `/public-web`, `/public-web-preview/x`, `/api/exports/customers`, `/login`, `/dashboard` → 307 to `/`; `/no-such-page` → 404 with no redirect. D-12: zero `Set-Cookie` headers on `/` and `/about-us`. Redirects 308; profile 200 static. |
| Head tags | `evidence/stage-09/head-tags-about-us.txt` | canonical `https://lifesupplyhealth.com/about-us`; `robots: noindex, nofollow, nocache`; OG image absolute. |
| Sitemap and robots output | `evidence/stage-09/sitemap.xml.txt` (54 URLs), `robots.txt.txt` (`Disallow: /`) | |
| Lab performance (provisional) | `evidence/stage-09/lab-performance-provisional.txt` | Local `next start`, no CDN, no field data: LCP 168–1,488 ms, CLS 0 on four pages. INP is not measurable in a scripted run; the ≤200 ms objective needs field data after cutover. |
| Captures | `evidence/stage-09/` | Not-found, home, and contact at 320, 375, 390, 768, 1440 (15); About at 200% zoom (640 px viewport, DPR 2); keyboard focus on the homepage after three Tabs. |
| Reduced motion, keyboard menus, skip link, one h1 | Existing browser tests, still passing | Stage 2 to 8 coverage. |
| External accessibility audit | **Not performed** | Internal checks only; the accessibility page says so. |

## 5. Interim treatment for the unfilled decisions

| Placeholder | Treatment |
| --- | --- |
| Legacy export | The live `wp-sitemap` (404 status, valid body) is the source; it equals Stage 1's inventory. |
| Custom domain and DNS | Canonical defaults to `https://lifesupplyhealth.com`; indexing stays off until `PUBLIC_SITE_INDEXABLE=true`; the hosting proposal is in `RELEASE_CANDIDATE.md` §4. |
| Analytics and consent | No loader; the Stage 8 posture stands. |
| WEB-07/WEB-10 | Form unpublished; migrations prepared, not applied; not needed for the public cutover. |

## 6. External-site work, deployment, migration, and external sends

None by the stage. Merging deploys the Render web service (proxy change, health branch) and the Vercel alias (metadata, sitemap, robots, not-found, redirects). No migration, no message, no operating-site change.

## 7. Post-merge verification (recorded 2026-09-09 after PR #80 merged as `05c34be`)

All items below were verified; the record is `evidence/stage-09/post-merge-verification.txt`. Alias: `/contact-2` 308 to `/contact`; `/sitemap.xml` 200 with 54 canonical URLs; `/robots.txt` `Disallow: /`; `/no-such-page` 404 with the recovery page; canonical and `noindex` meta on a page; `/api/health` 200 `surface: public-web` (D-02 closed on the alias). Render: `/api/health` still reports the full checks; `/api/public/v1/news` 200.
