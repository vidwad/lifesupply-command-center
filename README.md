# LifeSupply Command Center

**Status:** Initial project documentation package  
**Prepared:** May 9, 2026

---

## Overview

LifeSupply Command Center is a secure web-based desktop application designed to act as the management information, operations control, financial reporting, automation, AI analysis, marketing intelligence, investor reporting, and strategic growth platform for LifeSupply and related operating divisions.

The application will aggregate data from:

- BigCommerce
- QuickBooks Online and/or controlled QuickBooks exports
- Mailchimp
- Google Analytics 4
- Supplier portals
- Manual uploads
- OpenAI API
- Anthropic Claude API
- Future marketing, finance, inventory, CRM, and M&A data sources

The platform is intended to help management review day-to-day activity, investigate exceptions, summarize operating and financial performance, plan future activity, identify growth opportunities, support capital raising, and execute on strategic initiatives.

---

## Business Purpose

The purpose of the LifeSupply Command Center is to increase management capability while minimizing the operating resources required to monitor, analyze, report on, and grow the business.

The platform should give management a single place to answer questions such as:

- What happened today?
- Which orders need attention?
- Which products are selling?
- Which SKUs are low-margin or mispriced?
- Which customers should be reactivated?
- Which campaigns are working?
- Which suppliers are causing issues?
- What does the financial performance look like by entity, division, geography, or channel?
- What should management focus on this week?
- What investor, lender, board, or M&A reporting is needed?

---

## Major Modules

The long-term platform includes:

1. Executive Dashboard
2. Operations Control Center
3. Orders
4. Customers
5. Products & Catalog
6. Suppliers
7. Financials
8. Marketing
9. Analytics
10. AI Analyst
11. Reports
12. Tasks & Workflows
13. Investor Relations
14. M&A / Opportunities
15. Automation Center
16. Admin Settings

---

## MVP Modules

The initial MVP should include:

- Secure login
- Role-based access control
- Desktop application shell
- Executive dashboard
- Initial database schema
- BigCommerce order/product/customer data structure
- QuickBooks financial summary structure
- Task and exception management
- AI daily management briefing
- Mailchimp/customer reactivation view
- GA4 analytics view
- Basic report export
- Admin integration settings

---

## Recommended Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- Auth.js, Clerk, or Supabase Auth
- Playwright
- OpenAI API
- Anthropic Claude API
- BigCommerce API
- QuickBooks Online API and/or controlled file imports
- Mailchimp API
- Google Analytics 4 Data API

---

## Suggested Repository Structure

```text
lifesupply-command-center/
  CLAUDE.md
  README.md
  package.json
  next.config.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    app/
      (auth)/
      (dashboard)/
      api/
    components/
    lib/
    modules/
    server/
    styles/
  docs/
    01_PROJECT_OVERVIEW.md
    02_PRODUCT_REQUIREMENTS_DOCUMENT.md
    03_TECHNICAL_ARCHITECTURE.md
    04_DATABASE_SCHEMA.md
    05_INTEGRATION_MAP.md
    06_SECURITY_AND_PERMISSIONS.md
    07_MVP_IMPLEMENTATION_PLAN.md
    08_UI_UX_SPECIFICATION.md
```

---

## Development Approach

The application should be built in disciplined phases:

1. Documentation and architecture lock-in.
2. Project scaffold.
3. Authentication and role permissions.
4. Database schema.
5. Dashboard layout and navigation.
6. Mock-data MVP dashboards.
7. BigCommerce integration.
8. QuickBooks integration or import workflows.
9. Task and exception management.
10. AI daily briefing.
11. Mailchimp and GA4 dashboards.
12. Report generator.
13. Supplier automation.

---

## Deploying

Production deployment runs on **Vercel + Neon Postgres**. See
[`docs/DEPLOYMENT_VERCEL.md`](./docs/DEPLOYMENT_VERCEL.md) for the full
20-minute setup walkthrough — environment variables, database wiring,
known limitations (Playwright supplier automation needs a separate
worker), and post-deploy steps.

For day-to-day operations after deploy (kill-switch, backups, audit
retention, secrets), see [`docs/OPS_RUNBOOK.md`](./docs/OPS_RUNBOOK.md).

---

## Claude Code Start Instructions

A recommended first Claude Code prompt is included in:

`00_START_HERE_FOR_CLAUDE_CODE.md`

Use that prompt after placing this package in the root of the new repository.

