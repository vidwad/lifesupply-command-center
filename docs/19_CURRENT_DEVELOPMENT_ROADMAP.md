# LifeSupply Command Center — Current Development Roadmap and Claude Code Phase Instructions

**Prepared:** August 3, 2026  
**Audience:** Claude Code, Codex, developers, project owner  
**Status:** Current controlling post-MVP development plan  
**Scope:** LifeSupply Command Center repository `vidwad/lifesupply-command-center`

---

## 1. Purpose of this document

This document exists to get development back on track after the initial MVP and early post-MVP work.

The repository now contains a meaningful application. It is not a blank scaffold and it is not merely a documentation package. Future work must therefore be sequenced carefully so Claude Code does not jump into attractive but premature work such as AI agents, supplier order automation, advanced forecasting, or broad marketing campaigns before the operating data foundation is complete.

Use this file as the **current active development roadmap**. It supplements the original Batch 1 and Batch 2 planning documents and should be treated as the controlling phase plan unless the product owner explicitly changes the sequence.

When the product owner asks Claude Code to run a phase, Claude must run only that phase, create a dedicated branch, complete the defined scope, run the required verification, commit the work, push it to GitHub, and report exactly what changed and what remains.

---

## 2. Current codebase state — what has already been built

The current application is best described as an **advanced MVP / early post-MVP operating platform**.

### 2.1 Core platform

Already built:

- Next.js / React / TypeScript application.
- PostgreSQL / Prisma database layer.
- Auth.js / NextAuth credential-based authentication.
- Role-based access control.
- Permission-gated sidebar navigation.
- Audit logging.
- Feature flags and kill switches for high-risk functionality.
- Application shell, top bar, sidebar, dashboards, tables, badges, cards, export buttons, and reusable UI components.
- CI workflow with typecheck, lint, format check, tests, and production build.
- Docker, Render, and Vercel deployment configuration.

### 2.2 Main modules already present

The sidebar includes the intended main modules:

- Executive Dashboard
- Operations
- Orders
- Customers
- Products & Catalog
- Suppliers
- Financials
- Marketing
- Analytics
- AI Analyst
- Reports
- Tasks & Workflows
- Approvals
- Investor Relations
- M&A / Opportunities
- Automation Center
- Admin Settings

These are not all equally complete, but the structural coverage is broad and generally aligned with the planned Command Center.

### 2.3 BigCommerce synchronization foundation

Already built:

- BigCommerce integration configuration rows for multiple stores.
- BigCommerce credential vault support.
- Full and incremental customer sync buttons.
- Full and incremental order sync buttons.
- Inngest-based background job functions for customer sync and order sync.
- Worker entrypoint at `src/worker.ts`.
- Integration sync logs.
- Sync progress polling in the UI.
- Customer and order upsert logic.
- Enriched customer CSV export.
- Standalone Python enrichment tool for deeper local BigCommerce analysis.

Important limitations:

- Direct database sync does not yet fully handle guest customers as first-class customer records.
- Order sync is header-only; order line items are not synced.
- Product, variant, category, fulfillment, refund, and transaction syncs are not yet complete.
- Production worker deployment must be confirmed and likely added to `render.yaml`.
- Store-to-integration matching currently relies too heavily on integration/store names and should be made explicit.

### 2.4 Financial management

Already built:

- Financial dashboard.
- Revenue, COGS, gross profit, gross margin, operating expenses, operating income, EBITDA, adjusted EBITDA, cash, AR, AP, and working capital views.
- Division and period filters.
- Budgets.
- Adjustments.
- Monthly close workflows.
- CSV and XLSX exports.
- QuickBooks P&L-style CSV import.

Important limitations:

- QuickBooks Online API read sync is not yet complete.
- Financial data is currently import-driven or seeded unless live data has been manually loaded.
- Transaction detail, A/R aging, A/P aging, balance sheet, and cash-flow sync are not yet complete.

### 2.5 Marketing and reactivation

Already built:

- Marketing dashboard.
- Campaign records and campaign metrics model.
- Customer reactivation page.
- Reactivation scoring based on LTV, order count, recency, and consent state.
- AI campaign drafting.
- Audience snapshots.
- Campaign approval flow.
- Mailchimp draft/export structure gated by feature flag.

