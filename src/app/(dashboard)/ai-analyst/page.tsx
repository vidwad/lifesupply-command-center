import { Bot } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/ModulePlaceholder";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "AI Analyst" };

export default async function AIAnalystPage() {
  await requirePermission(PERMISSIONS.AI_USE);
  return (
    <ModulePlaceholder
      title="AI Analyst"
      description="Natural-language management assistant grounded in internal company data."
      icon={Bot}
      phase="Phase 7 — AI daily briefing"
      emptyTitle="No AI briefings have been generated yet"
      emptyDescription="The AI Analyst will summarize, recommend, draft, and analyze — never execute external actions. All prompts and outputs are logged."
    />
  );
}
