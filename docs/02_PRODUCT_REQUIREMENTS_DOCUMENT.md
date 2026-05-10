# 02 — Product Requirements Document

**Project:** LifeSupply Command Center  
**Document status:** Initial PRD  
**Prepared:** May 9, 2026

---

## 1. Product Summary

LifeSupply Command Center is a secure, role-based, desktop-first web application that centralizes management information, operational control, financial reporting, customer intelligence, product intelligence, supplier workflows, marketing analytics, AI-assisted analysis, reporting, and strategic opportunity management for LifeSupply and related operating divisions.

The product must provide management with clear visibility into daily operations, financial performance, customer activity, product and supplier performance, marketing execution, reporting obligations, and future growth opportunities.

---

## 2. Product Objectives

The application must:

1. Aggregate fragmented operating and financial data into one management platform.
2. Normalize information from BigCommerce, QuickBooks, Mailchimp, GA4, supplier portals, manual uploads, and other sources.
3. Provide executive dashboards and drill-down detail.
4. Identify exceptions that require action.
5. Allow tasks and workflows to be assigned and tracked.
6. Use AI to generate summaries, recommendations, reports, and analysis.
7. Support financial management and investor reporting.
8. Support supplier automation and browser-based workflows in later phases.
9. Maintain security, permissions, audit logs, and approval workflows.
10. Scale from MVP into a full command center for shareholder value creation.

---

## 3. Target Users

### 3.1 Executive / Owner

Needs consolidated visibility, financial summaries, AI-generated briefings, strategic opportunities, investor reporting, and high-level operating control.

### 3.2 Finance Manager

Needs QuickBooks imports/API data, financial summaries, variance analysis, close checklist, management reporting, normalization adjustments, and report exports.

### 3.3 Operations Manager

Needs order queues, supplier status, delayed orders, exceptions, fulfillment workflows, tasks, and supplier performance.

### 3.4 Marketing Manager

Needs customer segmentation, Mailchimp campaigns, reactivation lists, GA4 analytics, campaign performance, and AI-generated campaign drafts.

### 3.5 Product Manager

Needs product catalog intelligence, supplier SKU mapping, product images, margin data, category performance, and AI product copy tools.

### 3.6 Customer Service

Needs customer records, order history, open issues, returns/refunds, support tasks, and limited product/order visibility.

### 3.7 Investor Relations / Strategic Advisor

Needs approved financial summaries, investor contacts, reports, updates, strategic opportunities, and M&A workspaces.

### 3.8 Developer / Technical Admin

Needs integration status, API keys/settings, logs, background jobs, automation health, and system diagnostics.

---

## 4. Core Modules

The full product should contain the following modules:

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

## 5. Module Requirements

## 5.1 Executive Dashboard

### Purpose

Provide management with a concise but comprehensive summary of operating, financial, marketing, customer, supplier, and task performance.

### Required Features

- Revenue snapshot: today, week-to-date, month-to-date, year-to-date, trailing twelve months.
- Gross profit and gross margin.
- Open orders.
- Orders requiring attention.
- Delayed orders.
- Supplier exceptions.
- Top-selling products.
- Low-margin products.
- Customer reactivation status.
- Campaign performance snapshot.
- Website traffic and conversion snapshot.
- Financial health indicators.
- AI daily management briefing.
- Priority tasks.

### Acceptance Criteria

- User can view dashboard after login.
- Dashboard only shows data permitted by user role.
- Dashboard works with mock data initially.
- Dashboard can later connect to live data sources without redesign.
- Executive user can see AI-generated daily summary.

---

## 5.2 Operations Control Center

### Purpose

Manage day-to-day order fulfillment, supplier actions, exceptions, customer issues, and operational accountability.

### Required Features

- Order queue by status.
- New orders.
- Orders awaiting supplier action.
- Orders in supplier automation queue.
- Orders requiring human review.
- Delayed orders.
- Completed orders.
- Cancelled/refunded orders.
- Supplier-specific filters.
- Exception status.
- Task assignment.
- Internal notes.
- Audit trail.

### Acceptance Criteria

- Operations users can filter and sort orders.
- Orders can be linked to tasks.
- Exceptions are clearly flagged.
- Users can assign responsibility and due dates.
- Sensitive external actions require approval.

---

## 5.3 Orders

### Purpose

Provide normalized order management across BigCommerce and future sales channels.

### Required Features

- Order list.
- Order detail page.
- Customer information.
- Order items.
- SKU, price, cost, margin.
- Source store.
- Supplier assignment.
- Fulfillment status.
- Payment status.
- Shipping details.
- Automation status.
- Order notes.
- Related tasks.
- Related supplier events.
- Related customer communications.

