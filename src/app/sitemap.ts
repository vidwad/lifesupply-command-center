import type { MetadataRoute } from "next";

import { KIT_SLUGS } from "@/lib/public-site/content/metabolic";
import { team } from "@/lib/public-site/content/team";
import { LIVE_ROUTES, kitRoute, profileRoute } from "@/lib/public-site/routes";
import { canonicalUrl } from "@/lib/public-site/seo";

export const dynamic = "force-static";

/**
 * Every live public route from the registry, the eight kit pages, and the
 * retained profile addresses, as canonical (unslashed) URLs. Dynamic
 * templates whose records live in the publication model (`/news/[slug]/`,
 * `/resources/[slug]/`) are excluded here: the Vercel build has no database,
 * and a published item is discoverable from `/news/`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticPaths = LIVE_ROUTES.filter((route) => !route.path.includes("[")).map(
    (route) => route.path,
  );
  const paths = [
    ...staticPaths,
    ...KIT_SLUGS.map(kitRoute),
    ...team.legacyProfiles.map((profile) => profileRoute(profile.slug)),
  ];
  return Array.from(new Set(paths)).map((path) => ({
    url: canonicalUrl(path),
    lastModified,
    changeFrequency: path === "/" || path === "/news/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.split("/").filter(Boolean).length === 1 ? 0.8 : 0.6,
  }));
}
