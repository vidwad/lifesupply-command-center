import { Boxes } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Products & Catalog" };

export default async function ProductsPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  return (
    <ModulePlaceholder
      title="Products & Catalog"
      description="Product data quality, supplier mapping, margin, and catalog optimization."
      icon={Boxes}
      phase="Phase 4 — Operating data"
      emptyTitle="No products have been imported yet"
      emptyDescription="Product list, image and description quality flags, supplier SKU mapping, and margin will populate from BigCommerce sync."
    />
  );
}
