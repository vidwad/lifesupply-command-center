# CLAUDE.md — LifeSupply Corporate Website and Operating-Site Integration

**Repository:** `vidwad/lifesupply-command-center`  
**Workstream:** Public website expansion, brand integration, and commercial inquiry development  
**Prepared:** September 8, 2026  
**Product owner:** Vid Wadhwani  
**Document status:** Development brief prepared at the product owner's request. Proposed public copy and business claims still require their applicable review.  
**Execution rule:** Execute only the stage requested in the current prompt. Finish its work, verification, documentation, commit, push, and review handoff; then stop. Never automatically start the next stage.

## 1. Start here

Read this entire guide before the first website stage. On subsequent stages, reread the current stage, the shared controls, and `docs/website-development/STATUS.md`. Do not assume a nested CLAUDE.md is automatically loaded when editing `src/`; the root CLAUDE.md and kickoff prompt explicitly direct you here.

Required project context:

1. Root `CLAUDE.md` — existing Command Center controls remain in force.
2. `docs/website-development/STATUS.md` — stage progress and evidence.
3. `docs/20_PHASE_11_DEPLOYMENT_READINESS_PLAN.md` and `docs/RELEASE_READINESS_STATUS.md` — release controls and current recorded decisions.
4. `docs/36_PUBLIC_SITE_CONSOLIDATION.md` — shared repository and public-content architecture.
5. `docs/37_LIFESUPPLY_PUBLIC_CUTOVER_RUNBOOK.md` — migrations, publication, host separation, and rollback.
6. `docs/38_RENDER_VERCEL_CLAUDE_HANDOFF.md` — public Vercel and internal Render responsibilities.
7. `docs/39_TOOLING_AND_MCP_PARITY.md` — development tooling and browser checks.
8. `docs/40_LEGACY_LIFESUPPLY_BRAND_AUDIT.md` — visual system and asset provenance.
9. `docs/14_DEVELOPMENT_STANDARDS.md` and other domain documents when the stage touches their scope.

This brief updates the earlier website sitemap and content-family build order in docs/40 and docs/41 for the expanded business plan. It does not override authentication, publication, financial integrity, external-action, migration, or production-release controls. The website stage numbers below are distinct from Command Center Phase 11 work packages; completing website Stage 10 does not automatically accept a Phase 11 gate.

Existing documents include dated and occasionally conflicting build/readiness descriptions. Inspect the current code, scripts, deployment configuration, and actual test results. Record the current commit and evidence; do not copy historical passing-test counts or declare a previously reported defect still present without reproduction. Where configuration documents conflict, use Stage 1 to identify the discrepancy and propose a reconciliation without changing infrastructure.

## 2. Business objective and boundaries

Develop LifeSupplyHealth.com as the corporate and business-development hub for the group. It must explain existing operations, make the four operating brands visible, attract clinic and pharmacy relationships, introduce the metabolic supply strategy, support investors and shareholders, and direct customers to the appropriate store or service.

Build on the existing Next.js public website. Preserve the Command Center, current operating storefronts, protected login, approved assets, and useful legacy URLs. This work does not authorize a replacement ecommerce engine, shared shopping cart, pharmacy platform, patient portal, or clinical decision system.

Proposed strategic positioning for review:

> LifeSupply connects medical-supply commerce, clinic development, equipment sourcing, and ongoing supply services across its Canadian and U.S. businesses. Its expansion strategy builds on these capabilities to develop deeper clinic relationships and recurring patient-support supply programs.

Translate this into clear public language. Avoid repeated internal phrases such as “public operating context,” “the narrative describes,” or “approved DTO.” Keep provenance and workflow details in the content system; place necessary qualifications beside the relevant claim.

### Business and domain registry

| Stable key | Brand / surface | Canonical destination | Role and constraints |
|---|---|---|---|
| corporate | LifeSupply Health | https://lifesupplyhealth.com/ | Corporate strategy, operating portfolio, partners, investors, and shareholder information. |
| lifesupply | LifeSupply | https://lifesupply.ca/ | Broad Canadian ecommerce; proposed emphasis on clinic procurement and approved care-supply programs. Existing consumer access remains. |
| wellmart | Wellmart Medical | https://wellmartmedical.com/ | Canadian medical-supply ecommerce; proposed emphasis on home-care merchandising and repeat purchasing. Do not imply professional buyers are excluded. |
| clinics | LifeSupply Clinics | https://www.lifesupplyclinics.com/ | Clinic planning, design, construction/fit-out services, project coordination, and equipment inquiries within verified delivery arrangements. Not evidence of company-operated patient-care clinics. |
| balkowitsch | Balkowitsch Worldwide | https://balkowitsch.com/ | U.S. ecommerce in USD, with medical, health, wellness, and related categories. Preserve its established identity and broader catalogue. |
| command_center | Internal Command Center | Existing configured Render origin | Authorized staff access through the existing external login helper; never a customer-store login. |

Strip supplied `srsltid` search parameters from canonical links. Use validated, deliberate attribution parameters only when needed. Record legal operating entities separately from brand names and store identifiers. Do not assert ownership percentages, subsidiary status, exclusivity, or a new legal division solely from a website label.

### Operating model to explain

