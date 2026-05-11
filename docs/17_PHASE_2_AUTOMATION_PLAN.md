# 17 - Phase 2 Automation Plan

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP implementation roadmap  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, product owner, operations team

---

## 1. Purpose

This document defines Phase 2 of the LifeSupply Command Center roadmap.

Phase 2 begins after the MVP is functioning, stabilized, and validated against core source systems. The goal is to move from dashboard visibility to controlled automation, deeper reporting, stronger workflows, and more useful AI-assisted management.

---

## 2. Phase 2 Objective

> Convert the MVP from a management dashboard into a controlled operating platform that reduces manual work, improves exception management, deepens financial reporting, and introduces safe AI-assisted workflows.

---

## 3. Phase 2 Preconditions

Do not start Phase 2 until the following are substantially complete:

- MVP dashboards are functioning.
- Authentication and role permissions are working.
- BigCommerce sync has been validated.
- QuickBooks financial data or imports have been validated.
- Mailchimp and GA4 initial reporting are working or planned.
- Task and exception system is usable.
- AI daily briefing exists or is scaffolded.
- Audit logging exists for sensitive actions.
- MVP data quality issues are documented.

---

## 4. Phase 2 Workstreams

Phase 2 should be organized into these workstreams:

1. MVP stabilization and data quality.
2. Operations exception management.
3. Supplier automation foundation.
4. Product and catalog intelligence.
5. Financial reporting expansion.
6. AI management analyst expansion.
7. Customer reactivation and marketing workflows.
8. Reporting engine expansion.
9. Audit logging and governance hardening.

---

## 5. Workstream 1: MVP Stabilization and Data Quality

### Objective

Make the MVP trustworthy before expanding automation.

### Tasks

- Reconcile BigCommerce imports against source store totals.
- Reconcile QuickBooks summaries against source reports.
- Validate product SKUs and supplier mappings.
- Validate customer deduplication logic.
- Validate role permissions.
- Review dashboard KPIs with management.
- Add missing error states and empty states.
- Add import logs and warnings where missing.

### Acceptance Criteria

- Key dashboard metrics tie to source systems within agreed tolerance.
- Sync failures are visible.
- Data quality warnings are displayed.
- Management agrees the MVP can be used for daily review.

---

## 6. Workstream 2: Operations Exception Management

### Objective

Turn the Command Center into the daily operating queue for issues requiring attention.

### Features

- Order exception dashboard.
- Supplier exception dashboard.
- Product data exception dashboard.
- Financial data exception dashboard.
- Task assignment from exceptions.
- Severity levels.
- Aging and escalation.
- Resolution notes.
- Recurring issue detection.

### Exception Types

- Order delay.
- Supplier stock issue.
- Supplier price mismatch.
- SKU mismatch.
- Low margin.
- Customer address issue.
- Payment issue.
- Product missing cost.
- Product missing image.
- Financial import warning.

### Acceptance Criteria

- Exceptions can be created automatically.
- Users can assign, resolve, and comment on exceptions.
- Open exceptions appear on executive and operations dashboards.
- Urgent exceptions are highlighted.

---

## 7. Workstream 3: Supplier Automation Foundation

### Objective

Introduce controlled, human-in-the-loop supplier automation.

### Phase 2 Scope

- Supplier automation run table.
- Supplier credential configuration through secure references.
- Supplier product mapping review screen.
- Price check prototype.
- Stock check prototype.
- Prepared order review screen.
- Screenshot/evidence storage.
- Exception creation from automation failure.

### Not Yet Included Unless Approved

- Fully autonomous supplier order submission.
- Automatic customer notification.
- Automatic accounting updates.

### Acceptance Criteria

- A user can run a supplier price/stock check for a mapped product.
- Results are stored and visible.
- Price or stock mismatch creates an exception.
- Automation run is logged.
- Evidence screenshot can be attached.

---

## 8. Workstream 4: Product and Catalog Intelligence

### Objective

Improve product data quality, margin visibility, and merchandising decisions.

### Features

- Product quality score.
- Missing image report.
- Missing cost report.
- Supplier mapping report.
- Low-margin product report.
- Negative-margin product flag.
- Featured product candidate list.
- BBM01 / priority supplier product filter.
- AI product description suggestions.

### Acceptance Criteria

- Product issues are visible in one dashboard.
- Products can be ranked by revenue, margin, and data quality.
- AI suggestions are draft-only.
- Product changes to BigCommerce require approval.

---

## 9. Workstream 5: Financial Reporting Expansion

### Objective

Turn the basic financial dashboard into a management reporting platform.

### Features

- Financial period status.
- Monthly close checklist.
- Budget entry/import.
- Forecast entry/import.
- Variance analysis.
- Adjusted EBITDA schedule.
- Canada/U.S. reporting.
- Division reporting.
- Monthly management report generation.

