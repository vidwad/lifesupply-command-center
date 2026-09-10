# Website improvement, round two — handoff

**Closed:** September 10, 2026. **Coordinator:** Claude Code. **Contributor:** Codex, for rewriting, critique and independent review.

Companion documents: `docs/website-round-two-plan.md` (audit and stages), `docs/website-round-two-evidence.md` (evidence register), `docs/website-round-two-qa.md` (checks and review triage), `docs/website-asset-manifest.md` (assets).

Verified results and assumptions are separated throughout. Where something was not verified, it says so.

## 1. The ten items

| # | Item | Outcome | Where |
| --- | --- | --- | --- |
| 1 | Cross-page factual consistency | **Completed** | Stage A, PR #125 |
| 2 | Commercial model explanation | **Completed** | Stage B, PR #126; corrected in Stage E |
| 3 | Qualified partner inquiries | **Completed** | Stage D, PR #128; corrected in Stage E |
| 4 | Navigation and direct-store routes | **Completed in part; one element deliberately not changed** | Stage C, PR #127 |
| 5 | Pathway comparison and replenishment | **Completed** | Stage C, PR #127; corrected in Stage E |
| 6 | Investor reading journey | **Completed** | Stage B, PR #126; corrected in Stage E |
| 7 | Portfolio, entities and operating proof | **Completed** | Stages A and B, PRs #125 and #126 |
| 8 | Editorial cleanup | **Completed** | Stage B, PR #126 |
| 9 | Visual and motion refinement | **Completed** | Stage C, PR #127 |
| 10 | Deployment-aware release readiness | **Completed** | Stage D, PR #128; corrected in Stage E |

Nothing is blocked. One element inside item 4 was deliberately left alone, explained in section 3.

## 2. What changed

**Item 1 — consistency.** The homepage "Experienced" panel placed clinic planning, design and build services "in Canada and the United States"; every other page confines clinic services to British Columbia projects. Corrected without touching the product owner's wording elsewhere in the sentence. The disclosures page said "Currency: as reported in the source material", naming none; it now reads "Currency: not stated." The Contact page headed a single legal entity "LifeSupply public subsidiaries"; it now reads "Related legal entity" and states that LifeSupply Health Supplies Inc. is the parent and the four brands are businesses and channels, not separate companies.

**Item 2 — commercial model.** A new component on the Metabolic Health hub sets out four categories in one view: patient supply purchases, clinic-wide procurement, contracted kitting and fulfilment, contracted workflow support. Each row states the contracting party, what is provided, whether the money is product revenue or service revenue, how often it recurs, its status, and what the clinical or pharmacy provider keeps. No price, percentage or volume appears anywhere, and a canary enforces that. Stage E withdrew the two rows that asserted a fee.

**Item 3 — qualified inquiries.** Pharmacy and metabolic-health inquiries shared the subject "Supply program inquiry", so an arriving message could not be routed on its subject alone. There is now a separate pharmacy action carrying its own subject and its own recorded intent. Seven distinct subjects leave the Contact page. A "What to include" guide names the organization and role, region, type of practice, the need in a sentence or two, and what the first conversation should cover, alongside the existing warning not to send health, patient or account details.

**Item 4 — navigation.** The Command Center login is out of the utility strip and out of the mobile panel; it remains in the footer, still pointing at the Render origin. Internal authentication was not touched.

**Item 5 — comparison and replenishment.** A new component on the care-kits hub compares all eight pathways: intended audience, supply purpose, the durable and consumable roles each carries, and its status. Every value is derived from that pathway's own entry, so the table adds no claim. The refills page now says there is no automatic shipment, reminder service or subscription "on this site today", stating the present position rather than a permanent prohibition.

**Item 6 — investor journey.** The hub reads in order: the business today, growth strategy, conditions for execution, news and documents, disclosures. Every tile carries a described destination in place of "Open" repeated five times.

**Item 7 — portfolio and entities.** The site now describes four operating businesses, each with its own customers, rather than four websites. The entity wording is covered under item 1.

**Item 8 — editorial.** "that is a marketing direction, not a restriction" and "Clinic types the site names" are gone, with repeated corporate introductions trimmed. A canary bans internal editorial voice from public copy.

**Item 9 — motion.** The entrance animations applied `filter: blur(6px)` and `blur(8px)` to headings and body text, so meaningful text depended on an animation finishing to become readable. Both entrances now fade and rise only. A canary bans any blur filter in the motion primitives and in every public component.

**Item 10 — release readiness.** `noindex` remains environment-driven and correct for the preview host. The accessibility page claimed "a full review is scheduled before the public cutover", a booking that does not exist. It now says the site has not been audited by an external accessibility reviewer and describes the automated checks that do run on every route.

**Stage E corrections.** Nine findings from the independent review were adopted, listed with their exact wording changes in `docs/website-round-two-qa.md` section 3.

## 3. Deliberately not changed

**The primary menu was not restructured into fewer groups.** The product owner directed its current shape in detail on September 9, 2026: Home first, About immediately after, "Medical Supplies" as the label, Pharmacy Solutions between Clinic Solutions and Metabolic Health, an Overview row in each dropdown, tightened spacing, right alignment to the page edge. Collapsing eight groups into five would overwrite that work. The acceptance criteria for item 4 are met as the menu stands: an operating store is reachable directly from its overview card, the menus work with keyboard, pointer and Escape, and no route is orphaned.

**The About divider line still reads "four operating websites".** The product owner selected that exact sentence from options on September 9, 2026. Other instances moved to "businesses"; this one was left alone.

