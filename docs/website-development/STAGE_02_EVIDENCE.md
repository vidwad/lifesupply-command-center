# Stage 2 — Public shell, homepage, and corporate overview: evidence

**Prepared:** September 8, 2026 (UTC)
**Starting commit on `main`:** `148617e60a54d11c79786a66f0a75a1ed70f54cb`
**Branch:** `claude/website-stage-02-shell-home-about`, cut from `origin/main`
**Predecessors:** PR #67 (instruction package) and PR #68 (Stage 1 evidence) were both still open when Stage 2 began; `main` had not moved since Stage 1. Stage 2's runtime work depends on neither. This branch carries `STATUS.md` forward from #68's copy, so the intended merge order is #67, #68, then this PR; `STATUS.md` here supersedes #68's version and will conflict trivially if #68 merges first.
**Decisions supplied with the kickoff:** none. The three placeholders (S-120 positioning, WEB-01 address and entity wording, brand asset files) arrived unfilled, so the safe interim treatments from `SOURCE_REGISTER.md` §12 were applied and are listed in §5 below.

## 1. Work plan

Implement WB-201 through WB-208 from `IMPLEMENTATION_BACKLOG.md`: typed brand, route, and action registries; grouped desktop and mobile navigation with utility links and a four-brand footer; the Home and About page contracts; the content module split; Stage 2 evidence. Do not fix BD-01 to BD-06; record how the new pages behave against D-02 and D-03.

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Brand registry (WB-201) | `src/lib/public-site/brands.ts` | Five typed records (corporate plus the four operating brands) with canonical URL, country, currency, purpose, verified support destination, `asset: null`, register references, and `verifiedAt`. `legalEntity` and `relationship` are `null` for every operating brand. The Command Center is deliberately not a brand record. |
| Route registry (WB-202) | `src/lib/public-site/routes.ts` | Every guide §3 route with `live` / `proposed` / `redirect` status and its navigation group; `LIFE_SUPPLY_ROUTES` kept as the legacy-compatible table. `buildPrimaryNavigation()` yields only groups whose hub is live (today: Our Businesses, Investors, About), and only live children or verified brand links; `buildUtilityNavigation()` yields Shop & Services and Contact. |
| Action registry (WB-202) | `src/lib/public-site/actions.ts` | Fourteen actions with internal, external, or `mailto:` destinations resolved through `actionHref()`. External destinations are the Clinics site's consultation and quote pages and the four canonical store URLs; `mailto:` destinations are approved directory channels only. The login is absent by design. |
| Registry tests | `src/lib/public-site/registry.test.ts` | 21 tests: HTTPS and no tracking parameters, null relationships, live-route-only menus, approved-channel mail, brand-host-only external URLs, login never resolvable. |
| Content split (WB-206) | `src/lib/public-site/content/{brand,home,about,operations,team,investors,news,contact}.ts`; `lifesupply-content.ts` is now a barrel | Same import path and shape for consumers; provenance notes beside every block. |
| Shell (WB-203) | `src/components/public-site/lifesupply-layout.tsx` | Grouped primary navigation with hover, focus-within, and a chevron button per group (`aria-expanded`, `aria-controls`, Escape closes); trigger is a real link to the hub; children exclude the hub itself so one `aria-current` per navigation. Utility strip carries Shop & Services, Contact, and the external login. Mobile panel lists every group and link as rows with no hover requirement, scrolls within the viewport, closes on route change and Escape. Footer: mark, **Operating brands** (four verified external links with geography and currency), Explore, Corporate office, legal row with login. |
| Action rendering | `src/components/public-site/action-link.tsx` | Renders a registry action by destination kind (next/link, new-tab anchor, mail anchor). |
| Brand cards (WB-207) | `src/components/public-site/brand-grid.tsx` | Text-only cards from the registry: geography and currency, name in the display face, purpose, "Visit …" external link. Renders a mark only when `asset` is non-null. |
| Home (WB-204) | `src/components/public-site/pages/home.tsx` | Hero (footage retained) with three actions; group introduction; red operating-context band; three approved figures; four brands; clinic lifecycle (plan, equip, supply) with verified destinations; metabolic opportunity marked "In development"; partner and investor paths; historical news; closing directory. |
| About (WB-205) | `src/components/public-site/pages/about.tsx` | Hero with the approved growth text and "Explore our businesses"; mission and vision; footprint; dated, sourced milestones on a scroll beam; four brands; the portfolio lockup labelled "Portfolio marks"; growth direction. |
| Other pages | `src/components/public-site/lifesupply-pages.tsx` | Home and About re-exported from `pages/`; the Shop boundary action now comes from the registry; everything else unchanged. |
| Canaries | `src/lib/public-site/public-boundary.test.ts` | Read the split modules and page families as one source; six new Stage 2 canaries (no `https://` or hand-typed mail in components, menus derived from the registry and never naming a planned route, only the three approved figures and no legacy count, Home and About built from the content model and the brand grid, text-only brand cards, keyboard-operable groups). |
| Browser tests | `tests/e2e/lifesupply-public.spec.ts` | Five new tests (grouped desktop navigation from the keyboard with the four brand hosts, mobile panel completeness, footer brand links, every internal shell link resolves, homepage path destinations); three expectations updated for the new shell. |

