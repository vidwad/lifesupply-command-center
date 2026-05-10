import { LayoutDashboard } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Executive Dashboard" };

export default async function DashboardPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  return (
    <ModulePlaceholder
      title="Executive Dashboard"
      description="Revenue, gross profit, exceptions, AI briefing, and priority tasks at a glance."
      icon={LayoutDashboard}
      phase="Phase 3 — Executive Dashboard"
      emptyTitle="Dashboard widgets land in Phase 3"
      emptyDescription="KPI cards, revenue trend, AI daily management briefing, and priority tasks will be wired to seeded data in Phase 3."
    />
  );
}
