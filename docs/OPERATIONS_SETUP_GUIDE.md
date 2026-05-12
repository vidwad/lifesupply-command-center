# Operations Setup & Testing Guide

End-to-end runbook for taking the Command Center from "freshly deployed on
Render" to "team is using it daily." Designed for one operator working
through it sequentially. Estimated total wall time: **2–4 hours** of focused
work over the first week, then ongoing.

The app ships with realistic seed data (3 divisions, 3 stores, 12
suppliers, 20+ products, 50+ orders, 4 financial periods, 4 investors), so
every page renders something useful from minute one. Live integrations
overlay onto that — they don't have to come online before you can explore.

---

## Phase 0 — Confirm the deploy is healthy

Before touching anything, verify the foundation.

1. **Visit `https://<your-render-url>/api/health`.**
   Expect `{"status":"ok","db":"ok","ai":"ok"|"skipped",...}`.
   - `db: ok` = Postgres reachable
   - `ai: skipped` = no Anthropic key yet (expected at this point)
   - `ai: ok` = Anthropic key resolves

2. **Sign in at `/login`** with the seed credentials you set via
   `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`.

3. **Land on `/dashboard`.** You should see 6 KPI cards, a 6-period revenue
   chart, an empty AI briefing panel ("Generate" button visible), and
   product/task/exception widgets. All from seed data.

If anything is broken here, fix it before proceeding — later steps assume
the app is responsive and the DB is reachable.

---

## Phase 1 — Set the APIs

All credentials live in **`/admin/integrations`**. The page shows seven
integration cards (auto-created on first load):

| Card | Required to actually work |
|---|---|
| Anthropic Claude API | `apiKey` |
| OpenAI API | `apiKey` *(optional fallback for AI)* |
| BigCommerce — LifeSupply.ca | `storeHash`, `apiToken` |
| BigCommerce — WellmartMedical.com | `storeHash`, `apiToken` |
| BigCommerce — Balkowitsch Worldwide | `storeHash`, `apiToken` |
| Mailchimp | `apiKey`, `serverPrefix`, `audienceListId`, `fromName`, `fromEmail` |
| GA4 — LifeSupply.ca | `propertyId`, `serviceAccountJson` |
| GA4 — WellmartMedical.com | `propertyId`, `serviceAccountJson` |
| QuickBooks Online | `clientId`, `clientSecret`, `redirectUri`, `environment` |
| BBM01 — Best Buy Medical Portal | `username`, `password` |

**Mechanic to know:** for any field with an `env: VAR_NAME` label, an env
var on the Render web service overrides the vault. So you can either paste
the secret here in the UI (encrypted at rest with `MASTER_ENCRYPTION_KEY`)
*or* set it as an env var in Render. Vault is faster — env vars require a
service restart.

### Recommended order

Set them in this order so each unlocks the next layer of features:

1. **Anthropic** — unlocks the AI briefing, AI Analyst, campaign drafts,
   investor-update copy. Get a key at https://console.anthropic.com.
   Paste into the API key field; save; refresh `/api/health` and confirm
   `ai: ok`.

2. **BigCommerce ×3** — unlocks live orders/products/customers per store.
   For each storefront, get the **Store API Account** credentials from the
   BC control panel (Advanced Settings → API Accounts → Create V2/V3
   account; scopes needed: Customers RO, Orders RO, Products RO).
   Paste `storeHash` (from the BC URL `store-XXXXXX`) and `apiToken`.

3. **Mailchimp** — unlocks campaign export. Get the API key from your
   Mailchimp account → Profile → Extras → API keys. The key suffix
   (e.g. `-us21`) is the `serverPrefix`. The `audienceListId` is on
   Audience → Settings → Audience name and defaults.

4. **GA4 ×2** — unlocks site analytics. In Google Cloud, create a service
   account with the **Analytics Data API** role, generate a JSON key, and
   paste the entire JSON file contents into `serviceAccountJson`. The
   `propertyId` is the 9-digit number in GA4 → Admin → Property settings.

5. **QuickBooks** — unlocks live financial sync (manual CSV import works
   without it; see Phase 3). Requires an Intuit developer app for OAuth.
   Defer until you actually need live sync.

6. **BBM01 supplier portal** — unlocks Playwright automation. Username +
   password for the portal. Also set the env var
   `SUPPLIER_PORTAL_BBM01_URL` in Render → web service → Environment
   (the live portal URL — it isn't a secret so it's env-only, not vault).
   Without it, the app uses the in-repo mock so you can develop against
   it without affecting the real portal.

