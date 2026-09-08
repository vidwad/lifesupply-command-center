import Link from "next/link";
import { PublicContentStatus } from "@prisma/client";
import { FileCheck2, FilePenLine, FileText, Globe2, Newspaper, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { allowedDocumentHosts } from "@/server/public-web/families";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<PublicContentStatus, string> = {
  draft: "Draft",
  under_review: "Under review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export default async function PublicWebPage() {
  const user = await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  const canApprove = userHasPermission(user, PERMISSIONS.PUBLIC_WEB_APPROVE);

  const [contentCounts, documentCounts] = await Promise.all([
    prisma.publicContentItem.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.publicDocument.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = new Map(contentCounts.map((row) => [row.status, row._count._all]));
  const documents = new Map(documentCounts.map((row) => [row.status, row._count._all]));
  const statusCards = [
    { status: PublicContentStatus.draft, icon: FilePenLine, color: "text-amber-600" },
    { status: PublicContentStatus.under_review, icon: FileCheck2, color: "text-blue-600" },
    { status: PublicContentStatus.approved, icon: ShieldCheck, color: "text-violet-600" },
    { status: PublicContentStatus.published, icon: Globe2, color: "text-emerald-600" },
  ];
  const hosts = allowedDocumentHosts();

  return (
    <div>
      <PageHeader
        title="LifeSupply public website"
        description="Publication authority for the public site. Only published records inside their effective window reach the public API; the public site fails closed when this service is unavailable."
        breadcrumb="Publication authority"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/public-web/content">
                <Newspaper className="mr-1 h-4 w-4" /> Content
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/public-web/documents">
                <FileText className="mr-1 h-4 w-4" /> Documents
              </Link>
            </Button>
          </>
        }
      />
      <div className="space-y-8 p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusCards.map(({ status, icon: Icon, color }) => (
            <Link
              key={status}
              href={`/public-web/content?status=${status}`}
              className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
            >
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="mt-5 text-3xl font-semibold">{counts.get(status) ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {STATUS_LABELS[status]} content items
              </p>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Public documents</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            {statusCards.map(({ status }) => (
              <p key={status} className="rounded-lg bg-muted p-4 text-sm">
                <strong className="block text-2xl text-foreground">
                  {documents.get(status) ?? 0}
                </strong>
                {STATUS_LABELS[status]}
              </p>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {hosts.length === 0
              ? "No document host is approved (object storage undecided, DEC-03). Documents publish as metadata and read “on request” on the public site."
              : `Approved file hosts: ${hosts.join(", ")}.`}
          </p>
        </div>

        <div className="rounded-xl border p-6 text-sm leading-6 text-muted-foreground">
          <p>
            <strong className="text-foreground">Your role:</strong>{" "}
            {canApprove
              ? "editor and approver. You may approve and publish records prepared by someone else."
              : "editor. You may create, edit, and submit records; an approver publishes them."}
          </p>
          <p className="mt-2">
            Workflow: draft → under review → approved → published → archived. Edits are locked after
            approval; a stale screen is refused rather than overwriting a newer change; every step
            is audit-logged. Metrics, contact channels, and corporate pages remain static on the
            public site in this stage.
          </p>
        </div>
      </div>
    </div>
  );
}
