/**
 * Intake service (WB-702). One durable record per valid submission, or a
 * refusal that says only which class of refusal it was.
 *
 * Order of checks: body size → origin → validation → intake flag → rate
 * limit → store readiness → idempotent create → audit. Success is returned
 * only after the store has confirmed the row. Deliveries are recorded as
 * pending and attempted by `delivery.ts`; a delivery failure never turns a
 * received inquiry into an error for the visitor.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { captureException } from "@/server/logger/error-tracking";
import {
  MAX_BODY_BYTES,
  clientAddress,
  intakeRateLimiter,
  isAllowedOrigin,
  type FixedWindowRateLimiter,
} from "@/server/public-inquiry/abuse";
import {
  InquiryValidationError,
  clientHash,
  newReference,
  redactForLog,
  resolveOwnerChannel,
  retentionUntil,
  validateInquiry,
} from "@/server/public-inquiry/contract";
import { recordServerEvent } from "@/server/measurement/events";
import { getInquiryStore, type InquiryStore } from "@/server/public-inquiry/store";
import { isFeatureOn } from "@/server/services/feature-flags";

export type IntakeResult =
  | { ok: true; reference: string; duplicate: boolean }
  | {
      ok: false;
      reason:
        | "too_large"
        | "forbidden_origin"
        | "invalid"
        | "disabled"
        | "rate_limited"
        | "unavailable";
      issues?: { path: string; message: string }[];
    };

export interface IntakeDeps {
  store?: InquiryStore;
  limiter?: FixedWindowRateLimiter;
  flagOn?: () => Promise<boolean>;
  now?: () => Date;
}

export async function receiveInquiry(
  input: { body: unknown; bodyBytes: number; headers: Headers },
  deps: IntakeDeps = {},
): Promise<IntakeResult> {
  const store = deps.store ?? getInquiryStore();
  const limiter = deps.limiter ?? intakeRateLimiter;
  const flagOn = deps.flagOn ?? (() => isFeatureOn(FEATURE_FLAGS.PUBLIC_INQUIRY_INTAKE));
  const now = deps.now?.() ?? new Date();

  if (input.bodyBytes > MAX_BODY_BYTES) return { ok: false, reason: "too_large" };
  if (!isAllowedOrigin(input.headers)) return { ok: false, reason: "forbidden_origin" };

  let request;
  try {
    request = validateInquiry(input.body);
  } catch (error) {
    if (error instanceof InquiryValidationError)
      return { ok: false, reason: "invalid", issues: error.issues };
    throw error;
  }

  // A flag lookup that fails (no database, outage) reads as disabled: fail closed, never 500.
  if (!(await flagOn().catch(() => false))) return { ok: false, reason: "disabled" };

  const hash = clientHash(clientAddress(input.headers));
  if (!limiter.allow(hash, now.getTime())) return { ok: false, reason: "rate_limited" };

  if (!(await store.isReady())) return { ok: false, reason: "unavailable" };

  try {
    const { created, record } = await store.createIfAbsent({
      reference: newReference(),
      intent: request.intent,
      sourceBrand: request.sourceBrand,
      sourcePath: request.sourcePath,
      contact: request.contact,
      fields: request.fields ?? {},
      consentService: true,
      consentMarketing: request.consent.marketing === true,
      campaign: request.campaign ?? null,
      idempotencyKey: request.idempotencyKey,
      clientHash: hash,
      ownerChannel: resolveOwnerChannel(request.intent),
      assignedToId: null,
      status: "received",
      acknowledgment: { state: "pending", attempts: 0, sentAt: null, lastError: null },
      notification: { state: "pending", attempts: 0, sentAt: null, lastError: null },
      taskId: null,
      receivedAt: now,
      retentionUntil: retentionUntil(now),
      closedAt: null,
    });
    if (created) {
      await writeAudit({
        action: "public_inquiry.received",
        entityType: "PublicInquiry",
        entityId: record.id,
        afterData: redactForLog(record),
      });
      // Server-confirmed measurement: only after the row exists, never for a duplicate.
      recordServerEvent("inquiry_submitted", { intent: record.intent, brand: record.sourceBrand });
    }
    return { ok: true, reference: record.reference, duplicate: !created };
  } catch (error) {
    // Storage failed: the visitor must not see success. Log the class, not the body.
    captureException(error, { where: "public_inquiry.receive", intent: request.intent });
    return { ok: false, reason: "unavailable" };
  }
}

/** HTTP status for each refusal; bodies carry no visitor data. */
export const INTAKE_STATUS: Record<Exclude<IntakeResult, { ok: true }>["reason"], number> = {
  too_large: 413,
  forbidden_origin: 403,
  invalid: 400,
  disabled: 503,
  rate_limited: 429,
  unavailable: 503,
};

export const INTAKE_MESSAGE: Record<Exclude<IntakeResult, { ok: true }>["reason"], string> = {
  too_large: "The request is too large.",
  forbidden_origin: "The request did not come from the public website.",
  invalid: "Please correct the highlighted fields.",
  disabled: "Inquiries are not being accepted online yet. Please use the contact directory.",
  rate_limited: "Too many requests. Please try again later.",
  unavailable: "Inquiries cannot be received right now. Please use the contact directory.",
};