Important limitations:

- The current campaign builder is not yet the full segmented LifeSupply reactivation campaign workflow.
- CASL consent model is not detailed enough for broad campaign deployment.
- Mailchimp unsubscribe, bounce, complaint, subscriber, and campaign metric read syncs need to be completed before live reactivation campaigns.
- Product-category and order-item history are not yet available for proper replenishment and category-specific campaigns.

### 2.6 AI

Already built:

- AI Analyst page.
- Server-side AI calls.
- AI management briefing.
- AI analyst Q&A over dashboard context.
- AI output logging via `AiOutput`.
- Permission-based redaction of financial/customer context.
- AI campaign drafting.
- AI investor/opportunity drafting support.
- Guardrails preventing AI from mutating external systems without future approved workflows.

Important limitations:

- The system is currently an AI analyst/drafting layer, not yet a multi-agent operating system.
- AI agents should not be built until the data foundation, workflows, permissions, and approval systems are more complete.

### 2.7 Supplier automation

Already built:

- Supplier records and supplier dashboard.
- Automation run records.
- Playwright runner abstraction.
- BBM01 mock/live SKU lookup pattern.
- Screenshot evidence metadata.
- Feature flags for supplier automation and supplier order submission.

Important limitations:

- Production supplier portal validation is not complete.
- Durable evidence storage is not complete.
- Supplier order preparation and submission are not production-ready.
- All supplier automation must remain human-in-the-loop.

### 2.8 Strategic modules

Already built:

- Tasks.
- Approvals.
- Reports.
- Investor CRM.
- Capital raises.
- Investor updates.
- Opportunities / M&A.
- Diligence items.

Important limitations:

- These modules need richer live operating and financial data to reach their full usefulness.
- External distribution and sensitive communications must remain approval-gated.

---

## 3. Development principles for all future phases

Claude Code must follow these rules for every phase.

### 3.1 One phase at a time

Do not combine phases. Do not opportunistically add features from later phases. If the requested phase reveals a dependency from a later phase, stop and report it rather than implementing the later phase.

### 3.2 Branch discipline

For each phase:

1. Start from the latest `main`.
2. Create a dedicated branch.
3. Use a clear branch name, for example:
   - `claude/phase-01-worker-production`
   - `claude/phase-02-store-reconciliation`
   - `claude/phase-03-commerce-data-foundation`
4. Commit only changes related to that phase.
5. Push the branch.
6. Open a pull request if the workflow supports PRs, or clearly report the branch name and commit SHA for manual review.

### 3.3 Required verification

Unless a phase is strictly documentation-only, run:

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

If any step fails, fix the issue within the phase scope. If fixing it would require unrelated work, report the blocker clearly.

For documentation-only phases, run at least:

```sh
pnpm format:check
```

when practical. If no local environment is available, state that verification could not be run and explain why.

### 3.4 No unsafe external actions

Do not send emails, submit supplier orders, alter BigCommerce records, alter QuickBooks records, distribute investor materials, or perform any irreversible external action unless all of the following are true:

- A specific approved workflow exists.
- The relevant FeatureFlag is on.
- The user explicitly requested the action.
- An Approval row or equivalent approval is present where required.
- The action is audit logged.

### 3.5 Source-of-truth discipline

- BigCommerce remains the source of truth for e-commerce customers, orders, products, categories, pricing, and fulfillment state.
- QuickBooks remains the accounting source of truth.
- Mailchimp remains the source of truth for email subscription status and campaign activity until replaced.
- GA4 remains the source of truth for web analytics.
- The Command Center normalizes, analyzes, reports, routes workflows, logs decisions, and controls approvals.

### 3.6 Data reconciliation before automation

Do not build advanced AI agents, supplier ordering, broad marketing automation, forecasting, or strategic reporting on top of incomplete or unreconciled data. Data completeness and reconciliation come first.

---

## 4. Phase sequence overview

The required development should proceed in this order:

