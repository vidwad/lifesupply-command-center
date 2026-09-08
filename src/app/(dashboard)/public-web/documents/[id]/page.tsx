import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicContentStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission, userHasPermission } from "@/server/permissions";
import {
  DOCUMENT_TYPES,
  EDITABLE_STATUSES,
  TRANSITIONS,
  allowedDocumentHosts,
  isAllowedDocumentUrl,
  type TransitionName,
} from "@/server/public-web/families";
import { documentDownloadPath } from "@/server/public-web/readers";

import { DocumentForm } from "../../document-form";
import { TransitionButtons } from "../../transition-buttons";

export const dynamic = "force-dynamic";

export default async function PublicDocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  const { id } = await params;
  const row = await prisma.publicDocument.findUnique({
    where: { id },
    include: { preparedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
  });
  if (!row) notFound();
  const canApprove = userHasPermission(user, PERMISSIONS.PUBLIC_WEB_APPROVE);
  const available = (Object.keys(TRANSITIONS) as TransitionName[]).filter((name) => {
    const rule = TRANSITIONS[name];
    if (!(rule.from as readonly PublicContentStatus[]).includes(row.status)) return false;
    if (name === "submit") return true;
    if (!canApprove) return false;
    if (name === "approve" && row.preparedById === user.id) return false;
    return true;
  });
  const history = await prisma.auditLog.findMany({
    where: { entityType: "PublicDocument", entityId: row.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { actor: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title={row.title}
        description={`${row.documentType.replace("_", " ")} · ${row.periodLabel ?? "no period"} · ${isAllowedDocumentUrl(row.publicUrl) ? `download path ${documentDownloadPath(row.id)}` : "no file attached (on request)"}`}
        breadcrumb={
          <Link
            href="/public-web/documents"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Public documents
          </Link>
        }
        actions={
          <Badge variant={row.status === PublicContentStatus.published ? "default" : "outline"}>
            {row.status.replace("_", " ")}
          </Badge>
        }
      />
      <div className="grid gap-8 p-6 xl:grid-cols-[1fr_20rem]">
        <div className="max-w-3xl">
          <DocumentForm
            editable={EDITABLE_STATUSES.includes(row.status)}
            documentTypes={DOCUMENT_TYPES}
            allowedHosts={allowedDocumentHosts()}
            values={{
              id: row.id,
              expectedUpdatedAt: row.updatedAt.toISOString(),
              title: row.title,
              documentType: row.documentType,
              periodLabel: row.periodLabel ?? "",
              publicUrl: row.publicUrl ?? "",
              disclosureText: row.disclosureText ?? "",
              sourceReference: row.sourceReference ?? "",
            }}
          />
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Workflow</h2>
            <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Prepared by</dt>
                <dd>{row.preparedBy?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Approved by</dt>
                <dd>{row.approvedBy?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Published at</dt>
                <dd>{row.publishedAt ? formatDateTime(row.publishedAt) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Updated</dt>
                <dd>{formatDateTime(row.updatedAt)}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <TransitionButtons
                kind="document"
                id={row.id}
                expectedUpdatedAt={row.updatedAt.toISOString()}
                available={available}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">History</h2>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {history.length === 0 && <li>No events yet.</li>}
              {history.map((event) => (
                <li key={event.id}>
                  <span className="font-medium text-foreground">
                    {event.action.replace("public_document.", "")}
                  </span>{" "}
                  by {event.actor?.name ?? "system"} · {formatDateTime(event.createdAt)}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
