import Link from "next/link";
import { ArrowLeft, Banknote, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listCapitalRaises } from "@/server/services/strategic/capital-raises";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const metadata = { title: "Capital raises" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "outline" | "warning" | "success" | "secondary" | "destructive"> = {
  planning: "outline",
  open: "warning",
  closing: "warning",
  closed: "success",
  cancelled: "secondary",
};

export default async function CapitalRaisesPage() {
  const user = await requirePermission(PERMISSIONS.INVESTORS_VIEW);
  const canCreate = userHasPermission(user, PERMISSIONS.INVESTORS_UPDATE);
  const raises = await listCapitalRaises();

  return (
    <div>
      <PageHeader
        title="Capital raises"
        description="Active and historical financing rounds with named investor commitments."
        breadcrumb={
          <Link href="/investors" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Investors
          </Link>
        }
        actions={
          canCreate ? (
            <Link
              href="/investors/capital-raises/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> New round
            </Link>
          ) : null
        }
      />
      <div className="space-y-4 p-6">
        {raises.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No capital raises yet"
            description="Create a round to start tracking investor commitments and progress against target."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Round</TH>
                    <TH>Status</TH>
                    <TH align="right">Target</TH>
                    <TH align="right">Committed</TH>
                    <TH align="right">Funded</TH>
                    <TH align="right">Soft</TH>
                    <TH>Opened</TH>
                    <TH>Closed</TH>
                  </tr>
                </THead>
                <TBody>
                  {raises.map((r) => {
                    const target = Number(r.targetAmount);
                    const pct = target > 0 ? Math.min(100, Math.round((r.committedAmount / target) * 100)) : 0;
                    return (
                      <TR key={r.id}>
                        <TD>
                          <Link
                            href={`/investors/capital-raises/${r.id}`}
                            className="font-medium hover:underline"
                          >
                            {r.name}
                          </Link>
                          <div className="mt-1 h-1.5 w-32 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {pct}% of target
                          </div>
                        </TD>
                        <TD className="text-xs uppercase tracking-wide text-muted-foreground">
                          {r.roundType}
                        </TD>
                        <TD>
                          <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                            {r.status}
                          </Badge>
                        </TD>
                        <TD align="right" className="font-medium tabular-nums">
                          {formatCurrency(target, r.currency)}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {formatCurrency(r.committedAmount, r.currency)}
                        </TD>
                        <TD align="right" className="tabular-nums text-success">
                          {formatCurrency(r.fundedAmount, r.currency)}
                        </TD>
                        <TD align="right" className="tabular-nums text-muted-foreground">
                          {formatCurrency(r.softAmount, r.currency)}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {r.openedAt ? formatDate(r.openedAt) : "—"}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {r.closedAt ? formatDate(r.closedAt) : "—"}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
