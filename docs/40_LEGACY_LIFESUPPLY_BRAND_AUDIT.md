# Legacy LifeSupply Brand Audit

## Source and scope

This audit treats the public WordPress site at `https://lifesupplyhealth.com/` as a visual provenance source, not as a source of current financial, operational, investor, product, pharmacy, or therapeutic claims. Current approved corporate content remains governed by the Command Center publication workflow and the supplied 2025 disclosure material.

## Initial visual findings — September 8, 2026

The legacy homepage and About page preserve a distinct corporate identity that should remain recognizable in the rebuilt public site. Their visual system relies on a **near-black navigation overlay**, an all-caps white primary navigation, a **bright LifeSupply red** action accent, a white horizontal wordmark with the red angular triangular mark, dark cinematic or industrial imagery, and oversized condensed uppercase headings. The visual rhythm is editorial and high-contrast: dark full-bleed image panels, red information bands, sparse white content blocks, direct statement-led copy, and a compact utility link labelled `CDNX`.

| Legacy cue | Evidence | Preservation decision |
|---|---|---|
| Wordmark | White `LIFESUPPLY` text paired with a red angular mark in the header | Retain approved existing mark variants; support light and dark placement. |
| Accent | High-saturation red buttons, numerals, and broad content bands | Restore red as the primary action and emphasis color; do not substitute lime as the dominant public brand accent. |
| Base palette | Black/charcoal photography overlays with white text | Restore dark editorial hero sections while maintaining accessible contrast. |
| Typography | Strong uppercase condensed/sans-serif display statements | Use a current accessible sans-serif display pairing with uppercase, tracked section labels and carefully constrained line length. |
| Imagery | Industrial interiors, warehouse/supply context, city/commerce movement, grayscale health/technology overlays | Reuse only approved original assets or newly approved corporate imagery; do not use generic healthcare stock as a substitute. |
| Navigation | Home, About Us, Our Operations, Our Team, Investor Relations, News, Contact | Preserve the information architecture and legacy paths; add Command Center login as a clearly distinct external/internal utility action. |
| Content sections | Brand story uses `Experienced`, `Growing`, mission, vision, growth strategy, operating brands, newsletter, and footer contact blocks | Preserve the storytelling pattern, but reconcile copy with current approved content and remove or quarantine obsolete claims. |

## Immediate direction

The current unified preview has a coherent corporate structure and approved asset baseline, but its navy/lime/serif visual system does not yet carry enough of the legacy public identity. The next design pass should reintroduce the legacy black/red/white hierarchy, image-overlay treatment, bold display copy, red micro-accents, and a modernized newsletter/update module while retaining the unified site’s accessibility, responsive navigation, current disclosure context, and protected Render dashboard-login boundary.

## Stylesheet-derived tokens

The legacy Elementor stylesheets identify `#DE0000` as the most frequent red and show related red tones `#E31818`, `#DA0000`, and `#B63737`; `#FFFFFF`, `#000000`, `#1D1D1D`, and `#EEEEEE` are the principal neutral values. `#AA3166` and `#D1346F` occur as secondary/magenta theme values and should not become the default public accent without a page-specific rationale. The site loads **Roboto** for body copy and **Roboto Condensed** for display and navigation. These are factual legacy tokens; the rebuilt system should use them only through accessible semantic variables rather than hard-coded, ungoverned color values.

| Proposed semantic token | Legacy source | Intended public use |
|---|---|---|
| `--lsh-brand-red` | `#DE0000` | Primary CTA, numerical emphasis, active state, controlled red content bands |
| `--lsh-red-hover` | `#B63737` | Hover and pressed state only |
| `--lsh-ink` | `#000000` / `#1D1D1D` | Image overlays, primary display background, high-contrast navigation |
| `--lsh-paper` | `#FFFFFF` / `#EEEEEE` | Reading surfaces and balanced contrast fields |
| `--lsh-display-font` | Roboto Condensed | Uppercase display headlines, navigation, and key statement typography |
| `--lsh-body-font` | Roboto | Body copy, labels, forms, and dense investor content |

