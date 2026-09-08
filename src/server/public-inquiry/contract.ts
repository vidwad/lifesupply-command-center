/**
 * Public inquiry contract (guide §5, IMPLEMENTATION_BACKLOG.md §15, WB-701).
 *
 * Pure: no database, no network. Everything a browser may send is listed
 * here, and everything the server decides (owner, retention, reference) is
 * derived here from the intent alone, never from the request. Unknown keys
 * are rejected, so a body cannot smuggle a recipient, a redirect, or a
 * record id. Existing-order support is routed to the originating store and
 * is never accepted for persistence.
 */
import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import type { BrandKey } from "@/lib/public-site/brands";

export const INQUIRY_INTENTS = [
  "clinic_development",
  "equipment_quote",
  "ongoing_procurement",
  "metabolic_program",
  "pharmacy",
  "supplier",
  "investor",
  "shareholder",
  "acquisition",
  "general",
  "existing_order_support",
] as const;

export type InquiryIntent = (typeof INQUIRY_INTENTS)[number];

/** Intents that are persisted; the eleventh links to the store instead. */
export const PERSISTED_INTENTS = INQUIRY_INTENTS.filter(
  (intent) => intent !== "existing_order_support",
) as Exclude<InquiryIntent, "existing_order_support">[];

/**
 * Server-controlled owner mapping. Values are approved directory channels
 * (SOURCE_REGISTER.md S-26, S-27); WEB-07 may reassign them, and the
 * queue's assignment can override per record, but a request can never
 * choose its recipient.
 */
export const OWNER_CHANNELS: Record<Exclude<InquiryIntent, "existing_order_support">, string> = {
  clinic_development: "info@lifesupply.com",
  equipment_quote: "info@lifesupply.com",
  ongoing_procurement: "ben@lifesupply.com",
  metabolic_program: "info@lifesupply.com",
  pharmacy: "info@lifesupply.com",
  supplier: "info@lifesupply.com",
  investor: "invest@lifesupply.com",
  shareholder: "invest@lifesupply.com",
  acquisition: "abdul@lifesupply.com",
  general: "info@lifesupply.com",
};

/** Intent-specific fields a browser may send, allowlisted by name. */
export const INTENT_FIELDS: Record<
  Exclude<InquiryIntent, "existing_order_support">,
  readonly string[]
> = {
  clinic_development: [
    "clinicType",
    "location",
    "approximateSize",
    "currentStage",
    "targetOpening",
    "interest",
  ],
  equipment_quote: ["clinicType", "location", "rooms", "targetOpening", "interest"],
  ongoing_procurement: ["clinicType", "location", "categories", "currentSupplier"],
  metabolic_program: ["organizationType", "location", "programStage", "pathways"],
  pharmacy: ["location", "programStage", "pathways"],
  supplier: ["categories", "regions", "distributionRights", "productDataReady"],
  investor: ["interest"],
  shareholder: ["purpose"],
  acquisition: ["businessType", "location", "counterpartyType"],
  general: ["topic"],
};

const shortText = z.string().trim().min(1).max(200);
const fieldText = z.string().trim().max(500);

const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().max(40).optional(),
    organization: z.string().trim().max(160).optional(),
    region: z.string().trim().max(80).optional(),
  })
  .strict();

const consentSchema = z
  .object({
    /** Required to respond at all; the form cannot be submitted without it. */
    serviceResponse: z.literal(true),
    /** Separate, optional, defaults to false; never inferred from serviceResponse. */
    marketing: z.boolean().optional(),
  })
  .strict();

const campaignSchema = z
  .object({
    utmSource: shortText.max(100).optional(),
    utmMedium: shortText.max(100).optional(),
    utmCampaign: shortText.max(100).optional(),
  })
  .strict();

const BRAND_KEYS = ["corporate", "lifesupply", "wellmart", "clinics", "balkowitsch"] as const;

export const inquiryRequestSchema = z
  .object({
    intent: z.enum(INQUIRY_INTENTS),
    sourceBrand: z.enum(BRAND_KEYS),
    /** Page path only: no host, no query string, no fragment (no PII in URLs). */
    sourcePath: z
      .string()
      .max(200)
      .regex(/^\/[A-Za-z0-9\-_/]*$/, "A site path without query string"),
    contact: contactSchema,
    fields: z.record(z.string(), fieldText).optional(),
    consent: consentSchema,
    campaign: campaignSchema.optional(),
    /** Client-generated, checked server-side so a refresh or retry cannot duplicate. */
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
    /** Honeypot: must be absent or empty. */
    website: z.literal("").optional(),
  })
  .strict();

