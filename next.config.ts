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
      // Restructure of 2026-09-08 (product owner): Our Businesses became
      // Medical Supply Solutions; the LifeSupply Clinics brand page is the
      // Clinic Solutions section; Design & build merged into its hub;
      // Technology & fulfilment was withdrawn.
      { source: "/our-operations", destination: "/medical-supply-solutions", permanent: true },
      {
        source: "/our-operations/lifesupply",
        destination: "/medical-supply-solutions/lifesupply",
        permanent: true,
      },
      {
        source: "/our-operations/wellmart-medical",
        destination: "/medical-supply-solutions/wellmart-medical",
        permanent: true,
      },
      {
        source: "/our-operations/balkowitsch",
        destination: "/medical-supply-solutions/balkowitsch",
        permanent: true,
      },
      {
        source: "/our-operations/lifesupply-clinics",
        destination: "/clinic-solutions",
        permanent: true,
      },
      {
        source: "/our-operations/technology-fulfilment",
        destination: "/medical-supply-solutions",
        permanent: true,
      },
      {
        source: "/clinic-solutions/design-build",
        destination: "/clinic-solutions",
        permanent: true,
      },
      // 2026-09-09 (product owner): the documents index merged into News &
      // resources; Shareholder services withdrawn.
      { source: "/investor-relations/documents", destination: "/news", permanent: true },
      {
        source: "/investor-relations/shareholder-services",
        destination: "/investor-relations",
        permanent: true,
      },
      // Leadership profiles withdrawn on 2026-09-08 (product owner: no longer
      // involved); the addresses go to the team page. The three directors
      // restored on 2026-09-09 are live profiles again. Keep in step with
      // `team.withdrawnProfileSlugs` (content/team.ts).
      ...[
        "ross-jelveh",
        "ross-jelveh-2",
        "ben-hastibakhsh",
        "gary-li",
        "craig-loverock",
        "mike-gill",
        "christopher-ishola",
        "dr-margaret-clarke-2",
        "dr-dedeshya-holowenko",
        "john-anderson-2",
      ].map((slug) => ({ source: `/${slug}`, destination: "/our-team", permanent: true })),
    ];
  },
  experimental: {
    // Product Studio accepts up to four tightly validated reference photos.
    // Each file is capped server-side at 8 MiB.
    serverActions: { bodySizeLimit: "34mb" },
  },
};

export default nextConfig;
