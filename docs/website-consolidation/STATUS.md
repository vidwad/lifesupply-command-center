# Consolidation status

One row per stage. A stage is complete only when its production deployment has been verified, not when its pull request merged.

| Stage | Scope | PR | Squash-merge | Deployment verified |
| --- | --- | --- | --- | --- |
| 0 | Baseline, inventory, redirect map, documents | #144 | `bf0bda3` | Documentation only |
| 1 | Shop → Medical Supplies; Equipment and Ongoing Supplies → Clinic Solutions | #145 | `0eab3b0` | `pending` |
| 2 | Pharmacy Partnerships → Pharmacy Solutions; Care Kits, eight pathways, Refills → Metabolic Health | #146 | `pending` | `pending` |
| 3 | Final five-item navigation; Partners retirement | — | — | — |
| 4 | Team merge; About, Home, News, Contact refinement | — | — | — |
| 5 | Design, Codex review, final verification | — | — | — |

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
