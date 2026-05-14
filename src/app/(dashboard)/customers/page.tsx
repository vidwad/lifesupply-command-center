import Link from "next/link";
import { Users } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { ExportButton } from "@/components/data/ExportButton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listCustomers, type ListCustomersFilters } from "@/server/services/customers";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { SyncButtons } from "@/components/sync/SyncButtons";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "B2B", value: "b2b" },
  { label: "Clinic", value: "clinic" },
  { label: "Institutional", value: "institutional" },
  { label: "Retail", value: "retail" },
] as const;

const CONSENT_BADGE: Record<string, "success" | "destructive" | "secondary" | "outline"> = {
  subscribed: "success",
  unsubscribed: "destructive",
  transactional: "secondary",
  pending: "outline",
  cleaned: "outline",
  unknown: "outline",
};

type SearchParams = { type?: string; consent?: string; q?: string };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.CUSTOMERS_VIEW);
  const params = await searchParams;
  const canExport = userHasPermission(user, PERMISSIONS.CUSTOMERS_EXPORT);

  const filters: ListCustomersFilters = {
    customerType: TYPE_FILTERS.some((t) => t.value === params.type)
      ? (params.type as ListCustomersFilters["customerType"])
      : undefined,
    consent:
      params.consent === "subscribed" || params.consent === "unsubscribed"
        ? params.consent
        : undefined,
    search: params.q?.trim() || undefined,
  };

  const customers = await listCustomers(filters);
  const activeType = filters.customerType ?? "";

  return (
    <div>
      <PageHeader
        title="Customers"
        description="B2B clinics, institutional buyers, and retail customers across all stores."
        breadcrumb={`${customers.length} ${customers.length === 1 ? "customer" : "customers"}`}
        actions={
          <div className="flex items-center gap-3">
            <SyncButtons entity="customers" />
            {canExport ? (
              <ExportButton
                href={`/api/exports/customers${params.type || params.consent ? `?${new URLSearchParams({ ...(params.type && { type: params.type }), ...(params.consent && { consent: params.consent }) }).toString()}` : ""}`}
              />
            ) : null}
          </div>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => {
            const isActive = activeType === f.value;
            const next = new URLSearchParams();
            if (f.value) next.set("type", f.value);
            if (params.q) next.set("q", params.q);
            if (params.consent) next.set("consent", params.consent);
            const href = `/customers${next.toString() ? `?${next}` : ""}`;
            return (
              <Link
                key={f.value || "all"}
                href={href}
                className={
                  isActive
                    ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                }
              >
                {f.label}
              </Link>
            );
          })}

          <form action="/customers" className="ml-auto flex items-center gap-2">
            {filters.customerType && (
              <input type="hidden" name="type" value={filters.customerType} />
            )}
            {filters.consent && <input type="hidden" name="consent" value={filters.consent} />}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search name, company, email…"
              className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers match these filters"
            description="Adjust filters or run pnpm db:seed to populate sample customers."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Customer</TH>
                <TH>Type</TH>
                <TH>Store</TH>
                <TH>Consent</TH>
                <TH align="right">Lifetime value</TH>
                <TH align="right">Orders</TH>
                <TH>Last order</TH>
                <TH align="right">Reactivation</TH>
              </tr>
            </THead>
            <TBody>
              {customers.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                      {c.displayName}
                    </Link>
                    {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </TD>
                  <TD>
                    <Badge variant="outline">{c.customerType}</Badge>
                  </TD>
                  <TD className="text-muted-foreground">{c.store?.name ?? "—"}</TD>
                  <TD>
                    <Badge variant={CONSENT_BADGE[c.consentStatus] ?? "outline"}>
                      {c.consentStatus}
                    </Badge>
                  </TD>
                  <TD align="right" className="font-medium tabular-nums">
                    {formatCurrency(c.lifetimeValue)}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {c.orderCount}
                  </TD>
                  <TD className="text-muted-foreground">
                    {c.lastOrderAt ? formatDate(c.lastOrderAt) : "Never"}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {c.reactivationScore != null ? c.reactivationScore : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