## Original asset inventory

The legacy homepage and About page refer to the following first-party assets: `ls_logo_normal.png`, `standard-logo.png`, `logo_footer2.png`, `Abdul-Ladha.png`, `meddirect_custom-150x150.png`, `dexton_custom-150x150.png`, and `Untitled-design-4-150x150.png`. Existing bundled LifeSupply marks and the chairman portrait should remain the first migration priority. Brand/division marks can be staged as source-attributed supporting assets only after the current business-plan owner confirms that each active brand and description is still publishable.

## Review note

The legacy Operations page remained reachable through the expected public navigation, but its browser screenshot could not be retained during the current session. Its detailed visual pattern should be rechecked during the Claude Code page-by-page rebuild before finalizing operations imagery; do not infer missing imagery or carry forward operations claims solely from the previous design.

## First restoration-pass verification

The first scoped restoration pass was inspected locally in public-site mode on the home page and the About page. The reviewed pages now render the existing original LifeSupply mark against a black header, a high-contrast black/red hero field, Roboto Condensed display hierarchy, white and light-neutral reading surfaces, red numerical and rule accents, and the external Render-hosted **Command Center login** link. The approved current content and the existing public routes were retained. This is a design-system validation only; it does not approve any new business, portfolio, investor, pharmacy, therapeutic, or regulated-health statement.

# Claude Code Continuation Plan: Legacy-Preserving Public Front End

## Purpose and working contract

This is the canonical front-end continuation plan for the LifeSupply public experience in `vidwad/lifesupply-command-center`. It converts the visual evidence above into an implementation contract for a local Claude Code session. The purpose is not to reproduce WordPress mechanically. The purpose is to make the rebuilt website **recognizably LifeSupply**—through its red/black/white editorial language, original mark, condensed typography, public navigation rhythm, and direct corporate tone—while treating current approved content, accessibility, security, disclosure accuracy, and the new business plan as higher-order requirements.

> **Visual provenance is not publication approval.** A legacy asset, sentence, financial figure, product claim, or division name may be useful evidence of prior presentation, but it must not be republished unless it is represented in the approved content model or has passed the publication workflow.

The canonical repository contains two independently deployed surfaces. Vercel is the database-free public LifeSupply front end, while Render remains the only runtime for the Command Center, PostgreSQL, migrations, workers, Auth.js, internal APIs, and protected dashboard. The existing public preview has a deliberately external Command Center login path. That separation is a security control and must remain intact.[1]

| Success criterion | Acceptance standard |
|---|---|
| Recognizable legacy identity | The original mark, black/charcoal fields, `#DE0000` red hierarchy, Roboto/Roboto Condensed pairing, direct uppercase display language, and restrained red rule/button rhythm are evident without copying obsolete WordPress content. |
| Approved current information | All visible public statements continue to come from `src/lib/public-site/lifesupply-content.ts` or published public DTOs; no new claim is introduced in JSX merely to fill a visual module. |
| Architecture protection | `src/proxy.ts`, Prisma schema/migrations, Auth.js, Render dashboard routing, and internal APIs remain unchanged by visual work. Vercel receives no database or authentication secrets and runs no migration. |
| Clear Command Center boundary | Every public login entry uses `getCommandCenterLoginUrl()` and resolves to the protected Render login route, never to a same-host Vercel dashboard route. |
| Inclusive, efficient experience | Keyboard focus is visible, text/background contrast is deliberate, a mobile navigation path exists, nonessential motion honors reduced-motion preferences, original approved images use `next/image`, and public pages retain useful metadata. |

## Canonical files and ownership boundaries

Work in the unified repository and review the following files before making a page-level change. The exact directory names are part of the continuation contract; avoid reintroducing a second public-site repository or duplicating the content model elsewhere.

