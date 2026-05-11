# 13 - Data Governance and Audit Logging

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP requirements  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, technical lead, finance team, operations team, product owner

---

## 1. Purpose

This document defines data governance and audit logging requirements for the LifeSupply Command Center.

The Command Center will handle sensitive and commercially important data, including customer records, product data, financial information, supplier portal activity, marketing activity, investor information, AI-generated outputs, and strategic opportunities. The system must therefore be built around reliable data ownership, validation, lineage, permission control, and auditability.

---

## 2. Governance Principles

The Command Center should follow these principles:

1. Source systems remain authoritative for their own domains.
2. Imported data must include source references and sync timestamps.
3. Manual overrides must be visible and auditable.
4. Sensitive actions must be logged.
5. AI outputs must be traceable.
6. Supplier automation must preserve evidence.
7. Reports must identify data sources and period coverage.
8. Data quality issues should create exceptions or warnings.
9. External write-backs should require permission and approval.
10. The system should prefer transparency over silent corrections.

---

## 3. Source-of-Truth Rules

| Data Domain | Source of Truth | Command Center Role |
|---|---|---|
| Accounting records | QuickBooks Online | Import, summarize, analyze, report |
| E-commerce orders | BigCommerce | Import, monitor, create workflows |
| Product catalog | BigCommerce plus internal master product table | Normalize, score, recommend improvements |
| Supplier cost and availability | Supplier portals / supplier files | Capture snapshots, compare, create exceptions |
| Email subscription status | Mailchimp | Import, segment, respect consent |
| Website analytics | GA4 | Import, report, attribute trends |
| Tasks and workflows | Command Center | Primary source |
| AI outputs | Command Center | Primary source |
| Investor CRM | Command Center | Primary source unless external CRM added |
| M&A opportunities | Command Center | Primary source |

---

## 4. Data Lifecycle

Data should move through a controlled lifecycle.

```text
Source System
  -> Import / Sync / Upload
  -> Validation
  -> Normalization
  -> Storage
  -> Reporting / Workflow / AI Use
  -> Review / Approval
  -> Archive / Supersede
```

Every major data import should have:

- Source system.
- Import timestamp.
- Import method.
- Imported by user or system.
- Record count.
- Error count.
- Warning count.
- Status.

---

## 5. Data Import Logging

Suggested table:

```text
data_import_runs
  id
  source_system
  import_type
  status
  started_at
  completed_at
  records_received
  records_created
  records_updated
  records_skipped
  errors_count
  warnings_count
  triggered_by
  job_id
  notes
```

Import statuses:

- Pending.
- Running.
- Completed.
- Completed with warnings.
- Failed.
- Cancelled.
- Superseded.

---

## 6. Data Validation

Validation rules should exist for each major data type.

### 6.1 Order Validation

Check:

- Order ID present.
- Customer ID present.
- Order date present.
- Currency present.
- Order total matches item totals within tolerance.
- Payment status recognized.
- Fulfillment status recognized.
- Product SKUs mapped where possible.

### 6.2 Product Validation

Check:

- Product ID present.
- SKU present.
- Product name present.
- Category present or flagged.
- Price present.
- Supplier mapping present where applicable.
- Cost present where margin analysis is required.
- Image present or flagged.

### 6.3 Customer Validation

Check:

- Customer ID or email present.
- Duplicate email detection.
- Marketable status.
- Consent/subscription status.
- Last order date.
- Customer type classification.

### 6.4 Financial Validation

Check:

- Financial period defined.
- Account mapping exists.
- Debits/credits or imported balances reconcile where applicable.
- P&L totals match source import.
- Adjustments are separately stored.
- Closed periods are protected.

---

## 7. Duplicate Handling

The system should not silently merge important records without traceability.

### Customer Duplicate Rules

Potential matches:

- Same email.
- Same phone.
- Same name and address.
- Same BigCommerce customer ID.

For customer duplicates:

- Auto-link exact source ID matches.
- Suggest potential duplicates for review.
- Preserve source records.
- Maintain mapping table.

### Product Duplicate Rules

Potential matches:

- Same SKU.
- Same supplier SKU.
- Similar product name.
- Same UPC/GTIN if available.

Do not auto-merge product records if SKU or supplier mapping is ambiguous.

---

## 8. Manual Overrides

Manual overrides are sometimes necessary, but they must be controlled.

Examples:

- Correcting supplier cost.
- Marking customer type.
- Overriding product category.
- Updating strategic priority.
- Adding management adjustment.
- Marking report as approved.

Manual overrides should include:

- User.
- Timestamp.
- Field changed.
- Previous value.
- New value.
- Reason.
- Approval status if required.

---

## 9. Audit Logging Framework

The platform should implement a general-purpose audit log.

Suggested table:

