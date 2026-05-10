# 08 — UI / UX Specification

**Project:** LifeSupply Command Center  
**Document status:** Initial UI/UX specification  
**Prepared:** May 9, 2026

---

## 1. Design Objective

The LifeSupply Command Center should look and feel like a professional executive management platform. It should not feel like a generic admin template or a consumer e-commerce dashboard.

The design should communicate:

- Control.
- Clarity.
- Financial discipline.
- Operational visibility.
- Practical decision support.
- Professional management capability.

The interface should be desktop-first and optimized for daily management use.

---

## 2. Design Principles

1. **Executive-first:** Important information should be visible quickly.
2. **Exception-oriented:** Surface what needs attention.
3. **Action-oriented:** Insights should connect to tasks, approvals, workflows, or reports.
4. **Clean hierarchy:** Use clear section structure and avoid visual clutter.
5. **Data confidence:** Show source, period, and status where relevant.
6. **Professional tone:** Avoid overly flashy UI patterns.
7. **Role-aware:** Users should only see what is relevant and permitted.
8. **AI-assisted:** AI summaries should feel integrated, not gimmicky.
9. **Report-ready:** Screens should support management reporting and export.
10. **Desktop-first:** Prioritize tables, filters, side panels, and analytical layouts.

---

## 3. Application Layout

## 3.1 Desktop Shell

The main application should use:

- Left navigation sidebar.
- Top bar with search/command, current period selector, notifications, and user profile.
- Main content canvas.
- Optional right-side detail drawer.
- Breadcrumbs where useful.
- Persistent module context.

## 3.2 Left Navigation

Primary navigation:

1. Executive Dashboard
2. Operations
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

Navigation should be role-based.

## 3.3 Top Bar

Include:

- Global search / command bar.
- Date or period selector.
- Division/store selector where applicable.
- Notification icon.
- AI quick action button.
- User menu.

---

## 4. Visual Style

### General

- Clean white or neutral background.
- Strong card structure.
- Subtle shadows or borders.
- Clear typography.
- Professional spacing.
- Tables with strong readability.
- Status badges for exceptions.
- Limited color use, reserved for meaning.

### Status Colors

Use status colors consistently:

- Green: good / completed / positive / approved.
- Yellow/amber: warning / needs review.
- Red: urgent / error / loss / delayed.
- Blue: informational / in progress.
- Gray: inactive / neutral / archived.

### Data Cards

KPI cards should include:

- Label.
- Main value.
- Period.
- Change vs prior period.
- Status indicator.
- Optional sparkline.

---

## 5. Core Components

Required reusable components:

- AppShell
- SidebarNav
- TopBar
- PageHeader
- KpiCard
- ChartCard
- DataTable
- StatusBadge
- PriorityBadge
- DateRangePicker
- DivisionSelector
- StoreSelector
- DetailDrawer
- ApprovalDialog
- AiSummaryPanel
- TaskPanel
- EmptyState
- ErrorState
- LoadingSkeleton
- ReportPreview
- IntegrationStatusCard

---

## 6. Screen Specifications

## 6.1 Executive Dashboard

### Purpose

Provide a concise management snapshot.

### Layout

Top section:

- Page title.
- Period selector.
- Division/store selector.
- AI briefing status.

First row KPI cards:

- Revenue MTD.
- Gross profit.
- Gross margin.
- Open orders.
- Cash / working capital.
- Priority exceptions.

Second row:

- Revenue trend chart.
- Orders by status.
- Financial summary card.
- AI daily management briefing.

Third row:

- Top products.
- Low-margin products.
- Customer reactivation summary.
- Marketing campaign summary.

Bottom row:

- Priority tasks.
- Supplier exceptions.
- Recent reports.
- Strategic opportunities.

### AI Briefing Panel

The AI briefing should include:

- Key observations.
- Exceptions.
- Recommended management actions.
- Source period.
- Generated timestamp.
- Regenerate button for authorized users.

---

## 6.2 Operations Control Center

### Purpose

Manage operational exceptions and daily workflow.

### Layout

- Status summary cards.
- Order queue table.
- Supplier exception table.
- Task panel.
- Filters by store, supplier, status, date, priority.
- Right drawer for order/supplier details.

### Key Views

- New orders.
- Awaiting supplier action.
- In automation queue.
- Needs human review.
- Delayed.
- Completed.
- Cancelled/refunded.

---

## 6.3 Orders

### List View

Columns:

- Order number.
- Store.
- Customer.
- Order date.
- Total.
- Estimated margin.
- Payment status.
- Fulfillment status.
- Supplier status.
- Exception status.
- Assigned task/status.

Filters:

- Date range.
- Store.
- Status.
- Supplier.
- Exception.
- Margin.
- Customer type.

### Detail View

Sections:

- Order summary.
- Customer.
- Order items.
- Supplier mapping.
- Fulfillment events.
- Financial/margin summary.
- Notes.
- Related tasks.
- Audit history.

---

## 6.4 Customers

### List View

Columns:

- Customer name.
- Company.
- Email.
- Customer type.
- Last order date.
- Order count.
- Lifetime value.
- Consent status.
- Segment.
- Reactivation score.

### Detail View

Sections:

- Profile.
- Contact and consent.
- Purchase history.
- Product/category affinity.
- Campaign engagement.
- Related tasks.
- Notes.

---

## 6.5 Products & Catalog

### List View

Columns:

- Product name.
- SKU.
- Category.
- Store.
- Supplier.
- Price.
- Cost.
- Margin.
- Image status.
- Description status.
- Sales volume.
- Product score.

### Detail View

Sections:

- Product profile.
- BigCommerce data.
- Supplier mapping.
- Images.
- Description and SEO.
- Sales performance.
- Margin history.
- AI recommendations.
- Related tasks.

