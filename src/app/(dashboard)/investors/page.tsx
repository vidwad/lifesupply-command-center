import { Briefcase } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Investor Relations" };

export default async function InvestorsPage() {
  await requirePermission(PERMISSIONS.INVESTORS_VIEW);
  return (
    <ModulePlaceholder
      title="Investor Relations"
      description="Capital raising, investor updates, lender reporting, and shareholder communications."
      icon={Briefcase}
      phase="Phase 11+ — Investor module"
      emptyTitle="No investor records yet"
      emptyDescription="Investor contacts, financing pipeline, approved updates, and AI draft tools live here. All investor-facing materials require approval."
    />
  );
}
