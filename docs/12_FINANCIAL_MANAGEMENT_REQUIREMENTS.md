# 12 - Financial Management Requirements

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP requirements  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, finance team, product owner

---

## 1. Purpose

This document defines the deeper financial management requirements for the LifeSupply Command Center after the MVP stage.

The financial module should evolve from a basic dashboard into a structured management reporting, variance analysis, budget, forecast, EBITDA, working capital, and investor-support system.

The platform should not replace QuickBooks Online as the accounting system of record. The Command Center should be the management reporting, analysis, normalization, dashboard, and commentary layer.

---

## 2. Core Financial Principle

> QuickBooks is the accounting source of truth. The Command Center is the management intelligence and reporting layer.

The Command Center may store imported QuickBooks data, management adjustments, budget data, forecasts, and normalized reporting views, but it must preserve source references and distinguish imported accounting data from management-calculated figures.

---

## 3. Financial Reporting Objectives

The financial module should help management:

- Understand consolidated performance.
- Compare divisions and geographies.
- Track revenue, gross profit, gross margin, operating expenses, EBITDA, and cash.
- Monitor receivables, payables, and working capital.
- Compare actual results to budget, forecast, prior period, and prior year.
- Identify margin pressure and cost drivers.
- Prepare monthly management reports.
- Prepare board and investor reporting packages.
- Support financing, lender, and M&A discussions.

---

## 4. Required Financial Dimensions

The financial model should support multiple dimensions.

### 4.1 Business Unit / Division

Examples:

- LifeSupply consolidated.
- LifeSupply.ca.
- Wellmart Medical.
- LifeSupply U.S.
- Balkowitsch or other U.S. operations.
- Head office / corporate.

### 4.2 Geography

Examples:

- Canada.
- United States.
- Consolidated.

### 4.3 Channel

Examples:

- B2B / institutional.
- Retail e-commerce.
- Amazon or marketplace.
- Dropship.
- Direct supplier fulfillment.

### 4.4 Product Category

Examples:

- Mobility.
- Wound care.
- Incontinence.
- Daily living aids.
- Medical equipment.
- Consumables.

These categories should be configurable.

---

## 5. Financial Data Sources

### 5.1 QuickBooks Online

Primary accounting source.

Data to import:

- Profit and loss summaries.
- Balance sheet summaries.
- Account balances.
- Transactions where needed.
- Customers and vendors where applicable.
- Classes/locations if configured.
- Receivables.
- Payables.
- Bank/cash balances where available.

### 5.2 BigCommerce

Operational sales and order source.

Data to use:

- Order revenue.
- Discounts.
- Taxes.
- Shipping revenue.
- Product-level sales.
- Customer sales.
- Refunds and returns where available.

### 5.3 Supplier Data

Used for margin analysis.

Data to use:

- Supplier costs.
- Actual supplier order cost.
- Shipping costs.
- Price variance.
- Stock availability.

### 5.4 Management Inputs

Used for budgets, forecasts, adjustments, and commentary.

Examples:

- Budget assumptions.
- Forecast assumptions.
- Add-backs.
- Normalization adjustments.
- One-time costs.
- Pro forma adjustments.
- Capital raise assumptions.

---

## 6. Financial Period Model

The system should use defined financial periods.

Suggested table:

```text
financial_periods
  id
  fiscal_year
  fiscal_month
  period_start
  period_end
  status
  qbo_synced_at
  bigcommerce_synced_at
  closed_by
  closed_at
  notes
```

Suggested period statuses:

- Open.
- Data imported.
- Under review.
- Closed internally.
- Approved for management reporting.
- Superseded.

---

## 7. Core Financial Dashboards

### 7.1 Executive Financial Dashboard

Should show:

- Revenue.
- Gross profit.
- Gross margin.
- Operating expenses.
- EBITDA.
- Adjusted EBITDA.
- Net income or loss.
- Cash.
- Receivables.
- Payables.
- Working capital.
- Month-over-month change.
- Year-over-year change.
- Budget variance.
- Forecast variance.

### 7.2 Division Financial Dashboard

Should show performance by division/business unit.

Metrics:

- Revenue.
- Gross profit.
- Gross margin.
- Operating expenses.
- Contribution margin.
- EBITDA contribution.
- Order count.
- Average order value.

### 7.3 Canada / U.S. Financial Dashboard

Should show:

- Canada sales.
- U.S. sales.
- Canada gross profit.
- U.S. gross profit.
- Canada net income.
- U.S. net income.
- Geographic mix.
- Year-over-year changes.

### 7.4 Product Margin Dashboard

Should show:

- Gross margin by SKU.
- Gross margin by category.
- Gross margin by supplier.
- Low-margin SKUs.
- Negative-margin SKUs.
- Supplier cost changes.
- Price increase candidates.

---

## 8. P&L Reporting Requirements

The system should support P&L reporting at:

- Consolidated level.
- Division level.
- Geography level.
- Store/channel level where possible.
- Monthly, quarterly, annual, and TTM periods.

### Required P&L Categories

- Revenue.
- Discounts/returns.
- Net sales.
- Cost of goods sold.
- Gross profit.
- Gross margin.
- Sales and marketing expenses.
- Fulfillment and shipping expenses.
- Administrative expenses.
- Technology expenses.
- Professional fees.
- Payroll or contractor costs.
- Head office costs.
- EBITDA.
- Depreciation/amortization if available.
- Interest.
- Taxes.
- Net income/loss.

---

## 9. EBITDA and Adjusted EBITDA

The system should support both EBITDA and management-adjusted EBITDA.

### 9.1 EBITDA

EBITDA should be calculated consistently from imported financial data.

### 9.2 Adjusted EBITDA

