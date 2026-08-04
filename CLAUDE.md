# CLAUDE.md — LifeSupply Command Center

**Project:** LifeSupply Command Center  
**Document status:** Current Claude Code project memory and development control file  
**Originally prepared:** May 9, 2026  
**Last updated:** August 3, 2026  
**Primary audience:** Claude Code, Codex, developers, technical leads, product owner

---

## 1. Project Identity

LifeSupply Command Center is a secure, desktop-first web application for management information, operations control, financial reporting, AI-assisted analysis, workflow management, supplier automation, marketing intelligence, investor reporting, and strategic growth execution across the LifeSupply operating platform.

The application is not intended to be a generic dashboard. It is intended to become the internal management control layer for LifeSupply, Wellmart Medical, U.S. operations, supplier relationships, customer reactivation, financial reporting, capital raising, lender reporting, investor communications, and future M&A initiatives.

The system should help management aggregate fragmented business information, understand performance, identify exceptions, assign tasks, produce reports, automate repetitive workflows safely, and use AI to increase management capacity without adding unnecessary operating overhead.

---

## 2. Current Development Control Plan — READ FIRST

Before doing any additional development, read the current roadmap:

```text
docs/19_CURRENT_DEVELOPMENT_ROADMAP.md
```

That document is the active phase-by-phase development plan as of August 2026. It reflects the current codebase state and supersedes any older generic sequencing where there is a conflict.

The immediate next phase is:

```text
Phase 1 — Production worker and deployment foundation
```

Do not jump ahead to marketing automation, AI agents, forecasting, supplier order submission, or advanced financial integrations until the earlier phases have been completed or explicitly skipped by the product owner.

Claude Code must run **one phase at a time**. When the product owner asks for a phase, use only the instructions for that phase from `docs/19_CURRENT_DEVELOPMENT_ROADMAP.md`.

---

## 3. Operating Context

The LifeSupply platform includes, or may include, the following business areas:

- **LifeSupply.ca** — B2B / institutional / clinic-facing medical supply platform.
- **WellmartMedical.com** — retail / consumer / dropship-focused BigCommerce storefront.
- **LifeSupply U.S. operations** — including Balkowitsch-related U.S. operations and Amazon/e-commerce sales channels where applicable.
- **Supplier network** — including Best Buy Medical and potentially many additional suppliers/distributors.
- **Customer database** — including historical, current, lapsed, B2B, clinic, retail, high-value, and guest checkout customers.
- **Financial reporting layer** — QuickBooks Online and/or controlled QuickBooks exports by entity.
- **Marketing layer** — Mailchimp, customer reactivation, campaign tracking, Google Analytics 4, Search Console, social media planning, and possible future CRM/campaign channels.
- **AI layer** — OpenAI API and Anthropic Claude API for summaries, reports, analysis, campaign drafting, product optimization, and management recommendations.
- **Automation layer** — browser automation / RPA / Playwright for suppliers that do not provide APIs.

Known working assumptions to validate during implementation:

- WellmartMedical.com is the retail/dropship storefront.
- LifeSupply.ca is the B2B/institutional portal.
- U.S. / Balkowitsch-related operations may be represented as a third BigCommerce store.
- BBM01 / Best Buy Medical may be a primary supplier in the initial retail/dropship workflow.
- BigCommerce is the major e-commerce source system.
- QuickBooks is the accounting source of truth.
- Mailchimp is the current email subscription and campaign system unless replaced or supplemented.
- The Command Center is the normalized management data hub, reporting layer, workflow layer, and AI analysis layer.

---

## 4. Primary Goal

Build a secure, role-based management platform that allows LifeSupply management to:

1. See granular daily operating data.
2. Review financial performance across divisions, stores, entities, geographies, and channels.
3. Track customers, guest buyers, orders, order items, products, suppliers, margins, fulfillments, refunds, and exceptions.
4. Improve product/catalog quality and marketing execution.
5. Reactivate customers and manage B2B/institutional accounts in a compliant, segmented, approval-based manner.
6. Automate repetitive order, supplier, and reporting workflows where appropriate.
7. Generate management, board, investor, and lender-ready reports.
8. Use OpenAI and Claude APIs to analyze data, summarize performance, draft reports, and recommend actions.
9. Support future capital raising, acquisitions, investor relations, and M&A opportunity tracking.

---

## 5. Required Stack — Default Technical Direction

Use this stack unless the product owner explicitly changes direction:

- **Framework:** Next.js / React / TypeScript
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui / internal component library
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Auth.js / NextAuth as currently implemented
- **Background jobs:** Inngest and worker process as currently implemented
- **Browser automation:** Playwright
- **AI APIs:** OpenAI API and Anthropic Claude API through secure server-side wrappers
- **Reporting:** Server-side PDF generation plus CSV/XLSX exports
- **File storage:** Add cloud storage such as S3, Cloudflare R2, Supabase Storage, or equivalent when durable evidence/report storage is needed
- **Hosting:** Render is currently preferred for web + database + cron + worker because Playwright and long-running jobs fit better there; Vercel remains an alternate for web-only deployment
- **Observability:** Structured logs, sync logs, audit logs, exceptions, and future error tracking

