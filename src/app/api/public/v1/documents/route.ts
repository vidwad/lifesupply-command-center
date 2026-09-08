import { familyResponse, publicHandler } from "@/server/public-web/http";
import { listPublishedDocuments } from "@/server/public-web/readers";

export const dynamic = "force-dynamic";

export const GET = publicHandler("public.documents.list", async () =>
  familyResponse(await listPublishedDocuments()),
);