No change to `src/proxy.ts`, `src/lib/public-site/host.ts`, `src/lib/public-site/command-center.ts`, `src/app/**`, Prisma, workers, package versions, infrastructure, or credentials.

## 3. Content and business claims introduced, omitted, or changed

### Introduced (Stage 2 drafts, pending product-owner approval)

All in `content/home.ts` and `content/about.ts`, each with a provenance comment. None adds a figure, partner, approval, availability, or legal relationship that `SOURCE_REGISTER.md` does not support.

| Block | Sentence(s) | Basis |
| --- | --- | --- |
| Home introduction | "LifeSupply connects medical-supply commerce, clinic development, equipment sourcing, and ongoing supply services across its Canadian and U.S. businesses." and the conditional expansion sentence | Guide §2 proposed positioning (S-120), second sentence qualified in the approved About pattern |
| Home brands heading | "Four operating websites across Canada and the United States." plus the accounts/currency/support note | Guide registry; observed store facts |
| Clinic lifecycle | Intro, three step descriptions, and the note that a consultation is not a contract and a quote is not an order | Guide §2 operating model; Clinics site services (S-70); verified destinations (S-73) |
| Metabolic | "In development" status and the four-sentence description ending "nothing on this site is a purchasable program yet." | Guide §2; no store collection exists (S-89, S-90) |
| Paths, newsroom, closing headings | Short headings and the "No later company news has been published." note | Approved records only |
| About footprint | "Two Canadian storefronts sell in Canadian dollars and ship across Canada. LifeSupply Clinics serves clinic projects in British Columbia. Balkowitsch Worldwide sells in U.S. dollars from the United States." | Observed store facts (S-52, S-72) |
| About milestones | Four 2022 items and the 2025 annual-report citation, each with date and source | Approved news records; approved figures |
| About direction | "The stated direction is to develop deeper clinic relationships…" | Guide §2, stated conditionally |

### Omitted or changed

| Item | Treatment | Reason |
| --- | --- | --- |
| Home pillars ("Experienced / Integrated / Growing") | Removed from Home and from the content model | Pillar 01 said "A decade of … experience", which conflicts with the approved "25+ years" (S-49 vs S-40); the Stage 2 Home contract has no pillar slot. A canary now rejects "A decade of". |
| Home "Corporate overview" band | Removed | Replaced by the partner/investor paths and closing contact the contract calls for |
| About "brands" cards (LifeSupply, Med Direct, Dexton) | Replaced by the four-brand registry grid; the `about.brands` data removed | `meddirect.ca` and `dexton.com` were not verified (S-18). MedDirect and Dexton remain in the Contact page's subsidiaries directory and in the portfolio lockup, unchanged. |
| About portfolio heading | "Operating brands in the public LifeSupply overview." → "The operating websites behind the group." | Matches the registry grid |
| Corporate office address | Unchanged: 6911 King George Highway | WEB-01 unresolved; the operating sites show a different address (S-21) |
| Brand marks | None added; cards are text-only | No authentic files or usage records supplied (S-135) |
| Group wording | "the LifeSupply group", "operating brands", "operating websites" | The guide's own framing; no ownership, subsidiary, or percentage assertion anywhere; registry relationships are `null` |

## 4. Verification

Environment: Windows 10, Node `v24.14.0`, pnpm `10.0.0`, committed lockfile.