- Existing Canadian and U.S. commerce provides the operating foundation.
- Clinic development can introduce an equipment opportunity, opening supplies, and ongoing procurement.
- Existing clinics can become supply customers without a construction project.
- Metabolic care kits introduce appropriate supply configurations; recurring value comes from usage-driven consumables, ordinary clinic procurement, and contracted non-clinical fulfilment/workflow services.
- Pharmacy, compounding, peptide synthesis, research, and regulated manufacturing are separate staged opportunities with individually verified status.
- A construction inquiry is not an ordering clinic, a clinic customer is not a metabolic-program participant, and an expression of interest is not contracted revenue.

### Source material and unresolved facts

Business context comes from the product owner's website planning instructions, the 18-page `LifeSupply_Business_Plan_Complete_18pg.pdf.pdf`, and the September 2, 2026 `LifeSupply_Metabolic_Health_Supply_Services_Division_Business_Plan_September_2026.pdf` associated with Integrated Model v12. These documents were reviewed during preparation of this brief but are not assumed to be checked into the repository or accessible in a future Claude session. Treat this guide as the development requirements, not a substitute source for publishing their financial data. Locate approved materials through authorized sources when needed; record unavailable sources instead of inventing their contents.

The September supply-services plan refines the older kit-only narrative: starter durables are not repeated like consumables; clinic procurement and contracted services are distinct revenue streams. Do not import older whole-kit subscription assumptions into the website.

The current planning context references a $4.2 million financing target. Do not hardcode this or prior financing amounts, issue prices, valuations, IRRs, or share counts into public pages without a current approved financing source. Preserve CPC, TSXV, and CSE as potential structures only where the current approved narrative calls for them; do not announce a listing, completed transaction, or committed partner. FendX discussions are not evidence of a completed public partnership.

Use the source register to reconcile customer counts, product counts, dates, team members, brands, addresses, currencies, and financial periods. Cumulative acquired-business customers, active customers, and deduplicated group customers are different measures. Partner project budgets are not automatically LifeSupply revenue.

## 3. Target sitemap and page contracts

Primary navigation: **Our Businesses / Clinic Solutions / Metabolic Health / Partners / Investors / About**. Utility: **Shop & Services / Contact / Command Center Login**. Home via the logo. News & Resources appears in suitable menus and the footer. Mobile navigation must expose all these paths without a hover requirement.

Stage assignments below are implementation ownership, not automatic approval to publish unverified services. A complete informational page may describe an initiative as in development; a transactional action becomes available only when fulfilment can actually occur.

