/**
 * Publication workflow for the public site (guide §5, WB-603).
 *
 * Every function takes the acting user and checks the permission itself, so
 * the rule holds wherever it is called from: server actions, route handlers,
 * or tests. `public_web.edit` may create, save, and submit; `public_web.approve`
 * may reject, approve, publish, unpublish, and archive. Approval needs a
 * second person: the preparer of a record cannot approve it.
 *
 * Concurrency: every mutation carries the `updatedAt` the caller last saw and
 * is applied with `updateMany` filtered on that value. Zero rows updated means
 * someone else changed the record first; the caller gets `ConflictError` and
 * must reload. Every transition writes an audit event; audit writes never
 * throw (see `writeAudit`).
 *
 * No table, column, or enum is added: the Render container applies migrations
 * on every deploy, so Stage 6 runs on the existing schema and records the
 * additive migration as a reviewed artifact instead (STAGE_06_EVIDENCE.md).
 */
import { PublicContentStatus, type Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { PermissionDeniedError } from "@/server/permissions";
import {
  EDITABLE_STATUSES,
  FAMILIES,
  TRANSITIONS,
  documentInputSchema,
  familyOf,
  isAllowedDocumentUrl,
  validateDraft,
  type PublicFamily,
  type TransitionName,
} from "@/server/public-web/families";
import { PUBLIC_SITE_KEY } from "@/server/public-web/contracts";

export type Actor = { id: string; permissions: string[] };

export class ConflictError extends Error {
  constructor(message = "The record changed since you loaded it. Reload and try again.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

export class ValidationError extends Error {
  constructor(public readonly issues: { path: string; message: string }[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "ValidationError";
  }
}

function assertPermission(actor: Actor, permission: PermissionKey) {
  if (!actor.permissions.includes(permission)) throw new PermissionDeniedError(permission);
}

function toValidationError(error: unknown): never {
  if (error instanceof ZodError) {
    throw new ValidationError(
      error.issues.map((issue) => ({
        path: issue.path.join(".") || "(record)",
        message: issue.message,
      })),
    );
  }
  throw error;
}

/** Actions that need the approver permission; `submit` needs only edit. */
const APPROVER_TRANSITIONS: readonly TransitionName[] = [
  "reject",
  "approve",
  "publish",
  "unpublish",
  "archive",
];

/** Past-tense audit event per transition (IMPLEMENTATION_BACKLOG.md §14). */
const AUDIT_EVENT: Record<TransitionName, string> = {
  submit: "submitted",
  reject: "rejected",
  approve: "approved",
  publish: "published",
  unpublish: "unpublished",
  archive: "archived",
};

function permissionFor(transition: TransitionName): PermissionKey {
  return APPROVER_TRANSITIONS.includes(transition)
    ? PERMISSIONS.PUBLIC_WEB_APPROVE
    : PERMISSIONS.PUBLIC_WEB_EDIT;
}

function snapshot(row: { status: PublicContentStatus; updatedAt: Date; publishedAt: Date | null }) {
  return {
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

function revisionOf(row: { payload: unknown }) {
  const value =
    row.payload && typeof row.payload === "object" && "revision" in row.payload
      ? (row.payload as { revision?: unknown }).revision
      : null;
  return typeof value === "number" ? value : 1;
}

// ---------------------------------------------------------------------------
// Content items (news, resources)
// ---------------------------------------------------------------------------

export async function createDraft(actor: Actor, family: PublicFamily, input: unknown) {
  assertPermission(actor, PERMISSIONS.PUBLIC_WEB_EDIT);
  let draft;
  try {
    draft = validateDraft(family, input, { revision: 1, reviewerId: null });
  } catch (error) {
    toValidationError(error);
  }
  const created = await prisma.publicContentItem.create({
    data: {
      siteKey: PUBLIC_SITE_KEY,
      contentType: FAMILIES[family].contentType,
      ...draft,
      status: PublicContentStatus.draft,
      preparedById: actor.id,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "public_content.created",
    entityType: "PublicContentItem",
    entityId: created.id,
    afterData: { family, slug: created.slug, ...snapshot(created), revision: 1 },
  });
  return created;
}

/**
 * Save an edited draft. Allowed only before approval. An edit to a record
 * under review returns it to draft, because the reviewer has not seen the
 * new text. The revision counter advances on every save.
 */
export async function saveDraft(actor: Actor, id: string, input: unknown, expectedUpdatedAt: Date) {
  assertPermission(actor, PERMISSIONS.PUBLIC_WEB_EDIT);
  const current = await prisma.publicContentItem.findUnique({ where: { id } });
  if (!current) throw new WorkflowError("Record not found.");
  const family = familyOf(current);
  if (!family) throw new WorkflowError("Record is not a Stage 6 content family.");
  if (!EDITABLE_STATUSES.includes(current.status)) {
    throw new WorkflowError(
      `A ${current.status.replace("_", " ")} record cannot be edited. Reject it to draft first.`,
    );
  }
  let draft;
  try {
    draft = validateDraft(family, input, {
      revision: revisionOf(current) + 1,
      reviewerId: null,
    });
  } catch (error) {
    toValidationError(error);
  }
  const result = await prisma.publicContentItem.updateMany({
    where: { id, updatedAt: expectedUpdatedAt, status: { in: [...EDITABLE_STATUSES] } },
    data: { ...draft, status: PublicContentStatus.draft, approvedById: null, approvedAt: null },
  });
  if (result.count !== 1) throw new ConflictError();
  const updated = await prisma.publicContentItem.findUniqueOrThrow({ where: { id } });
  await writeAudit({
    actorUserId: actor.id,
    action: "public_content.saved",
    entityType: "PublicContentItem",
    entityId: id,
    beforeData: { ...snapshot(current), revision: revisionOf(current) },
    afterData: { ...snapshot(updated), revision: revisionOf(updated) },
  });
  return updated;
}

/**
 * Move a record through the state machine. The status the caller expects to
 * leave is checked in the same `updateMany` as the concurrency token, so a
 * stale screen can neither double-publish nor overwrite a newer decision.
 */
export async function transitionContent(
  actor: Actor,
  id: string,
  transition: TransitionName,
  expectedUpdatedAt: Date,
  reason: string | null = null,
) {
  assertPermission(actor, permissionFor(transition));
  const current = await prisma.publicContentItem.findUnique({ where: { id } });
  if (!current) throw new WorkflowError("Record not found.");
  const rule = TRANSITIONS[transition];
  if (!(rule.from as readonly PublicContentStatus[]).includes(current.status)) {
    throw new WorkflowError(
      `Cannot ${transition} a record that is ${current.status.replace("_", " ")}.`,
    );
  }
  if (transition === "approve" && current.preparedById === actor.id) {
    throw new WorkflowError("A record must be approved by someone other than its preparer.");
  }
  if (transition === "publish") {
    // Publishing re-validates the stored payload so a row that predates a
    // stricter rule can never reach the public read model.
    const family = familyOf(current);
    if (!family) throw new WorkflowError("Record is not a Stage 6 content family.");
    try {
      validateDraft(
        family,
        {
          slug: current.slug,
          title: current.title,
          summary: current.summary,
          sourceReference: current.sourceReference,
          effectiveAt: current.effectiveAt?.toISOString() ?? null,
          expiresAt: current.expiresAt?.toISOString() ?? null,
          payload: current.payload,
        },
        { revision: revisionOf(current), reviewerId: current.approvedById ?? null },
      );
    } catch (error) {
      toValidationError(error);
    }
  }
  const now = new Date();
  const data: Prisma.PublicContentItemUncheckedUpdateManyInput = { status: rule.to };
  if (transition === "approve") {
    data.approvedById = actor.id;
    data.approvedAt = now;
    data.payload = { ...(current.payload as Prisma.JsonObject), reviewerId: actor.id };
  }
  if (transition === "reject") {
    data.approvedById = null;
    data.approvedAt = null;
  }
  if (transition === "publish") {
    data.publishedAt = now;
    if (!current.effectiveAt) data.effectiveAt = now;
  }
  if (transition === "unpublish") data.publishedAt = null;
  const result = await prisma.publicContentItem.updateMany({
    where: { id, updatedAt: expectedUpdatedAt, status: current.status },
    data,
  });
  if (result.count !== 1) throw new ConflictError();
  const updated = await prisma.publicContentItem.findUniqueOrThrow({ where: { id } });
  await writeAudit({
    actorUserId: actor.id,
    action: `public_content.${AUDIT_EVENT[transition]}`,
    entityType: "PublicContentItem",
    entityId: id,
    beforeData: { ...snapshot(current), revision: revisionOf(current) },
    afterData: { ...snapshot(updated), revision: revisionOf(updated), reason },
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Public documents (metadata; file delivery waits for storage, DEC-03)
// ---------------------------------------------------------------------------

function documentData(input: unknown) {
  let parsed;
  try {
    parsed = documentInputSchema.parse(input);
  } catch (error) {
    toValidationError(error);
  }
  if (parsed.publicUrl && !isAllowedDocumentUrl(parsed.publicUrl)) {
    throw new ValidationError([
      {
        path: "publicUrl",
        message:
          "Host is not on the approved document-host list (PUBLIC_DOCUMENT_HOSTS). No file can be attached until storage is approved.",
      },
    ]);
  }
  return {
    ...parsed,
    // `fileKey` is required by the schema; until storage exists it records where the file is, or that it is unattached.
    fileKey: parsed.publicUrl ? `external:${parsed.publicUrl}` : "unattached",
  };
}

export async function createDocumentDraft(actor: Actor, input: unknown) {
  assertPermission(actor, PERMISSIONS.PUBLIC_WEB_EDIT);
  const created = await prisma.publicDocument.create({
    data: {
      siteKey: PUBLIC_SITE_KEY,
      ...documentData(input),
      status: PublicContentStatus.draft,
      preparedById: actor.id,
    },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "public_document.created",
    entityType: "PublicDocument",
    entityId: created.id,
    afterData: { title: created.title, ...snapshot(created) },
  });
  return created;
}

export async function saveDocument(
  actor: Actor,
  id: string,
  input: unknown,
  expectedUpdatedAt: Date,
) {
  assertPermission(actor, PERMISSIONS.PUBLIC_WEB_EDIT);
  const current = await prisma.publicDocument.findUnique({ where: { id } });
  if (!current) throw new WorkflowError("Record not found.");
  if (!EDITABLE_STATUSES.includes(current.status)) {
    throw new WorkflowError(
      `A ${current.status.replace("_", " ")} document cannot be edited. Reject it to draft first.`,
    );
  }
  const data = documentData(input);
  const result = await prisma.publicDocument.updateMany({
    where: { id, updatedAt: expectedUpdatedAt, status: { in: [...EDITABLE_STATUSES] } },
    data: { ...data, status: PublicContentStatus.draft, approvedById: null, approvedAt: null },
  });
  if (result.count !== 1) throw new ConflictError();
  const updated = await prisma.publicDocument.findUniqueOrThrow({ where: { id } });
  await writeAudit({
    actorUserId: actor.id,
    action:
      current.fileKey !== updated.fileKey ? "public_document.replaced" : "public_document.saved",
    entityType: "PublicDocument",
    entityId: id,
    beforeData: { fileKey: current.fileKey, ...snapshot(current) },
    afterData: { fileKey: updated.fileKey, ...snapshot(updated) },
  });
  return updated;
}

export async function transitionDocument(
  actor: Actor,
  id: string,
  transition: TransitionName,
  expectedUpdatedAt: Date,
  reason: string | null = null,
) {
  assertPermission(actor, permissionFor(transition));
  const current = await prisma.publicDocument.findUnique({ where: { id } });
  if (!current) throw new WorkflowError("Record not found.");
  const rule = TRANSITIONS[transition];
  if (!(rule.from as readonly PublicContentStatus[]).includes(current.status)) {
    throw new WorkflowError(
      `Cannot ${transition} a document that is ${current.status.replace("_", " ")}.`,
    );
  }
  if (transition === "approve" && current.preparedById === actor.id) {
    throw new WorkflowError("A document must be approved by someone other than its preparer.");
  }
  if (transition === "publish" && current.publicUrl && !isAllowedDocumentUrl(current.publicUrl)) {
    throw new WorkflowError(
      "The attached file host is no longer approved; detach it or fix the allowlist.",
    );
  }
  const now = new Date();
  const data: Prisma.PublicDocumentUncheckedUpdateManyInput = { status: rule.to };
  if (transition === "approve") {
    data.approvedById = actor.id;
    data.approvedAt = now;
  }
  if (transition === "reject") {
    data.approvedById = null;
    data.approvedAt = null;
  }
  if (transition === "publish") data.publishedAt = now;
  if (transition === "unpublish") data.publishedAt = null;
  const result = await prisma.publicDocument.updateMany({
    where: { id, updatedAt: expectedUpdatedAt, status: current.status },
    data,
  });
  if (result.count !== 1) throw new ConflictError();
  const updated = await prisma.publicDocument.findUniqueOrThrow({ where: { id } });
  await writeAudit({
    actorUserId: actor.id,
    action: `public_document.${AUDIT_EVENT[transition]}`,
    entityType: "PublicDocument",
    entityId: id,
    beforeData: snapshot(current),
    afterData: { ...snapshot(updated), reason },
  });
  return updated;
}