export type InquiryRequest = z.infer<typeof inquiryRequestSchema>;

/** Keys that must never be honoured even if a future field is added carelessly. */
export const FORBIDDEN_KEYS = [
  "to",
  "recipient",
  "recipients",
  "cc",
  "bcc",
  "redirect",
  "redirectUrl",
  "returnUrl",
  "id",
  "assignedTo",
  "owner",
] as const;

export class InquiryValidationError extends Error {
  constructor(public readonly issues: { path: string; message: string }[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ") || "Invalid inquiry");
    this.name = "InquiryValidationError";
  }
}

/**
 * Validate a raw body. Rejects forbidden keys anywhere at the top level,
 * unknown keys (strict), fields not allowlisted for the intent, and the
 * existing-order intent (which is never persisted).
 */
export function validateInquiry(
  body: unknown,
): InquiryRequest & { intent: Exclude<InquiryIntent, "existing_order_support"> } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InquiryValidationError([{ path: "(body)", message: "Expected an object" }]);
  }
  for (const key of FORBIDDEN_KEYS) {
    if (key in (body as object)) {
      throw new InquiryValidationError([{ path: key, message: "Not accepted" }]);
    }
  }
  const parsed = inquiryRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new InquiryValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(body)",
        message: issue.message,
      })),
    );
  }
  const request = parsed.data;
  if (request.intent === "existing_order_support") {
    throw new InquiryValidationError([
      {
        path: "intent",
        message: "Existing-order support is handled by the store that took the order",
      },
    ]);
  }
  const allowed = INTENT_FIELDS[request.intent];
  for (const key of Object.keys(request.fields ?? {})) {
    if (!allowed.includes(key)) {
      throw new InquiryValidationError([
        { path: `fields.${key}`, message: "Not a field for this intent" },
      ]);
    }
  }
  return request as InquiryRequest & { intent: Exclude<InquiryIntent, "existing_order_support"> };
}

export function resolveOwnerChannel(
  intent: Exclude<InquiryIntent, "existing_order_support">,
): string {
  return OWNER_CHANNELS[intent];
}

/** Retention: WEB-07 has not set a period; the interim default is conservative and configurable. */
export const DEFAULT_RETENTION_DAYS = 180;

export function retentionUntil(
  receivedAt: Date,
  env: Record<string, string | undefined> = process.env,
) {
  const days = Number(env.PUBLIC_INQUIRY_RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;
  return new Date(receivedAt.getTime() + days * 24 * 60 * 60 * 1000);
}

/** A short public reference a visitor can quote; not the record id, not guessable from it. */
export function newReference() {
  return `LS-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** A keyed hash of the client address for rate limiting and dedupe; the raw address is never stored. */
export function clientHash(address: string, env: Record<string, string | undefined> = process.env) {
  const salt = env.PUBLIC_INQUIRY_HASH_SALT ?? "lifesupply-public-inquiry";
  return createHash("sha256").update(`${salt}:${address}`).digest("hex").slice(0, 32);
}

export type InquiryStatus = "received" | "assigned" | "in_progress" | "closed" | "spam";
export type DeliveryState = "pending" | "sent" | "failed" | "skipped";

export interface InquiryRecord {
  id: string;
  reference: string;
  intent: Exclude<InquiryIntent, "existing_order_support">;
  sourceBrand: BrandKey;
  sourcePath: string;
  contact: InquiryRequest["contact"];
  fields: Record<string, string>;
  consentService: true;
  consentMarketing: boolean;
  campaign: { utmSource?: string; utmMedium?: string; utmCampaign?: string } | null;
  idempotencyKey: string;
  clientHash: string;
  ownerChannel: string;
  assignedToId: string | null;
  status: InquiryStatus;
  acknowledgment: {
    state: DeliveryState;
    attempts: number;
    sentAt: Date | null;
    lastError: string | null;
  };
  notification: {
    state: DeliveryState;
    attempts: number;
    sentAt: Date | null;
    lastError: string | null;
  };
  taskId: string | null;
  receivedAt: Date;
  retentionUntil: Date;
  closedAt: Date | null;
  updatedAt: Date;
}

/** What may be written to a log or an audit row about an inquiry: never contact details or free text. */
export function redactForLog(
  record: Pick<InquiryRecord, "id" | "reference" | "intent" | "sourceBrand" | "status">,
) {
  return {
    id: record.id,
    reference: record.reference,
    intent: record.intent,
    sourceBrand: record.sourceBrand,
    status: record.status,
  };
}
