import { Megaphone } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Marketing" };

export default async function MarketingPage() {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);
  return (
    <ModulePlaceholder
      title="Marketing"
      description="Customer reactivation, Mailchimp campaigns, segmentation, and AI campaign drafts."
      icon={Megaphone}
      phase="Phase 8 — Marketing & Analytics"
      emptyTitle="No campaigns have been synced yet"
      emptyDescription="Connect Mailchimp to begin tracking audiences, campaigns, and reactivation segments. AI drafts always require approval before sending."
    />
  );
}
