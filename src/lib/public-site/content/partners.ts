/**
 * Partners copy for Stage 5 (guide §3: `/partners/` and its four children).
 *
 * The hub routes by relationship. Each child distinguishes its relationship
 * from ordinary procurement (a clinic that buys supplies is a customer, not a
 * program partner) and ends on an approved directory channel, because no
 * inquiry intake exists before Stage 7 (WEB-07). Nothing here names a
 * partner, a pilot, a signed agreement, a transaction, or a counterparty:
 * the register holds no such approved fact (S-63, S-72). Statuses are
 * stated per relationship; "proposed" means LifeSupply is inviting the
 * conversation, not that a program is operating.
 */
export const partners = {
  hub: {
    eyebrow: "Partners",
    title: "Four relationships, each on its own terms.",
    intro:
      "LifeSupply works with clinics, pharmacies, suppliers and manufacturers, and acquisition or strategic counterparties. Each relationship has its own page, its own boundaries, and its own starting conversation. Buying from one of the operating stores does not require any of them.",
    relationships: [
      {
        key: "clinics",
        route: "clinics",
        title: "Clinics",
        text: "Program and design collaboration, distinct from ordinary procurement.",
        action: "clinic_collaboration",
      },
      {
        key: "pharmacies",
        route: "pharmacies",
        title: "Pharmacies",
        text: "Non-drug supply programs with pharmacist-selected configurations and stated responsibilities.",
        action: "discuss_program",
      },
      {
        key: "suppliers",
        route: "suppliers",
        title: "Suppliers and manufacturers",
        text: "Categories, regions, product data, and the onboarding process.",
        action: "supplier_inquiry",
      },
      {
        key: "acquisitions",
        route: "acquisitions",
        title: "Acquisitions and strategic transactions",
        text: "Fit criteria, general structures, and a confidential process.",
        action: "acquisition_inquiry",
      },
    ],
    procurement: {
      eyebrow: "Not a partnership",
      title: "Ordinary purchasing needs no partner conversation.",
      text: "Clinics and other professional buyers purchase through the operating stores' own accounts today. A supply review for an existing clinic is a customer conversation, handled on the Clinic Solutions pages.",
      action: "clinic_solutions",
    },
  },

  clinics: {
    eyebrow: "Partners · Clinics",
    title: "Program and design collaboration with clinics.",
    intro:
      "Some clinics want more than a supply account: a role in shaping how a program's supplies are configured, or a design partnership on a clinic project. This page describes that collaboration and how it differs from buying supplies.",
    distinction: {
      title: "Collaboration is not procurement",
      items: [
        "A clinic that purchases supplies is a customer of the operating store, with that store's account, prices, and support. No collaboration is required.",
        "A program collaboration means the clinic helps define a supply configuration, a workflow, or a pilot, agreed in writing before anything is fulfilled.",
        "A design partnership relates to a clinic project delivered through LifeSupply Clinics and its delivery partners, on the terms of that project.",
        "An expression of interest is not a pilot, and a pilot is not contracted revenue for either side until it is agreed.",
      ],
    },
    collaboration: {
      eyebrow: "What collaboration covers",
      title: "Three ways a clinic can work with LifeSupply beyond purchasing.",
      items: [
        {
          title: "Program configuration",
          text: "Clinical staff define what a supply configuration must contain for their program; LifeSupply models it as starter, consumable, and occasional roles and states compatibility. Nothing is fulfilled until the configuration and its store are confirmed.",
          status: "Proposed",
        },
        {
          title: "Pilots",
          text: "A limited, written pilot of a program's supply or workflow support, with its scope, duration, responsibilities, and exit stated up front.",
          status: "Proposed",
        },
        {
          title: "Design partnership",
          text: "Early involvement in a clinic project's planning, layout, and equipment choices, delivered through LifeSupply Clinics within its verified delivery arrangements.",
          status: "Available through LifeSupply Clinics",
        },
      ],
    },
    actions: ["clinic_collaboration", "clinic_solutions"],
  },

  pharmacies: {
    eyebrow: "Partners · Pharmacies",
    title: "Non-drug supply programs for pharmacies.",
    intro:
      "A pharmacy can support its patients with non-drug supplies that the pharmacist selects. LifeSupply proposes to configure and fulfil those supplies, with every responsibility stated before a program starts. The service is in development; no pharmacy program is operating.",
    model: {
      eyebrow: "The model",
      title: "The pharmacist selects; the supply service fulfils.",
      items: [
        {
          title: "Pharmacist-selected configurations",
          text: "The pharmacist chooses the supplies and their roles. LifeSupply does not substitute and does not select for the patient.",
        },
        {
          title: "Non-drug only",
          text: "Medication is excluded from every configuration. Supply fulfilment is not dispensing, and nothing in the program touches a prescription.",
        },
        {
          title: "Fulfilment responsibilities stated per program",
          text: "Who holds stock, who ships, who invoices, and who the patient contacts are written down before fulfilment begins.",
        },
      ],
    },
    responsibilities: {
      title: "Complaints and recalls",
      items: [
        "Product complaints are routed to the party stated in the program agreement and to the manufacturer as required.",
        "Recall handling follows the manufacturer's and the regulator's instructions; the program agreement names who notifies patients and who retrieves product.",
        "Nothing is assumed by default. If a responsibility is not written into the program, it has not been agreed.",
      ],
    },
    actions: ["discuss_program", "metabolic_hub"],
  },

  suppliers: {
    eyebrow: "Partners · Suppliers and manufacturers",
    title: "Supplying the operating stores.",
    intro:
      "LifeSupply's operating stores carry health, safety, medical, and related categories in Canada and the United States. This page sets out what a supplier or manufacturer conversation covers and what is needed to start one.",
    fit: {
      eyebrow: "Suitable categories and regions",
      title: "Where a new supplier fits.",
      text: "Categories that the stores already publish, or adjacent categories that serve the same clinic, home-care, or professional buyers. Canada and the United States are served by different stores with different currencies and accounts, so distribution rights and regions are discussed per store.",
    },
    requirements: {
      title: "What a conversation needs",
      items: [
        "Company, product range, and the categories and regions proposed.",
        "Distribution rights held for those regions, and any exclusivity that applies.",
        "Product data: descriptions, images, specifications, regulatory identifiers where applicable, and pricing structure.",
        "Commercial terms: lead times, minimums, returns, and support arrangements.",
      ],
    },
    process: {
      title: "Onboarding",
      items: [
        {
          index: "01",
          title: "Inquiry",
          text: "A written introduction through the corporate channel below.",
        },
        {
          index: "02",
          title: "Review",
          text: "Fit against the stores' categories, regions, and buyers, and a check of product data and regulatory identifiers.",
        },
        {
          index: "03",
          title: "Commercial terms",
          text: "Terms agreed with the operating store that will list the products.",
        },
        {
          index: "04",
          title: "Listing",
          text: "Products are listed on the relevant store through that store's own catalogue process.",
        },
      ],
    },
    actions: ["supplier_inquiry", "explore_businesses"],
  },

  acquisitions: {
    eyebrow: "Partners · Acquisitions and strategic transactions",
    title: "Selective transactions that fit the platform.",
    intro:
      "LifeSupply's public strategy includes complementary acquisitions. This page describes the fit criteria, the general structures considered, and the confidential process. It does not announce, describe, or imply any transaction.",
    criteria: {
      eyebrow: "Fit criteria",
      title: "What LifeSupply looks for.",
      items: [
        {
          title: "Complementary categories or customers",
          text: "Medical, health, safety, or related supply businesses whose customers, categories, or suppliers extend the operating stores.",
        },
        {
          title: "Integration rationale",
          text: "A clear operating reason: shared fulfilment, catalogue, sourcing, or clinic relationships, rather than scale alone.",
        },
        {
          title: "Clinic and program adjacency",
          text: "Businesses that serve clinics, pharmacies, or home-care buyers in Canada or the United States.",
        },
      ],
    },
    structures: {
      title: "General structures",
      text: "Asset purchases, share purchases, and strategic arrangements are all considered. Structure follows the business and the counterparty; nothing is standard. Strategic or public-market counterparties are welcome to start the same confidential conversation.",
    },
    process: {
      title: "Confidential process",
      items: [
        {
          index: "01",
          title: "Introduction",
          text: "A short written introduction through the channel below.",
        },
        {
          index: "02",
          title: "Confidentiality",
          text: "A mutual confidentiality agreement before any non-public information is exchanged.",
        },
        {
          index: "03",
          title: "Evaluation",
          text: "Fit, operations, and integration reviewed with the counterparty.",
        },
        {
          index: "04",
          title: "Terms",
          text: "Any terms are subject to board approval, financing, diligence, and applicable regulatory and disclosure requirements.",
        },
      ],
    },
    actions: ["acquisition_inquiry", "investor_information"],
  },
} as const;
