import { z } from "zod";

export const PUBLIC_SITE_KEY = "lifesupply-health" as const;

export const publicContentDtoSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable(),
  body: z.string().nullable(),
  payload: z.unknown().nullable(),
  publishedAt: z.string().datetime().nullable(),
  sourceReference: z.string().nullable(),
});

export const publicDocumentDtoSchema = z.object({
  title: z.string().min(1),
  documentType: z.string().min(1),
  periodLabel: z.string().nullable(),
  publicUrl: z.string().url().nullable(),
  disclosureText: z.string().nullable(),
  sourceReference: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
});

export const publicMetricDtoSchema = z.object({
  metricKey: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().nullable(),
  periodLabel: z.string().min(1),
  basis: z.string().nullable(),
  disclosureText: z.string().nullable(),
  sourceReference: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
});

export const publicContactDtoSchema = z.object({
  label: z.string().min(1),
  channelType: z.string().min(1),
  value: z.string().min(1),
  contactName: z.string().nullable(),
  purpose: z.string().nullable(),
  region: z.string().nullable(),
  verifiedAt: z.string().datetime().nullable(),
  publishedAt: z.string().datetime().nullable(),
});

export const publicSiteDtoSchema = z
  .object({
    siteKey: z.literal(PUBLIC_SITE_KEY),
    generatedAt: z.string().datetime(),
    pages: z.array(publicContentDtoSchema),
    leadership: z.array(publicContentDtoSchema),
    news: z.array(publicContentDtoSchema),
    investorUpdates: z.array(publicContentDtoSchema),
    productCollections: z.array(publicContentDtoSchema),
    documents: z.array(publicDocumentDtoSchema),
    metrics: z.array(publicMetricDtoSchema),
    contacts: z.array(publicContactDtoSchema),
  })
  .strict();

export type PublicSiteDto = z.infer<typeof publicSiteDtoSchema>;

/*
 * Stage 6 family projections. Each is the exact shape a public page renders,
 * strict so that an internal field added to a row can never reach the wire
 * without an explicit contract change. Identifiers, actors, statuses, and
 * timestamps other than the editorial dates are deliberately absent.
 */
export const publicNewsItemDtoSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    body: z.array(z.string().min(1)).min(1),
    source: z.object({ label: z.string().min(1), href: z.string().url() }).nullable(),
    related: z.array(z.object({ label: z.string().min(1), route: z.string().min(1) })),
  })
  .strict();

export const publicResourceDtoSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    body: z.array(z.string().min(1)).min(1),
    author: z.string().min(1),
    reviewer: z.string().min(1),
    published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    action: z.string().min(1),
  })
  .strict();

/** A published public document: metadata plus the stable download path when a file is attached. */
export const publishedDocumentDtoSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    documentType: z.string().min(1),
    periodLabel: z.string().nullable(),
    /** Same-origin path on the Command Center host; null when no approved file is attached. */
    downloadPath: z.string().startsWith("/api/public/v1/documents/").nullable(),
    disclosureText: z.string().nullable(),
    sourceReference: z.string().nullable(),
    publishedAt: z.string().datetime().nullable(),
  })
  .strict();

export const publicFamilyListSchema = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      siteKey: z.literal(PUBLIC_SITE_KEY),
      generatedAt: z.string().datetime(),
      items: z.array(item),
    })
    .strict();

export type PublicNewsItemDto = z.infer<typeof publicNewsItemDtoSchema>;
export type PublicResourceDto = z.infer<typeof publicResourceDtoSchema>;
export type PublishedDocumentDto = z.infer<typeof publishedDocumentDtoSchema>;
