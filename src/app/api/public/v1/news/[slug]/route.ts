import { itemResponse, unavailableResponse } from "@/server/public-web/http";
import { getPublishedNewsItem } from "@/server/public-web/readers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    return itemResponse(await getPublishedNewsItem(slug));
  } catch (error) {
    return unavailableResponse(error, "public.news.item");
  }
}
