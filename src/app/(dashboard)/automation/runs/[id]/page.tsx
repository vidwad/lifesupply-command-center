import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { getAutomationRun } from "@/server/services/automation/runs";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { SubmitOrderForm } from "./submit-form";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "destructive" | "secondary" | "outline" | "default"
> = {
  prepared: "outline",
  awaiting_approval: "warning",
  approved: "secondary",
  running: "secondary",
  succeeded: "success",
  failed: "destructive",
  cancelled: "outline",
};

const STEP_VARIANT: Record<
  string,
  "warning" | "success" | "destructive" | "secondary" | "outline"
> = {
  pending: "outline",
  running: "secondary",
  succeeded: "success",
  failed: "destructive",
  skipped: "outline",
};

const VERDICT_VARIANT: Record<string, "warning" | "success" | "destructive" | "outline"> = {
  ok: "success",
  warn: "warning",
  mismatch: "destructive",
  unknown: "outline",
};

type ComparisonFlagView = {
  rule: string;
  verdict: string;
  detail: string;
  expected: string | number | null;
  captured: string | number | null;
};

function isComparisonFlags(value: unknown): value is ComparisonFlagView[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (f) =>
        f != null &&
        typeof f === "object" &&
        typeof (f as { rule?: unknown }).rule === "string" &&
        typeof (f as { verdict?: unknown }).verdict === "string",
    )
  );
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const run = await getAutomationRun(id);
  return { title: run ? `Automation run ${run.workflow}` : "Automation run" };
}

