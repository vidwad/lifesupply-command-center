-- Default order of the products list (2026-10-30). The list shows the live
-- catalogue featured first, then by name, fifty at a time; without this index
-- every page sorted all 51,000 products (about two seconds on the production
-- database). The leading column serves the "not deleted" condition and the
-- rest matches the ORDER BY, so the scan stops after one page.

CREATE INDEX "products_deletedAt_isFeatured_name_id_idx" ON "products"("deletedAt", "isFeatured" DESC, "name", "id");
