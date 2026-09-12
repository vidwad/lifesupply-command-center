import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.manuscdn.com",
        pathname: "/user_upload_by_module/session_file/**",
      },
    ],
  },
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
      // Website consolidation, stage 1 (2026-09-10): Shop & Services merged
      // into the Medical Supplies stores section, and Equipment, Ongoing
      // supplies and the Partners clinic page became sections of Clinic
      // Solutions. Content moved first; these rules retire the addresses.
      // Each rule is an exact path. `/partners/clinics` in particular must
      // never be written as a prefix or wildcard match: `/partners/suppliers`
      // and `/partners/acquisitions` are retained pages that must keep
      // answering 200 (docs/website-consolidation/REDIRECTS.md).
      { source: "/shop", destination: "/medical-supply-solutions#stores", permanent: true },
      {
        source: "/clinic-solutions/equipment",
        destination: "/clinic-solutions#equipment",
        permanent: true,
      },
      {
        source: "/clinic-solutions/ongoing-supplies",
        destination: "/clinic-solutions#ongoing-supplies",
        permanent: true,
      },
      {
        source: "/partners/clinics",
        destination: "/clinic-solutions#collaboration",
        permanent: true,
      },
      // Website consolidation, stage 2 (2026-09-10): the pharmacy partner page
      // became a Pharmacy Solutions section, and the care-kits hub, its eight
      // pathway pages and refills became Metabolic Health sections. Each
      // pathway keeps the anchor its slug used, so an address that was
      // bookmarked or linked lands on the same material rather than on a hub.
      {
        source: "/partners/pharmacies",
        destination: "/pharmacy-solutions#partner-program",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits",
        destination: "/metabolic-health#pathways",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/glp-1-support",
        destination: "/metabolic-health#glp-1-support",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/injection-safety",
        destination: "/metabolic-health#injection-safety",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/sharps-supplies",
        destination: "/metabolic-health#sharps-supplies",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/travel-support",
        destination: "/metabolic-health#travel-support",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/home-monitoring",
        destination: "/metabolic-health#home-monitoring",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/diabetes-supplies",
        destination: "/metabolic-health#diabetes-supplies",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/clinic-injectable-supplies",
        destination: "/metabolic-health#clinic-injectable-supplies",
        permanent: true,
      },
      {
        source: "/metabolic-health/care-kits/pharmacy-patient-support",
        destination: "/metabolic-health#pharmacy-patient-support",
        permanent: true,
      },
      {
        source: "/metabolic-health/refills",
        destination: "/metabolic-health#replenishment",
        permanent: true,
      },
      // Website consolidation, stage 3 (2026-09-10): Partners stopped being a
      // primary category and its hub went with it. The hub only routed by
      // relationship, and routing an enquiry by intent is what Contact does.
      //
      // EXACT PATH, NEVER A PREFIX. `/partners/suppliers` and
      // `/partners/acquisitions` are retained pages that must keep answering
      // 200 (docs/website-consolidation/REDIRECTS.md). A wildcard here would
      // take both of them out, and a canary forbids that form.
      { source: "/partners", destination: "/contact#business-inquiries", permanent: true },
      // Website consolidation, stage 5 (2026-09-11): About absorbed the team,
      // so the team address goes there, and the four retained biographies go
      // to the person's dialog rather than to the top of a listing.
      { source: "/our-team", destination: "/about-us", permanent: true },
      { source: "/abdul-ladha", destination: "/about-us#abdul-ladha", permanent: true },
      { source: "/keith-dolo-2", destination: "/about-us#keith-dolo", permanent: true },
      {
        source: "/barrett-e-g-sleeman",
        destination: "/about-us#barrett-sleeman",
        permanent: true,
      },
      { source: "/david-vogt", destination: "/about-us#david-vogt", permanent: true },
      // Leadership profiles withdrawn on 2026-09-08 (product owner: no longer
      // involved); the addresses go to the team section of About. Keep in
      // step with `team.withdrawnProfileSlugs` (content/team.ts).
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
      ].map((slug) => ({ source: `/${slug}`, destination: "/about-us", permanent: true })),
    ];
  },
  experimental: {
    // Product Studio accepts up to four tightly validated reference photos.
    // Each file is capped server-side at 8 MiB.
    serverActions: { bodySizeLimit: "34mb" },
  },
};

export default nextConfig;
