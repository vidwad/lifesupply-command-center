/**
 * About page copy for the Stage 2 contract (`/about-us/`): current group
 * introduction, geographic footprint, sourced milestones, operating
 * philosophy, brands, growth direction.
 *
 * Mission, vision, and growth are approved (published since PR #60/#61).
 * Footprint and milestone copy are Stage 2 drafts built only from verified
 * register rows (SOURCE_REGISTER.md); each milestone carries its date and
 * source. The withdrawn operations-timeline graphic was never a source (S-133).
 */
export const about = {
  // Approved (moved from JSX).
  hero: {
    eyebrow: "About LifeSupply",
    title: "A platform approach to medical-supply access.",
  },
  labels: { mission: "Mission", vision: "Vision" },
  mission:
    "Through a commitment to technology, innovation, and excellence, LifeSupply aims to serve a broad customer base with premium products, competitive pricing, and direct access.",
  vision:
    "The public vision is to become a global leader in the online sale and distribution of health and medical products and related services.",
  growth:
    "The current annual-report narrative describes a platform strategy combining operating discipline, technology deployment, complementary acquisitions, and Canadian and United States market reach. Forward-looking activities remain subject to approval and disclosure context.",

  /**
   * Footprint. Stage 2 draft from observed store facts: two Canadian
   * storefronts pricing in CAD, a clinic-development site serving British
   * Columbia projects, and a U.S. storefront pricing in USD (S-52, S-72,
   * S-80–S-88). No office, warehouse, or entity claim beyond what is
   * published elsewhere on this site.
   */
  footprint: {
    eyebrow: "Footprint",
    title: "Canada and the United States.",
    text: "Two Canadian storefronts sell in Canadian dollars and ship across Canada. LifeSupply Clinics serves clinic projects in British Columbia. Balkowitsch Worldwide sells in U.S. dollars from the United States.",
  },

  /**
   * Milestones. Stage 2 draft. Only dated, sourced public records: the four
   * 2022 announcements already in the news archive and the 2025 annual-report
   * citations already rendered as figures. Nothing from the legacy timeline
   * graphic or the legacy site's undated claims.
   */
  milestones: {
    eyebrow: "Milestones",
    title: "A dated public record.",
    note: "Items are listed with their original date and source. Figures are as cited in the 2025 annual-report narrative.",
    items: [
      {
        date: "April 5, 2022",
        text: "Acquisition of Smart Move Medical assets announced.",
        source: "Yahoo News",
        href: "https://www.yahoo.com/now/lifesupply-announces-acquisition-medical-supplies-150000544.html",
      },
      {
        date: "April 21, 2022",
        text: "Dr. Margaret Clarke appointed to the Board of Directors.",
        source: "Yahoo Finance",
        href: "https://ca.finance.yahoo.com/news/lifesupply-appoints-dr-margaret-clarke-150000607.html",
      },
      {
        date: "May 11, 2022",
        text: "Distribution partnership with Ortho Active expanded.",
        source: "Newswire",
        href: "https://www.newswire.ca/news-releases/lifesupply-expands-distribution-partnership-with-ortho-active-864792320.html",
      },
      {
        date: "June 14, 2022",
        text: "Distribution partnership with Mothers Choice Products announced.",
        source: "Newswire",
        href: "https://www.newswire.ca/news-releases/lifesupply-joins-forces-with-mothers-choice-products-for-online-distribution-of-top-tier-maternal-health-products-808815327.html",
      },
      {
        date: "2025 annual report",
        text: "Cites more than 25 years of operations, more than 50,000 products, and more than 1 million customers served since inception.",
        source: "2025 annual-report narrative",
        href: null,
      },
    ],
  },

  // Stage 2 draft heading; the cards come from the brand registry.
  portfolio: {
    eyebrow: "Operating brands",
    title: "The operating websites behind the group.",
  },

  /**
   * Growth direction. The first paragraph is the approved `growth` text; the
   * second is the guide's expansion direction (S-120), stated conditionally.
   */
  direction: {
    eyebrow: "Growth direction",
    title: "Build on the operating base.",
    text: "The stated direction is to develop deeper clinic relationships and recurring patient-support supply programs on top of the existing commerce, clinic-development, and equipment capabilities. Each initiative is presented on this site with its own status.",
  },
} as const;
