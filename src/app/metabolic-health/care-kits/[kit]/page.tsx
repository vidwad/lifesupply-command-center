import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CareKitPage } from "@/components/public-site/lifesupply-pages";
import { KIT_SLUGS, getKit } from "@/lib/public-site/content/metabolic";

type PageProps = { params: Promise<{ kit: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return KIT_SLUGS.map((kit) => ({ kit }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kit } = await params;
  const pathway = getKit(kit);
  return pathway ? { title: pathway.label, description: pathway.purpose } : {};
}

export default async function Page({ params }: PageProps) {
  const { kit } = await params;
  if (!getKit(kit)) notFound();
  return <CareKitPage slug={kit} />;
}
