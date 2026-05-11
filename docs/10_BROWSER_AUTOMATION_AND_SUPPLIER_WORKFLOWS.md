# 10 - Browser Automation and Supplier Workflows

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP requirements  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, operations team, product owner

---

## 1. Purpose

This document defines the post-MVP browser automation and supplier workflow requirements for the LifeSupply Command Center.

The platform is expected to support suppliers that do not provide reliable APIs. In those cases, the Command Center may use controlled browser automation, likely through Playwright, to interact with supplier portals for stock checks, price checks, order preparation, order placement, confirmation capture, and fulfillment updates.

Supplier automation is a high-value feature, but it must be implemented carefully. The first version must be human-in-the-loop, auditable, and exception-based.

---

## 2. Core Principle

> Supplier automation should reduce manual work without removing management control, operational oversight, or auditability.

The system should not start by blindly placing orders. It should first assist staff by collecting data, preparing actions, identifying exceptions, and asking for approval.

---

## 3. Scope

### 3.1 Included

- Supplier portal login using secure credential handling.
- Product/SKU search.
- Supplier stock availability check.
- Supplier price check.
- Shipping method and cost check where available.
- Supplier order preparation.
- Human approval before submission.
- Order submission for approved workflows.
- Confirmation number capture.
- Screenshot capture.
- Exception creation.
- Audit logging.
- BigCommerce status update recommendations.
- Internal task creation.

### 3.2 Excluded from Initial Supplier Automation

- Fully autonomous ordering without approval.
- Bypassing supplier security or access controls.
- Scraping sites where legal or contractual restrictions prohibit it.
- Automated changes to supplier records without approval.
- Automated customer refunds.
- Automated accounting entries.
- Automated financial adjustments.

---

## 4. Supplier Automation Architecture

Recommended architecture:

```text
Command Center UI
  -> Supplier Automation Request
  -> Automation Queue
  -> Playwright Worker
  -> Supplier Portal Session
  -> Validation Engine
  -> Human Approval Gate
  -> Supplier Submission
  -> Confirmation Capture
  -> Audit Log / Task / Order Update
```

### 4.1 Core Components

| Component | Purpose |
|---|---|
| Supplier Automation UI | Allows users to review and trigger automation workflows |
| Automation Queue | Stores pending automation jobs |
| Playwright Worker | Runs browser sessions server-side |
| Credential Vault | Stores supplier credentials securely |
| Validation Engine | Compares supplier data against internal expectations |
| Approval Gate | Requires human approval for sensitive steps |
| Evidence Store | Saves screenshots and confirmation artifacts |
| Audit Log | Records all automation actions |
| Exception Engine | Creates tasks when automation cannot safely continue |

---

## 5. Human-in-the-Loop Stages

Supplier automation should progress through controlled maturity stages.

| Stage | Name | Description |
|---|---|---|
| 1 | Assisted Review | System opens supplier workflow and gathers stock/price data, but user performs final action |
| 2 | Prepared Order | System fills order fields and pauses for user approval |
| 3 | Approved Submission | User approves; system submits order and captures confirmation |
| 4 | Rule-Based Auto-Submission | Low-risk orders are submitted if all thresholds are met |
| 5 | Exception-Only Review | Staff only review orders with failed validations or high-risk attributes |

The system should not proceed beyond Stage 3 without documented management approval and successful testing.

---

## 6. Supplier Credential Handling

Supplier portal credentials are sensitive and must be protected.

### 6.1 Requirements

- Do not store supplier passwords in code.
- Do not expose credentials in client-side JavaScript.
- Store credentials in encrypted secret management.
- Restrict credential access to server-side automation workers.
- Do not write credentials to logs.
- Mask credentials in UI.
- Log credential usage without revealing the credential.
- Support credential rotation.
- Support separate credentials per supplier and environment.

### 6.2 Recommended Fields

```text
supplier_credentials
  id
  supplier_id
  credential_name
  username_encrypted
  password_secret_ref
  mfa_required
  status
  last_verified_at
  last_used_at
  created_by
  created_at
  updated_at
```

Where possible, use references to a vault rather than storing encrypted secrets in the application database.

---

## 7. Supplier Product Mapping

Automation depends on accurate product mapping.

### 7.1 Required Mapping Fields

```text
supplier_products
  id
  supplier_id
  internal_product_id
  internal_variant_id
  internal_sku
  supplier_sku
  supplier_product_url
  supplier_product_name
  supplier_unit_cost
  supplier_pack_size
  supplier_uom
  supplier_status
  last_price_checked_at
  last_stock_checked_at
  last_automation_status
```

### 7.2 Mapping Rules

- Do not automate orders for products without confirmed supplier SKU mapping.
- Do not automate orders where supplier pack size differs from internal product unit of measure without explicit rule mapping.
- Do not automate when supplier product name materially differs from internal product name unless manually approved.
- Do not automate if supplier status is inactive, discontinued, or unknown.

---

## 8. Core Supplier Workflows

## 8.1 Supplier Stock Check Workflow

