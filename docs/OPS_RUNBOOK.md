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

### BigCommerce stores — credentials + store mapping

LifeSupply runs multiple BigCommerce storefronts (LifeSupply.ca,
WellmartMedical.com, and a planned Balkowitsch Worldwide / U.S. store). Each
gets its own `BigCommerce — <name>` connection under **Admin → API &
Integrations**.

For every BigCommerce connection:

1. Set `storeHash` + `apiToken` (per-connection, via the vault).
2. **Map the connection to a Store.** In the connection's **Store mapping**
   panel, pick the matching Store and click **Save mapping**. This is a real
   foreign key — sync no longer guesses the store from the connection's
   display name.
   - The mapping target list only shows Stores whose platform is
     `bigcommerce`. Create the Store first under **Admin → Stores** if it's
     missing (e.g. the Balkowitsch/U.S. store).
   - A connection with a **Not mapped** badge is **skipped** by sync with a
     clear operator message — it will not sync until mapped.

To configure the three stores end to end: create the three `bigcommerce`
Stores (Admin → Stores), set each connection's credentials, then map each
connection to its Store. Confirm each connection shows its Store name (not
"Not mapped") before running a sync.

**Catalog — products / variants / categories (Phase 3C):** the **Products**
page has its own sync buttons (full / incremental) that walk
`/v3/catalog/categories` (hierarchy resolved), `/v3/catalog/brands`, and
`/v3/catalog/products?include=variants`, upserting `Category`, `Product`, and
`ProductVariant`. Local-only fields (featured / rockstar flags) are preserved;
BC-owned catalog fields (name, price, SKU, status, image/description quality
signals) overwrite on sync. Once products are synced, **re-running an order
sync backfills** the `productId` / `productVariantId` links on order items
(Phase 3B). Counts appear in the sync log (`categoriesUpserted`,
`productsScanned`, `variantsUpserted/Deleted`).

**Reconciliation (Phase 3E):** **Admin → Reconciliation** compares Command
Center totals against BigCommerce source totals per store — lifetime counts
(customers, orders, products — three cheap count calls) plus a 30-day range
walk (order count, revenue, refunds, item units). Runs execute on the
background worker (`syncType: reconciliation` in the sync log). A gap is
**material** only when it exceeds both an absolute floor and a percentage
threshold (counts: ≥3 and ≥0.5%; money: ≥$25 and ≥0.5% — constants in
`reconciliation-evaluator.ts`); material gaps raise `integration_sync`
Exceptions keyed `reconciliation:<storeId>:<metric>` so repeats group.
Guest-customer counts are informational (BC has no comparable total). Run a
reconciliation after any full sync, and investigate material rows via the
report + exceptions rather than re-syncing blindly.

**Fulfillments + refunds (Phase 3D):** order sync captures payment/refund
reporting fields straight from the order header (`Order.paymentMethod`,
`Order.refundedTotal` — no extra API calls) and refines
payment/fulfillment status from them (a nonzero refund amount forces
refunded / partially_refunded; shipped-item counters upgrade fulfillment).
Shipments (carrier, tracking number/URL, shipped date) are pulled from
`/v2/orders/{id}/shipments` into `OrderShipment` rows — fetched **only for
orders with shipped items**, so unshipped orders cost nothing extra
(`syncShipments: false` disables). Counts appear in the sync log
(`shipmentsUpserted/Deleted/Failed`). Deeper per-transaction gateway detail
is deliberately not synced — header-level payment method + refund totals are
the reporting level; revisit if gateway-level reporting is ever needed.

**Order line items (Phase 3B):** order sync also pulls each order's line items
from `/v2/orders/{id}/products` and upserts `OrderItem` rows (keyed by BC
order-product id, so re-syncs preserve CC-owned cost/margin/supplier fields).
Stale BC items removed upstream are deleted; manually-added items are kept.
Line items link to `Product`/`ProductVariant` once those are synced
(Phase 3C) — until then `productId`/`productVariantId` stay null. This adds
**one API call per order**, so a full sync is much slower than header-only;
counts appear in the sync log (`itemsCreated/Updated/Deleted/Failed`). Callers
can pass `syncItems: false` for a fast header-only run.

**Guest checkouts (Phase 3A):** order sync creates first-class Customer rows
for guest buyers (BigCommerce `customer_id = 0`), keyed by normalized billing
email under `sourceSystem = "bigcommerce_guest"`. A guest whose email matches
an already-synced registered customer is deduped (the order links to the
registered customer; no guest row). Guest counts appear in the order sync log
metadata (`guestsCreated`, `guestOrdersLinked`, `guestOrdersDeduped`,
`guestOrdersNoEmail`). Guests carry `metadata.guest = true`. Note: guest
lifetime-value / order-count rollups are not yet computed (a later sub-phase);
guest identity + order linking are.

> Migration note: deployments created before the Phase 2 mapping change are
> auto-backfilled from the old `BigCommerce — <Store name>` naming
> convention, so existing connections keep syncing. Any connection whose name
> didn't match a Store shows **Not mapped** and must be mapped by hand.

### QuickBooks Online read sync (Phase 6)

Read-only — the app NEVER writes to QuickBooks.

1. Create an Intuit app (developer.intuit.com), redirect URI
   `https://<your-domain>/api/auth/quickbooks/callback`.
2. In **Admin → API & Integrations → QuickBooks**, set `clientId`,
   `clientSecret`, `redirectUri`, and `environment` (sandbox/production).
3. Click **Connect QuickBooks** and approve on Intuit's consent screen.
   OAuth tokens (access/refresh/realm) are stored AES-encrypted on the
   connection and rotate automatically on refresh.
