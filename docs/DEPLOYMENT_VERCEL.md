# Deploying to Vercel

This is the production-deployment runbook for putting LifeSupply Command
Center on Vercel + Neon Postgres. Estimated first-time setup: 20 minutes.

---

## 1. Prerequisites

| Account | Purpose | Cost |
|---|---|---|
| **GitHub** | Source repo (already done — `github.com/vidwad/lifesupply-command-center`) | free |
| **Vercel** | Hosting + serverless functions | free Hobby tier; Pro ($20/mo) for 60s function timeout (recommended for PDF export) |
| **Neon** | Managed Postgres + automated backups | free tier covers initial use; ~$19/mo for production tier |
| **Anthropic** | AI provider (already integrated) | pay-as-you-go |
| **Resend** (optional) | Investor-update email distribution | free tier 3k/mo |
| **Mailchimp** (optional) | Marketing campaign sync | per-account pricing |

---

## 2. Provision the database (Neon)

1. Sign up at https://neon.tech (or use Vercel Postgres which is Neon under the hood — see Appendix A).
2. Create a project named `lifesupply-command-center`.
3. In **Connection Details**, grab two strings:
   - **Pooled connection** (for `DATABASE_URL`) — has `?pgbouncer=true&connection_limit=1` query params; uses the connection-pooler hostname.
   - **Direct connection** (for `DIRECT_URL`) — points at the primary hostname, no pooler. Required for `prisma migrate deploy`.
4. Optionally enable **Autoscaling** + bump the compute size if you expect concurrent users.

**Example values:**
```
DATABASE_URL=postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/lifesupply?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/lifesupply?sslmode=require
```

---

## 3. Generate the encryption key

The credential vault requires a 32-byte key:

```sh
openssl rand -base64 32
```

Save the output — you'll paste it into Vercel as `MASTER_ENCRYPTION_KEY`.
Also generate `AUTH_SECRET` the same way.

---

## 4. Create the Vercel project

1. Visit https://vercel.com/new and **Import** the GitHub repo.
2. Vercel auto-detects Next.js. Override these defaults:
   - **Build command:** `pnpm vercel-build` (the `vercel.json` already pins this — Vercel will use it automatically, but verify).
   - **Install command:** `pnpm install --frozen-lockfile` (also pinned).
   - **Output directory:** leave as default (Next.js).
   - **Node version:** 20.
3. **Environment variables** — add all of the following at the project level. Mark every secret accordingly.

### Required (production)

