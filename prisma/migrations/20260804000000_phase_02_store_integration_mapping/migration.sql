-- Phase 2 — explicit Store ↔ IntegrationConnection mapping (docs/19).
-- Replaces the fragile "strip 'BigCommerce — ' prefix and match Store.name"
-- logic in the sync dispatcher with a real foreign key.

-- AlterTable
ALTER TABLE "integration_connections" ADD COLUMN "storeId" TEXT;

-- CreateIndex
CREATE INDEX "integration_connections_storeId_idx" ON "integration_connections"("storeId");

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data backfill: map existing BigCommerce connections to their Store using the
-- legacy display-name convention ("BigCommerce — <Store name>"), so
-- deployments created before this migration keep syncing without manual
-- re-mapping. New or renamed connections are mapped explicitly in
-- /admin/integrations; the dispatcher no longer falls back to name matching.
UPDATE "integration_connections" AS ic
SET "storeId" = s."id"
FROM "stores" AS s
WHERE ic."integrationType" = 'bigcommerce'
  AND ic."storeId" IS NULL
  AND lower(btrim(regexp_replace(ic."name", '^BigCommerce\s*[—–-]\s*', '', 'i'))) = lower(s."name");
