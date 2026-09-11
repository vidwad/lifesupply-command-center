# Consolidation status

One row per stage. A stage is complete only when its production deployment has been verified, not when its pull request merged.

| Stage | Scope | PR | Squash-merge | Deployment verified |
| --- | --- | --- | --- | --- |
| 0 | Baseline, inventory, redirect map, documents | #144 | `bf0bda3` | Documentation only |
| 1 | Shop → Medical Supplies; Equipment and Ongoing Supplies → Clinic Solutions | #145 | `0eab3b0` | Verified in `ddcd816` |
| 2 | Pharmacy Partnerships → Pharmacy Solutions; Care Kits, eight pathways, Refills → Metabolic Health | #146 | `923a2af` | Verified in `ddcd816` |
| 3 | Final five-item navigation; Partners retirement | #147 | `867e942` | Verified in `ddcd816` |
| 4 | Team merge; About, Home, News, Contact refinement | #148 | `92bc4e1` | Verified in `ddcd816` |
| 5 | Design, Codex review, final verification | #149 | `ddcd816` | **Verified** |

## Stage 0 — baseline and plan

**Completed September 10, 2026.**

Established the baseline from `main` at `3e0c687` with a clean tree, no CI running and no competing website pull request. Enumerated every public route, generated path, redirect and menu destination.

The audit's 41 public content pages **reconcile exactly** against current `main`: 29 static page files, 8 pathway pages from the care-kits dynamic route, and 4 leadership profiles from the `[slug]` route. No page was added or removed between the audit snapshot and this baseline, so nothing legitimate is being deleted to reach a number.

Recorded the 21 retained pages, the 20 to retire, where each retired page's content goes, the redirect map with its `/partners` hazard, and the registries that must be updated together. Added a scoped reference in the root instructions.

**No source changed in this stage.** Documentation only.

Validation: `pnpm format:check`, `pnpm typecheck`, `pnpm lint` and `pnpm test` all pass.

Remaining: stages 1 to 5.

## Stage 1 — Medical Supplies and Clinic consolidation

**Completed September 10, 2026.**

Four addresses retired, their content moved first.

| Retired | Now at | Verified |
| --- | --- | --- |
| `/shop` | `/medical-supply-solutions#stores` | 308, exact fragment |
| `/clinic-solutions/equipment` | `/clinic-solutions#equipment` | 308, exact fragment |
| `/clinic-solutions/ongoing-supplies` | `/clinic-solutions#ongoing-supplies` | 308, exact fragment |
| `/partners/clinics` | `/clinic-solutions#collaboration` | 308, exact fragment |

Clinic Solutions is now one page with four sections — `#planning`, `#equipment`, `#ongoing-supplies`, `#collaboration` — introduced by a plain-anchor section navigation. Every anchor is present in the served HTML, so a deep link resolves with JavaScript disabled.

Medical Supplies absorbed Shop & Services into its `#stores` section: each store's geography, currency and its own support channel, plus the geography-and-currency and support-boundary statements the retired page carried. Its professional-buying section now points at `/clinic-solutions#ongoing-supplies` for the full procurement explanation rather than repeating it.

The `/partners` hazard was handled as planned: `/partners/clinics` is an **exact-path** rule, and `/partners/suppliers` and `/partners/acquisitions` were confirmed to still answer 200 afterwards, in both a live request sweep and a test.

**Two defects were found and fixed during verification, not shipped.**

1. The collaboration card's status badge could not shrink, so `/clinic-solutions` scrolled 91 px sideways at 320 px. The status now wraps onto its own line.
2. Several tests pinned the old structure. Each was rewritten to assert the rule at the granularity the page now has — for example "the ongoing-supplies **section** carries no project material" in place of "the ongoing-supplies **page** carries none" — and none was weakened. Four new canaries were added: every declared anchor is rendered, no internal link targets a retired address, the redirect rules exist by exact path with the `/partners` wildcard forbidden, and every retired page's unique content is present at its destination.

