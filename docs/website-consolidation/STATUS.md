# Consolidation status

One row per stage. A stage is complete only when its production deployment has been verified, not when its pull request merged.

| Stage | Scope | PR | Squash-merge | Deployment verified |
| --- | --- | --- | --- | --- |
| 0 | Baseline, inventory, redirect map, documents | #144 | `pending` | Documentation only |
| 1 | Shop → Medical Supplies; Equipment and Ongoing Supplies → Clinic Solutions | — | — | — |
| 2 | Pharmacy Partnerships → Pharmacy Solutions; Care Kits, eight pathways, Refills → Metabolic Health | — | — | — |
| 3 | Final five-item navigation; Partners retirement | — | — | — |
| 4 | Team merge; About, Home, News, Contact refinement | — | — | — |
| 5 | Design, Codex review, final verification | — | — | — |

## Stage 0 — baseline and plan

**Completed September 10, 2026.**

Established the baseline from `main` at `3e0c687` with a clean tree, no CI running and no competing website pull request. Enumerated every public route, generated path, redirect and menu destination.

The audit's 41 public content pages **reconcile exactly** against current `main`: 29 static page files, 8 pathway pages from the care-kits dynamic route, and 4 leadership profiles from the `[slug]` route. No page was added or removed between the audit snapshot and this baseline, so nothing legitimate is being deleted to reach a number.

Recorded the 21 retained pages, the 20 to retire, where each retired page's content goes, the redirect map with its `/partners` hazard, and the registries that must be updated together. Added a scoped reference in the root instructions.

**No source changed in this stage.** Documentation only.

Validation: `pnpm format:check`, `pnpm typecheck`, `pnpm lint` and `pnpm test` all pass.

Remaining: stages 1 to 5.
