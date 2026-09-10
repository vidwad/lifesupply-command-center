/**
 * Investor-relations copy for Stage 5 (guide §3: the hub and its five
 * children). The hub's title, description, contact, current-report figures,
 * and expansion context were approved as already published (S-60, S-61) and
 * are carried verbatim. Everything else is a Stage 5 draft built only from
 * verified register rows.
 *
 * WEB-05 (financing and public-market narrative; public versus confidential
 * document list) arrived unfilled. Treatment: no financing amount, issue
 * price, valuation, share count, listing, exchange, structure, or
 * counterparty is named (S-63, S-65); documents are an index of metadata
 * with a request step and no files (S-64); the deck preview image is no
 * longer rendered because its date could not be established (S-64). Every
 * growth item carries its own status and the forward-looking qualification
 * sits beside the claims it qualifies.
 */

export type BusinessStatus = "Operating" | "In development" | "Under evaluation" | "Not offered";

export const investorRelations = {
  // Approved (published since PR #60/#61).
  title: "Investor information, presented with context.",
  description:
    "The investor section presents current annual-report context alongside historical news and materials, with a clear distinction between disclosed information, forward-looking statements, and offering-specific content.",
  contact: { email: "invest@lifesupply.com", phone: "604-677-4146" },
  currentReport: {
    period: "Year ended December 31, 2025",
    status: "Unaudited consolidated financial information, prepared under IFRS",
    entity: "LifeSupply Health Inc., consolidated",
    currency: "Canadian dollars",
    highlights: [
      { label: "Net sales", value: "C$6.75M" },
      { label: "Gross profit", value: "C$2.20M" },
      { label: "Net income", value: "C$284K" },
    ],
  },
  expansionContext: {
    date: "August 25, 2026",
    title: "Expansion strategy",
    description:
      "A financing presentation of this date sets out proposed metabolic-health and therapeutics expansion themes. Those themes depend on board approval, regulatory requirements, investor suitability, and final terms. No offering is made on this site, and no terms are published here.",
  },

  // Stage 5 draft: the hub's structure.
  hub: {
    eyebrow: "Investor relations",
    rationale: {
      eyebrow: "The business today",
      title: "Operating commerce first; expansion built on it.",
      items: [
        {
          title: "Operating foundation",
          text: "Two Canadian storefronts, a U.S. storefront, and clinic-development services deliver the current business and the figures reported below.",
          status: "Operating",
        },
        {
          title: "Clinic relationships",
          text: "Clinic development, equipment, and ongoing procurement give the group a path from a project to a supply account.",
          status: "Operating",
        },
        {
          title: "Metabolic-health supply services",
          text: "Non-drug supplies, kitting and fulfilment, and contracted workflow support for programs. No program is purchasable yet.",
          status: "In development",
        },
        {
          title: "Regulated development and selective transactions",
          text: "Pharmacy, compounding, peptide synthesis and research, manufacturing, and complementary acquisitions are staged opportunities with individually stated status.",
          status: "Under evaluation",
        },
      ],
    },
    forwardLooking:
      "Statements about expansion, programs in development, and opportunities under evaluation are forward-looking. They depend on approvals, financing, regulatory requirements, and transaction terms that are not in place, and they may not occur.",
    sections: [
      {
        route: "operations",
        title: "The business today",
        text: "The four operating businesses, their markets, and what each one does.",
        linkLabel: "Explore the operating businesses",
      },
      {
        route: "growthStrategy",
        title: "Growth strategy",
        text: "The five strands and the status of each, and the business case for the two in development.",
        linkLabel: "Read the growth model",
      },
      {
        route: "advancedTherapeutics",
        title: "Conditions for execution",
        text: "Four regulated options under evaluation, each with what it depends on before it could proceed.",
        linkLabel: "Review the conditions",
      },
      {
        route: "news",
        title: "News & resources",
        text: "Company news, investor documents, and the historical record.",
        linkLabel: "Open news and documents",
      },
      {
        route: "disclosures",
        title: "Disclosures",
        text: "The reported figures with their scope, and the forward-looking basis.",
        linkLabel: "See the reported figures",
      },
    ],
    actions: ["investor_materials", "growth_strategy"],
  },

  growthStrategy: {
    eyebrow: "Investor relations · Growth strategy",
    title: "Five strands, each with its own status.",
    intro:
      "The public strategy combines improvement of the existing business, clinic accounts, metabolic supply and services, regulated development, and selective transactions. Each strand is listed with where it stands today. Dates appear only where a public record exists.",
    strands: [
      {
        title: "Existing business improvement",
        text: "Catalogue quality, sourcing, fulfilment, and management systems across the operating stores.",
        status: "Operating",
        route: "operations",
      },
      {
        title: "Clinic accounts",
        text: "Clinic development that can lead to equipment and opening supplies, and existing clinics that become supply customers without a project.",
        status: "Operating",
        route: "clinicSolutions",
      },
      {
        title: "Metabolic supply and services",
        text: "Eight configurable pathways, clinic procurement, and contracted non-clinical fulfilment and workflow services.",
        status: "In development",
        route: "metabolic",
      },
      {
        title: "Regulated development",
        text: "Pharmacy, specialty and compounding, peptide synthesis and research, and manufacturing, considered separately.",
        status: "Under evaluation",
        route: "advancedTherapeutics",
      },
      {
        title: "Selective transactions",
        text: "Complementary acquisitions and strategic arrangements that fit the platform.",
        status: "Under evaluation",
        route: "acquisitions",
      },
    ],
    /**
     * The growth business case (website improvement program, 2026-09-09):
     * for each opportunity being developed, who it serves, what is proposed,
     * which existing capability supports it, and what must be confirmed
     * before it progresses. Drafted with Codex against the evidence
     * register. No revenue mechanism is stated where terms are not
     * established, no date is given, and nothing here is offered.
     */
    development: {
      eyebrow: "The business case",
      title: "What is being developed, and what each depends on.",
      intro:
        "Two supply opportunities are being developed on the existing operating base. Each is described by who it would serve, what is proposed, the capability it builds on, and what has to be confirmed before it can progress.",
      labels: {
        customer: "Intended customer",
        proposal: "Proposed service",
        capability: "Existing capability it builds on",
        conditions: "Before it can progress",
      },
      items: [
        {
          title: "Pharmacy supply programs",
          status: "In development",
          customer: "Pharmacies supporting patients on a care pathway.",
          proposal:
            "Pharmacist-selected non-drug supplies, onboarding and refill support, and fulfilment under an agreed scope. Medication is excluded.",
          capability:
            "The group's online medical-supply businesses in Canada and the United States, and the clinic supply route those stores already serve.",
          conditions:
            "Product selection, fulfilment responsibilities, service scope, and commercial terms are agreed in writing with each partner before anything runs. Until they are, there is nothing to buy and no price to quote.",
        },
        {
          title: "Metabolic-health supply services",
          status: "In development",
          customer:
            "Clinics, pharmacies, and programs supporting people on metabolic-health pathways.",
          proposal:
            "Starter equipment, usage-driven consumables, clinic procurement, kitting and fulfilment, and contracted non-clinical workflow support.",
          capability:
            "The same online supply businesses, and the clinic equipment work LifeSupply Clinics does for projects in British Columbia.",
          conditions:
            "Pathway contents, device compatibility, fulfilment capacity, and service scope have to be confirmed per program. Availability is published only as each pathway is confirmed.",
        },
      ],
      note: "Statements about these opportunities are forward-looking. They set no launch date, imply no funding commitment, and do not describe a service that can be bought today.",
    },

    /**
     * How management intends to move the developing work from design to scale
     * (round three, outcome 6). Drafted with Codex and edited before use.
     *
     * The shape of the sequence is publishable; the timings, clinic counts and
     * targets attached to it in the August 2026 materials are not, and none
     * appears here. Every stage is written as planned, not achieved.
     */
    execution: {
      eyebrow: "How it gets built",
      title: "The sequence, and where it currently stands.",
      intro:
        "The developing programs follow four steps. Each one has to produce evidence before the next begins, which is why no launch date is published: the gate is what the work shows, not what a calendar says.",
      stageLabel: "Planned step",
      stages: [
        {
          index: "01",
          title: "Design and de-risk",
          text: "Settle scope, the products a pathway needs, who is responsible for what, and where supply support stops and clinical care begins. Legal and operating requirements are worked out here rather than discovered later.",
        },
        {
          index: "02",
          title: "Controlled pilot",
          text: "Run the defined workflow with a small number of partners before anything is offered broadly. Procurement, kitting, fulfilment and non-clinical support are tested against real orders, with the clinical or pharmacy provider keeping every clinical decision.",
        },
        {
          index: "03",
          title: "Launch and integrate",
          text: "Take what the pilot proved and connect it to the commerce and fulfilment operations that already run: ordering, inventory, billing and reporting on one footing rather than as a side process.",
        },
        {
          index: "04",
          title: "Replicate and scale",
          text: "Extend only the parts that repeat reliably. Capacity, partner readiness and consistent service quality decide how far and how fast, one program at a time.",
        },
      ],
      gate: {
        title: "What has to be true before scaling",
        text: "Unit economics that hold, customers who stay, technology that carries the volume, and service quality that does not slip. Scaling follows those, not a date.",
      },
      status:
        "All four steps are planned. None of the developing programs has completed a pilot, and nothing described here is available to buy.",
    },

    record: {
      eyebrow: "Dated public record",
      title: "What has been published, by date.",
      note: "Only dated public records appear here. Plans, targets, and timelines that are not published are not listed.",
      items: [
        { date: "April 5, 2022", text: "Acquisition of Smart Move Medical assets announced." },
        {
          date: "April 21, 2022",
          text: "Dr. Margaret Clarke appointed to the Board of Directors.",
        },
        { date: "May 11, 2022", text: "Distribution partnership with Ortho Active expanded." },
        {
          date: "June 14, 2022",
          text: "Distribution arrangement with Mothers Choice Products announced.",
        },
        {
          date: "Year ended December 31, 2025",
          text: "Unaudited consolidated figures reported in the annual-report narrative.",
        },
        {
          date: "August 25, 2026",
          text: "Financing presentation outlining proposed expansion themes.",
        },
      ],
    },
    actions: ["investor_materials", "advanced_therapeutics"],
  },

  advancedTherapeutics: {
    eyebrow: "Investor relations · Advanced therapeutics",
    title: "Four regulated options under evaluation, none operating.",
    intro:
      "The options under evaluation include activities that need licences, facilities, qualified people, and regulatory approvals that LifeSupply does not hold today. Each is listed separately with its status and what it depends on. None is a product, a service, or a commitment.",
    options: [
      {
        title: "Pharmacy",
        status: "Under evaluation",
        text: "Pharmacy services for program participants.",
        dependencies: [
          "Provincial or state pharmacy licensing",
          "Qualified pharmacist ownership and staffing where required",
          "Regulatory approvals",
          "Financing",
        ],
      },
      {
        title: "Specialty and compounding",
        status: "Under evaluation",
        text: "Compounded preparations for specific programs.",
        dependencies: [
          "Compounding standards and facility requirements",
          "Pharmacy licensing",
          "Regulatory approvals",
          "Financing",
        ],
      },
      {
        title: "Peptide synthesis and research",
        status: "Under evaluation",
        text: "Research-stage synthesis capability.",
        dependencies: [
          "Research partners and facilities",
          "Regulatory classification of any output",
          "Financing",
        ],
      },
      {
        title: "Manufacturing",
        status: "Under evaluation",
        text: "Regulated manufacturing of products for the group's channels.",
        dependencies: [
          "Manufacturing licences and quality systems",
          "Facility and equipment",
          "Regulatory approvals",
          "Financing",
        ],
      },
    ],
    qualification:
      "None of these options is offered, licensed, or scheduled. Regulatory outcomes are not predicted, and no option is presented as certain. Any progress would be published here with its date.",
    actions: ["acquisition_inquiry", "investor_materials"],
  },

  disclosures: {
    eyebrow: "Investor relations · Disclosures",
    title: "Reported figures, with their scope.",
    intro:
      "Consolidated results for the year ended December 31, 2025, in Canadian dollars, with the basis they were prepared on.",
    basis: [
      "Currency: Canadian dollars.",
      "Period: year ended December 31, 2025.",
      "Entity scope: LifeSupply Health Inc., consolidated. The figures cover the parent and its wholly-owned subsidiaries together, so no result is attributable to any single brand.",
      "Basis: prepared by management under IFRS. Unaudited, and not the subject of an audit or a review engagement.",
    ],
    forwardLooking: {
      title: "Forward-looking statements",
      text: "Statements on this site about programs in development, opportunities under evaluation, expansion themes, and possible transactions are forward-looking. They are based on current plans and assumptions, depend on approvals, financing, regulatory requirements, market conditions, and transaction terms that are not in place, and may not occur. They are not guarantees, and LifeSupply undertakes no obligation to update them except as required.",
    },
    materials:
      "The figures above are the extent of what is published on this site. Investor inquiries go to investor relations.",
    actions: ["news_resources", "investor_materials"],
  },
} as const;
