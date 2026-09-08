/**
 * Response envelope for the public family endpoints on the Command Center
 * host. Success carries short shared caching; any failure is a generic,
 * uncached 503 that names no cause. The public site treats that 503 as
 * "unavailable" and fails closed on the affected section.
 *
 * Cache note (WB-606): `s-maxage=300` means a withdrawn record can stay in a
 * shared cache for up to five minutes, and the public site's own
 * revalidation window (`PUBLISHED_REVALIDATE_SECONDS`) adds up to five more.
 * Withdrawal therefore propagates within ten minutes without a push. A
 * signed revalidation event would shorten that and is proposed, not built.
 */
import { NextResponse } from "next/server";

import { captureException } from "@/server/logger/error-tracking";
import { PUBLIC_SITE_KEY } from "@/server/public-web/contracts";

export const PUBLIC_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=900";

export function familyResponse<T>(items: T[]) {
  return NextResponse.json(
    { siteKey: PUBLIC_SITE_KEY, generatedAt: new Date().toISOString(), items },
    { headers: { "Cache-Control": PUBLIC_CACHE_CONTROL, Vary: "Accept-Encoding" } },
  );
}

export function itemResponse<T>(item: T | null) {
  if (!item) {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(item, {
    headers: { "Cache-Control": PUBLIC_CACHE_CONTROL, Vary: "Accept-Encoding" },
  });
}

export function unavailableResponse(error: unknown, where: string) {
  captureException(error, { where });
  return NextResponse.json(
    { error: "Public website data is temporarily unavailable." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

/** Wrap a reader so every thrown error becomes the generic 503. */
export function publicHandler(where: string, handler: () => Promise<Response>) {
  return async () => {
    try {
      return await handler();
    } catch (error) {
      return unavailableResponse(error, where);
    }
  };
}