1. **Phase 1 — Production worker and deployment foundation**
2. **Phase 2 — Store, integration, and sync reconciliation**
3. **Phase 3 — Complete BigCommerce commerce data foundation**
4. **Phase 4 — Customer identity, consent, and Mailchimp suppression sync**
5. **Phase 5 — Full LifeSupply Campaign Builder**
6. **Phase 6 — QuickBooks and GA4 read-only API integrations**
7. **Phase 7 — Supplier automation production hardening**
8. **Phase 8 — Operations, fulfillment, and customer-service workflow depth**
9. **Phase 9 — Management reporting, forecasting, and scenario planning**
10. **Phase 10 — Phase 3 AI agent operating layer**

Phase 1 is the immediate next phase.

---

# Phase 1 — Production worker and deployment foundation

## Objective

Make the existing Inngest background worker operational in production so existing BigCommerce customer and order synchronization jobs can run reliably outside the web request lifecycle.

## Why this phase matters

The app already has customer and order sync buttons and Inngest functions, but if the worker is not deployed, sync events may be dispatched without being processed. This must be fixed before building more synchronization depth.

## Scope

Inspect and update as needed:

- `src/worker.ts`
- `src/server/inngest/client.ts`
- `src/server/inngest/functions/bigcommerce/sync-customers.ts`
- `src/server/inngest/functions/bigcommerce/sync-orders.ts`
- `src/server/services/sync/bigcommerce-dispatch.ts`
- `render.yaml`
- `Dockerfile`
- `.env.example`
- `docs/DEPLOYMENT_RENDER.md`
- `docs/OPS_RUNBOOK.md`
- `package.json`

## Required work

1. Confirm how the web app dispatches Inngest events.
2. Confirm which environment variables are needed by the web service and worker.
3. Add a dedicated Render Background Worker to `render.yaml` if missing.
4. Ensure the worker uses the same Docker image as the web service.
5. Ensure the worker command is `pnpm worker`.
6. Ensure required variables are documented and not hardcoded:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `MASTER_ENCRYPTION_KEY`
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`
   - `NODE_ENV=production`
   - `NEXT_TELEMETRY_DISABLED=1`
7. Ensure the web service has any Inngest variables required to dispatch events.
8. Update deployment documentation to explain how to configure Inngest Connect.
9. Add post-deployment verification instructions.
10. Add troubleshooting instructions for worker failures.

## Do not do in this phase

- Do not add product sync.
- Do not add order-item sync.
- Do not add scheduled syncs unless strictly required for worker verification.
- Do not change customer/order sync business logic unless needed to make existing jobs execute.
- Do not add AI agents.
- Do not add marketing campaign features.

## Acceptance criteria

Phase 1 is complete when:

- `render.yaml` defines a dedicated worker service, or documentation clearly proves the worker is already provisioned elsewhere.
- Worker environment variables are documented.
- The web service can dispatch Inngest events.
- The worker can register functions through Inngest Connect.
- Deployment docs explain how to confirm worker connectivity.
- Ops docs explain how to troubleshoot stalled sync jobs.
- Manual incremental customer sync can be dispatched and processed in a deployed environment.
- Integration sync logs move from `running` to `success`, `partial`, or `failed` rather than hanging silently.

## Claude Code prompt for Phase 1

```text
Run Phase 1 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: productionize the existing Inngest background worker and Render deployment foundation. Stay strictly within Phase 1 scope. Do not add new BigCommerce sync entities, campaign features, AI agents, supplier order automation, or scheduled jobs unless required only to verify the existing worker.

Start by reading:
- CLAUDE.md
- docs/19_CURRENT_DEVELOPMENT_ROADMAP.md
- src/worker.ts
- src/server/inngest/client.ts
- src/server/inngest/functions/bigcommerce/sync-customers.ts
- src/server/inngest/functions/bigcommerce/sync-orders.ts
- src/server/services/sync/bigcommerce-dispatch.ts
- render.yaml
- docs/DEPLOYMENT_RENDER.md
- docs/OPS_RUNBOOK.md
- .env.example
- package.json

Create a dedicated branch named claude/phase-01-worker-production.

