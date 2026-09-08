# Stage 4 — Metabolic Health and eight supply pathways: evidence

**Prepared:** September 8, 2026 (UTC)
**Base:** `main` at `fab88e7` (Stage 3 merged as PR #71)
**Branch:** `claude/website-stage-04-metabolic-health`
**Predecessors:** The Stage 4 kickoff required PRs #67, #68, #69, and #70 on `main` in that order. On the product owner's instruction to commit and squash-merge after each stage, they were merged as `a355cf6` (#67), `fac59a4` (#68), `19ca3d5` (#69), and `fab88e7` (#71). PR #70 was closed automatically by GitHub when its base branch was deleted after #69 merged, so the identical Stage 3 commits were rebased onto `main` and merged as PR #71. Stage 4 was cut from a clean `origin/main` and stacks on nothing.
**Decisions supplied with the kickoff:** none. Both placeholders (WEB-04 program status, approved kit contents or an explicit "none yet", actual refill capability; any store configuration or SKU approved for linking) arrived unfilled. The interim treatment is in §5.

## 1. Work plan

WB-401 to WB-405 from `IMPLEMENTATION_BACKLOG.md`: the division hub at `/metabolic-health/`, the kit hub at `/metabolic-health/care-kits/`, the eight kit pages K01 to K08, and `/metabolic-health/refills/`, all as information pages with the availability status stated. Model starter, consumable, and occasional items and compatibility in the content model. Link only the verified category URLs already in `brands.ts` as browse links; K03 has no destination (S-89) and must say so. No SKU, price, discount, insurance, storage, or clinical claim; medication excluded from every non-drug kit; no universal syringe or device statement. Flip each route to live only when its page is complete.

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Content model | `src/lib/public-site/content/metabolic.ts` (new) | `KitPathway` type: id, slug, label, audience, purpose, the guide's critical distinction, `roles` typed `starter`/`consumable`/`occasional` (roles only, no product, quantity, or SKU), `compatibility`, `exclusions`, `availability: "in_development"`, `approvedContents: null`, `browse` references resolved through the brand registry, `browseNote` when browse is empty, FAQs. Hub, kit-hub, refills, status, and disclaimer copy. `KIT_SLUGS` and `getKit()`. |
| Brand registry | `src/lib/public-site/brands.ts` | `getBrandCategory(key, label)` resolves a registered category by label and throws on a typo, so a page can never render a guessed store URL. No new categories; the registry already held every browse destination used. |
| Route registry | `src/lib/public-site/routes.ts` | `METABOLIC_ROUTES`, `kitRoute()`. The three metabolic routes flip from `proposed` to `live`; eight kit routes registered live with `navGroup: null` and `routeFile` pointing at the dynamic route file. The Metabolic Health menu group now derives as: hub, Care kits, Refills. |
| Action registry | `src/lib/public-site/actions.ts` | Three internal navigation actions: `metabolic_hub`, `explore_kits`, `refills_information`. The only outward action on the pages is the existing approved `discuss_program` (`mailto:info@lifesupply.com`). |
| Pages | `src/components/public-site/pages/metabolic.tsx` (new); `lifesupply-pages.tsx` re-exports | `MetabolicHealthPage`, `CareKitsPage`, `CareKitPage({ slug })`, `RefillsPage`. A shared `StatusBand` puts the in-development sentence and the short disclaimer on every page. `BrowseLinks` renders registry-resolved category chips or the honest note that none exists. |
| Routes | `src/app/metabolic-health/page.tsx`, `care-kits/page.tsx`, `care-kits/[kit]/page.tsx`, `refills/page.tsx` | Thin composition with metadata. The kit route uses `generateStaticParams` over `KIT_SLUGS` with `dynamicParams = false`, so the eight pages are pre-rendered and any other slug is a 404. |
| Content barrel | `src/lib/public-site/lifesupply-content.ts` | `metabolic` added to `LIFE_SUPPLY_CONTENT`. |
| Canaries | `src/lib/public-site/public-boundary.test.ts` | Reads the new page family, content module, and four route files; `/metabolic-health` leaves the planned-route ban list. Five Stage 4 canaries: status band on all four page templates and the disclaimer text; no SKU, price, discount, percentage-off, insurance, cold-storage, clinical-proof, diagnose, or prescribe claim (the adjective "prescribed device" is compatibility language and stays allowed) and no cart or checkout wording; medication excluded from every kit and no universal-device or fits-any-device sentence; starter items excluded from refills and no automatic-shipment or subscription claim; browse links resolved only through `getBrandCategory` with the K03 note present. |
| Registry tests | `src/lib/public-site/registry.test.ts` | Live routes may name a dynamic `routeFile`; the primary navigation now expects five groups; the three metabolic routes and eight kit routes are live with the kit pages out of the menu; every kit browse reference resolves to a registered category, empty browse carries a note, every kit is `in_development` with `approvedContents` null and a medication exclusion; K03 has no browse and a sharps category does not resolve; content-declared metabolic actions exist. |
| Browser tests | `tests/e2e/lifesupply-public.spec.ts` | Principal-route list extended to five Stage 4 routes; the mobile panel expects Metabolic Health, Care kits, and Refills; three new tests: the kit hub lists eight pathways that all resolve, shows "In development", offers no purchase, and carries the approved program channel; the K03 page states no store destination and has no external link while the K06 page's external links stay on registered store hosts; the refills page says no automatic shipment or subscription exists. |

Untouched: `src/proxy.ts`, host and login helpers, `src/app/layout.tsx`, `src/app/page.tsx`, Prisma, workers, package versions, infrastructure, credentials, any operating site, `public/lsh/`.

## 3. Content and business claims introduced, omitted, or changed

### Introduced (Stage 4 drafts, pending product-owner approval)

| Block | What it says | Basis |
| --- | --- | --- |
| Status sentence (every page) | The service is in development; nothing is purchasable on this site; no configuration is published; availability will be announced when confirmed | WEB-04 unfilled; guide §3 "missing approved contents should lead to an honest program-information presentation" |
| Disclaimer (every page) | The site does not diagnose, prescribe, or recommend medication or dose; supply fulfilment is not drug dispensing | Guide §3 kit requirements |
| Four streams | Starter supplies, usage-driven consumables, clinic procurement, contracted workflow services, each agreed on its own terms; starter items never a subscription | Guide §2 operating model and the September plan's refinement |
| Audiences | Clinics, pharmacies, program participants; a clinic customer is not a program participant; supplies configured by the clinician or pharmacist, never by this site | Guide §2 |
| Process | Discuss, configure, confirm availability; a configuration is orderable only when contents, store, and fulfilment are confirmed and published | Guide §3 stage assignments |
| Eight pathways | Audience, purpose, the critical distinction verbatim in substance from the guide's kit table, item roles as roles, compatibility rules, exclusions, FAQs | Guide §3 kit table |
| K03 | No operating store publishes a sharps-container category; no destination until one exists; no regional disposal guidance until sourced | S-89; guide K03 row |
| K08 | Stock, shipping, complaints, and recalls responsibilities stated per program before fulfilment; never assumed | Guide K08 row and §3 pharmacies contract |
| Refills | Only consumables are refilled; reordering today happens through the stores' own accounts; no automatic shipment, reminder service, or subscription on this site; intervals, pauses, changes, cancellation, substitutions stated only when a service is published | Guide §3 refills row: "publish service claims only when supported" |
| Browse chips | "Browsing a store category is not ordering a configuration. Prices and availability are published on the store." | Guide §5 commerce contract |

Browse links per kit (all from the existing registry, verified 2026-09-08 in Stage 3): K01 and K02 LifeSupply and Wellmart needles and syringes; K04 LifeSupply first aid; K05 LifeSupply biometric monitors and medical thermometers, Wellmart health monitors, Balkowitsch digital measuring devices; K06 LifeSupply diabetic and blood glucose meters, Wellmart diabetic; K07 LifeSupply clinic supplies and needles and syringes; K03 and K08 none, each with the reason stated.

### Omitted deliberately

- Kit contents, quantities, images, SKUs, store configurations, bill-of-materials revisions: none exist (`approvedContents: null` on every kit). No purchasable placeholder is rendered.
- Prices, the 20% bundle discount, insurance coverage, savings, storage or temperature performance, clinical endorsement, dose or technique guidance, regional disposal rules.
- Any reminder or automatic-shipment service, intervals, or cancellation terms: none is operating.
- Any statement that the program is launched, piloting, or available.
- Referral or prescription-linked incentives; regulatory forecasts.

### Changed

- Route registry: `/metabolic-health/`, `/metabolic-health/care-kits/`, `/metabolic-health/refills/` are live; the Metabolic Health group now appears in the primary navigation, the mobile panel, and the footer's Explore list (the footer already listed hub routes from the registry).
- The homepage metabolic block is unchanged in copy; its action remains `discuss_program`. Reconciling the homepage to link the new hub is left to the Stage 5 link reconciliation named in the guide's dependency table.

## 4. Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, branch at the Stage 4 commit, `main` base `fab88e7`.

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm format:check` | Fails on pre-existing CRLF files only (BD-01) | Every changed and new file passes `prettier --check`; CI runs the same check on LF checkouts and stays green. |
| `pnpm typecheck` | Pass | |
| `pnpm lint` | Pass | |
| `pnpm test` | Pass, 83 files, 1,130 tests | Up from 1,123; the Stage 4 canaries and registry tests are included. |
| `PUBLIC_SITE_MODE=true pnpm public-web:build` | Pass | 32 static pages; `.next/server/app/metabolic-health/care-kits/` holds the eight kit pages plus the hubs. |
| `pnpm build` | Pass | Run after the local server was stopped so the two builds did not share an output directory. |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` in public mode | 45 passed, 3 skipped | Log: `evidence/stage-04/playwright-public.txt`. Skips are the pre-existing viewport-conditional cases. |
| Route smoke on the local production server | `/metabolic-health`, `/care-kits`, `/care-kits/sharps-supplies`, `/refills` 200; `/care-kits/nope` 404 | `dynamicParams = false` behaves as intended. |

## 5. Interim treatment for the unfilled decisions

| Placeholder | Treatment applied | Effect on release |
| --- | --- | --- |
| WEB-04 program status | Every page carries "In development" and the sentence that nothing is purchasable and availability will be announced when confirmed | The pages are information pages and are described as such; they are not product pages and are not called launched. |
| Approved kit contents | `approvedContents: null` on all eight; roles described as roles; no images | Product-owner-supplied contents, quantities, and images populate the same model later with a revision. |
| Actual refill capability | Refills page states the store-account reality and that no reminder or automatic-shipment service exists | When a service is published, the "when a service is published" block is replaced with its actual terms. |
| Store configuration or SKU approved for linking | None linked; browse chips point only at registry categories; K03 and K08 say why they have none | A future approved configuration attaches to a kit as a verified destination, not to a category. |

## 6. Visual review

`evidence/stage-04/`: the ten Stage 4 pages (`metabolic-health`, `care-kits`, eight `kit-*`) and `refills` at 390, 768, and 1440 px (33 captures); the Metabolic Health menu group open at 1440 (`menu-metabolic-health-1440.jpg`) and the mobile panel at 390 and 768 (`menu-open-*.jpg`). Reviewed in session: the 1440 menu group lists Care kits and Refills under an active Metabolic Health item; the kit hub at 1440 shows the role legend and eight cards each tagged "In development"; the K03 page at 390 keeps one h1, the status band, the roles, and the no-destination note readable in one column. No defects observed. Motion primitives reuse Stage 2's reduced-motion handling.

## 7. External-site work

None. No operating site was read or changed in this stage. `OPERATING_SITE_HANDOFFS.md` is unchanged; Stage 8 may add contextual Metabolic Health links to it once the program status is confirmed.

## 8. Deployment, migration, and external sends actually performed

None by the stage. Merging to `main` triggers the existing automatic Vercel production build of the public alias (D-11); the alias remains `noindex` with no custom domain, and `lifesupplyhealth.com` still serves the legacy site. No migration, no message, no operating-site change.

## 9. Limitations and follow-ups

- The pages are correct for a program that is in development. When WEB-04 is answered, the same content model carries contents, images, configuration revisions, and actual refill terms; the canaries that ban prices and SKUs will need a deliberate relaxation for approved data at that point.
- The homepage metabolic block still routes to the program-inquiry mailto rather than the new hub. Reconcile in Stage 5 with the other cross-links.
- Kit routes are registered with a synthetic `label` equal to the slug for registry completeness; they carry no navigation group and never render in menus.
- BD-01 to BD-06 remain untouched, as the stage prompts require.
