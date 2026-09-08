/**
 * Persistence adapter for public inquiries (WB-702).
 *
 * The `public_inquiries` table does not exist yet: its migration is a
 * prepared artifact (docs/website-development/migrations/stage-07-public-inquiry)
 * because the Render container applies migrations on deploy and WEB-10 is
 * unrecorded. The service therefore talks to an `InquiryStore` interface:
 *
 * - `MemoryInquiryStore` backs tests and local development.
 * - `SqlInquiryStore` targets the prepared table through parameterised raw
 *   SQL, so it compiles today without a Prisma model, and reports
 *   `isReady() === false` until the table exists. The intake fails closed
 *   on that answer; nothing is ever reported as received without a row.
 *
 * Idempotency is the store's responsibility: `createIfAbsent` returns the
 * existing record for a repeated `idempotencyKey` instead of a second row.
 */
import { randomUUID } from "node:crypto";

import { prisma } from "@/server/db/client";
import type { InquiryRecord, InquiryStatus } from "@/server/public-inquiry/contract";

export type NewInquiry = Omit<InquiryRecord, "id" | "updatedAt">;

export interface InquiryListFilters {
  status?: InquiryStatus;
  intent?: InquiryRecord["intent"];
  limit?: number;
}

export type InquiryPatch = Partial<
  Pick<
    InquiryRecord,
    "status" | "assignedToId" | "acknowledgment" | "notification" | "taskId" | "closedAt"
  >
>;

export interface InquiryStore {
  /** False until the table exists; the intake refuses submissions while false. */
  isReady(): Promise<boolean>;
  createIfAbsent(record: NewInquiry): Promise<{ created: boolean; record: InquiryRecord }>;
  get(id: string): Promise<InquiryRecord | null>;
  list(filters?: InquiryListFilters): Promise<InquiryRecord[]>;
  update(id: string, patch: InquiryPatch): Promise<InquiryRecord | null>;
}

export class MemoryInquiryStore implements InquiryStore {
  private readonly rows = new Map<string, InquiryRecord>();
  constructor(private readonly ready = true) {}

  async isReady() {
    return this.ready;
  }

  async createIfAbsent(record: NewInquiry) {
    for (const existing of this.rows.values()) {
      if (existing.idempotencyKey === record.idempotencyKey)
        return { created: false, record: existing };
    }
    const stored: InquiryRecord = { ...record, id: randomUUID(), updatedAt: new Date() };
    this.rows.set(stored.id, stored);
    return { created: true, record: stored };
  }

  async get(id: string) {
    return this.rows.get(id) ?? null;
  }

  async list(filters: InquiryListFilters = {}) {
    return [...this.rows.values()]
      .filter(
        (row) =>
          (!filters.status || row.status === filters.status) &&
          (!filters.intent || row.intent === filters.intent),
      )
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
      .slice(0, filters.limit ?? 200);
  }

  async update(id: string, patch: InquiryPatch) {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = { ...row, ...patch, updatedAt: new Date() };
    this.rows.set(id, updated);
    return updated;
  }

  /** Test helper. */
  size() {
    return this.rows.size;
  }
}

/** Row shape of the prepared table (see migration.sql). */
type SqlRow = {
  id: string;
  reference: string;
  intent: InquiryRecord["intent"];
  source_brand: InquiryRecord["sourceBrand"];
  source_path: string;
  contact: InquiryRecord["contact"];
  fields: Record<string, string>;
  consent_marketing: boolean;
  campaign: InquiryRecord["campaign"];
  idempotency_key: string;
  client_hash: string;
  owner_channel: string;
  assigned_to_id: string | null;
  status: InquiryStatus;
  acknowledgment: InquiryRecord["acknowledgment"];
  notification: InquiryRecord["notification"];
  task_id: string | null;
  received_at: Date;
  retention_until: Date;
  closed_at: Date | null;
  updated_at: Date;
};

function fromRow(row: SqlRow): InquiryRecord {
  return {
    id: row.id,
    reference: row.reference,
    intent: row.intent,
    sourceBrand: row.source_brand,
    sourcePath: row.source_path,
    contact: row.contact,
    fields: row.fields ?? {},
    consentService: true,
    consentMarketing: row.consent_marketing,
    campaign: row.campaign,
    idempotencyKey: row.idempotency_key,
    clientHash: row.client_hash,
    ownerChannel: row.owner_channel,
    assignedToId: row.assigned_to_id,
    status: row.status,
    acknowledgment: {
      ...row.acknowledgment,
      sentAt: row.acknowledgment.sentAt ? new Date(row.acknowledgment.sentAt) : null,
    },
    notification: {
      ...row.notification,
      sentAt: row.notification.sentAt ? new Date(row.notification.sentAt) : null,
    },
    taskId: row.task_id,
    receivedAt: new Date(row.received_at),
    retentionUntil: new Date(row.retention_until),
    closedAt: row.closed_at ? new Date(row.closed_at) : null,
    updatedAt: new Date(row.updated_at),
  };
}

