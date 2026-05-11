import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { listInvestors, type ListInvestorsFilters } from "@/server/services/investors";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const metadata = { title: "Investor Relations" };
export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Prospect", value: "prospect" },
  { label: "Engaged", value: "engaged" },
  { label: "Committed", value: "committed" },
  { label: "Declined", value: "declined" },
  { label: "Closed", value: "closed" },
];

const STATUS_BADGE: Record<
  string,
  "secondary" | "warning" | "success" | "destructive" | "outline"
> = {
  prospect: "outline",
  engaged: "warning",
  committed: "success",
  declined: "destructive",
  closed: "secondary",
};

const TYPE_LABEL: Record<string, string> = {
  vc: "VC",
  angel: "Angel",
  family_office: "Family office",
  lender: "Lender",
  strategic: "Strategic",
  other: "Other",
};

type SearchParams = { status?: string; q?: string };

export default async function InvestorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.INVESTORS_VIEW);
  const params = await searchParams;

  const filters: ListInvestorsFilters = {
    status: STATUS_FILTERS.some((s) => s.value === params.status) ? params.status : undefined,
    search: params.q?.trim() || undefined,
  };

  const investors = await listInvestors(filters);
  const activeStatus = filters.status ?? "";
  const canCreate = userHasPermission(user, PERMISSIONS.INVESTORS_UPDATE);

  return (
    <div>
      <PageHeader
        title="Investor Relations"
        description="Capital raising, investor updates, lender reporting. Approval-controlled materials only."
        breadcrumb={`${investors.length} ${investors.length === 1 ? "investor" : "investors"}`}
        actions={
          canCreate && (
            <Link href="/investors/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New investor
              </Button>
            </Link>
          )
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const isActive = activeStatus === f.value;
            const next = new URLSearchParams();
            if (f.value) next.set("status", f.value);
            if (params.q) next.set("q", params.q);
            const href = `/investors${next.toString() ? `?${next}` : ""}`;
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
          <form action="/investors" className="ml-auto">
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search name, org, email…"
              className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        {investors.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No investors match these filters"
            description="Adjust the filter or run pnpm db:seed to populate sample investors."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Investor</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Email</TH>
                <TH align="right">Interactions</TH>
                <TH>Last contact</TH>
              </tr>
            </THead>
            <TBody>
              {investors.map((i) => (
                <TR key={i.id}>
                  <TD>
                    <Link href={`/investors/${i.id}`} className="font-medium hover:underline">
                      {i.name}
                    </Link>
                    {i.organization && i.organization !== i.name && (
                      <div className="text-xs text-muted-foreground">{i.organization}</div>
                    )}
                  </TD>
                  <TD className="text-muted-foreground">
                    {TYPE_LABEL[i.investorType ?? ""] ?? i.investorType ?? "—"}
                  </TD>
                  <TD>
                    <Badge variant={STATUS_BADGE[i.status] ?? "outline"}>{i.status}</Badge>
                  </TD>
                  <TD className="text-muted-foreground">{i.email ?? "—"}</TD>
                  <TD align="right" className="tabular-nums">
                    {i.interactionCount}
                  </TD>
                  <TD className="text-muted-foreground">
                    {i.lastInteractionAt ? formatDate(i.lastInteractionAt) : "Never"}
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