Implement only the changes needed to make the existing worker deployable and verifiable in production. Update docs and environment examples. Run the required verification commands. Commit and push the branch. Report changed files, test results, deployment steps, and remaining risks.
```

---

# Phase 2 — Store, integration, and sync reconciliation

## Objective

Confirm and harden the mapping between LifeSupply's three BigCommerce stores and the Command Center's Store and IntegrationConnection records.

## Why this phase matters

The system cannot safely sync or report across three stores unless each BigCommerce connection maps explicitly and reliably to the correct store and division.

## Scope

Likely files:

- `prisma/schema.prisma`
- Prisma migrations
- seed files under `prisma/seed/`
- `src/server/services/integrations/`
- `src/server/services/stores/`
- `src/server/services/sync/bigcommerce-dispatch.ts`
- admin integration pages
- admin store pages
- tests for integration/store mapping
- docs and runbooks

## Required work

1. Review current store records and default BigCommerce integration names.
2. Replace fragile name-based store matching with an explicit mapping.
3. Prefer adding `storeId` to `IntegrationConnection` if that fits the current schema; otherwise create a mapping table.
4. Update admin UI so each BigCommerce integration clearly displays its mapped Store.
5. Prevent sync dispatch for unmapped or incorrectly mapped BigCommerce integrations.
6. Add validation and clear error messages.
7. Add tests for mapping behavior.
8. Add a reconciliation screen or admin summary if practical.
9. Update docs with how to configure the three stores.

## Do not do in this phase

- Do not add new sync entities.
- Do not add product or order-item sync yet.
- Do not change marketing logic.
- Do not introduce broad refactors unrelated to store/integration mapping.

## Acceptance criteria

- Each BigCommerce integration maps explicitly to one Store.
- Store mapping does not depend on display-name matching.
- Sync dispatch skips unmapped integrations with clear operator-facing errors.
- Admin UI makes the mapping visible.
- Tests cover correct mapping, missing mapping, and wrong integration type.

## Claude Code prompt for Phase 2

```text
Run Phase 2 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: harden the mapping between BigCommerce integrations and Store records for the three LifeSupply stores. Stay strictly within Phase 2 scope. Do not add product sync, order-item sync, guest customer logic, marketing automation, or AI agents.

Start by reading CLAUDE.md and docs/19_CURRENT_DEVELOPMENT_ROADMAP.md, then inspect the current Prisma schema, integration services, store services, sync dispatcher, admin integration UI, seed data, and tests.

Create a dedicated branch named claude/phase-02-store-integration-mapping.

Implement explicit store-to-integration mapping, update admin UI and docs, add tests, run verification, commit, and push. Report changed files, migration notes, test results, and manual setup steps for mapping LifeSupply.ca, WellmartMedical.com, and Balkowitsch Worldwide.
```

---

# Phase 3 — Complete BigCommerce commerce data foundation

## Objective

Complete the core BigCommerce data model and sync engine so the Command Center has reliable customer, guest customer, order, order-item, product, variant, category, fulfillment, refund, and transaction data.

## Why this phase matters

Marketing, margin analysis, customer reactivation, supplier workflows, fulfillment automation, and product intelligence all depend on complete commerce data. Current order sync is header-only, which is not enough.

## Recommended sub-phases

This phase is large. Claude may break it into smaller pull requests if needed, but each pull request must remain within Phase 3.

### Phase 3A — Guest customer identity

- Create or update customer records for guest checkouts using normalized billing email.
- Deduplicate guest records against registered customers.
- Link guest orders to customer records where appropriate.
- Preserve source metadata.
- Add tests.

### Phase 3B — Order items

- Sync order products/items from BigCommerce.
- Upsert `OrderItem` records.
- Link to Product/ProductVariant where possible.
- Preserve raw BigCommerce IDs in metadata.
- Handle deleted/refunded/cancelled item states as available.
- Add tests.

### Phase 3C — Products, variants, and categories

- Sync products.
- Sync variants.
- Sync categories and hierarchy.
- Sync image and description quality signals.
- Sync price, sale price, SKU, brand, status, and inventory where available.
- Add Products page sync controls or automation hooks.
- Add tests.

### Phase 3D — Fulfillments, refunds, and transactions

- Sync shipment/fulfillment status and tracking references.
- Sync refunds and payment transaction information to the level required for reporting.
- Improve order status mapping where necessary.
- Add tests.

### Phase 3E — Reconciliation

- Build reconciliation reports comparing Command Center totals to BigCommerce totals by store and date range.
- Track counts for customers, orders, order items, revenue, refunds, and products.
- Create exceptions for material discrepancies.

## Do not do in this phase

- Do not build the full campaign builder.
- Do not build QuickBooks API sync.
- Do not build AI agents.
- Do not enable external write-backs.
- Do not submit supplier orders.

## Acceptance criteria

- BigCommerce data can be synced with enough depth to support product/category marketing and margin analysis.
- Guest checkout buyers are visible in the customer database.
- Order items exist and link to orders.
- Products, variants, and categories are available for analysis.
- Fulfillment/refund signals are available where BigCommerce provides them.
- Reconciliation reporting identifies gaps instead of hiding them.

## Claude Code prompt for Phase 3

```text
Run Phase 3 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: complete the BigCommerce commerce data foundation. This phase may be split into sub-PRs if needed, but stay strictly within Phase 3. Do not build marketing campaign automation, QuickBooks API sync, AI agents, or supplier order submission.

