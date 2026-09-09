import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublishedUnavailablePage, ResourceView } from "@/components/public-site/lifesupply-pages";
import { fetchPublishedResource } from "@/lib/public-site/published";
import { resourceRoute } from "@/lib/public-site/routes";
import { publicMetadata } from "@/lib/public-site/seo";

type PageProps = { params: Promise<{ slug: string }> };

// Segment config must be a literal; keep in step with PUBLISHED_REVALIDATE_SECONDS (300).
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchPublishedResource(slug);
  if (!result.ok) return { title: "Temporarily unavailable", robots: { index: false } };
  return result.data
    ? publicMetadata({
        title: result.data.title,
        description: result.data.summary,
        path: resourceRoute(slug),
        type: "article",
      })
    : {};
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const result = await fetchPublishedResource(slug);
  if (!result.ok) return <PublishedUnavailablePage />;
  if (!result.data) notFound();
  return <ResourceView item={result.data} />;
}
