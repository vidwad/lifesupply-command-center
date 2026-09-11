# Consolidation QA

Verification actually performed, with outcomes. Nothing that failed is recorded as passing, and a merged pull request is never treated as evidence that production is correct.

## The standing check list

Every stage runs the repository gates. The final stage runs the whole list below.

### A. Route coverage

- All 21 retained pages answer 200.
- All 20 new redirects answer a permanent redirect to the exact destination, fragment included.
- Every pre-existing legacy redirect still resolves in one hop.
- Trailing-slash variants behave as the canonical form expects.
- `/partners/suppliers` and `/partners/acquisitions` answer 200 **after** `/partners` redirects.
- An unknown slug still returns the 404 recovery page.
- Published news and resource records are enumerated from the authorized feed if it returns any. None is fabricated to fill a template.

### B. Content transfer

- Unique content from every retired page renders at its recorded destination.
- All eight metabolic pathways are present, each with audience, purpose, item roles, compatibility, exclusions, store categories where they exist, and its FAQ.
- No retired page still renders duplicate content.
- No unsupported operating claim and no confidential material appears.

### C. Navigation and fragments

- Desktop and mobile menus match the five-item architecture.
- Keyboard operation, visible focus and dismissal all work; no menu depends on hover.
- Every new section anchor resolves and is not obscured by the sticky header.
- Deep links reveal their content **with JavaScript disabled**.
- Accordions and details are expanded before content is reported missing.

### D. Responsive and accessibility

- Every retained page at 360, 390, 768, 1280 and 1440.
- Headings, accessible names, image alternatives, horizontal overflow, long tables, reduced motion and focus.
- Automated checks only. **These are not an independent accessibility certification** and are not described as one.

### E. Business journeys

Canadian store selection; U.S. store selection; existing-order support; British Columbia clinic consultation; equipment quote; existing-clinic procurement; pharmacy supply-program enquiry; metabolic program enquiry; supplier enquiry; acquisition enquiry; investor materials; general contact.

Outbound destinations are verified by reading the resolved address. **No real enquiry or order is sent.**

### F. SEO and publication

- Retained pages carry correct canonical URLs and metadata.
- Redirected pages are absent from the sitemap.
- No dynamic template placeholder appears as a sitemap entry.
- Internal links point at final destinations, never at a redirect.
- Publication and confidentiality controls are preserved.

### G. Repository gates

`pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `PUBLIC_SITE_MODE=true pnpm build`, the Playwright suite, and the confidential-content canaries.

Tests are updated to match the approved architecture **without weakening** the business, confidentiality or accessibility protections they enforce. Where a canary pins an implementation that changed, it is rewritten to assert the rule instead, and the reason is recorded in that stage's commit.

## A limitation to keep in view

**CI does not run the Playwright suite.** The workflow runs typecheck, lint, format, vitest and the production build. Playwright is a local gate only, so it has no independent confirmation. This was discovered in round four and corrected there; it still applies.

## Stage 0

| Check | Result |
| --- | --- |
| `pnpm format:check` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass, 104 files, 1,318 tests |

Stage 0 changed no source, so no browser verification applies. The route inventory was enumerated from the page files, the route registry and the dynamic routes' static parameters, and reconciled against the audited total.

## Stage 1

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass, 104 files, 1,325 tests |
| `pnpm format:check` | Pass |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass, 42 static pages |
| Playwright, `--workers=1`, both projects | Pass, 83 passed, 5 skipped (project-specific) |

### Routes, verified against a live build

Requested on a production build at `127.0.0.1:3100`, reading the status and `Location` of each response.

| Address | Result |
| --- | --- |
| `/shop` | 308 → `/medical-supply-solutions#stores` |
| `/clinic-solutions/equipment` | 308 → `/clinic-solutions#equipment` |
| `/clinic-solutions/ongoing-supplies` | 308 → `/clinic-solutions#ongoing-supplies` |
| `/partners/clinics` | 308 → `/clinic-solutions#collaboration` |
| `/partners/suppliers`, `/partners/acquisitions`, `/partners` | 200 |
| `/clinic-solutions`, `/medical-supply-solutions` | 200 |
| `/nothing-here` | 404 recovery page |
| `/contact-2`, `/our-operations`, `/our-operations/lifesupply-clinics`, `/clinic-solutions/design-build`, `/investor-relations/documents` | 308, one hop each, destinations unchanged |
| `/abdul-ladha` | 200, retained profile |

