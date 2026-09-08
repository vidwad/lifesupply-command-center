import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import type { InquiryStatus } from "@/server/public-inquiry/contract";
import { listInquiries, summarize } from "@/server/public-inquiry/queue";
import { getInquiryStore } from "@/server/public-inquiry/store";
import { getFeatureFlags } from "@/server/services/feature-flags";

export const dynamic = "force-dynamic";

const STATUSES: readonly InquiryStatus[] = [
  "received",
  "assigned",
  "in_progress",
  "closed",
  "spam",
];

export default async function InquiryQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePermission(PERMISSIONS.TASKS_VIEW);
  const params = await searchParams;
  const status = STATUSES.includes(params.status as InquiryStatus)
    ? (params.status as InquiryStatus)
    : undefined;
  const store = getInquiryStore();
  const ready = await store.isReady();
  const flags = await getFeatureFlags([
    FEATURE_FLAGS.PUBLIC_INQUIRY_INTAKE,
    FEATURE_FLAGS.PUBLIC_INQUIRY_SEND,
  ]);
  const rows = ready ? (await listInquiries(user, { status })).map(summarize) : [];

  return (
    <div>
      <PageHeader
        title="Public inquiries"
        description="Submissions from the public website, routed to a server-mapped owner. Contact details open only inside a record."
        breadcrumb={
          <Link href="/public-web" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Public website
          </Link>
        }
        actions={
          <>
            <Badge variant={flags[FEATURE_FLAGS.PUBLIC_INQUIRY_INTAKE] ? "default" : "outline"}>
              intake {flags[FEATURE_FLAGS.PUBLIC_INQUIRY_INTAKE] ? "on" : "off"}
            </Badge>
            <Badge variant={flags[FEATURE_FLAGS.PUBLIC_INQUIRY_SEND] ? "default" : "outline"}>
              sending {flags[FEATURE_FLAGS.PUBLIC_INQUIRY_SEND] ? "on" : "off"}
            </Badge>
          </>
        }
      />
      <div className="space-y-4 p-6">
        {!ready && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            The inquiry table has not been provisioned (the Stage 7 migration is prepared and not
            applied, WEB-10). The public intake refuses submissions and the public site shows the
            contact directory until it is.
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/public-web/inquiries"
            className={`rounded-md border px-2 py-1 ${!status ? "bg-muted" : ""}`}
          >
            All
          </Link>
          {STATUSES.map((entry) => (
            <Link
              key={entry}
              href={`/public-web/inquiries?status=${entry}`}
              className={`rounded-md border px-2 py-1 ${status === entry ? "bg-muted" : ""}`}
            >
              {entry.replace("_", " ")}
            </Link>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <DataTable className="border-0">
              <THead>
                <tr>
                  <TH>Reference</TH>
                  <TH>Intent</TH>
                  <TH>Source</TH>
                  <TH>Organization · region</TH>
                  <TH>Owner channel</TH>
                  <TH>Status</TH>
                  <TH>Received</TH>
                </tr>
              </THead>
              <TBody>
                {rows.length === 0 && (
                  <TR>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={7}>
                      {ready ? "No inquiries match." : "Nothing to show."}
                    </td>
                  </TR>
                )}
                {rows.map((row) => (
                  <TR key={row.id}>
                    <TD>
                      <Link
                        href={`/public-web/inquiries/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.reference}
                      </Link>
                    </TD>
                    <TD>{row.intent.replace("_", " ")}</TD>
                    <TD>
                      {row.sourceBrand}{" "}
                      <span className="text-xs text-muted-foreground">{row.sourcePath}</span>
                    </TD>
                    <TD>{row.contactPreview}</TD>
                    <TD>{row.ownerChannel}</TD>
                    <TD>
                      <Badge variant={row.status === "received" ? "default" : "outline"}>
                        {row.status.replace("_", " ")}
                      </Badge>
                    </TD>
                    <TD>{formatDateTime(row.receivedAt)}</TD>
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
