# Website improvement, round two — QA and verification

**Stage E, September 10, 2026.** Branch `claude/r2-e-qa`. Companion to `docs/website-round-two-plan.md`.

Every result below is an actual observed result. Nothing is projected, and nothing that failed is described as passing.

## 1. Repository gates

Run on the Stage E branch after the review corrections in section 3.

| Gate | Command | Result |
| --- | --- | --- |
| Formatting | `pnpm format:check` | Pass — "All matched files use Prettier code style!" |
| Types | `pnpm typecheck` | Pass — 0 errors |
| Lint | `pnpm lint` | Pass — 0 problems |
| Unit and canary tests | `pnpm test` | Pass — 104 files, 1,296 tests |
| Public build | `PUBLIC_SITE_MODE=true pnpm build` | Pass — compiled successfully in 16.1s |

Raw output: `evidence/round-two-2026-09-10/stage-e/gates-format-typecheck-lint.txt` and `vitest.txt`.

The test count rose from 1,292 to 1,296. Four canaries were added in Stage E and one was rewritten; none was removed or loosened. Section 3 records what each one now asserts.

## 2. Browser sweep

A Playwright sweep across **20 public routes at 5 viewport widths** (360, 390, 768, 1280, 1440), plus keyboard, reduced-motion, external-link, sitemap and robots checks. Script preserved as `evidence/round-two-2026-09-10/stage-e/qa-sweep.mjs`; it was run from the repository root during the stage and is not part of the shipped source tree.

Per route and width, the sweep asserts:

- the page returns a 2xx status;
- `document.scrollWidth` never exceeds the viewport by more than 1 pixel;
- exactly one `<h1>` inside `<main>`;
- heading levels never skip (no h1 to h3);
- every `<img>` inside `<main>` carries an `alt` attribute;
- every `<a>` has an accessible name;
- no third-party script is loaded from any origin but the site's own;
- no `<form>` exists on any public page;
- no element with visible text is left under a CSS blur filter.

At 1440 it additionally asserts a `noindex` robots meta, a canonical link, a title, a description and an `og:title` on every route.

Beyond the grid it checks eight keyboard tab stops for a visible focus indicator, opens the Investors menu and closes it with Escape, loads four animation-heavy routes with `prefers-reduced-motion: reduce` and asserts no visible text is left at zero opacity or blurred, requests the first eight outbound links and asserts none returns 400 or worse, and confirms `sitemap.xml` is a `urlset` and `robots.txt` disallows crawling.

**Result: clean.** Output in `qa-sweep-local.txt`:

```
ROUND TWO QA CLEAN
20 routes at 5 widths, plus keyboard, reduced motion, external links, sitemap and robots
```

## 3. Independent review by Codex, and its triage

Codex was given the cumulative round-two diff of `src/lib/public-site/content` and `actions.ts`, the verified fact list, and the copy rules. It has no file access, so the diff was inlined. Its full response is preserved verbatim at `evidence/round-two-2026-09-10/stage-e/codex-independent-review.md`.

It returned twelve substantive findings and five weaker ones. Nine were adopted in whole or in part. Six were declined, each for a stated reason — in every case because Codex was working from a deliberately narrow fact list and could not see the source that supports the copy.

### Adopted

| # | Finding | What changed |
| --- | --- | --- |
| 1 | The commercial model asserts a fee structure no source establishes | Both contracted rows now read "Service revenue rather than product revenue. Nothing is priced." The service-detail wording is kept: it is the product owner's own partner-overview language, already on the page before this round |
| 2 | "Operates today. No project or agreement is required." is an unverified purchasing assurance | Now "Ordinary store purchasing, which operates today on the store's own terms." Clinic procurement through an operating store does operate today; the assurance about agreements did not follow from that |
| 3 | The contact page promises a future commercial process | The sentence about scope and commercial terms being defined in writing is withdrawn. The fit explanation now ends "Programs in development are not currently offered." |
| 3b | The refills page describes a recurring-arrangement process | The sentence is deleted. The page states the present position and nothing more |
| 4 | "Everything else is available on request through investor relations" is a commitment | Now "The figures above are the extent of what is published on this site. Investor inquiries go to investor relations." |
| 5 (part) | Approvals and market conditions cannot be "obtained" | Both forward-looking paragraphs now read "that are not in place" |
| 7 (part) | "no such review is booked" asserts a booking status that cannot be verified from here | Withdrawn. The statement now says the site has not been audited by an external accessibility reviewer, and describes the automated checks that do run |
| 9 | "the same account" can read as an account shared across brands | Now "There is one LifeSupply.ca storefront for all of them, with no separate professional portal." |
| 10 | "None of them commits you to anything, and none of them is personal or clinical information" is an assurance that cannot hold | Withdrawn. An organization and a role can identify a person. The guide is recast in third person and now says only that none of the prompts is required and none asks for health, patient or account information |
| 11d | "a broad general catalogue" exceeds the four registered Balkowitsch categories | Now "priced and supported in its own market" |

