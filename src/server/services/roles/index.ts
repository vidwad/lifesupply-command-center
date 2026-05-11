import { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type RoleSummary = {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissionCount: number;
  userCount: number;
};

export type RoleDetail = RoleSummary & {
  permissionIds: string[];
  users: { id: string; name: string | null; email: string }[];
};

export type PermissionRow = {
  id: string;
  key: string;
  module: string;
  action: string;
  description: string | null;
};

export async function listRoles(): Promise<RoleSummary[]> {
  const roles = await prisma.role.findMany({
    orderBy: [{ isSystemRole: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { rolePermissions: true, userRoles: true } },
    },
  });
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystemRole: r.isSystemRole,
    permissionCount: r._count.rolePermissions,
    userCount: r._count.userRoles,
  }));
}

export async function getRole(id: string): Promise<RoleDetail | null> {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: { select: { permissionId: true } },
      userRoles: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { user: { email: "asc" } },
      },
      _count: { select: { rolePermissions: true, userRoles: true } },
    },
  });
  if (!role) return null;
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissionCount: role._count.rolePermissions,
    userCount: role._count.userRoles,
    permissionIds: role.rolePermissions.map((rp) => rp.permissionId),
    users: role.userRoles.map((ur) => ur.user),
  };
}

export async function listAllPermissions(): Promise<PermissionRow[]> {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
    select: { id: true, key: true, module: true, action: true, description: true },
  });
}

export async function createRole(
  input: { name: string; description?: string | null },
  actor: { id: string },
): Promise<RoleSummary> {
  const name = input.name.trim();
  if (!name) throw new Error("Role name is required.");
  const role = await prisma.role.create({
    data: {
      name,
      description: input.description?.trim() || null,
      isSystemRole: false,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "role.created",
    entityType: "role",
    entityId: role.id,
    afterData: { name: role.name },
  });
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissionCount: 0,
    userCount: 0,
  };
}

export async function updateRole(
  id: string,
  input: { name?: string; description?: string | null },
  actor: { id: string },
): Promise<void> {
  const before = await prisma.role.findUniqueOrThrow({
    where: { id },
    select: { name: true, description: true, isSystemRole: true },
  });
  if (before.isSystemRole && input.name && input.name.trim() !== before.name) {
    throw new Error("System roles cannot be renamed.");
  }
  const data: Prisma.RoleUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim() || before.name;
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  await prisma.role.update({ where: { id }, data });
  await writeAudit({
    actorUserId: actor.id,
    action: "role.updated",
    entityType: "role",
    entityId: id,
    beforeData: before,
    afterData: data,
  });
}

export async function deleteRole(id: string, actor: { id: string }): Promise<void> {
  const role = await prisma.role.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { userRoles: true } } },
  });
  if (role.isSystemRole) throw new Error("System roles cannot be deleted.");
  if (role._count.userRoles > 0)
    throw new Error("Unassign all users from this role before deleting it.");
  await prisma.role.delete({ where: { id } });
  await writeAudit({
    actorUserId: actor.id,
    action: "role.deleted",
    entityType: "role",
    entityId: id,
    beforeData: { name: role.name },
  });
}

export async function setRolePermissions(
  id: string,
  permissionIds: string[],
  actor: { id: string },
): Promise<void> {
  const before = await prisma.rolePermission.findMany({
    where: { roleId: id },
    select: { permissionId: true },
  });
  const beforeSet = new Set(before.map((rp) => rp.permissionId));
  const afterSet = new Set(permissionIds);
  const toRemove = before.filter((rp) => !afterSet.has(rp.permissionId)).map((r) => r.permissionId);
  const toAdd = permissionIds.filter((pid) => !beforeSet.has(pid));

  await prisma.$transaction(async (tx) => {
    if (toRemove.length > 0) {
      await tx.rolePermission.deleteMany({
        where: { roleId: id, permissionId: { in: toRemove } },
      });
    }
    if (toAdd.length > 0) {
      await tx.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: id, permissionId })),
        skipDuplicates: true,
      });
    }
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "role.permissions_updated",
    entityType: "role",
    entityId: id,
    beforeData: { count: beforeSet.size },
    afterData: { count: afterSet.size, added: toAdd.length, removed: toRemove.length },
  });
}
