# CLAUDE.md — LifeSupply Command Center

**Project:** LifeSupply Command Center  
**Document status:** Initial Claude Code project memory  
**Prepared:** May 9, 2026  
**Primary audience:** Claude Code, developers, technical leads, product owner

---

## 1. Project Identity

LifeSupply Command Center is a secure, desktop-first web application for management information, operations control, financial reporting, AI-assisted analysis, workflow management, supplier automation, marketing intelligence, investor reporting, and strategic growth execution across the LifeSupply operating platform.

The application is not intended to be a generic dashboard. It is intended to become the internal management control layer for LifeSupply, Wellmart Medical, U.S. operations, supplier relationships, customer reactivation, financial reporting, and future capital/M&A initiatives.

The system should help management aggregate fragmented business information, understand performance, identify exceptions, assign tasks, produce reports, automate repetitive workflows, and use AI to increase management capacity without adding unnecessary operating overhead.

---

## 2. Operating Context

The LifeSupply platform includes, or may include, the following business areas:

- **LifeSupply.ca** — B2B / institutional / clinic-facing medical supply platform.
- **WellmartMedical.com** — retail / consumer / dropship-focused BigCommerce storefront.
- **LifeSupply U.S. operations** — including Balkowitsch-related U.S. operations and Amazon/e-commerce sales channels where applicable.
- **Supplier network** — including Best Buy Medical and potentially many additional suppliers/distributors.
- **Customer database** — including historical, current, lapsed, B2B, clinic, retail, and high-value customers.
- **Financial reporting layer** — QuickBooks Online and/or controlled QuickBooks exports by entity.
- **Marketing layer** — Mailchimp, customer reactivation, campaign tracking, Google Analytics 4, Search Console, social media planning.
- **AI layer** — OpenAI API and Anthropic Claude API for summaries, reports, analysis, campaign drafting, product optimization, and management recommendations.
- **Automation layer** — browser automation / RPA / Playwright for suppliers that do not provide APIs.

Known working assumptions to validate during implementation:

- WellmartMedical.com is the retail/dropship storefront.
- LifeSupply.ca is the B2B/institutional portal.
- Wellmart may use **BBM01 / Best Buy Medical** as a primary or sole supplier in the initial retail/dropship workflow.
- BigCommerce is a major e-commerce source system.
- QuickBooks is the accounting source of truth.
- The Command Center is the normalized management data hub, reporting layer, workflow layer, and AI analysis layer.

---

## 3. Primary Goal

Build a secure, role-based management platform that allows LifeSupply management to:

1. See granular daily operations data.
2. Review financial performance across divisions/entities.
3. Track orders, customers, products, suppliers, margins, and exceptions.
4. Improve product/catalog quality and marketing execution.
5. Automate repetitive order and supplier workflows where appropriate.
6. Generate management, board, investor, and lender-ready reports.
7. Use OpenAI and Claude APIs to analyze data, summarize performance, draft reports, and recommend actions.
8. Support future capital raising, acquisitions, investor relations, and M&A opportunity tracking.

---

## 4. Required Stack — Default Technical Direction

Use this stack unless the product owner explicitly changes direction:

- **Framework:** Next.js / React / TypeScript
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Auth.js, Clerk, or Supabase Auth; choose one deliberately and document the decision.
- **Background jobs:** Start simple, then add a durable job system such as BullMQ, Inngest, Trigger.dev, Temporal, or equivalent when needed.
- **Browser automation:** Playwright.
- **AI APIs:** OpenAI API and Anthropic Claude API through secure server-side wrappers.
- **Reporting:** Server-side PDF generation plus CSV/XLSX exports.
- **File storage:** Cloud storage such as S3, Cloudflare R2, Supabase Storage, or equivalent.
- **Hosting:** Vercel for Next.js front end, with appropriate backend/worker hosting where needed.
- **Observability:** Structured logs, error tracking, integration sync logs, and audit trails.

---

## 5. Required Documents to Read First

Before making architecture or implementation decisions, read these files:

1. `/docs/01_PROJECT_OVERVIEW.md`
2. `/docs/02_PRODUCT_REQUIREMENTS_DOCUMENT.md`
3. `/docs/03_TECHNICAL_ARCHITECTURE.md`
4. `/docs/04_DATABASE_SCHEMA.md`
5. `/docs/05_INTEGRATION_MAP.md`
6. `/docs/06_SECURITY_AND_PERMISSIONS.md`
7. `/docs/07_MVP_IMPLEMENTATION_PLAN.md`
8. `/docs/08_UI_UX_SPECIFICATION.md`

