import { familyResponse, publicHandler } from "@/server/public-web/http";
import { listPublishedNewsItems } from "@/server/public-web/readers";

export const dynamic = "force-dynamic";

export const GET = publicHandler("public.news.list", async () =>
  familyResponse(await listPublishedNewsItems()),
);
