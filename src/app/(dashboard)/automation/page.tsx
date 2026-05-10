import { Wrench } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Automation Center" };

export default async function AutomationPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  return (
    <ModulePlaceholder
      title="Automation Center"
      description="Integration syncs, background jobs, browser automation runs, AI jobs, and errors."
      icon={Wrench}
      phase="Phase 10 — Integration settings"
      emptyTitle="No integrations have been configured yet"
      emptyDescription="BigCommerce, QuickBooks, Mailchimp, GA4, OpenAI, Claude, and supplier portals will surface their sync logs and automation runs here."
    />
  );
}