| Area | Canonical paths | Change posture |
|---|---|---|
| Public layout and reusable sections | `src/components/public-site/lifesupply-layout.tsx`, `src/components/public-site/lifesupply-pages.tsx` | Primary implementation surface. Build reusable blocks here rather than cloning markup into routes. |
| Public routes | `src/app/page.tsx`, `src/app/about-us/page.tsx`, `src/app/our-operations/page.tsx`, `src/app/our-team/page.tsx`, `src/app/investor-relations/page.tsx`, `src/app/news/page.tsx`, `src/app/contact/page.tsx`, `src/app/contact-2/page.tsx`, `src/app/shop/page.tsx`, `src/app/[slug]/page.tsx` | Retain the existing public URLs and trailing-slash compatibility. |
| Content and safe links | `src/lib/public-site/lifesupply-content.ts`, `src/lib/public-site/command-center.ts`, `src/lib/public-site/host.ts` | Content may change only through current-source/approval review. Preserve `getCommandCenterLoginUrl()`. |
| Brand styles | `src/styles/globals.css`, `src/app/layout.tsx`, `public/lsh/` | Keep LifeSupply tokens and fonts scoped to `.lsh-shell` so the dashboard retains Inter/JetBrains. |
| Security boundary | `src/proxy.ts`, `src/app/api/public/v1/site/route.ts`, `src/server/public-web/*` | Do not loosen middleware, expose raw models, or make Vercel browser calls to protected/internal APIs. |
| Deployment and delivery | `vercel.json`, `package.json`, `docs/37_LIFESUPPLY_PUBLIC_CUTOVER_RUNBOOK.md`, `docs/38_RENDER_VERCEL_CLAUDE_HANDOFF.md`, `docs/39_TOOLING_AND_MCP_PARITY.md` | Preserve database-free Vercel build and Render-only migration/worker responsibilities. |

## Brand system to preserve

The legacy site used a high-contrast corporate composition rather than a generic healthcare palette. It placed white or light content on cinematic black overlays, used a single strong red for action and emphasis, and relied on condensed uppercase typography for its point of view. The first restoration pass has converted these values into `.lsh-shell` variables. New components must consume these semantic tokens rather than revive arbitrary legacy hex values.[2] [3]

| Token or pattern | Current public implementation | Guardrail |
|---|---|---|
| `--lsh-brand-red` | `#DE0000` | Primary public action, active state, eyebrow, information rule, selected/important numerical emphasis. Do not use it for long text fields or dense body copy. |
| `--lsh-red-hover` | `#B63737` | Interactive hover/pressed state only. Keep white foreground and test contrast. |
| `--lsh-ink`, `--lsh-charcoal` | `#000000`, `#1D1D1D` | Navigation, editorial hero fields, dark statement modules, image overlays, and footer. |
| `--lsh-paper`, `--lsh-surface` | `#FFFFFF`, `#EEEEEE` | Primary reading surface and alternate section surface. Avoid the former navy/lime corporate treatment. |
| `--lsh-display-font` | Roboto Condensed | Hero headings, route titles, section titles, utility labels, numerical metrics, and navigation. Constrain character spacing at smaller widths. |
| `--lsh-body-font` | Roboto | Body prose, contact data, disclosure content, form labels, and data-heavy explanatory modules. |
| Original mark | `/public/lsh/lifesupply-mark.png` | Use on a dark background; maintain its intrinsic ratio. Do not recreate or recolor it in CSS. |
| Editorial layout | Full-width dark hero, red baseline/rule, modular white content fields, direct stories and metrics | Use asymmetry, whitespace, and a small number of strong panels. Do not turn every section into a rounded card grid. |

The red/magenta values `#AA3166` and `#D1346F` appeared in the old theme but are not part of the default restoration palette. They are not to be introduced as an additional accent without an explicit approved design rationale. The legacy site also used broad visual modules and original images. If a suitable approved image does not exist, use a composed color/texture field or defer the media slot; do **not** substitute generic medical stock photography.

## Asset provenance and image policy

