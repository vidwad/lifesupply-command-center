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