| Check | Command | Result |
| --- | --- | --- |
| Formatting (touched files) | `prettier --check …` | pass |
| Formatting (repository) | `pnpm format:check` | fail on the pre-existing CRLF working-tree files only (BD-01, unchanged) |
| Types | `pnpm typecheck` | pass |
| Lint | `pnpm lint` | pass |
| Unit and contract tests | `pnpm test` | pass — 83 files, 1,114 tests (21 new registry tests, 6 new canaries) |
| Public build | `PUBLIC_SITE_MODE=true … pnpm public-web:build` | pass |
| Normal build | `pnpm build` | pass |
| Public browser suite, local | `PUBLIC_SITE_BASE_URL=http://127.0.0.1:3100 pnpm test:public-e2e --workers=1` against `next start` of the public build | pass — 31 passed, 3 skipped (desktop-only or mobile-only tests) |
| Public browser suite, preview | `PUBLIC_SITE_BASE_URL=https://lifesupply-command-center-git-claude-we-74d769-vidwads-projects.vercel.app pnpm test:public-e2e` | pass — 31 passed, 3 skipped, against the automatic Vercel preview for PR #69 (`dpl_CpmiSA8QXWx7LuTpXAkcSasJoTPw`, commit `2b9d087`); log `evidence/stage-02/public-smoke-preview-2b9d087.txt` |
| CI on PR #69 | GitHub Actions run 34199582853 | both jobs pass |

## 5. Decisions applied as interim treatments

| Placeholder in the kickoff | Applied | Effect to reverse if the owner decides otherwise |
| --- | --- | --- |
| S-120 positioning copy | The guide's first sentence used verbatim; the expansion sentence stated conditionally; both flagged "pending approval" in `content/home.ts` | Edit two strings in `content/home.ts` |
| WEB-01 address and entity wording | King George Highway retained; registry relationships and legal entities `null`; no MDEL, no subsidiary claim | Fill `legalEntity` / `relationship` and `brand.address` |
| Brand assets | Text-only cards | Add files under `public/lsh/brands/` with provenance and set `asset` on the record; the grid renders marks automatically |

## 6. Behaviour of the Stage 2 pages against the recorded defects

- **D-02 (`/api/health` 500 on the public alias):** unchanged and untouched. No Stage 2 page calls the health endpoint; it affects probes, not visitors.
- **D-03 (dashboard route families redirect via `/login` on the public host):** unchanged and untouched. Stage 2 adds no link to any such path: the canaries assert that no public component contains `/dashboard`, `/login`, or `/admin` hrefs, the route registry contains none, and the browser test "points every internal shell link at a route that exists" requests every internal header, footer, and utility link and expects 200. The boundary itself still needs the bounded fix in BD-03.
- **Preview probes (2026-09-08 07:32 UTC, `https://lifesupply-command-center-git-claude-we-74d769-vidwads-projects.vercel.app`):** `/` 200; `/dashboard`, `/admin`, `/login` 307 → `/`; `/customers` 307 → `/login` (D-03 reproduces); `/api/health` 500 (D-02 reproduces); `/api/public/v1/site` 503 by design; `X-Robots-Tag: noindex` present.
- **Trailing slashes (new observation for Stage 9):** the deployed site answers `/about-us/`, `/our-operations/`, `/shop/`, and `/contact/` with a 308 to the slash-less path, because `next.config.ts` sets no `trailingSlash`. The registry and the legacy URLs carry trailing slashes; the browser test that walks internal links passes because Playwright follows the redirect. Stage 9's canonical decision (WB-901/WB-902) must choose one form and set `trailingSlash` accordingly; it is not a Stage 2 change.
- **D-05 (`/contact-2/` duplicate):** the new shell never links to `/contact-2/`; the route is left for Stage 9.
- **D-11 (auto-deploy from `main`):** merging this PR would put the new shell and pages live on the Vercel production alias immediately. The PR is not merged.

## 7. Visual review

Captures in `evidence/stage-02/` (JPEG, headless Chromium, 2026-09-08): `home-{390,768,1440}.jpg` and `about-{390,768,1440}.jpg` full-page after every reveal has fired; `menu-open-{390,768,1440}.jpg` (mobile panel at 390 and 768, the Our Businesses dropdown at 1440); `footer-{390,768,1440}.jpg`.

Observed: one h1 per page; grouped desktop menu opens on hover, focus, and the chevron; mobile panel lists all groups and utility links; footer shows the four brands with geography and currency; figures settle on the approved text; reduced-motion visitors see the poster and fully opaque sections. Remaining visual notes: the sticky header overlaps the top of the footer in the `footer-390` and `footer-768` element captures (a capture artefact of a sticky header, not a layout defect); the hero footage remains the legacy loop with no on-screen control (D-07, owner decision).

## 8. Limitations and what Stage 3 inherits

- The three primary groups that exist today are Our Businesses, Investors, and About. Clinic Solutions, Metabolic Health, and Partners appear in the route registry as `proposed` and are absent from every menu until Stage 3–5 make their hubs live.
- Brand cards are text-only until assets arrive (WEB-08).
- The Home group introduction is the guide's proposed positioning and needs the owner's sign-off (S-120).
- BD-01 to BD-06 remain open; nothing in Stage 2 depends on them being fixed.
- No deployment, migration, external-site change, or message was made.
