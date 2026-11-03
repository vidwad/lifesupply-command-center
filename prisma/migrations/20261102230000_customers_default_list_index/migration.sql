-- Default order of the customers list (2026-11-02). The list shows the most
-- recent order first, customers who have never ordered last, fifty at a
-- time; without this index every page sorted all 75,000 customers. The
-- leading column serves the "not deleted" condition and the rest matches
-- the ORDER BY, so the scan stops after one page. NULLS LAST is part of the
-- order, so it is part of the index: a plain DESC index sorts nulls first
-- and would not serve the query.

CREATE INDEX "customers_deletedAt_lastOrderAt_createdAt_id_idx" ON "customers"("deletedAt", "lastOrderAt" DESC NULLS LAST, "createdAt" DESC, "id");