Start by reading CLAUDE.md and docs/19_CURRENT_DEVELOPMENT_ROADMAP.md. Then inspect current BigCommerce sync code, customer/order models, Product/ProductVariant/Category/OrderItem schema, existing imports, tests, and UI dependencies.

Create a dedicated branch named claude/phase-03-bigcommerce-commerce-data.

Implement guest customer handling, order-item sync, product/variant/category sync, fulfillment/refund/transaction sync as appropriate, and reconciliation reporting. Add migrations, tests, docs, and UI updates needed to operate the sync safely. Run verification, commit, and push. Report any BigCommerce endpoint limits or follow-up tasks clearly.
```

---

# Phase 4 — Customer identity, consent, and Mailchimp suppression sync

## Objective

Build a marketing-safe customer identity and consent layer before launching broad customer reactivation campaigns.

## Why this phase matters

LifeSupply has a large historical customer base. The commercial opportunity is significant, but marketing must be governed carefully, especially for Canadian CASL compliance and suppression handling.

## Scope

- Customer identity and deduplication.
- Consent model expansion.
- Mailchimp subscriber/suppression sync.
- Consent audit trail.
- Campaign eligibility snapshots.

## Required work

1. Expand customer/marketing contact models to distinguish:
   - Express consent
   - Implied consent
   - Transactional-only status
   - Unknown consent
   - Unsubscribed
   - Cleaned/bounced
   - Spam complaint
   - Consent source
   - Consent obtained date
   - Consent expiry date
   - Suppression reason
2. Add Mailchimp read sync for:
   - Subscribers
   - Unsubscribes
   - Cleaned/bounced contacts
   - Abuse complaints if available
   - Tags and merge fields where useful
3. Add suppression logic that campaigns must respect.
4. Add customer identity matching and duplicate handling where feasible.
5. Add consent review UI or reporting.
6. Ensure reactivation candidates exclude ineligible contacts.
7. Add tests for eligibility logic.

## Do not do in this phase

- Do not send campaigns.
- Do not build the full campaign builder yet.
- Do not use SMS unless a future phase explicitly covers it.
- Do not assume CASL eligibility without documented evidence fields.

## Acceptance criteria

- The app can explain why a customer is eligible or suppressed for marketing.
- Mailchimp suppression data is imported into the Command Center.
- Reactivation candidate lists respect suppression and consent status.
- Campaigns cannot be approved without an eligibility snapshot.
- Consent-related changes are auditable.

## Claude Code prompt for Phase 4

```text
Run Phase 4 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: build the customer identity, consent, suppression, and Mailchimp read-sync layer required before broad customer reactivation campaigns. Stay strictly within Phase 4 scope. Do not send campaigns, do not build the full Campaign Builder, and do not add HighLevel or SMS workflows.

Create a branch named claude/phase-04-consent-mailchimp-sync.

