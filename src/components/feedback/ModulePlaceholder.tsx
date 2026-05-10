import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
  emptyTitle: string;
  emptyDescription: string;
};

/**
 * Shared placeholder for dashboard module pages that ship in later phases.
 * Real implementations should replace this entirely, not extend it.
 */
export function ModulePlaceholder({
  title,
  description,
  icon,
  phase,
  emptyTitle,
  emptyDescription,
}: Props) {
  return (
    <div>
      <PageHeader title={title} description={description} breadcrumb={phase} />
      <div className="p-6">
        <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
      </div>
    </div>
  );
}