---

## 6. Required Documents to Read First

Before making architecture or implementation decisions, read the documents relevant to the requested phase.

Always read:

1. `CLAUDE.md`
2. `docs/19_CURRENT_DEVELOPMENT_ROADMAP.md`

For foundational context, read as needed:

1. `docs/01_PROJECT_OVERVIEW.md`
2. `docs/02_PRODUCT_REQUIREMENTS_DOCUMENT.md`
3. `docs/03_TECHNICAL_ARCHITECTURE.md`
4. `docs/04_DATABASE_SCHEMA.md`
5. `docs/05_INTEGRATION_MAP.md`
6. `docs/06_SECURITY_AND_PERMISSIONS.md`
7. `docs/07_MVP_IMPLEMENTATION_PLAN.md`
8. `docs/08_UI_UX_SPECIFICATION.md`

For post-MVP work, read the relevant Batch 2 document before coding:

1. `docs/09_AI_FEATURES_AND_GUARDRAILS.md`
2. `docs/10_BROWSER_AUTOMATION_AND_SUPPLIER_WORKFLOWS.md`
3. `docs/11_REPORTING_REQUIREMENTS.md`
4. `docs/12_FINANCIAL_MANAGEMENT_REQUIREMENTS.md`
5. `docs/13_DATA_GOVERNANCE_AND_AUDIT_LOGGING.md`
6. `docs/14_DEVELOPMENT_STANDARDS.md`
7. `docs/15_TESTING_AND_QA_PLAN.md`
8. `docs/16_DEPLOYMENT_AND_ENVIRONMENT.md`
9. `docs/17_PHASE_2_AUTOMATION_PLAN.md`
10. `docs/18_PHASE_3_STRATEGIC_GROWTH_PLAN.md`

Do not proceed with major code generation until the relevant documents have been reviewed and summarized.

---

## 7. Current Codebase Status Summary

As of August 2026, the app is best described as an **advanced MVP / early post-MVP platform**.

Already built in meaningful form:

- Authentication and role-based access.
- Permission-gated application shell and navigation.
- Executive Dashboard.
- Operations Control Center.
- Customers module.
- Orders module.
- Products & Catalog module.
- Suppliers module.
- Financial dashboards, budgets, adjustments, and monthly close workflows.
- Marketing dashboard and reactivation scoring.
- AI Analyst and AI briefing/drafting services.
- Reports module.
- Tasks and Approvals modules.
- Investor Relations, Capital Raises, Investor Updates.
- M&A / Opportunities and diligence tracking.
- Automation Center.
- BigCommerce full/incremental customer sync foundation.
- BigCommerce full/incremental order header sync foundation.
- Inngest worker code.
- BigCommerce enriched customer CSV export.
- Supplier automation prototype/read-only foundation.
- Audit logs, feature flags, and kill switches.
- CI, Docker, Render, and Vercel configuration.

Important gaps still to complete:

- Production worker deployment and verification.
- Explicit store-to-integration mapping.
- Guest customer identity and guest order linking.
- BigCommerce order item sync.
- BigCommerce product, variant, and category sync.
- BigCommerce fulfillment, refund, and transaction sync.
- Reconciliation against BigCommerce source totals.
- Pagination and scale improvements for large customer/order tables.
- Stronger CASL-safe consent model.
- Mailchimp subscriber/suppression/metrics read sync.
- Full Campaign Builder for LifeSupply customer reactivation.
- QuickBooks Online read-only API sync.
- GA4 read-only API sync.
- Production supplier automation hardening.
- Forecasting and scenario planning.
- Phase 3 AI agent operating layer.

Use `docs/19_CURRENT_DEVELOPMENT_ROADMAP.md` for the full breakdown.

---

## 8. Development Rules

### General

- Build incrementally.
- Prefer working, tested, narrow slices over broad unfinished scaffolding.
- Run only the requested phase unless the product owner explicitly changes scope.
- Keep architecture modular so later integrations and automation can be added without rewriting the application.
- Use clear naming that reflects the business domain: divisions, stores, customers, products, suppliers, orders, financial periods, campaigns, opportunities, tasks, reports.
- Do not add new modules merely because they were mentioned in the original vision; first complete the current data foundation and phase sequence.

### Branch and git workflow

For each phase:

1. Start from current `main`.
2. Create a dedicated branch.
3. Use a clear branch name, for example `claude/phase-01-worker-production`.
4. Commit only phase-related changes.
5. Push the branch to GitHub.
6. Open a pull request if possible, or report branch and commit SHA for manual review.

Do not edit multiple unrelated areas in the same phase. Do not let two agents edit the same branch or same files concurrently.

