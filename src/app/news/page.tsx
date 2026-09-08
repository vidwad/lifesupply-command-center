import type { Metadata } from "next";

import { NewsPage } from "@/components/public-site/lifesupply-pages";
import { fetchPublishedNews, fetchPublishedResources } from "@/lib/public-site/published";

export const metadata: Metadata = {
  title: "News & resources",
  description:
    "Company news with its date, the historical public record, and practical resources with a named author and reviewer.",
};

// Segment config must be a literal; keep in step with PUBLISHED_REVALIDATE_SECONDS (300).
export const revalidate = 300;

export default async function Page() {
  const [current, resources] = await Promise.all([fetchPublishedNews(), fetchPublishedResources()]);
  return <NewsPage current={current} resources={resources} />;
}
