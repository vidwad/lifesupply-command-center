"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserStatus } from "@prisma/client";

import { PERMISSIONS } from "@/lib/permissions";
import {
  createUser,
  resetUserPassword,
  setUserRoles,
  setUserStatus,
  updateUserProfile,
} from "@/server/services/users";
import { requirePermission } from "@/server/permissions";

export type UserActionState = { error?: string; ok?: string } | undefined;

const VALID_STATUSES: UserStatus[] = ["invited", "active", "suspended", "archived"];

function parseStatus(value: FormDataEntryValue | null): UserStatus | null {
  const v = String(value ?? "");
  return (VALID_STATUSES as string[]).includes(v) ? (v as UserStatus) : null;
}

function parseRoleIds(formData: FormData): string[] {
  return formData.getAll("roleIds").map((v) => String(v)).filter(Boolean);
}

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);

  const status = parseStatus(formData.get("status"));
  if (!status) return { error: "Invalid status." };

  try {
    const created = await createUser(
      {
        email: String(formData.get("email") ?? ""),
        name: String(formData.get("name") ?? "") || null,
        title: String(formData.get("title") ?? "") || null,
        department: String(formData.get("department") ?? "") || null,
        password: String(formData.get("password") ?? ""),
        status,
        roleIds: parseRoleIds(formData),
      },
      { id: actor.id },
    );
    revalidatePath("/admin/users");
    redirect(`/admin/users/${created.id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { error: "An account with this email already exists." };
    }
    return { error: err instanceof Error ? err.message : "Failed to create user." };
  }
}

export async function updateProfileAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Missing user id." };
  try {
    await updateUserProfile(
      userId,
      {
        name: String(formData.get("name") ?? "") || null,
        title: String(formData.get("title") ?? "") || null,
        department: String(formData.get("department") ?? "") || null,
      },
      { id: actor.id },
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update user." };
  }
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { ok: "Profile updated." };
}

export async function setStatusAction(formData: FormData): Promise<void> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  const userId = String(formData.get("userId") ?? "");
  const status = parseStatus(formData.get("status"));
  if (!userId || !status) return;
  await setUserStatus(userId, status, { id: actor.id });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function setRolesAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Missing user id." };
  try {
    await setUserRoles(userId, parseRoleIds(formData), { id: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update roles." };
  }
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { ok: "Roles updated." };
}

export async function resetPasswordAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requirePermission(PERMISSIONS.ADMIN_MANAGE_USERS);
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId) return { error: "Missing user id." };
  try {
    await resetUserPassword(userId, password, { id: actor.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reset password." };
  }
  revalidatePath(`/admin/users/${userId}`);
  return { ok: "Password reset." };
}
