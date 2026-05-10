import { Gauge } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Operations" };

export default async function OperationsPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_OPERATIONS_VIEW);
  return (
    <ModulePlaceholder
      title="Operations Control Center"
      description="Order queues, supplier exceptions, and operational accountability."
      icon={Gauge}
      phase="Phase 4 — Operations"
      emptyTitle="Operations control center comes in Phase 4"
      emptyDescription="Order queue, supplier exception table, and right-drawer detail will live here once the orders/customers/products foundation is seeded."
    />
  );
}
