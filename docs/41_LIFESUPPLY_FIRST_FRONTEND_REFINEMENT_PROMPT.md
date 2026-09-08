# First Claude Code Prompt: LifeSupply Public Front-End Refinement

Copy the following prompt into a local Claude Code session after opening the canonical unified repository.

```text
Work in the canonical repository `vidwad/lifesupply-command-center`. Your task is a focused, reviewable refinement of the public LifeSupply Health front end—not a rewrite of the Command Center.

Read these files before editing:
- `docs/40_LEGACY_LIFESUPPLY_BRAND_AUDIT.md`
- `docs/38_RENDER_VERCEL_CLAUDE_HANDOFF.md`
- `docs/39_TOOLING_AND_MCP_PARITY.md`
- `src/components/public-site/lifesupply-layout.tsx`
- `src/components/public-site/lifesupply-pages.tsx`
- `src/lib/public-site/lifesupply-content.ts`
- `src/lib/public-site/command-center.ts`
- `src/lib/public-site/host.ts`
- `src/proxy.ts`

Objective: make the public LifeSupply experience visibly more consistent with the legacy `lifesupplyhealth.com` brand while preserving the current approved content and the secure deployment boundary. Use the legacy visual system already defined in the repository: principal red `#DE0000`, black/charcoal, white/off-white, Roboto Condensed for display/navigation, and Roboto for body copy. Preserve the existing original assets under `public/lsh/`; do not substitute stock photography or recreate logos.

Scope of this first pass:
1. Review the current public shell and two visual anchors: `/` and `/about-us/`.
2. Keep the header/footer black or charcoal with the original LifeSupply mark, red accent rules, condensed uppercase hierarchy, sparse editorial panels, and a clear white/red action rhythm.
3. Preserve every existing public route: `/`, `/about-us/`, `/our-operations/`, `/our-team/`, `/investor-relations/`, `/news/`, `/contact/`, `/contact-2/`, `/shop/`, and legacy leadership slugs.
4. Preserve the external Command Center login exactly through `getCommandCenterLoginUrl()`. On the Vercel public host it must resolve to the protected Render login at `https://lifesupply-cc-web.onrender.com/login?redirectTo=/dashboard`; never link a public Vercel visitor to same-host `/dashboard`.
5. Keep `src/proxy.ts` as the host-access boundary. Do not alter Auth.js, Prisma, migrations, database code, workers, internal APIs, or Render/Vercel environment separation.
6. Keep public copy sourced from `src/lib/public-site/lifesupply-content.ts` or a published public DTO. Do not invent financial, investor, regulated-health, pharmacy, therapeutic, product-availability, commerce, or operational claims merely to complete a design.
7. Maintain accessibility: one clear h1 per route, visible keyboard focus, adequate color contrast, semantic controls, responsive mobile navigation, and `prefers-reduced-motion` support. Use `next/image` for bundled original assets.

Before editing, write a small plan in the PR description or `todo.md`. Keep the change limited to public-site layout/components/styles and clearly document each legacy asset or legacy-copy reference that you add, remove, or recontextualize. Favor reusable components over duplicated markup.

Use Node 24 and the pinned pnpm version. Run at least:
```bash
nvm use 24
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm public-web:build
```

Also run the existing Playwright smoke suite after installing a local Chromium browser if needed:
```bash
pnpm exec playwright install chromium
PUBLIC_SITE_BASE_URL=<your-local-or-Vercel-preview-URL> pnpm test:public-e2e
```

If `pnpm public-web:build` is blocked by the known Next `/_global-error` prerender `useContext` failure, do not suppress it. Record the exact failure and treat it as a separate baseline defect to resolve before merge. Finish by summarizing changed files, visual verification at desktop and mobile widths, content/provenance decisions, all command results, and any remaining approval decisions.
```

> This prompt intentionally starts with the public shell and visual anchors. It does not authorize database, authentication, publication workflow, custom-domain, commerce, or regulated-health changes.
