import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import type { PermissionKey } from "@/lib/permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: PermissionKey) {
    super(`Permission denied: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

export function userHasPermission(
  user: { permissions: string[] } | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function userHasAnyPermission(
  user: { permissions: string[] } | null | undefined,
  permissions: PermissionKey[],
): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Server-side gate for protected actions and route handlers.
 * Redirects to /login if no session; throws PermissionDeniedError if the
 * user is authenticated but lacks the required permission. Callers should
 * catch and surface a friendly error or rely on a Next.js error boundary.
 */
export async function requirePermission(permission: PermissionKey) {
  const user = await requireUser();
  if (!user.permissions.includes(permission)) {
    throw new PermissionDeniedError(permission);
  }
  return user;
}
