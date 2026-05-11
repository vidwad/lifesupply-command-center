# Deploying to Render

Production-deployment runbook for putting LifeSupply Command Center on
Render. The repo includes a `render.yaml` blueprint that defines the
web service + database + nightly cron in one apply.

**Estimated first-time setup: 15 minutes.**

---

## Why Render

- **Single platform** for web + database + cron + (later) background workers
- **Playwright + Chromium run natively** — the supplier-portal automation
  (BBM01) works without a second host. The `Dockerfile` uses the official
  Playwright base image so the chromium binary is already installed.
- **No request-duration limits** — PDF/XLSX generation, AI calls, and
  Playwright runs never get killed mid-request.
- **Persistent disk** available if you later wire S3-style evidence storage.
- **Flat pricing**: $7/mo per service, $7/mo Postgres Starter. Year-1
  total ≈ $21/mo (web + cron + DB), bumps to $25 if you want Standard DB
  with daily backups + PITR.
- **Auto-deploy from GitHub** + preview environments per PR.

---

## 1. Provision via blueprint (the fast path)

1. Sign up at https://render.com.
2. **Dashboard → New → Blueprint**.
3. Connect your GitHub account, pick `vidwad/lifesupply-command-center`.
4. Render reads `render.yaml` and shows you the resources it will create:
   - `lifesupply-cc-db` (Postgres 16, Starter $7/mo)
   - `lifesupply-cc-web` (Docker web service, Starter $7/mo)
   - `lifesupply-cc-audit-retention` (Cron Docker service, runs 03:15 UTC daily)
5. Click **Apply**. Render provisions the DB first, then builds + deploys
   the web service (~6 minutes for the first build because Chromium is
   bundled into the image; subsequent builds are cached and faster).

The blueprint auto-generates `AUTH_SECRET` and `MASTER_ENCRYPTION_KEY` so
you don't have to. It also wires `DATABASE_URL` + `DIRECT_URL` to the new
Postgres instance.

---

## 2. Fill in the manual env vars

Some values can't be generated — Render will deploy with them blank and
some features will be inactive until you set them. Find them in
**lifesupply-cc-web → Environment**:

| Var | Required? | Value |
|---|---|---|
| `AUTH_URL` | yes (after first deploy) | `https://lifesupply-cc-web.onrender.com` initially; update to your custom domain later |
| `NEXT_PUBLIC_APP_URL` | yes | same as `AUTH_URL` |
| `ANTHROPIC_API_KEY` | for AI features | from https://console.anthropic.com |
| `RESEND_API_KEY` | for investor email | from https://resend.com |
| `INVESTOR_FROM_EMAIL` | for investor email | a verified sender |
| `SUPPLIER_PORTAL_BBM01_URL` | for live BBM01 portal | leave blank to use in-repo mock |

After saving, Render redeploys automatically.

For the cron service (`lifesupply-cc-audit-retention`), copy
`MASTER_ENCRYPTION_KEY` from the web service into the cron's env so it
can decrypt audit-relevant credentials when needed. Set
`AUDIT_RETENTION_DAYS` if you want to override the 365-day default.

---

## 3. First-time admin setup

Render doesn't auto-seed. Two options:

### Option A — Run the seed from your local machine

```sh
# Pull the production DATABASE_URL into a local file (one-time)
# Render → Database → Connections → Copy the External Connection String

# Then run:
DATABASE_URL="<external-string>" \
DIRECT_URL="<external-string>" \
DEV_ADMIN_EMAIL=you@yourcompany.com \
DEV_ADMIN_PASSWORD="<choose-a-strong-one>" \
pnpm db:seed
```

This populates roles, permissions, the Super Admin user, prompt
templates, and feature flag rows.

### Option B — Render shell

In the Render dashboard, web service → **Shell** tab gives you a live
bash inside the running container. Run:

```sh
DEV_ADMIN_EMAIL=you@yourcompany.com \
DEV_ADMIN_PASSWORD="<choose-a-strong-one>" \
pnpm db:seed
```

You only do this once. Subsequent admin users are created via
`/admin/users`.

---

## 4. Verify

1. Visit `https://lifesupply-cc-web.onrender.com/api/health` —
   should return `{"status": "ok"}` with DB ping + Anthropic credential.
2. Sign in at `/login` with the seeded credentials.
3. Set up integrations at `/admin/integrations`.
4. Review feature flags at `/admin/feature-flags` (all OFF by default).

---

## 5. Custom domain

