import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NewsItemView, PublishedUnavailablePage } from "@/components/public-site/lifesupply-pages";
import { fetchPublishedNewsItem } from "@/lib/public-site/published";
import { newsItemRoute } from "@/lib/public-site/routes";
import { publicMetadata } from "@/lib/public-site/seo";

type PageProps = { params: Promise<{ slug: string }> };

/** Rendered on demand from the published read model and cached; a withdrawn item 404s after revalidation. */
// Segment config must be a literal; keep in step with PUBLISHED_REVALIDATE_SECONDS (300).
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchPublishedNewsItem(slug);
  if (!result.ok) return { title: "Temporarily unavailable", robots: { index: false } };
  return result.data
    ? publicMetadata({
        title: result.data.title,
        description: result.data.summary,
        path: newsItemRoute(slug),
        type: "article",
      })
    : {};
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const result = await fetchPublishedNewsItem(slug);
  if (!result.ok) return <PublishedUnavailablePage />;
  if (!result.data) notFound();
  return <NewsItemView item={result.data} />;
}
