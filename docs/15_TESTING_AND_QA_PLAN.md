# 15 - Testing and QA Plan

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP requirements  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, QA reviewers, product owner

---

## 1. Purpose

This document defines the testing and QA plan for the LifeSupply Command Center.

The application will handle operational, financial, customer, supplier, marketing, AI, and investor-related data. Testing must therefore focus not only on whether screens load, but whether data is accurate, permissions are enforced, workflows are auditable, and external actions are controlled.

---

## 2. Testing Philosophy

The testing strategy should follow these principles:

- Test critical business logic.
- Test permissions server-side.
- Test data imports and mappings.
- Test financial calculations.
- Test external integration mappers with fixtures.
- Test AI structured outputs.
- Test supplier automation in sandbox/mock mode before live mode.
- Test report generation and approval workflows.
- Test failure paths, not just happy paths.
- Make it safe to refactor.

---

## 3. Test Categories

The project should include:

1. Unit tests.
2. Integration tests.
3. API tests.
4. Permission tests.
5. Database tests.
6. External integration mapper tests.
7. AI output validation tests.
8. Browser automation tests.
9. End-to-end UI tests.
10. Manual QA checklists.
11. Financial reconciliation tests.
12. Release readiness tests.

---

## 4. Recommended Tools

Recommended tools may include:

- Vitest for unit and integration tests.
- React Testing Library for component tests.
- Playwright for end-to-end browser tests.
- Prisma test database for database tests.
- Mock Service Worker or equivalent for API mocks.
- Zod or similar schema validation for input/output tests.
- CI checks through GitHub Actions or equivalent.

---

## 5. Unit Tests

Unit tests should cover:

- Financial calculations.
- Gross margin calculations.
- EBITDA calculations.
- Variance calculations.
- Customer segmentation logic.
- Product scoring logic.
- Supplier automation eligibility rules.
- Permission helper functions.
- Data validation utilities.
- Report formatting helpers.
- AI output schema validators.

Example areas:

```text
calculateGrossMargin()
calculateVariance()
classifyOrderException()
canUserApproveSupplierOrder()
scoreProductListingQuality()
validateAIOutputSchema()
```

---

## 6. Integration Tests

Integration tests should verify how modules work together.

Examples:

- BigCommerce order import creates order and order item records.
- Imported product links to supplier product mapping.
- Price mismatch creates supplier exception.
- Order exception creates task.
- AI briefing includes open urgent tasks.
- Report generation includes approved financial period data.
- Permission denied response is returned for unauthorized export.

---

## 7. API Tests

API tests should cover:

- Authentication required.
- Authorization required.
- Input validation.
- Pagination.
- Filtering.
- Error responses.
- Rate-limit or retry behavior where applicable.
- Sensitive action logging.

Critical endpoints:

- Orders.
- Products.
- Customers.
- Suppliers.
- Financial summaries.
- Reports.
- AI outputs.
- Tasks.
- Automation runs.
- Admin settings.

---

## 8. Permission Tests

Permission tests are mandatory.

Test that:

- Customer service cannot view full financial statements.
- Marketing cannot export all customer data without permission.
- Product Manager cannot approve investor reports.
- External Advisor only sees explicitly shared reports.
- Operations Manager cannot change API credentials.
- AI Analyst does not reveal data outside the user's role.
- Supplier automation approval requires correct role.
- Financial exports require Finance Manager or Executive role.

---

## 9. Database Tests

Test:

- Unique constraints.
- Source system ID mappings.
- Soft delete behavior.
- Audit log creation.
- Financial period status changes.
- Report versioning.
- AI output status changes.
- Automation run status changes.

Use a dedicated test database.

---

## 10. BigCommerce Sync Tests

Use fixtures for:

- New order.
- Updated order.
- Cancelled order.
- Refunded order.
- Multi-item order.
- Missing SKU.
- Product not mapped.
- Customer not found.
- Duplicate order import.

Expected outcomes:

- Records are created or updated correctly.
- Duplicate records are not created.
- Missing mappings create warnings.
- Import run is logged.

---

## 11. QuickBooks Sync Tests

Use fixtures for:

- P&L import.
- Balance sheet import.
- Account mapping.
- Missing account mapping.
- Closed period import.
- Adjusted EBITDA calculation.
- Budget vs actual comparison.

Expected outcomes:

- Financial summaries match source fixture.
- Adjustments are separate.
- Closed periods are protected.
- Variances calculate correctly.
- Reports label data correctly.

