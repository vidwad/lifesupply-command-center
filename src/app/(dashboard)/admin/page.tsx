import Link from "next/link";
import { Building2, Key, ScrollText, ShieldCheck, Sparkles, Store, Upload, Users } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { requireUser, userHasAnyPermission } from "@/server/permissions";

export const metadata = { title: "Admin Settings" };

const ADMIN_VIEW_PERMISSIONS = [
  PERMISSIONS.ADMIN_MANAGE_USERS,
  PERMISSIONS.ADMIN_MANAGE_ROLES,
  PERMISSIONS.ADMIN_MANAGE_PERMISSIONS,
  PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS,
  PERMISSIONS.ADMIN_VIEW_AUDIT_LOGS,
  PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS,
] as const;

type AdminTile = {
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
  permission: PermissionKey;
};

const TILES: AdminTile[] = [
  {
    href: "/admin/users",
    title: "Users",
    description: "Invite, edit, suspend users and assign roles.",
    icon: Users,
    permission: PERMISSIONS.ADMIN_MANAGE_USERS,
  },
  {
    href: "/admin/roles",
    title: "Roles & Permissions",
    description: "Manage roles and assign permissions across the platform.",
    icon: ShieldCheck,
    permission: PERMISSIONS.ADMIN_MANAGE_ROLES,
  },
  {
    href: "/admin/divisions",
    title: "Divisions",
    description: "Operating, holding, geographic, and consolidated divisions.",
    icon: Building2,
    permission: PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS,
  },
  {
    href: "/admin/stores",
    title: "Stores",
    description: "Storefronts mapped to BigCommerce / external sales channels.",
    icon: Store,
    permission: PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS,
  },
  {
    href: "/admin/integrations",
    title: "API & Integrations",
    description: "Manage credentials per integration. Encrypted at rest in the vault.",
    icon: Key,
    permission: PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS,
  },
  {
    href: "/admin/import",
    title: "Data import",
    description: "Upload BigCommerce / QuickBooks CSV exports until live sync is wired.",
    icon: Upload,
    permission: PERMISSIONS.FINANCIALS_IMPORT,
  },
  {
    href: "/admin/ai-settings",
    title: "AI Settings",
    description: "Default model, temperature, and prompt template library.",
    icon: Sparkles,
    permission: PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS,
  },
  {
    href: "/admin/audit-logs",
    title: "Audit Logs",
    description: "Material actions across the platform — searchable and filterable.",
    icon: ScrollText,
    permission: PERMISSIONS.ADMIN_VIEW_AUDIT_LOGS,
  },
];

export default async function AdminPage() {
  const user = await requireUser();
  if (!userHasAnyPermission(user, [...ADMIN_VIEW_PERMISSIONS])) {
    // Fall back to the default permission gate so unauthorized users see the
    // standard not-authorized error from requirePermission.
    const { requirePermission } = await import("@/server/permissions");
    await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  }

  const tiles = TILES.filter((tile) => user.permissions.includes(tile.permission));

  return (
    <div>
      <PageHeader
        title="Admin Settings"
        description="Users, roles, permissions, integrations, and system configuration."
        breadcrumb="Admin"
      />
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="block">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <tile.icon className="h-5 w-5" />
                </div>
                <CardTitle>{tile.title}</CardTitle>
                <CardDescription>{tile.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
