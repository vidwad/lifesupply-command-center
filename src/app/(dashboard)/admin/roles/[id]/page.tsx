import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { getRole, listAllPermissions } from "@/server/services/roles";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { deleteRoleAction } from "../actions";
import { RolePermissionsForm, RoleProfileForm } from "./role-edit-forms";

export const metadata = { title: "Role detail" };
export const dynamic = "force-dynamic";

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_ROLES);
  const { id } = await params;
  const [role, permissions] = await Promise.all([getRole(id), listAllPermissions()]);
  if (!role) notFound();
  const canEditPermissions = userHasPermission(user, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS);

  return (
    <div>
      <PageHeader
        title={role.name}
        description={role.description ?? "No description."}
        breadcrumb={
          <Link href="/admin/roles" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Roles
          </Link>
        }
        actions={role.isSystemRole ? <Badge variant="secondary">System role</Badge> : null}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RoleProfileForm role={role} />
          {canEditPermissions ? (
            <RolePermissionsForm role={role} permissions={permissions} />
          ) : (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              You can view this role but not edit its permissions. Requires{" "}
              <code className="rounded bg-muted px-1">{PERMISSIONS.ADMIN_MANAGE_PERMISSIONS}</code>.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Users with this role</CardTitle>
            </CardHeader>
            <CardContent>
              {role.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users assigned.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {role.users.map((u) => (
                    <li key={u.id}>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-medium hover:underline"
                      >
                        {u.name ?? u.email}
                      </Link>
                      {u.name && (
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {!role.isSystemRole && role.userCount === 0 && (
            <form action={deleteRoleAction} className="rounded-md border border-destructive/30 bg-card p-4">
              <h2 className="text-sm font-medium">Delete role</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Custom roles can be deleted only when no users are assigned.
              </p>
              <input type="hidden" name="roleId" value={role.id} />
              <button
                type="submit"
                className="mt-3 rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Delete role
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
