# Website improvement, round three — route-level acceptance matrix

**Stage E, September 10, 2026.** Companion to `docs/website-round-three-plan.md`.

Every row is checked by the round-three sweep (`qa-sweep.mjs` under this round's Stage E evidence) against a served build, not against the source. A row passes only when the intended text renders and the obsolete text is absent.

## Structural checks, every route at every width

Twenty public routes at 360, 390, 768, 1280 and 1440 pixels. Each route and width asserts: a 2xx status; no horizontal overflow beyond one pixel; exactly one `<h1>` in `<main>`; no skipped heading level; an `alt` attribute on every image; an accessible name on every link; no third-party script; no form; and no visible text left under a CSS blur. At 1440 each route additionally asserts a `noindex` robots meta, a canonical link, a title, a description and an `og:title`.

## Route acceptance

| Route | Must render | Must be absent |
| --- | --- | --- |
| `/` | Direct links to all three storefronts | — |
| `/about-us` | The three tiers: Operating, In development, Under evaluation. The two pharmacy meanings distinguished. The 2020 and 2023 acquisitions in the milestones | "Health Supplies Inc." |
| `/medical-supply-solutions` | A store link on every operating-brand card, before the brand-page link. The professional supply-review route with what it covers and what stays with the store | The card-covering overlay |
| `/pharmacy-solutions` | "This page is about supplying pharmacies", and the sentence separating supplying from running one | Any claim to operate or hold a licensed pharmacy |
| `/metabolic-health` | The commercial model above the pathway detail | The model below the closing disclosures |
| `/metabolic-health/care-kits` | Exactly eight distinct pathway destinations, each resolving | A second catalogue repeating the first |
| `/investor-relations` | Figures carrying `C$`, IFRS and unaudited basis | Any unlabelled dollar figure |
| `/investor-relations/disclosures` | "Currency: Canadian dollars", the period, the consolidated entity scope, and that no result is attributable to a single brand | "Currency: not stated" |
| `/investor-relations/growth-strategy` | Four planned steps: design and de-risk, controlled pilot, launch and integrate, replicate and scale | Any date, duration, count or target in the sequence |
| `/news` | The corporate overview, with figures matching the investor pages exactly | "governed workflow"; "author, reviewer, and review date" |
| `/our-team` | "Chairman & CEO" | "as published on the prior LifeSupply website" |
| `/contact` | All three subsidiaries by name; the existing-order route to the store | "not separate companies"; Command Center workflow wording |
| `/privacy`, `/terms`, `/accessibility` | Policy text matching actual behaviour | An accessibility audit that has not happened |

## Six priority journeys

Each is walked in a browser, not inferred from source.

| # | Journey | What is asserted |
| --- | --- | --- |
| 1 | Homepage to an operating store | The homepage carries a direct link to each of the three storefronts |
| 2 | Existing clinic to procurement | The store hub offers a supply review; every store card reaches its own store; the procurement route carries an encoded subject |
| 3 | Pharmacy to a development discussion | The page says which pharmacy business it is, distinguishes the two, and carries a pharmacy-specific subject |
| 4 | Investor to the model and materials | Disclosures carry currency, IFRS basis and period, with no unlabelled dollar figure; growth strategy carries all four planned steps |
| 5 | Pathway overview to detail | Exactly eight distinct destinations from one catalogue, each returning 2xx |
| 6 | Existing customer to store support | The contact page routes an existing order back to the store that took it |

## Stale-copy sweep

Every route is scanned for wording this programme withdrew: "Currency: not stated", "not separate companies", "Health Supplies Inc.", "governed workflow", "author, reviewer, and review date", "as published on the prior LifeSupply website", Command Center publication wording, and "disclosure context". The privacy statement is the single permitted exception, because the footer links to the staff login and privacy has to describe it.

## Behaviour

Eight keyboard tab stops checked for a visible focus indicator; the Investors menu opened and closed with Escape; five animation-heavy routes loaded under `prefers-reduced-motion: reduce` with no visible text left at zero opacity or blurred; the first eight outbound links requested and checked for a status below 400; `sitemap.xml` confirmed a `urlset`; `robots.txt` confirmed to disallow crawling.

## Result

**Clean**, against the merged Stage D build and again after the Stage E review corrections. Output in this round's Stage E evidence folder.
