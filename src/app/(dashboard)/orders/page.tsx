import { ShoppingCart } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  await requirePermission(PERMISSIONS.ORDERS_VIEW);
  return (
    <ModulePlaceholder
      title="Orders"
      description="Normalized order management across BigCommerce stores and future channels."
      icon={ShoppingCart}
      phase="Phase 4 — Operating data"
      emptyTitle="No orders have been imported yet"
      emptyDescription="Connect BigCommerce or load seed data to populate the order list, detail pages, and supplier mapping."
    />
  );
}
