import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicContentStatus } from "@prisma/client";
import { ArrowLeft, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission, userHasPermission } from "@/server/permissions";
import {
  EDITABLE_STATUSES,
  FAMILIES,
  TRANSITIONS,
  familyOf,
  newsPayloadSchema,
  resourcePayloadSchema,
  type TransitionName,
} from "@/server/public-web/families";

import { ContentForm, type ContentFormValues } from "../../content-form";
import { TransitionButtons } from "../../transition-buttons";

export const dynamic = "force-dynamic";

function localInput(value: Date | null) {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function PublicContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  const { id } = await params;
  const row = await prisma.publicContentItem.findUnique({
    where: { id },
    include: { preparedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
  });
  if (!row) notFound();
  const family = familyOf(row);
  if (!family) notFound();

  const canApprove = userHasPermission(user, PERMISSIONS.PUBLIC_WEB_APPROVE);
  const available = (Object.keys(TRANSITIONS) as TransitionName[]).filter((name) => {
    const rule = TRANSITIONS[name];
    if (!(rule.from as readonly PublicContentStatus[]).includes(row.status)) return false;
    if (name === "submit") return true;
    if (!canApprove) return false;
    if (name === "approve" && row.preparedById === user.id) return false;
    return true;
  });

  const news = family === "news" ? newsPayloadSchema.safeParse(row.payload) : null;
  const resource = family === "resource" ? resourcePayloadSchema.safeParse(row.payload) : null;
  const payload = news?.success ? news.data : resource?.success ? resource.data : null;
  const values: ContentFormValues = {
    id: row.id,
    family,
    expectedUpdatedAt: row.updatedAt.toISOString(),
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? "",
    sourceReference: row.sourceReference ?? "",
    effectiveAt: localInput(row.effectiveAt),
    expiresAt: localInput(row.expiresAt),
    body: payload ? payload.body.join("\n\n") : "",
    date: payload && "date" in payload ? payload.date : "",
    sourceLabel: payload && "source" in payload ? (payload.source?.label ?? "") : "",
    sourceHref: payload && "source" in payload ? (payload.source?.href ?? "") : "",
    author: payload && "author" in payload ? payload.author : "",
    reviewer: payload && "reviewer" in payload ? payload.reviewer : "",
    published: payload && "published" in payload ? payload.published : "",
    reviewed: payload && "reviewed" in payload ? payload.reviewed : "",
    action: payload && "action" in payload ? payload.action : "general_inquiry",
  };

  const history = await prisma.auditLog.findMany({
    where: { entityType: "PublicContentItem", entityId: row.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { actor: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title={row.title}
        description={`${FAMILIES[family].label} · /${family === "news" ? "news" : "resources"}/${row.slug}/ · revision ${payload?.revision ?? 1}`}
        breadcrumb={
          <Link
            href="/public-web/content"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Public content
          </Link>
        }
        actions={
          <>
            <Badge variant={row.status === PublicContentStatus.published ? "default" : "outline"}>
              {row.status.replace("_", " ")}
            </Badge>
            <Button asChild size="sm" variant="outline">
              <Link href={`/public-web-preview/${row.id}`} target="_blank" rel="noreferrer">
                <Eye className="mr-1 h-4 w-4" /> Preview
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-8 p-6 xl:grid-cols-[1fr_20rem]">
        <div className="max-w-4xl space-y-6">
          {!payload && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              The stored payload does not match the current validation rules. Save the form to
              repair it; the record cannot be published until it validates.
            </p>
          )}
          <ContentForm values={values} editable={EDITABLE_STATUSES.includes(row.status)} />
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
                <dt>Approved at</dt>
                <dd>{row.approvedAt ? formatDateTime(row.approvedAt) : "—"}</dd>
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
                kind="content"
                id={row.id}
                expectedUpdatedAt={row.updatedAt.toISOString()}
                available={available}
              />
              {available.includes("approve") === false &&
                row.status === PublicContentStatus.under_review &&
                canApprove &&
                row.preparedById === user.id && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    You prepared this record; another approver must approve it.
                  </p>
                )}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">History</h2>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {history.length === 0 && <li>No events yet.</li>}
              {history.map((event) => (
                <li key={event.id}>
                  <span className="font-medium text-foreground">
                    {event.action.replace("public_content.", "")}
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