Adjusted EBITDA may include management-approved adjustments such as:

- One-time professional fees.
- Acquisition-related costs.
- Non-recurring restructuring costs.
- Owner discretionary expenses, if applicable and approved.
- Non-cash charges.
- Startup or platform development costs, where appropriate.

### 9.3 Required Controls

- Adjustments must be listed separately.
- Each adjustment must have a description.
- Each adjustment must have an amount.
- Each adjustment must have a period.
- Each adjustment must have an approval status.
- Each adjustment must identify whether it is recurring or non-recurring.
- Investor-facing adjusted EBITDA requires approval.

Suggested table:

```text
financial_adjustments
  id
  financial_period_id
  adjustment_type
  amount
  description
  recurring_status
  source_reference
  created_by
  approval_status
  approved_by
  approved_at
  created_at
```

---

## 10. Budgeting Requirements

The system should support budget entry and comparison.

### Budget Features

- Annual budget.
- Monthly budget.
- Division budget.
- Revenue budget.
- Gross margin budget.
- Expense budget.
- EBITDA budget.
- Budget notes and assumptions.
- Budget versioning.

### Budget vs Actual

For each period, show:

- Actual.
- Budget.
- Variance amount.
- Variance percentage.
- AI-generated commentary.
- Management-approved explanation.

---

## 11. Forecasting Requirements

Forecasting should be introduced after reliable historical data is available.

### Forecast Types

- Revenue forecast.
- Gross profit forecast.
- Expense forecast.
- Cash flow forecast.
- EBITDA forecast.
- Working capital forecast.
- Campaign-driven revenue forecast.
- Customer reactivation forecast.
- Supplier cost increase scenario.
- Acquisition impact scenario.

### Forecast Controls

- Forecasts should be versioned.
- Assumptions should be visible.
- Forecasts should not be treated as actual results.
- AI may assist but should not silently create final forecasts.

---

## 12. Variance Analysis

The system should support multiple variance views.

### Required Comparisons

- Current month vs prior month.
- Current month vs same month prior year.
- Year-to-date vs prior year-to-date.
- Actual vs budget.
- Actual vs forecast.
- TTM vs prior TTM.
- Canada vs U.S.
- Division vs division.
- Supplier vs supplier.
- Product category vs product category.

### Variance Commentary

AI may draft explanations, but the system should calculate the variance first.

Example calculated fields:

```text
variance_amount = actual_amount - comparison_amount
variance_percent = variance_amount / comparison_amount
```

The AI should not invent variance drivers. It should use supporting operational data where possible.

---

## 13. Working Capital Dashboard

Should show:

- Cash.
- Accounts receivable.
- Accounts payable.
- Inventory or supplier obligations where available.
- Credit card balances if imported.
- Current assets.
- Current liabilities.
- Working capital.
- Days sales outstanding.
- Payables aging.
- Cash runway estimate, if applicable.

---

## 14. Monthly Close Checklist

The platform should support a monthly close checklist.

### Example Close Tasks

- Confirm BigCommerce orders imported.
- Confirm refunds imported.
- Confirm QuickBooks P&L imported.
- Confirm balance sheet imported.
- Confirm bank accounts reconciled in QuickBooks.
- Confirm supplier invoices reviewed.
- Confirm major accruals reviewed.
- Confirm payroll/contractor costs reviewed.
- Confirm head office allocations reviewed.
- Confirm management adjustments reviewed.
- Confirm month marked as internally closed.
- Generate monthly management report.

### Close Checklist Fields

```text
monthly_close_tasks
  id
  financial_period_id
  task_name
  assigned_to
  due_date
  status
  completed_by
  completed_at
  notes
```

---

## 15. Reconciliation Requirements

Post-MVP, the system should support reconciliation checks.

### BigCommerce to QuickBooks

Compare:

- Gross sales.
- Refunds.
- Discounts.
- Taxes.
- Shipping.
- Net revenue.

### Supplier Costs to COGS

Compare:

- Supplier order costs.
- Expected COGS.
- QuickBooks COGS accounts.
- Margin differences.

### Mailchimp/GA4 to Sales

Compare:

- Campaign clicks.
- Website sessions.
- Attributed sales.
- Promo code revenue.

---

## 16. Financial Permissions

Financial data must be role-controlled.

| Function | Required Role |
|---|---|
| View executive financial dashboard | Executive, Finance Manager |
| View full P&L | Executive, Finance Manager |
| View product margin | Executive, Finance Manager, Product Manager |
| View cash and working capital | Executive, Finance Manager |
| Create management adjustment | Finance Manager, Executive |
| Approve management adjustment | Executive, Finance Manager if permitted |
| Generate investor financial report | Executive, Investor Relations with approval |
| Export financial schedules | Executive, Finance Manager |

---

## 17. AI Financial Commentary Rules

AI may draft commentary for:

- Revenue trends.
- Margin trends.
- Expense changes.
- EBITDA changes.
- Working capital changes.
- Budget variances.
- Forecast variances.

AI must:

- Use calculated values.
- Identify unaudited data.
- State when data is incomplete.
- Avoid definitive audit/accounting conclusions.
- Require approval before external use.

---

## 18. Financial Report Acceptance Criteria

The financial management module is acceptable when:

- QuickBooks data imports successfully or can be uploaded consistently.
- Financial periods are defined and status controlled.
- Dashboards show revenue, gross profit, margin, expenses, EBITDA, cash, receivables, payables, and working capital.
- Division and geography views are supported.
- Management adjustments are visible and auditable.
- Budget vs actual and forecast vs actual views exist.
- Monthly close checklist exists.
- Reports distinguish accounting data from management adjustments.
- Financial exports require proper permissions.
- AI commentary is draft until approved.