### Purpose

Determine whether a supplier product is available before order processing or campaign promotion.

### Steps

1. User or scheduler creates stock check job.
2. System loads supplier product mapping.
3. Playwright worker logs into supplier portal.
4. Worker searches by supplier SKU or product URL.
5. Worker captures stock status.
6. System compares stock status to internal expectation.
7. System stores stock snapshot.
8. If unavailable, system creates exception or warning.

### Outputs

- Stock status.
- Timestamp.
- Supplier source reference.
- Screenshot if useful.
- Exception if stock status is unavailable or unclear.

---

## 8.2 Supplier Price Check Workflow

### Purpose

Compare supplier portal pricing to internal cost expectations.

### Steps

1. Load internal supplier cost.
2. Search supplier portal product.
3. Capture current supplier price.
4. Compare supplier portal price to internal expected cost.
5. Apply tolerance threshold.
6. Update price snapshot.
7. Create exception if variance exceeds threshold.

### Suggested Thresholds

| Variance | Action |
|---|---|
| 0% to 2% | Accept and log |
| 2% to 5% | Warn user, allow approval |
| Greater than 5% | Require manual review |
| Any negative-margin result | Block automation and escalate |

Thresholds should be configurable by supplier, product category, or management setting.

---

## 8.3 Supplier Order Preparation Workflow

### Purpose

Prepare an order in the supplier portal while pausing before final submission.

### Steps

1. Internal order is selected for supplier processing.
2. System validates order eligibility.
3. System validates supplier product mapping.
4. System validates customer shipping address.
5. System checks stock.
6. System checks supplier price.
7. System calculates expected margin.
8. System logs into supplier portal.
9. System fills required fields.
10. System captures review screen.
11. System pauses for human approval.

### Human Approval Screen Should Show

- BigCommerce order number.
- Customer name and shipping address.
- Internal SKU and product name.
- Supplier SKU and product name.
- Order quantity.
- Internal selling price.
- Expected supplier cost.
- Actual supplier portal price.
- Expected gross margin.
- Shipping method and cost, if available.
- Tax/fees, if available.
- Any warnings.
- Screenshot of supplier review page.

---

## 8.4 Supplier Order Submission Workflow

### Purpose

Submit an approved supplier order and capture confirmation.

### Steps

1. Authorized user approves prepared order.
2. System confirms approval permissions.
3. Worker resumes supplier portal session or recreates session.
4. Worker submits order.
5. Worker captures confirmation page.
6. System extracts confirmation number.
7. System saves screenshot.
8. System updates internal order status.
9. System creates fulfillment event.
10. System may recommend BigCommerce status update.

### Required Confirmation Evidence

- Confirmation number.
- Confirmation page screenshot.
- Submission timestamp.
- Supplier account used.
- Internal order reference.
- User who approved.
- Worker run ID.

---

## 8.5 Fulfillment Status Check Workflow

### Purpose

Check supplier portal for shipment or fulfillment updates.

### Steps

1. Scheduled job identifies supplier orders needing update.
2. Worker logs into supplier portal.
3. Worker searches by confirmation number or order reference.
4. Worker captures order status.
5. Worker extracts tracking number if available.
6. System updates internal fulfillment event.
7. System creates task if delayed or status is unclear.
8. System recommends BigCommerce update where appropriate.

---

## 9. Automation Eligibility Rules

An order is eligible for supplier automation only if all required conditions are met.

### Required Conditions

- Order is paid or otherwise approved for processing.
- Product has confirmed supplier mapping.
- Supplier credentials are active.
- Product is in stock or available.
- Supplier price is within tolerance.
- Order margin is above minimum threshold.
- Shipping address is valid.
- Quantity is within automation limit.
- Order value is within automation limit.
- No fraud, payment, or customer service hold exists.
- No manual review flag exists.

### Automatic Disqualification

Automation must stop when:

- Supplier product cannot be found.
- Supplier price exceeds threshold.
- Product is out of stock.
- SKU mismatch occurs.
- Product description materially differs.
- Shipping address fails validation.
- Margin is below threshold.
- Supplier portal shows unexpected fees.
- Portal login fails.
- CAPTCHA or MFA prevents automation.
- The page layout has changed materially.
- Confirmation cannot be captured.

---

## 10. Exception Taxonomy

Exceptions should be standardized.

Suggested exception categories:

| Category | Description |
|---|---|
| `supplier_login_failed` | Supplier portal login did not succeed |
| `mfa_required` | MFA required and cannot be completed automatically |
| `product_not_found` | Supplier product/SKU could not be located |
| `sku_mismatch` | Supplier product does not match internal SKU mapping |
| `price_mismatch` | Supplier portal price differs from expected cost beyond threshold |
| `stock_unavailable` | Product is out of stock or unavailable |
| `shipping_issue` | Shipping address or method problem |
| `margin_below_threshold` | Expected margin is too low |
| `portal_layout_changed` | Automation selectors failed or page changed |
| `confirmation_missing` | Order may have been submitted but confirmation was not captured |
| `manual_review_required` | General manual review needed |