After each save, the card's badge flips from `not configured` to
`configured` once every required field has either an env or vault value.

---

## Phase 2 — Smoke-test each integration

Before pulling real data, prove each connection works.

1. **Anthropic** — go to `/dashboard`, click **Generate briefing**. If
   the AI key is good, you get a 3-paragraph summary in ~10 seconds. If
   it errors, the message tells you exactly which field is missing.

2. **BigCommerce** — go to `/admin/import`. The page lists upload widgets
   for customers / products / orders and shows the most recent sync logs.
   The live API sync isn't wired in Phase 2D yet (manual CSV only — see
   Phase 3 below). You can confirm credentials are stored by checking the
   `last 4` indicator on the integration card.

3. **Mailchimp** — go to `/marketing/campaigns`. Pick a draft campaign
   (the seed creates a few). The "Export to Mailchimp" button is visible
   but **gated by the `mailchimp.send` feature flag** — it'll error
   loudly if you try without enabling it first.

4. **GA4** — `/analytics` shows the analytics dashboard (currently
   placeholder UI; live sync is Phase 2E).

5. **Supplier portal** — go to `/automation/runs`, click **Stock check
   → run**. With `supplier.automation` flag OFF this errors. Turn the
   flag on at `/admin/feature-flags`, retry, and you'll see a simulated
   run complete in seconds (Phase 2D uses the mock; live Playwright
   activates when `SUPPLIER_PORTAL_BBM01_URL` is set).

---

## Phase 3 — First data import (BigCommerce CSV path)

The live BigCommerce API sync is queued for a later phase. Today, the
intended path is **CSV upload at `/admin/import`** — same destination
tables, same audit logs, same downstream behavior.

For each storefront (LifeSupply.ca, WellmartMedical.com, Balkowitsch):

1. **Export from BigCommerce.** In the BC control panel:
   - Customers → Export → CSV (all customers, default template)
   - Products → Export → CSV
   - Orders → Export → CSV (limit to last 90 days for the first import)

2. **Upload at `/admin/import`.** One file at a time. The page shows
   per-file progress, a count of created/updated/failed rows, and writes
   an `IntegrationSyncLog` row visible at `/automation`.

3. **Spot-check downstream.** After each import:
   - Customers → check `/customers` for the new email/LTV rows
   - Products → check `/products` for SKUs and the new variants
   - Orders → check `/orders` and `/dashboard` (the KPI cards and trend
     chart should reflect the new revenue)

If a row count surprises you, look at `/automation` for the per-import
log line — `errorSummary` and `recordsFailed` will pinpoint the issue.

**When the live API sync ships**, this becomes a button click instead
of three CSV uploads. The destination data model is identical, so what
you import via CSV today is what the API sync will produce later — no
migration needed.

---

## Phase 4 — QuickBooks financials

Same pattern as BigCommerce: CSV upload now, OAuth API later.

