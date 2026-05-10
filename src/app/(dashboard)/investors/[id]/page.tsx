import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate, formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getInvestorById } from "@/server/services/investors";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

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

const INTERACTION_LABEL: Record<string, string> = {
  meeting: "Meeting",
  email: "Email",
  call: "Call",
  document_shared: "Document shared",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const investor = await getInvestorById(id);
  return { title: investor ? investor.name : "Investor" };
}

export default async function InvestorDetailPage({ params }: Props) {
  await requirePermission(PERMISSIONS.INVESTORS_VIEW);
  const { id } = await params;
  const investor = await getInvestorById(id);
  if (!investor) notFound();

  return (
    <div>
      <PageHeader
        title={investor.name}
        description={
          investor.organization && investor.organization !== investor.name
            ? investor.organization
            : (TYPE_LABEL[investor.investorType ?? ""] ?? investor.investorType ?? undefined)
        }
        breadcrumb={
          <Link href="/investors" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Investors
          </Link>
        }
        actions={
          <Badge variant={STATUS_BADGE[investor.status] ?? "outline"}>{investor.status}</Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" /> Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investor.interactions.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No interactions logged"
                  description="When you log a meeting, call, email, or document share it will appear here."
                  className="border-0 bg-transparent"
                />
              ) : (
                <ul className="divide-y">
                  {investor.interactions.map((it) => (
                    <li key={it.id} className="space-y-1 py-3 first:pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary">
                          {INTERACTION_LABEL[it.interactionType] ?? it.interactionType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(it.interactionDate)}
                        </span>
                      </div>
                      {it.summary && <p className="text-sm">{it.summary}</p>}
                      {it.nextAction && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Next: </span>
                          {it.nextAction}
                        </p>
                      )}
                      {it.createdBy && (
                        <p className="text-[10px] text-muted-foreground">
                          logged by {it.createdBy.name ?? it.createdBy.email} •{" "}
                          {formatDateTime(it.createdAt)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {investor.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{investor.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {investor.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {investor.email}
                </div>
              )}
              {investor.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {investor.phone}
                </div>
              )}
              {!investor.email && !investor.phone && (
                <p className="text-muted-foreground">No contact info on file.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row
                  label="Type"
                  value={TYPE_LABEL[investor.investorType ?? ""] ?? investor.investorType ?? "—"}
                />
                <Row label="Status" value={investor.status} />
                <Row label="Organization" value={investor.organization ?? "—"} />
                <Row label="First contact" value={formatDate(investor.createdAt)} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