| Route | Stage | Page contract and primary action |
|---|---|---|
| `/` | 2 | Direct group introduction, verified proof, four brands, clinic lifecycle, metabolic opportunity, partner/investor paths, current news, closing contact. Explore businesses / plan a clinic / investor information. |
| `/about-us/` | 2 | Current group introduction, geographic footprint, sourced milestones, operating philosophy, brands, growth direction. Explore operations. |
| `/our-operations/` | 3 | Portfolio map distinguishing brands, legal entities, shared capabilities, and developing programs. Explore a business. |
| `/our-operations/lifesupply/` | 3 | Canadian supply categories, broad audience, clinic-procurement direction, service channels, links to store and supply inquiry. |
| `/our-operations/wellmart-medical/` | 3 | Canadian commerce, home-care and medical categories, customer service, existing professional audience. Shop Wellmart. |
| `/our-operations/lifesupply-clinics/` | 3 | Planning/design/build/fit-out/equipment, verified geography and partner roles, process, approved projects, post-opening supply opportunity. Plan your clinic. |
| `/our-operations/balkowitsch/` | 3 | U.S. business, USD purchasing, product breadth, current capabilities and group role. Shop Balkowitsch / U.S. business inquiry. |
| `/our-operations/technology-fulfilment/` | 3 | Sourcing, catalogue, order handling, fulfilment, service exceptions, management systems; implemented vs developing capabilities. Discuss supply needs. |
| `/clinic-solutions/` | 3 | Three needs: plan/renovate, equip, or supply an existing clinic. Show appropriate next step. |
| `/clinic-solutions/design-build/` | 3 | Corporate introduction to projects, service geography, delivery roles and consultation requirements. Deep-link to Clinics consultation. |
| `/clinic-solutions/equipment/` | 3 | Room/function-based equipment planning, quote requirements, opening supplies, catalogue links. Request an equipment plan or quote. |
| `/clinic-solutions/ongoing-supplies/` | 3 | Routine procurement, account purchasing, approved substitutions and repeat ordering as available. Request a clinic supply review. |
| `/metabolic-health/` | 4 | Non-drug supplies, clinic procurement, kitting/fulfilment and contracted workflow support; audiences, process, actual availability. Explore kits / discuss a program. |
| `/metabolic-health/care-kits/` | 4 | Eight configurable pathways, audience, starter/refill/occasional distinction, availability and appropriate action. |
| `/metabolic-health/care-kits/[kit-name]/` | 4 | Eight specific pages using the kit contract below. Link to approved store SKU/configuration or a working inquiry route. |
| `/metabolic-health/refills/` | 4 | Starter vs consumables; reminder vs automatic shipment; intervals, pauses, cancellation, changes, substitutions. Publish service claims only when supported. |
| `/partners/` | 5 | Clinics, pharmacies, suppliers/manufacturers, acquisitions. Route by relationship. |
| `/partners/clinics/` | 5 | Program/design-partner collaboration and pilots, differentiated from ordinary procurement. Discuss clinic collaboration. |
| `/partners/pharmacies/` | 5 | Non-drug supplies, pharmacist-selected configurations, fulfilment responsibilities, complaints and recalls. Discuss a supply program. |
| `/partners/suppliers/` | 5 | Suitable categories, regions, distribution rights, product data, commercial/onboarding process. Submit supplier inquiry. |
| `/partners/acquisitions/` | 5 | Fit criteria, integration rationale, general structures, confidential process; include strategic/public-market counterparties as an inquiry type. |
| `/investor-relations/` | 5 | Current business, investment rationale, verified financial context, growth, milestones, materials and contact. Request investor materials. |
| `/investor-relations/growth-strategy/` | 5 | Existing business improvement, clinic accounts, metabolic supply/services, regulated development, selective transactions; dated stage/milestone view. |
| `/investor-relations/advanced-therapeutics/` | 5 | Pharmacy, specialty/compounding, peptide synthesis/research, manufacturing: individually defined status and dependencies. Strategic inquiry. |
| `/investor-relations/documents/` | 5, 6 | Public, restricted-request, and historical categories; title/date/version/status. Actual controlled documents in Stage 6. |
| `/investor-relations/shareholder-services/` | 5 | Contact/name/address/certificate/re-registration/transfer/lost-certificate queries and meeting information when available. Secure follow-up route. |
| `/investor-relations/disclosures/` | 5 | Approved financial and forward-looking context tied to the actual published materials. |
| `/our-team/` and retained profile slugs | 5 | Current management and board, approved biographies/portraits, appropriate historical treatment. No duplicate or invented directors. |
| `/news/` | 5, 6 | Distinguish current company news, historical releases, and practical resources; truthful dates. |
| `/news/[slug]/` | 5, 6 | Dated full announcement, source, related material and contact. Preserve original dates. |
| `/resources/[slug]/` | 5, 6 | Practical supply/procurement guidance, author/reviewer, source/review date and relevant action. |
| `/shop/` | 3 | Visible title Shop & Services: four choices, geography/currency, clear destination and support. Keep original URL. |
| `/contact/` | 3, 7 | Verified directory and intent routing first; durable validated inquiry workflow in Stage 7. |
| `/contact-2/` | 9 | Permanent redirect to `/contact/`, after validating current routing/trailing-slash behavior. |
| `/privacy/`, `/terms/`, `/accessibility/` | 5, 7 | Actual site practices and assistance; reviewed policies before live collection. Update for Stage 7/8 functionality. |
| submission confirmation and not-found | 7, 9 | Accurate next step or useful recovery; noindex confirmations; do not expose submitted data in URLs. |

Earlier proposed `/our-operations/canada/` and `/our-operations/united-states/` were planning options, not assumed existing pages. Prefer the four brand pages above. If those geographic URLs have since been implemented, inventory them and retain useful overview content or redirect deliberately. Never create broken links merely to match a prior plan.

### Individual kit requirements

| ID | Slug | Working label | Critical distinction |
|---|---|---|---|
| K01 | `glp-1-support` | GLP-1 Support Supplies | Non-drug accessories; device-specific requirements; medication excluded. |
| K02 | `injection-safety` | Injection Safety Supplies | Compatible configurations only; an insulin syringe is not universal injectable equipment. |
| K03 | `sharps-supplies` | Sharps Containers and Supplies | Home/travel sizes and usage-driven replacement; disposal guidance must fit region and service scope. |
| K04 | `travel-support` | Travel Supply Organization | Occasional purchase; storage claims follow the exact supported products. |
| K05 | `home-monitoring` | Home Monitoring Supplies | Equipment/accessory sizing and compatibility; no treatment interpretation. |
| K06 | `diabetes-supplies` | Diabetes Supply Support | Meter/strip and lancing-device compatibility; actual refill requirements. |
| K07 | `clinic-injectable-supplies` | Clinic Injectable Supplies | Clinic purchasing configurations and par-level restocking, not one universal repeated pack. |
| K08 | `pharmacy-patient-support` | Pharmacy Patient-Support Supplies | Pharmacist-selected non-drug supplies and explicit fulfilment responsibilities. |

Each kit page needs purpose, audience, verified contents/quantities, actual images, configurations, compatibility, one-time vs refill items, exclusions, availability, support, FAQs, and a functioning next step. Store bill-of-materials/configuration revision and approved destination references in the underlying content. Do not invent SKUs, quantities, prices, insurance coverage, savings, storage performance, or clinical endorsement. A 20% bundle discount is publishable only when validated against current prices of the exact contents. Missing approved contents should lead to an honest program-information/inquiry presentation, not a purchasable placeholder.

Do not diagnose, prescribe, recommend medication/dosage, imply drug dispensing through supply fulfilment, or advertise speculative regulatory changes as certain. Do not introduce referral or prescription-linked incentives. Jurisdiction-specific claims require current primary sources and the relevant review before release. Keep the general health disclaimer short and the actual product information precise.

## 4. Visual and interaction direction