Review current Customer, MarketingContact, Campaign, CustomerSegment, Mailchimp client, reactivation logic, permissions, feature flags, and audit logging. Implement a safer consent/suppression model, Mailchimp subscriber/suppression read sync, eligibility logic, UI/reporting for consent status, and tests. Run verification, commit, and push. Report legal/compliance assumptions clearly and flag anything requiring human CASL review.
```

---

# Phase 5 — Full LifeSupply Campaign Builder

## Objective

Turn the LifeSupply customer reactivation marketing plan into a structured, approval-based Campaign Builder inside the Command Center.

## Required campaign streams

- Recent buyers: 0–90 days
- Warm/lapsing buyers: 91–365 days
- 366–730 day buyers after consent review
- B2B / institutional account outreach
- High-value customer manual workflow
- Dormant/no-purchase suppression and research

## Required workflow sections

1. Campaign objective
2. Data source and segment selection
3. Data cleanup and suppression review
4. Consent eligibility review
5. Audience stream selection
6. Product/category selection
7. Offer strategy
8. Consumer email sequence
9. B2B email sequence
10. High-value account outreach tasks
11. Calendar and sequencing
12. Approval review
13. Mailchimp draft/export
14. Performance tracking

## Do not do in this phase

- Do not send campaigns automatically.
- Do not bypass approval.
- Do not introduce SMS or HighLevel unless the product owner explicitly makes that a separate phase.
- Do not treat unknown consent as eligible.

## Acceptance criteria

- The campaign builder can create the LifeSupply Customer Reactivation & Replenishment Campaign as a structured campaign record.
- Campaign audience snapshots include eligibility and suppression reasoning.
- B2B and consumer workflows are separated.
- High-value accounts become tasks/opportunities rather than generic blasts.
- Mailchimp export remains draft-only and approval-gated.
- Performance metrics can be imported or manually loaded.

## Claude Code prompt for Phase 5

```text
Run Phase 5 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: build the full LifeSupply Campaign Builder for customer reactivation and replenishment. Stay strictly within Phase 5 scope. Do not add SMS, HighLevel, AI agents, or auto-send behavior. Campaigns must remain approval-gated and draft/export-only.

Create a branch named claude/phase-05-campaign-builder.

Review the marketing plan in docs/19, existing Marketing, Campaign, Reactivation, CustomerSegment, Approval, Mailchimp, and AiOutput code. Implement the multi-step Campaign Builder workflow, the six campaign streams, consumer/B2B/high-value logic, offer strategy, approval checks, Mailchimp draft/export integration, and campaign performance tracking hooks. Add tests and docs. Run verification, commit, and push.
```

---

# Phase 6 — QuickBooks and GA4 read-only API integrations

## Objective

Replace or supplement CSV/import-driven financial and analytics data with read-only scheduled API integrations.

## Scope

### QuickBooks Online

- OAuth connection flow.
- Token storage and refresh.
- Read-only P&L pull.
- Balance sheet data.
- Cash flow where available.
- A/R and A/P aging.
- Class/location/division mapping.
- Source references and import logs.

### GA4

- Service account or OAuth configuration.
- Daily metric ingestion by store/property.
- Users, sessions, page views, product views, add-to-carts, checkouts, purchases, revenue, source/medium, campaign attribution.
- Store/property mapping.
- Sync logs and error handling.

## Do not do in this phase

- Do not write to QuickBooks.
- Do not alter accounting records.
- Do not build forecasting yet.
- Do not send investor reports automatically.

## Acceptance criteria

- QuickBooks and GA4 credentials can be configured safely.
- Read-only sync jobs populate existing financial and website metric tables or carefully expanded models.
- Sync logs and audit logs are created.
- Imported data can be reconciled and traced to source periods/properties.

## Claude Code prompt for Phase 6

```text
Run Phase 6 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: add read-only QuickBooks Online and GA4 API integrations. Stay strictly within Phase 6 scope. Do not build forecasting, do not write back to QuickBooks, and do not distribute reports externally.

Create a branch named claude/phase-06-qbo-ga4-read-sync.

