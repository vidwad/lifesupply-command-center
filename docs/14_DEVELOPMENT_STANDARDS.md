# 14 - Development Standards

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP requirements  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, technical lead, product owner

---

## 1. Purpose

This document defines development standards for the LifeSupply Command Center. Claude Code and any other coding agents should follow these standards when implementing the application.

The goal is to keep the platform maintainable, secure, testable, and understandable as it grows from MVP into a full management command center.

---

## 2. General Development Principles

- Build in small, testable increments.
- Prefer clear business-domain naming over generic names.
- Avoid hidden side effects.
- Keep external integrations behind service layers.
- Validate inputs server-side.
- Use feature flags for risky post-MVP features.
- Do not hardcode secrets or credentials.
- Keep AI prompts versioned and observable.
- Treat financial, customer, supplier, and investor data as sensitive.
- Log sensitive actions.
- Write tests for permissions and external-action workflows.

---

## 3. Default Technology Standards

Use the technology direction from the project documentation unless changed by the product owner.

Recommended stack:

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- PostgreSQL.
- Prisma.
- Server-side API routes or backend services.
- Background job processor for syncs and automation.
- Playwright for browser automation.
- OpenAI and Anthropic APIs through server-side wrappers.
- PDF and XLSX generation services.

---

## 4. Suggested Folder Structure

```text
src/
  app/
    (auth)/
    (dashboard)/
    api/
  components/
    ui/
    dashboard/
    forms/
    charts/
    reports/
  lib/
    auth/
    permissions/
    db/
    integrations/
    ai/
    reporting/
    automation/
    logging/
    validation/
  server/
    services/
    jobs/
    workflows/
  types/
  tests/
prisma/
  schema.prisma
  migrations/
docs/
```

The exact structure may vary, but the application should keep business logic out of UI components.

---

## 5. TypeScript Standards

- Use TypeScript strict mode.
- Avoid `any` unless justified and contained.
- Define types for external API responses.
- Validate external inputs using schemas.
- Use clear domain types such as `Order`, `SupplierProduct`, `FinancialPeriod`, `AIOutput`, `Report`, and `AutomationRun`.
- Do not assume external API fields are always present.
- Prefer explicit return types for service functions.

---

## 6. React and UI Standards

- Use reusable components for cards, tables, filters, charts, status badges, and approval dialogs.
- Keep components focused.
- Avoid deeply nested UI logic.
- Move data fetching and business logic into server actions, services, API routes, or hooks as appropriate.
- Show loading states.
- Show empty states.
- Show error states.
- Use accessible labels for forms and controls.
- Make dashboard tables searchable and filterable where practical.

---

## 7. API Standards

API routes should:

- Authenticate users.
- Authorize by permission.
- Validate request body and query parameters.
- Return consistent response shapes.
- Log sensitive actions.
- Avoid leaking internal errors.
- Use pagination for list endpoints.
- Support filtering by division, store, date range, and status where relevant.

Suggested response shape:

```json
{
  "ok": true,
  "data": {},
  "meta": {},
  "errors": []
}
```

Error response:

```json
{
  "ok": false,
  "data": null,
  "meta": {},
  "errors": [
    {
      "code": "permission_denied",
      "message": "You do not have permission to perform this action."
    }
  ]
}
```

---

## 8. Database and Prisma Standards

- Use Prisma migrations for schema changes.
- Do not modify production schema manually.
- Use UUIDs or stable IDs where appropriate.
- Preserve source system IDs in mapping fields.
- Add `createdAt` and `updatedAt` to core tables.
- Add soft-delete fields where records should not be hard deleted.
- Use indexes for common filters.
- Use unique constraints for source system mappings.
- Avoid deleting financial, audit, report, or AI output records without retention rules.

---

## 9. Integration Standards

Each external integration should have:

- Service wrapper.
- Authentication handler.
- Sync job.
- Error handling.
- Retry logic.
- Import run logging.
- Rate limit handling.
- Mapping logic.
- Tests with mock responses.

Suggested folder pattern:

```text
src/lib/integrations/bigcommerce/
  client.ts
  mapper.ts
  sync-orders.ts
  sync-products.ts
  sync-customers.ts
  types.ts

src/lib/integrations/quickbooks/
  client.ts
  mapper.ts
  sync-financials.ts
  types.ts
```

---

## 10. AI Development Standards

AI logic should live behind a service layer.

Required standards:

