# Website improvement, round three — QA and verification

**Stage E, September 10, 2026.** Branch `claude/r3-e-qa`. Companion to `docs/website-round-three-plan.md` and `docs/website-round-three-acceptance.md`.

Every result below is an actual observed result. Nothing that failed is described as passing.

## 1. Repository gates

Run on the Stage E branch after the review corrections in section 3.

| Gate | Command | Result |
| --- | --- | --- |
| Formatting | `pnpm format:check` | Pass — "All matched files use Prettier code style!" |
| Types | `pnpm typecheck` | Pass — 0 errors |
| Lint | `pnpm lint` | Pass — 0 problems |
| Unit and canary tests | `pnpm test` | Pass — 104 files, 1,305 tests |
| Public build | `PUBLIC_SITE_MODE=true pnpm build` | Pass — compiled in 20.1s |

Raw output in `evidence/round-three-2026-09-10/stage-e/`.

The test count rose from 1,297 at the start of the round to 1,305. Eleven canaries were added across the round and eight rewritten; none was removed or loosened. Each rewrite is recorded in the stage that made it, with the reason.

## 2. Acceptance sweep

The route-level matrix is in `docs/website-round-three-acceptance.md`. The sweep that enforces it covers twenty routes at five widths, the six priority journeys the brief names, the round-three claims, and a stale-copy scan across every route.

**Result: clean**, both against the merged Stage D build and again after the Stage E corrections.

```
ROUND THREE QA CLEAN
20 routes at 5 widths, six priority journeys, round-three claims, stale-copy sweep,
keyboard, reduced motion, external links, sitemap and robots
```

**One bug in the sweep itself is worth recording**, because it would have produced a false pass in the other direction. The first run reported ten failures on text that was demonstrably rendering. The cause was `innerText`, which reports text *after* CSS `text-transform`; the display face is uppercased, so "Operating" read as "OPERATING" and every tier check missed. The sweep now reads `textContent`. A checker that cannot see the thing it checks is worse than no checker, so this is called out rather than quietly fixed.

## 3. Independent review by Codex, and its triage

Codex was given the cumulative round-three content diff, the verified fact list, the copy rules, and an explicit note that the hedging direction had reversed. Its full response is preserved at `evidence/round-three-2026-09-10/stage-e/codex-independent-review.md`.

**The delivery failed once and the failure is instructive.** The brief plus diff came to 40KB, which exceeded the command-line argument limit, and the run exited zero having done nothing. It was re-run with the brief on standard input. A silent zero-exit is exactly the shape of failure that gets mistaken for success.

It returned nine substantive findings. **Seven were adopted in whole or in part. Five were declined**, each with a stated reason. The pattern in the declines is consistent: Codex treated the supplied fact list as an exhaustive whitelist and flagged anything not literally in it, including owner-directed copy and claims verified by sources it was not given.

### Adopted

| # | Finding | What changed |
| --- | --- | --- |
| 6 | The corporate overview called all four brands online stores | LifeSupply Clinics is a project business, not a store. The overview now names the three storefronts and says so. **This was a real error introduced in Stage D** |
| 2 | "LifeSupply takes part through … licensed dispensing … lawful compounding" could read as present participation in regulated activity | Rewritten: LifeSupply supplies products and delivers clinic projects; where a developing programme touches regulated care, its part is the supply side and the provider holds the licence |
| 1 (part) | "imply no funding commitment" introduces financing into copy that otherwise never mentions it | The clause is gone |
| 3 (part) | The supply review read as a defined service with account setup | Reframed as what a conversation covers, not a service that is offered |
| 5 (part) | "runs the Canadian storefronts" assigns Wellmart a role across brands | Narrowed to the LifeSupply storefront it trades as |
| 8 (part) | "Running today, with customers and revenue" attributes revenue at tier level | Now "Running today." |
| 8 (part) | "LifeSupply manufactures nothing today" is broader than the verified restriction | Now "does not manufacture regulated products today" |
| 8 (part) | "selling … online for more than 25 years" merges two facts | Now states the operating duration and what it sells separately |
| 9 (part) | Publishing commentary remained in two places | "that status changes here when it changes" and "Availability is published as each pathway is confirmed" are gone |

Two weaker findings were also taken: "The public vision" became "LifeSupply's vision", and a subject-verb disagreement was fixed.

### Declined, with reasons

| # | Finding | Why it was not adopted |
| --- | --- | --- |
| 1 (part) | The About growth-strategy paragraph names acquisition categories | The product owner dictated that paragraph on September 9, 2026. It states a strategy and an objective, names no target and no financing, and is not Claude's copy to withdraw |
| 4 | The four-step execution sequence is invented | It is management's own sequence from the August 25, 2026 materials. Only its shape is published; every timing, clinic count and target in that document is deliberately excluded. Codex was not given the document |
| 5 (part) | The Balkowitsch acquisition benefits exceed the facts | Customer base, distributor network and 25 years of trading history are stated verbatim in the annual report, as is the "Canadian operating base" phrasing |
| 7 | The starter-equipment and consumables model is unsupported | Both role definitions come from the product owner's partner overview and predate this round |
| 8 (part) | The investor telephone number is unverified | It is in the site's verified contact directory, and a registry test already enforces that every action destination comes from that directory |
| 8 (part) | The leadership biography exceeds the verified facts | Prior-site biography, restored by the product owner on September 9, 2026 |
| 8 (part) | The 2022 Smart Move Medical milestone is outside the facts | Sourced and dated in the register, with its public link |

Codex's section 3, "what a business reader still cannot answer", is carried to the handoff as open questions. Those need information, not wording.

## 4. Playwright end-to-end suite

Both projects, against a local `next start` on port 3100 built with `PUBLIC_SITE_MODE=true`.

**Serial run: 79 passed, 5 skipped, 0 failed.**

Reported honestly: an intermediate serial run failed one test, the header scroll-hide behaviour. It was re-run in isolation four times and passed every time, and the next full serial run passed all 79. This test has been intermittently flaky on this machine across three rounds; it is a timing-sensitive scroll assertion, not a regression. The passing serial run is the result of record and CI is the authoritative gate.

## 5. Deployment verification

Recorded in `docs/website-round-three-handoff.md` after the Stage E pull request merges. A merged pull request and a green build are not deployment verification; the handoff records the commit the production alias actually served, confirmed by fetching a marker unique to this round.

## 6. What this QA did not cover

- **No form was submitted and no inquiry was sent.** The public surface carries no form. Mail routes were verified by reading rendered `href` values.
- **No external accessibility audit.** The automated checks are the whole of what is claimed.
- **No screen-reader testing.** Programmatic checks confirm structure, names and focus; they are not assistive-technology testing.
- **No analytics.** None is loaded, by policy.
- **Contrast is not machine-checked.** The palette predates this programme.
- **The confidential source documents were not re-verified against a second source.** The annual report and the August 2026 materials are taken as authoritative for the facts drawn from them.
