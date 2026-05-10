import { LineChart } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requirePermission(PERMISSIONS.ANALYTICS_VIEW);
  return (
    <ModulePlaceholder
      title="Analytics"
      description="Website traffic, engagement, conversion, and campaign attribution from GA4."
      icon={LineChart}
      phase="Phase 8 — Marketing & Analytics"
      emptyTitle="No GA4 data has been connected yet"
      emptyDescription="Configure the GA4 property in Admin Settings. Dashboard supports mock data prior to live API connection."
    />
  );
}
