-- Phase 4 — customer consent evidence + Mailchimp suppression sync (docs/19).
-- CASL-safe consent model: express/implied basis with source + dates, explicit
-- suppression, spam-complaint status, and campaign eligibility snapshots.

-- AlterEnum: new suppressed status for abuse complaints. Added, not used, in
-- this migration (Postgres forbids using a new enum value in the same txn).
ALTER TYPE "ConsentStatus" ADD VALUE IF NOT EXISTS 'complained';

-- CreateEnum
CREATE TYPE "ConsentBasis" AS ENUM ('express', 'implied', 'transactional_only', 'unknown');

-- AlterTable: customer consent evidence
ALTER TABLE "customers" ADD COLUMN "consentBasis" "ConsentBasis" NOT NULL DEFAULT 'unknown';
ALTER TABLE "customers" ADD COLUMN "consentSource" TEXT;
ALTER TABLE "customers" ADD COLUMN "consentObtainedAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN "consentExpiresAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN "suppressionReason" TEXT;
ALTER TABLE "customers" ADD COLUMN "suppressedAt" TIMESTAMP(3);

-- AlterTable: raw Mailchimp mirror fields
ALTER TABLE "marketing_contacts" ADD COLUMN "mergeFields" JSONB;
ALTER TABLE "marketing_contacts" ADD COLUMN "statusChangedAt" TIMESTAMP(3);

-- AlterTable: campaign eligibility snapshot
ALTER TABLE "campaigns" ADD COLUMN "eligibilitySnapshot" JSONB;
