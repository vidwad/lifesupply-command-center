import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NewsItemPage } from "@/components/public-site/lifesupply-pages";
import { getNewsItem, news } from "@/lib/public-site/content/news";

type PageProps = { params: Promise<{ slug: string }> };

/** Only approved records render; with none approved, every slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return news.current.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getNewsItem(slug);
  return item ? { title: item.title, description: item.summary } : {};
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  if (!getNewsItem(slug)) notFound();
  return <NewsItemPage slug={slug} />;
}