1. **lifesupply-cc-web → Settings → Custom Domains → Add Custom Domain**.
2. Render gives you DNS records to add at your registrar.
3. After DNS propagates, update `AUTH_URL` + `NEXT_PUBLIC_APP_URL` to the
   custom domain.
4. Render handles the SSL certificate automatically.

---

## 6. Live supplier portal (BBM01)

Unlike Vercel, Render **can** run Playwright. To go live:

1. Set credentials at `/admin/integrations → Supplier portal`.
2. Set `SUPPLIER_PORTAL_BBM01_URL` to the live BBM01 portal URL (env-only,
   not in the vault — the supplier's URL is not a secret).
3. Enable `supplier.automation` at `/admin/feature-flags`.
4. Trigger a check from `/automation/runs`.

The Playwright binaries are already in the Docker image — no extra
install step on Render.

---

## 7. Backups + restore

Render Postgres **Starter** ($7/mo) keeps the last day's snapshot. Upgrade
to **Standard** ($25/mo) for:
- Daily automated backups
- 7-day point-in-time recovery
- Read replicas

To take a manual snapshot at any time: **Database → Backups → Take backup now**.

To restore: **Database → Backups → Restore** → choose a snapshot → it
restores into a NEW database. Update `DATABASE_URL` + `DIRECT_URL` on
the web service to point at the new DB.

For self-managed backups (export to S3):

```sh
# From your local machine, using the external connection string
pg_dump "$DATABASE_URL_EXTERNAL" > backup-$(date +%Y%m%d).sql
```

---

## 8. Scaling

Default Starter plan: 0.5 CPU, 512 MB RAM, 1 instance.

If memory pressure appears (Playwright runs are memory-hungry):
- **Bump web service to Standard** ($25/mo, 1 CPU, 2 GB RAM)
- **Add a second instance** for HA — Render handles the load balancer
- Move Playwright to a separate **Background Worker** service so heavy
  runs don't block web requests

A separate worker would look like:

```yaml
- type: worker
  name: lifesupply-cc-automation-worker
  runtime: docker
  plan: standard
  dockerfilePath: ./Dockerfile
  dockerCommand: pnpm tsx scripts/worker/automation.ts
  # ... env vars same as web service
```

You'd then publish jobs via a small queue (e.g. inserted rows in a
`job_queue` table) — Phase 3 ticket, not needed for first launch.

---

## 9. Known limitations

### Cold starts
Render Starter spins down after 15 minutes of inactivity (free tier
only — paid plans stay warm). For a paid Starter plan there's no cold
start; the service runs continuously.

### Single-region today
Render web services run in one region per service. Multi-region needs
multiple deployments + DNS routing — not needed at this scale.

### Build time
First build with Chromium baked into the image takes ~6 min. Cached
builds (most pushes) take 2–3 min. If you want faster builds:
- Move to a slim base image and install only Chromium at deploy time
- Cache the Playwright browsers in a Render disk

---

## 10. Continuous deployment

`autoDeploy: true` is set in `render.yaml`. Every push to `main` builds
+ deploys automatically. The startup command runs
`prisma migrate deploy` before booting Next, so schema changes ship
with the code (idempotent — safe to re-run).

For high-risk schema changes use expand-contract (see `docs/OPS_RUNBOOK.md` §10).

---

## 11. Cost ballpark

| Plan | Monthly |
|---|---|
| Web service Starter | $7 |
| Postgres Starter | $7 |
| Cron Starter | $7 |
| **Subtotal** | **$21** |
| Anthropic | $5–50 (usage) |
| Resend Free | $0 (3k emails/mo) |

Total: **$26–71/mo** depending on AI volume.

Bump web + DB to Standard for 2GB RAM + daily backups: +$36/mo.

---

## 12. Rollback

Render → web service → **Deploys** → click a previous deploy → **Rollback to this deploy**.

If the rollback target predates a destructive migration, restore the DB
from a backup first (§7).

---

## Appendix A — Useful CLI

Render's CLI is optional but handy:

```sh
# Install
brew install render-oss/render/render   # mac
# or `curl -sSL https://render.com/install.sh | bash` on linux

# Tail logs
render logs lifesupply-cc-web --follow

# SSH into the running container
render ssh lifesupply-cc-web
```

## Appendix B — Falling back to Vercel

The repo also includes `vercel.json` + `docs/DEPLOYMENT_VERCEL.md` if you
want to compare. The two configs co-exist — choose one at deploy time;
the unused config is just files on disk.
