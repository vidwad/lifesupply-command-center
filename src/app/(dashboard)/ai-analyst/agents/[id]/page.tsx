import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { findAcceptedTasks } from "@/server/services/ai/agents/accept";
import { agentOutputSchema } from "@/server/services/ai/agents/output-schema";
import { getAgent } from "@/server/services/ai/agents/registry";
import { getAgentRun } from "@/server/services/ai/agents/runner";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { AcceptRecommendationButton } from "./accept-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const SEVERITY_VARIANT: Record<string, "warning" | "destructive" | "outline"> = {
  low: "outline",
  medium: "outline",
  high: "warning",
  urgent: "destructive",
};

export default async function AgentRunDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  const canCreateTasks = userHasPermission(user, PERMISSIONS.TASKS_CREATE);
  const { id } = await params;
  const run = await getAgentRun(id);
  if (!run) notFound();

  const agent = getAgent(run.agentKey);
  const acceptedIndices = new Set(
    (await findAcceptedTasks(run.id)).map((t) => t.recommendationIndex),
  );
  const output =
    run.status === "succeeded" && run.outputJson ? agentOutputSchema.parse(run.outputJson) : null;
  const skipped = (Array.isArray(run.skippedTools) ? run.skippedTools : []) as {
    toolKey: string;
    reason: string;
  }[];
  const sources = (run.sourceReferences ?? {}) as Record<string, string>;

  return (
    <div>
      <PageHeader
        title={agent?.name ?? run.agentKey}
        description="AI analysis — recommendations are suggestions for human review, not decisions or actions."
        breadcrumb={
          <Link
            href="/ai-analyst/agents"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> AI agents
          </Link>
        }
        actions={
          <Badge
            variant={
              run.status === "succeeded"
                ? "success"
                : run.status === "failed"
                  ? "destructive"
                  : "warning"
            }
          >
            {run.status}
          </Badge>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {run.errorSummary && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm text-destructive">Run failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{run.errorSummary}</p>
              </CardContent>
            </Card>
          )}

          {output && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{output.summary}</p>
                </CardContent>
              </Card>

              {output.findings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {output.findings.map((f, i) => (
                        <li key={i} className="rounded-md border p-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-medium">{f.title}</p>
                            <span className="flex shrink-0 items-center gap-2">
                              {f.severity && (
                                <Badge variant={SEVERITY_VARIANT[f.severity] ?? "outline"}>
                                  {f.severity}
                                </Badge>
                              )}
                              {f.confidence != null && (
                                <span className="text-[10px] text-muted-foreground">
                                  conf {(f.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {output.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recommendations</CardTitle>
                    <CardDescription className="text-xs">
                      Creating a task is your action, not the agent&apos;s — tasks are tagged
                      ai_recommendation and link back to this run.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {output.recommendations.map((r, i) => (
                        <li key={i} className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                {r.title}
                                {r.requiresApproval && (
                                  <Badge variant="warning" className="ml-2">
                                    approval required
                                  </Badge>
                                )}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                              {r.suggestedTask && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Suggested task: “{r.suggestedTask.title}” (
                                  {r.suggestedTask.priority})
                                </p>
                              )}
                            </div>
                            {canCreateTasks && (
                              <AcceptRecommendationButton
                                runId={run.id}
                                index={i}
                                alreadyAccepted={acceptedIndices.has(i)}
                              />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {run.createdTaskIds.length > 0 && (
                      <p className="mt-3 border-t pt-3 text-xs text-success">
                        {run.createdTaskIds.length} task
                        {run.createdTaskIds.length === 1 ? "" : "s"} created from this run —{" "}
                        <Link href="/tasks" className="text-primary hover:underline">
                          view tasks
                        </Link>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {(output.assumptions.length > 0 || output.limitations.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Assumptions & limitations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-muted-foreground">
                    {output.assumptions.length > 0 && (
                      <div>
                        <p className="font-medium uppercase tracking-wide">Assumptions</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {output.assumptions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {output.limitations.length > 0 && (
                      <div>
                        <p className="font-medium uppercase tracking-wide">Limitations</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {output.limitations.map((l, i) => (
                            <li key={i}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Run metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Agent" value={run.agentKey.replace(/_/g, " ")} />
                <Row
                  label="Triggered by"
                  value={run.triggeredBy?.name ?? run.triggeredBy?.email ?? "—"}
                />
                <Row label="Started" value={formatDateTime(run.startedAt)} />
                <Row
                  label="Completed"
                  value={run.completedAt ? formatDateTime(run.completedAt) : "—"}
                />
                {output?.confidence != null && (
                  <Row label="Confidence" value={`${(output.confidence * 100).toFixed(0)}%`} />
                )}
                {run.aiOutput && (
                  <Row
                    label="Model"
                    value={`${run.aiOutput.modelProvider}/${run.aiOutput.modelName}`}
                  />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sources</CardTitle>
              <CardDescription className="text-xs">
                Data the agent analyzed — collected server-side with your permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {Object.entries(sources).map(([tool, source]) => (
                <p key={tool}>
                  <span className="font-mono">{tool}</span>: {source}
                </p>
              ))}
              {skipped.length > 0 && (
                <div className="border-t pt-2">
                  <p className="font-medium uppercase tracking-wide">Skipped tools</p>
                  {skipped.map((s) => (
                    <p key={s.toolKey}>
                      <span className="font-mono">{s.toolKey}</span>: {s.reason}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}
