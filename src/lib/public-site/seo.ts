/**
 * SEO helpers for the public site (Stage 9, WB-90x).
 *
 * - `SITE_ORIGIN` is the canonical public origin. It defaults to the custom
 *   domain the cutover will use; the production alias keeps serving with
 *   the same canonical so that search engines never index the alias.
 * - Canonical URLs have **no trailing slash**: the route registry writes
 *   paths with a trailing slash as its contract, `next/link` strips it, and
 *   the deployed site answers a slashed request with a 308 to the unslashed
 *   path (D-11 note, Stage 1). The canonical follows the served form.
 * - Indexing is an explicit switch, `PUBLIC_SITE_INDEXABLE=true`, so that
 *   attaching a custom domain to the project can never make a preview or
 *   the alias indexable by accident. Until the switch is on, every page
 *   carries `noindex, nofollow` and robots.txt disallows everything.
 */
import type { Metadata } from "next";

export const DEFAULT_SITE_ORIGIN = "https://lifesupplyhealth.com";

export function siteOrigin(env: Record<string, string | undefined> = process.env): string {
  const candidate = env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_ORIGIN;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return DEFAULT_SITE_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export function isIndexable(env: Record<string, string | undefined> = process.env): boolean {
  return env.PUBLIC_SITE_INDEXABLE === "true";
}

/** `/about-us/` → `/about-us`; `/` stays `/`. */
export function canonicalPath(path: string): string {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? "/";
  if (withoutQuery === "/") return "/";
  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
}

export function canonicalUrl(path: string, env?: Record<string, string | undefined>): string {
  return `${siteOrigin(env)}${canonicalPath(path)}`;
}

export const DEFAULT_OG_IMAGE = { url: "/lsh/og-default.jpg", width: 1200, height: 630 } as const;

/**
 * Metadata for a public route: title, description, canonical, social
 * preview, and the indexing posture. Every public route file builds its
 * metadata through this helper so no page can forget the canonical or
 * slip past the indexing switch.
 */
export function publicMetadata({
  title,
  description,
  path,
  type = "website",
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const url = canonicalUrl(path);
  const index = isIndexable() && !noindex;
  return {
    title,
    description,
    metadataBase: new URL(siteOrigin()),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "LifeSupply Health",
      type,
      locale: "en_CA",
      images: [{ ...DEFAULT_OG_IMAGE, alt: "LifeSupply Health" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE.url] },
    robots: index ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
  };
}

/**
 * Structured data. Only facts the site already publishes: the legal name,
 * the corporate site, the logo, the published office address, and the two
 * approved public contact channels. No sameAs to the operating stores,
 * because the legal relationships are unconfirmed (WEB-01).
 */
export function organizationJsonLd() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LifeSupply Health Inc.",
    url: `${origin}/`,
    logo: `${origin}/lsh/lifesupply-mark.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "6911 King George Highway",
      addressLocality: "Surrey",
      addressRegion: "BC",
      postalCode: "V3W 5A1",
      addressCountry: "CA",
    },
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: "info@lifesupply.com" },
      {
        "@type": "ContactPoint",
        contactType: "investor relations",
        email: "invest@lifesupply.com",
        telephone: "+1-604-677-4146",
      },
    ],
  };
}

export function webSiteJsonLd() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LifeSupply Health",
    url: `${origin}/`,
  };
}
