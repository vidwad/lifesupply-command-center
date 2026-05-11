import { hash } from "bcryptjs";
import { Prisma, type UserStatus } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type UserSummary = {
  id: string;
  email: string;
  name: string | null;
  title: string | null;
  department: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: { id: string; name: string }[];
  permissionCount: number;
};

const USER_LIST_INCLUDE = {
  userRoles: {
    include: {
      role: {
        include: {
          _count: { select: { rolePermissions: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

function mapUser(u: Prisma.UserGetPayload<{ include: typeof USER_LIST_INCLUDE }>): UserSummary {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    title: u.title,
    department: u.department,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    roles: u.userRoles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
    permissionCount: u.userRoles.reduce((sum, ur) => sum + ur.role._count.rolePermissions, 0),
  };
}

export async function listUsers(): Promise<UserSummary[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: USER_LIST_INCLUDE,
  });
  return users.map(mapUser);
}

export async function getUser(id: string): Promise<UserSummary | null> {
  const u = await prisma.user.findUnique({
    where: { id },
    include: USER_LIST_INCLUDE,
  });
  return u ? mapUser(u) : null;
}

export type CreateUserInput = {
  email: string;
  name?: string | null;
  title?: string | null;
  department?: string | null;
  password: string;
  status: UserStatus;
  roleIds: string[];
};

export async function createUser(
  input: CreateUserInput,
  actor: { id: string },
): Promise<UserSummary> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("A valid email address is required.");
  if (!input.password || input.password.length < 12)
    throw new Error("Password must be at least 12 characters.");

  const passwordHash = await hash(input.password, 12);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: input.name?.trim() || null,
        title: input.title?.trim() || null,
        department: input.department?.trim() || null,
        passwordHash,
        status: input.status,
      },
    });
    if (input.roleIds.length > 0) {
      await tx.userRole.createMany({
        data: input.roleIds.map((roleId) => ({ userId: user.id, roleId })),
        skipDuplicates: true,
      });
    }
    return tx.user.findUniqueOrThrow({ where: { id: user.id }, include: USER_LIST_INCLUDE });
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "user.created",
    entityType: "user",
    entityId: created.id,
    afterData: {
      email: created.email,
      name: created.name,
      status: created.status,
      roleIds: input.roleIds,
    },
  });

  return mapUser(created);
}

export type UpdateUserProfileInput = {
  name?: string | null;
  title?: string | null;
  department?: string | null;
};

export async function updateUserProfile(
  id: string,
  input: UpdateUserProfileInput,
  actor: { id: string },
): Promise<UserSummary> {
  const before = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { name: true, title: true, department: true },
  });
  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: input.name?.trim() || null,
      title: input.title?.trim() || null,
      department: input.department?.trim() || null,
    },
    include: USER_LIST_INCLUDE,
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "user.profile_updated",
    entityType: "user",
    entityId: id,
    beforeData: before,
    afterData: { name: updated.name, title: updated.title, department: updated.department },
  });
  return mapUser(updated);
}

export async function setUserStatus(
  id: string,
  status: UserStatus,
  actor: { id: string },
): Promise<UserSummary> {
  if (id === actor.id && status !== "active") {
    throw new Error("You cannot change your own status.");
  }
  const before = await prisma.user.findUniqueOrThrow({ where: { id }, select: { status: true } });
  if (before.status === status) {
    const u = await prisma.user.findUniqueOrThrow({ where: { id }, include: USER_LIST_INCLUDE });
    return mapUser(u);
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    include: USER_LIST_INCLUDE,
  });
  await writeAudit({
    actorUserId: actor.id,
    action: `user.${status}`,
    entityType: "user",
    entityId: id,
    beforeData: before,
    afterData: { status },
  });
  return mapUser(updated);
}

export async function resetUserPassword(
  id: string,
  newPassword: string,
  actor: { id: string },
): Promise<void> {
  if (!newPassword || newPassword.length < 12)
    throw new Error("Password must be at least 12 characters.");
  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  await writeAudit({
    actorUserId: actor.id,
    action: "user.password_reset",
    entityType: "user",
    entityId: id,
  });
}

export async function setUserRoles(
  id: string,
  roleIds: string[],
  actor: { id: string },
): Promise<UserSummary> {
  if (id === actor.id) {
    // Prevent self-lockout: must keep at least one role.
    if (roleIds.length === 0) throw new Error("You must keep at least one role assigned to yourself.");
  }
  const before = await prisma.userRole.findMany({
    where: { userId: id },
    select: { roleId: true },
  });
  const beforeIds = new Set(before.map((r) => r.roleId));
  const afterIds = new Set(roleIds);

  const toAdd = roleIds.filter((r) => !beforeIds.has(r));
  const toRemove = before.filter((r) => !afterIds.has(r.roleId)).map((r) => r.roleId);

  await prisma.$transaction(async (tx) => {
    if (toRemove.length > 0) {
      await tx.userRole.deleteMany({ where: { userId: id, roleId: { in: toRemove } } });
    }
    if (toAdd.length > 0) {
      await tx.userRole.createMany({
        data: toAdd.map((roleId) => ({ userId: id, roleId })),
        skipDuplicates: true,
      });
    }
  });

  await writeAudit({
    actorUserId: actor.id,
    action: "user.roles_updated",
    entityType: "user",
    entityId: id,
    beforeData: { roleIds: [...beforeIds] },
    afterData: { roleIds: [...afterIds] },
  });

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id },
    include: USER_LIST_INCLUDE,
  });
  return mapUser(updated);
}

export async function listAssignableRoles(): Promise<{ id: string; name: string; description: string | null }[]> {
  return prisma.role.findMany({
    orderBy: [{ isSystemRole: "desc" }, { name: "asc" }],
    select: { id: true, name: true, description: true },
  });
}
