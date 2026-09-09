import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes disabled while we rely on string literals in redirect()/Link.
  // Re-enable once we adopt the generated Route type or Pathnames helper.
  typedRoutes: false,
  // Stage 9 legacy-URL map (LEGACY_URL_MAP.md). Trailing slashes are left at the
  // Next default: a slashed request answers 308 to the unslashed path, which is
  // the canonical form (seo.ts). Redirects are permanent so search engines
  // transfer the legacy addresses.
  async redirects() {
    return [
      { source: "/contact-2", destination: "/contact", permanent: true },
      { source: "/ross-jelveh", destination: "/ross-jelveh-2", permanent: true },
    ];
  },
  experimental: {
    // Product Studio accepts up to four tightly validated reference photos.
    // Each file is capped server-side at 8 MiB.
    serverActions: { bodySizeLimit: "34mb" },
  },
};

export default nextConfig;
