import { TrendingUp } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "M&A / Opportunities" };

export default async function OpportunitiesPage() {
  await requirePermission(PERMISSIONS.OPPORTUNITIES_VIEW);
  return (
    <ModulePlaceholder
      title="M&A / Opportunities"
      description="Acquisition targets, supplier relationships, strategic initiatives, and growth projects."
      icon={TrendingUp}
      phase="Phase 11+ — Strategic growth"
      emptyTitle="No opportunities yet"
      emptyDescription="Opportunity pipeline, acquisition targets, AI opportunity analysis, and diligence checklists land here."
    />
  );
}