- Retain LifeSupply red `#DE0000`, charcoal/black, white/off-white, Roboto and Roboto Condensed as defined in existing tokens.
- Preserve original logos, correct proportions, and approved placement. The white LifeSupply wordmark needs a dark field. Use authentic operating-brand assets with source/usage records; never recreate a partner mark from memory.
- Build an editorial hierarchy: strong hero, short introduction, meaningful image/content sections, concise tables/diagrams, and clear actions. Avoid repeated rounded-card grids, vague medical stock imagery, decorative dashboards, and oversized empty sections.
- Use supplied/original hero video only where readable and useful, with poster, pause control as appropriate, reduced-motion support, and a static mobile fallback. Preserve the existing hero assets unless the stage has a justified approved replacement.
- Distinguish operational photography from conceptual imagery. Projects and testimonials need permission and accurate attribution. Do not imply work was completed by LifeSupply when a delivery partner performed it.
- Render meaningful page text in HTML. Images of decks, timelines, or charts are not substitutes for accessible text and data.
- Use one h1, logical headings, readable body text, meaningful link labels, and useful mobile menus. Verify focus, contrast, zoom, form labels, errors, and reduced motion.
- Keep visible production copy free of technical workflow labels. Missing approvals belong in the private register; draft previews may show a review indicator that cannot leak through to production.
- Every primary action must work. Before Stage 7, use verified contact or consultation links. Do not render a form that reports success without persisting or delivering the inquiry.

## 5. Architecture and implementation boundaries

Use the current Next.js / React / TypeScript / Tailwind stack and existing components. Do not upgrade packages or introduce a CMS/backend/provider solely to complete this brief. Inspect current versions and scripts before using commands. Node 24 and pnpm 10.0.0 were recorded at preparation; use the current repository pins if intentionally updated.

| Area | Existing location | Expected treatment |
|---|---|---|
| Public content/navigation | `src/lib/public-site/lifesupply-content.ts` | Extend or split into focused typed modules while preserving a governed public source. |
| Shared shell | `src/components/public-site/lifesupply-layout.tsx` | Portfolio navigation, utility links, footer, mobile behavior. |
| Public page components | `src/components/public-site/lifesupply-pages.tsx` and primitives | Reusable templates; split a large file by content family only when useful. |
| Public routes | `src/app/` public pages | Thin route composition, correct metadata and error/not-found behavior. Avoid collision with dashboard routes. |
| Login | `src/lib/public-site/command-center.ts` | Retain `getCommandCenterLoginUrl()` and external protected Render destination. |
| Host boundary | `src/lib/public-site/host.ts`, `src/proxy.ts` | Preserve and verify; changes only in a specifically scoped boundary fix with regression evidence. |
| Publishing | `src/server/public-web/`, publication models, `/public-web` | Extend existing foundation, permissions, validation, and auditing. |
| Assets | `public/lsh/` | Preserve originals; add only approved, optimized assets with provenance. |
| Tests | Existing public unit/contract tests, `tests/e2e/`, `playwright.config.ts` | Extend meaningful coverage rather than duplicate the implementation. |

Vercel stays database-free and serves public content. Render retains PostgreSQL, migrations, workers, Auth.js, internal APIs, and operational secrets. The public build is `pnpm public-web:build`; do not use the migration-bearing `vercel-build` script for this surface. No database, supplier, accounting, or staff-auth credentials on Vercel or in client bundles.

Shared code does not prove host isolation. Test all sensitive route families, not only `/dashboard`: customers, orders, suppliers, products, financials, investors, reports, exports, admin, auth, and non-public APIs. Preserve server-side authorization even where a proxy redirects. Public APIs must be intentionally scoped and validated; do not rely on the `/api/public/` prefix as proof of safety.

Source systems retain ownership: BigCommerce for store transactions/catalogue, QuickBooks for accounting, Mailchimp for its approved subscription/campaign records, and Command Center for its workflow records. No product/price/accounting writebacks, campaign sends, supplier orders, or investor-document distributions are enabled by this guide.

### Content model

Use a typed brand registry and route/action registry, with canonical URLs, geography, currency, purpose, support destination, verified legal relationship, asset reference, source, owner, verification date, and publish status. Unknown values stay unknown privately; omit unsupported public claims.

Content should support stable ID, slug, type, title, summary, structured body, audience, related brands, action destinations, assets, metadata, source references, reviewer, revision, effective/expiry dates, and two independent statuses:

1. Publication: `draft → under_review → approved → published → archived`.
2. Business availability: operating, pilot, in development, under evaluation, unavailable.

Use existing database enums/contracts where possible. Do not force schema changes into visual stages. Stage 1 records schema needs; Stage 6 owns additive publication migrations and their rehearsal.

Public metrics need period, currency, entity scope, definition, source, and accounting status. Documents need access class, version, published/effective date, and authoritative file reference. Never copy confidential workpapers into `public/`.

### Publishing and failure behavior

Use strict published-only DTOs and server-side readers. Draft previews require protected review access; preview deployments must remain noindex and must not expose confidential draft documents.

Test publication permissions, content validation, effective dates, expiration, archive/withdrawal, revision conflicts, and audit events. Cache invalidation must remove withdrawn or expired content. Do not resurrect a withdrawn document or obsolete metric through a stale static fallback. Stable approved corporate copy can be a fallback only under an explicit eligibility policy; sensitive/time-dependent content fails closed.

