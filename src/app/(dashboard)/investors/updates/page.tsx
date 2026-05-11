import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { listInvestorUpdates } from "@/server/services/strategic/investor-updates";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { InvestorUpdateDraftForm } from "./draft-form";

export const metadata = { title: "Investor updates" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "outline" | "warning" | "success" | "secondary"> = {
  draft: "outline",
  under_review: "warning",
  approved: "secondary",
  released: "success",
  archived: "outline",
};

export default async function InvestorUpdatesPage() {
  const user = await requirePermission(PERMISSIONS.INVESTORS_VIEW);
  const canDraft = userHasPermission(user, PERMISSIONS.INVESTORS_GENERATE_UPDATE);

  const [updates, periods] = await Promise.all([
    listInvestorUpdates({ limit: 50 }),
    prisma.financialPeriod.findMany({
      orderBy: { startDate: "desc" },
      take: 12,
      select: { id: true, name: true, status: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Investor updates"
        description="Approval-gated investor communications. Distribution requires the investor.distribution feature flag."
        breadcrumb={
          <Link href="/investors" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Investors
          </Link>
        }
      />
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {updates.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No investor updates yet"
              description="Draft one from the panel on the right."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Title</TH>
                      <TH>Period</TH>
                      <TH>Status</TH>
                      <TH>Highlights</TH>
                      <TH>Updated</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {updates.map((u) => (
                      <TR key={u.id}>
                        <TD>
                          <Link
                            href={`/investors/updates/${u.id}`}
                            className="font-medium hover:underline"
                          >
                            {u.title}
                          </Link>
                          {u.preparedBy && (
                            <div className="text-xs text-muted-foreground">
                              by {u.preparedBy.name ?? u.preparedBy.email}
                            </div>
                          )}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {u.periodLabel ?? "—"}
                          {u.financialPeriod && (
                            <div className="text-[10px]">
                              {u.financialPeriod.status}
                            </div>
                          )}
                        </TD>
                        <TD>
                          <Badge variant={STATUS_VARIANT[u.status] ?? "outline"}>
                            {u.status.replace(/_/g, " ")}
                          </Badge>
                          {u.releasedAt && (
                            <div className="text-[10px] text-success">
                              released {formatDateTime(u.releasedAt)}
                            </div>
                          )}
                        </TD>
                        <TD className="text-xs">
                          {u.highlights.length > 0 ? (
                            <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
                              {u.highlights.slice(0, 2).map((h, i) => (
                                <li key={i} className="line-clamp-1">
                                  {h}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {formatDateTime(u.updatedAt)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {canDraft ? (
            <InvestorUpdateDraftForm periods={periods} />
          ) : (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              You can view investor updates but not draft them. Requires{" "}
              <code className="rounded bg-muted px-1">{PERMISSIONS.INVESTORS_GENERATE_UPDATE}</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
