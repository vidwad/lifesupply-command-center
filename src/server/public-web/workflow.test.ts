import { PublicContentStatus, PublicContentType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PERMISSIONS } from "@/lib/permissions";

const db = vi.hoisted(() => ({
  publicContentItem: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    updateMany: vi.fn(),
  },
  publicDocument: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    updateMany: vi.fn(),
  },
}));
const writeAudit = vi.hoisted(() => vi.fn());
// The permissions module imports Auth.js; only its error class is needed here.
const PermissionDeniedError = vi.hoisted(
  () =>
    class PermissionDeniedError extends Error {
      constructor(public readonly permission: string) {
        super(`Permission denied: ${permission}`);
        this.name = "PermissionDeniedError";
      }
    },
);
vi.mock("@/server/db/client", () => ({ prisma: db }));
vi.mock("@/server/audit", () => ({ writeAudit }));
vi.mock("@/server/permissions", () => ({ PermissionDeniedError }));

import {
  ConflictError,
  ValidationError,
  WorkflowError,
  createDocumentDraft,
  createDraft,
  saveDraft,
  transitionContent,
  transitionDocument,
} from "./workflow";

const editor = { id: "u-editor", permissions: [PERMISSIONS.PUBLIC_WEB_EDIT] };
const approver = {
  id: "u-approver",
  permissions: [PERMISSIONS.PUBLIC_WEB_EDIT, PERMISSIONS.PUBLIC_WEB_APPROVE],
};
const nobody = { id: "u-nobody", permissions: ["customers.view"] };

const T0 = new Date("2026-09-08T10:00:00Z");
const T1 = new Date("2026-09-08T10:05:00Z");

const input = {
  slug: "annual-update-2026",
  title: "Annual update",
  summary: "A short summary of the update for listings.",
  sourceReference: null,
  effectiveAt: null,
  expiresAt: null,
  payload: { date: "2026-09-01", body: ["Paragraph."], source: null, related: [] },
};

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    siteKey: "lifesupply-health",
    contentType: PublicContentType.news_item,
    slug: "annual-update-2026",
    title: "Annual update",
    summary: "A short summary of the update for listings.",
    body: null,
    payload: {
      kind: "news",
      date: "2026-09-01",
      body: ["Paragraph."],
      source: null,
      related: [],
      revision: 2,
      reviewerId: null,
    },
    status: PublicContentStatus.draft,
    sourceReference: null,
    effectiveAt: null,
    expiresAt: null,
    preparedById: "u-editor",
    approvedById: null,
    approvedAt: null,
    publishedAt: null,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

beforeEach(() => {
  for (const table of Object.values(db)) for (const fn of Object.values(table)) fn.mockReset();
  writeAudit.mockReset();
});

