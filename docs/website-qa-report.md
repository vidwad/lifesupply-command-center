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