### Acceptance Criteria

- Monthly financial report can be generated.
- Adjustments are visible separately.
- Budget vs actual and prior period comparisons work.
- AI commentary is draft until approved.

---

## 10. Workstream 6: AI Management Analyst Expansion

### Objective

Make AI more useful while keeping it controlled.

### Features

- AI service abstraction.
- Prompt template library.
- AI output logging.
- Structured output validation.
- Daily management briefing expansion.
- Order exception classification.
- Supplier issue summaries.
- Financial variance commentary.
- Product improvement suggestions.

### Acceptance Criteria

- AI outputs are logged.
- AI outputs respect permissions.
- Workflow-critical AI outputs are schema validated.
- AI cannot execute sensitive actions directly.

---

## 11. Workstream 7: Customer Reactivation and Marketing Workflows

### Objective

Convert the customer database into controlled revenue opportunities.

### Features

- Customer segmentation dashboard.
- Lapsed customer ranking.
- Consent status classification.
- Customer lifetime value grouping.
- Product affinity grouping.
- Mailchimp segment export approval.
- AI campaign draft generator.
- Campaign performance tracking.

### Acceptance Criteria

- Marketable customers can be distinguished from non-marketable customers.
- Reactivation segments can be reviewed before export.
- Campaign drafts require approval.
- Campaign results can be tied back to segments where data allows.

---

## 12. Workstream 8: Reporting Engine Expansion

### Objective

Create repeatable, professional reporting outputs.

### Features

- Report template system.
- PDF export.
- XLSX/CSV export.
- Report versioning.
- Report approval workflow.
- Daily operating brief.
- Weekly sales and operations report.
- Monthly management report.
- Supplier performance report.
- Product margin report.
- Marketing performance report.

### Acceptance Criteria

- Reports have version and approval status.
- Reports show data source timestamps.
- Reports can be downloaded.
- AI commentary can be edited before approval.

---

## 13. Workstream 9: Governance Hardening

### Objective

Ensure that advanced features are secure, traceable, and controllable.

### Features

- Expanded audit logs.
- Sensitive export logs.
- Approval framework.
- Data quality dashboard.
- Integration health dashboard.
- Feature flags for external actions.
- Admin controls for disabling automation.

### Acceptance Criteria

- Sensitive actions create audit logs.
- Admin can disable supplier automation.
- External write-back features are feature-flagged.
- Data import failures are visible.

---

## 14. Suggested 90-Day Phase 2 Plan

### Days 1-30: Stabilization and Governance

- Reconcile MVP data.
- Improve import logs.
- Harden permissions.
- Add exception dashboard.
- Add report repository skeleton.
- Add AI output logging.

### Days 31-60: Operations and Financial Expansion

- Build order exception workflows.
- Build supplier price/stock check prototype.
- Add product quality scoring.
- Add monthly close checklist.
- Add budget vs actual structure.
- Add financial variance commentary draft.

### Days 61-90: Automation and Reporting

- Add prepared supplier order review.
- Add evidence screenshot storage.
- Add customer reactivation segmentation.
- Add Mailchimp segment approval workflow.
- Add monthly management report export.
- Add supplier and product margin reports.

---

## 15. First 10 Phase 2 Development Tickets

1. Add import run logging dashboard.
2. Add exception model and exception dashboard.
3. Add order exception creation from imported order data.
4. Add product data quality scoring.
5. Add financial period status and monthly close checklist.
6. Add AI output logging and prompt template table.
7. Add supplier product mapping review page.
8. Add supplier price/stock check prototype with mock portal support.
9. Add report repository and report versioning.
10. Add customer reactivation segmentation dashboard.

---

## 16. Phase 2 Risks

| Risk | Mitigation |
|---|---|
| Data quality is poor | Add data quality dashboard before automation |
| Supplier portal changes | Start with manual review and screenshots |
| AI outputs are unreliable | Use structured prompts, source data, and approval states |
| Financial reports are misinterpreted | Label unaudited and management-adjusted data clearly |
| Too many features at once | Use small tickets and feature flags |
| Customer marketing compliance risk | Build consent classification before campaign exports |

---

## 17. Phase 2 Acceptance Criteria

Phase 2 is successful when:

- Management uses the platform as a daily operating queue.
- Exceptions are visible, assigned, and resolved inside the system.
- Supplier price and stock checks work in a controlled manner.
- Product margin and product quality dashboards are useful.
- Monthly management reports can be generated.
- AI outputs are logged, draft-controlled, and useful.
- Customer reactivation segments can be identified safely.
- Sensitive actions are permission-controlled and audited.
