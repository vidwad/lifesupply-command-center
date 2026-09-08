import { familyResponse, publicHandler } from "@/server/public-web/http";
import { listPublishedResources } from "@/server/public-web/readers";

export const dynamic = "force-dynamic";

export const GET = publicHandler("public.resources.list", async () =>
  familyResponse(await listPublishedResources()),
);