---

## 6.6 Suppliers

### List View

Columns:

- Supplier name.
- Code.
- Portal/API status.
- Active products.
- Open orders.
- Delayed orders.
- Price exceptions.
- Automation readiness.

### Detail View

Sections:

- Supplier profile.
- Portal details.
- Product mappings.
- Price history.
- Stock snapshots.
- Fulfillment performance.
- Automation logs.
- Related tasks.

---

## 6.7 Financials

### Purpose

Provide management-level financial visibility.

### Layout

Top filters:

- Period.
- Division.
- Geography.
- Channel.

KPI cards:

- Revenue.
- Gross profit.
- Gross margin.
- Operating expenses.
- EBITDA / adjusted EBITDA.
- Cash.
- AR.
- AP.
- Working capital.

Charts:

- Revenue trend.
- Gross margin trend.
- Expenses by category.
- Division comparison.
- Canada/U.S. comparison.

Tables:

- Monthly summary.
- Variance analysis.
- Adjustments.
- Import status.

AI panel:

- Financial commentary.
- Key changes.
- Management questions.
- Recommended follow-up.

---

## 6.8 Marketing

### Purpose

Manage customer reactivation and campaign intelligence.

### Sections

- Customer segmentation.
- Reactivation pipeline.
- Mailchimp campaigns.
- Campaign metrics.
- AI campaign drafts.
- Campaign calendar.
- Consent/compliance flags.

### Key Tables

- Reactivation candidates.
- Campaigns.
- Customer segments.
- Recent campaign performance.

---

## 6.9 Analytics

### Purpose

Display GA4/website performance.

### Sections

- Traffic overview.
- Source/medium.
- Landing pages.
- Conversion funnel.
- Product views.
- Revenue attribution.
- Campaign traffic.

Charts:

- Users/sessions trend.
- Source/medium breakdown.
- Conversion rate trend.
- Revenue by campaign.

---

## 6.10 AI Analyst

### Purpose

Provide a natural language management interface.

### Layout

- Chat-style interface.
- Suggested prompts.
- Data source selector.
- Output type selector.
- Recent AI outputs.
- Saved recommendations.

### Suggested Prompts

- “Summarize this month’s performance.”
- “Which orders need management attention?”
- “Identify low-margin products.”
- “Draft a customer reactivation campaign.”
- “Explain the change in gross margin.”
- “Prepare a board update.”
- “Summarize supplier issues.”
- “Recommend priority tasks for this week.”

---

## 6.11 Reports

### Purpose

Generate and manage reports.

### Views

- Report library.
- Report generator.
- Report preview.
- Approval queue.
- Export history.

### Report Cards

Each report card should show:

- Report title.
- Type.
- Period.
- Prepared by.
- Approval status.
- Created date.
- Export/download action.

---

## 6.12 Tasks & Workflows

### Purpose

Manage accountability.

### Views

- My tasks.
- Team tasks.
- Overdue.
- High priority.
- Awaiting approval.
- Completed.
- Workflow templates.

### Task Detail

Include:

- Title.
- Description.
- Status.
- Priority.
- Assigned user.
- Due date.
- Related entity.
- Comments.
- Activity log.

---

## 6.13 Investor Relations

### Purpose

Support approved investor reporting and capital raising workflows.

### Sections

- Investor contacts.
- Financing pipeline.
- Investor updates.
- Approved reports.
- Follow-up tasks.
- AI draft tools.

This module can be limited or placeholder in MVP.

---

## 6.14 M&A / Opportunities

### Purpose

Track strategic opportunities.

### Sections

- Opportunity pipeline.
- Acquisition targets.
- Supplier opportunities.
- Cost reduction initiatives.
- Strategic partnerships.
- AI opportunity analysis.

This module can be limited or placeholder in MVP.

---

## 6.15 Automation Center

### Purpose

Monitor integrations, syncs, browser automation, AI jobs, and errors.

### Sections

- Integration status cards.
- Sync logs.
- Failed jobs.
- Retry queue.
- Supplier automation runs.
- AI generation logs.
- System errors.

---

## 6.16 Admin Settings

### Purpose

Manage users, roles, integrations, settings, and system configuration.

### Sections

- Users.
- Roles.
- Permissions.
- Divisions.
- Stores.
- Integrations.
- API settings.
- AI settings.
- Audit logs.

---

## 7. Empty States

Every module should have useful empty states.

Examples:

- “No orders have been imported yet. Connect BigCommerce or upload sample data.”
- “No financial periods are available. Import QuickBooks data or create a sample period.”
- “No campaigns have been synced yet. Connect Mailchimp to begin.”
- “No AI briefings have been generated yet. Generate the first management briefing.”

---

## 8. Error States

Error messages should be clear and management-friendly.

Examples:

- “BigCommerce sync failed because the API token is invalid.”
- “Financial import could not be processed because required columns are missing.”
- “AI briefing could not be generated because no dashboard data is available.”
- “Supplier automation paused because supplier price differs from expected cost.”

---

## 9. Dashboard Tone

The dashboard should present information in a professional management style. Avoid vague promotional language. Use clear business language such as:

- “Needs review”
- “Awaiting supplier confirmation”
- “Margin below threshold”
- “Financial data pending approval”
- “Campaign ready for review”
- “AI recommendation not yet approved”
- “External update requires approval”

---

## 10. MVP UI Priority

The first UI build should prioritize:

1. App shell.
2. Executive dashboard.
3. Data tables.
4. Order/customer/product detail pages.
5. Financial dashboard.
6. Task panel.
7. AI summary panel.
8. Integration status cards.

Do not overinvest in advanced animations or visual polish before the core management workflows work.