**A slashed variant takes two hops.** `/shop/` answers 308 to `/shop`, which answers 308 to the destination. That is the repository's existing trailing-slash convention, identical for the legacy rules that predate this work; it was verified rather than introduced.

### Deep links without JavaScript

`#planning`, `#equipment`, `#ongoing-supplies`, `#collaboration` and `#stores` are all present in the served HTML, read from the response body rather than from a rendered page. Nothing depends on a script to reveal a section.

### Journeys

| Journey | Result |
| --- | --- |
| Store selection, Canadian and U.S. | Pass — geography, currency and each store's own support channel in `#stores` |
| Existing-order support | Pass — the support boundary sends an existing order to the store that took it |
| Clinic consultation | Pass — reaches the Clinics site's own consultation page |
| Equipment quote | Pass — reaches the Clinics site's own quote page |
| Existing-clinic procurement | Pass — supply review reaches the corporate office by mail |
| Clinic collaboration | Pass — reaches the approved channel, with its statuses shown |

Outbound destinations were verified by reading the resolved address. **No enquiry or order was sent.**

### Responsive

`/clinic-solutions` overflowed 91 px at 320 px on the first run, caused by a status badge that could not shrink. Fixed, re-verified: no public page is wider than the viewport at 320, 375, or at 200% zoom.

### A note on the header test

The header scroll-hide test failed on the first Stage 1 run on both projects and passed on the re-run. It has been intermittent since round two. It is **not** a regression from this stage, and it is **not** covered by CI, which does not run Playwright. It remains an open item.

## Stage 2

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check` | Pass |
| `pnpm test` | Pass, 104 files, 1,326 tests |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass, 31 static pages (42 less the eleven retired) |
| Playwright, `--workers=1`, both projects | Pass, 87 passed, 5 project-specific skips |

### Routes, verified against a live build

All eleven answer 308 to the exact fragment:

`/partners/pharmacies` → `/pharmacy-solutions#partner-program`; `/metabolic-health/care-kits` → `#pathways`; `/metabolic-health/refills` → `#replenishment`; and each of the eight pathway addresses → its own slug anchor, confirmed individually rather than by pattern.

Retained and answering 200: `/metabolic-health`, `/pharmacy-solutions`, `/partners`, `/partners/suppliers`, `/partners/acquisitions`, `/clinic-solutions`, `/medical-supply-solutions`.

### Deep links without JavaScript

All eleven Metabolic Health anchors and `#partner-program` are present in the served HTML, read from the response body. Every pathway's parts — audience, distinction, compatibility, exclusions, store categories, FAQs — appear eight times each in that body, once per pathway.

### Sitemap

26 canonical URLs: 41 before the consolidation, less the four stage 1 retired and the eleven stage 2 retired. The eight pathway addresses are absent, which was the defect this stage found and fixed.

### Journeys

| Journey | Result |
| --- | --- |
| Metabolic program enquiry | Pass — reaches the approved channel from the pathways |
| Pharmacy supply-program enquiry | Pass — reaches the approved channel from `#partner-program` |
| Pathway comparison and selection | Pass — one catalogue, each row opening its section |
| K03's absent store category | Pass — states plainly that no store carries it, offers no link |

No enquiry or order was sent.

