import { Users } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  await requirePermission(PERMISSIONS.CUSTOMERS_VIEW);
  return (
    <ModulePlaceholder
      title="Customers"
      description="Unified customer intelligence for B2B, retail, active, lapsed, and high-value customers."
      icon={Users}
      phase="Phase 4 — Operating data"
      emptyTitle="No customers have been imported yet"
      emptyDescription="Customer profile, purchase history, consent status, and reactivation score will populate once BigCommerce or Mailchimp data is connected."
    />
  );
}
