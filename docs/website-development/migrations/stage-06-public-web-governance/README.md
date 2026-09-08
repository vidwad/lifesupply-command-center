# Stage 6 additive migration — prepared, reviewed, **not applied**

**Prepared:** September 8, 2026
**Status:** Reviewed artifact awaiting WEB-10 (migration approval). Not present in `prisma/migrations/`, not applied to any database.

## Why it is not in `prisma/migrations/`

The Render web service auto-deploys from `main` and its container command is `prisma migrate deploy && pnpm start` (`Dockerfile` line 75, `render.yaml` `autoDeploy: true`). Any migration merged to `main` is therefore applied to the production database on the next deploy. The Stage 6 instruction forbids applying a production migration as a side effect, and no staging database exists to rehearse on (BLK-02, DEC-PI-02). The migration is kept here, with the exact schema delta and the runbook steps, until the product owner records WEB-10 and a rehearsal target exists.

Stage 6 code runs on the **existing** schema (`20260907235000_public_web_foundation`, which the Render API behaviour shows is applied in production, D-09). The fields below live in `PublicContentItem.payload` (validated JSON) until promoted, and resources map onto `contentType = corporate_page` with `payload.kind = "resource"`.

## What it adds (all additive; no drop, no rename, no default change on existing rows)

| Table | Change | Replaces today's interim |
| --- | --- | --- |
| `public_content_items` | `revision INT NOT NULL DEFAULT 1`, `reviewer_id TEXT NULL` (FK users, SET NULL), `audience TEXT[] NOT NULL DEFAULT '{}'`, `related_brands TEXT[] NOT NULL DEFAULT '{}'`, `availability public_availability NULL`, `metadata JSONB NULL`, `archived_at TIMESTAMPTZ NULL` | `payload.revision`, `payload.reviewerId`; audience and brands unmodelled |
| enum `PublicContentType` | add value `resource_item` | `corporate_page` + `payload.kind = "resource"` |
| new enum `public_availability` | `operating`, `pilot`, `in_development`, `under_evaluation`, `unavailable` | status text in copy |
| new enum `public_document_access` | `public`, `restricted_request`, `historical` | restricted records kept out of the table entirely |
| `public_documents` | `access_class public_document_access NOT NULL DEFAULT 'public'`, `version TEXT NULL`, `effective_at`, `expires_at`, `storage_provider TEXT NULL`, `checksum TEXT NULL`, `byte_size INT NULL`, `content_type TEXT NULL`, `archived_at` | `fileKey = "external:<url>" \| "unattached"`; publication without a window |
| `public_metric_snapshots` | `effective_at`, `expires_at`, `currency TEXT NULL`, `entity_scope TEXT NULL` | static investor content |
| `public_contact_channels` | `effective_at`, `expires_at` | static contact directory |

`migration.sql` is the executable form; `schema.delta.prisma` is the matching Prisma model delta to paste into `prisma/schema.prisma` when the migration is adopted (then `pnpm prisma generate`).

## Rehearsal and adoption (docs/37 §Database migration)

1. Provision the staging database (BLK-02) or a disposable copy restored from the latest production backup.
2. Copy `migration.sql` to `prisma/migrations/<timestamp>_public_web_governance/migration.sql` and apply the schema delta.
3. `pnpm prisma migrate deploy` against the rehearsal database; run `pnpm prisma migrate status`; run the full test suite against it; exercise create → submit → approve → publish → unpublish → archive through `/public-web`.
4. Move `payload.revision` and `payload.reviewerId` to the new columns with the backfill in `migration.sql` §backfill (idempotent; safe to re-run).
5. Record the rehearsal in `STAGE_06_EVIDENCE.md` and `docs/RELEASE_READINESS_STATUS.md`; obtain WEB-10 sign-off.
6. Merge the migration in its own PR. The Render deploy applies it; verify `/api/public/v1/*` still returns 200 and the dashboard reads the promoted columns.

Rollback: the migration is additive; roll back the application commit and leave the columns in place (docs/37 §Rollback, step 2).
