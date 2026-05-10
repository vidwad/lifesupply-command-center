# 03 — Technical Architecture

**Project:** LifeSupply Command Center  
**Document status:** Initial technical architecture  
**Prepared:** May 9, 2026

---

## 1. Architecture Summary

LifeSupply Command Center should be built as a secure, modular, desktop-first web application with a normalized PostgreSQL database, strong role-based access control, integration services for external platforms, a background job layer, AI service wrappers, reporting services, and a browser automation layer for supplier portals.

The application should use a hub-and-spoke architecture:

- External systems remain source systems.
- The Command Center imports, normalizes, enriches, analyzes, reports on, and orchestrates workflows around their data.
- Sensitive external actions require approval controls.
- All material actions are logged.

---

## 2. Recommended Stack

### Front End

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts or equivalent charting library
- TanStack Table or equivalent for data tables

### Back End

- Next.js API routes or route handlers for MVP.
- Server-side service modules for integrations.
- Background worker system added when scheduled syncs and automation become material.

### Database

- PostgreSQL
- Prisma ORM
- Migrations under source control
- Seed data for development
- Audit fields on important tables

### Authentication

Choose one:

- Auth.js
- Clerk
- Supabase Auth

Selection criteria:

- Ease of role-based access.
- Compatibility with Next.js.
- Secure session handling.
- Production readiness.
- Support for MFA or future MFA.

### Integrations

- BigCommerce API
- QuickBooks Online API and/or controlled import workflow
- Mailchimp API
- Google Analytics 4 Data API
- OpenAI API
- Anthropic Claude API
- Supplier portals through Playwright

### Automation

- Playwright for browser automation.
- Job queue for retryable automation.
- Human approval gates.
- Screenshot and evidence storage.

### Reporting

- HTML-to-PDF or server-generated PDF reports.
- CSV/XLSX exports.
- Saved report metadata.
- Generated report archive.

### Observability

- Structured logging.
- Error tracking.
- Integration sync logs.
- AI prompt/output logs.
- Audit logs.
- Automation run logs.

---

## 3. High-Level System Diagram

```text
External Systems
  ├─ BigCommerce
  ├─ QuickBooks Online / QuickBooks Exports
  ├─ Mailchimp
  ├─ Google Analytics 4
  ├─ Supplier Portals
  ├─ Manual Uploads
  ├─ OpenAI API
  └─ Claude API

        ↓

Integration and Automation Layer
  ├─ API Clients
  ├─ Import Parsers
  ├─ Sync Jobs
  ├─ Playwright Workers
  ├─ AI Service Wrappers
  └─ Error / Retry Handling

        ↓

Normalized Command Center Database
  ├─ Divisions / Stores
  ├─ Customers
  ├─ Products
  ├─ Orders
  ├─ Suppliers
  ├─ Financials
  ├─ Marketing
  ├─ Analytics
  ├─ Tasks
  ├─ Reports
  ├─ Opportunities
  └─ Audit Logs

        ↓

Application Layer
  ├─ Dashboards
  ├─ Tables
  ├─ Workflows
  ├─ Reports
  ├─ AI Analyst
  ├─ Admin Settings
  └─ Approval Queues
```

---

## 4. Front-End Architecture

### Layout

The application should use a desktop-first shell:

- Left sidebar navigation.
- Top command/search bar.
- Main content area.
- Right-side optional context drawer.
- Role-based navigation.
- Responsive but optimized for desktop management use.

### Route Groups

Suggested Next.js route groups:

```text
src/app/
  (auth)/
    login/
    forgot-password/
  (dashboard)/
    dashboard/
    operations/
    orders/
    customers/
    products/
    suppliers/
    financials/
    marketing/
    analytics/
    ai-analyst/
    reports/
    tasks/
    investors/
    opportunities/
    automation/
    admin/
  api/
    auth/
    integrations/
    ai/
    reports/
    webhooks/
```

### UI Component Principles

- Reusable dashboard cards.
- Reusable data tables.
- Reusable status badges.
- Reusable filters.
- Reusable detail pages.
- Reusable approval dialogs.
- Reusable report preview components.
- Reusable AI summary panels.

---

## 5. Back-End Architecture

Use server-side modules organized by business domain:

```text
src/server/
  auth/
  db/
  integrations/
    bigcommerce/
    quickbooks/
    mailchimp/
    ga4/
    openai/
    anthropic/
  services/
    orders/
    customers/
    products/
    suppliers/
    financials/
    marketing/
    analytics/
    reports/
    ai/
    tasks/
    opportunities/
  jobs/
  automation/
  audit/
  permissions/
```

Each service should:

- Validate input.
- Enforce authorization.
- Call database methods.
- Log material actions.
- Return typed results.
- Avoid exposing secrets or raw API credentials.

---

## 6. Database Architecture

The database should be a normalized PostgreSQL data model using Prisma.

Key design principles:

- Use UUIDs or CUIDs for primary keys.
- Include `createdAt`, `updatedAt`, and where appropriate `deletedAt`.
- Use source system IDs for imported data.
- Store source system and source record ID for traceability.
- Separate external source data from management adjustments.
- Store sync metadata.
- Preserve historical financial and price data.
- Log all material actions.