The route registry gained `CONSOLIDATED_ROUTES`, `SECTION_ANCHORS` and `isLiveSection()`. The last is the substantive addition: an internal action that names a fragment no page declares now fails a test instead of shipping as a link that scrolls nowhere.

Remaining: stages 2 to 5.

## Stage 2 — Pharmacy and Metabolic consolidation

**Completed September 10, 2026.**

Eleven addresses retired, their content moved first.

| Retired | Now at |
| --- | --- |
| `/partners/pharmacies` | `/pharmacy-solutions#partner-program` |
| `/metabolic-health/care-kits` | `/metabolic-health#pathways` |
| `/metabolic-health/refills` | `/metabolic-health#replenishment` |
| The eight pathway pages | `/metabolic-health#<slug>`, one per pathway |

**Every pathway keeps the anchor its slug used**, so a bookmarked pathway address lands on the same material rather than on a hub the reader then has to search. The anchors are derived from `KIT_SLUGS` in the route registry, so a pathway and its anchor cannot drift apart.

Metabolic Health is now one page: the commercial model and the experience, then `#pathways` with the comparison catalogue and the eight pathway sections, then `#replenishment`, then `#collaboration`. Each pathway section carries everything its page did — audience, the distinction that matters, its item roles, compatibility, exclusions, the verified store categories or the honest reason there are none, and its own FAQs.

`#collaboration` is new. Stage 1 moved clinic collaboration onto Clinic Solutions pointing here for the fuller scope, and without this section that link went to a page that never picked the subject up.

Pharmacy Solutions absorbed the partner programme at `#partner-program`, with its model and its complaints-and-recalls responsibilities intact. The non-drug rule travelled with it and is not left behind in the partners model; a canary asserts both halves of that.

**Three defects found in verification, fixed rather than shipped.**

1. **The sitemap advertised eleven URLs that answer 308.** It listed the eight pathway addresses from `KIT_SLUGS` directly rather than from the route registry, so retiring them in the registry did not remove them from the map. The sitemap is now wholly registry-derived.
2. Two test assertions were wrong about the content, not the other way round. A pathway declares only the item roles it actually has — diabetes supplies has no occasional item, pharmacy patient support no starter one — and the assertion had demanded all three.
3. A purchase canary matched the replenishment section's own denial, "no subscription on this site today", as though it were an offer. It now checks purchase affordances rather than words.

Remaining: stages 3 to 5.

## Stage 3 — the five-item navigation

**Completed September 10, 2026.**

The navigation is now the owner's architecture:

`About | Medical Supplies | Solutions | Investors | Contact`

**Solutions is a menu with no page behind it.** No `/solutions` route was created, because a page listing three links to three pages is a step, not a destination. Its trigger is therefore a button that opens the menu rather than a link that goes nowhere, and its panel has no "Overview" row. It carries exactly three entries: Clinic Solutions, Pharmacy Solutions, Metabolic Health Solutions.

Clinic, Pharmacy and Metabolic stopped being top-level categories. Contact became the last primary item, a direct link with no dropdown, and left the utility strip where it had been a second control to the same destination. Shop Stores is now the only utility link, jumping to `/medical-supply-solutions#stores`. Home left the menu: the logo already goes there, and two controls in one header for one destination is one too many.

**Partners was retired as a category and its hub with it.** `/partners` redirects to `/contact#business-inquiries`. The hub only routed by relationship; two of its four relationships had already become sections of the pages that carry their subject, and routing an enquiry by intent is what Contact does — with the destination named on every choice, which the hub never did.

Its two remaining pages keep their addresses and lose their category:

- **Suppliers & Manufacturers** is linked from a Medical Supplies call-out and from the footer. A supplier arrives through the stores, so that is where the link belongs.
- **Acquisitions & Strategic Transactions** moved into the Investors menu, where a reader who wants it already is.