---

## 11. Audit Logging

Every supplier automation run must be logged.

Suggested fields:

```text
automation_runs
  id
  supplier_id
  workflow_type
  order_id
  user_id
  status
  started_at
  completed_at
  duration_ms
  approval_required
  approved_by
  approved_at
  error_code
  error_message
  screenshot_refs
  confirmation_number
  source_url
  worker_version
  created_at
```

Do not log passwords, tokens, or sensitive authentication details.

---

## 12. Evidence Storage

Store screenshots and artifacts for important workflow steps.

### Evidence Types

- Login success screenshot, if appropriate and not exposing sensitive information.
- Product match screenshot.
- Price/stock screenshot.
- Order review page screenshot.
- Confirmation page screenshot.
- Shipment status screenshot.
- Error page screenshot.

### Evidence Rules

- Screenshots should be stored securely.
- Screenshots may contain customer information and must follow permission rules.
- Evidence should be linked to automation run, order, and supplier.
- Evidence should have retention rules.

---

## 13. UI Requirements

### 13.1 Supplier Automation Dashboard

The dashboard should show:

- Pending automation jobs.
- Jobs awaiting approval.
- Jobs running.
- Completed jobs.
- Failed jobs.
- Exceptions.
- Supplier status.
- Recent screenshots/evidence.
- Average automation success rate.
- Time saved estimate.

### 13.2 Order Automation Detail Page

The order automation detail page should show:

- Order details.
- Customer shipping details.
- Product and supplier mapping.
- Expected price and supplier price.
- Expected margin.
- Stock status.
- Validation checklist.
- Warnings.
- Approval buttons.
- Automation log timeline.
- Evidence screenshots.

---

## 14. Approval Requirements

Human approval is required for:

- First-time supplier automation for a supplier.
- First-time automation for a product/SKU.
- Any price variance beyond threshold.
- Any margin below threshold.
- Any address validation concern.
- Any order above configured value threshold.
- Any order with multiple supplier products.
- Any portal layout or selector warning.
- Any order submission in early automation stages.

---

## 15. Retry Rules

Retry logic must be conservative.

### Permitted retries

- Temporary network failure.
- Page load timeout.
- Supplier search timeout.
- Non-submission steps only.

### Restricted retries

Do not automatically retry final order submission unless the system can confirm no duplicate order was created.

If order submission status is unclear, create an urgent manual review exception.

---

## 16. Supplier Portal Change Detection

Portals may change layouts. Automation must detect this.

Signals of portal change:

- Required selector missing.
- Unexpected page title.
- Unexpected form fields.
- Missing product match field.
- Confirmation page not recognized.
- Login flow changed.

When detected:

1. Stop automation.
2. Create exception.
3. Capture screenshot.
4. Notify technical admin.
5. Disable affected workflow if needed.

---

## 17. Legal and Relationship Controls

Before automating a supplier portal, management should confirm that the workflow is permissible under supplier relationship terms and applicable policies.

Implementation should avoid:

- Circumventing access controls.
- Excessive request rates.
- Collecting unrelated supplier data.
- Interfering with supplier systems.
- Using credentials outside authorized business purposes.

The system should behave like a controlled digital assistant acting for an authorized user, not like unauthorized scraping.

---

## 18. Phase Implementation Plan

### Automation Phase 1: Data Readiness

- Supplier table.
- Supplier product mappings.
- Cost and stock snapshots.
- Manual supplier status fields.
- Basic automation run logs.

### Automation Phase 2: Stock and Price Checks

- Login workflow.
- Product lookup.
- Price extraction.
- Stock extraction.
- Screenshot capture.
- Exception creation.

### Automation Phase 3: Order Preparation

- Order eligibility engine.
- Address validation checklist.
- Portal form fill.
- Human approval screen.
- Prepared order evidence.

### Automation Phase 4: Approved Submission

- Approval workflow.
- Controlled submission.
- Confirmation capture.
- Internal fulfillment update.
- BigCommerce update recommendation.

### Automation Phase 5: Selected Auto-Submission

Only after successful testing and management approval:

- Low-risk order auto-submission.
- Threshold-based controls.
- Continuous monitoring.
- Exception-only review.

---

## 19. Success Metrics

Track:

- Number of orders assisted by automation.
- Number of orders submitted through automation.
- Automation success rate.
- Exception rate by supplier.
- Average time saved per order.
- Price mismatch frequency.
- Stock mismatch frequency.
- Manual review frequency.
- Duplicate or failed order incidents.
- Supplier portal change incidents.

---

## 20. Acceptance Criteria

Supplier automation is acceptable when:

- Credentials are secure.
- All runs are logged.
- Screenshots/evidence are stored for key steps.
- Human approval is required for order submission in early stages.
- Price, stock, SKU, margin, shipping, and address validations are performed.
- Exceptions are created automatically when automation cannot safely continue.
- Retrying final submission does not create duplicate order risk.
- Automation respects user permissions.
- Technical admins can disable supplier workflows quickly.
