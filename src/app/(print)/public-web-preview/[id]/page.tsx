import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsItemView, ResourceView } from "@/components/public-site/lifesupply-pages";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission } from "@/server/permissions";
import { familyOf, newsPayloadSchema, resourcePayloadSchema } from "@/server/public-web/families";

export const dynamic = "force-dynamic";

/** Never indexed: previews render drafts to authorized editors only. */
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/**
 * Draft preview. Renders the exact public template with the stored record,
 * whatever its status, so a reviewer sees what publishing would show. The
 * route lives outside the dashboard shell, behind the same permission as
 * the editor, and carries a banner that cannot reach the public site
 * because the public site never reads this route.
 */
export default async function PublicWebPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  const { id } = await params;
  const row = await prisma.publicContentItem.findUnique({ where: { id } });
  if (!row) notFound();
  const family = familyOf(row);
  if (!family || !row.summary) notFound();

  const banner = (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-amber-100 px-5 py-2 text-xs text-amber-900">
      <span>
        Preview of a <strong>{row.status.replace("_", " ")}</strong> record. Not published; not
        indexed.
      </span>
      <Link href={`/public-web/content/${row.id}`} className="underline">
        Back to editor
      </Link>
    </div>
  );

  if (family === "news") {
    const payload = newsPayloadSchema.safeParse(row.payload);
    if (!payload.success) notFound();
    return (
      <>
        {banner}
        <NewsItemView
          item={{
            slug: row.slug,
            title: row.title,
            summary: row.summary,
            date: payload.data.date,
            body: payload.data.body,
            source: payload.data.source,
            related: payload.data.related,
          }}
        />
      </>
    );
  }
  const payload = resourcePayloadSchema.safeParse(row.payload);
  if (!payload.success) notFound();
  return (
    <>
      {banner}
      <ResourceView
        item={{
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          body: payload.data.body,
          author: payload.data.author,
          reviewer: payload.data.reviewer,
          published: payload.data.published,
          reviewed: payload.data.reviewed,
          action: payload.data.action,
        }}
      />
    </>
  );
}
