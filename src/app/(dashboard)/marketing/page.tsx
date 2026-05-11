import Link from "next/link";
import {
  CircleDollarSign,
  Megaphone,
  MousePointerClick,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { KpiCard } from "@/components/data/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getMarketingDashboard } from "@/server/services/marketing";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Marketing" };
export const dynamic = "force-dynamic";

const CAMPAIGN_STATUS_VARIANT: Record<
  string,
  "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  sent: "success",
  scheduled: "warning",
  draft: "outline",
  paused: "secondary",
  cancelled: "destructive",
};

export default async function MarketingPage() {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);
  const data = await getMarketingDashboard();

  return (
    <div>
      <PageHeader
        title="Marketing"
        description="Customer reactivation, Mailchimp campaigns, segmentation, and AI campaign drafts."
        breadcrumb={`${data.overall.sentCampaignCount} sent campaigns • ${data.reactivation.length} reactivation candidates`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/marketing/reactivation"
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Reactivation
            </Link>
            <Link
              href="/marketing/campaigns"
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Campaign drafts
            </Link>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* KPI row */}
        <section
          aria-label="Campaign performance"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <KpiCard
            label="Total sent"
            value={data.overall.totalSent.toLocaleString()}
            caption={`${data.overall.sentCampaignCount} campaigns`}
            icon={Send}
          />
          <KpiCard
            label="Open rate"
            value={data.overall.openRate != null ? formatPercent(data.overall.openRate, 1) : "—"}
            caption={`${data.overall.totalOpens.toLocaleString()} opens`}
            icon={Sparkles}
          />
          <KpiCard
            label="Click rate"
            value={data.overall.clickRate != null ? formatPercent(data.overall.clickRate, 1) : "—"}
            caption={`${data.overall.totalClicks.toLocaleString()} clicks`}
            icon={MousePointerClick}
          />
          <KpiCard
            label="Conversions"
            value={data.overall.totalConversions.toLocaleString()}
            caption="from recent campaigns"
            icon={Megaphone}
          />
          <KpiCard
            label="Attributed revenue"
            value={formatCurrency(data.overall.attributedRevenue)}
            caption="from recent campaigns"
            icon={CircleDollarSign}
          />
        </section>

        {/* Campaigns table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent campaigns</CardTitle>
            <CardDescription className="text-xs">
              Most recent 12 campaigns across draft, scheduled, and sent states
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.campaigns.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No campaigns yet.</p>
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>Campaign</TH>
                    <TH>Status</TH>
                    <TH>Sent</TH>
                    <TH align="right">Audience</TH>
                    <TH align="right">Open rate</TH>
                    <TH align="right">Clicks</TH>
                    <TH align="right">Conversions</TH>
                    <TH align="right">Attributed</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.campaigns.map((c) => (
                    <TR key={c.id}>
                      <TD>
                        <div className="font-medium">{c.name}</div>
                        {c.subject && (
                          <div className="text-xs text-muted-foreground">{c.subject}</div>
                        )}
                      </TD>
                      <TD>
                        <Badge variant={CAMPAIGN_STATUS_VARIANT[c.status] ?? "outline"}>
                          {c.status}
                        </Badge>
                      </TD>
                      <TD className="text-muted-foreground">
                        {c.sentAt
                          ? formatDate(c.sentAt)
                          : c.scheduledAt
                            ? `scheduled ${formatDate(c.scheduledAt)}`
                            : "—"}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {c.metrics ? c.metrics.sentCount.toLocaleString() : "—"}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {c.metrics?.openRate != null ? formatPercent(c.metrics.openRate, 1) : "—"}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {c.metrics?.clickCount.toLocaleString() ?? "—"}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {c.metrics?.conversionCount.toLocaleString() ?? "—"}
                      </TD>
                      <TD align="right" className="font-medium tabular-nums">
                        {c.metrics ? formatCurrency(c.metrics.attributedRevenue) : "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            )}
          </CardContent>
        </Card>

        {/* Reactivation + segments */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" /> Reactivation candidates
              </CardTitle>
              <CardDescription className="text-xs">
                Subscribed customers, &gt;90 days since last order, score ≥ 50
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.reactivation.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No reactivation candidates"
                  description="No subscribed customers currently meet the lapsed-but-high-LTV criteria."
                  className="m-4 border-0 bg-transparent"
                />
              ) : (
                <DataTable className="rounded-none border-0">
                  <THead>
                    <tr>
                      <TH>Customer</TH>
                      <TH>Store</TH>
                      <TH align="right">Lifetime value</TH>
                      <TH align="right">Last order</TH>
                      <TH align="right">Score</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {data.reactivation.map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <Link href={`/customers/${r.id}`} className="font-medium hover:underline">
                            {r.name}
                          </Link>
                          {r.email && (
                            <div className="text-xs text-muted-foreground">{r.email}</div>
                          )}
                        </TD>
                        <TD className="text-muted-foreground">{r.storeName ?? "—"}</TD>
                        <TD align="right" className="font-medium tabular-nums">
                          {formatCurrency(r.lifetimeValue)}
                        </TD>
                        <TD align="right" className="text-muted-foreground">
                          {r.lastOrderAt ? formatDate(r.lastOrderAt) : "Never"}
                        </TD>
                        <TD align="right" className="font-medium tabular-nums">
                          {r.reactivationScore ?? "—"}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Segments & consent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Active segments
                </p>
                {data.segments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No segments defined.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.segments.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{s.name}</div>
                          {s.description && (
                            <div className="text-xs text-muted-foreground">{s.description}</div>
                          )}
                        </div>
                        <Badge variant="secondary" className="tabular-nums">
                          {s.memberCount}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Consent status
                </p>
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(data.consent).map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between gap-2">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="rounded-md bg-warning/10 p-2 text-xs text-warning-foreground">
                <strong className="text-warning">CASL compliance:</strong> only contacts marked
                &ldquo;subscribed&rdquo; are eligible for marketing sends. Unsubscribed and
                transactional contacts are excluded automatically.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