Review existing financial import services, financial dashboards, analytics service, integration credential handling, sync logs, feature flags, and docs. Implement read-only API syncs with safe credential handling, source references, error handling, sync logs, tests, and documentation. Run verification, commit, and push.
```

---

# Phase 7 — Supplier automation production hardening

## Objective

Move supplier automation from prototype/mock-assisted workflows toward safe production read-only workflows, starting with BBM01.

## Required work

1. Validate BBM01 portal selectors against the real portal.
2. Keep workflows read-only initially: price checks, stock checks, SKU checks.
3. Add durable evidence storage for screenshots and artifacts.
4. Add comparison rules between supplier portal values and Command Center records.
5. Create exceptions for price, stock, SKU, tax, address, shipping, or product mismatches.
6. Improve automation run UI for operators.
7. Keep supplier order submission disabled unless a later explicit phase approves it.

## Do not do in this phase

- Do not submit supplier orders.
- Do not store supplier credentials in code or logs.
- Do not run automation in browser requests if it should run in the worker.
- Do not bypass supplier portal terms or security controls.

## Acceptance criteria

- Read-only supplier checks run in a controlled server-side/worker environment.
- Evidence is durable and reviewable.
- Automation failures create clear exceptions.
- Feature flags control all supplier automation.

## Claude Code prompt for Phase 7

```text
Run Phase 7 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: harden supplier automation for read-only production checks, starting with BBM01. Stay strictly within Phase 7 scope. Do not submit supplier orders or build fully autonomous ordering.

Create a branch named claude/phase-07-supplier-readonly-hardening.

Review supplier automation services, Playwright runner, BBM01 automation, feature flags, approval services, automation run UI, evidence models, and docs. Implement production-safe read-only checks, durable evidence storage, exception generation, operator UI improvements, tests, and docs. Run verification, commit, and push.
```

---

# Phase 8 — Operations, fulfillment, and customer-service workflow depth

## Objective

Turn synced commerce data into better daily operating workflows for orders, fulfillment, customer service, and management follow-up.

## Required work

- Order detail page improvements.
- Fulfillment status timeline.
- Delayed order rules.
- Customer service task creation.
- Supplier follow-up tasks.
- Exception lifecycle improvements.
- Saved views for operations queues.
- Bulk task creation where safe.
- Customer 360 improvements.
- Internal communication summaries.

## Do not do in this phase

- Do not add autonomous customer replies.
- Do not submit supplier orders.
- Do not add AI agents except limited draft/summarize functions that follow existing AI guardrails.

## Acceptance criteria

- Operations team can see what needs attention and why.
- Delays and exceptions are routed to tasks.
- Customer/order history is usable for support.
- Management has a reliable daily operations workflow.

## Claude Code prompt for Phase 8

```text
Run Phase 8 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: deepen operations, fulfillment, and customer-service workflows using the completed commerce data foundation. Stay strictly within Phase 8 scope. Do not add autonomous customer communications, supplier order submission, or broad AI agents.

Create a branch named claude/phase-08-operations-workflows.

Review Operations, Orders, Customers, Tasks, Exceptions, Suppliers, and Automation modules. Implement practical workflow depth: order detail improvements, fulfillment timelines, delayed order rules, exception lifecycle improvements, customer-service task creation, saved views, and management summaries. Add tests and docs. Run verification, commit, and push.
```

---

# Phase 9 — Management reporting, forecasting, and scenario planning

## Objective

Build advanced management reporting and forecasting only after source data is trusted.

## Required work

- Monthly management report improvements.
- Board report generation.
- Investor/lender package generation.
- Revenue forecasting.
- Gross-margin forecasting.
- Cash and working-capital scenarios.
- Customer reactivation scenarios.
- Marketing ROI scenarios.
- Supplier cost scenarios.
- Financing and acquisition scenario support.

## Do not do in this phase

- Do not distribute investor reports automatically.
- Do not treat forecasts as facts.
- Do not allow AI commentary without source data and assumptions.

## Acceptance criteria

- Forecasts clearly identify inputs, assumptions, and limitations.
- Management reports are approval-gated where appropriate.
- Reports cite source periods and data freshness.
- Scenario outputs can be exported.

## Claude Code prompt for Phase 9

```text
Run Phase 9 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: build advanced management reporting, forecasting, and scenario planning on top of trusted synced data. Stay strictly within Phase 9 scope. Do not distribute investor materials automatically and do not create AI agents that execute actions.

