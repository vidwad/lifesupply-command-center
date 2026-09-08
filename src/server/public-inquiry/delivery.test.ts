import { beforeEach, describe, expect, it, vi } from "vitest";

const writeAudit = vi.hoisted(() => vi.fn());
vi.mock("@/server/audit", () => ({ writeAudit }));
vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/server/services/feature-flags", () => ({
  isFeatureOn: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/server/integrations/email/client", () => ({ getEmailClient: () => null }));

import type { InquiryRecord } from "./contract";
import { MAX_ATTEMPTS, attemptDeliveries } from "./delivery";
import { MemoryInquiryStore } from "./store";

function seed(store: MemoryInquiryStore) {
  return store.createIfAbsent({
    reference: "LS-TEST0001",
    intent: "investor",
    sourceBrand: "corporate",
    sourcePath: "/investor-relations/",
    contact: { name: "Investor Person", email: "investor@example.com" },
    fields: {},
    consentService: true,
    consentMarketing: false,
    campaign: null,
    idempotencyKey: "investor-key-000000001",
    clientHash: "abc",
    ownerChannel: "invest@lifesupply.com",
    assignedToId: null,
    status: "received",
    acknowledgment: { state: "pending", attempts: 0, sentAt: null, lastError: null },
    notification: { state: "pending", attempts: 0, sentAt: null, lastError: null },
    taskId: null,
    receivedAt: new Date("2026-09-08T00:00:00Z"),
    retentionUntil: new Date("2027-03-07T00:00:00Z"),
    closedAt: null,
  });
}

const sent: { to: string[]; subject: string; text: string }[] = [];
const email = {
  fromAddress: "LifeSupply <noreply@example.com>",
  send: vi.fn(async (envelope: { to: string[]; subject: string; text: string }) => {
    sent.push(envelope);
    return { providerId: "p1", recipientCount: 1 };
  }),
};

beforeEach(() => {
  writeAudit.mockReset();
  email.send.mockClear();
  sent.length = 0;
});

describe("deliveries", () => {
  it("records both deliveries as skipped while the send flag is off, sending nothing", async () => {
    const store = new MemoryInquiryStore();
    const { record } = await seed(store);
    const result = (await attemptDeliveries(record.id, {
      store,
      email,
      sendOn: async () => false,
    }))!;
    expect(result.acknowledgment.state).toBe("skipped");
    expect(result.notification.state).toBe("skipped");
    expect(email.send).not.toHaveBeenCalled();
  });

  it("records skipped when no email client is configured even with the flag on", async () => {
    const store = new MemoryInquiryStore();
    const { record } = await seed(store);
    const result = (await attemptDeliveries(record.id, {
      store,
      email: null,
      sendOn: async () => true,
    }))!;
    expect(result.acknowledgment.state).toBe("skipped");
    expect(email.send).not.toHaveBeenCalled();
  });

  it("routes both messages to the sink when one is configured, never to the visitor or the owner", async () => {
    const store = new MemoryInquiryStore();
    const { record } = await seed(store);
    const result = (await attemptDeliveries(record.id, {
      store,
      email,
      sendOn: async () => true,
      sink: "sink@example.org",
    }))!;
    expect(sent.map((m) => m.to)).toEqual([["sink@example.org"], ["sink@example.org"]]);
    expect(result.acknowledgment.state).toBe("sent");
    expect(result.notification.state).toBe("sent");
    // The owner notification carries the reference and intent, not the visitor's details.
    expect(sent[1]!.text).toContain("LS-TEST0001");
    expect(sent[1]!.text).not.toMatch(/investor@example\.com|Investor Person/);
    expect(writeAudit).toHaveBeenCalledTimes(2);
  });

  it("sends to the visitor and the owner without a sink, and never re-sends a delivery that is already sent", async () => {
    const store = new MemoryInquiryStore();
    const { record } = await seed(store);
    await attemptDeliveries(record.id, { store, email, sendOn: async () => true, sink: null });
    expect(sent.map((m) => m.to)).toEqual([["investor@example.com"], ["invest@lifesupply.com"]]);
    await attemptDeliveries(record.id, { store, email, sendOn: async () => true, sink: null });
    expect(email.send).toHaveBeenCalledTimes(2);
  });

  it("records a failure with a generic error, counts attempts, and stops at the maximum", async () => {
    const store = new MemoryInquiryStore();
    const { record } = await seed(store);
    const failing = {
      fromAddress: "x",
      send: vi.fn(async () => {
        throw new Error("SMTP 550 mailbox investor@example.com unknown");
      }),
    };
    let result: InquiryRecord | null = null;
    for (let index = 0; index < MAX_ATTEMPTS + 2; index += 1) {
      result = await attemptDeliveries(record.id, {
        store,
        email: failing,
        sendOn: async () => true,
        sink: null,
      });
    }
    expect(result!.acknowledgment).toMatchObject({
      state: "failed",
      attempts: MAX_ATTEMPTS,
      lastError: "Delivery failed",
    });
    expect(failing.send).toHaveBeenCalledTimes(MAX_ATTEMPTS * 2);
    expect(JSON.stringify(writeAudit.mock.calls)).not.toContain("investor@example.com");
  });
});
