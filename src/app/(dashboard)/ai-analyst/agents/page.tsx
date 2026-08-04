import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listAgents } from "@/server/services/ai/agents/registry";
import { listAgentRuns } from "@/server/services/ai/agents/runner";
import { requirePermission } from "@/server/permissions";

import { AgentRunForm } from "./agent-run-form";

export const metadata = { title: "AI agents" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  running: "warning",
  succeeded: "success",
  failed: "destructive",
};

export default async function AgentsPage() {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  const agents = listAgents();
  const runs = await listAgentRuns(25);

  return (
    <div>
      <PageHeader
        title="AI agents"
        description="Read–analyze–draft–recommend only. Agents take no actions; recommendations become tasks only when you accept them, and sensitive actions keep their approval + feature-flag gates."
        breadcrumb={
          <Link href="/ai-analyst" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> AI Analyst
          </Link>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent runs</CardTitle>
              <CardDescription className="text-xs">
                Every run records the tools used, permission-based skips, source references, and the
                validated structured output.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {runs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No agent runs yet — trigger one from the panel on the right.
                </p>
              ) : (
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Agent</TH>
                      <TH>Status</TH>
                      <TH>Summary</TH>
                      <TH>Started</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {runs.map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <Link
                            href={`/ai-analyst/agents/${r.id}`}
                            className="font-medium hover:underline"
                          >
                            {r.agentKey.replace(/_/g, " ")}
                          </Link>
                        </TD>
                        <TD>
                          <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge>
                        </TD>
                        <TD className="max-w-md">
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {r.summary ?? r.errorSummary ?? "—"}
                          </span>
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {formatDateTime(r.startedAt)}
                          <div className="text-[10px]">
                            {r.triggeredBy?.name ?? r.triggeredBy?.email ?? "—"}
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {agents.map((agent) => {
            const canRun = user.permissions.includes(agent.runPermission);
            return (
              <Card key={agent.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Bot className="h-4 w-4" /> {agent.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {canRun ? (
                    <AgentRunForm agentKey={agent.key} params={agent.params} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Requires <code className="rounded bg-muted px-1">{agent.runPermission}</code>.
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Tools: {agent.toolKeys.join(", ")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
