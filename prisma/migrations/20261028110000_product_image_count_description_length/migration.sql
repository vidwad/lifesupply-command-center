-- Product list filters on image count and description length (product owner, 2026-10-27).
-- Both columns are denormalised from what the sync already stores, so the
-- list can filter and sort on them in the database across the whole
-- catalogue. The backfill reads the same fields the sync mapper reads.

ALTER TABLE "products" ADD COLUMN     "imageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "descriptionLength" INTEGER NOT NULL DEFAULT 0;

UPDATE "products" SET
  "imageCount" = CASE
    WHEN jsonb_typeof("metadata"->'bcRaw'->'images') = 'array'
      THEN jsonb_array_length("metadata"->'bcRaw'->'images')
    ELSE 0
  END,
  "descriptionLength" = length(btrim(regexp_replace(coalesce("description", ''), '<[^>]*>', '', 'g')));

CREATE INDEX "products_imageCount_idx" ON "products"("imageCount");

CREATE INDEX "products_descriptionLength_idx" ON "products"("descriptionLength");
