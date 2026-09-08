# Stage 8 — Operating-site integration and measurement: evidence

**Prepared:** September 8, 2026 (UTC)
**Base:** `main` at `ed15745` (Stage 7 merged as PR #76, verification record #77)
**Branch:** `claude/website-stage-08-operating-site-integration`
**Predecessors:** Stages 1 to 7 on `main` in order. Not stacked.
**Decisions supplied with the kickoff:** none. WEB-08 (access and owners per operating site), the analytics property and consent approval, the product-projection decision, and any change to WEB-07/WEB-10 all arrived unfilled. Consequences: every external row is `proposed`; the measurement taxonomy is defined and marked up but no script loads and no cookie is set; the product projection is recorded as a contract only; the inquiry form stays unpublished.

## 1. Work plan

WB-801 complete the handoff document per site; WB-802 apply nothing externally (no access, no owner); WB-803 define the taxonomy, consent model, inert markup, and the server-confirmed inquiry event; WB-804 record the projection contract. Plus the corporate-side contextual links the kickoff asked for where a verified destination exists.

## 2. What changed

| Area | Files | Change |
| --- | --- | --- |
| Handoffs | `docs/website-development/OPERATING_SITE_HANDOFFS.md` (rewritten) | Per-site placements (footer, about page, one category or equipment page; navigation deliberately unchanged), exact copy, post-cutover destinations, deliberate three-parameter UTM strings that the inquiry contract already accepts, owner (unknown, WEB-08), prerequisite (Stage 10 cutover; WEB-01 for Balkowitsch), independent verification procedure. All four sites `proposed`. |
| Measurement taxonomy | `src/lib/public-site/measurement.ts` (new) | The six events from the guide with allowlisted parameters (`brand`, `intent`, `documentType`; never a path, name, email, or free text); `inquiry_submitted` marked server-only; consent model with analytics denied by default; `measurementAttributes()` produces inert `data-measure*` attributes and drops anything not identifier-shaped; `actionMeasurement()` maps registry actions (store links, consultation, quote, investor materials). |
| Markup | `action-link.tsx`, `brand-grid.tsx`, `lifesupply-layout.tsx` (footer brand links), `pages/investors.tsx` (document download) | Measurable links carry the attributes. No handler, no script, no storage. |
| Server event | `src/server/measurement/events.ts` (new); `src/server/public-inquiry/intake.ts` | `recordServerEvent("inquiry_submitted", { intent, brand })` as a structured log line, called only after the inquiry row is persisted and never for a duplicate. |
| Contextual links | `action-link.tsx` (`RelatedActions`), `actions.ts` (`partner_clinics`, `partner_pharmacies`), content `related` lists in `metabolic.ts`, `businesses.ts`, `clinics.ts`; rendered on seven pages | Metabolic hub → Clinic Solutions, clinic collaboration, pharmacy programs; K07 → supply review, Clinic Solutions; K08 → pharmacy programs; LifeSupply brand page → Clinic Solutions, Metabolic Health; technology page → Metabolic Health, Clinic Solutions; Clinics brand page and Clinic Solutions hub → Metabolic Health and the store or collaboration page; ongoing supplies → Metabolic Health, clinic collaboration. Every destination is a registry action; a page with no list renders nothing. |
| Projection contract | `src/lib/public-site/product-projection.ts` (new) | Store, SKU, variant or pack, manufacturer reference, currency, region, availability, optional price, store-host destination, update time; stale after 60 minutes, and stale rows show neither price nor availability. No fetch, no render. |
| Tests | `measurement.test.ts`, `product-projection.test.ts`, `src/server/measurement/events.test.ts` (new); four Stage 8 canaries; two browser tests | See §4. |

Untouched: `src/proxy.ts`, Auth.js, Prisma, migrations, workers, package versions, infrastructure, credentials, the privacy page, the contact page, any operating site.

## 3. Content and business claims

No public sentence about the business changed. The only visible additions are the "Related" rows of existing registry actions on seven pages.

## 4. Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, no local database, `main` base `ed15745`.

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm format:check` | Fails on pre-existing CRLF files only (BD-01) | Every changed and new file passes `prettier --check`. |
| `pnpm typecheck` | Pass | |
| `pnpm lint` | Pass | |
| `pnpm test` | Pass, 97 files, 1,243 tests | Up from 1,231. |
| `PUBLIC_SITE_MODE=true pnpm public-web:build` | Pass | |
| `pnpm build` | Pass | |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` in public mode | 61 passed, 3 skipped | `evidence/stage-08/playwright-public.txt`. Two new tests: outbound brand links carry the attributes with all four brand keys, no third-party script, cookies limited to the two Auth.js technical names a local run receives (see D-12); related links resolve on three pages. |
| Homepage markup | 8 `brand_destination_click`, 2 `clinic_consultation_click`, 1 `equipment_quote_start` attributes on the built homepage | Counted from the local production server. |
| Production alias in a real browser | After four pages: cookies `[]`, third-party script hosts `[]` | `evidence/stage-08/alias-cookies-and-scripts.txt`. The privacy page's statements remain true for the public site. |
| Captures | `evidence/stage-08/`: the seven pages with related links, plus the K08 kit page, at 390, 768, and 1440 px (24 captures) | |

## 5. Finding recorded: D-12 (Render host sets Auth.js cookies on public routes)

A local production server (Render configuration: `AUTH_SECRET` present, proxy wrapped by the Auth.js middleware) sets `authjs.csrf-token` and `authjs.callback-url` on every public page. The Vercel public alias sets neither (verified above). The public site's privacy page is therefore accurate today, but if the Render host ever serves public traffic (or a preview is shared from it), the statement would be wrong. Proposed for Stage 9 under the scoped boundary fix the guide allows for `src/proxy.ts`: bypass the Auth.js wrapper for requests on a public host, with regression evidence for D-03. Not changed here.

## 6. Interim treatment for the unfilled decisions

| Placeholder | Treatment applied |
| --- | --- |
| WEB-08 access and owners | Every external row `proposed` with exact copy, destination, prerequisite, and verification; nothing applied; owners "unknown" with each site's published contact named |
| Analytics property and consent | Taxonomy and inert markup only; analytics consent denied by default; no loader, no cookie, no storage; loader deferred to Stage 9 or 10 with the privacy-page update in the same change |
| Product projection | Contract recorded with tests; nothing built |
| WEB-07/WEB-10 | Unchanged; form still unpublished |

## 7. External-site work, deployment, migration, and external sends

External: prepared only, blocked by access (WEB-08). Deployment: none by the stage (merge triggers the existing automatic builds). No migration, no message, no operating-site change.
