# Website improvement, round three — claim register

**Opened:** September 10, 2026. Companion to `docs/website-round-three-plan.md`.

**This repository is public.** No confidential document content is reproduced here. Sources are named and dated; where a document is confidential, only the specific fact taken from it is recorded, never its surrounding material.

## Sources

| Key | Source | Date | Confidentiality |
| --- | --- | --- | --- |
| R3-S1 | LifeSupply 2025 Annual Report, version 6 | Reviewed September 10, 2026 | Confidential and proprietary; accredited-investor document |
| R3-S2 | Proposed Expansion Strategy for Metabolic Health & Therapeutics | August 25, 2026 | Private and confidential, subject to non-disclosure |
| R3-S3 | `docs/website-development/SOURCE_REGISTER.md` | 2026-09-08 | Internal register of already-verified public claims |
| R3-S4 | The four operating storefronts | 2026-09-08 | Public |

## Claims added or corrected this round

| Claim | Source | Eligibility | Entity / geography | Status | Routes |
| --- | --- | --- | --- | --- | --- |
| Reporting currency is Canadian dollars | R3-S1, stated on the statement of financial position, statement of operations and statement of cash flows | Publishable. A currency label on already-published figures discloses nothing new | LifeSupply Health Inc., consolidated | Verified | `/investor-relations`, `/investor-relations/disclosures` |
| Prepared under IFRS by management; unaudited; not the subject of an audit or review engagement | R3-S1, notice to reader | Publishable. It narrows reliance rather than widening a claim | Consolidated | Verified | `/investor-relations/disclosures` |
| Net sales C$6.75M, gross profit C$2.20M, net income C$284K, year ended December 31, 2025 | R3-S1 | Already published since PR #60/#61; now correctly labelled | Consolidated; no brand-level attribution | Verified | `/investor-relations`, `/investor-relations/disclosures` |
| Parent company is LifeSupply Health Inc. | R3-S1 and R3-S2 corporate-structure page | Publishable. Corporate identity | Parent | **Conflict recorded below** | Site-wide |
| Wellmart Health Supplies Ltd. is a wholly-owned Canadian subsidiary | R3-S1, R3-S2 | Publishable. Corporate structure | Canada | Verified | `/contact` |
| LifeSupply US, Inc. is a wholly-owned United States subsidiary | R3-S1, R3-S2 | Publishable. Corporate structure | United States | Verified | `/contact` |
| Balkowitsch Enterprises Inc. is wholly owned | R3-S1, R3-S2 | Publishable. Corporate structure | United States | Verified | `/contact` |
| Wellmart Health Supplies Ltd. was acquired in 2020 | R3-S1 | Publishable. Corporate history | Canada | Verified | `/contact` |
| Balkowitsch Enterprises was acquired in 2023 | R3-S1 | Publishable. Corporate history | United States | Verified | `/contact` |

## Claims withdrawn this round

| Withdrawn | Why |
| --- | --- |
| "Currency: not stated." | Superseded. The statements express every amount in Canadian dollars |
| "the four brands are businesses and channels, not separate companies" | Incorrect. Three wholly-owned operating subsidiaries exist |
| "Related legal entity" as a section heading for a single company | The structure has four companies in it |
| "A division of LifeSupply Health Supplies Inc., as stated on lifesupply.ca" | Replaced by the relationship the consolidated statements set out |

## Excluded from publication

Taken from R3-S1 and R3-S2 and deliberately **not** published, enforced by the canary `publishes nothing from the confidential financing materials`:

- Capital requirements, the size of any raise, unit structure, warrant terms, exercise prices and share counts.
- Any forward revenue projection, division-level forecast, or illustrative upside.
- The acquisition pipeline and any target's characteristics or value.
- Listing plans, liquidity-event strategy, and exit positioning.
- Balance sheet, cash flow, equity, deficit, goodwill and earnings-per-share detail.
- Any related-party loan or its terms.
- Product-mix percentages, present or proposed.

The 2025 and 2024 comparative operating results are treated separately: they are historical actuals rather than projections, and their treatment is recorded at the stage that uses them.

## Open questions for the product owner

| # | Question | Why it matters |
| --- | --- | --- |
| 1 | **Parent entity name.** The financial statements, trademark line and copyright line say "LifeSupply Health Inc."; the lifesupply.ca footer says "LifeSupply Health Supplies Inc." The site now uses the former | A public corporate site names the wrong company either way. One constant controls it |
| 2 | Is the 2024 comparative disclosure approved for the public site? | It strengthens the investor page materially and is historical fact, but it comes from a confidential document |
| 3 | Is the Surrey address the parent's registered office, Wellmart's, or both? | It appears in the footer, the structured data and the entity card |
| 4 | The homepage founding-investor sentence has no source in any register | Carried from round two, still unresolved |
