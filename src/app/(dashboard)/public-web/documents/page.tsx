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
import { isAllowedDocumentUrl } from "@/server/public-web/families";

export const dynamic = "force-dynamic";

export default async function PublicWebDocumentsPage() {
  await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  const rows = await prisma.publicDocument.findMany({
    where: { siteKey: "lifesupply-health" },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { preparedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Public documents"
        description="Metadata for documents listed on the investor pages. Only published records reach the public index; a file is downloadable only from an approved host. Restricted material is never entered here."
        breadcrumb={
          <Link href="/public-web" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Public website
          </Link>
        }
        actions={
          <Button asChild size="sm">
            <Link href="/public-web/documents/new">
              <Plus className="mr-1 h-4 w-4" /> Document record
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <DataTable className="border-0">
              <THead>
                <tr>
                  <TH>Title</TH>
                  <TH>Type</TH>
                  <TH>Period</TH>
                  <TH>File</TH>
                  <TH>Status</TH>
                  <TH>Approved by</TH>
                  <TH>Updated</TH>
                </tr>
              </THead>
              <TBody>
                {rows.length === 0 && (
                  <TR>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={7}>
                      No document records.
                    </td>
                  </TR>
                )}
                {rows.map((row) => (
                  <TR key={row.id}>
                    <TD>
                      <Link
                        href={`/public-web/documents/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.title}
                      </Link>
                    </TD>
                    <TD>{row.documentType.replace("_", " ")}</TD>
                    <TD>{row.periodLabel ?? "—"}</TD>
                    <TD>{isAllowedDocumentUrl(row.publicUrl) ? "attached" : "on request"}</TD>
                    <TD>
                      <Badge
                        variant={
                          row.status === PublicContentStatus.published ? "default" : "outline"
                        }
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
                    </TD>
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