### Acceptance Criteria

- Imported BigCommerce orders are stored in normalized tables.
- Order items are stored separately.
- Order status history is preserved.
- Manual comments and tasks can be added.
- External updates are not pushed without approval controls.

---

## 5.4 Customers

### Purpose

Create a unified customer intelligence system for B2B, retail, active, lapsed, and high-value customers.

### Required Features

- Customer list.
- Customer profile.
- Customer type.
- Source store.
- Contact information.
- Consent status.
- Purchase history.
- Lifetime value.
- Last purchase date.
- Product/category affinity.
- Campaign engagement.
- Reactivation score.
- Notes and tasks.
- Related reports.

### Acceptance Criteria

- Customer data can be imported from BigCommerce and Mailchimp.
- Customers can be segmented.
- Consent status is visible.
- Customer reactivation lists can be prepared.
- Unsubscribed or restricted contacts are clearly flagged.

---

## 5.5 Products & Catalog

### Purpose

Create a product intelligence layer for product data quality, margin, supplier mapping, promotion, and catalog optimization.

### Required Features

- Product list.
- Product detail page.
- SKU and supplier SKU mapping.
- Product category.
- Product image status.
- Description quality status.
- Selling price.
- Supplier cost.
- Margin.
- Sales history.
- Stock/availability status where available.
- Product score.
- Featured product recommendation.
- AI product copy recommendations.
- Product cleanup tasks.

### Acceptance Criteria

- BigCommerce products can be imported or mocked.
- Products can be matched to suppliers.
- Missing images and descriptions can be flagged.
- Low-margin SKUs can be identified.
- Product recommendations can be generated.

---

## 5.6 Suppliers

### Purpose

Track supplier relationships, supplier products, portal requirements, supplier performance, and automation readiness.

### Required Features

- Supplier list.
- Supplier profile.
- Supplier portal details.
- Supplier products.
- Cost history.
- Stock snapshots.
- Fulfillment performance.
- Delayed orders.
- Price mismatches.
- Automation status.
- Related tasks.
- Supplier notes.

### Acceptance Criteria

- Supplier records can be created.
- Supplier products can be linked to internal products.
- Price and stock mismatches can be tracked.
- Supplier workflows can be audited.

---

## 5.7 Financials

### Purpose

Provide management-level financial reporting across consolidated and divisional operations.

### Required Features

- Consolidated revenue.
- Revenue by division/entity/geography/channel.
- Gross profit.
- Gross margin.
- Operating expenses.
- EBITDA and adjusted EBITDA.
- Cash.
- Accounts receivable.
- Accounts payable.
- Working capital.
- Budget vs actual.
- Prior period comparison.
- Variance analysis.
- Normalization adjustments.
- Monthly close checklist.
- Financial report export.

### Acceptance Criteria

- Financial summary records can be imported or entered.
- QuickBooks remains source of truth.
- Management adjustments are tracked separately.
- Financial outputs are role-protected.
- Users can generate financial summary reports.

---

## 5.8 Marketing

### Purpose

Support customer reactivation, email campaigns, campaign planning, and performance tracking.

### Required Features

- Mailchimp audience sync.
- Contact segments.
- Campaign list.
- Campaign metrics.
- Reactivation campaign planning.
- AI email copy generator.
- Product campaign recommendations.
- Approval workflow before sending.
- Social content drafts.
- Campaign calendar.

### Acceptance Criteria

- Mailchimp data can be imported or mocked.
- Customers can be grouped into segments.
- Campaign performance can be displayed.
- AI-generated drafts are not sent automatically.
- CASL/compliance flags are visible.

---

## 5.9 Analytics

### Purpose

Provide website and conversion analytics from GA4 and related tools.

### Required Features

- Traffic by source/medium.
- Users and sessions.
- Engagement.
- Landing pages.
- Product views.
- Conversion events.
- E-commerce revenue where available.
- Campaign attribution.
- Funnel view.
- Period comparisons.

### Acceptance Criteria

- GA4 metrics can be displayed.
- Metrics can be filtered by date.
- Analytics are linked to campaigns where possible.
- Dashboard supports mock data prior to live API connection.

---

## 5.10 AI Analyst

### Purpose

Provide a natural language management assistant grounded in internal company data.

### Required Features

- AI daily management briefing.
- Natural language query interface.
- Financial commentary generator.
- Order exception summary.
- Product recommendation summary.
- Customer reactivation suggestions.
- Campaign draft generation.
- Board/investor report drafting.
- Opportunity summary generation.
- Prompt/output logging.
- Source data references where possible.

### Acceptance Criteria

- AI calls are server-side only.
- Prompts and outputs are logged.
- User role controls what data AI can access.
- AI distinguishes facts, assumptions, and recommendations.
- Sensitive actions require human approval.

