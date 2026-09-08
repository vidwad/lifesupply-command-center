import { NextResponse } from "next/server";

import { unavailableResponse } from "@/server/public-web/http";
import { resolvePublishedDocumentFile } from "@/server/public-web/readers";

export const dynamic = "force-dynamic";

/**
 * Stable download address for a published public document. The file itself
 * lives on an approved host (PUBLIC_DOCUMENT_HOSTS) until object storage is
 * decided (DEC-03); this route re-checks publication status and host on
 * every request and answers 404 for anything else, so an unpublished,
 * withdrawn, or never-public document cannot be reached by guessing an id.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const file = await resolvePublishedDocumentFile(id);
    if (!file) {
      return NextResponse.json(
        { error: "Not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.redirect(file.url, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return unavailableResponse(error, "public.documents.file");
  }
}
