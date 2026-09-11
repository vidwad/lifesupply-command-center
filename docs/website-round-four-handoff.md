# Website refinement, round four — handoff

**Closed:** September 10, 2026. **Coordinator:** Claude Code. **Contributor:** Codex, for rewriting and independent review.

Companion documents: `docs/website-round-four-plan.md`, `docs/website-round-four-acceptance.md`, `docs/website-round-four-qa.md`.

## 1. The nine changes

| # | Change | Status | Where |
| --- | --- | --- | --- |
| 1 | Homepage consolidation | **Complete** | Stage B, PR #140 |
| 2 | Immediate hero visibility | **Complete** | Stage C, PR #141 |
| 3 | Readable commercial explanation | **Complete** | Stage C, PR #141 |
| 4 | Precise relationship and status language | **Complete** | Stage B, PR #140; refined in Stage D |
| 5 | Focused clinic procurement | **Complete** | Stage B, PR #140 |
| 6 | Investor introduction and overview access | **Complete** | Stage B, PR #140 |
| 7 | Contact choices first | **Complete** | Stage C, PR #141 |
| 8 | History order and metric scope | **Complete** | Stage B, PR #140; refined in Stage D |
| 9 | Resources that reflect available actions | **Complete** | Stage B, PR #140 |

## 2. Findings deliberately left unchanged

**The GLP-1 compatibility answer was retired as a wrong finding, not fixed.** The accordion is a button and region rather than a `<details>` element, which is why an unexpanded read missed it. Expanded on the deployed site it answers: "No accessory is universal. The prescribed device determines what fits, and that is confirmed by your clinician or pharmacist." It was not rewritten or removed, and the sweep now re-checks it expanded on every run.

**The four 2022 milestones stay.** Codex asked for their removal as unverified partner names. Each is dated and carries a public link to the release that carried it, recorded in the source register; Codex says itself that linked headlines fall outside the evidence it was given.

**The documents introduction stays.** Codex read "three materials are held for investors" as an unsupported inventory claim. The three records are listed on the same page with their dates and access labels, and Codex notes those records were not in the portion of the diff it received.

## 3. Pages and components changed

Content model: `about.ts`, `architecture.ts`, `clinics.ts`, `contact.ts`, `home.ts`, `investors.ts`, `metabolic.ts`, `news.ts`, and the action registry `actions.ts`.

Components: `copy-email.tsx` (new); modified `commercial-model.tsx`, `lifesupply-primitives.tsx`, `motion.tsx`, and the About, Clinic Solutions, Contact and News page components. `globals.css` gained the CSS hero entrance. `Enter` and `HeroTitle` were removed.

## 4. Codex contributions and tool limitations

Codex drafted six rewrites in Stage B — the investor introduction, the homepage group introduction, the coordination sentence, the ongoing-supplies framing, the workflow-scope sentence and the operating-history wording — and performed the independent review in Stage D.

Its Stage B output was edited before use, and **one suggestion was declined**: it proposed replacing the red operating-context band with "More than 25 years of operations and over 50,000 products", which sits directly above the figures band and would have replaced one repetition with a sharper one.

In Stage D it caught **a real error this round introduced**: the homepage said all four brands keep their own accounts, currency, prices and support, which is untrue of LifeSupply Clinics.

**The limitation is unchanged and still material.** The Codex CLI sandbox cannot read this repository, so every file it reviews is inlined into its prompt by hand and it sees only what it is handed. Both Stage D declines follow directly from that. A large brief also exceeds the command-line argument limit and **exits zero having produced nothing**, so its output file must be checked rather than its exit code trusted; the Stage D brief was passed on standard input for that reason.

## 5. Assets

**None created.** The round is content, layout and behaviour. The asset manifest is unchanged.

## 6. Pull requests

| Stage | PR | Squash-merge commit |
| --- | --- | --- |
| A — baseline, reconciliation and plan | #139 | `29090a6` |
| B — content and business clarity | #140 | `2212152` |
| C — hero visibility, readable model, contact order | #141 | `e9d34e8` |
| D — QA, independent review, corrections | #142 | `3c5f626` |
| Deployment record | #143 | this pull request |

## 7. Tests actually performed

| Check | Result |
| --- | --- |
| `pnpm format:check`, `pnpm typecheck`, `pnpm lint` | Pass |
| `pnpm test` | Pass, 104 files, 1,318 tests |
| `PUBLIC_SITE_MODE=true pnpm build` | Pass |
| Acceptance sweep, 20 routes × 5 widths, nine conditions | **Clean** |
| Hero with JavaScript disabled, four routes | **Clean** — nothing hidden |
| Pathway links, keyboard and click, 1280 and 390 | Pass |
| Playwright, both projects, serial | **78 passed, 5 skipped, 1 failed** |

The failure is the header scroll-hide test. It passed five of five in isolation immediately afterwards, passed two full serial runs earlier in the stage and failed three, and failed on `chromium` in one run and `mobile-chrome` in another. Nothing in this round touches the header.

**A correction to an earlier round's QA document.** It described CI as the authoritative gate for this suite. That was wrong: CI runs typecheck, lint, format, vitest and the production build, and **does not run Playwright at all**. The Playwright suite is a local gate only.

## 8. Deployment verification

**Verified September 10, 2026.** Production alias `https://lifesupply-command-center-vidwads-projects.vercel.app`, deployment `dpl_82SfKyFAq28oWjrbiB2RrRVCjDKm`, state READY, serving commit `3c5f6265c443e1d59237f4e15749775f88b0c0f3` from `main`.

The marker was "is a project business for British Columbia", confirmed absent from production before the merge and present after. The alias kept serving the previous build for four polls and produced the corrected line on the fifth. The full acceptance sweep was then run against the live site, including the hero with JavaScript disabled: **clean**. Details in `docs/website-round-four-qa.md` section 7.

## 9. Remaining genuine blockers

1. **The header scroll-hide test is unreliable on this machine** under a full serial run, and CI does not run Playwright, so nothing independent confirms it. Making the assertion deterministic, or running Playwright in CI, is outstanding work.
2. **Carried from round three, still open:** whether the 2024 comparative results may be published; current titles for the three non-executive directors; which investor materials are genuinely available on request; and how a British Columbia clinic project is initiated.
3. **Raised by this round's review and not answerable from the sources:** which legal entity contracts for a given brand's sale or clinic engagement, and what geography is contemplated for the developing programs.
