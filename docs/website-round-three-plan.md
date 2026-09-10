# Website improvement, round three — plan and acceptance matrix

**Opened:** September 10, 2026. **Coordinator:** Claude Code. **Contributor:** Codex, for rewriting, critique, bounded implementation and independent review.

This round follows rounds one (PRs #118–#124) and two (PRs #125–#130). It does not replay them.

## Direction change recorded at the start of this round

The product owner directed that the publishing rules were being applied too restrictively, and that the site reads like an internal document rather than a forward-facing corporate website. Two things follow from that, and they govern every stage below.

**Write like a business, not like a compliance file.** Describe what the group does in plain, confident language. Do not hedge a supported fact, do not qualify a sentence twice, and do not explain editorial or sourcing decisions to a visitor. Source notes, publication reasoning and status bookkeeping belong in these documents, never in public copy.

**Claude is not the final compliance check.** The product owner reviews and adjusts before public cutover. Judgement calls that expand disclosure are made, applied and then flagged in the handoff for that review, rather than being avoided.

What has not changed: nothing is invented. No customer, contract, certification, service commitment, launch date, financing term or figure appears unless a source supports it.

## Verified baseline

Repository `vidwad/lifesupply-command-center`, public, default branch `main` at `4ee1e8a`, working tree clean. One unrelated pull request is open (#58, a Command Center net-sales calculation); it is untouched. Required checks are Typecheck + lint + format + tests, Production build, Vercel, and Vercel Preview Comments. Public copy lives only in `src/lib/public-site/content/*.ts`; routes and destinations derive from `routes.ts` and `actions.ts`. Vercel builds production from `main`.

**The repository is public.** No confidential document content is reproduced in these documents or anywhere in the repository. Sources are named and dated only.

## Source documents located this round

Rounds one and two worked from a repository object whose own provenance stopped at "repository `investorRelations.currentReport`". The underlying documents were located in the product owner's authorized Drive this round, which resolves the two largest open questions.

| Source | Date | Handling |
| --- | --- | --- |
| LifeSupply 2025 Annual Report (V6) | Reviewed September 10, 2026 | Marked confidential and proprietary; accredited-investor document. Used to verify facts already published and corporate structure. Its strategy, balance sheet, cash flow, equity and transaction content stays unpublished |
| Proposed Expansion Strategy for Metabolic Health & Therapeutics | August 25, 2026 | Marked private and confidential, subject to non-disclosure. Used only for corporate structure and program architecture. **All financing terms, capital requirements, unit structure, share counts, forward revenue projections, acquisition pipeline and listing plans are excluded from the site entirely**, and a canary enforces that |

A canary (`publishes nothing from the confidential financing materials`) sweeps every content file for the specific constructs those documents contain and fails the build if one reaches public copy.

## The two material findings

**The reporting currency is Canadian dollars.** The consolidated statements state it three times: "Expressed in Canadian Dollars". Round two published "Currency: not stated", which was correct on the evidence then available and is now superseded. The figures are also prepared under IFRS by management, unaudited, and have not been the subject of an audit or a review engagement. All of that is now labelled.

**The corporate structure is real, and the site described it wrongly.** The site said the four brands "are businesses and channels, not separate companies". The consolidated statements set out one parent and three wholly-owned subsidiaries:

| Company | Relationship |
| --- | --- |
| LifeSupply Health Inc. | Parent |
| Wellmart Health Supplies Ltd. | Canadian subsidiary, wholly owned |
| LifeSupply US, Inc. | United States subsidiary, wholly owned |
| Balkowitsch Enterprises Inc. | Wholly owned |

Brand architecture and legal structure are now presented as two different things, which they are.

**Open conflict, flagged for the product owner.** The parent is named "LifeSupply Health Inc." throughout the annual report and on the corporate-structure page of the August 2026 materials, including the trademark and copyright lines. The lifesupply.ca storefront footer says "a division of LifeSupply Health Supplies Inc." (source register S-10), and one boilerplate paragraph deep in the August materials repeats that older form. The site now uses the name the financial statements use. If the storefront is the current one, this needs reverting in one place: the constant is used everywhere.

## The ten outcomes

| # | Outcome | Status at audit | Stage |
| --- | --- | --- | --- |
| 1 | Verified financial presentation | **Resolved this round** — currency, IFRS basis, entity scope and consolidated caveat now labelled | A |
| 2 | Accurate corporate and brand relationships | **Resolved this round** — parent and three wholly-owned subsidiaries published; brand architecture separated from legal structure | A |
| 3 | Clear program architecture | Still present — pharmacy appears both as a metabolic pathway and as a separate development opportunity | B |
| 4 | Integrated commercial model | Still present — the model table sits below the page's closing actions | B |
| 5 | One coherent pathway catalogue | Still present — a comparison table followed by eight cards repeating it | C |
| 6 | Execution-focused investor story | Partly resolved — the journey reads in order, but prerequisites still outweigh sequence | B |
| 7 | Complete shopping and procurement routes | Still present — overview cards lead with About rather than the store | C |
| 8 | Full editorial consolidation | Still present — Command Center workflow wording on Contact, repeated introductions, publishing mechanics | B and D |
| 9 | Current leadership and operating evidence | Still present — leadership refers to prior-site biographies; milestones are historical | D |
| 10 | Verified deployed completion | Carried — route-level acceptance matrix and live verification | E |

## Stages

| Stage | Scope | Branch |
| --- | --- | --- |
| A | Discovery, source location, financial and entity corrections | `claude/r3-a-facts` |
| B | Program architecture, commercial model placement, investor sequence, editorial | `claude/r3-b-architecture` |
| C | Pathway catalogue, shopping and procurement routes, visuals | `claude/r3-c-routes` |
| D | Corporate overview, leadership, contact and policy alignment | `claude/r3-d-evidence` |
| E | Full QA, independent review, deployment verification | `claude/r3-e-qa` |

Each stage runs `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `PUBLIC_SITE_MODE=true pnpm build` and the Playwright suite, then commits, pushes, opens a pull request, waits for the required checks, and squash-merges.

## Route-level acceptance matrix

Maintained in `docs/website-round-three-acceptance.md` from Stage B onward and verified against the live deployment in Stage E.
