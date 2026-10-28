-- Product Studio report thumbnails (2026-10-28).
-- The summary PDF read every image at full size and shrank it on request,
-- which was more than the web service could do within one request for a
-- few dozen projects. Each asset now stores a report-sized JPEG, written
-- when it is created; the worker fills the column for existing assets at
-- start-up, so no backfill runs here.

ALTER TABLE "product_studio_assets" ADD COLUMN "reportThumbnail" BYTEA;
