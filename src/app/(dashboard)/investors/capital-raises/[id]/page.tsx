import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { getCapitalRaise } from "@/server/services/strategic/capital-raises";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { setCommitmentStatusAction, setRaiseStatusAction } from "../actions";
import { CommitmentCreateForm } from "./commitment-form";

export const dynamic = "force-dynamic";

const RAISE_STATUS_VARIANT: Record<string, "outline" | "warning" | "success" | "secondary" | "destructive"> = {
  planning: "outline",
  open: "warning",
  closing: "warning",
  closed: "success",
  cancelled: "secondary",
};
const COMMITMENT_VARIANT: Record<string, "outline" | "warning" | "success" | "secondary" | "destructive"> = {
  soft: "outline",
  signed: "warning",
  funded: "success",
  withdrawn: "secondary",
  declined: "destructive",
};

const RAISE_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  planning: [
    { value: "open", label: "Open round" },
    { value: "cancelled", label: "Cancel" },
  ],
  open: [
    { value: "closing", label: "Move to closing" },
    { value: "closed", label: "Close round" },
    { value: "cancelled", label: "Cancel" },
  ],
  closing: [
    { value: "closed", label: "Close round" },
    { value: "open", label: "Reopen" },
  ],
  closed: [],
  cancelled: [{ value: "planning", label: "Reopen as planning" }],
};

const COMMITMENT_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  soft: [
    { value: "signed", label: "Sign" },
    { value: "withdrawn", label: "Withdraw" },
    { value: "declined", label: "Decline" },
  ],
  signed: [
    { value: "funded", label: "Mark funded" },
    { value: "withdrawn", label: "Withdraw" },
  ],
  funded: [],
  withdrawn: [{ value: "soft", label: "Reopen" }],
  declined: [{ value: "soft", label: "Reopen" }],
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const r = await getCapitalRaise(id);
  return { title: r ? r.name : "Capital raise" };
}

export default async function CapitalRaiseDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.INVESTORS_VIEW);
  const { id } = await params;
  const raise = await getCapitalRaise(id);
  if (!raise) notFound();
  const canManage = userHasPermission(user, PERMISSIONS.INVESTORS_UPDATE);

  const investors = canManage
    ? await prisma.investor.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, organization: true },
      })
    : [];

  const target = Number(raise.targetAmount);
  const totals = raise.commitments.reduce(
    (acc, c) => {
      const a = Number(c.amount);
      if (c.status === "soft") acc.soft += a;
      if (c.status === "signed") acc.committed += a;
      if (c.status === "funded") {
        acc.funded += a;
        acc.committed += a;
      }
      return acc;
    },
    { soft: 0, committed: 0, funded: 0 },
  );
  const pct = target > 0 ? Math.min(100, Math.round((totals.committed / target) * 100)) : 0;

  return (
    <div>
      <PageHeader
        title={raise.name}
        description={`${raise.roundType.replace(/_/g, " ")} · target ${formatCurrency(target, raise.currency)}`}
        breadcrumb={
          <Link
            href="/investors/capital-raises"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Capital raises
          </Link>
        }
        actions={<Badge variant={RAISE_STATUS_VARIANT[raise.status] ?? "outline"}>{raise.status}</Badge>}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Target" value={formatCurrency(target, raise.currency)} />
                <Stat
                  label="Committed"
                  value={formatCurrency(totals.committed, raise.currency)}
                  caption={`${pct}% of target`}
                />
                <Stat
                  label="Funded"
                  value={formatCurrency(totals.funded, raise.currency)}
                  tone="success"
                />
                <Stat
                  label="Soft"
                  value={formatCurrency(totals.soft, raise.currency)}
                  tone="muted"
                />
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {raise.preMoneyValuation && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Pre-money valuation: {formatCurrency(Number(raise.preMoneyValuation), raise.currency)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Commitments</CardTitle>
              {canManage && raise.status !== "closed" && raise.status !== "cancelled" && (
                <CommitmentCreateForm capitalRaiseId={raise.id} investors={investors} />
              )}
            </CardHeader>
            <CardContent className="p-0">
              {raise.commitments.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No commitments yet.</p>
              ) : (
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Investor</TH>
                      <TH align="right">Amount</TH>
                      <TH>Status</TH>
                      <TH>Effective</TH>
                      <TH>Recorded</TH>
                      {canManage && <TH>Actions</TH>}
                    </tr>
                  </THead>
                  <TBody>
                    {raise.commitments.map((c) => (
                      <TR key={c.id}>
                        <TD>
                          {c.investor ? (
                            <Link
                              href={`/investors/${c.investor.id}`}
                              className="font-medium hover:underline"
                            >
                              {c.investor.name}
                            </Link>
                          ) : (
                            <span className="font-medium">{c.investorLabel ?? "—"}</span>
                          )}
                          {c.investor?.organization && (
                            <div className="text-xs text-muted-foreground">
                              {c.investor.organization}
                            </div>
                          )}
                        </TD>
                        <TD align="right" className="font-medium tabular-nums">
                          {formatCurrency(Number(c.amount), "CAD")}
                        </TD>
                        <TD>
                          <Badge variant={COMMITMENT_VARIANT[c.status] ?? "outline"}>
                            {c.status}
                          </Badge>
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {c.effectiveAt ? formatDate(c.effectiveAt) : "—"}
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {formatDate(c.createdAt)}
                          {c.createdBy && (
                            <div className="text-[10px]">
                              {c.createdBy.name ?? c.createdBy.email}
                            </div>
                          )}
                        </TD>
                        {canManage && (
                          <TD>
                            <div className="flex flex-wrap gap-1">
                              {(COMMITMENT_TRANSITIONS[c.status] ?? []).map((t) => (
                                <form key={t.value} action={setCommitmentStatusAction}>
                                  <input type="hidden" name="id" value={c.id} />
                                  <input type="hidden" name="status" value={t.value} />
                                  <input
                                    type="hidden"
                                    name="capitalRaiseId"
                                    value={raise.id}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                                  >
                                    {t.label}
                                  </button>
                                </form>
                              ))}
                            </div>
                          </TD>
                        )}
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Round</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Type">{raise.roundType.replace(/_/g, " ")}</Row>
                <Row label="Currency">{raise.currency}</Row>
                <Row label="Owner">{raise.owner?.name ?? raise.owner?.email ?? "—"}</Row>
                <Row label="Opened">{raise.openedAt ? formatDate(raise.openedAt) : "—"}</Row>
                <Row label="Closed">{raise.closedAt ? formatDate(raise.closedAt) : "—"}</Row>
              </dl>
            </CardContent>
          </Card>
          {raise.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{raise.description}</p>
              </CardContent>
            </Card>
          )}
          {canManage && (RAISE_TRANSITIONS[raise.status] ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transition status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(RAISE_TRANSITIONS[raise.status] ?? []).map((t) => (
                    <form key={t.value} action={setRaiseStatusAction}>
                      <input type="hidden" name="id" value={raise.id} />
                      <input type="hidden" name="status" value={t.value} />
                      <button
                        type="submit"
                        className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        {t.label}
                      </button>
                    </form>
                  ))}
                </div>
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

function Stat({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: "success" | "muted";
}) {
  const color = tone === "success" ? "text-success" : tone === "muted" ? "text-muted-foreground" : "";
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${color}`}>{value}</div>
      {caption && <div className="text-[10px] text-muted-foreground">{caption}</div>}
    </div>
  );
}
