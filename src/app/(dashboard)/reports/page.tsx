import { FileText } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);
  return (
    <ModulePlaceholder
      title="Reports"
      description="Management, financial, operational, marketing, and investor reports."
      icon={FileText}
      phase="Phase 9 — Report generator"
      emptyTitle="No reports have been generated yet"
      emptyDescription="Daily operating brief, monthly management report, and PDF/CSV exports will be available once Phase 9 ships."
    />
  );
}
