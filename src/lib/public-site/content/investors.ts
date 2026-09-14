/**
 * Investor-relations copy: one consolidated page at `/investor-relations/`
 * (product owner, 2026-09-13). The investor overview, Growth Strategy,
 * Advanced Therapeutics, Disclosures and the investor-document directory
 * became sections of it; Acquisitions and Company News stay as supporting
 * pages, linked from here.
 *
 * The page answers five questions in order: what the group operates today,
 * how it earns revenue, where growth can come from, what has to happen to
 * deliver it, and where an investor obtains supporting information.
 *
 * The reported figures, the contact, and the financing-presentation date
 * were approved as already published (S-60, S-61) and are carried verbatim
 * with their basis beside them. WEB-05 (financing and public-market
 * narrative; public versus confidential document list) is unfilled, so no
 * financing amount, target, allocation, valuation, share count, listing,
 * structure, or counterparty is named (S-63, S-65); documents are an index
 * with a request step and no file (S-64). Every proposed activity is
 * written as proposed, every regulated option as under evaluation, and the
 * forward-looking qualification sits in the disclosures section with a
 * permanent anchor. No revenue mechanism is stated where none is
 * established: repeat purchasing is never called subscription or contracted
 * revenue, and no portal fee or service charge is assumed.
 */

import { businesses } from "./businesses";

export type BusinessStatus = "Operating" | "In development" | "Under evaluation" | "Not offered";

