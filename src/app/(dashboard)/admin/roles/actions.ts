"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import {
  createRole,
  deleteRole,
  setRolePermissions,
  updateRole,
} from "@/server/services/roles";
import { requirePermission } from "@/server/permissions";

export type RoleActionState = { error?: string; ok?: string } | undefined;

export async function createRoleAction(
  _prev: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_ROLES);
  try {
    const role = await createRole(
      {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || null,
      },
      { id: actor.id },
    );
    revalidatePath("/admin/roles");
    redirect(`/admin/roles/${role.id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { error: "A role with this name already exists." };
    }
    return { error: err instanceof Error ? err.message : "Failed to create role." };
  }
}

export async function updateRoleAction(
  _prev: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_ROLES);
  const id = String(formData.get("roleId") ?? "");
  if (!id) return { error: "Missing role id." };
  try {
    await updateRole(
      id,
      {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || null,
      },
      { id: actor.id },
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update role." };
  }
  revalidatePath(`/admin/roles/${id}`);
  revalidatePath("/admin/roles");
  return { ok: "Role updated." };
}

export async function setRolePermissionsAction(
  _prev: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_PERMISSIONS);
  const id = String(formData.get("roleId") ?? "");
  if (!id) return { error: "Missing role id." };
  const permissionIds = formData.getAll("permissionIds").map((v) => String(v)).filter(Boolean);
  try {
    await setRolePermissions(id, permissionIds, { id: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update permissions." };
  }
  revalidatePath(`/admin/roles/${id}`);
  return { ok: "Permissions saved." };
}

export async function deleteRoleAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_ROLES);
  const id = String(formData.get("roleId") ?? "");
  if (!id) return;
  try {
    await deleteRole(id, { id: actor.id });
  } catch {
    // Surface error via the role detail page after redirect-back.
    revalidatePath(`/admin/roles/${id}`);
    return;
  }
  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}