export default async function AutomationRunDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.SUPPLIERS_VIEW);
  const { id } = await params;
  const run = await getAutomationRun(id);
  if (!run) notFound();

  const canSubmit = userHasPermission(user, PERMISSIONS.SUPPLIERS_APPROVE_ORDER_AUTOMATION);

  // Look up the linked Approval row, if any.
  const approval = run.approvalId
    ? await prisma.approval.findUnique({
        where: { id: run.approvalId },
        select: { id: true, status: true, decisionNotes: true, decidedAt: true },
      })
    : null;

  const isReadyToSubmit =
    run.workflow === "prepare_order" &&
    run.status === "awaiting_approval" &&
    approval?.status === "approved";

  // Exceptions raised by this run (Phase 7 checks record their ids).
  const resultObj =
    run.result && typeof run.result === "object" && !Array.isArray(run.result)
      ? (run.result as { exceptionIds?: unknown })
      : null;
  const exceptionIds = Array.isArray(resultObj?.exceptionIds)
    ? resultObj.exceptionIds.filter((v): v is string => typeof v === "string")
    : [];
  const exceptionLinks =
    exceptionIds.length > 0
      ? await prisma.exception.findMany({
          where: { id: { in: exceptionIds } },
          select: { id: true, title: true, severity: true, status: true, recurringKey: true },
        })
      : [];

  return (
    <div>
      <PageHeader
        title={`Run · ${run.workflow.replace(/_/g, " ")}`}
        description={run.summary ?? "No summary."}
        breadcrumb={
          <Link href="/automation/runs" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Automation runs
          </Link>
        }
        actions={<Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>{run.status}</Badge>}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {run.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No steps recorded.</p>
              ) : (
                <ol className="space-y-3">
                  {run.steps.map((s) => (
                    <li key={s.id} className="rounded-md border p-3">
                      <div className="flex items-baseline justify-between">
                        <code className="text-xs font-medium">{s.stepKey}</code>
                        <Badge variant={STEP_VARIANT[s.status] ?? "outline"}>{s.status}</Badge>
                      </div>
                      {s.errorMessage && (
                        <p className="mt-1 text-xs text-destructive">{s.errorMessage}</p>
                      )}
                      {s.output != null && (
                        <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2 text-[11px]">
                          {JSON.stringify(s.output, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {Array.isArray(run.validationFlags) && run.validationFlags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Comparison / validation flags</CardTitle>
              </CardHeader>
              <CardContent>
                {isComparisonFlags(run.validationFlags) ? (
                  <ul className="space-y-2">
                    {run.validationFlags.map((flag, i) => (
                      <li key={i} className="rounded-md border p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <code className="text-xs font-medium">{flag.rule}</code>
                          <Badge variant={VERDICT_VARIANT[flag.verdict] ?? "outline"}>
                            {flag.verdict}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{flag.detail}</p>
                        {(flag.expected != null || flag.captured != null) && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Expected: <code>{String(flag.expected ?? "—")}</code> · Portal:{" "}
                            <code>{String(flag.captured ?? "—")}</code>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-[11px]">
                    {JSON.stringify(run.validationFlags, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {exceptionLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Exceptions raised</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {exceptionLinks.map((ex) => (
                    <li key={ex.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{ex.title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant={
                            ex.severity === "high" || ex.severity === "urgent"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {ex.severity}
                        </Badge>
                        <Link
                          href={`/operations/exceptions?q=${ex.recurringKey ?? run.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Open →
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {run.result != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-80 overflow-auto rounded bg-muted p-3 text-[11px]">
                  {JSON.stringify(run.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Run metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Workflow">{run.workflow.replace(/_/g, " ")}</Row>
                <Row label="Supplier">
                  {run.supplier ? `${run.supplier.code} — ${run.supplier.name}` : "—"}
                </Row>
                <Row label="Order">
                  {run.order ? (
                    <Link href={`/orders/${run.order.id}`} className="text-primary hover:underline">
                      {run.order.orderNumber}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Triggered by">
                  {run.triggeredBy?.name ?? run.triggeredBy?.email ?? "—"}
                </Row>
                <Row label="Started">{formatDateTime(run.startedAt)}</Row>
                <Row label="Completed">
                  {run.completedAt ? formatDateTime(run.completedAt) : "—"}
                </Row>
                {run.errorSummary && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Error</dt>
                    <dd className="mt-1 rounded bg-destructive/10 p-2 text-xs text-destructive">
                      {run.errorSummary}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {approval && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Linked approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant={STATUS_VARIANT[approval.status] ?? "outline"}>
                    {approval.status}
                  </Badge>
                  {approval.decidedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(approval.decidedAt)}
                    </span>
                  )}
                </div>
                {approval.decisionNotes && (
                  <p className="text-xs text-muted-foreground">{approval.decisionNotes}</p>
                )}
                <Link
                  href={`/approvals/${approval.id}`}
                  className="inline-block text-xs text-primary hover:underline"
                >
                  Open approval →
                </Link>
              </CardContent>
            </Card>
          )}

          {run.workflow === "prepare_order" && canSubmit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Submit to supplier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  Live submission requires both <code>supplier.automation</code> AND{" "}
                  <code>supplier.order_submit</code> feature flags ON, plus an approved approval
                  row. The runner is not wired yet — submitting will fail with a clear error
                  describing the missing piece.
                </p>
                <SubmitOrderForm runId={run.id} disabled={!isReadyToSubmit} />
              </CardContent>
            </Card>
          )}

          {run.evidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Evidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {run.evidence.map((e) => {
                  const viewable = e.storageRef.startsWith("db:");
                  return (
                    <figure key={e.id} className="space-y-1">
                      {viewable && e.kind === "screenshot" ? (
                        <a
                          href={`/api/automation/evidence/${e.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open full size"
                        >
                          {/* Authenticated dynamic route serves the bytes — next/image
                              optimization would break the session-gated fetch. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/automation/evidence/${e.id}`}
                            alt={e.label ?? "Automation evidence screenshot"}
                            className="max-h-48 w-full rounded-md border object-contain"
                          />
                        </a>
                      ) : null}
                      <figcaption className="text-xs text-muted-foreground">
                        <span className="font-mono">{e.kind}</span> · {e.label ?? e.storageRef}
                        {e.bytes != null && <> · {(e.bytes / 1024).toFixed(0)} KB</>}
                        {e.contentHash && (
                          <>
                            {" "}
                            · <span title={e.contentHash}>sha256:{e.contentHash.slice(0, 8)}…</span>
                          </>
                        )}
                        {!viewable && " · (metadata only)"}
                      </figcaption>
                    </figure>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}
