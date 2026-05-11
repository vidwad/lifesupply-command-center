import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listAssignableRoles } from "@/server/services/users";
import { requirePermission } from "@/server/permissions";

import { UserCreateForm } from "./user-create-form";

export const metadata = { title: "Add User" };

export default async function NewUserPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  const roles = await listAssignableRoles();

  return (
    <div>
      <PageHeader
        title="Add user"
        description="Invite a teammate. Roles control which modules and actions they can access."
        breadcrumb={
          <Link href="/admin/users" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Users
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl p-6">
        <UserCreateForm roles={roles} />
      </div>
    </div>
  );
}