## Stage 3

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check` | Pass |
| `pnpm test` | Pass, 104 files, 1,329 tests |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass, 30 static pages |
| Playwright, `--workers=1`, both projects | Pass, 90 passed, 6 project-specific skips |

### The `/partners` hazard, verified against a live build

| Address | Result |
| --- | --- |
| `/partners` | 308 → `/contact#business-inquiries` |
| `/partners/suppliers` | **200** |
| `/partners/acquisitions` | **200** |
| `/solutions` | 404 — no page was created for a menu that is only a menu |

`#business-inquiries` is present in the served HTML of `/contact`, so the redirect lands on rendered content with JavaScript disabled.

### Navigation

Desktop and mobile both verified. The Solutions menu opens from the keyboard (focus, Enter), closes on Escape, exposes `aria-expanded` and `aria-controls`, and never depends on hover. Its three entries are Clinic Solutions, Pharmacy Solutions and Metabolic Health Solutions, in that order, with no "Overview" row. Contact is last with no dropdown. The mobile panel keeps one group open at a time.

### Sitemap

25 canonical URLs: 41 before the consolidation, less the four stage 1 retired, the eleven stage 2 retired and the Partners hub. None of the retired addresses appears.

## Stage 4

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check` | Pass |
| `pnpm test` | Pass, 104 files, 1,329 tests |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass, 26 static pages |
| Playwright, `--workers=1`, both projects | Pass, 90 passed, 6 project-specific skips |

### Routes, verified against a live build

All four profile addresses answer 308 to their exact anchor; all four anchors are present in the served HTML of `/our-team`, so each redirect lands on rendered content with JavaScript disabled. The ten withdrawn profile addresses still answer 308 to `/our-team`, their destinations unchanged.

`/our-team` still renders exactly one `h1`: four pages became four sections, not four headings.

### Content transfer

Each section carries the portrait, the dated title, the full biography and the provenance note. Verified in the browser per person, not by pattern.

### The count

**21 canonical URLs in the sitemap**, the number the instruction names. Every one of the twenty retired addresses is absent from the map and answers a permanent redirect.

## Stage 5 — the final sweep

`tests/e2e/consolidation-sweep.spec.ts` is the standing check list, run against a production build on both the desktop and mobile projects. **32 checks, all passing.**

| Group | Checks |
| --- | --- |
| A. Routes | 21 retained pages answer 200; the count is asserted, not assumed. All 20 retired addresses answer 308 to their exact fragment. All 13 legacy redirects resolve in one hop with destinations unchanged. An unknown slug returns the recovery page |
| C. Fragments | Every declared fragment resolves to exactly one visible section. **Every one of the 20 also resolves with JavaScript disabled.** Query strings survive a redirect; an inbound fragment is overridden by the destination's; the sticky header covers no landing section, measured after layout settles; back and reload keep the reader in place; every landing section carries its own heading and enough context to stand alone; no target sits inside a closed disclosure |
| D. Responsive and accessibility | No retained page scrolls sideways at 360, 390, 768, 1280 or 1440. Every image declares an alternative. Heading outline audited separately: one `h1` per page, no skipped levels |
| E. Journeys | Outbound destinations stay on the four operating hosts, the three dated public-record hosts, or the login and video infrastructure. **Nothing was sent** |
| F. SEO and links | Every retained page carries a canonical URL and stays `noindex`. No internal link on any retained page points at a retired address |
| G. Gates | format, typecheck, lint, 1,329 vitest tests, the production build, and the confidentiality canaries |

### Standing limitation, restated

**CI does not run Playwright.** It runs typecheck, lint, format, vitest and the production build. The sweep above is a local gate with no independent confirmation. This was discovered in round four and still applies.

### Open items for the owner

- The acquisitions page does not distinguish a business owner exploring a sale to LifeSupply from a party seeking to acquire LifeSupply. Raised by the independent review; outside consolidation scope.
- The header scroll-hide test remains intermittent on this machine, unchanged by this work and unrelated to it.
- Carried from earlier rounds: 2024 comparatives, current titles for the three non-executive directors, which investor materials are available on request, and how a British Columbia clinic project is initiated.