Do not proceed with major code generation until these documents have been reviewed and summarized.

---

## 6. Development Rules

### General

- Build incrementally.
- Prefer working, tested, narrow slices over broad unfinished scaffolding.
- Do not create features that are not supported by the documented MVP scope unless explicitly instructed.
- Keep architecture modular so later integrations and automation can be added without rewriting the application.
- Use clear naming that reflects the business domain: divisions, stores, customers, products, suppliers, orders, financial periods, campaigns, opportunities, tasks, reports.

### Security

- Never hardcode API keys.
- Never commit `.env` files containing real credentials.
- Store API credentials using environment variables or secure secret management.
- Protect all API routes server-side.
- Enforce role-based permissions on both UI and API layers.
- Log sensitive actions.
- Use approval workflows for destructive or external actions.

### Financial Data

- Treat QuickBooks as the accounting source of truth.
- Treat the Command Center as the management reporting, analytics, normalization, and workflow layer.
- Do not create accounting entries or alter QuickBooks records without explicit approval workflows.
- Support imports from QuickBooks exports where direct API access is not yet configured.
- Preserve source references, import timestamps, and versioning for financial data.

### E-Commerce Data

- Treat BigCommerce as a source system for store orders, products, customers, categories, pricing, and fulfillment states.
- Normalize BigCommerce data into the Command Center database for reporting, workflows, analysis, and AI use.
- Do not push product, price, customer, or fulfillment updates back to BigCommerce without approval controls and audit logs.

### Supplier Automation

- Begin with human-in-the-loop automation.
- Do not place supplier orders fully autonomously until the workflow has passed staged testing and management approval.
- For supplier portals, implement secure credential handling, robust logging, screenshots/evidence capture, and exception handling.
- Pause workflows when price, stock, SKU, address, tax, shipping, or product data does not match expectations.

### AI Usage

- AI may summarize, classify, draft, recommend, analyze, and explain.
- AI must not execute sensitive actions without approval.
- Log AI prompts, outputs, model used, user, timestamp, source data references, and approval status where relevant.
- Clearly distinguish facts, assumptions, and recommendations in AI-generated management content.
- Use server-side model wrappers. Do not expose OpenAI or Claude API keys in client-side code.

---

## 7. Agent Workflow Rules

The product owner may use both Claude Code and OpenAI Codex on this project.

- Claude Code may be used for architecture, planning, documentation, full-stack implementation, refactoring, and code review.
- Codex or another coding agent may be used for focused implementation tasks.
- Do **not** allow two agents to edit the same branch or the same files concurrently.
- Use separate branches or git worktrees for agent-specific work.
- Merge through pull requests or explicit checkpoints.
- Each agent task should include: objective, files allowed to edit, acceptance criteria, and tests to run.

---

## 8. Build Priority

Default build order:

1. Project scaffold and repo hygiene.
2. Authentication and role-based access.
3. Database schema and seed data.
4. Desktop application shell and navigation.
5. Executive dashboard with mock data.
6. BigCommerce data model and initial sync.
7. QuickBooks financial data import/API layer.
8. Task and exception management.
9. AI daily management briefing.
10. Mailchimp and GA4 dashboards.
11. Report generation.
12. Supplier automation with Playwright.
13. Investor relations and M&A opportunity modules.

---

## 9. MVP Definition

The MVP is successful when the application can:

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

---

## 10. Non-Negotiable Principles

- Security first.
- Financial data integrity first.
- Human approval before external action.
- Audit logs for material actions.
- Modular architecture.
- Source-of-truth clarity.
- Practical management usefulness over unnecessary technical complexity.
- Desktop-first UI.
- AI-assisted, not AI-controlled.
- Build for future capital raising, M&A, and shareholder value reporting, but do not overbuild those modules in the MVP.

---

## 11. Batch 2 Post-MVP Documentation

The MVP is complete. Use the Batch 2 documents below to guide further work:

1. `/docs/09_AI_FEATURES_AND_GUARDRAILS.md`
2. `/docs/10_BROWSER_AUTOMATION_AND_SUPPLIER_WORKFLOWS.md`
3. `/docs/11_REPORTING_REQUIREMENTS.md`
4. `/docs/12_FINANCIAL_MANAGEMENT_REQUIREMENTS.md`
5. `/docs/13_DATA_GOVERNANCE_AND_AUDIT_LOGGING.md`
6. `/docs/14_DEVELOPMENT_STANDARDS.md`
7. `/docs/15_TESTING_AND_QA_PLAN.md`
8. `/docs/16_DEPLOYMENT_AND_ENVIRONMENT.md`
9. `/docs/17_PHASE_2_AUTOMATION_PLAN.md`
10. `/docs/18_PHASE_3_STRATEGIC_GROWTH_PLAN.md`

Read the relevant document and summarize before building any post-MVP feature it covers.

---

## 12. Post-MVP Build Discipline

Correct sequence after MVP:

1. Stabilize.
2. Validate data against source systems.
3. Harden permissions, audit logs, error handling.
4. Improve task and exception workflows.
5. Add controlled supplier automation.
6. Expand financial intelligence and reporting.
7. Expand AI analyst capabilities.
8. Add customer reactivation and marketing automation.
9. Add investor relations, capital raising, and M&A modules.
10. Add advanced forecasting and scenario planning.

Do not mix supplier automation, financial reporting, and AI action workflows in a single change.

---

## 13. AI Rules After MVP

- AI may summarize, classify, draft, explain, compare, analyze, and recommend.
- AI must NOT execute sensitive actions without explicit approval.
- AI must NOT send customer communications, alter product prices, place supplier orders, update financial records, or export sensitive data unless an approved workflow permits it.
- AI outputs used for management, financial, investor, or customer-facing purposes must be logged via `AiOutput`.
- AI outputs should identify source data, assumptions, limitations, and confidence where practical.
- AI must distinguish facts from assumptions and recommendations.
- All AI calls run server-side; never expose model API keys client-side.

---

## 14. Supplier Automation Rules After MVP

- Supplier automation begins as human-in-the-loop.
- Use Playwright (or equivalent) running in a server-side worker, never in a browser request.
- Do not bypass security controls or violate supplier portal terms.
- Never store credentials in code or logs — use the encrypted vault.
- Capture evidence (screenshots, response payloads) for important automation steps.
- Stop automation and create an Exception when supplier price, stock, SKU, shipping, address, tax, or product details do not match expectations.
- Full automation may only be enabled after staged testing, management approval, documented thresholds, AND the relevant FeatureFlag is on.

---

## 15. Reporting Rules After MVP

- QuickBooks remains the accounting source of truth.
- The Command Center may create management-adjusted reporting, but adjustments must be visible, documented, and auditable.
- AI may draft commentary but should not replace management review.
- Board, investor, lender, and financing reports must go through approval before distribution.
- Exported reports include: title, version, generation date, data period, source systems, approval status.

---

## 16. Development Rules After MVP

- Implement advanced features through small, testable tickets.
- Do not mix supplier automation, financial reporting, and AI action workflows in the same change.
- Use feature flags (`src/lib/feature-flags.ts` + `FeatureFlag` model) for high-risk capabilities. Required flags before turning on:
  - `supplier.automation` for any supplier portal write
  - `external.writebacks` for BigCommerce / QuickBooks updates
  - `ai.actions` for any AI-initiated mutation
  - `mailchimp.send` for outbound campaigns
- Add tests before enabling external write-back workflows.
- Add audit logs (`writeAudit`) before enabling sensitive actions.
- Prefer mock/sandbox data until live credentials are confirmed.
- Treat real customer, financial, investor, supplier data with the security and permission model.

---

## 17. Source-of-Truth Map (authoritative)

| Domain | Source of Truth | Command Center role |
|---|---|---|
| Accounting / financial records | **QuickBooks Online** | Import, normalize, summarize, comment, version |
| E-commerce orders / products / customers | **BigCommerce** | Import, monitor, exception-tag, route to workflows |
| Email subscription + campaign metrics | **Mailchimp** | Import, segment, draft, approval-gate sends |
| Website analytics | **GA4** | Import, dashboard, attribute |
| Supplier prices + stock + portal data | **Supplier portals** | Capture snapshots via human-in-the-loop automation |
| Tasks, approvals, exceptions, AI outputs, reports | **Command Center (this app)** | Primary source |
| Investors, opportunities, M&A targets | **Command Center** | Primary source unless replaced by external CRM |

Never write back to a source-of-truth system without an Approval row + relevant FeatureFlag on + audit log entry.

