import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getUser, listAssignableRoles } from "@/server/services/users";
import { requirePermission } from "@/server/permissions";

import { setStatusAction } from "../actions";
import { PasswordResetForm, ProfileForm, RolesForm } from "./user-edit-forms";

export const metadata = { title: "User detail" };
export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  const { id } = await params;
  const [user, roles] = await Promise.all([getUser(id), listAssignableRoles()]);
  if (!user) notFound();
  const isSelf = actor.id === user.id;

  return (
    <div>
      <PageHeader
        title={user.name ?? user.email}
        description={user.email}
        breadcrumb={
          <Link href="/admin/users" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Users
          </Link>
        }
        actions={<StatusBadge status={user.status} />}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProfileForm user={user} />
          <RolesForm user={user} roles={roles} isSelf={isSelf} />
        </div>

        <div className="space-y-6">
          <section className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-medium">Account</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Created">{formatDateTime(user.createdAt)}</Row>
              <Row label="Last sign-in">
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
              </Row>
              <Row label="Permissions">
                {user.permissionCount} via {user.roles.length} role
                {user.roles.length === 1 ? "" : "s"}
              </Row>
            </dl>
          </section>

          {!isSelf && (
            <section className="space-y-3 rounded-md border bg-card p-4">
              <h2 className="text-sm font-medium">Status</h2>
              <p className="text-xs text-muted-foreground">
                Suspended users keep their data but cannot sign in. Archived users are hidden from
                most lists.
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusForm userId={user.id} target="active" current={user.status} />
                <StatusForm userId={user.id} target="invited" current={user.status} />
                <StatusForm userId={user.id} target="suspended" current={user.status} />
                <StatusForm userId={user.id} target="archived" current={user.status} />
              </div>
            </section>
          )}

          <PasswordResetForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
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

function StatusForm({
  userId,
  target,
  current,
}: {
  userId: string;
  target: "active" | "invited" | "suspended" | "archived";
  current: string;
}) {
  const isCurrent = current === target;
  const labels: Record<typeof target, string> = {
    active: "Activate",
    invited: "Re-invite",
    suspended: "Suspend",
    archived: "Archive",
  };
  return (
    <form action={setStatusAction}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={target} />
      <button
        type="submit"
        disabled={isCurrent}
        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isCurrent ? `Currently ${target}` : labels[target]}
      </button>
    </form>
  );
}