### Verification

For code phases, run:

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

If a command fails, fix the failure within the phase scope. If the fix is out of scope, stop and report the blocker clearly.

### Security

- Never hardcode API keys.
- Never commit `.env` files containing real credentials.
- Store API credentials using environment variables or encrypted vault support.
- Protect all API routes server-side.
- Enforce role-based permissions on both UI and API layers.
- Log sensitive actions.
- Use approval workflows for destructive or external actions.

### Financial data

- Treat QuickBooks as the accounting source of truth.
- Treat the Command Center as the management reporting, analytics, normalization, and workflow layer.
- Do not create accounting entries or alter QuickBooks records without explicit approval workflows.
- Support imports from QuickBooks exports where direct API access is not yet configured.
- Preserve source references, import timestamps, and versioning for financial data.

### E-commerce data

- Treat BigCommerce as the source of truth for store orders, products, categories, pricing, customer records, and fulfillment states.
- Normalize BigCommerce data into the Command Center database for reporting, workflows, analysis, and AI use.
- Do not push product, price, customer, or fulfillment updates back to BigCommerce without approval controls, FeatureFlag gating, and audit logs.

### Supplier automation

- Begin with human-in-the-loop automation.
- Do not place supplier orders fully autonomously until the workflow has passed staged testing and management approval.
- For supplier portals, implement secure credential handling, robust logging, screenshots/evidence capture, and exception handling.
- Pause workflows when price, stock, SKU, address, tax, shipping, or product data does not match expectations.

### AI usage

- AI may summarize, classify, draft, recommend, analyze, and explain.
- AI must not execute sensitive actions without approval.
- AI must not send customer communications, alter product prices, place supplier orders, update financial records, or export/distribute sensitive data unless an approved workflow permits it.
- Log AI prompts, outputs, model used, user, timestamp, source data references, and approval status where relevant.
- Clearly distinguish facts, assumptions, limitations, and recommendations in AI-generated management content.
- Use server-side model wrappers. Do not expose OpenAI or Claude API keys in client-side code.

---

## 9. Active Phase Sequence

Follow the phase sequence in `docs/19_CURRENT_DEVELOPMENT_ROADMAP.md`:

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

Non-negotiable sequencing reminders:

- Worker deployment before deeper sync.
- Store mapping before multi-store reconciliation.
- Complete BigCommerce data before campaign automation.
- Consent and suppression before marketing sends.
- QuickBooks read sync before advanced financial forecasting.
- Supplier read-only validation before supplier order submission.
- Workflow maturity before AI agents.

---

## 10. Original MVP Definition

The MVP was successful when the application could:

- Authenticate users.
- Enforce role-based access.
- Present a professional desktop dashboard.
- Store normalized records for divisions, stores, customers, products, orders, suppliers, financial summaries, campaigns, tasks, reports, and integration logs.
- Display executive-level operating and financial KPIs.
- Connect to BigCommerce or ingest representative BigCommerce exports.
- Connect to QuickBooks or ingest controlled QuickBooks exports.
- Display Mailchimp/customer reactivation and GA4 analytics placeholders or initial data.
- Generate a daily AI management briefing from available internal data.
- Create and assign tasks linked to operating exceptions.
- Export a basic management report.

The repository has moved beyond this MVP definition. Future work must follow the active phase sequence above.

---

## 11. Non-Negotiable Principles

- Security first.
- Financial data integrity first.
- Customer privacy and consent first.
- Human approval before external action.
- Audit logs for material actions.
- Modular architecture.
- Source-of-truth clarity.
- Practical management usefulness over unnecessary technical complexity.
- Desktop-first UI.
- AI-assisted, not AI-controlled.
- Data reconciliation before automation.
- Build for future capital raising, M&A, and shareholder value reporting, but do not overbuild strategic features before operating data is trusted.

---

## 12. Source-of-Truth Map

| Domain | Source of Truth | Command Center role |
|---|---|---|
| Accounting / financial records | **QuickBooks Online** | Import/sync, normalize, summarize, comment, version |
| E-commerce customers / orders / products | **BigCommerce** | Import/sync, monitor, exception-tag, route to workflows |
| Email subscription + campaign metrics | **Mailchimp** | Import/sync, segment, suppress, draft, approval-gate sends |
| Website analytics | **GA4** | Import/sync, dashboard, attribute |
| Supplier prices + stock + portal data | **Supplier portals** | Capture snapshots via human-in-the-loop automation |
| Tasks, approvals, exceptions, AI outputs, reports | **Command Center** | Primary source |
| Investors, opportunities, M&A targets | **Command Center** | Primary source unless replaced by external CRM |

Never write back to a source-of-truth system without an Approval row, relevant FeatureFlag enabled, server-side permission check, and audit log entry.

---

## 13. Phase Completion Report Format

At the end of every phase, report:

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

If a phase cannot be completed, stop and report the blocker rather than expanding scope.
