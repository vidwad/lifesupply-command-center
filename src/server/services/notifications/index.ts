import type { Prisma } from "@prisma/client";

import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { approvePermissionFor } from "@/server/services/approvals";

const APPROVAL_TYPES = [
  "campaign",
  "financial_summary",
  "report",
  "supplier_order",
  "external_update",
  "investor_material",
];

export type NotificationCounts = {
  approvalsCanDecide: number;
  myOverdueTasks: number;
  openExceptions: number;
  total: number;
};

/**
 * Fast counts for the topbar bell. Each block is filtered to what the user
 * can actually act on, so the badge is meaningful (no "12 pending approvals
 * none of which you can decide").
 */
export async function getNotificationCounts(user: {
  id: string;
  permissions: string[];
}): Promise<NotificationCounts> {
  // ---- approvals pending the user can decide on (per-type permission) ----
  const decidableTypes = APPROVAL_TYPES.filter((t) => {
    const perm = approvePermissionFor(t);
    return perm != null && user.permissions.includes(perm);
  });

  const approvalWhere: Prisma.ApprovalWhereInput = {
    status: "pending",
    ...(decidableTypes.length > 0 ? { approvalType: { in: decidableTypes } } : {}),
  };

  const now = new Date();

  const tasksWhere: Prisma.TaskWhereInput = {
    status: { in: ["open", "in_progress", "blocked", "awaiting_approval"] },
    assignedToId: user.id,
    dueDate: { lt: now },
  };

  const canViewOrders = user.permissions.includes(PERMISSIONS.ORDERS_VIEW as PermissionKey);
  const exceptionsWhere: Prisma.OrderWhereInput = {
    exceptionStatus: { in: ["flagged", "in_review"] },
  };

  const [approvalsCanDecide, myOverdueTasks, openExceptions] = await Promise.all([
    decidableTypes.length === 0
      ? Promise.resolve(0)
      : prisma.approval.count({ where: approvalWhere }),
    prisma.task.count({ where: tasksWhere }),
    canViewOrders ? prisma.order.count({ where: exceptionsWhere }) : Promise.resolve(0),
  ]);

  return {
    approvalsCanDecide,
    myOverdueTasks,
    openExceptions,
    total: approvalsCanDecide + myOverdueTasks + openExceptions,
  };
}
