# CLAUDE.md Appendix - Batch 2 Post-MVP Buildout

**Instruction:** Append this section to the existing root `CLAUDE.md` file when the LifeSupply Command Center MVP is complete or when the product owner authorizes post-MVP planning.

---

## Batch 2 Post-MVP Documentation

After the MVP is complete, stabilized, and reconciled against source systems, use the following documents to guide the advanced buildout:

1. `/docs/09_AI_FEATURES_AND_GUARDRAILS.md`
2. `/docs/10_BROWSER_AUTOMATION_AND_SUPPLIER_WORKFLOWS.md`
3. `/docs/11_REPORTING_REQUIREMENTS.md`
4. `/docs/12_FINANCIAL_MANAGEMENT_REQUIREMENTS.md`
5. `/docs/13_DATA_GOVERNANCE_AND_AUDIT_LOGGING.md`
6. `/docs/14_DEVELOPMENT_STANDARDS.md`
7. `/docs/15_TESTING_AND_QA_PLAN.md`
8. `/docs/16_DEPLOYMENT_AND_ENVIRONMENT.md`
9. `/docs/17_PHASE_2_AUTOMATION_PLAN.md`
10. `/docs/18_PHASE_3_STRATEGIC_GROWTH_PLAN.md`

Do not build post-MVP features until the relevant document has been read and summarized.

---

## Post-MVP Build Discipline

The correct sequence after MVP is:

1. Stabilize the MVP.
2. Validate data against source systems.
3. Harden permissions, audit logs, and error handling.
4. Improve task and exception workflows.
5. Add controlled supplier automation.
6. Expand financial intelligence and reporting.
7. Expand AI analyst capabilities.
8. Add customer reactivation and marketing automation.
9. Add investor relations, capital raising, and M&A modules.
10. Add advanced forecasting and scenario planning.

---

## AI Rules After MVP

- AI may summarize, classify, draft, explain, compare, analyze, and recommend.
- AI must not execute sensitive actions without explicit approval.
- AI must not send customer communications, alter product prices, place supplier orders, update financial records, or export sensitive data unless an approved workflow permits it.
- AI outputs used for management, financial, investor, or customer-facing purposes must be logged.
- AI outputs should identify source data, assumptions, limitations, and confidence where practical.
- AI must distinguish facts from assumptions and recommendations.

---

## Supplier Automation Rules After MVP

- Supplier automation must begin as human-in-the-loop.
- Use Playwright or an equivalent controlled browser automation framework.
- Do not bypass security controls or violate supplier portal terms.
- Never store credentials in code or logs.
- Capture evidence for important automation steps, including screenshots where appropriate.
- Stop automation and create an exception when supplier price, stock, SKU, shipping, address, tax, or product details do not match expectations.
- Full automation may only be enabled after staged testing, management approval, and documented thresholds.

---

## Reporting Rules After MVP

- QuickBooks remains the accounting source of truth.
- The Command Center may create management-adjusted reporting, but adjustments must be visible, documented, and auditable.
- AI may draft commentary but should not replace management review.
- Board, investor, lender, and financing reports must go through approval before distribution.
- Exported reports should include versioning, generation date, data period, source systems, and approval status.

---

## Development Rules After MVP

- Implement advanced features through small, testable tickets.
- Do not mix supplier automation, financial reporting, and AI action workflows in the same large code change.
- Use feature flags for high-risk features.
- Add tests before enabling external write-back workflows.
- Add audit logs before enabling sensitive actions.
- Prefer mock/sandbox data until live credentials are confirmed.
- Any use of real customer, financial, investor, or supplier data must respect the security and permission model.