Signed revalidation events, if added later, require narrowly scoped webhook configuration approved for that purpose, signature validation, timestamp/replay protection, and explicit path/tag allowlists. Such a secret is not an internal Command Center credential and must never expose internal authority. Prepare the configuration proposal before deployment; this guide does not add environment secrets automatically.

### Inquiry contract

Stage 7 must define request schema, persisted record, assignment, retention, operational ownership, delivery state, error handling, duplicate handling, abuse controls, and audit scope before connecting live forms.

Intent types: clinic development, equipment quote, ongoing procurement, metabolic program, pharmacy, supplier, investor, shareholder, acquisition/strategic transaction, general, existing-order support. Existing-order requests go to the originating store.

Persist source brand/page, intent, contact details, organization, region, timestamp, relevant consent and optional campaign fields. Use server-controlled destination/owner mapping. Never trust a browser-provided recipient, internal record ID, or unrestricted redirect URL. Minimize free text in logs; never put PII in analytics or query strings.

Forms need server validation, length limits, rate limiting/abuse handling, appropriate origin/CSRF protections, duplicate/retry safeguards, durable storage, and an honest success/error response. Browser refresh must not multiply records. Acknowledgment email and staff notifications are separate deliveries with status and retry handling; test in a controlled sink before enabling approved sends. Do not expose secret-bearing backend credentials on the public deployment. A narrowly scoped anonymous inquiry endpoint does not grant staff API access.

Newsletter choice remains separate from service-response processing. Do not collect patient records, prescriptions, identity documents, or share certificates in general forms. Restricted follow-up channels are separate. Initial scope excludes arbitrary file uploads and shared patient data across brands.

### Commerce and cross-site contract

Keep independent storefront checkout, customer accounts, currencies, prices, policies, returns, and support. No universal login or cart is implied. First use verified links, then a channel-approved read-only projection if needed. A projection maps store ID, SKU, variant/pack, manufacturer reference, currency, region, availability, destination URL, and update time. Outage/stale-price behavior must be explicit; an unavailable feed must not invent stock or a current price.

Corporate resources explain the group, program, or service; product pages own detailed purchase specifications. Avoid cloned catalogues, forced cross-domain canonical tags on distinct pages, or iframes of entire stores. Detect geo preference without forcing a redirect that traps visitors in the wrong country.

Reciprocal links on the four external sites require their own authorized admin/repository access and verified operating owners. This repository can deliver destination mappings and exact change briefs without pretending external changes were applied. Record each site independently as proposed, implemented, or verified.

## 6. Stages and dependencies

Run one numbered stage per explicit instruction. Complete its unblocked work autonomously; ask only for a concrete missing decision that blocks the remaining requested work. Do not repeatedly request approval already supplied. Missing business facts can be documented and their unsupported claims omitted while safe development continues. An explicitly required production gate cannot be bypassed through omission or a changed document.

| Stage | Name | Depends on | Principal result |
|---|---|---|---|
| 1 | Baseline, source reconciliation, and implementation specification | This guide | Evidence, route/brand/action inventories, content register, dependency map. |
| 2 | Public shell, homepage, and corporate overview | 1 | Refined navigation/design system and first two complete pages. |
| 3 | Four brands, Clinic Solutions, and Shop & Services | 2 | Complete operating portfolio and clinic commercial journeys. |
| 4 | Metabolic Health and eight supply pathways | 3 | Accurate program, kit, and refill presentation. |
| 5 | Partners, investors, leadership, and resources | 3; reconcile links with 4 | Complete corporate information and relationship pages. |
| 6 | Governed publishing and document delivery | 4–5 | Secure maintainable content, documents, revisions, and cache behavior. |
| 7 | Inquiry capture and Command Center handoffs | 6; relevant policy/owner decisions | Validated durable forms and accountable follow-up. |
| 8 | Operating-site integration and measurement | 7; external access where needed | Reciprocal navigation briefs/changes, attribution, optional approved product projection. |
| 9 | SEO, accessibility, migration, and release verification | 2–8; documented accepted deferrals | Reviewable launch candidate and cutover evidence. |
| 10 | Authorized cutover and stabilization | 9 and existing release gates | Controlled public launch, monitoring and rollback evidence. |

Stages 4 and 5 have some independent implementation areas, but still execute sequentially unless the product owner explicitly changes the one-stage instruction. Do not spawn or delegate agents by default.

### Stage 1 — Baseline, source reconciliation, and implementation specification

**Goal:** Establish an accurate, implementable starting point without altering runtime behavior.

Tasks:

