import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Admin Settings" };

export default async function AdminPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);

  return (
    <div>
      <PageHeader
        title="Admin Settings"
        description="Users, roles, permissions, integrations, and system configuration."
        breadcrumb="Phase 1 — MVP shell"
      />
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users" className="block">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle>Users</CardTitle>
              <CardDescription>View seeded users, roles, and permission counts.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Card className="h-full opacity-60">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>Editable role/permission management — Phase 2+.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Roles and permissions are currently seeded. Editing UI lands in a later phase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
