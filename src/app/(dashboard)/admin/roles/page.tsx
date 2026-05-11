import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listRoles } from "@/server/services/roles";
import { requirePermission } from "@/server/permissions";

import { CreateRoleForm } from "./create-role-form";

export const metadata = { title: "Roles" };
export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_ROLES);
  const roles = await listRoles();

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="System roles seed from /docs/06. Custom roles can be added and tuned."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
      />
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {roles.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No roles defined"
              description="Run pnpm db:seed to seed system roles."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <DataTable className="border-0">
                  <THead>
                    <tr>
                      <TH>Role</TH>
                      <TH align="right">Permissions</TH>
                      <TH align="right">Users</TH>
                      <TH>Type</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {roles.map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <Link
                            href={`/admin/roles/${r.id}`}
                            className="font-medium hover:underline"
                          >
                            {r.name}
                          </Link>
                          {r.description && (
                            <div className="text-xs text-muted-foreground">{r.description}</div>
                          )}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {r.permissionCount}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {r.userCount}
                        </TD>
                        <TD>
                          {r.isSystemRole ? (
                            <Badge variant="secondary">System</Badge>
                          ) : (
                            <Badge variant="outline">Custom</Badge>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <CreateRoleForm />
        </div>
      </div>
    </div>
  );
}
