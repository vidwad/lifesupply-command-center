# 07 — MVP Implementation Plan

**Project:** LifeSupply Command Center  
**Document status:** Initial MVP implementation plan  
**Prepared:** May 9, 2026

---

## 1. MVP Objective

The MVP objective is to build a secure, desktop-first management information application that proves the LifeSupply Command Center concept by providing:

- Authentication.
- Role-based access.
- Core database model.
- Professional dashboard shell.
- Executive dashboard.
- Orders/products/customers foundation.
- Financial reporting foundation.
- Task and exception management.
- AI daily management briefing.
- Mailchimp/customer reactivation dashboard foundation.
- GA4 analytics dashboard foundation.
- Basic report generation.
- Integration configuration foundation.

The MVP should create a usable foundation for real operational data and future automation without attempting to fully automate every workflow immediately.

---

## 2. MVP Success Criteria

The MVP is successful when:

1. A user can securely log in.
2. User permissions affect what the user can see and do.
3. Management can view an executive dashboard.
4. The application has a normalized database schema for core business entities.
5. Orders, customers, products, suppliers, financial summaries, campaigns, website metrics, tasks, reports, and integration logs exist in the database.
6. The UI displays meaningful mock or imported data.
7. A user can create and assign tasks.
8. AI can generate a daily management briefing from available data.
9. Basic financial performance can be displayed by period/division.
10. Customer reactivation and marketing metrics can be displayed.
11. A simple management report can be generated/exported.
12. The system is structured to add live integrations and automation later.

---

## 3. MVP Exclusions

The MVP should not include:

- Fully autonomous supplier ordering.
- Direct email campaign sending.
- External product updates pushed to BigCommerce.
- QuickBooks write-back.
- Full investor CRM.
- Full M&A diligence system.
- Advanced forecasting.
- Full social media posting automation.
- Complex warehouse/inventory management.
- Native mobile application.
- Multi-company SaaS tenant architecture.

---

## 4. Phase 0 — Project Setup

### Objective

Create a clean technical foundation and repository structure.

### Tasks

- Create Next.js application.
- Configure TypeScript.
- Configure Tailwind CSS.
- Install shadcn/ui.
- Configure ESLint/Prettier.
- Configure environment variable handling.
- Create base folder structure.
- Create initial README.
- Add documentation package.
- Configure Git.
- Add basic CI checks if available.

### Acceptance Criteria

- Application runs locally.
- TypeScript is configured.
- Tailwind works.
- shadcn/ui components can be used.
- Documentation files exist.
- Repository has clear structure.

---

## 5. Phase 1 — Authentication and Application Shell

### Objective

Build the secure login flow and desktop application layout.

### Tasks

- Select authentication provider.
- Implement login page.
- Implement protected dashboard layout.
- Create left navigation sidebar.
- Create top bar.
- Create user profile menu.
- Create role-based navigation placeholder.
- Add basic permission utility functions.
- Seed initial users/roles in development.

### Acceptance Criteria

- User can log in.
- Unauthenticated users cannot access dashboard routes.
- Dashboard layout renders.
- Navigation modules are visible based on role.
- Admin role can access admin shell.

---

## 6. Phase 2 — Database Foundation

### Objective

Create the core database schema and seed data.

### Tasks

- Configure PostgreSQL.
- Configure Prisma.
- Create schema for MVP tables.
- Create migrations.
- Create seed data.
- Add divisions.
- Add stores.
- Add suppliers.
- Add sample customers.
- Add sample products.
- Add sample orders.
- Add sample financial summaries.
- Add sample campaigns and website metrics.
- Add sample tasks.
- Add sample AI output.

### Acceptance Criteria

- Database migrates successfully.
- Seed script works.
- Application can query core data.
- Mock dashboards can pull from database.
- Schema includes audit/logging foundations.

---

## 7. Phase 3 — Executive Dashboard

### Objective

Create the primary management dashboard.

### Dashboard Widgets

- Revenue today / month-to-date / trailing twelve months.
- Gross profit.
- Gross margin.
- Open orders.
- Orders requiring attention.
- Delayed orders.
- Top products.
- Low-margin products.
- Customer reactivation summary.
- Campaign performance summary.
- GA4 traffic summary.
- AI daily management briefing.
- Priority tasks.

### Tasks

- Create dashboard route.
- Create KPI card components.
- Create chart components.
- Create status badge components.
- Query sample data.
- Display mock/seeded values.
- Add loading and empty states.

### Acceptance Criteria

- Dashboard looks professional.
- Data is clearly organized.
- Executive can quickly understand key performance indicators.
- Widgets can later be connected to live data.

---

## 8. Phase 4 — Orders, Customers, Products Foundation

