import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { listOpportunities, type ListOpportunitiesFilters } from "@/server/services/opportunities";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "M&A / Opportunities" };
export const dynamic = "force-dynamic";

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Acquisition", value: "acquisition" },
  { label: "Supplier", value: "supplier" },
  { label: "Marketing", value: "marketing" },
  { label: "Cost reduction", value: "cost_reduction" },
  { label: "Operational", value: "operational" },
  { label: "Financing", value: "financing" },
];

const STATUS_BADGE: Record<
  string,
  "outline" | "secondary" | "warning" | "success" | "destructive"
> = {
  identified: "outline",
  evaluating: "warning",
  committed: "secondary",
  in_progress: "secondary",
  completed: "success",
  declined: "destructive",
  on_hold: "outline",
};

const PRIORITY_BADGE: Record<string, "outline" | "secondary" | "warning" | "destructive"> = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const RISK_TONE: Record<string, string> = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-success",
};

type SearchParams = { type?: string; status?: string; q?: string };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.OPPORTUNITIES_VIEW);
  const params = await searchParams;

  const filters: ListOpportunitiesFilters = {
    opportunityType: TYPE_FILTERS.some((t) => t.value === params.type) ? params.type : undefined,
    status: params.status?.trim() || undefined,
    search: params.q?.trim() || undefined,
  };

  const opportunities = await listOpportunities(filters);
  const activeType = filters.opportunityType ?? "";

  return (
    <div>
      <PageHeader
        title="M&A / Opportunities"
        description="Acquisition targets, supplier deals, strategic initiatives, and cost-reduction projects."
        breadcrumb={`${opportunities.length} ${opportunities.length === 1 ? "opportunity" : "opportunities"}`}
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => {
            const isActive = activeType === f.value;
            const next = new URLSearchParams();
            if (f.value) next.set("type", f.value);
            if (params.q) next.set("q", params.q);
            if (params.status) next.set("status", params.status);
            const href = `/opportunities${next.toString() ? `?${next}` : ""}`;
            return (
              <Link
                key={f.value || "all"}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {f.label}
              </Link>
            );
          })}
          <form action="/opportunities" className="ml-auto">
            {filters.opportunityType && (
              <input type="hidden" name="type" value={filters.opportunityType} />
            )}
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search title or rationale…"
              className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        {opportunities.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No opportunities match these filters"
            description="Adjust the filter or run pnpm db:seed to populate sample opportunities."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Opportunity</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Priority</TH>
                <TH>Risk</TH>
                <TH align="right">Revenue impact</TH>
                <TH align="right">Margin</TH>
                <TH align="right">Cost</TH>
                <TH>Owner</TH>
                <TH>Due</TH>
              </tr>
            </THead>
            <TBody>
              {opportunities.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link href={`/opportunities/${o.id}`} className="font-medium hover:underline">
                      {o.title}
                    </Link>
                    {o.targetCompanyName && (
                      <div className="text-xs text-muted-foreground">
                        Target: {o.targetCompanyName}
                      </div>
                    )}
                  </TD>
                  <TD className="text-muted-foreground">{o.opportunityType.replace("_", " ")}</TD>
                  <TD>
                    <Badge variant={STATUS_BADGE[o.status] ?? "outline"}>
                      {o.status.replace("_", " ")}
                    </Badge>
                  </TD>
                  <TD>
                    {o.priority ? (
                      <Badge variant={PRIORITY_BADGE[o.priority] ?? "outline"}>{o.priority}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TD>
                  <TD>
                    {o.riskRating ? (
                      <span className={cn("text-xs font-medium", RISK_TONE[o.riskRating])}>
                        {o.riskRating}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {o.estimatedRevenueImpact != null
                      ? formatCurrency(o.estimatedRevenueImpact)
                      : "—"}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {o.estimatedMarginImpact != null
                      ? `+${formatPercent(o.estimatedMarginImpact, 1)}`
                      : "—"}
                  </TD>
                  <TD align="right" className="tabular-nums text-muted-foreground">
                    {o.estimatedCost != null ? formatCurrency(o.estimatedCost) : "—"}
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {o.owner?.name ?? o.owner?.email ?? "—"}
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {o.dueDate ? formatDate(o.dueDate) : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
