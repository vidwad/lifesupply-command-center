-- Phase 7 — Supplier automation production hardening.
--
-- 1. New read-only workflow kind: sku_check.
--    (ADD VALUE only — the value is never referenced in this migration, so
--    running inside the migration transaction is safe on Postgres 16.)
ALTER TYPE "AutomationWorkflow" ADD VALUE IF NOT EXISTS 'sku_check';

-- 2. Durable evidence payloads. Screenshot bytes now live in the row
--    (storageRef "db:<sha256>") so evidence survives worker restarts and is
--    reviewable from the run detail page. An S3-style driver can supersede
--    this later without a further schema change.
ALTER TABLE "automation_evidence"
  ADD COLUMN "data" BYTEA,
  ADD COLUMN "contentType" TEXT;
