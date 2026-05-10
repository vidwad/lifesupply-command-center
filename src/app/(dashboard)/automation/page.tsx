import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  Plug,
  RefreshCw,
  Wrench,
  XCircle,
} from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { KpiCard } from "@/components/data/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getAutomationDashboard } from "@/server/services/automation";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Automation Center" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, "success" | "destructive" | "warning" | "outline"> = {
  configured: "success",
  not_configured: "outline",
  error: "destructive",
  disabled: "warning",
};

const SYNC_STATUS_BADGE: Record<string, "success" | "destructive" | "warning" | "outline"> = {
  success: "success",
  failed: "destructive",
  partial: "warning",
  running: "outline",
};

const TYPE_LABEL: Record<string, string> = {
  bigcommerce: "BigCommerce",
  quickbooks: "QuickBooks",
  mailchimp: "Mailchimp",
  ga4: "Google Analytics 4",
  openai: "OpenAI",
  anthropic: "Anthropic Claude",
  supplier_portal: "Supplier portal",
  manual_import: "Manual import",
};

export default async function AutomationPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const data = await getAutomationDashboard();

  return (
    <div>
      <PageHeader
        title="Automation Center"
        description="Integration status, sync logs, and AI run logs across all connected systems."
        breadcrumb={`${data.totals.configuredCount} of ${data.totals.integrationCount} integrations configured`}
      />

      <div className="space-y-6 p-6">
        {/* KPI row */}
        <section
          aria-label="Automation summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <KpiCard
            label="Integrations"
            value={data.totals.integrationCount.toString()}
            caption={`${data.totals.configuredCount} configured`}
            icon={Plug}
          />
          <KpiCard
            label="Configured"
            value={data.totals.configuredCount.toString()}
            caption="ready for sync"
            icon={CheckCircle2}
            tone="success"
          />
          <KpiCard
            label="In error"
            value={data.totals.errorCount.toString()}
            caption="need attention"
            icon={XCircle}
            tone={data.totals.errorCount > 0 ? "destructive" : "default"}
          />
          <KpiCard
            label="Failed syncs (24h)"
            value={data.totals.failedSyncCount24h.toString()}
            caption="last 24 hours"
            icon={AlertTriangle}
            tone={data.totals.failedSyncCount24h > 0 ? "warning" : "default"}
          />
          <KpiCard
            label="AI runs (24h)"
            value={data.totals.aiRunCount24h.toString()}
            caption="prompts logged"
            icon={Bot}
          />
        </section>

        {/* Integration cards */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Integrations
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.integrations.map((i) => (
              <Card key={i.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABEL[i.integrationType] ?? i.integrationType}
                    </p>
                    <CardTitle className="text-base">{i.name}</CardTitle>
                  </div>
                  <Badge variant={STATUS_BADGE[i.status] ?? "outline"}>
                    {i.status.replace("_", " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last sync</span>
                    <span className="font-medium">
                      {i.lastSyncAt ? formatDateTime(i.lastSyncAt) : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last success</span>
                    <span className="font-medium">
                      {i.lastSuccessfulSyncAt ? formatDateTime(i.lastSuccessfulSyncAt) : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Syncs (24h)</span>
                    <span className="font-medium tabular-nums">{i.syncCount24h}</span>
                  </div>
                  {i.failedCount24h > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-destructive">Failed (24h)</span>
                      <span className="font-medium tabular-nums text-destructive">
                        {i.failedCount24h}
                      </span>
                    </div>
                  )}
                  {i.notes && (
                    <p className="border-t pt-2 text-xs italic text-muted-foreground">{i.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sync logs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4" /> Recent sync logs
            </CardTitle>
            <CardDescription className="text-xs">
              Last 20 sync events across all integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentSyncs.length === 0 ? (
              <EmptyState
                icon={Database}
                title="No sync history yet"
                description="Sync events will appear here once integrations start running."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>Integration</TH>
                    <TH>Type</TH>
                    <TH>Status</TH>
                    <TH>Started</TH>
                    <TH align="right">Processed</TH>
                    <TH align="right">Failed</TH>
                    <TH>Notes</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.recentSyncs.map((s) => (
                    <TR key={s.id}>
                      <TD className="font-medium">{s.integrationName}</TD>
                      <TD className="text-muted-foreground">{s.syncType}</TD>
                      <TD>
                        <Badge variant={SYNC_STATUS_BADGE[s.status] ?? "outline"}>{s.status}</Badge>
                      </TD>
                      <TD className="text-muted-foreground">{formatDateTime(s.startedAt)}</TD>
                      <TD align="right" className="tabular-nums">
                        {s.recordsProcessed}
                      </TD>
                      <TD
                        align="right"
                        className={cn(
                          "tabular-nums",
                          s.recordsFailed > 0 && "font-medium text-destructive",
                        )}
                      >
                        {s.recordsFailed}
                      </TD>
                      <TD className="max-w-md truncate text-xs text-muted-foreground">
                        {s.errorSummary ?? "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            )}
          </CardContent>
        </Card>

        {/* AI runs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" /> Recent AI runs
            </CardTitle>
            <CardDescription className="text-xs">
              Last 10 logged AI prompts and outputs (server-side only — no client-side keys)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentAiRuns.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No AI runs logged yet"
                description="Each AI prompt + output is recorded here once an AI feature is used."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>Module</TH>
                    <TH>Provider / model</TH>
                    <TH>Status</TH>
                    <TH>Triggered by</TH>
                    <TH>When</TH>
                    <TH align="right">Tokens</TH>
                    <TH>Prompt preview</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.recentAiRuns.map((a) => (
                    <TR key={a.id}>
                      <TD className="font-medium">{a.module ?? "—"}</TD>
                      <TD className="text-muted-foreground">
                        <div>{a.modelProvider}</div>
                        <div className="text-xs">{a.modelName}</div>
                      </TD>
                      <TD>
                        <Badge variant="outline">{a.status}</Badge>
                      </TD>
                      <TD className="text-muted-foreground">{a.actorName ?? "—"}</TD>
                      <TD className="text-muted-foreground">{formatDateTime(a.createdAt)}</TD>
                      <TD align="right" className="text-xs tabular-nums">
                        {a.inputTokens != null && a.outputTokens != null
                          ? `${a.inputTokens} / ${a.outputTokens}`
                          : "—"}
                      </TD>
                      <TD className="max-w-md truncate text-xs text-muted-foreground">
                        {a.promptPreview}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            )}
          </CardContent>
        </Card>

        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-foreground">
                Integration credentials are configured via environment variables, not the UI.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                See <code className="rounded bg-muted px-1">.env.example</code> for the full list.
                Editable connection settings + credential rotation land in a future phase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
