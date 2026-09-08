import Link from "next/link";
import { PublicContentStatus } from "@prisma/client";
import { ArrowLeft, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission } from "@/server/permissions";
import { FAMILIES, familyOf, type PublicFamily } from "@/server/public-web/families";

export const dynamic = "force-dynamic";

const STATUSES = Object.values(PublicContentStatus);

export default async function PublicWebContentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; family?: string }>;
}) {
  await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  const params = await searchParams;
  const status = STATUSES.includes(params.status as PublicContentStatus)
    ? (params.status as PublicContentStatus)
    : null;
  const family = (["news", "resource"] as PublicFamily[]).includes(params.family as PublicFamily)
    ? (params.family as PublicFamily)
    : null;

  const rows = await prisma.publicContentItem.findMany({
    where: {
      siteKey: "lifesupply-health",
      ...(status ? { status } : {}),
      ...(family ? { contentType: FAMILIES[family].contentType } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { preparedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
  });
  const items = rows
    .map((row) => ({ row, family: familyOf(row) }))
    .filter((entry) => entry.family !== null && (!family || entry.family === family));

  return (
    <div>
      <PageHeader
        title="Public content"
        description="Company news and resources. A record becomes public only when published and inside its effective window."
        breadcrumb={
          <Link href="/public-web" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Public website
          </Link>
        }
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/public-web/content/new?family=news">
                <Plus className="mr-1 h-4 w-4" /> News item
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/public-web/content/new?family=resource">
                <Plus className="mr-1 h-4 w-4" /> Resource
              </Link>
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/public-web/content"
            className={`rounded-md border px-2 py-1 ${!status && !family ? "bg-muted" : ""}`}
          >
            All
          </Link>
          {STATUSES.map((entry) => (
            <Link
              key={entry}
              href={`/public-web/content?status=${entry}`}
              className={`rounded-md border px-2 py-1 ${status === entry ? "bg-muted" : ""}`}
            >
              {entry.replace("_", " ")}
            </Link>
          ))}
          {(Object.keys(FAMILIES) as PublicFamily[]).map((entry) => (
            <Link
              key={entry}
              href={`/public-web/content?family=${entry}`}
              className={`rounded-md border px-2 py-1 ${family === entry ? "bg-muted" : ""}`}
            >
              {FAMILIES[entry].label}
            </Link>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <DataTable className="border-0">
              <THead>
                <tr>
                  <TH>Title</TH>
                  <TH>Family</TH>
                  <TH>Status</TH>
                  <TH>Prepared by</TH>
                  <TH>Approved by</TH>
                  <TH>Updated</TH>
                </tr>
              </THead>
              <TBody>
                {items.length === 0 && (
                  <TR>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={6}>
                      No records match.
                    </td>
                  </TR>
                )}
                {items.map(({ row, family: rowFamily }) => (
                  <TR key={row.id}>
                    <TD>
                      <Link
                        href={`/public-web/content/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.title}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        /{rowFamily === "news" ? "news" : "resources"}/{row.slug}/
                      </span>
                    </TD>
                    <TD>{rowFamily ? FAMILIES[rowFamily].label : "—"}</TD>
                    <TD>
                      <Badge
                        variant={
                          row.status === PublicContentStatus.published ? "default" : "outline"
                        }
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
                    </TD>
                    <TD>{row.preparedBy?.name ?? "—"}</TD>
                    <TD>{row.approvedBy?.name ?? "—"}</TD>
                    <TD>{formatDateTime(row.updatedAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