| Var | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon pooled URL | Used at runtime |
| `DIRECT_URL` | Neon direct URL | Used by `prisma migrate deploy` in build |
| `AUTH_SECRET` | `openssl rand -base64 32` | Different from MASTER_ENCRYPTION_KEY |
| `AUTH_URL` | `https://your-domain.com` | Your production URL (the app you're about to deploy) |
| `AUTH_TRUST_HOST` | `true` | Required on Vercel |
| `MASTER_ENCRYPTION_KEY` | `openssl rand -base64 32` | Encrypts the credential vault. **NEVER rotate this without re-saving every credential** — old values become unreadable |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Same as AUTH_URL |
| `NODE_ENV` | `production` | Vercel sets this automatically |

### Required for AI features

| Var | Value |
|---|---|
| `ANTHROPIC_API_KEY` | From https://console.anthropic.com |

(Optional: `OPENAI_API_KEY` if you want to flip a `PromptTemplate` to OpenAI.)

### Optional — investor email distribution

| Var | Value |
|---|---|
| `RESEND_API_KEY` | From https://resend.com |
| `INVESTOR_FROM_EMAIL` | A verified sender email |
| `INVESTOR_FROM_NAME` | Display name (defaults to "LifeSupply") |

### Optional — operational tuning

| Var | Default | Notes |
|---|---|---|
| `AUDIT_RETENTION_DAYS` | `365` | Min 30. The retention sweep is manual today; trigger from `/admin/audit-logs` |
| `ANTHROPIC_MODEL` | (uses /admin/ai-settings) | Hard-pin a model in production if you want to lock the behavior |
| `LOG_LEVEL` | `info` | `debug` for verbose logs |

### NOT used in Vercel runtime

These are integration credentials managed via the in-app vault at
**Admin → API & Integrations**, not env vars. Set them once after first
deploy:

- BigCommerce (storeHash, apiToken, clientId)
- QuickBooks (clientId, clientSecret, redirectUri, environment)
- Mailchimp (apiKey, serverPrefix, audienceListId, fromName, fromEmail)
- GA4 (propertyId, serviceAccountJson)
- Supplier portal credentials

---

## 5. Deploy

Click **Deploy**. The build will:
1. `pnpm install --frozen-lockfile`
2. `prisma generate`
3. `prisma migrate deploy` — applies all pending migrations to Neon
4. `next build`

First deploy takes ~3 minutes. If it fails on the migrate step, the most
common cause is `DIRECT_URL` missing or pointing at a pooler — fix and
redeploy.

---

## 6. Post-deploy first-time setup

1. **Visit `/api/health`** in a browser — should return JSON with
   `status: "ok"`, DB reachable, Anthropic credential present.
2. **Seed the initial admin** — Vercel doesn't run `prisma db seed`
   automatically. Either:
   - Set `DEV_ADMIN_EMAIL` + `DEV_ADMIN_PASSWORD` env vars, run a one-off
     `vercel env pull .env.production.local` locally then
     `pnpm db:seed` against the Neon URL, OR
   - Create the user manually via `psql` against `DIRECT_URL` (less recommended).
3. **Sign in** with the seeded super-admin credentials.
4. **Set up integrations** at `/admin/integrations`:
   - Anthropic key (or rely on the env var)
   - BigCommerce store hash + token
   - QuickBooks credentials
   - Mailchimp credentials (if using campaign export)
   - Supplier portal credentials (note: see §7 — Playwright won't run on Vercel)
5. **Review feature flags** at `/admin/feature-flags`. Defaults are all OFF.
   Enable the ones you need:
   - For the AI Analyst to work: nothing extra (read-only)
   - For Mailchimp send: `mailchimp.send`
   - For investor distribution: `investor.distribution`
   - **Never enable `supplier.automation` or `supplier.order_submit` on Vercel** — see §7.
6. **Set up the custom domain** in Vercel **Project → Domains**. Update
   `AUTH_URL` + `NEXT_PUBLIC_APP_URL` to match.

---

## 7. Known limitations on Vercel

### ❌ Supplier portal automation (Playwright)

Playwright + Chromium does not fit in Vercel's serverless function limits
(50 MB compressed). The runner is configured to throw
`PlaywrightUnavailableError` cleanly when chromium isn't available, so
the run is marked `failed` with a clear errorSummary instead of crashing —
but you cannot use the live BBM01 flow on Vercel.

**Options:**
1. **Run a separate worker** (recommended). A small VPS or Fly.io machine
   that runs `pnpm dev` or a custom job runner, calls into the same
   database, and executes the Playwright flow. The web app stays on
   Vercel; only the supplier-automation runs hit the worker.
2. **Stay on simulation** — the AutomationRun rows + UI still work; the
   live portal call just isn't made. Useful for tracking + approval flows
   even without a real portal hit.
3. **Use a third-party browser-as-a-service** — e.g. browserless.io or
   Browserbase. Same `withBrowserPage()` abstraction, swap the runner.

### ⚠️ Long-running operations

Vercel function limits:
- Hobby: 10s
- Pro: 60s (already pinned for PDF + XLSX routes in `vercel.json`)
- Enterprise: 900s

If report generation or AI calls regularly time out, upgrade to Pro or
move to a queue.

### ⚠️ File system writes

Vercel functions have a read-only file system except `/tmp` (512 MB,
ephemeral). The current automation evidence stores `inline:<label>` —
no actual file writes. When you wire S3-based evidence storage,
configure `STORAGE_BUCKET` and friends to point at S3/R2.

### ⚠️ Cron / scheduled jobs

The audit retention sweep is manual today (admin button). To run it on a
schedule, add a Vercel Cron Job in **Project → Settings → Cron Jobs**
pointing at a new internal endpoint (e.g. `/api/cron/audit-retention`)
that calls `runAuditRetention()`. Same applies to scheduled BigCommerce
syncs once those are wired.

---

## 8. Continuous deployment

CI is already configured (`.github/workflows/ci.yml`) — it runs typecheck
+ lint + test + build on every PR.

Vercel auto-deploys:
- **Production** — pushes to `main`
- **Preview** — every PR

The `vercel-build` script runs `prisma migrate deploy` on every deploy,
so schema changes ship with the code. For zero-downtime schema changes
(adding a column, etc.), this is safe. For destructive changes, use
expand-contract:

1. Deploy a migration that adds the new column / table without removing
   the old.
2. Deploy app code that uses both.
3. Deploy app code that uses only the new.
4. Deploy a migration that drops the old.

---

## 9. Rollback

```sh
# In Vercel dashboard → Deployments → ... → Promote to production
```

Or via CLI:
```sh
vercel rollback <deployment-url>
```

If the rollback target predates a migration, restore Neon from a backup
first (Neon has point-in-time restore on paid plans).

---

## 10. Cost ballpark

For a single owner + occasional advisor use, expected monthly cost:

- Vercel Hobby: $0 (60-second functions are not available — upgrade if PDF generation times out)
- Vercel Pro: $20
- Neon Free: $0 for ~0.5 GB / 100 hrs compute
- Neon Launch: $19 for 10 GB
- Anthropic: $5–50 depending on AI use
- Resend Free: 3k/month included

**Expected month-1 total: $20–70.**

---

## Appendix A — Vercel Postgres instead of Neon

Vercel's native "Vercel Postgres" is now powered by Neon. Same setup:
add the integration in **Storage → Create Database**, choose Postgres,
and Vercel automatically wires `POSTGRES_URL` + friends. Rename them in
your env to `DATABASE_URL` and `DIRECT_URL` to match the schema, or
update `prisma/schema.prisma` to read the Vercel-native names.

## Appendix B — Useful CLI

```sh
# Pull production env into a local file (doesn't commit it)
vercel env pull .env.production.local

# Run a migration against production from your machine
DATABASE_URL=$(grep DIRECT_URL .env.production.local | cut -d= -f2) \
  pnpm prisma migrate deploy

# Tail production logs
vercel logs <project> --follow
```