### Objective

Create the core operating data views.

### Tasks

- Orders list.
- Order detail page.
- Customers list.
- Customer detail page.
- Products list.
- Product detail page.
- Supplier product mapping display.
- Filters and search.
- Status badges.
- Linked tasks.

### Acceptance Criteria

- User can view seeded/imported operating records.
- Order detail includes items.
- Customer detail includes order summary.
- Product detail includes margin and supplier mapping.
- Tasks can link to an operating record.

---

## 9. Phase 5 — Financial Dashboard Foundation

### Objective

Create the first financial reporting dashboard.

### Tasks

- Financial overview route.
- Period selector.
- Division selector.
- Revenue, COGS, gross profit, gross margin.
- Operating expenses.
- EBITDA / adjusted EBITDA placeholder.
- Cash, AR, AP.
- Prior period comparison.
- Financial data approval status.
- Basic variance commentary placeholder.

### Acceptance Criteria

- Financial dashboard works with seeded data.
- Role-based access limits financial visibility.
- Financial data shows period and division.
- Approval status is visible.
- Report generation can access financial summary.

---

## 10. Phase 6 — Task and Exception Management

### Objective

Allow insights and exceptions to become assigned actions.

### Tasks

- Task list.
- Task detail.
- Create task.
- Assign task.
- Update status.
- Link task to order/customer/product/supplier/report/opportunity.
- Priority and due date.
- Overdue flags.
- Approval task type.

### Acceptance Criteria

- Users can create and update tasks.
- Tasks can be related to business objects.
- Overdue and high-priority tasks are visible.
- Dashboard displays priority tasks.

---

## 11. Phase 7 — AI Daily Management Briefing

### Objective

Create the first AI-assisted management workflow.

### Tasks

- Create server-side AI service wrapper.
- Support OpenAI and/or Claude provider configuration.
- Create context builder from dashboard data.
- Generate daily briefing.
- Store AI output.
- Display AI summary on dashboard.
- Add manual regenerate button with permission check.
- Include facts/observations/recommended actions.

### Acceptance Criteria

- AI call is server-side.
- Prompt and output are logged.
- AI output displays in dashboard.
- User can identify when it was generated.
- Sensitive data access respects permissions.
- AI does not execute external actions.

---

## 12. Phase 8 — Marketing and Analytics Foundations

### Objective

Add initial customer reactivation, Mailchimp, and GA4 views.

### Tasks

- Marketing dashboard.
- Customer segment summary.
- Campaign performance cards.
- Reactivation candidate list.
- GA4 analytics dashboard.
- Traffic by source.
- Conversion metrics.
- Date range filters.

### Acceptance Criteria

- Marketing manager can view campaign metrics.
- Executive can view summary.
- Customer consent/subscription status is visible.
- Analytics dashboard displays source/traffic/conversion data.

---

## 13. Phase 9 — Report Generator

### Objective

Create a basic management report output.

### Tasks

- Report template model.
- Generate monthly management report from seeded/available data.
- Include executive summary.
- Include financial snapshot.
- Include operations snapshot.
- Include marketing snapshot.
- Include priority tasks.
- Export to PDF or HTML print view.
- Save report record.

### Acceptance Criteria

- User can generate a basic management report.
- Report is saved.
- Report can be viewed later.
- Export works.
- Generated report includes source period and prepared-by information.

---

## 14. Phase 10 — Integration Settings Foundation

### Objective

Prepare the application for real integrations.

### Tasks

- Admin integrations page.
- BigCommerce connection shell.
- QuickBooks connection/import shell.
- Mailchimp connection shell.
- GA4 connection shell.
- OpenAI/Claude model settings shell.
- Supplier portal settings shell.
- Integration status display.
- Sync log model display.

### Acceptance Criteria

- Admin can view integration settings.
- Secrets are not exposed.
- Connections can be marked configured/not configured.
- Sync logs can be displayed.

---

## 15. Recommended First Coding Sprint

The first coding sprint should include only:

1. Project scaffold.
2. App shell.
3. Authentication decision.
4. Prisma setup.
5. Core layout.
6. Seed data.
7. Executive dashboard using seeded data.

Do not begin live API integrations before this foundation is working.

---

## 16. Phase Review Gates

Before moving to live integrations, confirm:

- Authentication works.
- Roles and permissions work.
- Database schema is stable enough.
- Dashboard layout is approved.
- Seed data approach is working.
- Audit log foundation exists.
- Integration settings shell exists.
- Error handling pattern is established.

Before supplier automation, confirm:

- Order model is stable.
- Supplier product mapping exists.
- Approval workflow exists.
- Automation log exists.
- Secure credential strategy exists.
- Human-in-the-loop UX exists.

