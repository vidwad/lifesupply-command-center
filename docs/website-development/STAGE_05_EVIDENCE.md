# Stage 5 — Partners, investors, leadership, and resources: evidence

**Prepared:** September 8, 2026 (UTC)
**Base:** `main` at `622c7a8` (Stage 4 merged as PR #72)
**Branch:** `claude/website-stage-05-partners-investors`
**Predecessors:** Stages 1 to 4 are on `main` in order (`fac59a4`, `19ca3d5`, `fab88e7`, `622c7a8`). Not stacked.
**Decisions supplied with the kickoff:** none. All three placeholders (WEB-05 financing and public-market narrative with the public versus confidential document list; WEB-06 current roster and approved biographies; approved news items or resource briefs with dates and authors) arrived unfilled. The interim treatment is in §5.

## 1. Work plan

WB-501 to WB-507 from `IMPLEMENTATION_BACKLOG.md`: Partners hub and four children; investor hub rebuild with growth strategy, advanced therapeutics, documents index (metadata only), shareholder services, and disclosures; team reconciliation with retained profile slugs; News and Resource templates with approved initial content only; privacy, terms, and accessibility reflecting current behaviour; homepage cross-links reconciled with the Stage 4 hub. Render only the three approved 2025 figures; no financing amount, valuation, listing, or partner claim (S-63); restricted documents at a request step; no fabricated dates, authors, or releases. Flip each route to live only when its page is complete.

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Partners content | `content/partners.ts` (new) | Hub with four relationships and a "not a partnership" block that sends ordinary purchasing to Clinic Solutions; clinics (collaboration versus procurement, three collaboration types with status, boundaries); pharmacies (pharmacist selects, non-drug only, responsibilities per program, complaints and recalls, boundaries); suppliers (fit, requirements, four-step onboarding, boundaries); acquisitions (fit criteria, general structures, four-step confidential process, boundaries). |
| Investor content | `content/investors.ts` (rewritten) | Approved title, description, contact, figures, and expansion context carried verbatim, with `entity` scope added to the figures. New hub structure with four status-tagged rationale items and the forward-looking sentence; growth strategy (five strands with status and route, dated public record of six items); advanced therapeutics (four themes, all "Under evaluation", each with dependencies); documents (three access classes, three metadata records with `href: null`); shareholder services (seven purposes, three-step process, "no meeting announced"); disclosures (basis lines, forward-looking statement, tie to materials). `BusinessStatus` and `DocumentRecord` types. The deck preview object is removed. |
| Team content | `content/team.ts` (reworked) | Hero and labels; management cards drop the card `role` and resolve their title through `legacyTitle(slug)` from the dated legacy profile; board becomes six `{ name, slug }` entries linked to their preserved profiles; John Anderson stays a legacy profile only; `profileNote` replaces the workflow-labelled sentence. Biographies unchanged. |
| News content | `content/news.ts` (restructured) | `hero`, `sections`, `historical` (the four 2022 releases unchanged), `current: []`, `resources: []`; `NewsItem` and `Resource` types; `getNewsItem()`, `getResource()`. |
| Policy content | `content/policies.ts` (new) | Privacy, terms, accessibility as statements of current behaviour with an effective date and a contact action. |
| Route registry | `routes.ts` | `STAGE_5_ROUTES`, `profileRoute()`, `newsItemRoute()`, `resourceRoute()`; ten routes flipped live (Partners hub and four children; five investor children); privacy, terms, accessibility flipped live under a new `legal` nav group with `buildLegalNavigation()`; `/news/[slug]/` and `/resources/[slug]/` registered as proposed with their route files. |
| Action registry | `actions.ts` | `partners_hub`, `clinic_collaboration` (intent `partner`, `mailto:info@lifesupply.com`), `growth_strategy`, `advanced_therapeutics`, `investor_documents`. Existing `acquisition_inquiry`, `supplier_inquiry`, `discuss_program`, `investor_materials`, `shareholder_services`, `general_inquiry` reused. |
| Pages | `pages/partners.tsx`, `pages/investors.tsx`, `pages/team.tsx`, `pages/news.tsx`, `pages/policies.tsx` (all new); `lifesupply-pages.tsx` now only re-exports | Five page families. The barrel's inline Team, Investor, News, and profile implementations are removed. `StatusTag` and `ForwardLooking` put status and qualification beside the claim. Documents render as a table with "On request" status and no link. |
| Routes | `src/app/partners/{,clinics,pharmacies,suppliers,acquisitions}/page.tsx`, `src/app/investor-relations/{growth-strategy,advanced-therapeutics,documents,shareholder-services,disclosures}/page.tsx`, `src/app/{privacy,terms,accessibility}/page.tsx`, `src/app/news/[slug]/page.tsx`, `src/app/resources/[slug]/page.tsx` | Thin composition with metadata. The two dynamic templates use `generateStaticParams` over the (empty) approved lists with `dynamicParams = false`, so every slug is a 404 until a record is approved. `src/app/[slug]/page.tsx` (retained profiles) is unchanged. |
| Homepage | `content/home.ts`, `pages/home.tsx` | Metabolic block action is now the Stage 4 hub (`metabolic_hub`); the partner path now goes to the Partners hub (`partners_hub`); the newsroom reads `news.historical`. |
| Footer | `lifesupply-layout.tsx` | Privacy, Terms of use, and Accessibility links in the legal row, derived from the registry. |
| Canaries | `public-boundary.test.ts` | Reads the five new page families, five content modules, and sixteen route files; the planned-route check now bans the literals rather than the paths; the deck-preview dimension lines retire. Seven Stage 5 canaries: no financing amount, valuation, exchange, listing, structure, or counterparty and only the three approved dollar figures; documents at a request step with no `.pdf`, no download, no `public/documents` or `public/investors`; team titles only via `legacyTitle` and no deck preview; no news or resource without a record and no fabricated author or date; policies state current behaviour with no cookie, tracker, or consent claim and the shell loads no script; clinic collaboration distinct from procurement and pharmacy programs non-drug; forward-looking qualification and status tags in the investor pages. |
| Registry tests | `registry.test.ts` | Six primary groups; Partners with four children and Investors with five; three legal links; the two templates stay proposed with empty records; every team title resolves and the board is the approved six without John Anderson; document records have no href and a date; figures scoped; every content-declared action exists. |
| Browser tests | `tests/e2e/lifesupply-public.spec.ts` | Principal routes extended by fifteen; the mobile panel expects the Partners and Investors children; homepage expects the hub links; four new tests: partner routing and the acquisitions boundary; documents with no file link and scoped figures; team titles, six linked directors, John Anderson absent from the board but his profile served; newsroom empty-state honesty, unknown news slug 404, footer policy links, privacy statement text. |

Untouched: `src/proxy.ts`, host and login helpers, `src/app/layout.tsx`, `src/app/[slug]/page.tsx`, Prisma, workers, package versions, infrastructure, credentials, any operating site, `public/lsh/` (the deck preview file stays on disk, unrendered).

## 3. Content and business claims introduced, omitted, or changed

### Introduced (Stage 5 drafts, pending product-owner approval)

| Block | What it says | Basis |
| --- | --- | --- |
| Partners hub | Four relationships, each on its own terms; buying from a store needs none of them; ordinary purchasing is a customer conversation | Guide §2 operating model, §3 partners rows |
| Partner clinics | Collaboration is not procurement; program configuration and pilots "Proposed"; design partnership "Available through LifeSupply Clinics"; no clinical role, no incentives | Guide §3 clinics row, §3 kit rules; Clinics facts S-70–S-75 |
| Partner pharmacies | Pharmacist selects, service fulfils; non-drug only; responsibilities per program; complaints and recalls per agreement; "no pharmacy program is operating" | Guide §3 pharmacies row and pharmacies contract; WEB-04 |
| Partner suppliers | Fit, requirements, four-step onboarding; inquiry is not a listing commitment | Guide §3 suppliers row |
| Partner acquisitions | Fit criteria, general structures, confidential process; strategic and public-market counterparties as an inquiry type; "no transaction is announced or implied" | Guide §3 acquisitions row; S-63 |
| Investor hub | Four status-tagged rationale items; forward-looking sentence; five section cards | Guide §3 investor rows; S-60, S-61 |
| Growth strategy | Five strands with status; dated record limited to the four 2022 releases, the 2025 figures, and the August 25, 2026 presentation | About milestones (approved), S-60, S-61 |
| Advanced therapeutics | Four themes, none operating, each "Under evaluation" with dependencies; outcomes not predicted | Guide §3 advanced-therapeutics row, §2 |
| Documents | Three access classes; three metadata records (2025 narrative, 2026 presentation, May 2022 presentation); no file hosted; request via investor relations | S-60, S-61, S-64 |
| Shareholder services | Seven administrative purposes; no certificates or identity documents by email; no meeting announced | Guide §3 shareholder row; §5 inquiry contract |
| Disclosures | Period, basis, entity scope, currency-as-reported; forward-looking statement | S-60 qualification |
| Team | Titles as published on the prior website; board of six linked to profiles | S-100, S-101 |
| News | Current news: none; resources: none; historical four | S-110–S-113 |
| Policies | Current behaviour: no form, cookie, or tracker; hosting records; email handling; separate store and staff systems; accessibility features and limitations | Verified in session against the production build (§4) |

### Omitted deliberately

- Financing target, issue price, valuation, share count, listing, exchange, corporate-structure route, and any counterparty (S-63, S-65). The words TSXV, CSE, CPC, CDNX, and FendX do not appear.
- Market-size statistics from the legacy investor page (S-66).
- The deck preview image: its date could not be established, so it is neither labelled nor shown (S-64).
- Card titles that differed from the legacy profiles (S-101); John Anderson on the board (S-102).
- Any company news after 2022, any resource brief, any author, reviewer, or review date. The six suggested briefs (clinic procurement planning; starter equipment versus refills; supply compatibility; travel supply organisation; pharmacy supply partnership; metabolic program overview) are candidates for the product owner to author or assign, not content.
- Any partner, pilot, or program named as operating.

### Changed

- Homepage: the metabolic block links to `/metabolic-health/`; the partner path links to `/partners/`. The clinic and investor paths are unchanged.
- Investor hub: the deck preview is gone; figures now state entity scope; the page links to five children.
- Team: management titles now read from the dated legacy profiles; the board is linked.
- Newsroom: hero and structure replaced; the four historical items and their links unchanged.
- Route registry: thirteen routes live; the primary navigation now shows all six groups the guide names.

## 4. Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, branch at the Stage 5 commit, `main` base `622c7a8`.

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm format:check` | Fails on pre-existing CRLF files only (BD-01) | Every changed and new file passes `prettier --check`. |
| `pnpm typecheck` | Pass | One fix during the stage: the new action uses the existing `partner` intent, since the eleven intent types are fixed by the guide. |
| `pnpm lint` | Pass | |
| `pnpm test` | Pass, 83 files, 1,140 tests | Up from 1,130. |
| `PUBLIC_SITE_MODE=true pnpm public-web:build` | Pass | 45 static pages; the thirteen Stage 5 pages emitted. |
| `pnpm build` | Pass | Run after the local server was stopped. |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` in public mode | 53 passed, 3 skipped | Log: `evidence/stage-05/playwright-public.txt`. Two locator ambiguities in the new tests were fixed with `.first()` before the recorded run. |
| Route smoke | `/partners/clinics`, `/investor-relations/documents`, `/privacy`, `/john-anderson-2`, `/our-team` 200; `/news/anything`, `/resources/anything` 404 | |
| Policy fact check | Production alias response for `/about-us` carries no `Set-Cookie`; the HTML references no third-party script host; the root layout loads fonts through `next/font` and a theme provider that only reads a stored preference | Basis for the privacy page's statements. |

## 5. Interim treatment for the unfilled decisions

| Placeholder | Treatment applied | Effect on release |
| --- | --- | --- |
| WEB-05 financing and public-market narrative | Nothing named: no amount, structure, exchange, listing, or counterparty; status per theme; forward-looking qualification beside every strategy claim | The investor pages are accurate for a company with an approved 2025 narrative and an undisclosed financing plan. When WEB-05 is answered, additions are made to `investors.ts` with their source and date. |
| WEB-05 document list | Three metadata records; all "on request" or "historical"; no file hosted | Stage 6 adds actual public documents through the publication model with storage (BLK-07). |
| WEB-06 roster and biographies | Dated legacy titles; approved six-person board linked to profiles; John Anderson retained as a profile page only | Confirmed titles replace the legacy titles by editing `legacyProfiles` or adding a current-title field; the canary that forbids `member.role` will need adjusting then. |
| News and resource content | Empty arrays; templates and routes ready; empty states say so | Approved items populate `news.current` and `news.resources` with real dates and authors; the routes then pre-render them. |
| Policy review | Pages state verified current behaviour with an effective date | Legal or privacy review is pending and must precede Stage 7 collection; the evidence records the review as not yet done. |

## 6. Visual review

`evidence/stage-05/`: eighteen pages (Partners hub and four children; investor hub and five children; team; the John Anderson profile; news; privacy; terms; accessibility; homepage) at 390, 768, and 1440 px (54 captures); the Partners and Investors menu groups open at 1440; the mobile panel at 390 and 768 (full page). Reviewed in session: the Investors group lists its five children under an active item; the investor hub at 1440 shows four status tags, the forward-looking band, the scoped figures beside the dated expansion context, five section cards, and the footer's new legal row; the team page at 390 shows the titles note, dated legacy titles on every card, and six linked directors. The investor hub capture shows the figures mid count-up; the browser test asserts the final approved text. No defects observed.

## 7. External-site work

None. `OPERATING_SITE_HANDOFFS.md` is unchanged.

## 8. Deployment, migration, and external sends actually performed

None by the stage. Merging to `main` triggers the existing automatic Vercel production build of the public alias (D-11), which stays `noindex` with no custom domain. No migration, no message, no operating-site change.

## 9. Limitations and follow-ups

- The policy pages are drafted from verified behaviour but have not had legal or privacy review. They must be revised before Stage 7 adds any form or consent choice, and before Stage 8 adds measurement.
- The retained profile route (`src/app/[slug]/page.tsx`) still declares `force-dynamic`; it was not changed in this stage. Stage 9 should decide whether it becomes static with `generateStaticParams` over the profile slugs.
- `ROUTE_AND_ACTION_MAP.md` still shows the Stage 5 routes as proposed; the registry is the source of truth and the map is due a refresh in Stage 9 alongside the redirect map.
- The deck preview PNG remains in `public/lsh/` unrendered. Remove or label it once its date is known (S-64).
- BD-01 to BD-06 remain untouched.
