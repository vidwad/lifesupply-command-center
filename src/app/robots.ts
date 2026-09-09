import type { MetadataRoute } from "next";

import { isIndexable, siteOrigin } from "@/lib/public-site/seo";

export const dynamic = "force-static";

/**
 * Crawling is disallowed until `PUBLIC_SITE_INDEXABLE=true` is set on the
 * deployment that serves the custom domain. The production alias and every
 * preview therefore stay out of search whatever Vercel's own header does.
 * Even when indexable, the preview route and the API stay disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/public-web-preview/", "/public-web/"] },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
    host: siteOrigin(),
  };
}
