import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegacyProfilePage } from "@/components/public-site/lifesupply-pages";
import { team } from "@/lib/public-site/content/team";
import { profileRoute } from "@/lib/public-site/routes";
import { publicMetadata } from "@/lib/public-site/seo";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Retained legacy profile addresses. Pre-rendered from the content model
 * (Stage 9): the slugs are fixed, so nothing needs to be dynamic, and an
 * unknown slug is a build-time 404 rather than a runtime lookup.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return team.legacyProfiles.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) return {};
  return publicMetadata({
    title: profile.name,
    description: `${profile.role}. ${profile.bio.slice(0, 140)}…`,
    path: profileRoute(slug),
    type: "article",
  });
}

export default async function LegacyProfileRoute({ params }: PageProps) {
  const { slug } = await params;
  if (!team.legacyProfiles.some((profile) => profile.slug === slug)) {
    notFound();
  }
  return <LegacyProfilePage slug={slug} />;
}
