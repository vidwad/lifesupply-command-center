import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listDivisions } from "@/server/services/divisions";
import { requirePermission } from "@/server/permissions";

import { CreateDivisionForm, EditDivisionForm } from "./division-forms";

export const metadata = { title: "Divisions" };
export const dynamic = "force-dynamic";

export default async function DivisionsPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  const divisions = await listDivisions();
  const parentChoices = divisions.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div>
      <PageHeader
        title="Divisions"
        description="Operating, holding, geographic, and consolidated divisions used across reporting."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
        actions={<CreateDivisionForm parents={parentChoices} />}
      />
      <div className="space-y-6 p-6">
        {divisions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No divisions yet"
            description="Add a division to start grouping stores and financials."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Code</TH>
                    <TH>Type</TH>
                    <TH>Jurisdiction</TH>
                    <TH>Parent</TH>
                    <TH align="right">Stores</TH>
                    <TH>Status</TH>
                    <TH>{" "}</TH>
                  </tr>
                </THead>
                <TBody>
                  {divisions.map((d) => (
                    <TR key={d.id}>
                      <TD className="font-medium">{d.name}</TD>
                      <TD className="font-mono text-xs">{d.code}</TD>
                      <TD className="text-muted-foreground">{d.type ?? "—"}</TD>
                      <TD className="text-muted-foreground">{d.jurisdiction ?? "—"}</TD>
                      <TD className="text-muted-foreground">{d.parentDivisionName ?? "—"}</TD>
                      <TD align="right" className="tabular-nums">
                        {d.storeCount}
                      </TD>
                      <TD>
                        {d.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TD>
                      <TD>
                        <EditDivisionForm
                          division={{
                            id: d.id,
                            name: d.name,
                            code: d.code,
                            type: d.type,
                            jurisdiction: d.jurisdiction,
                            parentDivisionId: d.parentDivisionId,
                            isActive: d.isActive,
                          }}
                          parents={parentChoices}
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
