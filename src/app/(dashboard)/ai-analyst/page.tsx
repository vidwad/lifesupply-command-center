import { Bot, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listRecentAiOutputs } from "@/server/services/ai";
import { requirePermission } from "@/server/permissions";

import { AnalystChat } from "./analyst-chat";

export const metadata = { title: "AI Analyst" };
export const dynamic = "force-dynamic";

const SUGGESTED_PROMPTS = [
  "Summarize this month's performance.",
  "Which orders need management attention right now?",
  "Identify our lowest-margin products and what to do about them.",
  "Draft a customer reactivation plan for Wellmart.",
  "Explain the change in gross margin vs. last month.",
  "What supplier risks should we address before the next quarter?",
];

const MODULE_LABEL: Record<string, string> = {
  analyst_query: "Q&A",
  dashboard_briefing: "Daily briefing",
  financial_commentary: "Financial commentary",
  reactivation_summary: "Reactivation",
  supplier_exception_summary: "Supplier exceptions",
};

const MODULE_BADGE: Record<string, "secondary" | "outline" | "warning"> = {
  analyst_query: "secondary",
  dashboard_briefing: "outline",
  financial_commentary: "outline",
  reactivation_summary: "outline",
  supplier_exception_summary: "warning",
};

export default async function AiAnalystPage() {
  await requirePermission(PERMISSIONS.AI_USE);
  const recent = await listRecentAiOutputs({ limit: 12 });

  return (
    <div>
      <PageHeader
        title="AI Analyst"
        description="Ask questions about your operating, financial, marketing, and customer data. Server-side only — prompts and outputs are logged."
        breadcrumb="Powered by Anthropic Claude"
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" /> Ask the analyst
              </CardTitle>
              <CardDescription className="text-xs">
                The analyst sees the same dashboard snapshot you see — current period financials,
                operations counts, exceptions, top products, recent campaigns, priority tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalystChat suggestions={SUGGESTED_PROMPTS} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guardrails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The AI Analyst can summarize, recommend, draft, and analyze. It cannot send emails,
                place supplier orders, push updates to BigCommerce or QuickBooks, or change any
                external system.
              </p>
              <p>
                Every prompt and output is recorded as an{" "}
                <code className="rounded bg-muted px-1">AiOutput</code> row and audited; you can
                review them in <span className="font-medium">/automation</span> →{" "}
                <span className="font-medium">Recent AI runs</span>.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Side column — recent outputs */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent AI outputs</CardTitle>
            <CardDescription className="text-xs">All modules, last {recent.length}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            {recent.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No AI outputs yet"
                description="Ask a question or generate a briefing to populate this list."
                className="border-0 bg-transparent"
              />
            ) : (
              <ul className="divide-y">
                {recent.map((o) => (
                  <li key={o.id} className="space-y-1 py-3 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={MODULE_BADGE[o.module ?? ""] ?? "outline"}
                        className="text-[10px]"
                      >
                        {MODULE_LABEL[o.module ?? ""] ?? o.module ?? "—"}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" /> {formatDateTime(o.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-medium">
                      {o.module === "analyst_query" ? o.prompt : o.output.split("\n")[0]}
                    </p>
                    {o.module === "analyst_query" && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {o.output.split("\n")[0]}
                      </p>
                    )}
                    {o.user && (
                      <p className="text-[10px] text-muted-foreground">
                        by {o.user.name ?? o.user.email}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