4. Click **Sync reports (read-only)** — the worker pulls P&L, balance
   sheet, and A/R–A/P agings for the last 2 monthly periods (auto-created
   as `YYYY-MM`) into consolidated `FinancialSummary` rows
   (`sourceSystem: quickbooks`, `sourceImportId` = sync log, so every
   figure traces to its run). Existing summaries keep their approval
   status — API refresh never re-approves a reviewed period. Per-division
   class mapping remains on the CSV import path for now.

### GA4 daily metric read sync (Phase 6)

1. Create a Google Cloud service account, enable the Analytics Data API,
   and grant the service-account email Viewer access on each GA4 property.
2. Per GA4 connection in **Admin → API & Integrations**, set `propertyId`
   and paste the full `serviceAccountJson` key file.
3. **Map each GA4 property to its Store** (Store mapping panel — GA4
   properties may map to any store, e.g. Amazon). Unmapped properties are
   skipped with a reason.
4. Click **Sync GA4 metrics (30d)** — the worker upserts daily
   `WebsiteMetric` rows (users, sessions, page/product views, add-to-carts,
   checkouts, purchases, revenue, conversion rate) keyed (store, date),
   plus a top source/medium attribution summary stored on the latest day's
   metadata + the sync log.

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

### Mailchimp consent + suppression read sync (Phase 4)

**Marketing → Reactivation → "Sync Mailchimp consent"** (or
`POST /api/sync/mailchimp/members`, permission `marketing.sync_mailchimp`)
pulls the audience's members + abuse reports on the background worker.
Read-only toward Mailchimp; only `apiKey` + `serverPrefix` + `audienceListId`
are needed. Effects:

- Every member is mirrored into `MarketingContact` (raw status, tags, merge
  fields, status-changed date).
- Matched customers (by normalized email — registered and guest) get CASL
  evidence fields: `subscribed` → express consent (source `mailchimp`, opt-in
  date); `unsubscribed`/`cleaned` → suppressed with reason + date; abuse
  reports → `complained` (suppression always wins). Archiving a member in
  Mailchimp does NOT change consent.
- Counts land in the sync log; the run itself is audit-logged.

### Campaign Builder (Phase 5)

**Marketing → Campaigns → Campaign Builder** creates the LifeSupply
Customer Reactivation & Replenishment program as a structured record:

- One **program** campaign (type `reactivation_program`) holding the plan —
  objective, data-source/cleanup + consent review, streams, product/offer
  strategy, sequences, calendar, high-value task refs.
- Separated **consumer** and **B2B** email-track campaigns (children of the
  program). Each track carries its own audience + eligibility snapshot and
  goes through the standard approval → flag-gated draft-only Mailchimp
  export individually.
- **High-value accounts** (LTV ≥ $5k) become personal outreach **tasks**
  (capped at 25/run) — never bulk sends.
- **Deep-lapsed** (366–730d) audiences are flagged "consent review
  required"; **dormant** (>730d / never purchased) are never emailed —
  counted in the plan as suppression/research only.
- Streams follow precedence high-value → B2B → recency, and every email
  audience passes the casl-v1 eligibility policy.
- Performance: record metrics manually on any campaign's detail page
  (Performance card) until a Mailchimp metric read-sync exists.

**Eligibility policy (casl-v1)** — enforced by
`services/marketing/marketing-eligibility.ts` and used by reactivation +
campaign drafting: suppressed/pending are never eligible; express consent is
eligible (no expiry); implied consent is eligible inside its window (recorded
expiry, or 24 months after last purchase — CASL existing-business-relationship);
everything else is ineligible. Campaign approval is refused when the draft has
no eligibility snapshot. Run the Mailchimp sync before drafting reactivation
campaigns so suppression is fresh.

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

---

## 10. Background worker — stalled sync jobs

BigCommerce customer/order sync runs on the **`lifesupply-cc-worker`**
Render service (start command `pnpm worker`, code at `src/worker.ts`). It
connects OUT to Inngest via Connect — no inbound URL. The web service
publishes events (`bc/sync.*`); the worker processes them and moves each
`IntegrationSyncLog` from `running` to `success` / `partial` / `failed`.

**Symptom: a sync log sits in `running` and never finishes.**

Triage in order:

1. **Is the worker up?** Render → `lifesupply-cc-worker` → Logs. A healthy
   worker prints `[worker] connected to Inngest, awaiting work…` and stays
   running. If it's crash-looping, read the Deploy/Logs tab for the error.
2. **Did the event reach Inngest?** https://app.inngest.com → **Runs**. If
   the run is absent, the web service never published it — check that
   `INNGEST_EVENT_KEY` on `lifesupply-cc-web` matches the worker's.
3. **Did the run fail inside the worker?** If the Inngest run shows an
   error:
   - `missing storeHash or apiToken` → the worker's
     `MASTER_ENCRYPTION_KEY` does not match the web service's, so vault
     decryption fails. Copy the exact web value onto the worker.
   - DB errors → confirm `DATABASE_URL` / `DIRECT_URL` are set on the
     worker.
4. **Restart** the worker (Render → Manual Deploy → "Clear build cache &
   deploy" is not needed; a plain restart re-establishes the Connect
   session). In-flight Inngest runs retry automatically.

**Clearing a stuck log after the cause is fixed:** the row is safe to
leave — a fresh sync creates a new log. If a `running` row is misleading
operators, mark it `failed` manually (it has no side effects beyond
display):

```sql
UPDATE integration_sync_logs
SET status = 'failed', "completedAt" = now(),
    "errorSummary" = 'manually closed — worker outage'
WHERE status = 'running' AND "startedAt" < now() - interval '1 hour';
```

Full worker + Inngest deployment setup lives in
`docs/DEPLOYMENT_RENDER.md` §2.5.
