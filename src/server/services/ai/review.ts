/**
 * AI output review workflow (post-roadmap follow-up; docs/09 §15).
 *
 * Puts the long-dormant pieces to work: AiOutputStatus transitions, the
 * ai.approve_output permission, and approvedById/approvedAt/rejectionReason.
 * Reviewing an output never re-runs the model and never mutates anything
 * except the AiOutput row itself.
 */
import type { AiOutputStatus, Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type ReviewDecision = "reviewed" | "approved" | "rejected" | "archived";

const ALLOWED_TRANSITIONS: Record<string, ReviewDecision[]> = {
  generated: ["reviewed", "approved", "rejected", "archived"],
  reviewed: ["approved", "rejected", "archived"],
  approved: ["archived"],
  rejected: ["archived"],
  superseded: ["archived"],
  archived: [],
};

export type ListReviewFilters = {
  module?: string;
  status?: AiOutputStatus;
  limit?: number;
};

export async function listAiOutputsForReview(filters: ListReviewFilters = {}) {
  const where: Prisma.AiOutputWhereInput = {};
  if (filters.module) where.module = filters.module;
  if (filters.status) where.status = filters.status;
  return prisma.aiOutput.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(filters.limit ?? 50, 100),
    include: { user: { select: { name: true, email: true } } },
  });
}

export async function listAiOutputModules(): Promise<string[]> {
  const rows = await prisma.aiOutput.groupBy({ by: ["module"], _count: { _all: true } });
  return rows
    .map((r) => r.module)
    .filter((m): m is string => !!m)
    .sort();
}

export async function decideAiOutput(args: {
  outputId: string;
  decision: ReviewDecision;
  rejectionReason?: string | null;
  actorUserId: string;
}): Promise<void> {
  const output = await prisma.aiOutput.findUniqueOrThrow({
    where: { id: args.outputId },
    select: { id: true, status: true, module: true },
  });
  const allowed = ALLOWED_TRANSITIONS[output.status] ?? [];
  if (!allowed.includes(args.decision)) {
    throw new Error(`Cannot move an AI output from ${output.status} to ${args.decision}.`);
  }
  if (args.decision === "rejected" && !args.rejectionReason?.trim()) {
    throw new Error("A rejection reason is required.");
  }

  await prisma.aiOutput.update({
    where: { id: output.id },
    data: {
      status: args.decision,
      approvedById: args.decision === "approved" ? args.actorUserId : undefined,
      approvedAt: args.decision === "approved" ? new Date() : undefined,
      rejectionReason: args.decision === "rejected" ? args.rejectionReason!.trim() : undefined,
    },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: `ai_output.${args.decision}`,
    entityType: "ai_output",
    entityId: output.id,
    beforeData: { status: output.status },
    afterData: {
      status: args.decision,
      module: output.module,
      rejectionReason: args.decision === "rejected" ? args.rejectionReason : undefined,
    },
  });
}
