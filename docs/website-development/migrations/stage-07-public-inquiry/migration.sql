-- Stage 7 public inquiries: ADDITIVE ONLY. Prepared 2026-09-08. NOT APPLIED.
-- Adopt by copying into prisma/migrations/<timestamp>_public_inquiries/ after WEB-10.

CREATE TABLE IF NOT EXISTS "public_inquiries" (
  "id"               TEXT PRIMARY KEY,
  "reference"        TEXT NOT NULL,
  "intent"           TEXT NOT NULL,
  "source_brand"     TEXT NOT NULL,
  "source_path"      TEXT NOT NULL,
  "contact"          JSONB NOT NULL,
  "fields"           JSONB NOT NULL DEFAULT '{}'::jsonb,
  "consent_marketing" BOOLEAN NOT NULL DEFAULT FALSE,
  "campaign"         JSONB NULL,
  "idempotency_key"  TEXT NOT NULL,
  "client_hash"      TEXT NOT NULL,
  "owner_channel"    TEXT NOT NULL,
  "assigned_to_id"   TEXT NULL,
  "status"           TEXT NOT NULL DEFAULT 'received',
  "acknowledgment"   JSONB NOT NULL DEFAULT '{"state":"pending","attempts":0,"sentAt":null,"lastError":null}'::jsonb,
  "notification"     JSONB NOT NULL DEFAULT '{"state":"pending","attempts":0,"sentAt":null,"lastError":null}'::jsonb,
  "task_id"          TEXT NULL,
  "received_at"      TIMESTAMP(3) NOT NULL,
  "retention_until"  TIMESTAMP(3) NOT NULL,
  "closed_at"        TIMESTAMP(3) NULL,
  "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_inquiries_status_check"
    CHECK ("status" IN ('received', 'assigned', 'in_progress', 'closed', 'spam')),
  CONSTRAINT "public_inquiries_intent_check"
    CHECK ("intent" IN ('clinic_development', 'equipment_quote', 'ongoing_procurement', 'metabolic_program',
                        'pharmacy', 'supplier', 'investor', 'shareholder', 'acquisition', 'general'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "public_inquiries_reference_key" ON "public_inquiries" ("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "public_inquiries_idempotency_key_key" ON "public_inquiries" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "public_inquiries_status_received_at_idx" ON "public_inquiries" ("status", "received_at" DESC);
CREATE INDEX IF NOT EXISTS "public_inquiries_client_hash_received_at_idx" ON "public_inquiries" ("client_hash", "received_at" DESC);
CREATE INDEX IF NOT EXISTS "public_inquiries_retention_until_idx" ON "public_inquiries" ("retention_until");

DO $$ BEGIN
  ALTER TABLE "public_inquiries"
    ADD CONSTRAINT "public_inquiries_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public_inquiries"
    ADD CONSTRAINT "public_inquiries_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
