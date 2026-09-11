# Website refinement, round four — QA and verification

**Stage D, September 10, 2026.** Branch `claude/r4-d-qa`. Companion to `docs/website-round-four-plan.md` and `docs/website-round-four-acceptance.md`.

Every result below is an actual observed result. Nothing that failed is described as passing.

## 1. Repository gates

| Gate | Command | Result |
| --- | --- | --- |
| Formatting | `pnpm format:check` | Pass |
| Types | `pnpm typecheck` | Pass, 0 errors |
| Lint | `pnpm lint` | Pass, 0 problems |
| Unit and canary tests | `pnpm test` | Pass — 104 files, **1,318 tests** |
| Public build | `PUBLIC_SITE_MODE=true pnpm build` | Pass |

Raw output in `evidence/round-four-2026-09-10/stage-d/`.

The count rose from 1,308 to 1,318. Seventeen canaries were added across the round and ten rewritten; none was removed or loosened. Each rewrite is recorded in the stage that made it, with the reason.

## 2. Acceptance sweep

Twenty routes at 360, 390, 768, 1280 and 1440, plus every acceptance condition the brief names, walked as a visitor would. **Result: clean.**

```
ROUND FOUR QA CLEAN
20 routes at 5 widths, nine acceptance conditions, hero without JavaScript,
preserved improvements, keyboard, reduced motion, external links, sitemap and robots
```

Two method rules are built into the sweep because each one produced a wrong finding before it existed:

- **Accordions and disclosures are expanded before their content is judged.** The GLP-1 compatibility answer was once reported missing because it was read collapsed.
- **The hero is tested with JavaScript disabled.** An entrance animation is otherwise indistinguishable from a rendering failure.

A third was learned during this stage and is recorded in section 5.

## 3. What each acceptance condition was checked against

| # | Checked |
| --- | --- |
| 1 | No two homepage sections are titled around the operating businesses, and the withdrawn group statement is absent |
| 2 | With JavaScript disabled on four routes: the heading, the supporting sentence and the actions all compute to `opacity: 1`, and nothing carrying text inside the hero is hidden |
| 3 | The disclosure is closed by default, opens to a four-column table, and the summary carries Contracting party, What is provided and Status |
| 4 | "one commercial relationship" is absent; the coordination wording is present; no reporting promise remains |
| 5 | The construction attribution and the project-sequence note are absent from the supplies page, and the project pointer is present |
| 6 | The investor opening leads with the business; the access-policy sentence is gone |
| 7 | Preparation no longer precedes the choices; at least five choices label their behaviour; exactly two are labelled as opening the Clinics site |
| 8 | Milestone years are non-decreasing down the page; the cumulative clause is present |
| 9 | The empty access-class tiles are gone; the "none is downloadable" line is present |

All ten preserved improvements were re-checked, including the GLP-1 compatibility answer expanded by click.

## 4. Independent review by Codex, and its triage

Codex was given the cumulative round-four content diff, the verified facts, the copy rules, and seven specific questions about this round's changes. Its response is preserved verbatim at `evidence/round-four-2026-09-10/stage-d/codex-independent-review.md`.

**It found no financing disclosure**, and confirmed in its own words that the investor opening carries currency, period, entity scope and unaudited basis for both figures, that the cumulative customer wording is accurate, that the three workflow descriptions now agree, and that the replacement relationship wording does not imply a single contract, account or integration.

Five substantive findings. **Two adopted in full, two in part, one declined.**

### Adopted

| Finding | Change |
| --- | --- |
| Store attributes were extended to the Clinics brand: "Each brand keeps its own site, accounts, currency, prices and support" | LifeSupply Clinics is a project business, not a store. The sentence now says three are online stores and names Clinics separately. **This was a real error introduced in Stage B** |
| The metabolic experience used present-tense operating language for a service that does not exist | Now "LifeSupply is developing a service that connects… and none of it is available today" |
| Source commentary left in the milestones | "The 2022 releases link to the sources that carried them" is gone; the annual-report entry states the figures directly instead of what the report "cites" |
| Awkward antecedent, unclear contact sentence, "since inception" twice, and `programme` against `program` | All four taken |

### Declined, with reasons

| Finding | Why |
| --- | --- |
| Remove the four 2022 milestones as unverified partner names | Each is dated and carries a public link to the release that carried it, recorded in the source register. Codex says itself that "linked headlines do not constitute verification within this review's permitted evidence" — it was working from a deliberately narrow fact list and cannot see the register |
| "Three materials are held for investors… each is shared through investor relations" overstates availability | The three records are listed on the same page with their dates and access labels; the sentence describes what the page itself shows. Codex notes the records were not in the portion of the diff it received |

## 5. Playwright end-to-end suite, and an honest correction

Both projects, against a local `next start` built with `PUBLIC_SITE_MODE=true`.

**The recorded serial run is 78 passed, 5 skipped, 1 failed.** The failure is the header scroll-hide test.

What is actually known about it:

- It passed **five times out of five** when run in isolation, immediately after the failing run.
- It passed two full serial runs earlier in this stage and failed three others.
- It failed on `chromium` in one run and on `mobile-chrome` in another, which is the signature of a timing-sensitive assertion rather than a behaviour change.
- Nothing in this round touches the header. The scroll-hide logic is in the layout; the round's changes are content, the hero entrance, the commercial disclosure and the contact ordering.

**A correction to what an earlier round's QA document claimed.** It said CI was the authoritative gate for this suite. That was wrong: the CI workflow runs typecheck, lint, format, vitest and the production build. **It does not run Playwright at all.** The Playwright suite is a local gate only, so there is no second opinion on this test from CI, and it should not be described as though there were.

This is recorded rather than resolved. The behaviour works when observed; the test is unreliable on this machine under a full serial load. Making it reliable is a genuine outstanding item, listed in the handoff.

## 6. What this QA did not cover

- **No inquiry was sent and no form exists.** Mail routes were verified by reading rendered `href` values.
- **No external accessibility audit.** The automated checks are the whole of what is claimed.
- **No screen-reader testing.** Programmatic checks confirm structure, names and focus.
- **No analytics.** None is loaded, by policy.
- **Contrast is not machine-checked.** The palette predates this programme.
- **Clipboard behaviour was not tested under a denied permission**, only in the normal path; the failure branch is covered by a canary rather than by a browser run.

## 7. Deployment verification

Recorded in `docs/website-round-four-handoff.md` after the Stage D pull request merges. A merged pull request and a green build are not deployment verification.