Two weaker findings were also adopted: the unclear antecedent in "the four of them" (now "the four categories below"), and the scope row that depended on the row above it for its meaning (now states "under a written scope agreed in advance" in full).

### Declined, with reasons

| # | Finding | Why it was not adopted |
| --- | --- | --- |
| 1 (part) | Kitting, direct shipment, replenishment administration and exception handling are unsupported | These are the product owner's own words from the Metabolic Care Supply & Services partner overview (volume 1 of 2, management review draft, September 2, 2026), already published before this round. Codex was not given that document |
| 5 (part) | Remove the forward-looking-statement paragraphs | These are the site's safe-harbour language. Removing them would reduce disclosure, not improve accuracy. Only the verb was corrected |
| 6 | The founding-investor sentence on the homepage is unsupported | The product owner dictated this sentence personally, in two successive corrections on September 9, 2026. It is not Claude's copy to withdraw. Recorded for the owner instead |
| 8 | Pathway overlap and starter-equipment frequency are unsupported | Both derive from the content model's own fields: each pathway carries explicit `compatibility` rules, and the starter role is defined in the owner's partner overview as "chosen once… and not repeated on a schedule" |
| 11a | The telephone number is not a verified destination | Source register row S-25 records 1-855-755-5433 as published on lifesupply.ca, wellmartmedical.com and lifesupplyclinics.com |
| 11b | The Surrey address is assigned to Wellmart without evidence | The entry is labelled "as stated on lifesupply.ca", which is where that entity and that address are published together (source register S-10) |
| 11c | "Four regulated options under evaluation" introduces an unverified count | The page enumerates those four options immediately below the heading, each with its own status and dependencies. The number counts the list on the page |

Codex's section 3, "what a business reader still cannot answer", is carried forward to the handoff as open questions for the product owner. Those gaps need information, not wording.

## 4. Playwright end-to-end suite

`tests/e2e/lifesupply-public.spec.ts`, both projects (chromium desktop and mobile-chrome), against a local `next start` on port 3100 built with `PUBLIC_SITE_MODE=true`.

**Serial run (`--workers=1`): 79 passed, 5 skipped, 0 failed.** Output in `evidence/round-two-2026-09-10/stage-e/playwright-serial.txt`.

This is reported honestly rather than tidily: **two earlier parallel runs on this machine each failed 8 tests, and the two failing sets barely overlapped.** The first run failed on route reachability and shell links; the second failed on h1 counts, header scroll-hide and reduced motion. Every one of them passed when re-run alone. A single `next start` process on this Windows machine cannot serve Playwright's default unbounded worker count, and the failures are navigation timeouts, not assertion failures. The serial run is the local result of record, and CI runs the suite in its own environment, where all four required checks are the authoritative gate.

## 5. Deployment verification

Recorded in `docs/website-round-two-handoff.md` section 8, after the Stage E pull request is squash-merged. A merged pull request and a green build are not deployment verification; the handoff records the commit that the production alias actually served, confirmed by fetching a marker string unique to this stage.

## 6. What this QA did not cover

- **No form was submitted and no inquiry was sent.** The public surface is database-free and carries no form. Mail routes were verified by reading rendered `href` values, never by sending.
- **No external accessibility audit.** The automated checks in section 2 are the whole of what is claimed, on the site and here.
- **No screen-reader testing.** Programmatic checks confirm structure, names and focus; they do not substitute for assistive-technology testing.
- **No analytics or measurement.** None is loaded, by policy. Nothing was added.
- **Contrast is not machine-checked in this sweep.** The brand palette was set before this program and was not re-derived.
