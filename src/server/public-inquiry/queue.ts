/**
 * Staff queue (WB-703): reading and working inquiries inside the Command
 * Center. Every function checks the permission itself so an unauthenticated
 * or under-permitted caller is refused at the service, not only the screen.
 *
 * `tasks.view` reads the queue; `tasks.update` assigns, changes status, and
 * hands off to a Task. The hand-off creates a Task whose description holds
 * the reference and intent only; the contact details stay in the inquiry
 * record, which the Task links to by id.
 */
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { writeAudit } from "@/server/audit";
import { PermissionDeniedError } from "@/server/permissions";
import {
  redactForLog,
  type InquiryRecord,
  type InquiryStatus,
} from "@/server/public-inquiry/contract";
import {
  getInquiryStore,
  type InquiryListFilters,
  type InquiryStore,
} from "@/server/public-inquiry/store";
import { createTask } from "@/server/services/tasks";

export type Actor = { id: string; permissions: string[] };

function assertPermission(actor: Actor | null | undefined, permission: PermissionKey) {
  if (!actor || !actor.permissions.includes(permission))
    throw new PermissionDeniedError(permission);
}

export const STATUS_TRANSITIONS: Record<InquiryStatus, readonly InquiryStatus[]> = {
  received: ["assigned", "in_progress", "closed", "spam"],
  assigned: ["in_progress", "closed", "spam", "received"],
  in_progress: ["closed", "assigned"],
  closed: ["in_progress"],
  spam: ["received"],
};

export async function listInquiries(
  actor: Actor | null,
  filters: InquiryListFilters = {},
  store: InquiryStore = getInquiryStore(),
) {
  assertPermission(actor, PERMISSIONS.TASKS_VIEW);
  return store.list(filters);
}

export async function getInquiry(
  actor: Actor | null,
  id: string,
  store: InquiryStore = getInquiryStore(),
) {
  assertPermission(actor, PERMISSIONS.TASKS_VIEW);
  return store.get(id);
}

export async function setInquiryStatus(
  actor: Actor | null,
  id: string,
  status: InquiryStatus,
  store: InquiryStore = getInquiryStore(),
) {
  assertPermission(actor, PERMISSIONS.TASKS_UPDATE);
  const current = await store.get(id);
  if (!current) return null;
  if (!STATUS_TRANSITIONS[current.status].includes(status)) {
    throw new Error(`Cannot move an inquiry from ${current.status} to ${status}.`);
  }
  const updated = await store.update(id, {
    status,
    closedAt: status === "closed" ? new Date() : null,
    assignedToId: status === "received" ? null : current.assignedToId,
  });
  await writeAudit({
    actorUserId: actor!.id,
    action: `public_inquiry.${status === "spam" ? "marked_spam" : status}`,
    entityType: "PublicInquiry",
    entityId: id,
    beforeData: redactForLog(current),
    afterData: updated ? redactForLog(updated) : null,
  });
  return updated;
}

export async function assignInquiry(
  actor: Actor | null,
  id: string,
  assigneeId: string,
  store: InquiryStore = getInquiryStore(),
) {
  assertPermission(actor, PERMISSIONS.TASKS_UPDATE);
  const current = await store.get(id);
  if (!current) return null;
  const updated = await store.update(id, {
    assignedToId: assigneeId,
    status: current.status === "received" ? "assigned" : current.status,
  });
  await writeAudit({
    actorUserId: actor!.id,
    action: "public_inquiry.assigned",
    entityType: "PublicInquiry",
    entityId: id,
    beforeData: redactForLog(current),
    afterData: { ...(updated ? redactForLog(updated) : {}), assigneeId },
  });
  return updated;
}

/** Hand an inquiry to the Tasks module. The Task carries the reference and intent, not the visitor's details. */
export async function handOffToTask(
  actor: Actor | null,
  id: string,
  store: InquiryStore = getInquiryStore(),
) {
  assertPermission(actor, PERMISSIONS.TASKS_UPDATE);
  const current = await store.get(id);
  if (!current) return null;
  if (current.taskId) return current;
  const task = await createTask({
    title: `Public inquiry ${current.reference}: ${current.intent.replace("_", " ")}`,
    description: `Follow up the public website inquiry ${current.reference} (${current.intent}, ${current.sourceBrand} ${current.sourcePath}). Contact details are in the Command Center inquiry queue.`,
    priority: "medium",
    status: "open",
    sourceType: "public_inquiry",
    sourceId: current.id,
    createdById: actor!.id,
    assignedToId: current.assignedToId ?? actor!.id,
  });
  const updated = await store.update(id, {
    taskId: task.id,
    status: current.status === "received" ? "assigned" : current.status,
    assignedToId: current.assignedToId ?? actor!.id,
  });
  await writeAudit({
    actorUserId: actor!.id,
    action: "public_inquiry.handed_off",
    entityType: "PublicInquiry",
    entityId: id,
    afterData: { ...(updated ? redactForLog(updated) : {}), taskId: task.id },
  });
  return updated;
}

export function summarize(record: InquiryRecord) {
  return {
    ...record,
    // The queue list shows organization and region, not name, email, or phone, until a record is opened.
    contactPreview:
      [record.contact.organization, record.contact.region].filter(Boolean).join(" · ") || "—",
  };
}