The current worktree already contains the approved migration minimum. New imagery should be reviewed against this map before it is copied into the public bundle. Images may be optimized, but their semantic meaning, provenance record, alt text, and intended page placement must be retained in the associated content or documentation.

| Asset | Current path or legacy source | Approved present use | Future-use restriction |
|---|---|---|---|
| LifeSupply mark | `/public/lsh/lifesupply-mark.png`; legacy `ls_logo_normal.png` | Dark header and footer | Preserve original aspect ratio; never put it on a light field that makes the white wordmark disappear. |
| Portfolio lockup | `/public/lsh/lifesupply-portfolio-lockup.png`; legacy `standard-logo.png` / `logo_footer2.png` | About page portfolio context | Keep as a factual historical/portfolio visual; confirm active division status before extending it. |
| Abdul Ladha portrait | `/public/lsh/abdul-ladha.jpg`; legacy `Abdul-Ladha.png` | Current team card | Use only with the existing profile and current governance review. |
| Operations timeline | `/public/lsh/operations-timeline.jpg` | Operations overview | Treat associated narrative as current-content governed; do not infer new operational claims from the image. |
| Investor preview | `/public/lsh/investor-presentation-preview.png` | Investor context | Never imply an offer, valuation, security, or performance result beyond approved disclosure copy. |
| Division marks | Legacy `meddirect_custom-150x150.png`, `dexton_custom-150x150.png`, `Untitled-design-4-150x150.png` | Not added as active public assets in this pass | Require business owner confirmation of ongoing relevance, usage rights, and current description before publication. |

## Information governance and claim matrix

Content changes are a publication decision, not a styling decision. The public UI should present the current model faithfully, with short, precise disclaimers where historical and current material coexists. The Command Center public DTO and publication workflow are the eventual source for database-backed, publishable material; until then, the curated static model is the approved render source.

| Content class | Public-site treatment | Examples | Required approval before change |
|---|---|---|---|
| Approved corporate context | May render from the current content model or published DTO | Public corporate description, approved address, approved contact directory, current operations framing | Content owner / publication workflow review |
| Historical public record | Label explicitly as historical, sourced, or contextual | Leadership bios, historical news, legacy annual-report references | Source verification plus publication review |
| Forward-looking themes | State conditionally with disclosure context | Expansion themes, planned channel developments, acquisition intent | Legal/compliance and publication approval |
| Investor/finance materials | Keep the current qualified context; do not add implication | Financial highlights, presentations, financing materials | Investor-relations/legal approval |
| Regulated medical/pharmacy/therapeutic matter | Do not add clinical, diagnostic, treatment, efficacy, availability, or regulatory assertions | Pharmacy, metabolic-health, therapeutics, medical products | Regulatory, legal, and business approval |
| Commerce and checkout | Send users to approved external channel only | `lifesupply.ca` boundary page | Commerce owner approval; no checkout on public corporate site |
| Personal data and forms | No new browser-side collection without approved policy and server design | Contact form, newsletter, investor inquiry form | Privacy/legal review and a secure Render-backed implementation |

## Page architecture and build order

The current public route architecture is intentionally close to the legacy navigation: Home, About Us, Our Operations, Our Team, Investor Relations, News, and Contact. Preserve this rhythm, but build each page as a modern component composition around approved content rather than an isolated copy of a WordPress page.[2]

