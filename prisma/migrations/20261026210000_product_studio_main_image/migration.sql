-- Product Studio main image choice (product owner, 2026-10-26).
--
-- Additive and nullable. Null keeps the store's current main image, or lets
-- the first published draft take it when the store has none.
ALTER TABLE "product_studio_projects" ADD COLUMN "mainImageAssetId" TEXT;
