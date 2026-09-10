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
  /**
   * The lines carried by the two photographic divider bands (product owner,
   * 2026-09-09). Each is drawn from copy already on the site: the three
   * figures cited in the 2025 annual-report narrative, and the count of
   * operating websites in the brand registry. The photographs stay
   * decorative; only these lines are read.
   */
  bands: {
    desk: {
      eyebrow: "Since inception",
      statement:
        "More than 25 years of operations, more than 50,000 products, more than 1 million customers served.",
    },
    warehouse: {
      eyebrow: "The operating base",
      statement: "Four operating websites in Canada and the United States, behind one group.",
    },
  },
  /**
   * The company video beside Mission and Vision (product owner, 2026-09-09).
   * The video itself is registered in `video.ts`; nothing loads from YouTube
   * until the visitor presses play.
   */
  video: {
    eyebrow: "Watch",
    title: "Who we are and what we do.",
    description:
      "Abdul Ladha, Chairman & CEO, introduces LifeSupply Health in the company's published video.",
    playLabel: "Play the video",
    note: "Plays from YouTube's privacy-enhanced player when you press play; nothing is loaded from YouTube before that.",
    watchLabel: "Open on YouTube",
  },
  mission:
    "Through a commitment to technology, innovation, and excellence, LifeSupply aims to serve a broad customer base with premium products, competitive pricing, and direct access.",
  vision:
    "The public vision is to become a global leader in the online sale and distribution of health and medical products and related services.",
  /** The hero line: what the group is, not what a document says about it. */
  heroSummary:
    "A Canadian group that has been selling health, safety, medical and industrial products online for more than 25 years, builds and equips clinics in British Columbia, and is developing two supply programs on top of that base.",
  growth:
    "The strategy is to hold margin discipline in the existing supply business, put technology into ordering and fulfilment, add complementary businesses that fit the model, and go deeper in both Canada and the United States.",

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

  /**
   * Developing opportunities, presented with their status. This block closes
   * the page (product owner, 2026-09-09); the former group statement,
   * published-entities list, and shared-capabilities grid were removed the
   * same day. Nothing here is offered as available.
   */
  developing: {
    eyebrow: "Looking ahead",
    title: "Developing opportunities under evaluation.",
    /**
     * The strategy statement, after the prior About page's "Our growth
     * strategy" (product owner, 2026-09-09), stated as strategy and objective
     * rather than as transactions under way. Each opportunity then carries
     * its own discussion inside its card (laid out in two columns on
     * 2026-09-09 at the product owner's request). Nothing here is offered as
     * available.
     */
    lead: "The growth strategy is to acquire profitable operations that complement the existing business model. The objective is to integrate strategically located bricks-and-mortar medical supply stores, pharmacies, clinics, and distributors into current operations, broadening the range of inventory available to LifeSupply and enabling a wider range of products and services to be offered online in Canada and the United States.",
    intro: "A closer look at the two programs in development above.",
    items: [
      {
        title: "Metabolic-health supply services",
        status: "In development",
        text: "Starter equipment, usage-driven consumables, clinic procurement, kitting and fulfilment, and contracted workflow support for clinics, pharmacies, and programs supporting people on metabolic-health pathways.",
        detail:
          "It applies the existing supply model to a recurring patient-support need. Availability is published as each pathway is confirmed.",
      },
      {
        title: "Pharmacy supply programs",
        status: "In development",
        text: "Pharmacist-selected non-drug supplies and fulfilment for pharmacies. The pharmacy is the customer, and medication is excluded entirely.",
        detail:
          "Holding licensed pharmacy operations of its own is a separate question, and it sits under evaluation rather than in development. Supplying pharmacies and running one are different businesses.",
      },
    ],
    note: "Neither program can be bought today, and no launch date is set. Each is published with its own status, and that status changes here when it changes.",
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
