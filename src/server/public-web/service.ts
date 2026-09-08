import { PublicContentStatus, PublicContentType } from "@prisma/client";

import { prisma } from "@/server/db/client";
import {
  PUBLIC_SITE_KEY,
  publicSiteDtoSchema,
  type PublicSiteDto,
} from "@/server/public-web/contracts";

const publishedWhere = {
  status: PublicContentStatus.published,
  OR: [{ effectiveAt: null }, { effectiveAt: { lte: new Date() } }],
  AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
};

function iso(value: Date | null) {
  return value?.toISOString() ?? null;
}

export async function getPublicLifeSupplySite(): Promise<PublicSiteDto> {
  const [content, documents, metrics, contacts] = await Promise.all([
    prisma.publicContentItem.findMany({
      where: { siteKey: PUBLIC_SITE_KEY, ...publishedWhere },
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    }),
    prisma.publicDocument.findMany({
      where: { siteKey: PUBLIC_SITE_KEY, status: PublicContentStatus.published },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.publicMetricSnapshot.findMany({
      where: { siteKey: PUBLIC_SITE_KEY, status: PublicContentStatus.published },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.publicContactChannel.findMany({
      where: { siteKey: PUBLIC_SITE_KEY, status: PublicContentStatus.published },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const serializeContent = (type: PublicContentType) =>
    content
      .filter((item) => item.contentType === type)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        body: item.body,
        payload: item.payload,
        publishedAt: iso(item.publishedAt),
        sourceReference: item.sourceReference,
      }));
  return publicSiteDtoSchema.parse({
    siteKey: PUBLIC_SITE_KEY,
    generatedAt: new Date().toISOString(),
    pages: serializeContent(PublicContentType.corporate_page),
    leadership: serializeContent(PublicContentType.leadership_profile),
    news: serializeContent(PublicContentType.news_item),
    investorUpdates: serializeContent(PublicContentType.investor_update),
    productCollections: serializeContent(PublicContentType.product_collection),
    documents: documents.map((item) => ({
      title: item.title,
      documentType: item.documentType,
      periodLabel: item.periodLabel,
      publicUrl: item.publicUrl,
      disclosureText: item.disclosureText,
      sourceReference: item.sourceReference,
      publishedAt: iso(item.publishedAt),
    })),
    metrics: metrics.map((item) => ({
      metricKey: item.metricKey,
      label: item.label,
      value: item.value,
      unit: item.unit,
      periodLabel: item.periodLabel,
      basis: item.basis,
      disclosureText: item.disclosureText,
      sourceReference: item.sourceReference,
      publishedAt: iso(item.publishedAt),
    })),
    contacts: contacts.map((item) => ({
      label: item.label,
      channelType: item.channelType,
      value: item.value,
      contactName: item.contactName,
      purpose: item.purpose,
      region: item.region,
      verifiedAt: iso(item.verifiedAt),
      publishedAt: iso(item.publishedAt),
    })),
  });
}
