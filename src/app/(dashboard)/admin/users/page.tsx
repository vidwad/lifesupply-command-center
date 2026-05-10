import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              _count: { select: { rolePermissions: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Read-only view of seeded user accounts. Editing UI lands in a later phase."
        breadcrumb="Admin Settings"
      />
      <div className="p-6">
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Run pnpm db:seed to seed the initial Super Admin user."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Roles</th>
                      <th className="px-4 py-3 font-medium">Last sign-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => {
                      const totalPerms = u.userRoles.reduce(
                        (sum, ur) => sum + ur.role._count.rolePermissions,
                        0,
                      );
                      return (
                        <tr key={u.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="font-medium">{u.name ?? "—"}</div>
                            {u.title && (
                              <div className="text-xs text-muted-foreground">{u.title}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {u.userRoles.map((ur) => (
                                <Badge key={ur.id} variant="secondary">
                                  {ur.role.name}
                                </Badge>
                              ))}
                            </div>
                            {totalPerms > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {totalPerms} permission{totalPerms === 1 ? "" : "s"}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
  return <Badge variant={variant}>{status}</Badge>;
}