---

## 5.11 Reports

### Purpose

Generate management, financial, operational, marketing, investor, and strategic reports.

### Required Features

- Report library.
- Report templates.
- Daily operating brief.
- Weekly operations report.
- Monthly financial management report.
- Board package.
- Investor update.
- Product margin report.
- Supplier performance report.
- Customer reactivation report.
- Campaign performance report.
- PDF export.
- CSV/XLSX export.
- Approval workflow.

### Acceptance Criteria

- Users can generate a basic report from available data.
- Reports include generated date, source data, and prepared-by metadata.
- Reports can be saved.
- Sensitive reports are role-protected.

---

## 5.12 Tasks & Workflows

### Purpose

Convert insight into action and accountability.

### Required Features

- Task list.
- Task detail.
- Assignment.
- Due date.
- Priority.
- Status.
- Related entity: order, customer, product, supplier, campaign, financial period, report, or opportunity.
- Recurring tasks.
- Workflow templates.
- Approval tasks.
- Task comments.
- Audit trail.

### Acceptance Criteria

- Users can create, assign, update, and complete tasks.
- Tasks can be linked to operating objects.
- Approval tasks are clearly separated.
- Overdue tasks are flagged.

---

## 5.13 Investor Relations

### Purpose

Support future capital raising, investor updates, lender reporting, and shareholder communications.

### Required Features

- Investor contact records.
- Investor status.
- Contact history.
- Follow-up tasks.
- Report packages.
- Investor updates.
- Financing pipeline.
- AI draft support.
- Approved financial summary usage only.

### Acceptance Criteria

- Investor records can be stored.
- Investor communications can be tracked.
- Reports are generated from approved data.
- Role-based access is enforced.

---

## 5.14 M&A / Opportunities

### Purpose

Track acquisition targets, supplier relationships, strategic initiatives, cost reduction opportunities, and growth projects.

### Required Features

- Opportunity list.
- Opportunity profile.
- Type: acquisition, supplier, financing, marketing, product, operational, technology, partnership.
- Strategic rationale.
- Revenue potential.
- Margin potential.
- Cost estimate.
- Risk rating.
- Status.
- Next action.
- Responsible person.
- AI opportunity summary.
- Diligence checklist.

### Acceptance Criteria

- Opportunities can be created and scored.
- Tasks can be linked to opportunities.
- AI can draft opportunity summaries.
- Sensitive opportunities are role-protected.

---

## 5.15 Automation Center

### Purpose

Monitor API syncs, background jobs, browser automation, AI runs, and external system activities.

### Required Features

- Integration status.
- API sync logs.
- Background job logs.
- Supplier automation runs.
- AI job logs.
- Error logs.
- Retry queue.
- Manual re-run controls.
- Credential status.
- Approval queue.

### Acceptance Criteria

- Admin users can view integration health.
- Failed syncs are visible.
- Automation actions are logged.
- Manual retry is permission-controlled.

---

## 5.16 Admin Settings

### Purpose

Manage application configuration, users, roles, permissions, integrations, and system settings.

### Required Features

- User management.
- Role management.
- Permission management.
- Integration settings.
- API credential references.
- Division/store configuration.
- Report settings.
- AI model settings.
- Audit log viewer.

### Acceptance Criteria

- Only authorized users can access admin settings.
- Users can be assigned roles.
- Permissions are enforced server-side.
- Integration settings do not expose secrets client-side.

---

## 6. MVP Scope

The MVP should include:

1. Authentication and role-based access.
2. Desktop layout and navigation.
3. Core database schema.
4. Mock-data executive dashboard.
5. Orders/products/customers data model.
6. Financial summary model.
7. Task and exception management.
8. AI daily briefing using available/mocked data.
9. Basic Mailchimp/customer reactivation dashboard.
10. Basic GA4 analytics dashboard.
11. Report generator for a simple management report.
12. Admin settings shell.

---

## 7. Excluded From MVP

Do not build these until the base platform is stable:

- Fully autonomous supplier ordering.
- Direct sending of Mailchimp campaigns.
- Direct product updates pushed back to BigCommerce.
- Direct accounting entries into QuickBooks.
- Full investor CRM automation.
- Full M&A diligence room.
- Advanced forecasting.
- Full social media posting automation.
- Complex multi-tenant architecture.

---

## 8. Non-Functional Requirements

The application must be:

- Secure.
- Fast enough for daily management use.
- Desktop-first.
- Role-based.
- Auditable.
- Modular.
- Maintainable.
- Integration-ready.
- AI-ready.
- Designed for future reporting, automation, and shareholder value use cases.