1. Inspect git status, active branch, origin, current main, instruction files, open relevant PRs, deployment/build configuration, source paths, and existing public tests. Do not overwrite unrelated work or assume the old baseline is current.
2. Record the starting commit, current Node/pnpm pins, actual route/template inventory, publication implementation, inquiry implementation, and known deployment controls. Determine which capabilities are code-only, reviewed, deployed, and operationally verified.
3. Read the four operating sites and corporate site where accessible. Record access dates and failed access honestly; do not use search snippets as proof of detailed page contents. Capture representative public page screenshots when tooling permits.
4. Create `docs/website-development/BASELINE_AUDIT.md`, `SOURCE_REGISTER.md`, `ROUTE_AND_ACTION_MAP.md`, and `IMPLEMENTATION_BACKLOG.md`.
5. In the source register, separate observed public statements, approved current facts, historical facts, planning assumptions, and unresolved claims. Seed the four canonical domains and the kit/clinic/investor constraints from this guide. Identify the current legal entities, contacts, project attribution, financial documents, programme availability, and brand assets that still need evidence.
6. In the route map, assign every route in section 3 a template, audience, primary action, destination/owner, content source, implementation stage, and current status. Record exact verified consultation/category URLs instead of guessing them. Mark proposed routes as proposed.
7. Create a practical backlog with work IDs, acceptance criteria, dependencies, current files, and decisions. Design the brand registry, availability/publication model, and future inquiry contract without implementing the backend.
8. Run the existing baseline checks where the supported environment permits: format, types, lint, unit tests, public build, normal build, and existing public smoke checks. Record failed/blocked/not-run precisely. Do not patch unrelated baseline defects in this documentation stage; create a bounded follow-up item with reproduction and impact.
9. Update STATUS, commit the documentation, push the stage branch, and open a review PR when possible. Then stop.

Allowed changes: `docs/website-development/` and minimal cross-reference corrections to development docs if required and explained. Do not change runtime code, package versions, infrastructure, credentials, database, production content, or external websites.

Acceptance: all planned routes and four brands mapped; conflicting facts documented; runtime baseline evidenced; dependencies actionable; source/approval status honest; no code implementation claimed. If a missing tool blocks screenshots or a build, record it and finish the remaining documentation before reporting the specific blocker. Stage 2 must account for unresolved baseline blockers rather than assuming a green foundation.

### Stage 2 — Public shell, homepage, and corporate overview

**Goal:** Establish the complete public visual and navigation foundation.

Tasks: implement the typed brand/route/action registry; grouped desktop/mobile navigation; utility links; four-brand footer; Home and About page contracts; approved proof fields; clear clinic-development and investor paths; accessible original media and responsive layouts. Keep unavailable future destinations out of live navigation or route to an honest existing contact/information page until the destination exists. Internal preview route maps can still record the full planned sitemap.

Allowed changes: public components, public content/types, Home/About routes, scoped styles/assets, focused tests and development evidence. No database, authentication, worker, store, or infrastructure changes.

Acceptance: Home/About complete at mobile and desktop; four brands recognized; no speculative metrics; keyboard menus and reduced motion work; external Render login exact; no dead primary actions; required code checks and browser review recorded. Capture both pages, navigation open states, and footer at mobile and desktop. Update STATUS and stop.

### Stage 3 — Four brands, Clinic Solutions, and Shop & Services

**Goal:** Make the operating portfolio and clinic lifecycle commercially useful.

Tasks: build Operations hub, four brand pages, technology/fulfilment page, Clinic Solutions hub and its three children, Shop & Services, and contact directory/intent links. Confirm clinic development versus patient-care distinction. Add approved project examples with delivery-role attribution. Give each store direct external actions and retain its account/support boundary. Introduce conditional clinic-development-to-equipment-to-supply opportunities without representing them as contracted results.

Allowed changes: relevant public routes/content/components/assets and tests. Produce external-site handoff notes but do not alter unrelated stores from this repository.

Acceptance: every operating brand has a complete page and verified canonical link; clinic development/equipment/ongoing procurement paths work; existing-clinic customer can bypass construction; Shop & Services identifies geography/currency; project and technology claims are sourced; Contact provides a working directory without fake forms. Update STATUS and stop.

### Stage 4 — Metabolic Health and eight supply pathways

**Goal:** Explain the supply-services strategy and build usable kit information pages.

Tasks: build the division hub, kit hub, all eight route templates/configurations, and refills page according to section 3. Model starter/refill/occasional items and compatibility. Keep service status explicit. Link only to approved configurations available in the selected store; otherwise use a genuine information/inquiry action. Add useful FAQs, professional-role boundaries, cancellation/reconfiguration information reflecting the real service, and clinic/pharmacy links.

Allowed changes: public content/types/components/routes, approved assets, focused tests. Do not implement subscriptions, payment schedules, drug checkout, clinical workflows, or store catalogue writebacks.

Acceptance: all eight pathways represented; no universal syringe/device claims; no repeated durables disguised as subscriptions; no invented price/discount/availability; medication excluded from non-drug kit scope; actions match actual operating status. Pages missing essential approved configuration data may remain unpublished, with a completed reviewable template and explicit status; never call those product pages launched. Update STATUS and stop.

### Stage 5 — Partners, investors, leadership, and resources

**Goal:** Complete the public corporate and relationship content families.

Tasks: implement Partner hub and four partner routes; investor hub, growth strategy, advanced therapeutics, document index, shareholder services, disclosures; reconcile team/profile pages; implement News and Resource templates and approved initial content; prepare actual policy pages. Distinguish clinic supply service from program collaboration. Use historical dates correctly. Keep confidential investor-material access at a request/contact stage until Stage 6 provides the approved protected delivery path.

