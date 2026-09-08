# Stage 3 — Four brands, Clinic Solutions, and Shop & Services: evidence

**Prepared:** September 8, 2026 (UTC)
**Base:** `claude/website-stage-02-shell-home-about` at `3993cac` (PR #69), itself cut from `main` at `148617e`
**Branch:** `claude/website-stage-03-brands-clinics-shop`
**Predecessors and the stacking decision:** PR #67, #68, and #69 were all still open when Stage 3 began, and `main` was unchanged at `148617e`. Every Stage 3 page is built on the Stage 2 registries, shell, and content modules, none of which exist on `main`, so a branch from `origin/main` could not have carried this work. The stage was therefore built **explicitly stacked** on the Stage 2 branch, with its pull request based on that branch so the review diff shows Stage 3 alone. This is reported here and in `STATUS.md` rather than done silently. Merge order: #67 → #68 → #69 → this PR. GitHub re-targets a stacked PR to `main` when its base merges.
**Decisions supplied with the kickoff:** none. The three placeholders (WEB-01 entity and address wording, WEB-03 delivery partners and project attribution, brand asset files) arrived unfilled; the interim treatments applied are in §5.

## 1. Work plan

WB-301 to WB-307 from `IMPLEMENTATION_BACKLOG.md`: portfolio map at `/our-operations/`; four brand pages; technology and fulfilment page; Clinic Solutions hub and three children; Shop & Services; Contact intent routing without a form; external-site handoff notes. Flip each route to live only when its page is complete; link only verified store URLs; keep clinic development distinct from patient care; attribute delivery roles; treat post-opening supply as conditional.

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Brand registry | `src/lib/public-site/brands.ts` | Each record gains `supportHours`, `categories` (verified category pages, observed on the store, never guessed), and `storeLinks` (verified policy or service pages). 44 external URLs re-verified HTTP 200 at 15:14 UTC on 2026-09-08 before being listed. |
| Route registry | `src/lib/public-site/routes.ts` | Nine routes flipped from `proposed` to `live`: four brand pages, technology and fulfilment, the Clinic Solutions hub and its three children. `BRAND_ROUTES` and `STAGE_3_ROUTES` exported. Menus derive: Our Businesses now lists the five internal pages (store links moved to the brand pages and footer); Clinic Solutions appears as a group with three children. |
| Action registry | `src/lib/public-site/actions.ts` | Thirteen actions added (brand-page and hub navigation, Clinics projects, supplier, U.S. business, acquisition, general, shareholder services). Every `mailto:` is an approved directory channel; every external URL is a registered brand host. |
| Content | `content/businesses.ts`, `content/clinics.ts`, `content/shop.ts`; `content/contact.ts` gains `routing`, `intents`, `existingOrder` | Stage 3 copy with provenance notes. Store terms (thresholds, delivery times, prices) are never restated; pages say the store publishes them. |
| Pages | `pages/operations.tsx` (portfolio map), `pages/brands.tsx` (`StoreBrandPage` template, `ClinicsBrandPage`, `TechnologyFulfilmentPage`), `pages/clinic-solutions.tsx` (hub + `DesignBuildPage`, `EquipmentPage`, `OngoingSuppliesPage`), `pages/shop.tsx`, `pages/contact.tsx`; `lifesupply-pages.tsx` re-exports | Nine new pages, three rebuilt. |
| Routes | `src/app/our-operations/{lifesupply,wellmart-medical,lifesupply-clinics,balkowitsch,technology-fulfilment}/page.tsx`, `src/app/clinic-solutions/{,design-build,equipment,ongoing-supplies}/page.tsx`; `src/app/shop/page.tsx` metadata | Thin route composition with page-specific metadata. `/shop/` title is now "Shop & Services". |
| Canaries | `public-boundary.test.ts` | Reads the new page families and content modules; the planned-route list drops the routes that are now live; six Stage 3 canaries (patient-care distinction on every clinic page, attribution as the Clinics site states it, conditional post-opening close on every clinic page, no store terms anywhere, categories and channels read from registries, one hero and the shared layout per page). |
| Registry tests | `registry.test.ts` | Category and store links on the brand's own host over HTTPS without duplicates; the Stage 3 groups and children; every content-declared action exists; Clinics project links on the Clinics host. |
| Browser tests | `tests/e2e/lifesupply-public.spec.ts` | Principal-route list extended to the nine new pages; the Our Businesses dropdown now expects the five internal pages; the mobile panel expects the Clinic Solutions group; four new tests (brand pages send visitors to their own host only, the hub routes three needs and an open clinic can skip construction, Shop & Services names geography and currency and sells nothing, Contact routes intents without a form and sends existing orders to the store). |
| Handoff notes | `docs/website-development/OPERATING_SITE_HANDOFFS.md` | Draft per-site briefs, every row `proposed`; reciprocal links wait for the Stage 10 cutover because `lifesupplyhealth.com` still serves the legacy site. |

Untouched: `src/proxy.ts`, host and login helpers, `src/app/layout.tsx`, `src/app/page.tsx`, Prisma, workers, package versions, infrastructure, credentials, any operating site.

## 3. Content and business claims introduced, omitted, or changed

### Introduced (Stage 3 drafts, pending product-owner approval)

| Block | What it says | Basis |
| --- | --- | --- |
| Portfolio map framing | Brands, published entities, shared capabilities, and developing programs are distinct; entity-to-brand relationships stated only where confirmed | Guide §3; WEB-01 interim |
| Brand pages | Purpose, audience emphasis ("a marketing direction, not a restriction" for LifeSupply; "professional buyers are equally welcome" for Wellmart), categories, service channels | Guide §2 registry; observed store facts (S-52, S-80–S-88); support channels (S-25, S-28–S-30, S-24) |
| Balkowitsch page | "one of the four operating websites presented here … keeps its identity" | Guide §2; relationship unstated (S-15) |
| Technology and fulfilment | Implemented: catalogues/accounts/checkout, sourcing and distribution (approved text), wholesale (approved text), "an internal management platform … not customer-facing"; in development: kitting and fulfilment for metabolic programs, contracted workflow support | Observed store facts; approved operations copy; guide §2 operating model |
| Clinics | Services, specialties, four-stage process, six published project titles, geography, the distinction sentence, the attribution sentence, the conditional post-opening sentence | Clinics site (S-70–S-75); guide §2 |
| Clinic Solutions children | Consultation and quote checklists; "available today" versus "discussed case by case" for ongoing supplies | Guide Stage 7 project fields; observed store facts |
| Shop & Services | Four choices with geography and currency; support boundary | Observed store facts |
| Contact routing | Ten intents mapped to actions; "Existing order?" block | Guide §5 inquiry contract intents |

### Omitted or changed

| Item | Treatment | Reason |
| --- | --- | --- |
| Operations list page | Replaced by the portfolio map; the five approved capability descriptions are reused verbatim (four as shared capabilities, "Pharmaceutical" as a developing program with its existing qualification); the timeline graphic stays, labelled historical, with its figures explicitly not restated | Guide §3 hub contract; D-08 |
| Store thresholds, delivery times, prices | Never restated; a canary rejects them | Guide §5 commerce contract |
| Partner names, project clients, project imagery | Not shown | WEB-03 unresolved; only the Clinics site's published project titles are linked |
| MDEL, subsidiary, or ownership assertions | None added | WEB-01 unresolved |
| `/shop/` metadata title | "Product access" → "Shop & Services" | Guide §3 |

## 4. Verification

Environment: Windows 10, Node `v24.14.0`, pnpm `10.0.0`, committed lockfile.

| Check | Command | Result |
| --- | --- | --- |
| Formatting (touched files) | `prettier --check …` | pass |
| Formatting (repository) | `pnpm format:check` | fail on the pre-existing CRLF working-tree files only (BD-01, unchanged) |
| Types | `pnpm typecheck` | pass |
| Lint | `pnpm lint` | pass |
| Unit and contract tests | `pnpm test` | pass — 83 files, 1,123 tests (68 in the public-site suite) |
| Normal build | `pnpm build` | pass |
| Public build | `PUBLIC_SITE_MODE=true … pnpm public-web:build` | pass — 21 static pages |
| Public browser suite, local | `PUBLIC_SITE_BASE_URL=http://127.0.0.1:3100 pnpm test:public-e2e --workers=1` against `next start` of the public build | pass — 39 passed, 3 skipped (desktop-only or mobile-only tests); log `evidence/stage-03/public-smoke-local.txt` |
| External destinations | 44 URLs fetched | all HTTP 200 at 15:14 UTC; the list is in `brands.ts`, `actions.ts`, and `content/clinics.ts` |
| Public browser suite, preview | `PUBLIC_SITE_BASE_URL=https://lifesupply-command-center-git-claude-we-7af406-vidwads-projects.vercel.app pnpm test:public-e2e` | pass — 39 passed, 3 skipped, against the automatic Vercel preview for PR #70 (`dpl_7ow7EVh8BQJap81VLqJHwAAjMq8C`, commit `91750db`); log `evidence/stage-03/public-smoke-preview.txt` |
| Preview probes (15:39 UTC) | `curl` | `/`, the four brand pages, `/clinic-solutions/*`, `/shop`, `/contact` all 200; `/dashboard` 307 → `/`; `/customers` 307 → `/login` (D-03 reproduces); `/api/health` 500 (D-02 reproduces) |
| CI on PR #70 | GitHub Actions | **did not run**: `ci.yml` triggers only on pull requests to `main` and pushes to `main`, and this PR is based on the Stage 2 branch. The same commit passed typecheck, lint, the full unit suite, and both builds locally (rows above); Actions will run when the PR re-targets to `main` after #69 merges. |

## 5. Decisions applied as interim treatments

| Placeholder in the kickoff | Applied | To reverse |
| --- | --- | --- |
| WEB-01 entity and address wording | Approved names only; King George Highway retained; registry relationships `null`; the portfolio map says brand-to-entity relationships are stated only where confirmed | Fill `legalEntity` / `relationship`; edit `hub.entities.note` |
| WEB-03 partners, attribution, imagery | Services and process as the Clinics site publishes them; attribution limited to "together with its core partners"; six published project titles linked, no imagery, no client names | Add partner roles and permitted imagery to `content/clinics.ts` |
| Brand asset files | Text-only pages and cards | Set `asset` on the registry record |

## 6. Behaviour against the recorded defects and Stage 2 observations

- **D-02** (`/api/health` 500 on the public alias) and **D-03** (route families redirect via `/login`): untouched and unaffected. No Stage 3 page links any internal path outside the route registry; the browser test that requests every internal shell link now covers the nine new routes.
- **Trailing slashes** (Stage 2 observation): the registry keeps trailing slashes and Next redirects them; the new tests normalise before comparing. Stage 9 still owns the canonical decision.
- **D-11**: merging the stack would publish all of Stages 2 and 3 to the production alias at once.

## 7. Visual review

Captures in `evidence/stage-03/` (JPEG q45, headless Chromium, 2026-09-08): the twelve Stage 3 pages (`our-operations`, four brand pages, `technology-fulfilment`, `clinic-solutions` and three children, `shop`, `contact`) at 390, 768, and 1440 px after every reveal has fired; the Our Businesses and Clinic Solutions dropdowns at 1440; the mobile panel at 390 and 768.

Observed: one h1 per page; both new groups open and list their children; the portfolio map reads in four distinct bands; every brand page's external links stay on that brand's host; the Clinics page leads with the distinction and attribution; the hub routes three needs and the third bypasses construction; Shop & Services shows "Canada · CAD" three times and "United States · USD" once; Contact has no form. Remaining visual notes: the mobile panel is long with two groups expanded (it scrolls within the viewport); brand pages are text-only until assets arrive.

## 8. Limitations and what Stage 4 inherits

- Metabolic Health, Partners, and the investor children remain `proposed`; their groups stay out of the menus.
- Brand pages have no marks (WEB-08) and no legal-relationship statement (WEB-01).
- The Clinics pages link the six published projects by title only (WEB-03).
- Reciprocal links on the four operating sites are proposed, not applied, and wait for the cutover (`OPERATING_SITE_HANDOFFS.md`).
- No deployment, migration, external-site change, or message was made.