**The `/partners` hazard was handled as the plan required.** The rule is exact-path, never a prefix. Both children were confirmed to still answer 200 afterwards by live request and by test, and a canary forbids the wildcard form.

**Two defects found in verification, fixed rather than shipped.**

1. On mobile, the Solutions label and its chevron were two separate buttons controlling the same list — two controls for one disclosure. The chevron now sits inside the label button, which carries `aria-label="Expand Solutions"` so its accessible name still contains its visible text.
2. The 404 recovery page rendered Contact twice, because Contact joined `LIFE_SUPPLY_NAVIGATION` when it became a primary item and the page also appended its own emphasised Contact tile. The mapped list now filters it out, so the emphasis survives and the duplicate does not.

Remaining: stages 4 and 5.

## Stage 4 — the team merge and the duplication trim

**Completed September 10, 2026.**

The four retained biographies became sections of `/our-team`:

| Retired | Now at |
| --- | --- |
| `/abdul-ladha` | `/our-team#abdul-ladha` |
| `/keith-dolo-2` | `/our-team#keith-dolo` |
| `/barrett-e-g-sleeman` | `/our-team#barrett-sleeman` |
| `/david-vogt` | `/our-team#david-vogt` |

Four addresses each held one person's record with the listing above them that a reader had to return to in order to compare one director with another. The cards now link to anchors on the same page, and each section carries the portrait, the dated title, the full preserved biography **and the note that says where the title came from** — that note is what keeps a legacy title from reading as a newly confirmed one, so it could not be left behind when the biography moved.

The anchors are stated in the content rather than derived from the slugs, because two of the four slugs are legacy artefacts (`keith-dolo-2`, `barrett-e-g-sleeman`) and an anchor should read as the person's name, not as the accident of how the prior site numbered its URLs. **The ten withdrawn profile addresses still redirect to the listing, unchanged.**

### Duplication removed rather than moved

- **News & Resources** restated the whole company in six facts — group, brands, footprint, scale, reported figures, developing programs — each of which already had an owning page. Six copies of a figure is six places for it to drift. It now orients in one paragraph and links to About and Investor Relations. The canary that used to assert those figures *matched* now asserts they are **absent**, which is the stricter rule.
- **The corporate structure** moved from Contact to About. About carries identity, history and footprint, so what the company legally is belongs with them. Contact keeps the entity names and the channel each answers on, which is what a visitor deciding who to write to actually needs. The basis — the consolidated statements for the year ended December 31, 2025 — is now stated once, and a canary asserts Contact states no basis of its own so the two cannot read as different vintages.

### The count

**The sitemap is now 21 canonical URLs** — the number the owner's instruction names. 41 before the consolidation, less four in stage 1, eleven in stage 2, the Partners hub in stage 3, and the four profiles here. All twenty retired addresses redirect; none was dropped.

Remaining: stage 5 — design refinement, independent review, final verification.

## Stage 5 — design, independent review, final verification

**Completed September 10, 2026.**

### The design change

A reader who follows one of the eleven metabolic redirects lands in the middle of a long reference page with no sign that a catalogue exists above them. Each pathway section now ends with a plain anchor back to `#pathways`. `AnchoredSection` gained an optional `backTo` for it — an anchor, so it works with JavaScript disabled like the rest of the navigation.

The heading outline of all 21 pages was audited: **exactly one `h1` each, and no skipped level anywhere.** Merging four pages into one is the usual way that breaks, and it did not.

### The independent review

Codex reviewed the seven absorbed blocks and the navigation against seven specific questions, with the standing constraints supplied. It found the consolidation structurally sound and directed most of its objections at copy. **Eleven findings adopted, two declined with reasons, two checked and found already satisfied.**

Adopted — proposed capability written in the present tense:

- "LifeSupply models it as starter, consumable, and occasional roles and states compatibility" asserted a running capability inside a block labelled *Proposed*. Rewritten conditionally, and in ordinary buying language rather than an internal role taxonomy.
- "The pharmacist selects; the supply service fulfils" reads as operational when a heading is read on its own. Now "A proposed model: …".
- "LifeSupply configures supplies; clinical decisions stay with the clinician or pharmacist" — the first clause asserted an operating service. Now conditional; the clinical boundary is unchanged.

Adopted — voice, against the owner's standing instruction that a page is not a compliance file:

- **"within verified delivery arrangements."** "Verified" exposes the publication-review process rather than describing the service. Now "the trades and suppliers each project needs". This phrase predated the consolidation and appeared in two places.
- **"The structure is the one set out in the consolidated financial statements for the year ended December 31, 2025."** Explicit provenance on a page. Now "as at December 31, 2025" — the date a reader benefits from, without the citation. The canary was rewritten to assert the date is present **and the citation absent**, on both About and Contact.
- **"Use the Contact page's intent routing"** described the website's implementation rather than telling a customer what to do.
- **"Nothing is assumed by default. If a responsibility is not written into the program, it has not been agreed."** The protection is kept; the agreement-review phrasing is not.
- **"A pilot is not contracted revenue for either side"** put an investor-facing concept into customer copy, in two blocks.
- **"nothing above is available to start"** told a reader what they could not do without telling them what they could. It now says a conversation is welcome now and fulfilment follows.
- **"nothing in the program touches a prescription"** claimed more than the actual boundary. Now states what LifeSupply would and would not do.
- The News orientation attributed clinic construction to the parent company; it now attributes it to LifeSupply Clinics, matching every other page.

**Declined, with reasons:**

- *"About should say which company operates which brand."* The brands deliberately do not map one-to-one onto the companies, and the evidence register says so. Asserting a mapping is exactly what is prohibited.
- *"Rename the acquisitions relationship to distinguish selling to LifeSupply from acquiring it."* A fair observation about approved M&A copy, but outside a consolidation's scope. **Recorded as an open question for the owner.**

**Checked rather than taken on trust** — Codex could not see the running site, and flagged both as evidence gaps rather than defects:

- *"`/contact#business-inquiries` only replaces the Partners hub if that section visibly routes clinic, pharmacy, supplier and acquisition enquiries."* It does: nine intents, including all four.
- *"Acquisitions discovery is not specified."* It is in the Investors menu and linked from the homepage.

### The verification sweep

A standing sweep now lives at `tests/e2e/consolidation-sweep.spec.ts`: **32 checks across both projects, all passing.** Three of them came from the review asking what a status code cannot tell you — a retired address keeps its query string and resolves its fragment; the sticky header does not cover a section a redirect lands on, measured after layout settles; no target sits inside a closed disclosure.

**The consolidation is complete: 41 pages to 21, twenty permanent redirects, none dropped.**

## Deployment verified

**September 10, 2026.**

Production deployment `dpl_EUa9arYWJce9JYSHvnP1MJVGTK52`, state `READY`, target production, serving `ddcd816` from `main`.

The marker polled for was "the trades and suppliers each project needs" — the phrase that replaced "within verified delivery arrangements" in stage 5. It exists in no earlier build. The alias served the previous build for four polls and produced the new copy on the fifth, so the deployment was treated as live only then.

**The full 32-check sweep was then run against the live site rather than a local build. All 32 passed on both the desktop and mobile projects.**

That covers, against production: all 21 retained pages answering 200; all 20 retired addresses answering 308 to their exact fragment; every one of those fragments resolving **with JavaScript disabled**; all 13 legacy redirects resolving in one hop with destinations unchanged; no internal link pointing at a retired address; no horizontal overflow at 360, 390, 768, 1280 or 1440; every image carrying an alternative; outbound destinations confined to approved hosts with nothing sent; and every page canonical and `noindex`.

**The website consolidation is complete and verified in production.**
