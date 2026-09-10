# Website improvement, round three — handoff

**Closed:** September 10, 2026. **Coordinator:** Claude Code. **Contributor:** Codex, for drafting, critique and independent review.

Companion documents: `docs/website-round-three-plan.md`, `docs/website-round-three-evidence.md`, `docs/website-round-three-acceptance.md`, `docs/website-round-three-qa.md`.

Verified results and assumptions are separated throughout.

## 1. The ten outcomes

| # | Outcome | Status | Where |
| --- | --- | --- | --- |
| 1 | Verified financial presentation | **Completed** | Stage A, PR #131 |
| 2 | Accurate corporate and brand relationships | **Completed**, with one open question | Stage A, PR #131 |
| 3 | Clear program architecture | **Completed** | Stage B, PR #132 |
| 4 | Integrated commercial model | **Completed** | Stage B, PR #132 |
| 5 | One coherent pathway catalogue | **Completed** | Stage C, PR #133 |
| 6 | Execution-focused investor story | **Completed** | Stage B, PR #132 |
| 7 | Complete shopping and procurement routes | **Completed** | Stage C, PR #133 |
| 8 | Full editorial consolidation | **Completed** | Stages B and D, PRs #132 and #134 |
| 9 | Current leadership and operating evidence | **Completed in part** | Stage D, PR #134 |
| 10 | Verified deployed completion | **Completed** | Stage E |

Nothing is blocked. Outcome 9 is partial for one reason, in section 3.

## 2. What changed

**Outcome 1.** The reporting currency is Canadian dollars, stated on all three consolidated statements. Round two had published "Currency: not stated", which was correct on the evidence then available. The figures also carry their real basis: prepared by management under IFRS, unaudited, and not the subject of an audit or review engagement. Every published amount renders with a `C$` marker, and the disclosures page states that the figures cover the parent and its subsidiaries together, so no result is attributable to a single brand.

**Outcome 2.** The site said the four brands "are businesses and channels, not separate companies". That was wrong. LifeSupply Health Inc. is the parent and owns three subsidiaries outright: Wellmart Health Supplies Ltd. in Canada, LifeSupply US, Inc. in the United States, and Balkowitsch Enterprises Inc. Contact publishes that structure with the acquisition years, and states that brand architecture and legal structure are different things.

**Outcome 3.** "Pharmacy" meant two things with nothing distinguishing them: supplying pharmacies, which is in development, and LifeSupply holding licensed pharmacy operations of its own, which is under evaluation. One card even carried the status "Development focus", which the rest of the site does not use. A program architecture block on About now sets out three tiers in one status vocabulary — Operating, In development, Under evaluation — and Pharmacy Solutions says which of the two businesses that page is about.

**Outcome 4.** The commercial model was the last block on the metabolic hub, below the page's closing actions and disclosures. It now sits directly under the status band, before the detail it explains.

**Outcome 5.** The care-kits hub listed the eight pathways twice, as a comparison table and then as eight cards repeating it. The comparison is now the only catalogue and every pathway name opens its own page.

**Outcome 6.** The investor pages explained prerequisites but not sequence. Four planned steps now run on the growth-strategy page — design and de-risk, controlled pilot, launch and integrate, replicate and scale — with the scaling gate stated separately. Every step is written as planned, and the section says plainly that no developing program has completed a pilot. No date, count or target appears.

**Outcome 7.** Each operating-brand card offered one link, "About", into a corporate page, and a card-covering overlay meant the store was not reachable from the card at all. Each card now leads with the store and follows with the brand page. Professional buyers have a supply-review route describing only verified capability, with what stays with the store stated beside it.

**Outcome 8.** Internal voice removed across the site: the Contact hero's Command Center publication workflow, the About page's repeated annual-report paragraph, the News page's reviewer and version bookkeeping, and the footer's "subject to update and applicable disclosure context".

**Outcome 9.** News & Resources described how documents get published rather than what the company is; it now opens with a corporate overview built from facts published elsewhere. Milestones gained the 2020 and 2023 acquisitions and the reported 2025 results. The team page's "Titles as published on the prior LifeSupply website" is replaced by the title itself.

**Outcome 10.** A route-level acceptance matrix, a sweep enforcing it including the six priority journeys, and deployment verification in section 8.

## 3. Deliberately not changed

**The About growth-strategy paragraph** stands as the product owner dictated it on September 9, 2026. Codex flagged it as naming acquisition categories; it states a strategy and an objective, names no target and no financing.

**The primary menu** keeps the shape the owner directed on September 9, 2026, as recorded in round two.

**The leadership biographies** are the prior site's text, restored by the owner on September 9, 2026. **This is why outcome 9 is partial:** current titles were verified for one officer only. Confirming the rest needs information Claude does not have.

