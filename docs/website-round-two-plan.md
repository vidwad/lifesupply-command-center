# Website improvement, round two — plan and audit

**Opened:** September 10, 2026. **Coordinator:** Claude Code. **Contributor:** Codex, for rewriting, critique, bounded implementation and independent review.

This round follows the first improvement program (`docs/website-improvement-plan.md`, merged as PRs #118 to #124). It does not replay it. Every item below was verified against the deployed site and the repository before any work was planned.

## Companion documents

| Document | Purpose |
| --- | --- |
| `docs/website-round-two-evidence.md` | Evidence register for the claims this round touches |
| `docs/website-round-two-qa.md` | Checks, browser verification, deployment verification |
| `docs/website-round-two-handoff.md` | Final handoff: items, changes, limitations |
| `docs/website-asset-manifest.md` | Assets, kept in its established location |

## Verified baseline, September 10, 2026

Repository `vidwad/lifesupply-command-center`, default branch `main` at `3ac7924`, unprotected, admin confirmed, working tree clean. One unrelated pull request is open (#58, a net-sales calculation in the Command Center); it is untouched by this work. Required checks are Typecheck + lint + format + tests, Production build, Vercel, and Vercel Preview Comments. Public copy lives only in `src/lib/public-site/content/*.ts`; routes and destinations derive from `routes.ts` and `actions.ts`. Vercel builds production from `main`.

## Audit of the ten items

| Item | Status | Evidence found |
| --- | --- | --- |
| 1 Cross-page factual consistency | **Still present** | The homepage "Experienced" panel places clinic planning, design and build services "in Canada and the United States"; every other page confines clinic services to British Columbia projects. The disclosures page states "Currency: as reported in the source material", which names no currency |
| 2 Commercial model explanation | **Still present** | No page sets out customer, contracting party, what is provided, product revenue against service fees, or recurring against occasional, in one place |
| 3 Qualified partner inquiries | **Partially resolved** | Round one gave every mail route an encoded subject, but pharmacy and metabolic-health inquiries both use "Supply program inquiry", and there is no guidance on what to include |
| 4 Navigation and direct-store routes | **Partially resolved** | Eight primary groups with an Overview row in each; brand cards already link directly to each store with a secondary corporate link. The Command Center login still sits in the utility bar as well as the footer |
| 5 Pathway comparison and replenishment | **Still present** | Eight pathway pages exist with no comparison; the refills page states there is "no automatic shipment, no reminder service, and no subscription on this site", which reads as permanent rather than current |
| 6 Investor reading journey | **Partially resolved** | Round one added the growth business case with conditions. The hub still leads with "context", uses "Open" as its link label on every tile, and mixes the dated record with current strategy |
| 7 Portfolio, entities and operating proof | **Still present** | The site repeats "four operating websites"; the Contact page heads a single legal entity "LifeSupply public subsidiaries" |
| 8 Editorial cleanup | **Still present** | "that is a marketing direction, not a restriction" on the LifeSupply brand page; "Clinic types the site names"; repeated corporate introductions |
| 9 Visual and motion refinement | **Still present** | `Reveal` and `HeroTitle` animate `filter: blur(6px)` and `blur(8px)` on headings and body text, so meaningful text is blurred until the animation completes |
| 10 Deployment-aware release readiness | **Partially resolved** | `noindex` is environment-driven and correct for the preview host; the accessibility page claims "a full review is scheduled before the public cutover", which is a commitment that cannot be substantiated |

Nothing was classified "already resolved" without checking the deployed page, and nothing is classified "cannot yet verify".

## The material finding

The 2025 figures' **currency is not evidenced anywhere**. Source register row S-60 records net sales $6.75M, gross profit $2.20M and net income $284K with no currency, and no other source states one. The round-one evidence register asserted CAD; that was an inference, not a fact, and it is corrected in this round's register. The figures stay published with their period, basis and entity, and the currency is now stated plainly as not given in the source, pending the product owner's confirmation. Inferring CAD from the company's country is exactly the guess the brief forbids.

## Stages

| Stage | Scope | Branch |
| --- | --- | --- |
| A | Discovery, audit, shared facts, straightforward consistency corrections | `claude/r2-a-consistency` |
| B | Portfolio, commercial model, investor journey, editorial pass | `claude/r2-b-content` |
| C | Navigation, pathway comparison, replenishment language, motion | `claude/r2-c-navigation` |
| D | Intent-specific inquiry journeys and policy consistency | `claude/r2-d-inquiries` |
| E | Full QA, independent review, deployment verification | `claude/r2-e-qa` |

Each stage runs `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `PUBLIC_SITE_MODE=true pnpm build` and the Playwright suite, then commits, pushes, opens a pull request, waits for the required checks, and squash-merges.