1. In QuickBooks → Reports → **Profit & Loss by Class** (or by Location
   if that's how divisions are tracked) for the period you want.

2. Export to CSV / Excel.

3. `/admin/import` → QuickBooks P&L form → choose the period (e.g.
   "2026-04") → upload. The importer normalizes into `FinancialPeriod`
   + per-division summaries.

4. Verify at `/financials` — the period dropdown should now include
   the period you imported, with revenue / COGS / opex / gross profit
   broken out by division.

The seed already loaded periods 2026-02 through 2026-05, so this gives
you a concrete diff between seeded and imported numbers to confirm the
flow works.

---

## Phase 5 — Configure the people

Up to now you've been the only user (the Super Admin from the seed). Time
to bring the team on.

1. **`/admin/users` → Invite user.** Add each team member with their
   role:
   - **Executive** — read access to everything, no admin powers
   - **Finance Manager** — financials + reports + approvals
   - **Operations Manager** — orders, suppliers, automation, tasks
   - **Customer Service** — customers, orders, tasks (no financials)
   - **Marketing Manager** — campaigns, analytics, customers
   - **Investor Relations** — investors, capital raises, opportunities
   - **Developer** — same as Super Admin minus user/role mgmt

2. **`/admin/roles`** — only touch this if the default role/permission
   matrix doesn't fit your org. The defaults reflect docs/06.

3. **`/admin/divisions`** — already seeded with LSC / WMM / LSU. Edit
   the display names, codes, or descriptions to match your accounting.

4. **`/admin/stores`** — already seeded with the three storefronts.
   Update each store's URL + currency + tax-region if needed.

5. **`/admin/ai-settings`** — pick the model (defaults to
   `claude-opus-4-7`) and review the three seeded prompt templates
   (daily briefing, AI analyst, investor draft). Tweak temperature or
   wording before exposing to the team.

---

## Phase 6 — Daily operating loop

This is what the app should look like in steady-state use, day to day.

### Morning (Operations / Executive)

1. **`/dashboard`** — read the AI briefing (regenerate if the data has
   changed since last night). Check the 6 KPI cards vs. prior period
   and the revenue trend.

2. **`/operations`** — scan exceptions. Anything in red (price
   mismatch, stock-out, address verification fail) gets converted to a
   task or assigned directly.

3. **`/orders`** — review new orders, especially anything with a
   `pending_supplier` status.

### Throughout the day (Operations + Customer Service)

4. **`/tasks`** — work the queue. Tasks come from exceptions, manual
   creation, AI suggestions, and approval workflows.

5. **`/approvals`** — anything that needs a sign-off (campaign send,
   supplier order, financial adjustment, investor distribution) lands
   here. Approve / reject / send back with a comment.

6. **`/automation/runs`** — kick off supplier stock/price checks on
   demand. Each run produces an evidence trail (request, response, any
   screenshot if Playwright captures it) viewable on the run detail.

### Weekly (Finance + Marketing)

7. **`/financials`** — close the prior week / month. The
   `/financials/close` workflow walks through period rollups and
   adjustments. Adjustments are visible and audit-logged so QBO stays
   the source of truth.

8. **`/marketing/campaigns`** — draft new campaigns (AI-assisted), get
   them approved at `/approvals`, then export to Mailchimp once the
   `mailchimp.send` flag is on.

9. **`/marketing/reactivation`** — review the customer reactivation
   suggestions (low-engagement customers segmented by AI). Convert into
   campaigns or tasks.

### Monthly (Executive + IR)

10. **`/reports`** — generate the monthly board / lender / investor
    pack. Reports go through approval before distribution. Print-ready
    PDF lives at `/reports/[id]/print`.

11. **`/investors`** — log interactions, update the cap table /
    capital-raise tracker, draft an investor update.

12. **`/opportunities`** — track M&A pipeline, due-diligence items,
    valuation work.

---

## Phase 7 — Turn on the high-risk features (deliberately)

Eight feature flags live at `/admin/feature-flags`, all OFF by default.
**Read docs/14 §16 before flipping any of them.** Recommended sequence:

1. **`mailchimp.send`** — once you've sent a test campaign manually
   from a known-safe segment.
2. **`supplier.automation`** — once stock + price checks have been
   running cleanly against the mock for a week.
3. **`supplier.order_submit`** — only after `supplier.automation` has
   been on for 30 days with no false positives.
4. **`external.writebacks`** (BigCommerce) — once you have a
   product/price diff workflow you trust.
5. **`quickbooks.writebacks`** — last; QBO is the source of truth, the
   bar is highest.
6. **`ai.actions`** — only once you've audited 100+ AI outputs and
   trust the model's judgement on the specific action class.
7. **`investor.distribution`** — when the first board-approved
   investor pack is ready.
8. **`forecasting.enabled`** — when you have ≥3 months of clean
   imported financials to forecast against.

Every flag toggle is audit-logged, visible at `/admin/audit-logs`.

---

## Phase 8 — Backups + ongoing health

- **Database backups** — Render Postgres Basic 256 MB does PITR for 7
  days. Set a calendar reminder to take a manual snapshot before any
  schema migration. Manual snapshot: Database → Backups → Take backup
  now.
- **Audit retention** — the daily cron at 03:15 UTC prunes audit logs
  older than `AUDIT_RETENTION_DAYS` (default 365). Verify it's running
  at `/admin/audit-logs` (or in the Render Cron job logs).
- **Sync log review** — `/automation` shows the last 20 sync runs.
  Anything in `failed` status warrants investigation; the
  `errorSummary` column tells you what.

---

## Quick reference — where to fix things

| Symptom | Where to look |
|---|---|
| Login fails | `/login`, then check `AUTH_URL` env var in Render |
| AI briefing errors | `/admin/integrations` → Anthropic card; `/api/health` |
| BigCommerce import row count zero | `/automation` → most recent sync log → errorSummary |
| Mailchimp export silently does nothing | `/admin/feature-flags` → `mailchimp.send` is OFF |
| Supplier check returns canned data | `SUPPLIER_PORTAL_BBM01_URL` env var unset → using mock |
| User can't see a page | `/admin/users` → click user → check role; `/admin/roles` for permission matrix |
| Want to know who changed what | `/admin/audit-logs` |
