import { beforeEach, describe, expect, it, vi } from "vitest";

import { PERMISSIONS } from "@/lib/permissions";

const writeAudit = vi.hoisted(() => vi.fn());
const createTask = vi.hoisted(() => vi.fn(async (_input: unknown) => ({ id: "task-1" })));
const PermissionDeniedError = vi.hoisted(
  () =>
    class PermissionDeniedError extends Error {
      constructor(public readonly permission: string) {
        super(`Permission denied: ${permission}`);
        this.name = "PermissionDeniedError";
      }
    },
);
vi.mock("@/server/audit", () => ({ writeAudit }));
vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/server/permissions", () => ({ PermissionDeniedError }));
vi.mock("@/server/services/tasks", () => ({ createTask }));

import {
  assignInquiry,
  getInquiry,
  handOffToTask,
  listInquiries,
  setInquiryStatus,
  summarize,
} from "./queue";
import { MemoryInquiryStore } from "./store";

const viewer = { id: "u-view", permissions: [PERMISSIONS.TASKS_VIEW] };
const worker = { id: "u-work", permissions: [PERMISSIONS.TASKS_VIEW, PERMISSIONS.TASKS_UPDATE] };

async function seeded() {
  const store = new MemoryInquiryStore();
  const { record } = await store.createIfAbsent({
    reference: "LS-Q0000001",
    intent: "acquisition",
    sourceBrand: "corporate",
    sourcePath: "/partners/acquisitions/",
    contact: {
      name: "Counterparty",
      email: "cp@example.com",
      organization: "Target Co",
      region: "AB",
    },
    fields: { businessType: "Distributor" },
    consentService: true,
    consentMarketing: false,
    campaign: null,
    idempotencyKey: "acq-key-0000000000001",
    clientHash: "h",
    ownerChannel: "abdul@lifesupply.com",
    assignedToId: null,
    status: "received",
    acknowledgment: { state: "pending", attempts: 0, sentAt: null, lastError: null },
    notification: { state: "pending", attempts: 0, sentAt: null, lastError: null },
    taskId: null,
    receivedAt: new Date(),
    retentionUntil: new Date(),
    closedAt: null,
  });
  return { store, record };
}

beforeEach(() => {
  writeAudit.mockReset();
  createTask.mockClear();
});

describe("queue access", () => {
  it("refuses an unauthenticated or under-permitted reader at the service", async () => {
    const { store } = await seeded();
    await expect(listInquiries(null, {}, store)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      listInquiries({ id: "x", permissions: ["customers.view"] }, {}, store),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(getInquiry(null, "any", store)).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("lets a viewer read but not change, and a worker change", async () => {
    const { store, record } = await seeded();
    expect(await listInquiries(viewer, {}, store)).toHaveLength(1);
    await expect(setInquiryStatus(viewer, record.id, "closed", store)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    const closed = await setInquiryStatus(worker, record.id, "closed", store);
    expect(closed!.status).toBe("closed");
    expect(closed!.closedAt).toBeInstanceOf(Date);
  });

  it("refuses an invalid status move and audits valid ones without contact data", async () => {
    const { store, record } = await seeded();
    await setInquiryStatus(worker, record.id, "in_progress", store);
    await expect(setInquiryStatus(worker, record.id, "spam", store)).rejects.toThrow(/Cannot move/);
    expect(JSON.stringify(writeAudit.mock.calls)).not.toMatch(
      /cp@example\.com|Counterparty|Target Co/,
    );
  });

  it("assigns and hands off to a Task that carries the reference and intent only, once", async () => {
    const { store, record } = await seeded();
    const assigned = await assignInquiry(worker, record.id, "u-other", store);
    expect(assigned).toMatchObject({ status: "assigned", assignedToId: "u-other" });
    const handed = await handOffToTask(worker, record.id, store);
    expect(handed!.taskId).toBe("task-1");
    const input = createTask.mock.calls[0]![0] as unknown as {
      title: string;
      description: string;
      assignedToId: string;
      sourceType: string;
    };
    expect(input.title).toContain("LS-Q0000001");
    expect(`${input.title} ${input.description}`).not.toMatch(
      /cp@example\.com|Counterparty|Target Co/,
    );
    expect(input.assignedToId).toBe("u-other");
    expect(input.sourceType).toBe("public_inquiry");
    await handOffToTask(worker, record.id, store);
    expect(createTask).toHaveBeenCalledTimes(1);
  });

  it("previews organization and region in lists, never name, email, or phone", () => {
    const summary = summarize({
      contact: { name: "N", email: "e@example.com", phone: "1", organization: "Org", region: "BC" },
    } as never);
    expect(summary.contactPreview).toBe("Org · BC");
  });
});
