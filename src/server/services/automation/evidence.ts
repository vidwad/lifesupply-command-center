/**
 * Durable automation evidence storage (Phase 7 — docs/19 §7 #3, docs/10 §12).
 *
 * Screenshots and artifacts are stored IN Postgres (`automation_evidence.data`)
 * with a sha256 content hash, so evidence survives worker restarts and
 * deploys, rides the database backup schedule, and is reviewable from the
 * run detail page via the authenticated evidence route. Runs are low volume
 * (a handful per day, ~3 small PNGs each), so the database is the honest
 * durable store until an S3-style bucket is configured; `storageRef`
 * (`db:<sha256>`) keeps that migration path open without a schema change.
 *
 * Payloads above MAX_EVIDENCE_BYTES are truncated to metadata-only rows
 * (hash + size preserved) so a runaway capture can't bloat the table.
 */
import { createHash } from "node:crypto";

import { prisma } from "@/server/db/client";

/** 5 MB — a full-page PNG of a portal page is typically well under 1 MB. */
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export type StoreEvidenceInput = {
  runId: string;
  stepId?: string | null;
  kind: "screenshot" | "html" | "json" | "file";
  label: string;
  description?: string | null;
  bytes: Buffer;
  contentType: string;
};

export async function storeEvidence(input: StoreEvidenceInput): Promise<string> {
  const contentHash = createHash("sha256").update(input.bytes).digest("hex");
  const oversized = input.bytes.length > MAX_EVIDENCE_BYTES;

  const row = await prisma.automationEvidence.create({
    data: {
      runId: input.runId,
      stepId: input.stepId ?? null,
      kind: input.kind,
      storageRef: `db:${contentHash}`,
      label: input.label,
      description: oversized
        ? `Payload (${input.bytes.length} bytes) exceeded the ${MAX_EVIDENCE_BYTES}-byte cap; metadata retained, bytes dropped.`
        : (input.description ?? null),
      contentHash,
      bytes: input.bytes.length,
      data: oversized ? null : new Uint8Array(input.bytes),
      contentType: input.contentType,
    },
  });
  return row.id;
}

/** Store a batch of workflow screenshots under one run. */
export async function storeScreenshots(
  runId: string,
  screenshots: { label: string; bytes: Buffer }[],
): Promise<number> {
  for (const shot of screenshots) {
    await storeEvidence({
      runId,
      kind: "screenshot",
      label: shot.label,
      bytes: shot.bytes,
      contentType: "image/png",
    });
  }
  return screenshots.length;
}

export type EvidencePayload = {
  id: string;
  runId: string;
  label: string | null;
  contentType: string;
  bytes: Buffer;
};

/** Load one evidence payload for the authenticated serving route. */
export async function getEvidencePayload(id: string): Promise<EvidencePayload | null> {
  const row = await prisma.automationEvidence.findUnique({
    where: { id },
    select: { id: true, runId: true, label: true, contentType: true, data: true },
  });
  if (!row?.data) return null;
  return {
    id: row.id,
    runId: row.runId,
    label: row.label,
    contentType: row.contentType ?? "application/octet-stream",
    bytes: Buffer.from(row.data),
  };
}