- Server-side only.
- Prompt templates stored/versioned.
- Output schemas used where workflow-critical.
- All important outputs logged.
- Source data references stored.
- Human approval required for sensitive outputs.
- Do not expose API keys client-side.
- Do not put supplier passwords, API keys, or secrets into prompts.

Suggested folder pattern:

```text
src/lib/ai/
  providers/
    openai.ts
    anthropic.ts
  prompt-templates/
  schemas/
  ai-service.ts
  ai-logger.ts
```

---

## 11. Browser Automation Standards

Browser automation must be isolated from normal UI code.

Required standards:

- Run server-side only.
- Use job queue.
- Use secure credentials.
- Log all runs.
- Capture evidence where appropriate.
- Pause for human approval for sensitive actions.
- Detect portal layout changes.
- Avoid duplicate order submissions.
- Provide manual fallback.

Suggested folder pattern:

```text
src/lib/automation/
  suppliers/
    best-buy-medical/
      login.ts
      stock-check.ts
      price-check.ts
      prepare-order.ts
      submit-order.ts
  playwright-runner.ts
  automation-logger.ts
  validators.ts
```

---

## 12. Permission Standards

All sensitive actions must check permissions on the server.

Do not rely only on hiding UI elements.

Permissions should apply to:

- Routes.
- API endpoints.
- Server actions.
- Data queries.
- Exports.
- Approval workflows.
- AI outputs.
- Supplier automation.
- External write-backs.

---

## 13. Error Handling Standards

Errors should be handled in a way that helps users and developers.

### User-facing errors

- Clear.
- Non-technical where possible.
- Actionable.
- No secret leakage.

### Developer logs

- Include context.
- Include correlation ID where possible.
- Include integration source.
- Include job ID.
- Include user ID for user actions.
- Avoid logging secrets.

---

## 14. Logging Standards

Use structured logs for:

- API errors.
- Integration syncs.
- Background jobs.
- AI calls.
- Supplier automation.
- Report generation.
- Permission denials.
- Sensitive exports.

Suggested log fields:

```text
level
message
request_id
user_id
entity_type
entity_id
job_id
source_system
error_code
timestamp
```

---

## 15. Testing Standards

Every major feature should include appropriate tests.

Required test areas:

- Utility functions.
- Permission checks.
- API input validation.
- Database mapping.
- Integration mappers.
- AI output schemas.
- Report generation.
- Browser automation validators.
- Critical UI flows.

---

## 16. Feature Flag Standards

Use feature flags for:

- Supplier automation.
- External write-backs.
- AI action workflows.
- Financial report approval.
- Investor report generation.
- M&A modules.
- Experimental forecasting.

Feature flags should be environment-aware.

---

## 17. Environment Variable Standards

Environment variables should be documented and validated.

Examples:

```text
DATABASE_URL=
NEXTAUTH_SECRET=
BIGCOMMERCE_CLIENT_ID=
BIGCOMMERCE_CLIENT_SECRET=
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
MAILCHIMP_API_KEY=
GA4_PROPERTY_ID=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
STORAGE_BUCKET=
```

Do not commit real `.env` files.

---

## 18. Agent Workflow Standards

If Claude Code, Codex, or another coding agent is used:

- Use one agent per branch or worktree.
- Do not let agents edit the same files at the same time.
- Give each agent a clear ticket.
- Specify files allowed to edit when possible.
- Require tests to be run before merge.
- Ask the agent to summarize changes.
- Review diffs before accepting.

---

## 19. Documentation Standards

For new features, update:

- Relevant `/docs` file if requirements change.
- README if setup changes.
- Environment variable documentation if secrets/configuration change.
- API documentation if endpoints are added.
- Developer notes for complex workflows.

---

## 20. Commit and Branch Standards

Suggested branch naming:

```text
feature/auth-rbac
feature/bigcommerce-order-sync
feature/qbo-financial-dashboard
feature/ai-daily-briefing
feature/supplier-price-check
fix/order-sync-duplicates
chore/update-docs-batch-2
```

Suggested commit style:

```text
feat: add supplier price check workflow
fix: prevent duplicate BigCommerce order imports
chore: document AI approval rules
```

---

## 21. Acceptance Criteria

Development standards are being followed when:

- Code is modular and typed.
- Sensitive actions are permission-protected.
- External integrations are behind service wrappers.
- AI prompts are versioned and logged.
- Supplier automation runs through a job system.
- Tests exist for critical logic.
- Environment variables are documented.
- Audit logs exist for sensitive actions.
- No secrets are committed.
- Claude Code can understand project conventions from the docs and code structure.