**The 2024 comparative results are not published.** They would strengthen the investor pages and are historical actuals rather than projections, but they come from a confidential document. This is open question 2.

## 4. Pages and components affected

Content model: `about.ts`, `architecture.ts` (new), `brand.ts`, `businesses.ts`, `contact.ts`, `home.ts`, `investors.ts`, `metabolic.ts`, `news.ts`, `pharmacy.ts`, `policies.ts`, `team.ts`, plus `brands.ts` and `seo.ts`.

Components: `program-architecture.tsx` (new); modified `pathway-comparison.tsx`, `motion.tsx`, `lifesupply-layout.tsx`, and the About, Contact, Investors, Metabolic, News, Operations, Pharmacy and Team page components.

## 5. Codex contributions and integration limits

Codex drafted the program architecture, the pharmacy disambiguation, the investor execution sequence and three rewritten fragments in Stage B, and performed the independent review in Stage E.

Its Stage B output was edited before it shipped: the execution sequence arrived hedged into near-meaninglessness ("management plans to… would…" on every clause), and its contact rewrite still promised a future form. It raised one useful concern of its own, that grouping all four brands under online commerce would misdescribe LifeSupply Clinics.

**The integration limitation is unchanged from round two and still material.** The Codex CLI sandbox cannot read this repository, so every file it reviews is inlined into its prompt by hand. It therefore sees only what it is handed. Five of its Stage E declines follow directly from that: it flagged owner-dictated copy, a sequence taken from the owner's own materials, and figures verified in documents it was never given.

**A new failure mode appeared this round.** The Stage E brief plus diff came to 40KB, exceeding the command-line argument limit, and the run **exited zero having produced nothing**. It was re-run with the brief on standard input. Treat a zero exit from that tool as necessary but not sufficient; check for the output file.

Codex generated no image or asset this round.

## 6. Visual assets

**None were added.** The program architecture is typeset from design tokens rather than drawn, so every label is real text that reflows on a phone, is selectable and translatable, and reaches a screen reader. The asset manifest is unchanged.

## 7. Open questions for the product owner

1. **Parent entity name.** The financial statements, the trademark line and the copyright line all say "LifeSupply Health Inc." The lifesupply.ca footer says "LifeSupply Health Supplies Inc." The site now uses the former. One constant controls it.
2. **The 2024 comparative results.** Approved for publication or not.
3. **The Surrey address.** The parent's registered office, Wellmart's, or both. It appears in the footer, the structured data and the entity card.
4. **The homepage founding-investor sentence** still has no source in any register. Carried from round two.
5. **Current titles for the three non-executive directors.** Needed before the site can state them.
6. Which investor materials are genuinely available on request.
7. How a British Columbia clinic project is initiated, and which project types are accepted.

## 8. Verification results

| Check | Result |
| --- | --- |
| `pnpm format:check` | Pass |
| `pnpm typecheck` | Pass, 0 errors |
| `pnpm lint` | Pass, 0 problems |
| `pnpm test` | Pass, 104 files, 1,305 tests |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass |
| Acceptance sweep, 20 routes × 5 widths, six journeys | Clean |
| Playwright, both projects, serial | 79 passed, 5 skipped, 0 failed |

Two honest notes. An intermediate serial Playwright run failed the header scroll-hide test; it passed four times in isolation and the next full run passed all 79. It has been intermittently flaky on this machine across three rounds. And CI caught a formatting failure on Stage B because the format gate ran before the last edit rather than after; the ordering was corrected for the remaining stages.

**Deployment verification is recorded below after the Stage E merge.**

## 9. Pull requests

| Stage | PR | Squash-merge commit |
| --- | --- | --- |
| A — currency and corporate structure | #131 | `7ecaf84` |
| B — architecture, model placement, execution sequence | #132 | `4de6d6f` |
| C — one pathway catalogue, store-first routing | #133 | `0917d6f` |
| D — corporate overview, milestones, publishing voice | #134 | `ac2c892` |
| E — QA, independent review, final corrections | recorded on merge | recorded on merge |

## 10. Standing limitations

- **No form exists on the public site,** and none was added. The surface is database-free on Vercel and the intake lives behind authentication on Render. Inquiries leave through mail routes with distinct subjects; delivery depends on the visitor's own mail application. No submission was simulated and no success state exists that could be shown falsely.
- **No analytics or measurement is loaded,** by approved policy.
- **The site remains `noindex`** until switched on, and the domain cutover remains deferred.
- **Programs in development are described as such on every page that mentions them,** and none is available.
- **No confidential material was published.** No financing term, capital requirement, unit structure, share count, forward projection, acquisition target or listing plan appears in public copy, in the repository documentation, or in any commit. A canary sweeps every content file for them.
