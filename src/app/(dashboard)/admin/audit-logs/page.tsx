import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import {
  listAuditLogActors,
  listAuditLogEntityTypes,
  listAuditLogs,
} from "@/server/services/audit-logs";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Audit Logs" };
export const dynamic = "force-dynamic";

type SearchParams = {
  actor?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  q?: string;
  from?: string;
  to?: string;
  cursor?: string;
};

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function actionTone(action: string): "default" | "secondary" | "destructive" | "warning" | "success" | "outline" {
  if (action.startsWith("auth.")) return "secondary";
  if (action.includes(".deleted") || action.includes(".rejected") || action.includes(".failed"))
    return "destructive";
  if (action.includes(".approved") || action.includes(".completed")) return "success";
  if (action.includes(".created") || action.includes(".generated")) return "default";
  if (action.includes(".updated") || action.includes(".set") || action.includes(".rotated"))
    return "outline";
  if (action.startsWith("integration.") || action.startsWith("ai.")) return "secondary";
  return "outline";
}

function summarizeJson(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "object") return String(value);
  try {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) return null;
    return keys.slice(0, 4).join(", ") + (keys.length > 4 ? "…" : "");
  } catch {
    return null;
  }
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.ADMIN_VIEW_AUDIT_LOGS);
  const params = await searchParams;

  const [{ rows, nextCursor }, actors, entityTypes] = await Promise.all([
    listAuditLogs({
      actorId: params.actor || undefined,
      action: params.action?.trim() || undefined,
      entityType: params.entityType || undefined,
      entityId: params.entityId?.trim() || undefined,
      search: params.q?.trim() || undefined,
      from: parseDate(params.from),
      to: parseDate(params.to),
      cursor: params.cursor || undefined,
    }),
    listAuditLogActors(),
    listAuditLogEntityTypes(),
  ]);

  const buildHref = (overrides: Partial<SearchParams> = {}) => {
    const next = new URLSearchParams();
    const merged: SearchParams = { ...params, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (key === "cursor") continue;
      if (value) next.set(key, value);
    }
    if (overrides.cursor) next.set("cursor", overrides.cursor);
    const qs = next.toString();
    return `/admin/audit-logs${qs ? `?${qs}` : ""}`;
  };

  const hasFilters = Boolean(
    params.actor ||
      params.action ||
      params.entityType ||
      params.entityId ||
      params.q ||
      params.from ||
      params.to,
  );

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Material actions across the platform — logins, integrations, financial approvals, AI outputs, supplier automation, exports."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <form action="/admin/audit-logs" className="rounded-md border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Search">
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Action, entity, actor…"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </Field>
            <Field label="Actor">
              <select
                name="actor"
                defaultValue={params.actor ?? ""}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All actors</option>
                {actors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Action contains">
              <input
                name="action"
                defaultValue={params.action ?? ""}
                placeholder="e.g. financials.approved"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </Field>
            <Field label="Entity type">
              <select
                name="entityType"
                defaultValue={params.entityType ?? ""}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All entity types</option>
                {entityTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Entity ID">
              <input
                name="entityId"
                defaultValue={params.entityId ?? ""}
                placeholder="exact id"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </Field>
            <Field label="From">
              <input
                type="datetime-local"
                name="from"
                defaultValue={params.from ?? ""}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </Field>
            <Field label="To">
              <input
                type="datetime-local"
                name="to"
                defaultValue={params.to ?? ""}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </Field>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Apply
              </button>
              {hasFilters && (
                <Link
                  href="/admin/audit-logs"
                  className="h-9 rounded-md border px-4 text-sm font-medium leading-9 text-muted-foreground hover:bg-accent"
                >
                  Reset
                </Link>
              )}
            </div>
          </div>
        </form>

        {rows.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={hasFilters ? "No audit logs match these filters" : "No audit logs yet"}
            description={
              hasFilters
                ? "Try widening the date range or removing filters."
                : "Material actions are recorded here as users work in the platform."
            }
          />
        ) : (
          <>
            <DataTable>
              <THead>
                <tr>
                  <TH>Time</TH>
                  <TH>Actor</TH>
                  <TH>Action</TH>
                  <TH>Entity</TH>
                  <TH>Changes</TH>
                  <TH>IP</TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((row) => {
                  const before = summarizeJson(row.beforeData);
                  const after = summarizeJson(row.afterData);
                  return (
                    <TR key={row.id}>
                      <TD className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </TD>
                      <TD>
                        {row.actor ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{row.actor.name ?? row.actor.email}</span>
                            {row.actor.name && (
                              <span className="text-xs text-muted-foreground">
                                {row.actor.email}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">system</span>
                        )}
                      </TD>
                      <TD>
                        <Badge variant={actionTone(row.action)}>{row.action}</Badge>
                      </TD>
                      <TD>
                        {row.entityType ? (
                          <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              {row.entityType}
                            </span>
                            {row.entityId && (
                              <span className="font-mono text-xs">{row.entityId}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD>
                        {before || after ? (
                          <div className="flex flex-col text-xs text-muted-foreground">
                            {before && <span>before: {before}</span>}
                            {after && <span>after: {after}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD className="font-mono text-xs text-muted-foreground">
                        {row.ipAddress ?? "—"}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </DataTable>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{rows.length} row{rows.length === 1 ? "" : "s"} on this page</span>
              {nextCursor && (
                <Link
                  href={buildHref({ cursor: nextCursor })}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Next page →
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
