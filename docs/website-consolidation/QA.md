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
