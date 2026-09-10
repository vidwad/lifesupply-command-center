# Website improvement program — QA report

Checks, browser verification and deployment verification for the program in `docs/website-improvement-plan.md`. Updated at the end of each stage; the final pass is recorded under Stage 5.

## Standing checks

Every stage runs all of these before its pull request opens. A stage does not merge on a failing check, and no check is weakened to make a stage pass.

| Check | Command |
| --- | --- |
| Formatting | `pnpm format:check` |
| Types | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Unit tests and source canaries | `pnpm test` |
| Public production build | `PUBLIC_SITE_MODE=true pnpm build` |
| Browser suite, desktop and mobile projects | `pnpm exec playwright test tests/e2e/lifesupply-public.spec.ts` |

## Stage 0 — discovery and baseline

| Item | Result |
| --- | --- |
| Repository, default branch, permissions | `vidwad/lifesupply-command-center`, default `main`, unprotected, admin confirmed |
| Working tree at start | Clean; no unrelated user work to isolate |
| Continuous integration | Typecheck + lint + format + tests; Production build; Vercel; Vercel Preview Comments |
| Baseline captures | Ten routes at 1440 px and 390 px |
| Mobile overflow sweep, 31 public routes at 390 px | Clean (the News defect found earlier in the day was fixed and merged before this program opened) |
| Site behaviour changed | None; documentation only |

## Stage 5 — final verification, September 9, 2026

All gates pass on the merge candidate: formatting, types, lint, 104 test files with 1,280 tests, the public production build, and Playwright on both the desktop and mobile projects at 79 passed and 5 skipped.

An automated sweep visited 32 public routes at 1440 px and 390 px and checked each one. It reports clean.

| Checked | Result |
| --- | --- |
| Every route answers 200 | Clean |
| No page wider than its viewport, at either width | Clean |
| Exactly one `h1` per route | Clean |
| Heading outline never skips a level | Clean after two fixes: an icon grid with no section heading, and the tile grid, now take `h2` for their card titles instead of `h3` |
| Every image carries an `alt` attribute | Clean |
| Every link has an accessible name | Clean |
| No third-party script loads | Clean |
| Canonical link present | Clean on every route |
| Title and meta description present | Clean on every route |
| `noindex` present, as the environment requires until cutover | Clean on every route |
| `sitemap.xml` is a valid urlset; `robots.txt` disallows crawling | Clean |
| Visible focus on the first six tab stops | Clean |
| Reduced motion leaves no text at zero opacity | Clean on the four most animated routes |
| Inquiry routes | Six distinct `mailto:` routes with encoded subjects; no form rendered; no success state exists to be shown falsely |
| Financial figures | Period, currency, entity and unaudited basis present; gross profit and net income distinct; figures render immediately with no animation |
| Status language | Operating, in development and under evaluation used consistently; nothing in development presented as purchasable |
| Private information in public output | None: no internal filename, review note, approval workflow or confidential document appears |

### Independent review

Codex reviewed the cumulative content and action-registry diff without access to the repository, against the verified-facts list. Its report is kept at `docs/website-development/evidence/improvement-2026-09-09/stage5/codex-independent-review.md`. Six substantive findings were raised. Four were adopted:

| Finding | Action |
| --- | --- |
| Capability sentences implied fulfilment arrangements, running clinic supply work and procurement relationships that the site does not evidence | Rewritten to what the group demonstrably does |
| "Terms are not established, so no revenue mechanism is stated" read as an editorial note to a reviewer | Rewritten as a plain statement that there is nothing to buy and no price to quote until terms are agreed |
| "within verified delivery arrangements" leaked source-validation language, and "a written quote" was not evidenced | Both removed from the copy this program added |
| A promise of a confidential first conversation is a commitment the site cannot verify | Softened to a first conversation |

Two were not adopted, with reason: the financing-presentation description and the development-program scope are pre-existing approved copy drawn from the partner overview and the earlier investor stages, which the diff did not show Codex. Its stylistic note that a direct question heading departs from third-person voice was declined, because the question form is what makes the clinic choice legible to a visitor.

## Deployment verification, September 9, 2026

The merge of Stage 5 (`6616883`) was not assumed to be deployed. The production alias was polled until it served a marker unique to that build, and an earlier check confirmed why this matters: for a period after the merge the alias was still serving the Stage 2 to 4 build, and the Stage 5 heading fix was absent from it.

| Checked on `https://lifesupply-command-center-vidwads-projects.vercel.app` | Result |
| --- | --- |
| Alias serving the Stage 5 build | Confirmed by a copy marker unique to that stage |
| Sweep of 15 principal routes at 1440 px and 390 px | Clean: status, overflow, one `h1`, heading order, image `alt`, third-party scripts, `noindex`, canonical |
| Heading order on Partners and Growth strategy | `h1` then `h2`, the defect fixed in Stage 5 |
| Legacy redirects | `/our-operations`, `/investor-relations/documents`, `/contact-2` and a withdrawn profile all answer 308 to their replacements |
| Inquiry routes | Encoded subjects present on the live contact page |

## Final verification checklist

Completed in Stage 5 and recorded there.

- Navigation, dropdowns, keyboard access and visible focus
- Inquiry routes reach their verified destinations; no false success state
- Internal and external links resolve; redirects answer 308
- No horizontal overflow at 390 px on any public route
- Image crops and diagram readability at 390 px, without hover
- Reduced-motion behaviour on every animated element
- One `h1` per route; heading order; text contrast
- Titles, descriptions, canonical tags, sitemap, environment-appropriate indexing
- Financial figures carry period, currency, entity and audit status
- Operating, in development and under evaluation used consistently
- No private files, internal notes or sensitive information in public output
- Deployment associated with the final merge verified on the production alias
