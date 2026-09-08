import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegacyProfilePage } from "@/components/public-site/lifesupply-pages";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = LIFE_SUPPLY_CONTENT.team.legacyProfiles.find((entry) => entry.slug === slug);
  return profile ? { title: profile.name, description: profile.role } : {};
}

export default async function LegacyProfileRoute({ params }: PageProps) {
  const { slug } = await params;
  if (!LIFE_SUPPLY_CONTENT.team.legacyProfiles.some((profile) => profile.slug === slug)) {
    notFound();
  }
  return <LegacyProfilePage slug={slug} />;
}
