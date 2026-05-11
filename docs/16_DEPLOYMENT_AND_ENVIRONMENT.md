# 16 - Deployment and Environment

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP requirements  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, technical lead, product owner

---

## 1. Purpose

This document defines deployment and environment requirements for the LifeSupply Command Center.

The application should be deployed in a way that supports secure development, testing, staging, production operations, background jobs, integrations, AI services, supplier automation, monitoring, backups, and controlled releases.

---

## 2. Environment Strategy

Use at least three environments:

1. Local development.
2. Staging.
3. Production.

### 2.1 Local Development

Purpose:

- Developer work.
- Claude Code implementation.
- Mock integrations.
- Local database.
- Local test runs.

### 2.2 Staging

Purpose:

- Pre-production review.
- Integration testing.
- QA.
- User acceptance testing.
- Mock or sandbox API credentials.
- Supplier automation dry runs.

### 2.3 Production

Purpose:

- Real management use.
- Real data.
- Controlled credentials.
- Monitoring.
- Backups.
- Audit logging.

---

## 3. Recommended Deployment Architecture

A practical architecture:

```text
Vercel or equivalent
  -> Next.js web application

Managed PostgreSQL
  -> Primary application database

Background worker host
  -> Integration syncs
  -> Report generation
  -> AI jobs
  -> Supplier automation jobs

Object storage
  -> Reports
  -> Screenshots
  -> Uploads
  -> Exports

Secret management
  -> API keys
  -> OAuth credentials
  -> Supplier credentials

Monitoring and logging
  -> Errors
  -> Performance
  -> Integration failures
  -> Automation failures
```

---

## 4. Hosting Requirements

### Web App

The web app should support:

- Secure HTTPS.
- Authentication.
- Server-side API routes.
- Dashboard UI.
- Role-based access.
- Admin settings.

### Background Workers

Background workers should support:

- BigCommerce sync.
- QuickBooks sync.
- Mailchimp sync.
- GA4 sync.
- Report generation.
- AI briefing generation.
- Supplier automation.
- Scheduled jobs.

Supplier automation may require a worker environment capable of running headless browsers.

---

## 5. Database Requirements

Use managed PostgreSQL or equivalent.

Requirements:

- Production database.
- Staging database.
- Local development database.
- Automated backups.
- Restore procedure.
- Migration process.
- Connection pooling where needed.
- Restricted access.

Do not run production against a local or development database.

---

## 6. Object Storage Requirements

Use object storage for:

- PDF reports.
- Excel exports.
- Supplier automation screenshots.
- Uploaded files.
- AI-generated report attachments.
- Evidence files.

Requirements:

- Private by default.
- Signed URLs where needed.
- Role-based download permissions.
- Retention rules.
- Environment separation.

---

## 7. Secrets and Environment Variables

Secrets must be environment-specific and never committed to the repository.

### Required Categories

- Database URL.
- Authentication secrets.
- BigCommerce credentials.
- QuickBooks credentials.
- Mailchimp API keys.
- GA4 credentials.
- OpenAI API key.
- Anthropic API key.
- Storage credentials.
- Email service credentials.
- Supplier credentials or vault references.

### Example `.env.example`

```text
DATABASE_URL=
NEXTAUTH_SECRET=
APP_URL=
BIGCOMMERCE_STORE_HASH=
BIGCOMMERCE_CLIENT_ID=
BIGCOMMERCE_CLIENT_SECRET=
BIGCOMMERCE_ACCESS_TOKEN=
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=
MAILCHIMP_API_KEY=
MAILCHIMP_SERVER_PREFIX=
GA4_PROPERTY_ID=
GOOGLE_APPLICATION_CREDENTIALS_JSON=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
```

---

## 8. OAuth and Integration Credentials

Several integrations may require OAuth.

Requirements:

- Store tokens securely.
- Store refresh tokens securely.
- Support token refresh.
- Log integration connection status.
- Notify admins when credentials expire.
- Restrict access to integration settings.

---

## 9. Deployment Process

Recommended process:

1. Merge code to main after review.
2. CI runs typecheck, lint, tests, and build.
3. Deploy to staging.
4. Run database migrations in staging.
5. Run smoke tests.
6. Product owner or technical lead approves.
7. Deploy to production.
8. Run production migrations with caution.
9. Run smoke tests.
10. Monitor errors and logs.

---

## 10. Database Migration Rules

- Migrations must be committed.
- Test migrations in staging first.
- Back up production before risky migrations.
- Avoid destructive migrations without explicit approval.
- Do not delete financial, audit, report, or AI records without retention strategy.
- Use expand-contract migration strategy for high-risk schema changes.

---

## 11. Monitoring Requirements

Monitor:

- Web application errors.
- API errors.
- Login failures.
- Integration sync failures.
- Background job failures.
- AI API failures.
- Supplier automation failures.
- Report generation failures.
- Database performance.
- Queue backlog.
- Storage failures.

---

## 12. Health Checks

Implement health checks for:

- Web app status.
- Database connection.
- Background worker status.
- Queue status.
- BigCommerce connection.
- QuickBooks connection.
- Mailchimp connection.
- GA4 connection.
- AI provider availability.
- Storage availability.

Do not expose sensitive configuration in public health endpoints.

---

## 13. Logging Requirements

Production logs should be structured and searchable.

Log:

- Request ID.
- User ID where applicable.
- Job ID.
- Source system.
- Error code.
- Entity ID.
- Timestamp.

Do not log:

- Passwords.
- API keys.
- OAuth tokens.
- Supplier credentials.
- Sensitive customer data unless necessary and protected.

---

## 14. Backup Requirements

### Database

- Automated daily backups at minimum.
- Point-in-time recovery if available.
- Retention policy.
- Restore testing.

### File Storage

- Versioning or backup for critical reports and evidence files.
- Retention policy.
- Access logs where available.

---

## 15. Rollback Procedure

A rollback plan should exist for each production deployment.

Rollback considerations:

- Can code be reverted safely?
- Did migrations modify data?
- Is a database restore required?
- Are background jobs compatible with prior code?
- Were external systems updated?
- Were reports generated using new logic?

For high-risk deployments, use feature flags so functionality can be disabled without full rollback.

---

## 16. Feature Flags

Use feature flags for:

- Supplier automation.
- BigCommerce write-backs.
- Mailchimp write-backs.
- AI analyst actions.
- Financial adjustment approvals.
- Investor report generation.
- M&A modules.
- Forecasting.

Feature flags should be environment-specific.

---

## 17. Scheduler and Background Jobs

Scheduled jobs should be configurable.

Examples:

- BigCommerce order sync every 15-60 minutes.
- Product sync daily or on demand.
- QuickBooks financial sync daily or on demand.
- Mailchimp metrics sync daily.
- GA4 metrics sync daily.
- Daily briefing generation each morning.
- Supplier stock checks on configured schedule.
- Report generation monthly or on demand.

The highest-frequency jobs should be designed to avoid API rate problems and unnecessary costs.

---

## 18. Production Access Rules

Production access should be limited.

- Developers should not casually access production data.
- Admin actions should be logged.
- Direct database access should be restricted.
- Customer exports should be permission controlled.
- Financial data exports should be restricted.
- Supplier credentials should not be visible to normal users.

---

## 19. Disaster Recovery Runbook

A basic runbook should include:

- Who to contact.
- How to check system status.
- How to disable integrations.
- How to disable supplier automation.
- How to pause scheduled jobs.
- How to roll back deployment.
- How to restore database.
- How to notify users.

---

## 20. Acceptance Criteria

Deployment and environment setup is acceptable when:

- Local, staging, and production environments exist.
- Secrets are environment-specific and not committed.
- Production uses managed database and backups.
- Background jobs run outside normal UI requests where needed.
- Logs and errors are visible.
- Health checks exist.
- Migrations are tested in staging.
- Feature flags exist for high-risk features.
- Rollback procedure is documented.
- Supplier automation can be disabled quickly.
