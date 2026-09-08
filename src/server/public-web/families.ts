/**
 * Content families the public site reads through the publication model, and
 * the validation each family's record must pass before it can leave draft.
 *
 * Stage 6 runs on the existing `public_content_items` columns. The fields the
 * additive migration will later promote to columns (revision, reviewer,
 * audience, related brands, availability) live in the typed `payload` JSON
 * until then, validated here on every save. Resources map to the existing
 * `corporate_page` content type with `payload.kind = "resource"` because the
 * enum cannot gain a value without a migration; the mapping is a single
 * table below so the promotion is a one-line change.
 */
import { PublicContentStatus, PublicContentType } from "@prisma/client";
import { z } from "zod";

export type PublicFamily = "news" | "resource";

export const FAMILIES: Record<
  PublicFamily,
  { contentType: PublicContentType; kind: PublicFamily; label: string; publicPath: string }
> = {
  news: {
    contentType: PublicContentType.news_item,
    kind: "news",
    label: "Company news",
    publicPath: "/news/",
  },
  resource: {
    contentType: PublicContentType.corporate_page,
    kind: "resource",
    label: "Resources",
    publicPath: "/resources/",
  },
};

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Not a calendar date");

const paragraphs = z.array(z.string().trim().min(1).max(4000)).min(1).max(60);

const slug = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase words separated by single hyphens");

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "Must be an https URL");

/** Shared editorial fields: revision counter and the reviewer who last looked. */
const editorial = {
  revision: z.number().int().min(1),
  reviewerId: z.string().nullable(),
};

export const newsPayloadSchema = z
  .object({
    kind: z.literal("news"),
    /** Original publication date, preserved as entered. */
    date: isoDate,
    body: paragraphs,
    source: z.object({ label: z.string().trim().min(1).max(120), href: httpsUrl }).nullable(),
    related: z
      .array(z.object({ label: z.string().trim().min(1).max(120), route: z.string().min(1) }))
      .max(6),
    ...editorial,
  })
  .strict();

export const resourcePayloadSchema = z
  .object({
    kind: z.literal("resource"),
    body: paragraphs,
    author: z.string().trim().min(2).max(120),
    reviewer: z.string().trim().min(2).max(120),
    published: isoDate,
    reviewed: isoDate,
    /** Action-registry key rendered as the resource's next step. */
    action: z.string().trim().min(1).max(60),
    ...editorial,
  })
  .strict();

export type NewsPayload = z.infer<typeof newsPayloadSchema>;
export type ResourcePayload = z.infer<typeof resourcePayloadSchema>;
export type FamilyPayload = NewsPayload | ResourcePayload;

/** What an editor submits. Revision and reviewer are set by the workflow, never by the form. */
export const draftInputSchema = z
  .object({
    slug,
    title: z.string().trim().min(3).max(160),
    summary: z.string().trim().min(10).max(600),
    sourceReference: z.string().trim().max(400).nullable(),
    effectiveAt: z.string().datetime({ offset: true }).nullable(),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
    payload: z.record(z.string(), z.unknown()),
  })
  .strict()
  .refine(
    (value) =>
      !value.effectiveAt ||
      !value.expiresAt ||
      new Date(value.expiresAt).getTime() > new Date(value.effectiveAt).getTime(),
    { message: "Expiry must be after the effective date", path: ["expiresAt"] },
  );

export type DraftInput = z.infer<typeof draftInputSchema>;

export function payloadSchemaFor(family: PublicFamily) {
  return family === "news" ? newsPayloadSchema : resourcePayloadSchema;
}

/**
 * Validate a submitted draft for its family. Returns the normalised record
 * fields and the typed payload with the workflow-owned fields applied.
 */
export function validateDraft(
  family: PublicFamily,
  input: unknown,
  editorial: { revision: number; reviewerId: string | null },
) {
  const base = draftInputSchema.parse(input);
  const payload = payloadSchemaFor(family).parse({
    ...base.payload,
    kind: family,
    revision: editorial.revision,
    reviewerId: editorial.reviewerId,
  });
  return {
    slug: base.slug,
    title: base.title,
    summary: base.summary,
    sourceReference: base.sourceReference,
    effectiveAt: base.effectiveAt ? new Date(base.effectiveAt) : null,
    expiresAt: base.expiresAt ? new Date(base.expiresAt) : null,
    payload,
  };
}

/** Family of a stored row, or null when the row belongs to no Stage 6 family. */
export function familyOf(row: { contentType: PublicContentType; payload: unknown }) {
  const kind =
    row.payload && typeof row.payload === "object" && "kind" in row.payload
      ? (row.payload as { kind?: unknown }).kind
      : null;
  for (const family of Object.values(FAMILIES)) {
    if (row.contentType === family.contentType && kind === family.kind) return family.kind;
  }
  return null;
}

/**
 * The state machine (guide §5: draft → under_review → approved → published →
 * archived). `reject` returns a record to draft for rework; `unpublish`
 * withdraws a published record to approved so it can be republished or
 * archived; `archive` is terminal.
 */
export const TRANSITIONS = {
  submit: { from: [PublicContentStatus.draft], to: PublicContentStatus.under_review },
  reject: {
    from: [PublicContentStatus.under_review, PublicContentStatus.approved],
    to: PublicContentStatus.draft,
  },
  approve: { from: [PublicContentStatus.under_review], to: PublicContentStatus.approved },
  publish: { from: [PublicContentStatus.approved], to: PublicContentStatus.published },
  unpublish: { from: [PublicContentStatus.published], to: PublicContentStatus.approved },
  archive: {
    from: [
      PublicContentStatus.draft,
      PublicContentStatus.under_review,
      PublicContentStatus.approved,
      PublicContentStatus.published,
    ],
    to: PublicContentStatus.archived,
  },
} as const;

export type TransitionName = keyof typeof TRANSITIONS;

/** Editing is allowed only before approval; an edit to a record under review returns it to draft. */
export const EDITABLE_STATUSES: readonly PublicContentStatus[] = [
  PublicContentStatus.draft,
  PublicContentStatus.under_review,
];

/**
 * A published row is visible only inside its effective window. Evaluated in
 * code as well as in the query so a row that crosses its expiry between the
 * query and the response is still excluded.
 */
export function isTimeValid(
  row: { status: PublicContentStatus; effectiveAt: Date | null; expiresAt: Date | null },
  now: Date = new Date(),
) {
  if (row.status !== PublicContentStatus.published) return false;
  if (row.effectiveAt && row.effectiveAt.getTime() > now.getTime()) return false;
  if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}

/** Document metadata the editor may set; there is no file storage yet (DEC-03). */
export const DOCUMENT_TYPES = ["annual_report", "presentation", "policy", "other"] as const;

export const documentInputSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    documentType: z.enum(DOCUMENT_TYPES),
    periodLabel: z.string().trim().min(1).max(120).nullable(),
    /** Where the approved public file is served from; only allowlisted hosts are accepted. */
    publicUrl: httpsUrl.nullable(),
    disclosureText: z.string().trim().max(2000).nullable(),
    sourceReference: z.string().trim().max(400).nullable(),
  })
  .strict();

export type DocumentInput = z.infer<typeof documentInputSchema>;

/** Hosts an approved public file may be served from. Empty means no file can be attached yet. */
export function allowedDocumentHosts(
  env: Record<string, string | undefined> = process.env,
): string[] {
  return (env.PUBLIC_DOCUMENT_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedDocumentUrl(url: string | null, hosts = allowedDocumentHosts()) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && hosts.includes(parsed.host.toLowerCase());
  } catch {
    return false;
  }
}
