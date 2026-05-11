import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listUsers } from "@/server/services/users";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  const users = await listUsers();

  return (
    <div>
      <PageHeader
        title="Users"
        description="Invite users, assign roles, and manage account status."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
        actions={
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add user
          </Link>
        }
      />
      <div className="p-6">
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Run pnpm db:seed or click Add user to invite the first account."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Email</TH>
                    <TH>Status</TH>
                    <TH>Roles</TH>
                    <TH>Last sign-in</TH>
                    <TH align="right">Created</TH>
                  </tr>
                </THead>
                <TBody>
                  {users.map((u) => (
                    <TR key={u.id}>
                      <TD>
                        <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                          {u.name ?? "(no name)"}
                        </Link>
                        {u.title && (
                          <div className="text-xs text-muted-foreground">{u.title}</div>
                        )}
                      </TD>
                      <TD className="text-muted-foreground">{u.email}</TD>
                      <TD>
                        <StatusBadge status={u.status} />
                      </TD>
                      <TD>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r.id} variant="secondary">
                              {r.name}
                            </Badge>
                          ))}
                          {u.roles.length === 0 && (
                            <span className="text-xs italic text-muted-foreground">
                              No roles
                            </span>
                          )}
                        </div>
                        {u.permissionCount > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {u.permissionCount} permission{u.permissionCount === 1 ? "" : "s"}
                          </div>
                        )}
                      </TD>
                      <TD className="text-muted-foreground">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                      </TD>
                      <TD align="right" className="text-muted-foreground">
                        {formatDateTime(u.createdAt)}
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

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "active"
      ? "success"
      : status === "invited"
        ? "outline"
        : status === "suspended"
          ? "destructive"
          : "secondary";
  return <Badge variant={variant as "success" | "outline" | "destructive" | "secondary"}>{status}</Badge>;
}
