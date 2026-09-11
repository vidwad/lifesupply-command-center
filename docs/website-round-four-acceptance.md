# Website refinement, round four — route-level acceptance matrix

**September 10, 2026.** Companion to `docs/website-round-four-plan.md`.

Every row is enforced by the round-four sweep (`qa-sweep.mjs`, in this round's Stage D evidence) against a served build. A row passes only when the intended result renders and the withdrawn wording is absent.

## Structural checks, every route at every width

Twenty public routes at 360, 390, 768, 1280 and 1440 pixels. Each asserts a 2xx status, no horizontal overflow beyond one pixel, exactly one `<h1>` in `<main>`, no skipped heading level, `alt` on every image, an accessible name on every link, no third-party script, no form, and no visible text under a blur. At 1440 each route additionally asserts `noindex`, a canonical link, a title, a description and an `og:title`.

## Acceptance by change

| # | Route | Must be true |
| --- | --- | --- |
| 1 | `/` | No two sections titled around the operating businesses; the withdrawn group statement absent; the third section explains the corporate structure |
| 2 | `/`, `/about-us`, `/metabolic-health`, `/contact` | **With JavaScript disabled**: heading, supporting copy and actions all at `opacity: 1`; nothing carrying text inside the hero hidden |
| 3 | `/metabolic-health` | Disclosure closed by default; opens to four columns; summary carries Contracting party, What is provided, Status; no overflow at 360, 390, 768 |
| 4 | `/metabolic-health` | "one commercial relationship" absent; "not one contract, not one account" present; no reporting promise |
| 5 | `/clinic-solutions/ongoing-supplies` | Construction attribution and project-sequence note absent; project pointer present; non-clinical boundary retained |
| 6 | `/investor-relations` | Opening leads with the business; access-policy sentence absent |
| 7 | `/contact` | Choices precede preparation; five or more choices label their behaviour; exactly two labelled as opening the Clinics site; no form |
| 8 | `/about-us` | Milestone years non-decreasing down the page; cumulative clause present |
| 9 | `/news` | Access-class tiles absent; "none is downloadable" present |

## Preserved improvements, re-checked every run

Direct store shopping buttons; professional procurement; currency and reporting labels; parent and subsidiary distinctions; the commercial model near the top of Metabolic Health; the consolidated pathway catalogue; the planned execution sequence; the pharmacy distinction; company at a glance; and **the GLP-1 compatibility answer, expanded by click**.

## Journeys and behaviour

Pathway links followed by **keyboard and by click, at 1280 and 390**, each awaiting the navigation rather than reading the URL after it. Eight keyboard tab stops checked for a visible focus indicator. The Investors menu opened and closed with Escape. Five routes loaded under `prefers-reduced-motion: reduce` with no visible text left at zero opacity or blurred. The first eight outbound links requested. `sitemap.xml` confirmed a `urlset`; `robots.txt` confirmed to disallow crawling.

## Method rules built into the sweep

Three, each because it produced a wrong finding before it existed:

1. **Expand accordions and disclosures** before judging their content.
2. **Test the hero with JavaScript disabled**, or an entrance animation looks like a rendering failure.
3. **Await a navigation alongside the click or keypress**, not after it, and target a *visible* link. The catalogue renders a table and cards from the same data, so the first link in the DOM is hidden at desktop width; reading the URL too early made a working link look broken.

## Result

**Clean**, against the merged Stage C build and again after the Stage D review corrections.