| Route | Current state | Next refinement focus | Non-negotiable constraint |
|---|---|---|---|
| `/` | Rebuilt with restoration-pass hero, pillars, metrics, and corporate overview | Add approved original media only where it improves meaning; refine hero responsiveness and content-density balance | Keep the external Render login and investor route visible. |
| `/about-us/` | Rebuilt with mission, vision, portfolio, and original lockup | Confirm active portfolio/entity descriptions before adding division identity modules | Do not convert legacy portfolio marks into current endorsements without approval. |
| `/our-operations/` | Rebuilt timeline and operating-channel sequence | Re-audit original operations visual treatment; add approved environmental imagery only if available | Do not revive old operational capacity, regulated-care, or product claims. |
| `/our-team/` and `/[slug]/` | Curated historic leadership record with profile guardrails | Establish a current-profile review workflow and portrait standard | Preserve historical labels and do not invent biographies. |
| `/investor-relations/` | Context-first disclosure layout and source materials | Add a document index only from approved/published data | Never frame informational content as an offer or recommendation. |
| `/news/` | Historical external-source archive | Prepare published-news DTO integration and date/source component | Retain source links and date provenance. |
| `/contact/` and `/contact-2/` | Verified directory and subsidiary links | Design a future privacy-approved contact flow only when server-side routing is approved | No ungoverned submission form or client-side secrets. |
| `/shop/` | Intentional commerce boundary | Keep clear redirect to approved channel; no cart, pricing, or checkout here | Do not add transaction logic to Vercel public mode. |

### Reusable component inventory

Use the existing shared layout and page primitives as the baseline. Claude Code should extract a component only when it is repeated, has a named semantic responsibility, or needs independent accessibility testing. A good next set includes `PublicHero`, `SectionHeading`, `PrimaryAction`, `EditorialStat`, `DisclosurePanel`, `SourceCard`, `CorporateDirectoryCard`, `ImageBand`, and `PublicPageShell`. Components must receive approved content as props rather than embedding speculative language.

The current first pass uses a scoped `.lsh-lift` class for optional hover elevation. Any new motion must use transform and opacity, remain under approximately 300 ms, and be disabled or made effectively instant under `prefers-reduced-motion`. Keyboard focus remains a required visible red outline. Avoid a carousel, auto-playing video, parallax, or animation that makes the public corporate content harder to scan.

## SEO, accessibility, performance, and responsive requirements

The site is a corporate public surface, not an internal application. Each route should have a page-specific title, concise description, clear first heading, semantic section hierarchy, and predictable canonical path. Do not expose dashboard pages to crawlers through public routing. Vercel preview remains intentionally noindex until formal cutover; do not remove that safeguard for temporary review.

| Area | Implementation requirement |
|---|---|
| Semantics | One descriptive `h1` per route; meaningful `h2` structure; `nav`, `main`, `footer`, `address`, and list markup where appropriate. |
| Contrast | Test white-on-black, white-on-red, red-on-white, and muted gray-on-white combinations at normal text sizes. Do not use pale red text for body copy. |
| Keyboard | Header, mobile menu, external login, CTA, external links, and all cards must be reachable in a logical order with visible focus. |
| Responsive | Start at 320 px, then verify common mobile, tablet, laptop, and wide desktop widths. Keep uppercase Roboto Condensed headings from becoming unreadable through sensible `clamp()`/Tailwind breakpoints and line lengths. |
| Images | Use `next/image` for bundled originals, accurate alt text, fixed dimensions or aspect ratio, and defer large below-the-fold imagery. Never store external image hotlinks in a component. |
| Public data | Vercel may consume future Render publication data server-to-server only. Do not place public API keys/bearer tokens in browser JavaScript. |
| Analytics/cookies | Add only with an approved privacy posture and current policy. Avoid adding third-party trackers during visual refinement. |

## Local developer and tooling procedure

Use Node 24 and the repository-pinned pnpm version. The initial sandbox lacked Node 24; a local developer can install it through their version manager and activate pnpm through Corepack. Run the public front end in explicit public-site mode. The Command Center URL remains the Render login surface.

```bash
git clone git@github.com:vidwad/lifesupply-command-center.git
cd lifesupply-command-center
nvm install 24
nvm use 24
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install

PUBLIC_SITE_MODE=true \
NEXT_PUBLIC_COMMAND_CENTER_URL=https://lifesupply-cc-web.onrender.com \
NEXT_PUBLIC_APP_URL=http://localhost:3000 \
pnpm dev
```

