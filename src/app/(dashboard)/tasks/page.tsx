import { ClipboardList } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Tasks & Workflows" };

export default async function TasksPage() {
  await requirePermission(PERMISSIONS.TASKS_VIEW);
  return (
    <ModulePlaceholder
      title="Tasks & Workflows"
      description="Convert insight into action and accountability."
      icon={ClipboardList}
      phase="Phase 6 — Task & exception management"
      emptyTitle="No tasks yet"
      emptyDescription="Tasks can be linked to orders, customers, products, suppliers, campaigns, financial periods, reports, and opportunities."
    />
  );
}
