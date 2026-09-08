import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { getInquiry, STATUS_TRANSITIONS } from "@/server/public-inquiry/queue";
import { getInquiryStore } from "@/server/public-inquiry/store";

import { InquiryControls } from "../inquiry-controls";

export const dynamic = "force-dynamic";

function Delivery({
  label,
  state,
}: {
  label: string;
  state: { state: string; attempts: number; sentAt: Date | null; lastError: string | null };
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd>
        {state.state} · {state.attempts} attempt{state.attempts === 1 ? "" : "s"}
        {state.sentAt ? ` · ${formatDateTime(state.sentAt)}` : ""}
        {state.lastError ? ` · ${state.lastError}` : ""}
      </dd>
    </div>
  );
}

export default async function InquiryRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(PERMISSIONS.TASKS_VIEW);
  const { id } = await params;
  const store = getInquiryStore();
  if (!(await store.isReady())) notFound();
  const record = await getInquiry(user, id);
  if (!record) notFound();
  const canUpdate = userHasPermission(user, PERMISSIONS.TASKS_UPDATE);
  const history = await prisma.auditLog.findMany({
    where: { entityType: "PublicInquiry", entityId: record.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { actor: { select: { name: true } } },
  });
  const canRetry =
    (record.acknowledgment.state === "failed" || record.notification.state === "failed") &&
    record.status !== "spam";

  return (
    <div>
      <PageHeader
        title={record.reference}
        description={`${record.intent.replace("_", " ")} · ${record.sourceBrand} ${record.sourcePath} · owner ${record.ownerChannel}`}
        breadcrumb={
          <Link
            href="/public-web/inquiries"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Public inquiries
          </Link>
        }
        actions={
          <Badge variant={record.status === "received" ? "default" : "outline"}>
            {record.status.replace("_", " ")}
          </Badge>
        }
      />
      <div className="grid gap-8 p-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Contact</h2>
            <dl className="mt-3 grid gap-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd>{record.contact.name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{record.contact.email}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{record.contact.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Organization</dt>
                <dd>{record.contact.organization ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Region</dt>
                <dd>{record.contact.region ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Marketing consent</dt>
                <dd>{record.consentMarketing ? "yes" : "no"}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="mt-3 grid gap-1 text-sm">
              {Object.keys(record.fields).length === 0 && (
                <p className="text-muted-foreground">No intent-specific fields.</p>
              )}
              {Object.entries(record.fields).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {record.campaign && (
              <p className="mt-3 text-xs text-muted-foreground">
                Campaign:{" "}
                {[record.campaign.utmSource, record.campaign.utmMedium, record.campaign.utmCampaign]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Handling</h2>
            <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Received</dt>
                <dd>{formatDateTime(record.receivedAt)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Retention until</dt>
                <dd>{formatDateTime(record.retentionUntil)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Assigned to</dt>
                <dd>{record.assignedToId ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Task</dt>
                <dd>
                  {record.taskId ? (
                    <Link href={`/tasks/${record.taskId}`} className="underline">
                      open
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <Delivery label="Acknowledgment" state={record.acknowledgment} />
              <Delivery label="Owner notification" state={record.notification} />
            </dl>
            {canUpdate && (
              <div className="mt-4">
                <InquiryControls
                  id={record.id}
                  nextStatuses={[...STATUS_TRANSITIONS[record.status]]}
                  hasTask={record.taskId !== null}
                  canRetryDelivery={canRetry}
                />
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">History</h2>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {history.length === 0 && <li>No events yet.</li>}
              {history.map((event) => (
                <li key={event.id}>
                  <span className="font-medium text-foreground">
                    {event.action.replace("public_inquiry.", "")}
                  </span>{" "}
                  by {event.actor?.name ?? "public website"} · {formatDateTime(event.createdAt)}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
