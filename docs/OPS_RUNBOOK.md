# Operations Runbook

**Project:** LifeSupply Command Center
**Audience:** Owner, technical lead, oncall

This is the disaster-recovery + day-to-day operations runbook. Everything
that needs to be done outside the application UI lives here.

---

## 1. Health & monitoring

| Check | URL | What it tells you |
|---|---|---|
| Application health | `/api/health` | DB reachable, Anthropic credential present, high-risk feature-flag posture |
| Audit log | `/admin/audit-logs` | Material actions across the platform |
| Automation runs | `/automation/runs` | Latest supplier-portal workflow runs + statuses |
| Integration sync logs | `/automation` | BigCommerce / QuickBooks import + sync history |

**Probe expectation:** `/api/health` returns `200` for ok / degraded, `503`
for failing. The body is JSON; never assume status code alone.

---

## 2. Kill-switch — disable everything risky

When something is going wrong and you want to stop external writes / AI
mutations / supplier portal access immediately:

1. Sign in as a user with `admin.manage_system_settings`.
2. Go to `/admin/feature-flags`.
3. Click the red **Trip kill-switch** button at the top.
4. Enter a reason (required, audit-logged).
5. Confirm.

This flips OFF, in one transaction:
- `supplier.automation`
- `supplier.order_submit`
- `external.writebacks`
- `quickbooks.writebacks`
- `ai.actions`
- `mailchimp.send`
- `investor.distribution`

Read-only flags are untouched. Re-enabling is per-flag, deliberate.

---

## 3. Database backups

### 3.1 Local development

The Postgres container in `docker-compose.yml` is volume-backed at
`postgres_data`. To take a manual backup:

```sh
docker exec lifesupply_cc_postgres pg_dump -U postgres lifesupply_cc \
  > backup-$(date +%Y%m%d-%H%M).sql
```

### 3.2 Production (managed Postgres)

Use the provider's automated backups. Required posture:
- **Daily snapshot, 7-day point-in-time recovery (PITR), 30-day retention.**
- Restore drills: quarterly. Document drill date + outcome in this runbook.

### 3.3 Restore

```sh
# Stop the app first.
psql -U postgres -d lifesupply_cc < backup-YYYYMMDD-HHMM.sql
# Restart the app and visit /api/health to confirm.
```

---

## 4. Audit log retention

Audit logs are pruned by `runAuditRetention()` (see
`src/server/services/audit-logs/retention.ts`). Default keep-window: **365
days**. Override via `AUDIT_RETENTION_DAYS` env (minimum 30).

**Never-pruned actions** are preserved indefinitely:
- `auth.*`
- `approval.*`
- `financials.*`, `financial_summary.*`, `financial_adjustment.*`
- `report.*`, `investor_update.*`
- `automation.run_*`, `automation.order_*`
- `integration.field_*`, `feature_flag.*`
- `user.created`, `user.password_reset`, `user.suspended`, `user.archived`
- `role.permissions_updated`
- `system_setting.updated`
- `export.*`, `import.*`

### Trigger

Manual: **Admin → Audit Logs → "Run retention" button** in the header.
Scheduled: not yet wired — when the job runner lands (Inngest etc.), call
`runAuditRetention()` once daily.

---

## 5. Migrations

```sh
# Local
pnpm db:migrate

# Production (after CI green-lights the change)
pnpm db:migrate:deploy
```

Rules:
- Migrations must be committed.
- Test in staging first.
- Back up production before any destructive migration.
- Never delete financial / audit / report / AI rows without an explicit
  retention strategy.
- Use expand-contract for high-risk schema changes.

---

## 5.5 Live integrations — credentials cheat sheet

### Mailchimp campaigns
Configure these via **Admin → API & Integrations → Mailchimp**:
- `apiKey` (secret)
- `serverPrefix` (e.g. `us21`)
- `audienceListId`
- `fromName`
- `fromEmail`

When all five are present + `mailchimp.send` flag is on, the export creates
a Mailchimp segment + draft campaign. Sending is still done from inside
Mailchimp — the application never auto-sends.

### Investor email distribution
Env-only (Resend):
```
RESEND_API_KEY=re_xxxxxxxx
INVESTOR_FROM_EMAIL=team@lifesupply.ca
INVESTOR_FROM_NAME=LifeSupply  # optional, defaults to "LifeSupply"
```

When unset, `releaseInvestorUpdate()` falls back to the stub path so the
workflow remains testable without email infra.

### Supplier portal automation (BBM01)
1. Configure credentials via **Admin → API & Integrations → Supplier portal**:
   - `username`, `password`, optional `loginUrl` override.
2. Install browsers (one-time per host):
   ```sh
   pnpm exec playwright install chromium
   ```
3. Set `SUPPLIER_PORTAL_BBM01_URL` to the live BBM01 portal URL. Without
   it, the runner hits the in-repo mock portal at
   `/dev/mock-portals/bbm01/index.html` — only useful in dev.
4. Enable the `supplier.automation` feature flag.
5. Trigger a price/stock check from `/automation/runs`. The run records
   per-step output + screenshot evidence rows.

When the live runner can't launch (e.g. chromium binaries missing), the
run is marked failed with a clear `errorSummary` instead of silently
falling back to simulation.

---

## 6. Secrets

- Encrypted credential vault: `/admin/integrations`. AES-256-GCM with
  `MASTER_ENCRYPTION_KEY`.
- Generate the master key:
  ```sh
  openssl rand -base64 32
  ```
- **Never commit `.env`.** `.env.example` is the schema-only template.
- **Never log secrets.** The pino logger redacts a known set of paths
  (see `src/server/logger/index.ts`); add new sensitive keys to that
  list as they appear.

---

## 7. Rollback

If a deploy breaks:
1. Trip the kill-switch (§2) if any high-risk capability is on.
2. Revert the deploy via your hosting provider's redeploy-previous-build.
3. If the migration is the problem: restore the DB from §3.3 *before*
   re-pointing traffic.
4. Open `/api/health` + `/admin/audit-logs` to verify recovery.

For high-risk deploys, prefer feature-flag rollouts so a back-out is a
flag flip rather than a redeploy.

---

## 8. Incident contacts

- Owner: Vid Wadhwani (`vidwadhwani@gmail.com`)
- Tech lead: TBD
- Hosting (DB): TBD
- Hosting (web): TBD

Update this section when production hosting is selected.

---

## 9. Restore drill log

| Date | Drill | Outcome | Notes |
|---|---|---|---|
| _add first entry after first drill_ | | | |