Repository Playwright smoke coverage is in `playwright.config.ts` and `tests/e2e/lifesupply-public.spec.ts`. Dependencies are committed; a local browser binary remains a developer-machine setup step. Run the browser installation locally, then test the approved Vercel preview or a local server. Do not commit browser binaries.

```bash
pnpm exec playwright install chromium
PUBLIC_SITE_BASE_URL=https://lifesupply-command-center-2ks6r71qy-vidwads-projects.vercel.app \
pnpm test:public-e2e
```

The repository includes a credential-free 21st.dev MCP template at `mcp/21st.mcp.json.example`. A developer who has an authorized 21st key may configure it in their local Claude Code/MCP settings only. Never commit `API_KEY_21ST`, add it to Vercel/Render for public-site design work, or grant an MCP access to production credentials. The Playwright and Vercel integration details, quality-gate expectations, and troubleshooting notes are maintained in `docs/39_TOOLING_AND_MCP_PARITY.md`.[4]

## Validation and release gates

Use the following sequence for every focused front-end pull request. Keep the visual change small enough to review alongside its source/claim impact. A current local build diagnostic should be recorded honestly: the Node 24 public build successfully compiles and completes type collection but currently fails during Next prerender of `/_global-error` with a `useContext` null error. This route is outside the LifeSupply component changes, and the failure should be investigated as a separate baseline/platform issue before merge rather than hidden or worked around by weakening the public build.

| Gate | Command or action | Required result |
|---|---|---|
| Formatting | `pnpm format:check` | Clean check after changes; use `pnpm format` intentionally before review. |
| Type safety | `pnpm typecheck` | No TypeScript errors. |
| Static quality | `pnpm lint` | No new lint warnings/errors. |
| Unit suite | `pnpm test` | Existing suite remains green. The first restoration pass produced 81 passing files and 1,059 passing tests under Node 24. |
| Public build | `pnpm public-web:build` | Must be green before merge. If blocked by the known `/_global-error` prerender failure, file/resolve the baseline defect and rerun; do not call the branch release-ready. |
| Browser smoke | `PUBLIC_SITE_BASE_URL=<preview> pnpm test:public-e2e` | Homepage, public routes, mobile layout, and external Render login boundary pass. |
| Visual review | Capture desktop and mobile screenshots for `/`, `/about-us/`, `/our-operations/`, `/investor-relations/`, and `/contact/` | Confirm brand cues, contrast, overflow, image crops, focus states, and no dashboard leakage. |
| Security and disclosure review | Read diff for `src/proxy.ts`, public API, content, environment, and claim changes | No route broadening, Vercel secrets, raw data exposure, invented claims, or unapproved regulated/investor content. |

## Delivery sequence

Proceed in short, reviewable pull requests. Begin with the common public shell, tokens, and two visual anchor pages. Then refine one content family at a time: operations/team, investor/news, and contact/shop. Introduce any new approved asset only with a provenance note. Once the visual system is stable, connect future published data from Render server-to-server and retain a graceful generic failure path if the publication source is unavailable. Finally, run the complete validation matrix, review PR #60, verify the Vercel public preview and Render login separation, and seek approval before merging or attaching the custom domain.

The standalone `vidwad/life-supply-health` repository may be removed only after recording its final commit or preservation tag in `docs/37_LIFESUPPLY_PUBLIC_CUTOVER_RUNBOOK.md`, confirming that all needed original assets, source documentation, and rollback reference are available in this repository, and confirming the unified branch has passed the complete release gates. Deletion is not a substitute for preservation.

## References

[1]: docs/38_RENDER_VERCEL_CLAUDE_HANDOFF.md "Render/Vercel architecture and Claude Code handoff"
[2]: https://lifesupplyhealth.com/ "Legacy LifeSupply Health public website"
[3]: https://lifesupplyhealth.com/wp-content/uploads/elementor/css/post-7.css?ver=1662883445 "Legacy Elementor global stylesheet"
[4]: docs/39_TOOLING_AND_MCP_PARITY.md "LifeSupply tooling and MCP parity"