Suggested resource briefs: clinic procurement planning; starter equipment versus refills; supply compatibility; travel supply organization; pharmacy supply partnership; metabolic program overview. Do not fabricate publication dates, authors, reviewers, projects or press releases to fill the layout.

Acceptance: all required information routes have clear audience/action; current vs historical team entries accurate; investor metrics fully scoped or omitted; no unapproved financing/listing/partnership claims; restricted documents absent from public assets; newsroom dates truthful; policies accurately reflect the current implemented behavior. Update STATUS and stop.

### Stage 6 — Governed publishing and document delivery

**Goal:** Make the new content maintainable within the existing Command Center publication authority.

Tasks: audit existing publication models/services/UI before extending them; build missing editor/reviewer views; content validation, preview, approval, publish/unpublish/archive; revision/conflict checks; source/owner/effective-date fields; public DTO projections; replace static content one family at a time; public document metadata and actual accessible downloads; controlled restricted-document request/delivery design; withdrawal and cache behavior; audit events and generic errors. Use narrow public data contracts, not raw Prisma models.

Any necessary migration must be additive, reviewed, and rehearsed under the existing runbook. Do not apply a production migration as a side effect of a website build. Do not silently replace existing auth or add a new investor portal. If restricted delivery infrastructure is not approved/available, retain a functioning request route and mark restricted delivery deferred, rather than leaking a public file behind a cosmetic gate.

Acceptance: unauthorized editing/approval denied server-side; only approved/published/effective content reaches the public API; invalid and archived records excluded; expired/withdrawn data not restored by cache/fallback; revisions audited; database failure returns a generic response; no sensitive fields in public JSON, HTML or bundles; approved documents readable; restricted files inaccessible by guessed public URL. Update STATUS and stop.

### Stage 7 — Inquiry capture and Command Center handoffs

**Goal:** Turn public interest into durable, assigned operational work.

Tasks: implement the inquiry contract in section 5 with existing backend patterns; dynamic intent fields; minimization and consent copy; intake endpoint; durable persistence; assignment rules; controlled acknowledgment/notification delivery; retry/error state; staff queue/status and deduplication; retention behavior; observable delivery failures; separate newsletter choice. Use real non-production test submissions and a controlled email sink.

Project fields: clinic type, location, approximate size, current stage, target opening, equipment/supply interest. Investor forms request only initial contact and interest. Shareholder forms request administrative purpose, not certificate/identity uploads. Source/page/brand attribution must survive internal handoff.

Acceptance: valid submission persists once and reaches the right queue; invalid/abusive requests fail safely; failed storage never displays success; retries do not duplicate records; no arbitrary recipient injection; no PII in analytics; error states accessible; marketing consent separate; unauthenticated visitors cannot read the inquiry queue. Actual outbound sending remains subject to existing explicit workflow approval. Update STATUS and stop.

### Stage 8 — Operating-site integration and measurement

**Goal:** Connect the sites and measure useful commercial outcomes without disrupting store operations.

Tasks: create `OPERATING_SITE_HANDOFFS.md` with per-site exact navigation/footer placements, copy, destinations, owner and implementation status. Apply only separately authorized changes through the actual operating site's admin/repo workflow. Add contextual clinic/equipment/procurement/program links; validate support routing; establish analytics event taxonomy and approved consent handling; implement cross-domain measurement only with access to the actual properties/store setup; optionally add a read-only channel-approved product projection if it solves a defined need.

Event examples: `brand_destination_click`, `clinic_consultation_click`, `equipment_quote_start`, `inquiry_submitted`, `investor_materials_requested`, `public_document_download`. Parameter values are non-sensitive intent/brand/page IDs. Server-confirmed submission event follows actual persistence. Do not equate outbound click with sale or publish tracking-dependent revenue attribution without validated order linkage.

Acceptance: four per-site handoffs complete; implemented changes independently verified; source attribution retained; repeat conversions not double-counted; policies/currency/accounts intact; unavailable external permissions recorded as external dependencies without claiming full integration. Optional feeds prove store/pack/currency mappings and stale-feed handling. Update STATUS and stop.

### Stage 9 — SEO, accessibility, migration, and release verification

**Goal:** Produce an evidence-backed public release candidate.

Tasks: inventory current WordPress URLs/assets and relevant search destinations; prepare explicit keep/redirect/archive map; preserve legacy profiles appropriately; implement canonical/trailing-slash handling, metadata, sitemap, robots, social previews and valid structured data; protect preview/draft/private/confirmation routes from indexing; run full journey/browser checks; inspect representative and high-risk pages visually; verify public/internal separation; confirm approved content coverage and operating follow-up owners; prepare cutover/rollback record against the actual candidate commit.

Test mobile 320/375/390, tablet 768, desktop 1440 or equivalent practical widths; keyboard menus, focus, zoom, reduced motion, image crops, text contrast, empty/error states, documents and forms. Select meaningful coverage rather than accumulating redundant screenshots. Proposed performance objectives: LCP <=2.5s, CLS <=0.1, INP <=200ms when sufficient field data exists. Lab checks are provisional; no Lighthouse score proves real-user INP. Optimize assets/scripts for the measured bottleneck.

Acceptance: no broken primary journey; no missing redirect for a retained high-value legacy URL; no confidential content indexed; no blocked critical build/security/form defect; complete QA evidence and clearly listed accepted deferrals. Resolve current baseline defects under an explicitly scoped fix rather than weakening checks. A release candidate is not launch approval. Update STATUS and stop.

