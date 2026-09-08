-- Stage 6 public-web governance: ADDITIVE ONLY. Prepared 2026-09-08. NOT APPLIED.
-- Adopt by copying into prisma/migrations/<timestamp>_public_web_governance/ after WEB-10.

-- Enums --------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "public_availability" AS ENUM ('operating', 'pilot', 'in_development', 'under_evaluation', 'unavailable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public_document_access" AS ENUM ('public', 'restricted_request', 'historical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "PublicContentType" ADD VALUE IF NOT EXISTS 'resource_item';

-- public_content_items ------------------------------------------------------
ALTER TABLE "public_content_items"
  ADD COLUMN IF NOT EXISTS "revision"       INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "reviewerId"     TEXT NULL,
  ADD COLUMN IF NOT EXISTS "audience"       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "relatedBrands"  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "availability"   "public_availability" NULL,
  ADD COLUMN IF NOT EXISTS "metadata"       JSONB NULL,
  ADD COLUMN IF NOT EXISTS "archivedAt"     TIMESTAMP(3) NULL;

DO $$ BEGIN
  ALTER TABLE "public_content_items"
    ADD CONSTRAINT "public_content_items_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "public_content_items_siteKey_status_effectiveAt_expiresAt_idx"
  ON "public_content_items" ("siteKey", "status", "effectiveAt", "expiresAt");

-- public_documents ----------------------------------------------------------
ALTER TABLE "public_documents"
  ADD COLUMN IF NOT EXISTS "accessClass"     "public_document_access" NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS "version"         TEXT NULL,
  ADD COLUMN IF NOT EXISTS "effectiveAt"     TIMESTAMP(3) NULL,
  ADD COLUMN IF NOT EXISTS "expiresAt"       TIMESTAMP(3) NULL,
  ADD COLUMN IF NOT EXISTS "storageProvider" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "checksum"        TEXT NULL,
  ADD COLUMN IF NOT EXISTS "byteSize"        INTEGER NULL,
  ADD COLUMN IF NOT EXISTS "contentType"     TEXT NULL,
  ADD COLUMN IF NOT EXISTS "archivedAt"      TIMESTAMP(3) NULL;

CREATE INDEX IF NOT EXISTS "public_documents_siteKey_accessClass_status_idx"
  ON "public_documents" ("siteKey", "accessClass", "status");

-- public_metric_snapshots ---------------------------------------------------
ALTER TABLE "public_metric_snapshots"
  ADD COLUMN IF NOT EXISTS "effectiveAt"  TIMESTAMP(3) NULL,
  ADD COLUMN IF NOT EXISTS "expiresAt"    TIMESTAMP(3) NULL,
  ADD COLUMN IF NOT EXISTS "currency"     TEXT NULL,
  ADD COLUMN IF NOT EXISTS "entityScope"  TEXT NULL;

-- public_contact_channels ---------------------------------------------------
ALTER TABLE "public_contact_channels"
  ADD COLUMN IF NOT EXISTS "effectiveAt" TIMESTAMP(3) NULL,
  ADD COLUMN IF NOT EXISTS "expiresAt"   TIMESTAMP(3) NULL;

-- Backfill (idempotent) ------------------------------------------------------
-- Promote the interim payload fields written by Stage 6 into the new columns.
UPDATE "public_content_items"
SET "revision" = GREATEST("revision", COALESCE(("payload"->>'revision')::INTEGER, 1))
WHERE "payload" ? 'revision';

UPDATE "public_content_items"
SET "reviewerId" = "payload"->>'reviewerId'
WHERE "reviewerId" IS NULL
  AND "payload" ? 'reviewerId'
  AND ("payload"->>'reviewerId') IS NOT NULL
  AND EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "payload"->>'reviewerId');

-- Resources authored under the interim mapping become resource_item rows.
UPDATE "public_content_items"
SET "contentType" = 'resource_item'
WHERE "contentType" = 'corporate_page'
  AND "payload"->>'kind' = 'resource';
