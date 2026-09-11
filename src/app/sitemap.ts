import type { MetadataRoute } from "next";

import { LIVE_ROUTES } from "@/lib/public-site/routes";
import { canonicalUrl } from "@/lib/public-site/seo";

export const dynamic = "force-static";

/**
 * Every live public route from the registry, as canonical (unslashed) URLs.
 * The four leadership profile addresses were listed here until 2026-09-10;
 * they are sections of `/our-team` now and their addresses redirect, so
 * listing them would advertise four URLs that answer 308. Dynamic templates whose records
 * live in the publication model (`/news/[slug]/`, `/resources/[slug]/`) are
 * excluded here: the Vercel build has no database, and a published item is
 * discoverable from `/news/`.
 *
 * The eight pathway pages were listed separately until 2026-09-10. They are
 * sections of Metabolic Health now and their addresses redirect, so listing
 * them would advertise eleven URLs that answer 308 (website consolidation,
 * stage 2). Everything here comes from the registry, which is what keeps the
 * map and the redirects from disagreeing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticPaths = LIVE_ROUTES.filter((route) => !route.path.includes("[")).map(
    (route) => route.path,
  );
  const paths = staticPaths;
  return Array.from(new Set(paths)).map((path) => ({
    url: canonicalUrl(path),
    lastModified,
    changeFrequency: path === "/" || path === "/news/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.split("/").filter(Boolean).length === 1 ? 0.8 : 0.6,
  }));
}