export const investorRelations = {
  eyebrow: "Investor relations",
  title: "An established medical-supply business. A focused plan for expansion.",
  description: [
    "LifeSupply Health Inc. brings together online medical and home-care supply businesses in Canada and the United States, alongside clinic-development and equipment services in British Columbia.",
    "Its growth strategy builds on these operations through stronger purchasing and fulfilment capabilities, deeper relationships with professional buyers, complementary acquisitions, and the development of new supply services.",
  ],
  actions: {
    primary: "investor_materials",
    secondaryLabel: "Explore the growth strategy",
    secondaryHref: "#growth-strategy",
  },
  contact: { email: "invest@lifesupply.com", phone: "604-677-4146" },
  /** The in-page navigation, and the order the sections run in. */
  sections: [
    { href: "#business", label: "Business" },
    { href: "#market-demand", label: "Market" },
    { href: "#financial-information", label: "Annual report" },
    { href: "#growth-strategy", label: "Growth" },
    { href: "#execution", label: "Execution" },
    { href: "#materials", label: "Materials" },
    { href: "#contact", label: "Contact" },
  ],

  /** Approved (published since PR #60/#61): the reported figures, with their basis. */
  expansionContext: {
    date: "August 25, 2026",
    title: "Expansion strategy",
    description:
      "A financing presentation of this date sets out proposed metabolic-health and therapeutics expansion themes. Those themes depend on board approval, regulatory requirements, investor suitability, and final terms. No offering is made on this site, and no terms are published here.",
  },

  /**
   * Two photographic divider bands (product owner, 2026-09-13): one after
   * the figures, closing the operating half of the page, and one before the
   * materials, opening the supporting-information half. Each statement is
   * drawn from facts already on the page; the photographs are conceptual and
   * decorative.
   */
  bands: {
    foundation: {
      graphic: "warehouse",
      eyebrow: "The operating base",
      statement:
        "Three online supply stores and a clinic-development business. Every priority that follows builds on them.",
    },
    materials: {
      graphic: "facade",
      eyebrow: "Supporting information",
      statement:
        "Plans with their status. Materials, including the annual report, shared with shareholders on request.",
    },
  },

  /** 1. What the group operates today. */
  business: {
    eyebrow: "Operating foundation",
    title: "An operating foundation across two markets.",
    intro:
      "The current business is three online supply stores and a clinic-development service. Each is described on its own page; this is what they add up to.",
    items: [
      {
        graphic: "businessStores",
        title: "Canadian online supply stores",
        text: "LifeSupply and Wellmart Medical sell medical, health, and home-care products to individuals, caregivers, and professional buyers across Canada.",
        status: "Operating",
      },
      {
        graphic: "businessUs",
        title: "U.S. online supply business",
        text: "Balkowitsch Worldwide serves the U.S. market with medical, health, and wellness supplies, in U.S. dollars.",
        status: "Operating",
      },
      {
        graphic: "businessClinic",
        title: "Clinic development and equipment in British Columbia",
        text: "LifeSupply Clinics plans, builds, and equips clinics for projects in British Columbia, which brings equipment and opening-supply requirements into view.",
        status: "Operating",
      },
    ],
    links: [
      { action: "explore_businesses", label: "Medical Supplies" },
      { action: "clinic_solutions", label: "Clinic Solutions" },
    ],
  },

  /**
   * 2. Market demand: the market-context section of Medical Supplies, carried
   * here unchanged under the owner's heading for this page (2026-09-13). The
   * copy and every figure on the chart are the ones recorded for that page,
   * so the two sections can never drift apart.
   */
  market: {
    ...businesses.hub.market,
    eyebrow: "Market demand",
  },

  /** 3. The reported result, once, with its basis directly beneath. */
  /**
   * 3. Financial information. No figure is published on this site (product
   * owner, 2026-09-14): the annual report is available to shareholders on
   * request, and the request goes to Investor Relations with its subject.
   */
  financials: {
    eyebrow: "Financial information",
    title: "The annual report is available to shareholders on request.",
    text: "LifeSupply does not publish financial figures on this site. Shareholders can request the annual report for the year ended December 31, 2025 from Investor Relations, and the other investor materials are listed further down this page.",
    action: "request_annual_report",
    actionLabel: "Request the annual report",
    /** The expansion-strategy cover rendering beneath the text (product owner, 2026-09-14). */
    graphic: "expansionCover",
  },

  /** 3. How the business earns revenue, and how it could extend. */
  model: {
    eyebrow: "Business model",
    title: "How the business operates, and how it could expand.",
    intro:
      "Revenue comes from product sales and project work today. The proposed extensions would build on the same customers and supply relationships, and each is shown with its status.",
    labels: { activity: "Activity", role: "Commercial role", status: "Status" },
    rows: [
      {
        activity: "Online product sales",
        role: "Medical, health, and home-care purchases through the operating stores.",
        status: "Operating",
      },
      {
        activity: "Clinic projects and equipment",
        role: "Project-related services and equipment requirements for clinics in British Columbia.",
        status: "Operating",
      },
      {
        activity: "Professional supply relationships",
        role: "Recurring purchasing by clinics and organizations through the stores today; proposed account capabilities such as approved product lists and repeat-order workflows are in development.",
        status: "Operating purchasing; proposed account capabilities",
      },
      {
        activity: "Pharmacy and metabolic-health supply services",
        role: "Proposed configurations, kitting, fulfilment, and non-clinical support for pharmacies and programs.",
        status: "In development",
      },
      {
        activity: "Dedicated purchasing portals",
        role: "Proposed organization-specific ordering and administration tools for clinics and healthcare organizations.",
        status: "Proposed, subject to confirmation",
      },
    ],
    /**
     * Repeat demand is not contracted revenue, and nothing here assumes a
     * fee that has not been agreed.
     */
    note: "Repeat customer demand, consumable replenishment, and longer-term business relationships are different from contractual recurring revenue. No portal fee, service charge, or contracted revenue is assumed before the commercial model for each extension is established.",
  },

  /** 4. Where growth can come from: five priorities, in order. */
  growth: {
    eyebrow: "Growth priorities",
    title: "Grow the core business. Extend the customer relationship.",
    intro:
      "Five priorities, each building on the operating base. The first two concern the business as it runs today; the other three are development directions with their status stated.",
    priorities: [
      {
        index: "01",
        title: "Strengthen the existing stores",
        text: "Improve the performance of the operating businesses through better product information, sourcing, purchasing discipline, and fulfilment processes.",
        points: [
          "Product information and catalogue quality",
          "Supplier sourcing",
          "Purchasing and margin management",
          "Fulfilment performance",
          "Customer service and repeat purchasing",
        ],
        status: "Operating",
        link: { action: "explore_businesses", label: "Medical Supplies" },
      },
      {
        index: "02",
        title: "Expand clinic and organizational purchasing",
        text: "Build deeper relationships with clinics and healthcare organizations by understanding their routine supply needs and developing purchasing arrangements around how they operate: agreed catalogues, repeat-order workflows, and location-specific requirements in place of one-off purchases.",
        points: [],
        status: "Operating purchasing; proposed arrangements",
        link: {
          action: "institutional_purchasing_section",
          label: "Clinic and institutional purchasing",
        },
      },
      {
        index: "03",
        title: "Develop technology and purchasing intelligence",
        text: "Use better product, purchasing, and supplier information to support demand planning, more efficient ordering, and earlier identification of potential supply disruptions.",
        secondary:
          "Dedicated supply portals could extend these capabilities to organizational customers, with approved catalogues, purchasing permissions, and recurring-order tools. Pricing management would relate prices to supplier costs, purchasing terms, and agreed customer pricing rather than to any other factor.",
        points: [
          "Demand analysis",
          "Supplier availability and lead-time information",
          "Supply-risk identification",
          "Replenishment reminders and draft orders",
          "Pricing management",
          "Dedicated purchasing portals",
        ],
        status: "In development",
        link: { action: "supply_planning_section", label: "Proposed supply-planning capabilities" },
      },
      {
        index: "04",
        title: "Develop new supply services",
        text: "Pharmacy supply programs would let a pharmacy support its patients with pharmacist-selected, non-drug supplies that LifeSupply configures and fulfils under an agreed scope, with medication excluded.",
        secondary:
          "Metabolic-health supply services would provide starter equipment, usage-driven consumables, clinic procurement, kitting, and non-clinical workflow support for clinics, pharmacies, and programs on metabolic-health pathways. Neither service is offered until its scope and terms are confirmed.",
        points: [],
        status: "In development",
        links: [
          { action: "pharmacy_hub", label: "Pharmacy Solutions" },
          { action: "metabolic_hub", label: "Metabolic Health Solutions" },
          { action: "connected_care", label: "Connected Care Vision" },
        ],
      },
      {
        index: "05",
        title: "Pursue complementary acquisitions",
        text: "Acquisitions are considered where a business adds something the operating stores can use, and where there is a credible reason to bring it together with them.",
        points: [
          "Relevant products or customers",
          "Geographic reach",
          "Supplier relationships",
          "Operational capabilities",
          "A credible integration rationale",
        ],
        status: "Under evaluation",
        link: { action: "acquisitions_page", label: "Acquisitions & Strategic Opportunities" },
      },
    ],
    /** The one visual for the technology priority: three plain steps, typeset. */
    technology: {
      title: "From information to better purchasing decisions",
      steps: [
        {
          graphic: "technologyInformation",
          title: "Better information",
          text: "Product data, purchasing history, supplier availability, and lead times.",
        },
        {
          graphic: "technologyMonitoring",
          title: "Planning and monitoring",
          text: "Demand estimates and earlier sight of potential supply risks.",
        },
        {
          graphic: "technologyOrdering",
          title: "Easier ordering",
          text: "Replenishment reminders, draft orders, and, for organizations, dedicated portals.",
        },
      ],
      note: "A development direction. None of these capabilities is offered until its implementation is confirmed.",
    },
  },

  /** 5. What has to happen to deliver it: four phases, all planned. */
  execution: {
    eyebrow: "Execution roadmap",
    title: "A phased approach to development.",
    intro:
      "Each developing program moves through the same four phases, and each phase has to produce its evidence before the next begins. That is why no launch date is published: the gate is what the work shows, not what a calendar says.",
    labels: { phase: "Phase", purpose: "Purpose", evidence: "Evidence before progressing" },
    statusLabel: "Planned",
    phases: [
      {
        index: "01",
        title: "Define",
        purpose: "Establish customer requirements and commercial scope.",
        evidence: "Defined products, responsibilities, data needs, and operating assumptions.",
      },
      {
        index: "02",
        title: "Pilot",
        purpose: "Test a limited arrangement with designated participants.",
        evidence: "Verified workflows, fulfilment performance, and customer feedback.",
      },
      {
        index: "03",
        title: "Launch",
        purpose: "Introduce a confirmed offering.",
        evidence: "Operational readiness and agreed commercial terms.",
      },
      {
        index: "04",
        title: "Expand",
        purpose: "Extend what works to additional customers or locations.",
        evidence: "Repeatable service delivery and sufficient capacity.",
      },
    ],
    status:
      "All four phases are planned. No developing program has completed a pilot, and nothing described here is available to buy.",
    /**
     * What development may require, in kind only. No financing target,
     * allocation, valuation, or offering term is published (WEB-05).
     */
    capital: {
      title: "What development would require",
      text: "Developing these priorities would call for investment in systems, operating capacity, and working capital, and appropriately scoped funding for any acquisition. The amount and form of any financing are not published on this site.",
    },
  },

  /** 6. Longer-term regulated opportunities, under evaluation and not offered. */
  longerTerm: {
    eyebrow: "Longer-term opportunities",
    title: "Additional healthcare capabilities under evaluation.",
    intro:
      "LifeSupply is also evaluating whether selected regulated healthcare capabilities could complement its supply business. These opportunities are separate from the company’s current operations and its proposed non-drug supply programs.",
    labels: { role: "Potential role", dependencies: "Principal dependencies" },
    options: [
      {
        title: "Licensed pharmacy operations",
        status: "Under evaluation",
        role: "Whether LifeSupply should hold licensed pharmacy operations of its own, rather than only supply pharmacies that others run.",
        dependencies:
          "Provincial or state pharmacy licensing, qualified pharmacist ownership and staffing where required, regulatory approvals, and financing.",
      },
      {
        title: "Specialty and compounding",
        status: "Under evaluation",
        role: "Compounded preparations for specific programs.",
        dependencies:
          "Compounding standards and facility requirements, pharmacy licensing, regulatory approvals, and financing.",
      },
      {
        title: "Peptide synthesis and research",
        status: "Under evaluation",
        role: "A research-stage synthesis capability.",
        dependencies:
          "Research partners and facilities, regulatory classification of any output, and financing.",
      },
      {
        title: "Regulated manufacturing",
        status: "Under evaluation",
        role: "Regulated manufacturing of products for the group’s own channels.",
        dependencies:
          "Manufacturing licences and quality systems, facility and equipment, regulatory approvals, and financing.",
      },
    ],
    statement:
      "These activities are under evaluation and are not currently offered by LifeSupply. None is licensed or scheduled, no regulatory outcome is predicted, and any progress would be published here with its date.",
  },

  /**
   * 7. Supporting information: the document directory, moved here from
   * Company News (2026-09-13). Each record names what it is, its period or
   * date, what it contains, and how it is obtained. Nothing is downloadable
   * from this site except through the governed published list; the three
   * static records are shared through investor relations, with the
   * recipient and any confidentiality terms settled first.
   */
  materials: {
    eyebrow: "Investor materials",
    title: "Supporting information for investors.",
    intro:
      "Three materials are held for investors. Each is shared through investor relations, with the recipient and any confidentiality terms settled first; none is downloadable here.",
    labels: { date: "Period or date", access: "Access" },
    records: [
      {
        title: "Annual-report narrative",
        date: "Year ended December 31, 2025",
        category: "Restricted, on request",
        note: "Source of the unaudited consolidated figures shown on this page.",
        action: "request_annual_report",
      },
      {
        title: "Financing presentation",
        date: "August 25, 2026",
        category: "Restricted, on request",
        note: "Outlines proposed expansion themes; subject to suitability, disclosure, board approval, regulatory requirements, and final terms.",
        action: "request_financing_presentation",
      },
      {
        title: "Investor presentation",
        date: "May 2022",
        category: "Historical",
        note: "Earlier corporate presentation from the prior website, kept for the record. It describes the business as it was in 2022 and is not a current statement of plans.",
        action: "request_historical_presentation",
      },
    ],
    published: {
      title: "Published public documents",
      empty: "There is no public document here yet.",
      unavailable:
        "The published document list is temporarily unavailable. The records above are unaffected.",
      download: "Download",
    },
    requestNote:
      "Requests are answered by investor relations. Restricted materials are provided only to suitable recipients and are not distributed through this site.",
  },

  /** 8. The next action, and the supporting pages. */
  contactSection: {
    eyebrow: "Investor contact",
    title: "Discuss LifeSupply’s business and growth plans.",
    text: "Contact Investor Relations to request supporting materials or discuss the company’s operating business and proposed expansion.",
    channel: "Investor Relations",
    /** The photograph that fades into the block's charcoal beside the channel (owner, 2026-09-13). */
    graphic: "newsDesk",
    primary: "investor_materials",
    secondary: [
      { action: "acquisitions_page", label: "Acquisitions & Strategic Opportunities" },
      { action: "news_resources", label: "Company News" },
    ],
  },

  /** The full disclosure text, on a permanent anchor. */
  disclosures: {
    eyebrow: "Disclosures",
    title: "Basis of the information on this page.",
    figures:
      "No financial figures are published on this site. The annual report for the year ended December 31, 2025 is available to shareholders on request from Investor Relations, and nothing on this page should be read as a statement of results.",
    forwardLooking: {
      title: "Forward-looking statements",
      text: "Statements on this site about programs in development, opportunities under evaluation, expansion themes, and possible transactions are forward-looking. They are based on current plans and assumptions, depend on approvals, financing, regulatory requirements, market conditions, and transaction terms that are not in place, and may not occur. They are not guarantees, and LifeSupply undertakes no obligation to update them except as required.",
    },
    offering:
      "Nothing on this site is an offer to sell or a solicitation of an offer to buy any security, and no investment decision should be made on the basis of this site alone.",
  },

  /**
   * Unpublished since 2026-09-13: the dated public record that Growth
   * Strategy carried. The four 2022 announcements are on Company News with
   * their sources, and the two later records are on this page where each
   * belongs (the figures under Financials, the presentation under
   * Materials), so listing them again here repeated both.
   */
  record: {
    eyebrow: "Dated public record",
    title: "What has been published, by date.",
    items: [
      { date: "April 5, 2022", text: "Acquisition of Smart Move Medical assets announced." },
      { date: "May 11, 2022", text: "Distribution partnership with Ortho Active expanded." },
      {
        date: "June 14, 2022",
        text: "Distribution arrangement with Mothers Choice Products announced.",
      },
    ],
  },
} as const;
