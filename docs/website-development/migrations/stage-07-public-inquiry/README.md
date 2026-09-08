# Stage 7 additive migration — `public_inquiries` — prepared, **not applied**

**Prepared:** September 8, 2026
**Status:** Reviewed artifact awaiting WEB-10 and a rehearsal target (BLK-02). Not in `prisma/migrations/`, not applied to any database. Adopt together with the Stage 6 artifact (`../stage-06-public-web-governance/`) in one migration PR after rehearsal.

The Stage 7 code targets this table through the `SqlInquiryStore` adapter (`src/server/public-inquiry/store.ts`) with parameterised raw SQL, and probes `to_regclass('public.public_inquiries')` before accepting a submission. Until the table exists the intake answers 503 and the public site keeps the contact directory; no form is published.

## Table

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT PK` | UUID from the application |
| `reference` | `TEXT UNIQUE` | Short public reference `LS-XXXXXXXX`; not derivable from `id` |
| `intent` | `TEXT` | One of the ten persisted intents; `existing_order_support` is never stored |
| `source_brand`, `source_path` | `TEXT` | Page of origin; path only, no query string |
| `contact` | `JSONB` | `{ name, email, phone?, organization?, region? }` |
| `fields` | `JSONB` | Intent-allowlisted fields only |
| `consent_marketing` | `BOOLEAN` | Separate from the service-response consent, which is required to submit and therefore implicit |
| `campaign` | `JSONB NULL` | `utmSource`, `utmMedium`, `utmCampaign` |
| `idempotency_key` | `TEXT UNIQUE` | Client-generated; `ON CONFLICT DO NOTHING` makes a retry a no-op |
| `client_hash` | `TEXT` | Salted SHA-256 prefix of the client address; the raw address is never stored |
| `owner_channel` | `TEXT` | Server-mapped from the intent; never from the request |
| `assigned_to_id` | `TEXT NULL` → `users.id` (SET NULL) | Staff assignee |
| `status` | `TEXT` | `received`, `assigned`, `in_progress`, `closed`, `spam` |
| `acknowledgment`, `notification` | `JSONB` | `{ state, attempts, sentAt, lastError }`; state `pending`, `sent`, `failed`, `skipped` |
| `task_id` | `TEXT NULL` → `tasks.id` (SET NULL) | Hand-off |
| `received_at`, `retention_until`, `closed_at`, `updated_at` | `TIMESTAMP(3)` | Retention default 180 days (`PUBLIC_INQUIRY_RETENTION_DAYS`) |

Retention: a scheduled job (Stage 9 or the Phase 11 worker) deletes rows past `retention_until` that are `closed` or `spam`, and audits the count. Not built here.

## Rehearsal and adoption

Follow `../stage-06-public-web-governance/README.md` §Rehearsal with this `migration.sql` added; then enable `public_inquiry.intake` in Admin → Feature Flags, set `PUBLIC_SITE_ORIGINS`, submit one test inquiry from the public site, confirm the queue shows it and the audit log holds `public_inquiry.received` with no contact data, then decide `public_inquiry.send` with `PUBLIC_INQUIRY_SINK_EMAIL` set first.
