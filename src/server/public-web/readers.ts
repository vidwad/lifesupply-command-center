/**
 * Published-only readers for the Stage 6 families (WB-604).
 *
 * Each reader selects rows that are `published` and inside their effective
 * window, re-checks the window in code, validates the stored payload, and
 * projects to a strict DTO. A row whose payload fails validation is skipped
 * and reported, never rendered half-formed. Nothing here catches database
 * errors: the route handler turns any failure into a generic 503 so a public
 * visitor learns nothing about the cause.
 */
import { PublicContentStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { captureMessage } from "@/server/logger/error-tracking";
import {
  publicNewsItemDtoSchema,
  publicResourceDtoSchema,
  publishedDocumentDtoSchema,
  type PublicNewsItemDto,
  type PublicResourceDto,
  type PublishedDocumentDto,
} from "@/server/public-web/contracts";
import {
  FAMILIES,
  isAllowedDocumentUrl,
  isTimeValid,
  newsPayloadSchema,
  resourcePayloadSchema,
  type PublicFamily,
} from "@/server/public-web/families";

export function publishedWindowWhere(now: Date) {
  return {
    status: PublicContentStatus.published,
    OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }],
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
  };
}

type Row = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  payload: unknown;
  status: PublicContentStatus;
  effectiveAt: Date | null;
  expiresAt: Date | null;
};

function projectNews(row: Row): PublicNewsItemDto | null {
  const payload = newsPayloadSchema.safeParse(row.payload);
  if (!payload.success || !row.summary) return null;
  return publicNewsItemDtoSchema.parse({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    date: payload.data.date,
    body: payload.data.body,
    source: payload.data.source,
    related: payload.data.related,
  });
}

function projectResource(row: Row): PublicResourceDto | null {
  const payload = resourcePayloadSchema.safeParse(row.payload);
  if (!payload.success || !row.summary) return null;
  return publicResourceDtoSchema.parse({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: payload.data.body,
    author: payload.data.author,
    reviewer: payload.data.reviewer,
    published: payload.data.published,
    reviewed: payload.data.reviewed,
    action: payload.data.action,
  });
}

/** Rows → DTOs, dropping (and reporting) anything not renderable. */
export function projectFamily<T>(
  family: PublicFamily,
  rows: Row[],
  now: Date,
  project: (row: Row) => T | null,
): T[] {
  const out: T[] = [];
  for (const row of rows) {
    if (!isTimeValid(row, now)) continue;
    const dto = project(row);
    if (dto) out.push(dto);
    else
      captureMessage("Published public content failed projection; skipped", { family, id: row.id });
  }
  return out;
}

async function familyRows(family: PublicFamily, now: Date, slug?: string) {
  return prisma.publicContentItem.findMany({
    where: {
      siteKey: "lifesupply-health",
      contentType: FAMILIES[family].contentType,
      ...(slug ? { slug } : {}),
      ...publishedWindowWhere(now),
    },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
  });
}

export async function listPublishedNewsItems(now = new Date()) {
  const rows = await familyRows("news", now);
  return projectFamily("news", rows, now, projectNews).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPublishedNewsItem(slug: string, now = new Date()) {
  const rows = await familyRows("news", now, slug);
  return projectFamily("news", rows, now, projectNews)[0] ?? null;
}

export async function listPublishedResources(now = new Date()) {
  const rows = await familyRows("resource", now);
  return projectFamily("resource", rows, now, projectResource);
}

export async function getPublishedResource(slug: string, now = new Date()) {
  const rows = await familyRows("resource", now, slug);
  return projectFamily("resource", rows, now, projectResource)[0] ?? null;
}

/** The stable same-origin download path; the route behind it re-checks status and host on every request. */
export function documentDownloadPath(id: string) {
  return `/api/public/v1/documents/${id}/file`;
}

export function projectDocument(row: {
  id: string;
  title: string;
  documentType: string;
  periodLabel: string | null;
  publicUrl: string | null;
  disclosureText: string | null;
  sourceReference: string | null;
  publishedAt: Date | null;
}): PublishedDocumentDto {
  return publishedDocumentDtoSchema.parse({
    id: row.id,
    title: row.title,
    documentType: row.documentType,
    periodLabel: row.periodLabel,
    downloadPath: isAllowedDocumentUrl(row.publicUrl) ? documentDownloadPath(row.id) : null,
    disclosureText: row.disclosureText,
    sourceReference: row.sourceReference,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  });
}

export async function listPublishedDocuments() {
  const rows = await prisma.publicDocument.findMany({
    where: { siteKey: "lifesupply-health", status: PublicContentStatus.published },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
  });
  return rows.map(projectDocument);
}

/**
 * The file behind a published document, or null. Restricted material is
 * never entered into this table, so there is nothing to guess: an id that is
 * not published, or whose host is not approved, resolves to nothing.
 */
export async function resolvePublishedDocumentFile(id: string) {
  const row = await prisma.publicDocument.findFirst({
    where: { id, siteKey: "lifesupply-health", status: PublicContentStatus.published },
  });
  if (!row || !isAllowedDocumentUrl(row.publicUrl)) return null;
  return { url: row.publicUrl as string, title: row.title };
}
