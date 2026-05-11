import { prisma } from "@/server/db/client";
import { captureException } from "@/server/logger/error-tracking";

type AuditInput = {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Persist a material action to the audit log.
 *
 * Per docs/06 §9, log every login, role change, financial approval,
 * report generation/export, integration setting change, supplier automation
 * run, AI prompt/output, and external system update.
 *
 * Failures are logged but never thrown — audit logging must not break the
 * action it is logging.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeData:
          input.beforeData == null ? undefined : JSON.parse(JSON.stringify(input.beforeData)),
        afterData:
          input.afterData == null ? undefined : JSON.parse(JSON.stringify(input.afterData)),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit writes must never throw — they are observability, not control
    // flow. Surface the failure through the structured logger + error
    // tracker so the data isn't silently lost.
    captureException(err, { action: input.action, where: "writeAudit" });
  }
}
