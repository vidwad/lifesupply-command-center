import { Building2 } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  await requirePermission(PERMISSIONS.SUPPLIERS_VIEW);
  return (
    <ModulePlaceholder
      title="Suppliers"
      description="Supplier records, portal status, supplier products, cost history, and automation readiness."
      icon={Building2}
      phase="Phase 4 — Operating data"
      emptyTitle="No suppliers have been added yet"
      emptyDescription="Supplier profiles (BBM01 / Best Buy Medical and others), product mappings, and portal credential references land here."
    />
  );
}