---

## 7. Integration Architecture

Each integration should follow a consistent pattern:

```text
API Client / Import Parser
  ↓
Raw Response / File Capture where appropriate
  ↓
Validation and Mapping
  ↓
Normalized Database Upsert
  ↓
Sync Log
  ↓
Dashboard / Workflow / Report Use
```

Each integration should have:

- Config table.
- Sync log table.
- Last successful sync timestamp.
- Error logging.
- Retry strategy.
- Manual re-run control.
- Source-of-truth statement.
- Permission controls.

---

## 8. BigCommerce Architecture

Initial requirements:

- Store connection settings.
- Product sync.
- Customer sync.
- Order sync.
- Category sync.
- Order item sync.
- Fulfillment status sync.
- Webhook-ready architecture.

Use BigCommerce as the e-commerce source system. The Command Center should normalize data for reporting and workflow management.

Do not push updates to BigCommerce in MVP unless explicitly approved.

---

## 9. QuickBooks Architecture

QuickBooks should be handled carefully because it is the accounting source of truth.

The architecture should support two paths:

### Path A — Controlled File Import

For early phases or where API credentials are not ready:

- Upload P&L.
- Upload balance sheet.
- Upload trial balance.
- Upload A/R aging.
- Upload A/P aging.
- Upload sales reports.
- Validate file format.
- Map accounts.
- Save import version.
- Publish to reporting only after review.

### Path B — QuickBooks Online API

For later or direct integration:

- OAuth connection.
- Account sync.
- Transaction sync.
- Report sync.
- Entity/division/class mapping.
- Reconciliation status.
- Sync logs.

The Command Center should not override accounting records. It should provide management reporting, variance analysis, and report generation.

---

## 10. Mailchimp Architecture

Mailchimp should support:

- Audience sync.
- Contact sync.
- Tag sync.
- Segment sync.
- Campaign sync.
- Campaign metrics.
- Consent/subscription status.
- Reactivation lists.

Do not send campaigns directly in MVP. The system may draft campaigns and prepare segments, but sending should require approval and preferably occur in Mailchimp until controls are built.

---

## 11. GA4 Architecture

GA4 integration should support:

- Traffic metrics.
- Campaign metrics.
- Source/medium.
- Landing pages.
- Conversion events.
- E-commerce revenue where configured.
- Date comparisons.
- Dashboard display.

The application should be able to work with mock analytics data before live GA4 credentials are configured.

---

## 12. AI Architecture

AI functionality should be server-side.

Suggested architecture:

```text
User Request or Scheduled Job
  ↓
Permission Check
  ↓
Context Builder
  ↓
Model Router
    ├─ OpenAI
    └─ Claude
  ↓
Structured Output Parser
  ↓
AI Output Log
  ↓
Review / Approval / Display
```

AI service requirements:

- No client-side API keys.
- Prompt logging.
- Output logging.
- Model name logging.
- Token/cost metadata where available.
- Source data references.
- Role-based data limits.
- Human approval for external actions.

---

## 13. Browser Automation Architecture

Use Playwright for supplier portals.

Initial design:

- Store encrypted credential references.
- Run automation from backend worker.
- Use staging/testing accounts where possible.
- Capture screenshots.
- Store confirmation numbers.
- Pause for human review when mismatches occur.
- Log every automation step.
- Never fully automate sensitive purchases until approved.

---

## 14. Reporting Architecture

Reports should be generated from approved internal data and saved to the report library.

Report types:

- Daily operating brief.
- Weekly operations report.
- Monthly financial management report.
- Product margin report.
- Supplier performance report.
- Customer reactivation report.
- Marketing performance report.
- Investor update.
- Board package.
- M&A opportunity report.

Reports should support:

- PDF export.
- CSV/XLSX data export.
- AI-generated narrative.
- Review/approval status.
- Report versioning.

---

## 15. Security Architecture

Security must be built into the platform from the start:

- Authenticated routes only.
- Role-based route protection.
- Server-side permission checks.
- Protected API routes.
- Encrypted secrets.
- Audit logs.
- Approval workflows.
- Least-privilege access.
- Data export controls.
- Financial and investor data restrictions.

---

## 16. Deployment Architecture

Initial deployment can use:

- Vercel for Next.js.
- Managed PostgreSQL such as Neon, Supabase, or Railway.
- Environment variables for secrets.
- Cloud storage for files.
- Separate staging and production environments.
- CI checks before deployment.

As automation grows, background workers may need separate infrastructure such as:

- Railway workers.
- Render workers.
- Fly.io workers.
- AWS ECS/Fargate.
- Cloud Run.
- Trigger.dev / Inngest / Temporal Cloud.

---

## 17. Scaling Considerations

The MVP should not overbuild, but it should avoid dead ends.

Design for:

- Multiple stores.
- Multiple entities/divisions.
- Multiple integrations.
- Multiple user roles.
- Background jobs.
- AI usage logging.
- Approval workflows.
- Supplier automation.
- Report versioning.
- Investor/M&A modules.
- Future API/webhook integrations.

