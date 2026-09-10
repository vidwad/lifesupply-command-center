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
    "LifeSupply's vision is to become a global leader in the online sale and distribution of health and medical products and related services.",
  /** The hero line: what the group is, not what a document says about it. */
  heroSummary:
    "A Canadian group with more than 25 years of operations. It sells health, safety, medical and industrial products online, builds and equips clinics in British Columbia, and is developing two supply programs on that base.",
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
  /**
   * Round four, change 8. The entries ran 2020, 2023, then four from 2022,
   * then 2025, which is neither chronological nor a deliberate grouping. They
   * are ordered by `sortKey` now, oldest first, so the order cannot drift when
   * an entry is added; a regression test checks it. Year-only dates stay
   * year-only, because no month or day is evidenced for them.
   */
  milestones: {
    eyebrow: "Milestones",
    title: "A dated public record.",
    note: "Oldest first. The 2022 releases link to the sources that carried them.",
    items: [
      {
        date: "2020",
        sortKey: "2020-00-00",
        text: "Acquired Wellmart Health Supplies Ltd., which became the group's Canadian operating base.",
        source: "Corporate record",
        href: null,
      },
      {
        date: "April 5, 2022",
        sortKey: "2022-04-05",
        text: "Acquisition of Smart Move Medical assets announced.",
        source: "Yahoo News",
        href: "https://www.yahoo.com/now/lifesupply-announces-acquisition-medical-supplies-150000544.html",
      },
      {
        date: "April 21, 2022",
        sortKey: "2022-04-21",
        text: "Dr. Margaret Clarke appointed to the Board of Directors.",
        source: "Yahoo Finance",
        href: "https://ca.finance.yahoo.com/news/lifesupply-appoints-dr-margaret-clarke-150000607.html",
      },
      {
        date: "May 11, 2022",
        sortKey: "2022-05-11",
        text: "Distribution partnership with Ortho Active expanded.",
        source: "Newswire",
        href: "https://www.newswire.ca/news-releases/lifesupply-expands-distribution-partnership-with-ortho-active-864792320.html",
      },
      {
        date: "June 14, 2022",
        sortKey: "2022-06-14",
        text: "Distribution partnership with Mothers Choice Products announced.",
        source: "Newswire",
        href: "https://www.newswire.ca/news-releases/lifesupply-joins-forces-with-mothers-choice-products-for-online-distribution-of-top-tier-maternal-health-products-808815327.html",
      },
      {
        date: "2023",
        sortKey: "2023-00-00",
        text: "Acquired Balkowitsch Enterprises Inc., adding a United States customer base and distributor network.",
        source: "Corporate record",
        href: null,
      },
      {
        date: "2025 annual report",
        sortKey: "2025-00-01",
        text: "Cites more than 25 years of operations, more than 50,000 products, and more than 1 million customers served since inception. The customer figure is cumulative since inception, not a count of current customers.",
        source: "2025 annual report",
        href: null,
      },
      {
        date: "Year ended December 31, 2025",
        sortKey: "2025-12-31",
        text: "Reported consolidated net sales of C$6.75M, gross profit of C$2.20M, and net income of C$284K, unaudited.",
        source: "Investor disclosures",
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
          "It applies the existing supply model to a recurring patient-support need, one configurable pathway at a time.",
      },
      {
        title: "Pharmacy supply programs",
        status: "In development",
        text: "Pharmacist-selected non-drug supplies and fulfilment for pharmacies. The pharmacy is the customer, and medication is excluded entirely.",
        detail:
          "Holding licensed pharmacy operations of its own is a separate question, and it sits under evaluation rather than in development. Supplying pharmacies and running one are different businesses.",
      },
    ],
    note: "Neither program is available today, and no launch date is set.",
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

/**
 * Milestones oldest first, ordered by `sortKey` rather than by the order the
 * entries happen to sit in (round four, change 8). A year-only entry sorts to
 * the start of its year, which is why its key ends `-00-00`: no month or day
 * is evidenced, and none is invented to make sorting work.
 */
export function orderedMilestones() {
  return [...about.milestones.items].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}