### Stage 10 — Authorized cutover and stabilization

**Goal:** Launch the reviewed public website only through existing release controls.

First complete the reviewable launch package: exact candidate commit, green checks, approved content set, hosting/domain configuration proposal, migration status where applicable, operational owners, backup/rollback evidence, monitoring, and previous deployment reference. Determine which current instructions already authorize the next action; do not request the same authorization again. If a required approval is absent, identify the exact runbook/gate and ask only after the package is ready.

After applicable approval: execute the approved public deployment/domain cutover; verify HTTPS, canonical host/redirects, production indexing, all primary external destinations, document access, inquiry delivery and protected Render login. Monitor failures and use the documented rollback procedure if thresholds are breached. Preserve prior site/repository assets until the agreed rollback window closes. Record early observations and owners; do not fabricate a completed stabilization period on launch day.

Acceptance: actual authorized cutover and evidence recorded; post-launch checks performed; failures assigned; rollback tested/available as required; stabilization either complete with dates or explicitly still in progress. Command Center launch gates remain independently governed.

## 7. Git, execution, and evidence workflow

For each stage:

1. Inspect status and preserve unrelated work. Fetch remote refs. Read current main and the latest guide/status before choosing scope.
2. Start a dedicated `claude/website-stage-NN-short-name` branch from current `origin/main`. If main lacks an approved predecessor, do not silently stack runtime changes on unmerged work; report the dependency. For the initial documentation-only Stage 1, the unmerged instructions branch may be read with `git show` without altering the base branch. Use this guide as the task brief and write the Stage 1 evidence on a fresh branch from main. Keep the guide PR and implementation PR distinct.
3. Write a concise work plan in the stage evidence or PR. Inspect affected files and existing patterns before editing.
4. Complete the requested stage; do not treat a missing optional image/metric as a reason to abandon useful unblocked work. Record omissions and their exact release effect.
5. Use meaningful tests for behavior, access boundaries, parsing, publishing, forms and money/product mappings. Do not create tests that merely repeat the content implementation or test a documentation heading for its own sake.
6. Run the required existing checks for code stages, inspect the diff, and format only changed files. Avoid repository-wide reformat churn.
7. Update STATUS and stage evidence with the actual starting commit, changed files, tests, screenshots, source decisions, limitations, and next stage. Keep exact final commit hashes in the PR/final report to avoid self-referential file hashes.
8. Commit only stage changes; push and open a PR if access permits. Do not merge or deploy solely because a branch is pushed. The existing project has recorded main auto-deploy concerns; verify current behavior before proposing any merge.
9. Stop with the structured handoff below. Proceed only on the user's next stage instruction.

### Commands

Verify current scripts first. Typical commands at preparation:

```bash
nvm use
pnpm install --frozen-lockfile
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
PUBLIC_SITE_MODE=true pnpm public-web:build
pnpm build
```

Run the two builds sequentially with cleanly understood environment/outputs. `PUBLIC_SITE_MODE` must not leak into the internal deployment. Do not use production credentials to make a local check pass. Use approved development/test configuration and label an unavailable prerequisite honestly.

For a local public review server, use the existing public mode and login destination:

```bash
PUBLIC_SITE_MODE=true NEXT_PUBLIC_COMMAND_CENTER_URL=https://lifesupply-cc-web.onrender.com NEXT_PUBLIC_APP_URL=http://localhost:3000 pnpm dev
```

With that server running, use the repository's existing Playwright configuration:

```bash
pnpm exec playwright install chromium
PUBLIC_SITE_BASE_URL=http://localhost:3000 pnpm test:public-e2e
```

Read the suite before running against any shared environment, especially after forms are added. Do not submit real customer data, send production messages, or trigger external transactions for a smoke test. Record preview URL and commit when using an approved preview. Missing browser binaries or a network-restricted install is a concrete prerequisite issue, not a passing test.

Stage 1 runs existing checks to establish a baseline but writes documentation only. Subsequent documentation-only corrections need link/diff/format verification, not a repeated full application suite unless they change an execution contract that requires it. Preserve full required gates for code stages and pre-launch work.

### Required handoff

```text
Stage completed or attempted:
Status: Ready for Review / Blocked / Partially Complete
Starting commit:
Branch:
Final commit(s):
Pushed:
Pull request:

What changed and why:
Pages / workflows delivered:
Content and business claims introduced, omitted, or changed:
Verification: command, result, environment, evidence
Visual review: routes, widths, screenshots, remaining defects
External-site work: implemented / prepared only / blocked by access
Required decisions or dependencies: specific owner and impact
Deployment / migration / external sends actually performed:
Next stage and proposed kickoff prompt:

Stop here. Do not begin the next stage.
```

“Ready for Review” does not mean reviewed, merged, deployed, commercially live, or production-ready. Report those states separately.

## 8. Initial action

Use `docs/website-development/KICKOFF_PROMPT.md` to begin Stage 1. The first run produces the baseline audit, source register, route/action map, and backlog. It does not start the visual rebuild or alter the operating sites. Each later prompt identifies exactly one numbered stage and relies on the prior evidence instead of restarting discovery.
