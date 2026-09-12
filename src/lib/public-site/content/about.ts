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
    /** Rewritten 2026-09-12: what the business is, and what it is building. */
    title: "An established supply business. Building broader healthcare capabilities.",
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
    eyebrow: "A message from our Chairman & CEO",
    title: "Meet LifeSupply.",
    description:
      "Abdul Ladha introduces LifeSupply Health, its operating businesses, and the company’s direction.",
    playLabel: "Watch the company introduction",
    /**
     * Unpublished since 2026-09-12 (product owner): a technical explanation
     * of how the embed loads is not page copy. The behaviour it described is
     * unchanged and is asserted in the browser suite -- nothing is requested
     * from YouTube until the visitor presses play.
     */
    note: "Plays from YouTube's privacy-enhanced player when you press play; nothing is loaded from YouTube before that.",
    watchLabel: "Open on YouTube",
  },
  /**
   * Purpose, with the mission and vision beneath it (product owner,
   * 2026-09-12). The vision keeps the approved claim word for word -- a
   * global leader in the online sale and distribution of health and medical
   * products and related services -- and says what it is built on.
   */
  purpose: {
    eyebrow: "Our purpose",
    title: "Help customers access the products and services they need.",
  },
  mission:
    "To make medical, health, and related supplies easier to access through a broad product selection, competitive pricing, and technology that supports purchasing and service.",
  vision:
    "To become a global leader in the online sale and distribution of health and medical products and related services, building on established businesses and developing capabilities that support lasting customer relationships.",
  /**
   * The hero (product owner, 2026-09-12): what the group is, then what it is
   * building on that. `heroSummary` is kept because the page previously read
   * from it; the hero now renders `heroParagraphs`.
   */
  heroParagraphs: [
    "LifeSupply Health Inc. is a Canadian company bringing together online medical and home-care supply businesses in Canada and the United States, alongside clinic planning, development, and equipment services in British Columbia.",
    "Our operating businesses provide the foundation for the next phase of growth: improving how customers purchase supplies, developing new services for clinics and pharmacies, and pursuing complementary acquisitions.",
  ],
  /** Unpublished since 2026-09-12; kept on the record. */
  heroSummary:
    "A Canadian group with more than 25 years of operations. It sells health, safety, medical and industrial products online, builds and equips clinics in British Columbia, and is developing two supply programs on that base.",
  growth:
    "Four things carry the strategy: margin discipline in the existing supply business, technology in ordering and fulfilment, complementary businesses that fit the model, and more depth in both Canada and the United States.",

  /**
   * Footprint. Stage 2 draft from observed store facts: two Canadian
   * storefronts pricing in CAD, a clinic-development site serving British
   * Columbia projects, and a U.S. storefront pricing in USD (S-52, S-72,
   * S-80–S-88). No office, warehouse, or entity claim beyond what is
   * published elsewhere on this site.
   */
  /**
   * The corporate structure, moved here from Contact on 2026-09-10 (website
   * consolidation, stage 4). About is the page that carries identity, history
   * and footprint, so the explanation of what the company legally is belongs
   * with them; Contact keeps the entity names and their channels, which is
   * what a visitor deciding who to write to actually needs.
   *
   * Set out as in the consolidated financial statements for the year ended
   * December 31, 2025. Brand architecture is kept separate from legal
   * structure: the four customer-facing brands do not map one-to-one onto the
   * companies.
   */
  structure: {
    eyebrow: "Corporate structure",
    title: "One parent company, three wholly-owned subsidiaries.",
    text: "LifeSupply Health Inc. is the parent company, and it owns three operating subsidiaries outright: Wellmart Health Supplies Ltd. in Canada, LifeSupply US, Inc. in the United States, and Balkowitsch Enterprises Inc. The customer-facing brands sit on top of that structure rather than mirroring it, so a brand name and a company name are not the same thing.",
    note: "The structure is as at December 31, 2025. Each company's contact channel is listed on the Contact page.",
    action: "contact_directory",
  },

  /**
   * The footprint is stated country by country (product owner, 2026-09-12)
   * rather than as one paragraph. Each brand is named where it operates, and
   * the names are the registry's: Balkowitsch Worldwide is the store,
   * Balkowitsch Enterprises Inc. the company that was acquired.
   */
  footprint: {
    eyebrow: "Footprint",
    title: "Canada and the United States.",
    regions: [
      {
        name: "Canada",
        text: "LifeSupply.ca and Wellmart Medical serve Canadian customers through their online stores. LifeSupply Clinics supports clinic planning, development, and equipment requirements for projects in British Columbia.",
      },
      {
        name: "United States",
        text: "Balkowitsch Worldwide serves the U.S. market through its online medical, health, and wellness supply business.",
      },
    ],
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
    title: "Acquisitions, appointments, partnerships and results.",
    note: "Oldest first.",
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
        date: "2025",
        sortKey: "2025-00-01",
        text: "More than 25 years of operations, more than 50,000 products, and more than 1 million customers served cumulatively since inception, not a count of current customers.",
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
    eyebrow: "Solutions development",
    title: "New supply programs for clinics and pharmacies.",
    /**
     * The strategy statement, after the prior About page's "Our growth
     * strategy" (product owner, 2026-09-09), stated as strategy and objective
     * rather than as transactions under way. Each opportunity then carries
     * its own discussion inside its card (laid out in two columns on
     * 2026-09-09 at the product owner's request). Nothing here is offered as
     * available.
     */
    lead: "LifeSupply is developing two complementary offerings focused on non-drug supplies and fulfilment. Both build on the group’s existing commerce and clinic-related capabilities.",
    /**
     * Unpublished since 2026-09-12 (product owner), when this section was
     * rewritten as Solutions development. It is the approved growth-strategy
     * paragraph after the prior About page's "Our growth strategy"; kept on
     * the record so it can be restored verbatim if it is wanted again.
     */
    growthStrategy:
      "The growth strategy is to acquire profitable operations that complement the existing business model. The objective is to integrate strategically located bricks-and-mortar medical supply stores, pharmacies, clinics, and distributors into current operations. Each one would widen the inventory LifeSupply can draw on, and with it the products and services offered online in Canada and the United States.",
    intro: "A closer look at the two programs in development above.",
    items: [
      {
        key: "metabolic",
        title: "Metabolic Health Solutions",
        status: "In development",
        text: "Proposed supply support for clinics and pharmacies serving metabolic-health programs.",
        detail:
          "The offering is being developed around configurable patient supplies, clinic procurement, kitting, fulfilment, and non-clinical workflow support. Initial equipment and supplies would be considered separately from consumables that need replenishment as they are used.",
        cta: "Explore Metabolic Health Solutions",
      },
      {
        key: "pharmacy",
        title: "Pharmacy Solutions",
        status: "In development",
        text: "Proposed fulfilment support for pharmacist-selected, non-drug products.",
        detail:
          "The offering would help participating pharmacies arrange supply support for their customers. Product selection, ordering processes, replenishment responsibilities, and commercial terms would be defined with each participating pharmacy before launch.",
        cta: "Explore Pharmacy Solutions",
      },
    ],
    /**
     * Restored to the page on 2026-09-12 in the product owner's own words.
     * The section no longer carries "under evaluation" in its title, so this
     * line is what states plainly that neither programme can be bought.
     */
    note: "These programs are not yet available.",
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
  /**
   * The next phase (product owner, 2026-09-12), rewritten from "Growth
   * direction". A short headline, the sentence that frames it, and two
   * paragraphs. Everything stays conditional: a clinic project "can create"
   * opportunities, and the two programs are still only in development.
   */
  direction: {
    eyebrow: "The next phase",
    title: "Build deeper relationships from an established supply business.",
    lead: "LifeSupply’s online stores and clinic services provide the foundation for broader customer relationships.",
    paragraphs: [
      "A clinic project can create opportunities for equipment purchasing and ongoing supplies. Existing supply capabilities also provide a starting point for the pharmacy and metabolic-health programs now in development.",
      "Our focus is on developing these opportunities through the group’s operating businesses, customer relationships, and complementary acquisitions. New services will require their own delivery arrangements and commercial terms.",
    ],
  },
  /**
   * The About page, rewritten on 2026-09-12 at the product owner's direction.
   * It tells the operating business first, then separates what is being built
   * from what is only being assessed, so the story is not interrupted by
   * repeated statements of what the group does not do. Each boundary is
   * stated once, beside the activity it applies to.
   *
   * Every fact is one the site already carried. The three figures are the
   * 2025 annual report's, with the cumulative qualification kept; the store
   * roles and the clinic scope are the brand registry's; and the two supply
   * programs and the four regulated activities keep the statuses the program
   * architecture gave them.
   */
  foundation: {
    eyebrow: "Our foundation",
    title: "Established businesses. Experience across two markets.",
    /** The standfirst, under the title (product owner, 2026-09-12). */
    lead: "LifeSupply brings together businesses with more than 25 years of operating history.",
    paragraphs: [
      "The acquisition of Wellmart Health Supplies in 2020 established the group’s Canadian operating base. The acquisition of Balkowitsch Enterprises in 2023 extended its reach into the United States, adding established customer and distributor relationships.",
      "Today, the group combines online product sales with clinic-development and equipment services, providing several ways to serve healthcare businesses and customers.",
    ],
    metrics: [
      {
        label: "Operating history",
        value: "25+ years",
        caption: "across the group’s businesses",
      },
      {
        label: "Product range",
        value: "50,000+ products",
        caption: "reported across the group",
      },
      {
        label: "Customers served",
        value: "1 million+",
        caption: "cumulatively since inception",
      },
    ],
    source:
      "Source: LifeSupply’s 2025 Annual Report. Customer figures are cumulative and do not represent current active customers.",
  },

  operations: {
    eyebrow: "Our operations",
    title: "What we do today.",
    blocks: [
      {
        key: "stores",
        title: "Online medical and related supplies",
        lead: "LifeSupply’s online stores serve customers across Canada and the United States. Their respective product ranges include medical, health, home-care, safety, and industrial supplies.",
        items: [
          "LifeSupply.ca serves Canadian customers with medical, health, and home-care products, including supplies for professional settings.",
          "Wellmart Medical serves Canadian customers with home medical equipment and everyday care supplies.",
          "Balkowitsch Worldwide serves the U.S. market with medical, health, wellness, and related products.",
        ],
        note: "Each store manages its own product selection, pricing, customer accounts, and support. Canadian stores price in Canadian dollars; Balkowitsch prices in U.S. dollars.",
        action: "explore_businesses",
        cta: "Explore medical supply businesses",
      },
      {
        key: "clinics",
        title: "Clinic planning, development, and equipment",
        lead: "LifeSupply Clinics supports projects in British Columbia through planning, design, construction and fit-out coordination, and equipment supply.",
        items: [
          "The business helps clinic owners address the practical requirements of establishing or improving their premises, working with project partners to define and deliver the required scope.",
        ],
        note: "LifeSupply’s role is developing and equipping clinic premises. Patient care remains the responsibility of the clinic operator and its healthcare professionals.",
        action: "clinic_solutions",
        cta: "Explore clinic solutions",
      },
    ],
  },

  priorities: {
    eyebrow: "Our development priorities",
    title: "Building new supply services around existing capabilities.",
    lead: "LifeSupply is developing two offerings that extend its supply capabilities into more structured relationships with clinics and pharmacies.",
    items: [
      {
        key: "metabolic",
        title: "Metabolic Health Solutions",
        status: "In development",
        summary:
          "Proposed non-drug supply services for clinics and pharmacies supporting metabolic-health programs.",
        detail:
          "The offering is being developed around configurable patient supplies, clinic procurement, kitting, fulfilment, and non-clinical workflow support. It would distinguish initial equipment needs from consumables that require replenishment as they are used.",
        boundary:
          "Participating healthcare providers would retain responsibility for clinical decisions and patient care.",
        cta: "Explore Metabolic Health Solutions",
      },
      {
        key: "pharmacy",
        title: "Pharmacy Solutions",
        status: "In development",
        summary:
          "Proposed supply and fulfilment services for pharmacist-selected, non-drug products.",
        detail:
          "The offering would support participating pharmacies in arranging product supply for their customers. Product selection, ordering processes, replenishment responsibilities, and commercial terms would be established with each pharmacy before launch.",
        boundary: null,
        cta: "Explore Pharmacy Solutions",
      },
    ],
    note: "These programs are not yet available, and no launch date has been set. Medication and dispensing are outside their proposed scope.",
  },

  longerTerm: {
    eyebrow: "Longer-term opportunities",
    title: "Evaluating additional healthcare capabilities.",
    lead: "Alongside its supply-service development, LifeSupply is assessing opportunities in regulated healthcare activities. These represent potential future capabilities and are separate from the group’s existing operations and proposed non-drug supply programs.",
    items: [
      {
        title: "Licensed pharmacy operations",
        text: "Evaluating whether owning or operating a licensed pharmacy could complement the group’s broader business.",
      },
      {
        title: "Specialty and compounding services",
        text: "Assessing potential pharmacy capabilities involving compounded preparations, subject to the applicable professional standards and regulatory requirements.",
      },
      {
        title: "Peptide synthesis and research",
        text: "Exploring the potential for research partnerships and synthesis capabilities, including the facilities, expertise, and resources such activities would require.",
      },
      {
        title: "Regulated manufacturing",
        text: "Assessing whether manufacturing capabilities could form part of a future expansion beyond product distribution.",
      },
    ],
    note: "These activities are under evaluation and are not currently offered by LifeSupply. Any decision to proceed would depend on a viable business case, appropriate funding, qualified personnel, suitable facilities, and the required licences and authorizations.",
    cta: "Learn about advanced therapeutics opportunities",
  },

  approach: {
    eyebrow: "Our approach to growth",
    title: "Strengthen the business. Extend its capabilities.",
    lead: "LifeSupply’s growth strategy starts with the performance of its existing operations.",
    items: [
      {
        title: "Improve operating performance",
        text: "Strengthen purchasing, product selection, margin management, and fulfilment across the operating businesses.",
      },
      {
        title: "Use technology to improve service",
        text: "Develop more effective ordering and operational processes that support customers and improve how the businesses work.",
      },
      {
        title: "Pursue complementary acquisitions",
        text: "Seek businesses that can broaden the group’s product range, extend its geographic reach, or add relevant capabilities and customer relationships.",
      },
      {
        title: "Develop recurring supply relationships",
        text: "Build opportunities to support ongoing clinic and pharmacy supply needs, with service responsibilities and commercial terms defined for each offering.",
      },
    ],
    cta: "Explore our growth strategy",
  },

  connect: {
    eyebrow: "Connect with LifeSupply",
    title: "Learn more about the business and its next phase.",
    lead: "Explore our operating businesses, review our growth strategy, or contact the team about a business or investment enquiry.",
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
