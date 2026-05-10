# 06 — Security and Permissions

**Project:** LifeSupply Command Center  
**Document status:** Initial security and permissions specification  
**Prepared:** May 9, 2026

---

## 1. Security Summary

LifeSupply Command Center will contain sensitive customer, financial, supplier, investor, marketing, AI, automation, and strategic business information. Security and permissions must be built into the application from the beginning.

The system must enforce role-based access at both the user interface and server/API layers. No sensitive data should be protected only by front-end hiding. All protected actions must be verified server-side.

---

## 2. Security Principles

The application must follow these principles:

1. Least-privilege access.
2. Role-based permissions.
3. Server-side authorization.
4. Secure credential storage.
5. Audit logging.
6. Human approval for sensitive external actions.
7. Source-of-truth protection.
8. No hardcoded secrets.
9. No client-side API keys.
10. Data export controls.
11. Clear separation between draft, reviewed, approved, and published data.
12. Financial and investor data protection.
13. Customer privacy protection.
14. AI usage logging and guardrails.
15. Supplier automation safety controls.

---

## 3. Authentication Requirements

The application must require login for all management areas.

Requirements:

- Secure session handling.
- Passwordless, OAuth, or password-based login depending on chosen auth provider.
- MFA support preferred for future.
- User status controls: active, invited, suspended, archived.
- Session expiration.
- Protected routes.
- Admin-only user management.

---

## 4. Recommended Roles

## 4.1 Super Admin

Full access to all modules, data, settings, integrations, users, roles, and audit logs.

## 4.2 Executive / Owner

Access to executive dashboard, financial summaries, AI analyst, reports, operations, marketing summaries, investor reporting, and opportunities.

## 4.3 Finance Manager

Access to financial imports, financial summaries, reports, variance analysis, monthly close, and finance-related tasks. Limited access to customer/order data where needed for financial reporting.

## 4.4 Operations Manager

Access to orders, fulfillment, supplier workflows, operational tasks, product/supplier information, and operations dashboards. Limited financial access unless granted.

## 4.5 Marketing Manager

Access to customers, segments, Mailchimp, campaigns, GA4 analytics, product promotion data, AI campaign drafting, and marketing tasks. Restricted access to full financial statements unless granted.

## 4.6 Product Manager

Access to products, catalog, supplier product mapping, pricing, images, categories, margin indicators, and product cleanup tasks.

## 4.7 Customer Service

Access to customer profiles, orders, order status, support tasks, and customer notes. Restricted from full financials, investor data, admin settings, and sensitive integrations.

## 4.8 Investor Relations

Access to approved financial summaries, investor records, investor reports, financing updates, and approved strategic materials. Restricted from raw accounting records unless granted.

## 4.9 External Advisor

Limited read-only access to selected reports, dashboards, or project materials. No exports unless granted. No integration or admin access.

## 4.10 Developer / Technical Admin

Access to technical logs, integration health, API configuration screens, and diagnostics. Should not automatically receive access to sensitive financial/investor content unless required and approved.

---

## 5. Permission Categories

Permissions should be granular and module-based.

### Dashboard

- dashboard.view
- dashboard.executive_view
- dashboard.financial_view
- dashboard.operations_view

### Orders

- orders.view
- orders.update
- orders.export
- orders.manage_exceptions
- orders.approve_external_update

### Customers

- customers.view
- customers.update
- customers.export
- customers.view_consent
- customers.manage_segments

### Products

- products.view
- products.update
- products.export
- products.manage_supplier_mapping
- products.approve_bigcommerce_update

### Suppliers

- suppliers.view
- suppliers.update
- suppliers.manage_portal_settings
- suppliers.view_credentials_reference
- suppliers.run_automation
- suppliers.approve_order_automation

### Financials

- financials.view_summary
- financials.view_detail
- financials.import
- financials.review
- financials.approve
- financials.export
- financials.manage_adjustments

### Marketing

- marketing.view
- marketing.manage_segments
- marketing.draft_campaign
- marketing.approve_campaign
- marketing.export_contacts
- marketing.sync_mailchimp

### Analytics

- analytics.view
- analytics.export
- analytics.manage_ga4_settings

### AI

- ai.use
- ai.use_financial_context
- ai.use_customer_context
- ai.use_investor_context
- ai.view_logs
- ai.approve_output

### Reports

- reports.view
- reports.generate
- reports.edit
- reports.approve
- reports.export
- reports.delete

### Tasks

- tasks.view
- tasks.create
- tasks.assign
- tasks.update
- tasks.complete
- tasks.delete

### Investor Relations

- investors.view
- investors.update
- investors.export
- investors.generate_update
- investors.approve_materials

### M&A / Opportunities

- opportunities.view
- opportunities.update
- opportunities.export
- opportunities.ai_analyze
- opportunities.mark_confidential

### Admin

- admin.manage_users
- admin.manage_roles
- admin.manage_permissions
- admin.manage_integrations
- admin.view_audit_logs
- admin.manage_system_settings

---

## 6. Sensitive Actions Requiring Approval

The following should require explicit approval workflows:

- Sending or approving customer marketing campaigns.
- Exporting customer lists.
- Pushing product changes to BigCommerce.
- Updating product prices externally.
- Updating fulfillment status externally.
- Running supplier order placement automation.
- Approving supplier order submissions.
- Creating financial report packages.
- Approving financial data for management reporting.
- Exporting financial reports.
- Generating investor-facing materials.
- Approving investor-facing materials.
- Deleting records.
- Changing integration settings.
- Rotating or modifying API credential references.
- Giving a user financial/admin/investor access.

---

## 7. Data Protection by Data Type

## 7.1 Customer Data

Protect:

- Email addresses.
- Phone numbers.
- Addresses.
- Order history.
- Consent status.
- Marketing engagement.
- Notes.

Controls:

- Limit export permissions.
- Log customer exports.
- Show consent status.
- Restrict bulk access to authorized roles.
- Protect customer reactivation workflows.

## 7.2 Financial Data

Protect:

- Revenue.
- Gross profit.
- Margins.
- EBITDA.
- Cash.
- AR/AP.
- Adjustments.
- QuickBooks imports.
- Management reports.

Controls:

- Finance/executive roles only by default.
- Approval status before investor/report use.
- Version financial imports.
- Keep management adjustments separate.
- Log report exports.

## 7.3 Supplier Data

Protect:

- Supplier portal details.
- Pricing.
- Cost data.
- Supplier SKU mapping.
- Portal credential references.
- Automation logs.

Controls:

- Secure credential storage.
- No raw passwords in database.
- Limit automation permissions.
- Log supplier automation runs.

## 7.4 Investor and M&A Data

Protect:

- Investor contacts.
- Financing pipeline.
- Acquisition targets.
- Strategic opportunity analysis.
- Valuation notes.
- Board/investor reports.

Controls:

- Role-based access.
- Confidential flags.
- Export logs.
- Approval status on investor materials.

## 7.5 AI Data

Protect:

- Prompts containing internal data.
- Outputs containing financial/customer/investor data.
- Model usage logs.
- Source references.

Controls:

- Role-based context building.
- Prompt/output logging.
- Approval before external use.
- Avoid sending unnecessary sensitive data to models.

---

## 8. API Credential Security

Requirements:

- Store API keys only in environment variables or secure secret manager.
- Do not store raw credentials in plain database fields.
- Store credential references where needed.
- Do not expose keys to client-side code.
- Rotate keys when needed.
- Log credential configuration changes.
- Limit admin access to integration settings.

---

## 9. Audit Logging Requirements

Log:

- Login events.
- Failed login attempts where available.
- User creation/update/deactivation.
- Role and permission changes.
- Data imports.
- Financial data approval.
- Report generation.
- Report export.
- Customer export.
- Supplier automation runs.
- AI prompt/output creation.
- External system updates.
- Integration setting changes.
- Deletions.

Each audit log should include:

- User.
- Action.
- Entity type.
- Entity ID.
- Timestamp.
- Before/after data where appropriate.
- IP/user agent where available.

---

## 10. AI Guardrails

AI must not be allowed to:

- Send emails.
- Push external system updates.
- Place supplier orders.
- Approve financial reports.
- Export customer data.
- Make accounting entries.
- Create investor-facing materials marked as approved.

AI may:

- Draft.
- Summarize.
- Recommend.
- Analyze.
- Classify.
- Explain.
- Prepare reports for review.

---

## 11. Supplier Automation Guardrails

Supplier automation must:

- Use secure credentials.
- Log each step.
- Capture evidence.
- Pause on mismatches.
- Require human approval before order submission unless workflow is explicitly approved for full automation.
- Provide manual override.
- Maintain retry/error logs.

---

## 12. Initial Permission Matrix

| Module | Executive | Finance | Operations | Marketing | Product | Customer Service | Investor Relations | External Advisor |
|---|---|---|---|---|---|---|---|---|
| Executive Dashboard | Full | Limited | Limited | Limited | Limited | No | Limited | Selected |
| Orders | View | Limited | Full | Limited | Limited | View/Update | No | No |
| Customers | View | Limited | View | Full | Limited | View/Update | No | No |
| Products | View | Limited | View | Limited | Full | View | No | No |
| Suppliers | View | No | Full | No | View/Update | No | No | No |
| Financials | Full | Full | Limited | No | Limited | No | Approved Only | Selected |
| Marketing | View | No | No | Full | Limited | No | No | No |
| Analytics | Full | Limited | Limited | Full | Limited | No | No | Selected |
| AI Analyst | Full | Finance Context | Ops Context | Marketing Context | Product Context | Limited | Approved Context | No/Selected |
| Reports | Full | Finance Reports | Ops Reports | Marketing Reports | Product Reports | No | Investor Reports | Selected |
| Tasks | Full | Full for own area | Full for own area | Full for own area | Full for own area | Full for own area | Full for own area | Selected |
| Investors | Full | Approved Financials | No | No | No | No | Full | Selected |
| Opportunities | Full | Limited | Limited | Limited | Limited | No | Limited | Selected |
| Admin | Full | No | No | No | No | No | No | No |

This matrix is a starting point and should be implemented through granular permissions.