```text
audit_logs
  id
  actor_user_id
  actor_role
  action_type
  entity_type
  entity_id
  previous_value_json
  new_value_json
  reason
  ip_address
  user_agent
  source
  approval_id
  created_at
```

### 9.1 Action Types

- `created`
- `updated`
- `deleted`
- `archived`
- `exported`
- `approved`
- `rejected`
- `login`
- `logout`
- `sync_started`
- `sync_completed`
- `sync_failed`
- `ai_generated`
- `automation_started`
- `automation_completed`
- `automation_failed`
- `external_update_requested`
- `external_update_completed`

---

## 10. Sensitive Actions Requiring Audit Logs

Always audit:

- User role changes.
- Permission changes.
- API credential changes.
- Customer data exports.
- Financial data exports.
- Report approvals.
- Investor report generation.
- Management adjustments.
- BigCommerce write-back actions.
- Mailchimp segment or campaign export actions.
- Supplier automation approvals.
- Supplier order submissions.
- AI-generated financial commentary.
- AI-generated investor materials.
- Deletion or archival of records.

---

## 11. AI Output Governance

AI outputs must be governed because they may influence decisions.

### Required Metadata

- User who initiated AI task.
- Model provider and model name.
- Prompt template version.
- Source data references.
- Output text or JSON.
- Assumptions.
- Warnings.
- Approval status.
- Approved by.
- Report or task association.

### AI Output States

- Draft.
- Pending review.
- Approved.
- Rejected.
- Superseded.
- Archived.

---

## 12. Supplier Automation Governance

Supplier automation must preserve an auditable trail.

Log:

- Supplier.
- Workflow type.
- Order ID.
- User who triggered.
- User who approved.
- Worker run ID.
- Start/end time.
- Validation checks.
- Error messages.
- Screenshots.
- Confirmation number.
- Final status.

---

## 13. Report Governance

Reports should include versioning.

Suggested table:

```text
reports
  id
  report_type
  reporting_period_start
  reporting_period_end
  version
  status
  generated_by
  approved_by
  approved_at
  pdf_file_ref
  xlsx_file_ref
  source_data_refs
  ai_output_refs
  created_at
```

Reports must not be overwritten without preserving prior versions.

---

## 14. Data Quality Scoring

The platform should eventually score data quality by domain.

### Product Data Quality

Inputs:

- SKU completeness.
- Category completeness.
- Supplier mapping.
- Cost presence.
- Image presence.
- Description quality.
- Active/inactive status.

### Customer Data Quality

Inputs:

- Email presence.
- Duplicate status.
- Consent status.
- Customer type.
- Last order date.
- Purchase history completeness.

### Financial Data Quality

Inputs:

- QuickBooks sync status.
- Period close status.
- Account mapping completeness.
- Adjustment approval status.
- Reconciliation warnings.

---

## 15. Data Retention

Retention rules should be configurable, but defaults should be conservative.

Suggested retention:

- Audit logs: long-term retention.
- Financial reports: long-term retention.
- AI outputs used in reports: long-term retention.
- Supplier automation screenshots: retain according to operational need and privacy controls.
- Import run logs: retain long enough for troubleshooting and audit.
- Temporary files: expire automatically.

Do not delete records required for financial, legal, operational, or audit purposes without approved retention policy.

---

## 16. Privacy and Access Controls

Data access must follow role-based permission rules.

### Customer Data

Restrict:

- Full customer export.
- Email lists.
- Phone numbers.
- Addresses.
- Order history for non-authorized roles.

### Financial Data

Restrict:

- Full P&L.
- Balance sheet.
- Cash balances.
- Adjusted EBITDA.
- Budget and forecast.
- Investor reports.

### Investor Data

Restrict:

- Investor names.
- Notes.
- Contact history.
- Financing status.
- Data room access.

---

## 17. Error Handling and Incident Logging

Data incidents should be logged when:

- Integration sync fails.
- Import produces unexpected record counts.
- Financial totals do not reconcile.
- Duplicate records spike.
- Supplier automation fails after submission attempt.
- Customer export is attempted without permission.
- AI output uses stale data.
- Report is generated with missing source data.

Incident records should include:

- Severity.
- Affected system.
- Description.
- Detected by.
- Assigned to.
- Status.
- Resolution notes.

---

## 18. Backup and Recovery Governance

The system should support:

- Regular database backups.
- Backup retention policy.
- Restore testing.
- File storage backup or versioning.
- Disaster recovery runbook.
- Audit log preservation.

---

## 19. Acceptance Criteria

Data governance and audit logging are acceptable when:

- Source-of-truth rules are implemented.
- Import runs are logged.
- Sensitive actions are audited.
- Manual overrides preserve previous values.
- AI outputs are logged and status-controlled.
- Supplier automation has evidence and audit trails.
- Reports are versioned.
- Permissions control data visibility.
- Data quality warnings are visible to users.
- Deleted or superseded records remain traceable where required.
