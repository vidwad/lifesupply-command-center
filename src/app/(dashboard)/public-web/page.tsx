import { PublicContentStatus } from "@prisma/client";
import { FileCheck2, FilePenLine, Globe2, ShieldCheck } from "lucide-react";

import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<PublicContentStatus, string> = {
  draft: "Draft",
  under_review: "Under review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export default async function PublicWebPage() {
  await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);

  const [contentCounts, documentCount, metricCount, contactCount] = await Promise.all([
    prisma.publicContentItem.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.publicDocument.count({ where: { status: PublicContentStatus.published } }),
    prisma.publicMetricSnapshot.count({ where: { status: PublicContentStatus.published } }),
    prisma.publicContactChannel.count({ where: { status: PublicContentStatus.published } }),
  ]);

  const counts = new Map(contentCounts.map((row) => [row.status, row._count._all]));
  const statusCards = [
    { status: PublicContentStatus.draft, icon: FilePenLine, color: "text-amber-600" },
    { status: PublicContentStatus.under_review, icon: FileCheck2, color: "text-blue-600" },
    { status: PublicContentStatus.approved, icon: ShieldCheck, color: "text-violet-600" },
    { status: PublicContentStatus.published, icon: Globe2, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Publication authority</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">LifeSupply public website</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          This workspace governs corporate pages, leadership, news, investor documents, metric
          snapshots, product discovery, and contact channels. Only published records are eligible
          for the public API.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map(({ status, icon: Icon, color }) => (
          <div key={status} className="rounded-xl border bg-card p-5 shadow-sm">
            <Icon className={`h-5 w-5 ${color}`} />
            <p className="mt-5 text-3xl font-semibold">{counts.get(status) ?? 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {STATUS_LABELS[status]} content items
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Published supporting records</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <p className="rounded-lg bg-muted p-4 text-sm">
            <strong className="block text-2xl text-foreground">{documentCount}</strong>Public
            documents
          </p>
          <p className="rounded-lg bg-muted p-4 text-sm">
            <strong className="block text-2xl text-foreground">{metricCount}</strong>Public metric
            snapshots
          </p>
          <p className="rounded-lg bg-muted p-4 text-sm">
            <strong className="block text-2xl text-foreground">{contactCount}</strong>Verified
            contact channels
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground">
        Publication editing and approval screens are the next implementation step. Until then, this
        overview intentionally makes the workflow visible without providing a bypass around review,
        approval, audit, or source-reference requirements.
      </div>
    </div>
  );
}
