# LifeSupply Command Center Consolidation TODO

- [ ] Inspect the merged Command Center public-site routes, host routing, homepage navigation, existing Vercel configuration, and standalone Life Supply Health rollback repository.
- [ ] Complete remaining public LifeSupply website structure and add a clear, accessible homepage path to the authenticated Command Center dashboard.
- [ ] Add focused tests for public-home dashboard login behavior and host-safe navigation.
- [ ] Create a Vercel preview deployment from the unified repository without assigning the LifeSupply custom domain.
- [ ] Validate public, internal, login, and Vercel preview access paths while preserving internal API and dashboard protection.
- [ ] Update the public-site cutover runbook and Claude Code handoff with Vercel preview, login, database-migration, domain-deferral, and rollback guidance.
- [ ] Delete the redundant standalone `vidwad/life-supply-health` repository only after preserving its tagged rollback reference in the unified repository documentation.
- [ ] Commit and push the completed unified website, Vercel preview, dashboard login, documentation, and repository-retirement records to Command Center `main`.
- [ ] Deliver the final unified LifeSupply Command Center handoff for local Claude Code development.
- [ ] Retain Render as the only Command Center backend, database, worker, and authenticated dashboard runtime; do not move its production credentials or migration execution to Vercel.
- [ ] Configure Vercel only as the public Life Supply Health front end, using a database-free public build and a server-to-server public-read contract to Render.
- [ ] Route the public homepage login action to the Render-hosted Command Center authentication endpoint and retain public/public-read host restrictions on Vercel.
- [ ] Document the two-deployment, one-repository model, including Vercel preview variables, Render source-of-truth responsibilities, and rollout checks.
