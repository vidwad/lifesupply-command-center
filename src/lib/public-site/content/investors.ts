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

export interface DocumentRecord {
  title: string;
  /** As stated on the material itself; never inferred. */
  date: string;
  category: "Public" | "Restricted, on request" | "Historical";
  version: string | null;
  /** Public documents carry a same-origin href once Stage 6 publishes them; none exists yet. */
  href: null;
  note: string;
}

export const investorRelations = {
  // Approved (published since PR #60/#61).
  title: "Investor information, presented with context.",
  description:
    "The investor section presents current annual-report context alongside historical news and materials, with a clear distinction between disclosed information, forward-looking statements, and offering-specific content.",
  contact: { email: "invest@lifesupply.com", phone: "604-677-4146" },
  currentReport: {
    period: "Year ended December 31, 2025",
    status: "Unaudited consolidated financial information",
    entity: "LifeSupply Health Supplies Inc., consolidated",
    highlights: [
      { label: "Net sales", value: "$6.75M" },
      { label: "Gross profit", value: "$2.20M" },
      { label: "Net income", value: "$284K" },
    ],
  },
  expansionContext: {
    date: "August 25, 2026",
    title: "Expansion strategy source material",
    description:
      "A supplied financing presentation outlines proposed metabolic-health and therapeutics expansion themes, subject to investor suitability, forward-looking disclosure, board approval, regulatory requirements, and final transaction terms.",
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
      "Statements about expansion, programs in development, and opportunities under evaluation are forward-looking. They depend on approvals, financing, regulatory requirements, and transaction terms that have not been obtained, and they may not occur.",
    sections: [
      {
        route: "growthStrategy",
        title: "Growth strategy",
        text: "The five strands and the status of each.",
      },
      {
        route: "advancedTherapeutics",
        title: "Advanced therapeutics",
        text: "Four regulated options under evaluation, each with its own status and dependencies.",
      },
      {
        route: "documents",
        title: "Documents",
        text: "What is public, what is available on request, and what is historical.",
      },
      {
        route: "shareholderServices",
        title: "Shareholder services",
        text: "Administrative requests and how to make them.",
      },
      {
        route: "disclosures",
        title: "Disclosures",
        text: "The reported figures with their scope, and the forward-looking basis.",
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
          text: "Financing presentation outlining proposed expansion themes supplied for review.",
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

  documents: {
    eyebrow: "Investor relations · Documents",
    title: "Public, on request, and historical.",
    intro:
      "This index lists investor materials by access class. No document file is hosted on this site yet; public documents will be published here with their version and date, and restricted materials remain available on request through the investor-relations channel.",
    classes: [
      {
        title: "Public",
        text: "Published here once approved, with title, date, version, and effective date.",
      },
      {
        title: "Restricted, on request",
        text: "Shared with suitable recipients after a request and any confidentiality terms; never at a public address.",
      },
      {
        title: "Historical",
        text: "Earlier materials kept for the record and labelled by their original date.",
      },
    ],
    records: [
      {
        title: "Annual-report narrative, year ended December 31, 2025",
        date: "Year ended December 31, 2025",
        category: "Restricted, on request",
        version: null,
        href: null,
        note: "Source of the unaudited consolidated figures shown on the investor pages.",
      },
      {
        title: "Financing presentation",
        date: "August 25, 2026",
        category: "Restricted, on request",
        version: null,
        href: null,
        note: "Outlines proposed expansion themes; subject to suitability, disclosure, board approval, regulatory requirements, and final terms.",
      },
      {
        title: "Investor presentation",
        date: "May 2022",
        category: "Historical",
        version: null,
        href: null,
        note: "Earlier corporate presentation from the prior website; available on request for the record.",
      },
    ] satisfies readonly DocumentRecord[],
    published: {
      title: "Published public documents",
      empty:
        "No public document has been published yet. Approved public documents appear here with their date and version.",
      unavailable:
        "The published document list is temporarily unavailable. The records below are unaffected.",
      download: "Download",
    },
    requestNote:
      "Requests are answered by the investor-relations contact. Restricted materials are provided only to suitable recipients and are not distributed through this site.",
    actions: ["investor_materials"],
  },

  shareholderServices: {
    eyebrow: "Investor relations · Shareholder services",
    title: "Administrative requests from shareholders.",
    intro:
      "Existing shareholders can raise the administrative matters below through the investor-relations contact. Meeting information is published here when it is available.",
    purposes: [
      "Contact-detail updates",
      "Name or address changes",
      "Certificate questions",
      "Re-registration",
      "Transfers",
      "Lost certificates",
      "Meeting information, when available",
    ],
    process: [
      "State the purpose of the request and your registered name.",
      "Do not send share certificates, identity documents, or account details by email. A secure follow-up route is arranged for anything that needs verification.",
      "Requests are acknowledged by the investor-relations contact, and each is handled through the appropriate registrar or company process.",
    ],
    meetings: "No meeting is currently announced on this site.",
    actions: ["shareholder_services"],
  },

  disclosures: {
    eyebrow: "Investor relations · Disclosures",
    title: "Reported figures, with their scope.",
    intro:
      "The figures below are the only financial figures published on this site. They are shown with their period, basis, and entity scope, and nothing is derived from them.",
    basis: [
      "Period: year ended December 31, 2025.",
      "Basis: unaudited consolidated financial information, as cited in the annual-report narrative.",
      "Entity scope: LifeSupply Health Supplies Inc., consolidated.",
      "Currency: as reported in the source material.",
    ],
    forwardLooking: {
      title: "Forward-looking statements",
      text: "Statements on this site about programs in development, opportunities under evaluation, expansion themes, and possible transactions are forward-looking. They are based on current plans and assumptions, depend on approvals, financing, regulatory requirements, market conditions, and transaction terms that have not been obtained, and may not occur. They are not guarantees, and LifeSupply undertakes no obligation to update them except as required.",
    },
    materials:
      "Figures and forward-looking themes are tied to the materials listed in the documents index. Where a material is restricted, the figure shown here is the extent of what is published.",
    actions: ["investor_documents", "investor_materials"],
  },
} as const;