**The homepage founding-investor sentence stands as dictated.** Codex flagged it as unsupported. The product owner wrote it personally in two successive corrections on September 9, 2026. It is raised in section 7 rather than rewritten.

## 4. Pages and components affected

Content model: `home.ts`, `about.ts`, `businesses.ts`, `metabolic.ts`, `pharmacy.ts`, `partners.ts`, `investors.ts`, `contact.ts`, `policies.ts`, and the action registry `actions.ts`.

Components: two new — `commercial-model.tsx` and `pathway-comparison.tsx`. Modified — `motion.tsx` (blur removed), `lifesupply-primitives.tsx` (hero sizing, static statistics), `lifesupply-layout.tsx` (login placement), and the Metabolic Health, care-kits, investor and contact page components that render the new blocks.

Public routes touched: the homepage, About, the four brand pages, Clinic Solutions, Pharmacy Solutions, Metabolic Health and its care-kits hub, the eight pathway pages, refills, Partners and its pharmacies page, the investor hub, growth strategy and disclosures, News, Contact, Privacy and Accessibility.

## 5. Codex contributions and integration limits

Codex contributed in three ways: drafting replacement copy against the evidence register in Stage B, critiquing the pharmacy and metabolic wording, and the independent final review in Stage E.

Its Stage B draft supplied the status and revenue-type structure of the commercial-model table, which was kept and tightened before use. Its Stage E review produced twelve substantive findings; nine were adopted and six declined, each with a recorded reason, in `docs/website-round-two-qa.md` section 3.

**The integration limitation is real and worth recording.** The Codex CLI sandbox in this environment cannot read this repository, and it holds no shell during a review. Every file it reviewed had to be inlined into its prompt by hand. That means it only ever saw what it was handed: the round-two diff of the content model and the action registry, plus a deliberately narrow list of verified facts. Six of its findings were declined precisely because of that — it flagged as unsupported several passages that are the product owner's own words, or that are backed by source-register rows it never saw. A reviewer with repository access would have caught those itself. Treat its findings as a sceptical outside read, not as an audit against the sources.

Codex generated no image or asset in this round.

## 6. Visual assets

**None were added.** Both new blocks are typeset from design tokens with no raster image. The asset manifest is unchanged from round one and remains at `docs/website-asset-manifest.md`.

## 7. Open questions for the product owner

These need information, not wording. Three are Claude's; the rest are carried from Codex's review.

1. **The reporting currency of the 2025 figures.** No source states one. Source register row S-60 records net sales $6.75M, gross profit $2.20M and net income $284K with no currency. The round-one register asserted CAD by inference from the company's country; that was corrected this round. The site now says "Currency: not stated." **Confirmation is needed before any currency is published.**
2. **The founding-investor composition on the homepage** — medical practitioners and specialists alongside investment bankers and capital-market professionals. Dictated by the owner and left in place; no source in the register supports it.
3. **The accessibility review.** The site now says none has happened. If one is commissioned, the statement should say so.
4. What distinguishes Wellmart Medical from LifeSupply.ca in products and intended buyers.
5. Which legal entity would contract for clinic projects or any future supply service.
6. Where the developing pharmacy and metabolic-health programs would operate.
7. Whether the financing presentation dated August 25, 2026 can be obtained, and whether financing is currently being sought.

## 8. Verification results

All actual, from `docs/website-round-two-qa.md`.

| Check | Result |
| --- | --- |
| `pnpm format:check` | Pass |
| `pnpm typecheck` | Pass, 0 errors |
| `pnpm lint` | Pass, 0 problems |
| `pnpm test` | Pass, 104 files, 1,296 tests |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass |
| Playwright, both projects, serial | 79 passed, 5 skipped, 0 failed |
| QA sweep, 20 routes × 5 widths | Clean |

Two parallel Playwright runs on this machine each failed 8 tests with navigation timeouts, and the failing sets barely overlapped; every one passed alone, and the serial run is clean. That is a local capacity limit, not a regression, and it is recorded rather than hidden. CI is the authoritative gate.

**Deployment verification is recorded separately, after the Stage E pull request merges.** A merged pull request and a green build are not deployment verification. The follow-up records the commit the production alias actually served, confirmed by fetching a marker string unique to this round.

## 9. Pull requests

| Stage | PR | Squash-merge commit |
| --- | --- | --- |
| A — audit and consistency | #125 | `7c0fc46` |
| B — commercial model, investor journey, portfolio, editorial | #126 | `0b5fcb3` |
| C — comparison, replenishment, motion, navigation | #127 | `018afa8` |
| D — qualified inquiries and policy accuracy | #128 | `e086327` |
| E — QA, independent review, final corrections | recorded on merge | recorded on merge |

## 10. Standing limitations

- **No form exists on the public site,** and none was added. The surface is database-free on Vercel, the proxy blocks `/api/` on the public host, and the intake lives behind authentication on Render. Inquiries leave through mail routes with distinct subjects. Delivery depends on the visitor's own mail application. No success state exists that could be shown falsely, and no submission was simulated.
- **No measurement or analytics is loaded,** by approved policy. Outbound brand links carry inert attributes only.
- **The site remains `noindex`** until the owner switches it on, and the domain cutover remains deferred.
- **Programs in development are described as such on every page that mentions them,** and none is purchasable.
- **No confidential material was published.** No forecast, pricing model, financing term, transaction target or private report appears in public copy or public assets.
