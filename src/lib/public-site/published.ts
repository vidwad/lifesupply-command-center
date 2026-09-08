/**
 * The public site's only door to published content.
 *
 * The Vercel deployment has no database. Pages that show governed content
 * fetch it server-to-server from the Command Center's published-only
 * endpoints, validate the body against the same strict contract the server
 * uses, and cache it for `PUBLISHED_REVALIDATE_SECONDS`. Nothing here throws:
 * a failed fetch, a non-2xx status, or a body that does not match the
 * contract all return `{ ok: false }`, and the calling section fails closed
 * with an "unavailable" note instead of an empty list that could be read as
 * "nothing published". Stable approved corporate copy (the historical
 * releases, the on-request document records) stays static and is never
 * replaced by this path (guide §5 eligibility policy).
 */
import type { z } from "zod";

import {
  publicFamilyListSchema,
  publicNewsItemDtoSchema,
  publicResourceDtoSchema,
  publishedDocumentDtoSchema,
  type PublicNewsItemDto,
  type PublicResourceDto,
  type PublishedDocumentDto,
} from "@/server/public-web/contracts";

export const PUBLISHED_REVALIDATE_SECONDS = 300;

const DEFAULT_ORIGIN = "https://lifesupply-cc-web.onrender.com";

/** The Command Center origin that serves `/api/public/v1/*`; never a same-host path on Vercel. */
export function publishedContentOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  const candidate =
    env.PUBLIC_CONTENT_API_ORIGIN?.trim() ||
    env.NEXT_PUBLIC_COMMAND_CENTER_URL?.trim() ||
    DEFAULT_ORIGIN;
  const url = new URL(candidate);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("PUBLIC_CONTENT_API_ORIGIN must use HTTP or HTTPS");
  }
  return url.origin;
}

export type Published<T> = { ok: true; data: T } | { ok: false };

async function fetchPublished<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  options: { notFoundIsAbsence: boolean },
): Promise<Published<z.infer<T>>> {
  try {
    const response = await fetch(`${publishedContentOrigin()}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: PUBLISHED_REVALIDATE_SECONDS },
    });
    // A single item that is not published is a real absence; a missing list endpoint is an outage.
    if (response.status === 404 && options.notFoundIsAbsence)
      return { ok: true, data: null as z.infer<T> };
    if (!response.ok) return { ok: false };
    const parsed = schema.safeParse(await response.json());
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

const newsList = publicFamilyListSchema(publicNewsItemDtoSchema);
const resourceList = publicFamilyListSchema(publicResourceDtoSchema);
const documentList = publicFamilyListSchema(publishedDocumentDtoSchema);

export async function fetchPublishedNews(): Promise<Published<PublicNewsItemDto[]>> {
  const result = await fetchPublished("/api/public/v1/news", newsList, {
    notFoundIsAbsence: false,
  });
  return result.ok ? { ok: true, data: result.data.items } : result;
}

export async function fetchPublishedNewsItem(
  slug: string,
): Promise<Published<PublicNewsItemDto | null>> {
  return fetchPublished(
    `/api/public/v1/news/${encodeURIComponent(slug)}`,
    publicNewsItemDtoSchema,
    {
      notFoundIsAbsence: true,
    },
  );
}

export async function fetchPublishedResources(): Promise<Published<PublicResourceDto[]>> {
  const result = await fetchPublished("/api/public/v1/resources", resourceList, {
    notFoundIsAbsence: false,
  });
  return result.ok ? { ok: true, data: result.data.items } : result;
}

export async function fetchPublishedResource(
  slug: string,
): Promise<Published<PublicResourceDto | null>> {
  return fetchPublished(
    `/api/public/v1/resources/${encodeURIComponent(slug)}`,
    publicResourceDtoSchema,
    {
      notFoundIsAbsence: true,
    },
  );
}

export async function fetchPublishedDocuments(): Promise<Published<PublishedDocumentDto[]>> {
  const result = await fetchPublished("/api/public/v1/documents", documentList, {
    notFoundIsAbsence: false,
  });
  return result.ok ? { ok: true, data: result.data.items } : result;
}

/** Absolute download URL for a published document; the Command Center host serves the file. */
export function publishedDocumentUrl(downloadPath: string) {
  return `${publishedContentOrigin()}${downloadPath}`;
}
