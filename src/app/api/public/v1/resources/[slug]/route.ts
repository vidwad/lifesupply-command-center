import { itemResponse, unavailableResponse } from "@/server/public-web/http";
import { getPublishedResource } from "@/server/public-web/readers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    return itemResponse(await getPublishedResource(slug));
  } catch (error) {
    return unavailableResponse(error, "public.resources.item");
  }
}
