import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import type {
  ExceptionSeverity,
  ExceptionState,
  ExceptionType,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listExceptions, type ExceptionFilters } from "@/server/services/exceptions";
import { requirePermission } from "@/server/permissions";

import { ExceptionStatusForm } from "./status-form";

export const metadata = { title: "Exceptions" };
export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  severity?: string;
  type?: string;
  q?: string;
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "blocked", label: "Blocked" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const SEVERITY_VALUES: ExceptionSeverity[] = ["low", "medium", "high", "urgent"];
const TYPE_VALUES: ExceptionType[] = [
  "order_delay",
  "order_payment",
  "order_address",
  "supplier_stock",
  "supplier_price_mismatch",
  "supplier_sku_mismatch",
  "product_missing_cost",
  "product_missing_image",
  "product_low_margin",
  "financial_import",
  "ai_output_review",
  "integration_sync",
  "other",
];

function severityVariant(s: ExceptionSeverity): "destructive" | "warning" | "secondary" | "outline" {
  switch (s) {
    case "urgent":
      return "destructive";
    case "high":
      return "warning";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
  }
}

function statusVariant(s: ExceptionState): "destructive" | "warning" | "success" | "secondary" | "outline" {
  switch (s) {
    case "open":
      return "destructive";
    case "investigating":
      return "warning";
    case "blocked":
      return "warning";
    case "resolved":
      return "success";
    case "dismissed":
      return "outline";
  }
}

function entityHref(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "order":
      return `/orders/${entityId}`;
    case "customer":
      return `/customers/${entityId}`;
    case "product":
      return `/products/${entityId}`;
    case "supplier":
      return `/suppliers/${entityId}`;
    case "report":
      return `/reports/${entityId}`;
    default:
      return null;
  }
}

export default async function ExceptionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.ORDERS_VIEW);
  const params = await searchParams;

  const filters: ExceptionFilters = {
    status: STATUS_FILTERS.some((s) => s.value === params.status)
      ? (params.status as ExceptionFilters["status"])
      : "active",
    severity: SEVERITY_VALUES.includes(params.severity as ExceptionSeverity)
      ? (params.severity as ExceptionSeverity)
      : undefined,
    exceptionType: TYPE_VALUES.includes(params.type as ExceptionType)
      ? (params.type as ExceptionType)
      : undefined,
    search: params.q?.trim() || undefined,
  };

  const rows = await listExceptions(filters);
  const activeStatus = filters.status ?? "active";

  return (
    <div>
      <PageHeader
        title="Exceptions"
        description="Items needing attention across orders, suppliers, products, financials, and integrations."
        breadcrumb={
          <Link href="/operations" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Operations
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => {
            const next = new URLSearchParams();
            next.set("status", s.value);
            if (params.severity) next.set("severity", params.severity);
            if (params.type) next.set("type", params.type);
            if (params.q) next.set("q", params.q);
            const isActive = activeStatus === s.value;
            return (
              <Link
                key={s.value}
                href={`/operations/exceptions?${next.toString()}`}
                className={
                  isActive
                    ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                }
              >
                {s.label}
              </Link>
            );
          })}
          <form action="/operations/exceptions" className="ml-auto flex items-center gap-2">
            <input type="hidden" name="status" value={activeStatus} />
            <select
              name="severity"
              defaultValue={params.severity ?? ""}
              className="h-9 rounded-md border bg-background px-2 text-xs"
            >
              <option value="">Any severity</option>
              {SEVERITY_VALUES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={params.type ?? ""}
              className="h-9 rounded-md border bg-background px-2 text-xs"
            >
              <option value="">Any type</option>
              {TYPE_VALUES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search title, entity…"
              className="h-9 w-48 rounded-md border bg-background px-3 text-sm"
            />
          </form>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No exceptions match these filters"
            description="When orders, suppliers, products, or imports raise issues, they appear here."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Type</TH>
                    <TH>Title</TH>
                    <TH>Entity</TH>
                    <TH>Severity</TH>
                    <TH>Status</TH>
                    <TH>Age</TH>
                    <TH>Assigned</TH>
                    <TH>Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((r) => {
                    const href = entityHref(r.entityType, r.entityId);
                    return (
                      <TR key={r.id}>
                        <TD className="text-xs uppercase tracking-wide text-muted-foreground">
                          {r.exceptionType.replace(/_/g, " ")}
                        </TD>
                        <TD>
                          <div className="font-medium">{r.title}</div>
                          {r.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {r.description}
                            </div>
                          )}
                          {r.recurringKey && (
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                              recurring: {r.recurringKey}
                            </div>
                          )}
                        </TD>
                        <TD>
                          {href ? (
                            <Link href={href} className="font-mono text-xs text-primary hover:underline">
                              {r.entityType}/{r.entityId?.slice(0, 8)}…
                            </Link>
                          ) : r.entityId ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {r.entityType}/{r.entityId.slice(0, 8)}…
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TD>
                        <TD>
                          <Badge variant={severityVariant(r.severity)}>{r.severity}</Badge>
                        </TD>
                        <TD>
                          <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                        </TD>
                        <TD className="text-xs text-muted-foreground">
                          {r.ageHours < 24
                            ? `${r.ageHours}h`
                            : `${Math.floor(r.ageHours / 24)}d`}
                          <div className="text-[10px]">{formatDateTime(r.createdAt)}</div>
                        </TD>
                        <TD className="text-xs">
                          {r.assignedTo ? (
                            r.assignedTo.name ?? r.assignedTo.email
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {r.resolvedBy && (
                            <div className="text-[10px] text-success">
                              resolved by {r.resolvedBy.name ?? r.resolvedBy.email}
                            </div>
                          )}
                        </TD>
                        <TD>
                          <ExceptionStatusForm id={r.id} currentStatus={r.status} />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
