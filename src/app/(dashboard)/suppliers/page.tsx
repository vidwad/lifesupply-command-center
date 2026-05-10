import Link from "next/link";
import { Building2, Plug, Wrench } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listSuppliers } from "@/server/services/suppliers";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Suppliers" };
export const dynamic = "force-dynamic";

type SearchParams = { q?: string };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.SUPPLIERS_VIEW);
  const params = await searchParams;
  const suppliers = await listSuppliers({ search: params.q?.trim() || undefined });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Supplier records, portal status, supplier products, and active order load."
        breadcrumb={`${suppliers.length} ${suppliers.length === 1 ? "supplier" : "suppliers"}`}
      />

      <div className="space-y-4 p-6">
        <form action="/suppliers" className="flex justify-end">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by name or code…"
            className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>

        {suppliers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No suppliers found"
            description="Adjust the search or run pnpm db:seed to populate sample suppliers (BBM01, MEDD01, HSI01)."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Supplier</TH>
                <TH>Type</TH>
                <TH>Connectivity</TH>
                <TH align="right">Mapped products</TH>
                <TH align="right">Active orders</TH>
                <TH align="right">Delayed</TH>
                <TH align="right">Exceptions</TH>
              </tr>
            </THead>
            <TBody>
              {suppliers.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <Link href={`/suppliers/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{s.code}</div>
                  </TD>
                  <TD className="text-muted-foreground">{s.type ?? "—"}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {s.apiAvailable && (
                        <Badge variant="success" className="text-[10px]">
                          <Plug className="mr-0.5 h-2.5 w-2.5" /> API
                        </Badge>
                      )}
                      {s.portalUrl && (
                        <Badge variant="secondary" className="text-[10px]">
                          Portal
                        </Badge>
                      )}
                      {s.automationAvailable && (
                        <Badge variant="warning" className="text-[10px]">
                          <Wrench className="mr-0.5 h-2.5 w-2.5" /> Automation
                        </Badge>
                      )}
                      {!s.apiAvailable && !s.portalUrl && !s.automationAvailable && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {s.productCount}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {s.activeOrderItems}
                  </TD>
                  <TD
                    align="right"
                    className={
                      s.delayedOrderItems > 0
                        ? "font-medium tabular-nums text-destructive"
                        : "tabular-nums text-muted-foreground"
                    }
                  >
                    {s.delayedOrderItems}
                  </TD>
                  <TD
                    align="right"
                    className={
                      s.exceptionOrderItems > 0
                        ? "font-medium tabular-nums text-destructive"
                        : "tabular-nums text-muted-foreground"
                    }
                  >
                    {s.exceptionOrderItems}
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