---

## 12. Mailchimp Sync Tests

Use fixtures for:

- Audience member import.
- Unsubscribed contact.
- Tagged contact.
- Campaign metrics.
- Duplicate email.
- Missing consent status.

Expected outcomes:

- Subscription status is preserved.
- Unsubscribed contacts are not marked as marketable.
- Segments are imported correctly.
- Campaign metrics are mapped correctly.

---

## 13. GA4 Sync Tests

Use fixtures for:

- Traffic report.
- Source/medium report.
- E-commerce report.
- Landing page report.
- Realtime report if implemented.

Expected outcomes:

- Metrics are mapped correctly.
- Date ranges are respected.
- Missing data is flagged.
- Import run is logged.

---

## 14. AI Tests

AI testing should focus on structure and safeguards rather than requiring deterministic language.

Test:

- Prompt template exists.
- Required inputs are provided.
- Output validates against schema.
- AI output is logged.
- Approval status defaults to draft where required.
- User permissions restrict source data.
- AI warns when source data is stale.
- AI does not execute sensitive actions directly.

### AI Mocking

Use mocked AI responses for automated tests. Do not depend on live AI calls in standard CI tests.

---

## 15. Browser Automation Tests

Browser automation should be tested in levels.

### Level 1: Unit Tests

- Eligibility rules.
- Price threshold rules.
- Margin threshold rules.
- Exception classification.

### Level 2: Mock Portal Tests

Use a local mock supplier portal to test:

- Login.
- Product search.
- Price capture.
- Stock capture.
- Form fill.
- Confirmation capture.
- Error pages.
- Layout changes.

### Level 3: Staging/Sandbox Tests

If supplier provides staging access or non-production workflows, test there.

### Level 4: Live Assisted Tests

Only with management approval:

- Run stock/price checks.
- Prepare order without submitting.
- Submit approved low-risk test orders.

---

## 16. End-to-End UI Tests

E2E tests should cover:

- Login.
- Dashboard loading.
- Role-based navigation.
- Order exception workflow.
- Task assignment.
- Report generation.
- AI briefing generation.
- Supplier automation approval screen.
- Customer segmentation view.
- Financial dashboard view.

---

## 17. Financial Reconciliation QA

Post-MVP financial QA should include manual reconciliation:

- BigCommerce sales total vs Command Center import.
- QuickBooks revenue total vs Command Center import.
- Product-level gross margin sample testing.
- Supplier cost sample testing.
- Monthly financial report tie-out.
- Adjusted EBITDA schedule review.

Finance Manager should approve the reconciliation before relying on reports for external use.

---

## 18. Manual QA Checklist

Before release, manually confirm:

- Dashboard metrics are reasonable.
- Filters work.
- Date ranges work.
- Role permissions work.
- Exports work.
- Reports render correctly.
- AI outputs are marked draft.
- Approval workflows work.
- Audit logs are created.
- Error states are understandable.
- Mobile/tablet graceful layout is acceptable, even if desktop-first.

---

## 19. Performance Testing

Test:

- Dashboard load time.
- Large table pagination.
- Report generation time.
- Import job duration.
- AI response time.
- Supplier automation job duration.
- Database query performance.

Use indexes for high-volume tables such as orders, order items, customers, products, financial summaries, audit logs, and automation runs.

---

## 20. Security Testing

Test:

- Unauthorized routes.
- Unauthorized API access.
- Role escalation attempts.
- API key exposure.
- Export permissions.
- AI data leakage across roles.
- CSRF/session controls where applicable.
- Supplier credential access.
- Admin settings protection.

---

## 21. Release Readiness Checklist

Before deploying a major feature:

- Requirements reviewed.
- Tests pass.
- Permissions reviewed.
- Audit logging added.
- Error handling added.
- Feature flag configured if needed.
- Data migration tested.
- Rollback plan prepared.
- User-facing documentation updated if required.
- Product owner review completed.

---

## 22. Acceptance Criteria

Testing and QA are acceptable when:

- Critical business logic has unit tests.
- API endpoints have validation and permission tests.
- Integration mapping has fixture tests.
- AI outputs are logged and schema-validated where required.
- Supplier automation is tested against mock portals before live use.
- Financial reports reconcile to source systems.
- E2E tests cover core workflows.
- Manual QA checklist is completed before release.
- CI prevents obvious regressions.
