import { CircleDollarSign } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Financials" };

export default async function FinancialsPage() {
  await requirePermission(PERMISSIONS.FINANCIALS_VIEW_SUMMARY);
  return (
    <ModulePlaceholder
      title="Financials"
      description="Management-level financial reporting across consolidated and divisional operations."
      icon={CircleDollarSign}
      phase="Phase 5 — Financial dashboard"
      emptyTitle="No financial periods are available"
      emptyDescription="Import a QuickBooks export or create a sample period. QuickBooks remains the accounting source of truth — this view is for management reporting only."
    />
  );
}