export class SqlInquiryStore implements InquiryStore {
  private readyCache: { at: number; value: boolean } | null = null;

  async isReady() {
    if (this.readyCache && Date.now() - this.readyCache.at < 60_000) return this.readyCache.value;
    try {
      const rows = await prisma.$queryRaw<{ present: boolean }[]>`
        SELECT to_regclass('public.public_inquiries') IS NOT NULL AS present
      `;
      const value = rows[0]?.present === true;
      this.readyCache = { at: Date.now(), value };
      return value;
    } catch {
      return false;
    }
  }

  async createIfAbsent(record: NewInquiry) {
    const id = randomUUID();
    const json = (value: unknown) => JSON.stringify(value);
    // ON CONFLICT on the unique idempotency key makes a retry a no-op; the
    // follow-up SELECT returns whichever row holds the key.
    const inserted = await prisma.$executeRaw`
      INSERT INTO public_inquiries (
        id, reference, intent, source_brand, source_path, contact, fields, consent_marketing, campaign,
        idempotency_key, client_hash, owner_channel, assigned_to_id, status, acknowledgment, notification,
        task_id, received_at, retention_until, closed_at, updated_at
      ) VALUES (
        ${id}, ${record.reference}, ${record.intent}, ${record.sourceBrand}, ${record.sourcePath},
        ${json(record.contact)}::jsonb, ${json(record.fields)}::jsonb, ${record.consentMarketing},
        ${record.campaign ? json(record.campaign) : null}::jsonb, ${record.idempotencyKey}, ${record.clientHash},
        ${record.ownerChannel}, ${record.assignedToId}, ${record.status}, ${json(record.acknowledgment)}::jsonb,
        ${json(record.notification)}::jsonb, ${record.taskId}, ${record.receivedAt}, ${record.retentionUntil},
        ${record.closedAt}, NOW()
      )
      ON CONFLICT (idempotency_key) DO NOTHING
    `;
    const rows = await prisma.$queryRaw<SqlRow[]>`
      SELECT * FROM public_inquiries WHERE idempotency_key = ${record.idempotencyKey} LIMIT 1
    `;
    const row = rows[0];
    if (!row) throw new Error("Inquiry was not persisted");
    return { created: inserted === 1, record: fromRow(row) };
  }

  async get(id: string) {
    const rows = await prisma.$queryRaw<
      SqlRow[]
    >`SELECT * FROM public_inquiries WHERE id = ${id} LIMIT 1`;
    return rows[0] ? fromRow(rows[0]) : null;
  }

  async list(filters: InquiryListFilters = {}) {
    const limit = Math.min(filters.limit ?? 200, 500);
    const rows = await prisma.$queryRaw<SqlRow[]>`
      SELECT * FROM public_inquiries
      WHERE (${filters.status ?? null}::text IS NULL OR status = ${filters.status ?? null})
        AND (${filters.intent ?? null}::text IS NULL OR intent = ${filters.intent ?? null})
      ORDER BY received_at DESC
      LIMIT ${limit}
    `;
    return rows.map(fromRow);
  }

  async update(id: string, patch: InquiryPatch) {
    const current = await this.get(id);
    if (!current) return null;
    const next = { ...current, ...patch };
    await prisma.$executeRaw`
      UPDATE public_inquiries SET
        status = ${next.status},
        assigned_to_id = ${next.assignedToId},
        acknowledgment = ${JSON.stringify(next.acknowledgment)}::jsonb,
        notification = ${JSON.stringify(next.notification)}::jsonb,
        task_id = ${next.taskId},
        closed_at = ${next.closedAt},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return this.get(id);
  }
}

let defaultStore: InquiryStore | null = null;

/** The process store: SQL when a database is configured, memory otherwise (never in production). */
export function getInquiryStore(): InquiryStore {
  if (defaultStore) return defaultStore;
  defaultStore = process.env.DATABASE_URL ? new SqlInquiryStore() : new MemoryInquiryStore(false);
  return defaultStore;
}

/** Test seam. */
export function setInquiryStore(store: InquiryStore | null) {
  defaultStore = store;
}