Create a branch named claude/phase-09-reporting-forecasting.

Review financials, reports, investors, opportunities, AI outputs, feature flags, and export services. Implement forecasting/scenario planning with assumptions, approval controls, exports, source references, tests, and docs. Run verification, commit, and push.
```

---

# Phase 10 — Phase 3 AI agent operating layer

## Objective

Introduce specialized AI agents only after the data foundation, workflow layer, approvals, and reporting are stable.

## Recommended initial agents

- Management Briefing Agent
- Marketing Analyst Agent
- Product and Margin Agent
- Fulfillment Exception Agent
- Customer Service Drafting Agent
- Accounting Close Assistant
- Investor Reporting Agent
- Strategic Opportunity Agent
- Governance / Approval Guardrail Agent

## Required architecture

- Agent registry.
- Tool registry.
- Agent run model.
- Structured output schemas.
- Source references.
- Permission checks.
- Approval routing.
- Audit logs.
- Evaluation tests.
- Feature flags for any action-taking behavior.

## Do not do in this phase

- Do not allow AI to send customer communications without approval.
- Do not allow AI to submit supplier orders.
- Do not allow AI to change product prices.
- Do not allow AI to post QuickBooks entries.
- Do not allow AI to distribute investor materials.

## Acceptance criteria

- Agents can read, analyze, draft, classify, and recommend.
- Any mutation or external action requires explicit permission, feature flag, approval, and audit log.
- Agent outputs include source references, assumptions, and confidence or limitations where practical.
- Tests prove guardrails are enforced.

## Claude Code prompt for Phase 10

```text
Run Phase 10 from docs/19_CURRENT_DEVELOPMENT_ROADMAP.md.

Objective: add the Phase 3 AI agent operating layer in a controlled, approval-gated manner. Stay strictly within Phase 10 scope. Do not create autonomous external actions. Agents may read, analyze, draft, classify, recommend, and create proposed internal tasks only where permitted.

Create a branch named claude/phase-10-ai-agent-layer.

Review AI services, permissions, feature flags, tasks, approvals, reports, marketing, operations, finance, investor modules, and docs/09. Design and implement an agent registry, tool registry, agent run model, structured outputs, source references, guardrails, tests, and UI surfaces. Ensure every proposed mutation passes through permission checks, feature flags, approvals, and audit logs. Run verification, commit, and push.
```

---

## 5. Current immediate next action

The next phase to run is:

```text
Phase 1 — Production worker and deployment foundation
```

Do not start with marketing, AI agents, supplier ordering, forecasting, or QuickBooks API sync until Phase 1 is complete and verified.

---

## 6. Completion reporting template for Claude Code

At the end of every phase, Claude Code must report in this format:

```text
Phase completed: <phase name>
Branch: <branch name>
Commit(s): <commit SHA(s)>
Pushed: yes/no
Pull request: <URL or n/a>

Summary:
- <what changed>
- <what changed>
- <what changed>

Files changed:
- <path> — <why>
- <path> — <why>

Verification:
- pnpm typecheck: pass/fail/not run
- pnpm lint: pass/fail/not run
- pnpm format:check: pass/fail/not run
- pnpm test: pass/fail/not run
- pnpm build: pass/fail/not run

Manual steps required:
- <step>
- <step>

Risks / follow-ups:
- <item>
- <item>

Recommended next phase:
- <phase number and name>
```

If a phase cannot be completed, Claude must stop and report the blocker rather than expanding scope.

---

## 7. Non-negotiable sequencing reminders

- Worker deployment before deeper sync.
- Store mapping before multi-store reconciliation.
- Complete BigCommerce data before campaign automation.
- Consent and suppression before marketing sends.
- QuickBooks read sync before advanced financial forecasting.
- Supplier read-only validation before supplier order submission.
- Workflow maturity before AI agents.

This sequencing exists to protect data integrity, customer privacy, financial accuracy, and management confidence in the Command Center.
