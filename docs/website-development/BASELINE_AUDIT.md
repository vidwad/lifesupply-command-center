# Stage 1 — Baseline Audit

**Workstream:** LifeSupply corporate website and operating-site integration (`docs/website-development/CLAUDE.md`)
**Stage:** 1 — Baseline, source reconciliation, and implementation specification
**Prepared:** September 8, 2026 (all timestamps UTC unless stated)
**Starting commit on `main`:** `148617e60a54d11c79786a66f0a75a1ed70f54cb` (merge of PR #66)
**Instruction package:** branch `origin/docs/lifesupply-website-staged-development` at `654ef4b` (PR #67, open, unmerged at the time of this audit)
**Branch for this stage:** `claude/website-stage-01-baseline`, cut from `origin/main` at the commit above
**Change posture:** documentation and evidence only; no runtime, package, infrastructure, credential, database, or external-site change

This audit records what exists, what is deployed, what is verified, and what is broken at the starting commit. It does not restate historical claims from earlier documents as current; every "verified" statement below names the command, probe, or file that produced it.

---

## 1. Repository and toolchain state

| Item | Observed | Evidence |
| --- | --- | --- |
| Working tree at start | Clean on `main` at `148617e` | `git status --short` empty |
| Origin | `https://github.com/vidwad/lifesupply-command-center.git` | `git remote -v` |
| Node pin | `.nvmrc` = `24`; `engines.node >= 24.0.0`; local `node -v` = `v24.14.0` | `package.json`, `.nvmrc` |
| pnpm pin | `packageManager: pnpm@10.0.0`; `engines.pnpm >= 9.0.0`; local `pnpm -v` = `10.0.0` | `package.json` |
| CI Node version | **20** in both jobs of `.github/workflows/ci.yml` (lines 43 and 77) | discrepancy with the Node 24 pin; see defect D-04 |
| Vercel project Node | `24.x` | Vercel project `prj_sjyLvOa5X7VhSKodEoGSPTElo58D` via MCP |
| Open PRs | #67 (instruction package, docs only); #58 (Net Sales refund deduction, Command Center, unrelated to the website) | `gh pr list` |
| Public-site PRs merged since consolidation | #59 consolidation, #60 database-free Vercel preview, #61 red/black/white pass, #62 LLD header behaviour, #63 hero footage, #64 pause-intent fix, #65 motion pass, #66 hero login removal | `gh pr list --state merged` |
| Release branches / tags | none (`docs/RELEASE_READINESS_STATUS.md` §4 convention defined, not exercised) | `git tag -l` empty |

The instruction PR #67 changes only `CLAUDE.md`, `docs/website-development/CLAUDE.md`, `docs/website-development/STATUS.md`, and `docs/website-development/KICKOFF_PROMPT.md`. Stage 1 was executed against the branch copy of those files with `git show`; this branch does not include them. **Dependency:** the root `CLAUDE.md` entry point and the tracker's predecessor live in #67. Merging #67 before or together with this PR is required for the tracker history to read continuously; the Stage 1 evidence itself has no code dependency on #67.

---

## 2. Public route and template inventory

All public routes live at the root of `src/app/` beside the authenticated route groups. The proxy, not the file layout, keeps them apart (§5).

| Route | File | Template (component) | Metadata | Rendering | Status |
| --- | --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | `LifeSupplyHome` on a public host; otherwise redirects to `/dashboard` or `/login` | root default | dynamic (reads `host` header) | live |
| `/about-us/` | `src/app/about-us/page.tsx` | `AboutPage` | title, description | static | live |
| `/our-operations/` | `src/app/our-operations/page.tsx` | `OperationsPage` | title, description | static | live |
| `/our-team/` | `src/app/our-team/page.tsx` | `TeamPage` | title, description | static | live |
| `/investor-relations/` | `src/app/investor-relations/page.tsx` | `InvestorRelationsPage` | title, description | static | live |
| `/news/` | `src/app/news/page.tsx` | `NewsPage` | title, description | static | live |
| `/contact/` | `src/app/contact/page.tsx` | `ContactPage` | title, description | static | live |
| `/contact-2/` | `src/app/contact-2/page.tsx` | `ContactPage` (duplicate render, **not** a redirect; no metadata) | none | static | live; see D-05 |
| `/shop/` | `src/app/shop/page.tsx` | `ShopBoundaryPage` (title "Product access"; single external action to lifesupply.ca) | title, description | static | live |
| `/[slug]/` | `src/app/[slug]/page.tsx` | `LegacyProfilePage` for the 13 slugs in `team.legacyProfiles`; `notFound()` otherwise | per profile | `force-dynamic` | live |
| `/_not-found` | Next default | no public `not-found.tsx` | — | static | default only |
| `/api/public/v1/site` | `src/app/api/public/v1/site/route.ts` | published-only DTO | — | `force-dynamic` | live on Render; 503 on Vercel by design (no database) |
| `/api/health` | `src/app/api/health/route.ts` | health probe | — | `force-dynamic` | 200 on Render; **500 on Vercel** (D-02) |

Legacy profile slugs served by `/[slug]/`: `abdul-ladha`, `ben-hastibakhsh`, `gary-li`, `craig-loverock`, `mike-gill`, `christopher-ishola`, `ross-jelveh-2`, `keith-dolo-2`, `barrett-e-g-sleeman`, `david-vogt`, `dr-margaret-clarke-2`, `dr-dedeshya-holowenko`, `john-anderson-2`. This matches the legacy WordPress page sitemap exactly (§8).

Not present at baseline: `sitemap.ts`, `robots.ts`, `public/robots.txt`, a public `not-found.tsx`, `/privacy/`, `/terms/`, `/accessibility/`, any `/our-operations/*`, `/clinic-solutions/*`, `/metabolic-health/*`, `/partners/*`, `/investor-relations/*` child, `/news/[slug]/`, or `/resources/*` route. The planning-era `/our-operations/canada/` and `/our-operations/united-states/` were never implemented.

### Shared shell and components

| Area | File | Notes |
| --- | --- | --- |
| Shell | `src/components/public-site/lifesupply-layout.tsx` | Client component. Charcoal utility strip (corporate email, investor phone, external Command Center login), sticky header that hides on scroll-down and returns on scroll-up, `NavItem` with red underline, bordered mobile toggle, mobile panel, footer with four-column-less layout (mark, Explore, Corporate office) and a login utility link. Navigation is flat (six items); no grouped menus. |
| Pages | `src/components/public-site/lifesupply-pages.tsx` | All eight page components in one 600-line file. |
| Primitives | `src/components/public-site/lifesupply-primitives.tsx` | `Container`, `Eyebrow`, `RedRule`, `PublicHero` (single h1 via `HeroTitle`, optional `media` slot), `SectionHeading`, `PrimaryAction`, `SecondaryAction`, `CommandCenterLoginLink` (`utility` and `menu` variants only; the only caller of `getCommandCenterLoginUrl()`), `EditorialStat` (counts up), `InfoBand`, `ImageBand`. |
| Motion | `src/components/public-site/motion.tsx` | `Reveal`, `Enter`, `Stagger`, `StaggerItem`, `HeroTitle`, `CountUp`, `SpotlightCard`, `ScrollBeam` on the `motion` package; every animating primitive consults `useReducedMotion()`. |
| Hero footage | `src/components/public-site/hero-video.tsx` | Legacy hero video cut to caption-free scenes; poster-only under reduced motion; no on-screen control (product-owner decision 2026-09-08); pauses off screen. |
| Content | `src/lib/public-site/lifesupply-content.ts` | Single `as const` object: `brand`, `homepage`, `about`, `operations`, `team` (management, board, legacyProfiles), `investorRelations`, `news`, `contact`, `operationsTimeline`, plus `LIFE_SUPPLY_ROUTES` and `LIFE_SUPPLY_NAVIGATION`. This static model is the render source; the publication DTO is not read by any public page. |
| Login helper | `src/lib/public-site/command-center.ts` | `getCommandCenterLoginUrl()` → `<NEXT_PUBLIC_COMMAND_CENTER_URL or https://lifesupply-cc-web.onrender.com>/login?redirectTo=/dashboard`. |
| Host boundary | `src/lib/public-site/host.ts`, `src/proxy.ts` | See §5. |
| Styles | `src/styles/globals.css` (`.lsh-shell` tokens), `src/app/layout.tsx` (Roboto / Roboto Condensed variables) | Tokens: `--lsh-brand-red #de0000`, `--lsh-red-hover`, `--lsh-red-on-ink`, `--lsh-ink`, `--lsh-charcoal`, `--lsh-paper`, `--lsh-surface`, `--lsh-muted`, `--lsh-rule`, `--lsh-rule-strong`. |

### Assets in `public/lsh/`

| Asset | Size | Dimensions | Used by | Provenance |
| --- | --- | --- | --- | --- |
| `lifesupply-mark.png` | 37 KB | 661×93 | header, footer | official logo supplied by the product owner 2026-09-08, trimmed 1:1 |
| `lifesupply-portfolio-lockup.png` | 12 KB | 389×93 | About | legacy `standard-logo.png` / `logo_footer2.png` (docs/40) |
| `abdul-ladha.jpg` | 70 KB | 700×882 | Team card (only portrait) | legacy `Abdul-Ladha.png` |
| `operations-timeline.jpg` | 289 KB | 1099×2560 (portrait) | Operations | legacy site graphic; carries 2018–2023 milestone text and figures as pixels only (not accessible text; see D-08) |
| `investor-presentation-preview.png` | 1.1 MB | 1233×2634 (portrait) | Investor relations | capture of the legacy deck; not a document |
| `hero/hero-loop.webm`, `hero/hero-loop.mp4`, `hero/hero-poster.jpg` | 253 KB / 426 KB / 38 KB | 1280×720 / 1600×900 | Home hero | legacy `LSHomeVid.mp4` (2021), caption-free scenes only |
| `hero/stills/*.jpg` (4) | 61–102 KB each | 1600×898 | none yet | red-tinted stills from the same footage, reserved for future heroes |

No operating-brand marks (Wellmart, Balkowitsch, Clinics, MedDirect, Dexton) are bundled. Docs/40 lists the legacy division marks as not yet approved for use.

---

## 3. Publication implementation (what exists, and how far it goes)

| Layer | State at `148617e` | Evidence |
| --- | --- | --- |
| Data model | `PublicContentItem`, `PublicDocument`, `PublicMetricSnapshot`, `PublicContactChannel`; enums `PublicContentStatus` (`draft → under_review → approved → published → archived`) and `PublicContentType` (`corporate_page`, `leadership_profile`, `news_item`, `investor_update`, `product_collection`); `siteKey` default `lifesupply-health`; preparer/approver relations; `effectiveAt`/`expiresAt` on content items only | `prisma/schema.prisma` lines 2164–2290 |
| Migration | `20260907235000_public_web_foundation` (106 lines) in the repository | `prisma/migrations/` |
| Migration applied in production? | **Indirect evidence yes.** `GET https://lifesupply-cc-web.onrender.com/api/public/v1/site` returned HTTP 200 with a valid, empty DTO (all arrays length 0) at 06:09 UTC. The service queries all four tables, so the tables exist on the Render production database. Not confirmed from Render's migration log in this session (Render MCP not authorized). Docs/36 and docs/37 still say "intentionally not applied"; they are stale on this point. | probe log in §5; `docs/36`, `docs/37` |
| Read model | `getPublicLifeSupplySite()` selects published rows (time-valid for content items only), maps to a strict zod DTO (`.strict()`), and `GET /api/public/v1/site` returns it with `s-maxage=300` or a generic no-store 503 on error | `src/server/public-web/service.ts`, `contracts.ts`, route |
| Consumers of the read model | **none.** No public page or server component reads the DTO; the static content file is the sole render source. | grep across `src/components/public-site`, `src/app` |
| Editor / reviewer UI | **none.** `/public-web` in the dashboard is a read-only count overview behind `PUBLIC_WEB_EDIT`; its own copy says editing and approval screens are the next step. | `src/app/(dashboard)/public-web/page.tsx` |
| Permissions | `PUBLIC_WEB_EDIT` (`public_web.edit`), `PUBLIC_WEB_APPROVE` (`public_web.approve`) defined; only the overview page consumes `PUBLIC_WEB_EDIT` | `src/lib/permissions.ts` |
| Audit events | none specific to publication (no publish/unpublish code path exists) | — |
| Documents | `PublicDocument` has `fileKey` and `publicUrl` but there is no storage, upload, or download route; no object storage is configured (`BLK-07`) | schema, `render.yaml` |
| Revalidation / webhooks | none | — |
| Tests | `src/server/public-web/contracts.test.ts` (DTO shape), `src/lib/public-site/public-boundary.test.ts` (33 source canaries), `host.test.ts`, `command-center.test.ts` | files present; all pass in the baseline run |

Capability classification (guide §Stage 1 task 2):

| Capability | Code-only | Reviewed | Deployed | Operationally verified |
| --- | --- | --- | --- | --- |
| Static corporate pages, shell, motion, hero | — | PRs #59–#66 merged | Vercel production alias | Playwright smoke passes against the alias (§6) |
| External Command Center login helper | — | yes | yes | Render `/login` renders sign-in; verified by smoke test |
| Public-host proxy block list | — | yes | yes | probed (§5) with the gaps noted there |
| Publication schema and migration | — | yes | appears applied on Render (indirect) | zero records; no workflow to exercise |
| Published-only public DTO and API | — | yes | Render 200 (empty); Vercel 503 by design | never exercised with a published record |
| Publication editor / approval / audit | not built | — | — | — |
| Inquiry capture | not built | — | — | — |
| Sitemap, robots, structured data, not-found | not built | — | — | — |

---

## 4. Inquiry implementation

There is no inquiry capture anywhere in the repository. `/contact/` and `/contact-2/` render a directory of five channels (`mailto:` and `tel:` links) and three subsidiary cards linking to the storefronts. No form, no `PublicInquiry` model, no intake API, no rate limiting, no consent copy, no acknowledgment delivery. The homepage carries no newsletter module (the legacy site had one). The operating storefronts each run their own contact forms on their own platforms (§8), which remain the only live intake paths today.

`grep -rniE "inquir|contact-form|lead"` across `src/` finds only Command Center modules (approvals, customers, investors CRM), none of which are public.

---

## 5. Deployment configuration and public-host protection

### Surfaces

| Surface | Source | Build | Host | Environment posture (observed) |
| --- | --- | --- | --- | --- |
| Public website | Vercel project `lifesupply-command-center` (team `vidwads-projects`) | `pnpm public-web:build` = `next build` (no Prisma migrate); install `pnpm install --frozen-lockfile`; region `iad1`; security headers set in `vercel.json` | Production alias `lifesupply-command-center-vidwads-projects.vercel.app`; also `lifesupply-command-center.vercel.app` and the `git-main` alias. **No custom domain is attached**; `lifesupplyhealth.com` still serves the WordPress site (§8). | `PUBLIC_SITE_MODE=true` was set in Production on 2026-09-08 after the alias had served the Command Center login; the alias now serves the corporate site. Variable values were not read in this session. Production builds from `main` on every merge. `X-Robots-Tag: noindex` is present on the alias (platform-provided for `*.vercel.app`). |
| Command Center | Render blueprint `render.yaml`: web `lifesupply-cc-web` (Docker), worker, cron; Postgres `lifesupply-cc-db` | Dockerfile runs migrations then `next start` | `https://lifesupply-cc-web.onrender.com` | `autoDeploy: true` on `main` for all three services (BLK-01 / DEC-12 open). `/` redirects to `/login`; `/dashboard` redirects to `/login?redirectTo=/dashboard`; `/api/health` 200; `/api/public/v1/site` 200. |
| Staging | `render.staging.yaml` and `docs/21_STAGING_ENVIRONMENT_GUIDE.md` exist; DEC-01/02 accepted staging provisioning | — | not probed; existence of a live staging stack not verified in this session (BLK-02 still open in `docs/RELEASE_READINESS_STATUS.md`) | — |
| CI | `.github/workflows/ci.yml`: typecheck, lint, format:check, test (job 1); `pnpm build` + `scripts/security/scan-bundle-secrets.mjs` (job 2); Node **20** | run `34190273490` on `148617e` succeeded | — | `staging-smoke.yml` is a manual workflow taking a `base_url` |

### Host isolation probes (production alias, 2026-09-08 06:09 UTC)

`src/proxy.ts` on a public host allows `/api/health` and `/api/public/*`, redirects `/dashboard*`, `/admin*`, `/login*`, `/forgot-password*`, and `/api/*` to `/`, and passes everything else through. Everything else then falls into the ordinary Auth.js branch.

| Path | Result | Assessment |
| --- | --- | --- |
| `/dashboard`, `/admin`, `/login`, `/forgot-password` | 307 → `/` | as designed |
| `/api/integrations/x/test`, `/api/exports/customers`, `/api/sync/bigcommerce/orders/full` | 307 → `/` | as designed |
| `/customers`, `/orders`, `/suppliers`, `/products`, `/financials`, `/investors`, `/reports` | 307 → `/login` (which then 307s → `/`) | **D-03.** These route families are not in the public block list; they are protected only by the generic "not logged in" redirect. Nothing leaks, because Vercel has no database and no session, but the public host advertises internal paths through a two-hop redirect and would render a dashboard page if a session cookie were ever valid on that host. The guide's Stage 1 note ("test all sensitive route families, not only `/dashboard`") is confirmed as a real gap. |
| `/api/public/v1/site` | 503, generic body | as designed on a database-free host (the DTO reader throws, the route returns the no-store 503) |
| `/api/health` | **500** | **D-02.** `checkFeatureFlags()` calls `getFeatureFlags()` outside a `try`, so a missing database produces an unhandled error rather than the documented `failing` 503. On Render the same route returns 200. |

### Render probes (same time)

| Path | Result |
| --- | --- |
| `/` | 307 → `/login` |
| `/login` | 200 (sign-in surface) |
| `/dashboard` | 302 → `/login?redirectTo=%2Fdashboard` |
| `/api/health` | 200 |
| `/api/public/v1/site` | 200; `{siteKey: "lifesupply-health", pages: [], leadership: [], news: [], investorUpdates: [], productCollections: [], documents: [], metrics: [], contacts: []}` |

---

## 6. Baseline verification results

Environment: Windows 10, Git Bash, Node `v24.14.0`, pnpm `10.0.0`, commit `148617e`, dependencies from the committed lockfile. Full log: `evidence/stage-01/baseline-checks-148617e.txt`.

| Check | Command | Result | Time | Notes |
| --- | --- | --- | --- | --- |
| Formatting | `pnpm format:check` | **FAIL** (exit 1) | 19 s | "Code style issues found in 423 files." Every flagged file is `i/lf w/crlf` in `git ls-files --eol` because this machine has `core.autocrlf=true`; the same commit passes `format:check` in CI (run `34190273490`). Environment artefact, not a source defect; recorded as D-01 because it blocks the local gate on Windows checkouts. |
| Types | `pnpm typecheck` | pass | 11 s | |
| Lint | `pnpm lint` | pass | 20 s | |
| Unit / contract tests | `pnpm test` (with `PUBLIC_SITE_MODE`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_COMMAND_CENTER_URL` unset) | pass | 14 s | 82 files, 1,092 tests |
| Public build | `PUBLIC_SITE_MODE=true NEXT_PUBLIC_COMMAND_CENTER_URL=https://lifesupply-cc-web.onrender.com NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100 pnpm public-web:build` | pass | 55 s | 12 static pages generated; the `/_global-error` prerender failure described in docs/37, docs/39, docs/40, and docs/41 **does not reproduce** on Node 24 at this commit |
| Normal build | `pnpm build` (`PUBLIC_SITE_MODE` unset) | pass | 54 s | one deprecation warning: `package.json#prisma` config is deprecated in Prisma 7 |
| Public browser smoke, production alias | `PUBLIC_SITE_BASE_URL=https://lifesupply-command-center-vidwads-projects.vercel.app pnpm test:public-e2e` | **pass** — 23 passed, 1 skipped, 34 s (06:58 UTC); log `evidence/stage-01/public-smoke-production-alias-148617e.txt` | — | 12 tests × 2 projects (Desktop Chrome, Pixel 7); one test is desktop-skipped by design |
| Public browser smoke, local | not repeated in Stage 1 | — | last local run at this commit: 23 passed, 1 skipped, during PR #66 verification with `--workers=1` against `next start` |

Bundled secret scan (`scripts/security/scan-bundle-secrets.mjs`) runs only in CI job 2 and passed there.

---

## 7. Runtime and baseline defects (recorded, not fixed)

| ID | Defect | Reproduction | Impact | Proposed owner / stage |
| --- | --- | --- | --- | --- |
| D-01 | `pnpm format:check` fails on Windows checkouts with `core.autocrlf=true` (423 files) | run on this machine at `148617e` | blocks the local formatting gate; CI unaffected | Add `.gitattributes` with `* text=auto eol=lf` or document `core.autocrlf=false`; Stage 9 or an earlier housekeeping PR. Not changed here. |
| D-02 | `/api/health` returns 500 on the database-free public host | `curl -I https://lifesupply-command-center-vidwads-projects.vercel.app/api/health` | uptime probes against the public alias cannot distinguish "no DB by design" from an outage; `vercel.json` even sets a `no-store` header for this path as if it were expected to work | Either wrap `checkFeatureFlags()` or return a public-mode health body without database checks; Stage 9 (release verification). |
| D-03 | Dashboard route families not named in the proxy block list redirect to `/login` on the public host before reaching `/` | probes in §5 | no data exposure today; weak boundary and information disclosure of internal paths; contradicts docs/37 checklist wording | Scoped boundary fix with regression tests covering every `(dashboard)` family; Stage 9, or earlier as a bounded security PR. |
| D-04 | CI runs Node 20 while the repository pins Node 24 (`.nvmrc`, `engines`, Vercel `24.x`) | `.github/workflows/ci.yml` | CI builds do not prove the pinned runtime; docs/37 states CI uses Node 24, which is not what the workflow says | Align `node-version` to 24; housekeeping PR. |
| D-05 | `/contact-2/` renders a second copy of the contact page with no metadata instead of redirecting | `src/app/contact-2/page.tsx` | duplicate content; the guide assigns a permanent redirect to Stage 9 | Stage 9 |
| D-06 | No `sitemap`, `robots`, structured data, canonical handling, or public `not-found.tsx` | file inventory | acceptable while `noindex`; required before cutover | Stage 9 |
| D-07 | Legacy hero footage has no on-screen pause control | product-owner decision 2026-09-08 (PR #65) | departs from the strict reading of WCAG 2.2.2 for auto-playing motion longer than five seconds; mitigated by reduced-motion poster and off-screen pausing | Record as an accepted deferral in Stage 9 or reinstate a control; owner decision |
| D-08 | Operations timeline and investor deck are images whose text is not available as HTML | `public/lsh/*.jpg`, `*.png` | the guide requires meaningful text in HTML; screen-reader visitors get alt text only | Stage 3 / Stage 5 content work |
| D-09 | `docs/36` and `docs/37` say the publication migration is "intentionally not applied"; the Render API behaviour shows the tables exist | §3 | stale runbook state; a future operator could re-plan an already-applied migration | Confirm from Render's migration history and correct the runbooks; Stage 6 |
| D-10 | Prisma `package.json#prisma` configuration deprecation warning in `pnpm build` | build log | none today; Prisma 7 will break it | housekeeping |
| D-11 | Vercel Production deploys from every merge to `main`; Render also auto-deploys from `main` | Vercel project settings; `render.yaml` | any merged website PR is live immediately on the public alias; BLK-01 / DEC-12 remain open | Product owner decision DEC-12 |

---

## 8. External sites reviewed

All five sites were fetched with `curl` and captured with headless Chromium at 1440×900 on 2026-09-08 between 06:05 and 06:08 UTC. Screenshots: `evidence/stage-01/*.jpg`. Observed statements are catalogued in `SOURCE_REGISTER.md`; only structure and technical facts are summarised here.

| Site | Platform | Structure observed | Contact / intake | Notes |
| --- | --- | --- | --- | --- |
| `https://lifesupplyhealth.com/` (legacy corporate) | WordPress, Elementor | Home, About Us, Our Operations, Our Team, Investor Relations, News, Contact (`/contact-2/`), `/shop/`, 13 leadership pages, a `CDNX` header button | newsletter form on Home (Elementor); no contact form captured | Still the live site on the custom domain. Page sitemap (served with an HTTP 404 status but a valid body) lists exactly 21 URLs, all of which the unified site already serves or aliases except `/privacy`/`/terms` (404 on legacy too). `/contact/` 301s to `/contact-2/`, `/ross-jelveh/` 301s to `/ross-jelveh-2/`. 49 `wp-content/uploads` assets referenced; investor presentation PDF (May 2022, 21.9 MB) still downloadable. |
| `https://www.lifesupplyclinics.com/` | WordPress | Home, About, Our Services, Clinic Equipment (`/clinic-equipments/`), Our Projects, Blog, Contact (`/contact-us/`), `/buy-clinic-equipment/`, six `/portfolio/*` project pages, Privacy Policy | "Book a Free Consultation" → `/contact-us/` (form); "Purchase Clinic Equipment" → `/buy-clinic-equipment/` (quote form; "one of our representatives will call you within 24 hours") | Header badge "100% Canadian". Serif display type, white-on-photo hero; not the red/black system. Project pages attribute work as "we were proud to support the construction"; the homepage says "Lifesupply and its core partners", which supports the guide's delivery-partner framing. |
| `https://lifesupply.ca/` | BigCommerce (Stencil) | Category-led storefront: Mobility Aids, Needles/Syringes, Reviews, Shipping & Ordering, Return Policy, Contact, About Us; left category tree incl. `/clinic-supplies/`, `/dental-clinic-supplies/`, `/diabetic/`, `/needles-syringes/`, `/blood-glucose-meters/`, `/biometric-monitors/`, thermometers, first aid | account login/create; contact form on `/contact/` | CAD pricing; free shipping over $99 in Canada; Yotpo reviews; "Please note: standard delivery time is 7–12 business days" banner. Red utility bar over a dark photographic header with the round LifeSupply mark. |
| `https://wellmartmedical.com/` | BigCommerce (Stencil) | Home, About Us, Contact Us; category tree Bracing, Incontinence, Mobility, Needles and Syringes, Ostomy, Respiratory, Veterinary, Bath Safety, Catheters, Compression, Diabetic, Enteral Feeding, Gloves, Health Monitors, Home Care, Home Medical Equipment, Skin and Wound | account login/register; contact form on `/contact-us/` | "All prices are in CDN"; free shipping in Canada over $100; red/white/black storefront with maple-leaf "100% Canadian" badge; "Best Price Guarantee". |
| `https://balkowitsch.com/` | BigCommerce (Stencil) | Home, About Us, Contact Us, FAQ, Terms, Privacy, Shipping & Returns; categories Beauty, Car Seats, Child, Comfort, Cushions, Digital Measuring Devices, Environment, Fitness, Flag Poles, Health, Household, Industrial, Insoles, Living Aids, Wound Care… | account login/register; contact form on `/contact-us/` | "All prices are in USD"; free shipping in the USA over $200; "Over 1 Million Customers" and "25 Years in Business" badges; same theme family as Wellmart. Broad general-merchandise catalogue, not medical-only. |

`https://lifesupply-command-center-vidwads-projects.vercel.app/` (unified public site, production alias) was captured for comparison.

---

## 9. What is verified versus assumed, in one list

Verified in this session: repository state and toolchain; route and component inventory; publication code and its non-use; absence of inquiry code; Vercel project settings, domains, and Node version; public-alias and Render host behaviour; all six baseline checks; the content of the five external sites at the URLs listed; the legacy URL inventory.

Not verifiable in this session: Render migration history and environment values (Render MCP not authorized); Vercel environment variable values (not read); whether a Render staging stack is live; the contents of the two business-plan PDFs named in the guide (not in the repository, not supplied); admin access to any of the four operating sites; current legal-entity relationships, ownership, and the identity of Clinics' delivery partners.
