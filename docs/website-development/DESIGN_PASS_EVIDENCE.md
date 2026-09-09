# Design pass — layout, graphics, icons, and interaction: evidence

**Prepared:** September 8, 2026 (UTC)
**Base:** `main` at `e098a03` (Stage 10 launch package merged as PR #82)
**Branch:** `claude/website-design-pass`
**Request (product owner, 2026-09-08):** before content fine-tuning, review every page for layout, visual balance, effective use of images and graphics, icons, interaction and engagement, and unnecessary repetition, using 21st.dev components and Gamma-generated graphics, to a premium standard.

This pass changes presentation only. No public sentence about the business was added, removed, or reworded; every visible sentence still arrives from the content modules or the published read model. The Stage 1 to 10 registries, canaries, routes, actions, measurement markup, governed publishing, and the unpublished inquiry form are unchanged. Domain, DNS, indexing, and SEO remain deferred by the product owner.

## 1. What changed

| Area | Files | Change |
| --- | --- | --- |
| Section primitives | `src/components/public-site/sections.tsx` (new) | `IconBadge`, `IconFeatureGrid`, `SplitSection`, `ProcessSteps`, `Callout`, `BentoGrid`, `GraphicBand`. `BentoGrid` is adapted from the 21st.dev "Feature Bento" layout and restrained to the red/black/white system (square corners, hairline rules, no gradients on tiles). Card links keep the visible label as the accessible name and stretch it over the card, so the browser tests still locate links by name. |
| FAQ accordion | `src/components/public-site/accordion.tsx` (new) | Adapted from the 21st.dev motion-primitives Accordion: native buttons with `aria-expanded` and `aria-controls`, one panel open at a time, animated height through the `motion` package, collapsed under reduced motion. Used for the kit-page questions. |
| Icon registry | `src/components/public-site/icons.ts` (new), `src/lib/public-site/icon-map.ts` (new) | 38 lucide icons keyed by name; a title-to-icon map so content modules stay plain data. `icon-map.test.ts` asserts every mapped key exists; an unmapped title renders no icon rather than a wrong one. |
| Conceptual graphics | `src/lib/public-site/graphics.ts` (new), `public/lsh/graphics/*.jpg` (nine files, 79–260 KB, 1600×900) | Registry with real pixel size, descriptive alt text, and provenance. Generated with Gamma (photo mode) on a monochrome brief, scaled and given the site's grayscale-plus-red treatment with ffmpeg. No person, text, logo, product, or LifeSupply facility; every placement carries the "Conceptual image" caption. `graphics.test.ts` checks size, dimensions, byte budget, alt, and provenance. Register rows S-136 to S-144. |
| Page rewrites | `pages/home.tsx`, `about.tsx`, `operations.tsx`, `brands.tsx`, `clinic-solutions.tsx`, `metabolic.tsx`, `partners.tsx`, `investors.tsx` | Each family now has its own rhythm instead of the one bordered-card grid: bento hubs (Our Businesses, Partners, Investor sections), split sections with a graphic (brand pages, technology, metabolic audiences, refills, supplier fit, acquisition structures, About direction), numbered process rails with icons (Clinics, metabolic, supplier and acquisition onboarding), icon feature grids with status tags (streams, rationale, strands, developing programs), callouts for boundaries and exceptions, and one full-bleed graphic band (Clinic Solutions). Icons on every step, tile, channel, and legend. |
| Page polish | `shop.tsx`, `contact.tsx`, `team.tsx`, `news.tsx`, `policies.tsx` | Icons on choices, intents, channels, entities, and section labels; policy pages gain a sticky in-page contents list with anchor links. |
| Motion fixes | `src/components/public-site/motion.tsx` | Two defects found by the captures and fixed in scope: (1) `CountUp` hydrated against different text for reduced-motion visitors (React #418) on the three pages with figures; it now reads the preference through a hydration-safe store. (2) Every reveal primitive dropped its variants for reduced-motion visitors after the server had rendered the hidden state, so the server's `opacity: 0` styles stayed on the elements and reduced-motion visitors saw blank pages wherever hydration succeeded. The primitives now always start hidden on both sides and, under reduced motion, become visible on mount with a zero-duration transition, so every section is fully opaque without scrolling. |
| Canaries | `public-boundary.test.ts` | `sections.tsx` and `accordion.tsx` added to the public-component set (no raw hex, no raw `img`, no `https://`, no dashboard href, no planned-route literal); graphics only through the registry and only with the conceptual caption; accordion keyboard and reduced-motion rules; motion count accepts the hydration-safe hook. |

Untouched: content modules (no copy change), routes, actions, brand registry, Auth.js, Prisma, migrations, workers, internal APIs, Render and Vercel configuration, env separation, credentials, operating sites, hero footage and portraits, `public/lsh/` originals.

## 2. Repetition review

Removed: the identical bordered-card grid that opened most pages; the duplicated hero sentence in the Partners bento tile; separate "steps" and "rule list" markups re-implemented per page. Kept deliberately, because each page must stand alone: the clinic distinction and attribution on the four Clinic Solutions pages and the Clinics brand page; the in-development status band on the four metabolic pages; the forward-looking statement beside investor claims; the store support boundary on each brand page.

## 3. Verification

Environment: Windows 10, Node 24.14.0, pnpm 10.0.0, no local database used by the public build.

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm format:check` | Pass, whole repository | |
| `pnpm typecheck`, `pnpm lint` | Pass | The lint rule against components created during render shaped `IconBadge` (icons render through `createElement`). |
| `pnpm test` | Pass, 101 files, 1,262 tests | New: `graphics.test.ts` (2), `icon-map.test.ts` (2), canary additions. |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass | 59 static pages. |
| Playwright, `chromium` and `mobile-chrome`, `--workers=1` against `next start -p 3100` | 68 passed, 4 skipped | `evidence/design-pass/playwright-public.txt`. The header-hide test failed once while the capture script was driving the same server and passed on every quiet run; it is load-sensitive, not changed by this pass. |
| Captures | `evidence/design-pass/` | 22 of the 90 taken (30 routes at 390, 768, 1440; `capture-script.mjs.txt`). Each capture waited for hydration, scrolled the full page, and asserted no console error, no horizontal overflow, and no element left at `opacity: 0` apart from the pointer-only spotlight overlay. |
| Reduced motion | Browser test and captures | Captures were taken with `prefers-reduced-motion: reduce`; every section renders fully. |
| Contrast | `contrast.test.ts` unchanged | No new colour; icons use the existing brand-red-on-paper and lifted-red-on-ink pairings. |
| External accessibility audit | Not performed | Unchanged from Stage 9. |

## 4. Graphics provenance

| ID | File | Subject | Where used |
| --- | --- | --- | --- |
| S-136 | `supplies-flatlay.jpg` | still life of unbranded supplies on slate | LifeSupply brand page |
| S-137 | `exam-room.jpg` | empty examination room | Home lifecycle, Clinic Solutions band, Clinics brand services |
| S-138 | `equipment.jpg` | instrument trolley and sealed crate | Equipment page |
| S-139 | `warehouse.jpg` | fulfilment aisle | Our Businesses bento, Technology, Balkowitsch page, Supplier fit |
| S-140 | `metabolic-supplies.jpg` | monitoring and injection supplies | Home metabolic section, Metabolic audiences |
| S-141 | `pharmacy.jpg` | pharmacy back-shelf with unlabelled boxes | Refills, Pharmacy partners |
| S-142 | `boardroom.jpg` | empty boardroom | About direction, Partners bento, Investor sections, Acquisition structures |
| S-143 | `shipping.jpg` | cartons on a pallet | Wellmart page, Ongoing supplies |
| S-144 | `facade.jpg` | glass office facade | About footprint |

All nine: Gamma image generation, photo mode, commissioned 2026-09-08 for this pass; monochrome brief; 2752×1536 originals scaled and cropped to 1600×900; grayscale plus a slight red balance with ffmpeg; conceptual, not operational photography; no people, text, logos, products, or LifeSupply premises. The originals are not committed.

## 5. Deployment and external work

None by the pass. Merging deploys the Vercel alias (pages, graphics, primitives) and the Render web service (same components, unused on the internal host). No migration, no message, no operating-site change, no DNS or indexing change.

## 6. Follow-ups for the product owner

- Review the nine conceptual graphics; any can be replaced in `graphics.ts` and `public/lsh/graphics/` without touching a page.
- Content fine-tuning can now proceed page by page; the section primitives accept the same content shapes.
- SEO and indexing remain to be raised later, as instructed.

## 7. Follow-up: collapsible mobile groups and back-to-top (2026-09-08)

Requested by the product owner after the pass merged: the mobile panel listed every child of every group and ran well past a phone screen, and the site lacked the LLD-style back-to-top control.

| Area | Files | Change |
| --- | --- | --- |
| Mobile panel | `lifesupply-layout.tsx` | Each group keeps its hub link and gains a real expand button (`aria-expanded`, `aria-controls`, labelled "Expand/Collapse <group>"). One group is open at a time; opening the panel expands the group that holds the current page. Children collapse through the display class, because a `grid` utility outranks the preflight `[hidden]` rule. No hover dependency. |
| Back to top | `scroll-to-top.tsx` (new), `globals.css` | A brand-red square bottom right, rendered only after 480 px of scrolling so it is never in the tab order invisibly; one press scrolls to the top (smooth, or instant under reduced motion) and moves focus to the main landmark. Entrance animation gated by `prefers-reduced-motion: no-preference`. Passive, frame-coalesced scroll listener like the header hook. |
| Tests | canaries, `lifesupply-public.spec.ts` | Canaries: expand button state and controlled list, class-based collapse, control present once needed with focus return and reduced-motion branch. Browser: every child reachable by expanding its group and only one group open; the current page's group opens first; the control appears after scrolling, returns to the top, disappears, and leaves focus on `main`. |

Verification: format, typecheck, lint pass; `pnpm test` 122 public-site tests pass; public build passes; Playwright 69 passed, 5 skipped on the full run with the header-hide test failing once under load and passing alone (as before). Captures: `menu-390-collapsed.jpg`, `menu-390-metabolic-expanded.jpg`, `menu-390-current-page-group-open.jpg`, `back-to-top-390.jpg`, `back-to-top-1440.jpg`.
