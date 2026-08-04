import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listAiOutputModules, listAiOutputsForReview } from "@/server/services/ai/review";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { ReviewForm } from "./review-form";

export const metadata = { title: "AI output review" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  generated: "warning",
  reviewed: "outline",
  approved: "success",
  rejected: "destructive",
  superseded: "outline",
  archived: "outline",
};

const STATUSES = ["generated", "reviewed", "approved", "rejected", "superseded", "archived"];

type SearchParams = Promise<{ module?: string; status?: string }>;

export default async function AiOutputReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission(PERMISSIONS.AI_VIEW_LOGS);
  const canDecide = userHasPermission(user, PERMISSIONS.AI_APPROVE_OUTPUT);
  const params = await searchParams;
  const status = STATUSES.includes(params.status ?? "") ? params.status : undefined;

  const [modules, outputs] = await Promise.all([
    listAiOutputModules(),
    listAiOutputsForReview({
      module: params.module || undefined,
      status: status as never,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="AI output review"
        description="Every AI generation is logged here. Review, approve, or reject outputs — approval is required before any AI content is used externally."
        breadcrumb={
          <Link href="/ai-analyst" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> AI Analyst
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <form method="get" className="flex flex-wrap items-end gap-2 text-xs">
          <label className="flex flex-col gap-1">
            <span className="font-medium uppercase tracking-wide text-muted-foreground">
              Module
            </span>
            <select
              name="module"
              defaultValue={params.module ?? ""}
              className="h-8 rounded-md border bg-background px-2"
            >
              <option value="">All</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="h-8 rounded-md border bg-background px-2"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-8 rounded-md border bg-background px-3 font-medium hover:bg-muted"
          >
            Filter
          </button>
        </form>

        {outputs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <ScrollText className="h-4 w-4" /> No AI outputs match these filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {outputs.map((o) => (
              <Card key={o.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm">
                      {(o.module ?? "unknown").replace(/_/g, " ")}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {o.modelProvider}/{o.modelName} · {formatDateTime(o.createdAt)} ·{" "}
                      {o.user?.name ?? o.user?.email ?? "system"}
                      {o.confidence != null && (
                        <> · confidence {(o.confidence * 100).toFixed(0)}%</>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_VARIANT[o.status] ?? "outline"}>{o.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-[11px] leading-relaxed">
                    {o.output.slice(0, 2000)}
                    {o.output.length > 2000 ? "\n…(truncated)" : ""}
                  </pre>
                  {o.warnings.length > 0 && (
                    <p className="text-[10px] text-warning-foreground">
                      Warnings: {o.warnings.join(" · ")}
                    </p>
                  )}
                  {o.rejectionReason && (
                    <p className="text-[10px] text-destructive">Rejected: {o.rejectionReason}</p>
                  )}
                  {canDecide && <ReviewForm outputId={o.id} status={o.status} />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
