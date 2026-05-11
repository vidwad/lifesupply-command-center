import Link from "next/link";
import { ArrowLeft, ShieldAlert, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listReactivationCandidates, type ReactivationBucket } from "@/server/services/marketing/reactivation";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { CampaignDraftForm } from "./draft-form";

export const metadata = { title: "Customer reactivation" };
export const dynamic = "force-dynamic";

type SearchParams = { bucket?: string; q?: string };

const VALID_BUCKETS: ReactivationBucket[] = ["hot", "warm", "cold", "deep_freeze"];

const BUCKET_LABEL: Record<ReactivationBucket, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  deep_freeze: "Deep freeze",
};

const BUCKET_VARIANT: Record<ReactivationBucket, "destructive" | "warning" | "secondary" | "outline"> = {
  hot: "destructive",
  warm: "warning",
  cold: "secondary",
  deep_freeze: "outline",
};

export default async function ReactivationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.CUSTOMERS_VIEW);
  const params = await searchParams;
  const canDraft = userHasPermission(user, PERMISSIONS.MARKETING_DRAFT_CAMPAIGN);

  const bucket = VALID_BUCKETS.includes(params.bucket as ReactivationBucket)
    ? (params.bucket as ReactivationBucket)
    : undefined;

  const { rows, summary } = await listReactivationCandidates({
    bucket,
    search: params.q?.trim() || undefined,
    limit: 200,
  });

  return (
    <div>
      <PageHeader
        title="Customer reactivation"
        description="Marketable customers ranked by reactivation potential. Unsubscribed and cleaned customers are excluded."
        breadcrumb={
          <Link href="/marketing" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Marketing
          </Link>
        }
        actions={
          summary.excludedDueToConsent > 0 ? (
            <Badge variant="outline">
              <ShieldAlert className="mr-1 h-3 w-3" />
              {summary.excludedDueToConsent} excluded by consent
            </Badge>
          ) : null
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Bucket pills */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BucketStat label="Hot" count={summary.hot} active={bucket === "hot"} href="/marketing/reactivation?bucket=hot" tone="destructive" />
            <BucketStat label="Warm" count={summary.warm} active={bucket === "warm"} href="/marketing/reactivation?bucket=warm" tone="warning" />
            <BucketStat label="Cold" count={summary.cold} active={bucket === "cold"} href="/marketing/reactivation?bucket=cold" tone="secondary" />
            <BucketStat label="Deep freeze" count={summary.deepFreeze} active={bucket === "deep_freeze"} href="/marketing/reactivation?bucket=deep_freeze" tone="outline" />
          </div>

          <div className="flex items-center gap-2">
            <form action="/marketing/reactivation" className="ml-auto flex items-center gap-2">
              {bucket && <input type="hidden" name="bucket" value={bucket} />}
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search name, email, company…"
                className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
              />
            </form>
            {bucket && (
              <Link href="/marketing/reactivation" className="text-xs text-muted-foreground hover:underline">
                Clear filters
              </Link>
            )}
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers match these filters"
              description="Try a different bucket, or import customers via /admin/import."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Customer</TH>
                      <TH>Type</TH>
                      <TH>Consent</TH>
                      <TH align="right">LTV</TH>
                      <TH align="right">Orders</TH>
                      <TH align="right">Last order</TH>
                      <TH align="right">Score</TH>
                      <TH>Bucket</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {rows.slice(0, 200).map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <Link href={`/customers/${r.id}`} className="font-medium hover:underline">
                            {r.name}
                          </Link>
                          {r.email && (
                            <div className="text-xs text-muted-foreground">{r.email}</div>
                          )}
                          {r.storeName && (
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {r.storeName}
                            </div>
                          )}
                        </TD>
                        <TD className="text-xs text-muted-foreground">{r.customerType}</TD>
                        <TD>
                          <Badge
                            variant={r.consentStatus === "subscribed" ? "success" : "outline"}
                          >
                            {r.consentStatus}
                          </Badge>
                        </TD>
                        <TD align="right" className="font-medium tabular-nums">
                          {formatCurrency(r.lifetimeValue)}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {r.orderCount}
                        </TD>
                        <TD align="right" className="text-xs text-muted-foreground">
                          {r.lastOrderAt ? formatDate(r.lastOrderAt) : "—"}
                          {r.daysSinceLastOrder != null && (
                            <div className="text-[10px]">
                              {r.daysSinceLastOrder < 365
                                ? `${r.daysSinceLastOrder}d ago`
                                : `${Math.floor(r.daysSinceLastOrder / 365)}y ago`}
                            </div>
                          )}
                        </TD>
                        <TD align="right" className="font-mono text-sm tabular-nums">
                          {r.reactivationScore}
                        </TD>
                        <TD>
                          <Badge variant={BUCKET_VARIANT[r.bucket]}>
                            {BUCKET_LABEL[r.bucket]}
                          </Badge>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canDraft ? (
            <CampaignDraftForm initialBucket={bucket} />
          ) : (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              <Sparkles className="mb-2 h-4 w-4" />
              You can view the segments but not draft a campaign. Requires{" "}
              <code className="rounded bg-muted px-1">{PERMISSIONS.MARKETING_DRAFT_CAMPAIGN}</code>.
            </div>
          )}
          <Link
            href="/marketing/campaigns"
            className="block rounded-md border bg-card p-4 text-sm hover:border-primary"
          >
            <div className="font-medium">Open campaign drafts →</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Review, edit, and request approval for AI-drafted campaigns.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function BucketStat({
  label,
  count,
  active,
  href,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  href: string;
  tone: "destructive" | "warning" | "secondary" | "outline";
}) {
  const ring =
    tone === "destructive"
      ? "border-destructive/40"
      : tone === "warning"
        ? "border-warning/40"
        : "";
  return (
    <Link
      href={href}
      className={
        active
          ? `rounded-md border-2 ${ring || "border-primary"} bg-card p-3 transition-colors`
          : "rounded-md border bg-card p-3 transition-colors hover:border-primary"
      }
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{count}</div>
    </Link>
  );
}