describe("permission denial is enforced in the service, not only the screen", () => {
  it("refuses create, save, and submit without public_web.edit, touching nothing", async () => {
    await expect(createDraft(nobody, "news", input)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(saveDraft(nobody, "c1", input, T0)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(transitionContent(nobody, "c1", "submit", T0)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    expect(db.publicContentItem.create).not.toHaveBeenCalled();
    expect(db.publicContentItem.updateMany).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("refuses approve, publish, unpublish, and archive to an editor without public_web.approve", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(
      row({ status: PublicContentStatus.under_review }),
    );
    for (const transition of ["approve", "publish", "unpublish", "archive", "reject"] as const) {
      await expect(transitionContent(editor, "c1", transition, T0)).rejects.toBeInstanceOf(
        PermissionDeniedError,
      );
    }
    expect(db.publicContentItem.updateMany).not.toHaveBeenCalled();
  });

  it("refuses an approver approving their own draft", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(
      row({ status: PublicContentStatus.under_review, preparedById: approver.id }),
    );
    await expect(transitionContent(approver, "c1", "approve", T0)).rejects.toThrow(WorkflowError);
    expect(db.publicContentItem.updateMany).not.toHaveBeenCalled();
  });
});

describe("validation", () => {
  it("rejects an invalid draft with field issues and creates nothing", async () => {
    await expect(createDraft(editor, "news", { ...input, slug: "BAD" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(db.publicContentItem.create).not.toHaveBeenCalled();
  });

  it("re-validates the stored payload at publish time and refuses a row that no longer validates", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(
      row({
        status: PublicContentStatus.approved,
        payload: { kind: "news", body: [], revision: 1, reviewerId: null },
      }),
    );
    await expect(transitionContent(approver, "c1", "publish", T0)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(db.publicContentItem.updateMany).not.toHaveBeenCalled();
  });
});

describe("revision conflicts and state", () => {
  it("creates a draft at revision 1 with the preparer recorded and an audit event", async () => {
    db.publicContentItem.create.mockResolvedValue(row({ payload: { revision: 1 } }));
    await createDraft(editor, "news", input);
    const data = db.publicContentItem.create.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      status: "draft",
      preparedById: "u-editor",
      contentType: "news_item",
    });
    expect(data.payload).toMatchObject({ kind: "news", revision: 1, reviewerId: null });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "public_content.created", actorUserId: "u-editor" }),
    );
  });

  it("refuses a save whose concurrency token is stale", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(row({ updatedAt: T1 }));
    db.publicContentItem.updateMany.mockResolvedValue({ count: 0 });
    await expect(saveDraft(editor, "c1", input, T0)).rejects.toBeInstanceOf(ConflictError);
    expect(db.publicContentItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "c1", updatedAt: T0 }) }),
    );
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("advances the revision on save and returns an under-review record to draft", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(
      row({ status: PublicContentStatus.under_review }),
    );
    db.publicContentItem.updateMany.mockResolvedValue({ count: 1 });
    db.publicContentItem.findUniqueOrThrow.mockResolvedValue(
      row({ updatedAt: T1, payload: { revision: 3 } }),
    );
    await saveDraft(editor, "c1", input, T0);
    const data = db.publicContentItem.updateMany.mock.calls[0]![0].data;
    expect(data.status).toBe("draft");
    expect(data.approvedById).toBeNull();
    expect(data.payload.revision).toBe(3);
  });

  it("refuses to edit an approved or published record", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(
      row({ status: PublicContentStatus.published }),
    );
    await expect(saveDraft(editor, "c1", input, T0)).rejects.toThrow(/cannot be edited/);
  });

  it("refuses a transition from the wrong state", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(row({ status: PublicContentStatus.draft }));
    await expect(transitionContent(approver, "c1", "publish", T0)).rejects.toThrow(
      /Cannot publish/,
    );
  });

  it("publishes an approved record, checking status and token in one update, and audits it", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(
      row({ status: PublicContentStatus.approved, approvedById: "u-approver" }),
    );
    db.publicContentItem.updateMany.mockResolvedValue({ count: 1 });
    db.publicContentItem.findUniqueOrThrow.mockResolvedValue(
      row({ status: PublicContentStatus.published, publishedAt: T1, updatedAt: T1 }),
    );
    await transitionContent(approver, "c1", "publish", T0);
    const call = db.publicContentItem.updateMany.mock.calls[0]![0];
    expect(call.where).toEqual({ id: "c1", updatedAt: T0, status: "approved" });
    expect(call.data.status).toBe("published");
    expect(call.data.publishedAt).toBeInstanceOf(Date);
    expect(call.data.effectiveAt).toBeInstanceOf(Date);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "public_content.published" }),
    );
  });

  it("withdraws a published record to approved with the reason audited, and a stale token is refused", async () => {
    db.publicContentItem.findUnique.mockResolvedValue(
      row({ status: PublicContentStatus.published, publishedAt: T0 }),
    );
    db.publicContentItem.updateMany.mockResolvedValueOnce({ count: 1 });
    db.publicContentItem.findUniqueOrThrow.mockResolvedValue(
      row({ status: PublicContentStatus.approved, updatedAt: T1 }),
    );
    await transitionContent(approver, "c1", "unpublish", T0, "Figure corrected");
    expect(db.publicContentItem.updateMany.mock.calls[0]![0].data).toMatchObject({
      status: "approved",
      publishedAt: null,
    });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "public_content.unpublished",
        afterData: expect.objectContaining({ reason: "Figure corrected" }),
      }),
    );
    db.publicContentItem.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(transitionContent(approver, "c1", "archive", T0)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe("documents", () => {
  const docInput = {
    title: "Annual report narrative 2025",
    documentType: "annual_report",
    periodLabel: "Year ended December 31, 2025",
    publicUrl: null,
    disclosureText: null,
    sourceReference: null,
  };

  it("creates a metadata record as unattached when no file host is approved", async () => {
    db.publicDocument.create.mockResolvedValue({
      id: "d1",
      title: docInput.title,
      status: "draft",
      updatedAt: T0,
      publishedAt: null,
    });
    await createDocumentDraft(editor, docInput);
    expect(db.publicDocument.create.mock.calls[0]![0].data).toMatchObject({
      fileKey: "unattached",
      status: "draft",
    });
  });

  it("refuses a file on a host that is not on the allowlist", async () => {
    await expect(
      createDocumentDraft(editor, {
        ...docInput,
        publicUrl: "https://anywhere.example.com/report.pdf",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(db.publicDocument.create).not.toHaveBeenCalled();
  });

  it("refuses approval by the preparer and publication from draft", async () => {
    db.publicDocument.findUnique.mockResolvedValue({
      id: "d1",
      status: PublicContentStatus.under_review,
      preparedById: approver.id,
      publicUrl: null,
      updatedAt: T0,
      publishedAt: null,
      fileKey: "unattached",
    });
    await expect(transitionDocument(approver, "d1", "approve", T0)).rejects.toThrow(WorkflowError);
    db.publicDocument.findUnique.mockResolvedValue({
      id: "d1",
      status: PublicContentStatus.draft,
      preparedById: "x",
      publicUrl: null,
      updatedAt: T0,
      publishedAt: null,
      fileKey: "unattached",
    });
    await expect(transitionDocument(approver, "d1", "publish", T0)).rejects.toThrow(
      /Cannot publish/,
    );
  });
});
