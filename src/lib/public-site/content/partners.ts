/**
 * Partners copy for Stage 5 (guide §3: `/partners/` and its four children).
 *
 * The hub routes by relationship. Each one distinguishes itself from ordinary
 * procurement (a clinic that buys supplies is a customer, not a program
 * partner) and ends on an approved directory channel, because no inquiry
 * intake exists before Stage 7 (WEB-07). Clinic collaboration and the
 * pharmacy partner programme left this file on 2026-09-10: each is a section
 * of the page that already carried its subject, and each one's copy now lives
 * beside the rest of that subject's material, in `content/clinics.ts` and
 * `content/pharmacy.ts` respectively. Nothing here names a
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
      "LifeSupply works with clinics, pharmacies, suppliers and manufacturers, and acquisition or strategic counterparties. Each relationship is set out in its own place, with its own boundaries and its own starting conversation. Buying from one of the operating stores does not require any of them.",
    relationships: [
      {
        key: "clinics",
        route: "clinics",
        title: "Clinics",
        text: "Program and design collaboration, distinct from ordinary procurement. Set out on Clinic Solutions, with the rest of the clinic relationship.",
        action: "clinic_collaboration",
      },
      {
        key: "pharmacies",
        route: "pharmacies",
        title: "Pharmacies",
        text: "Non-drug supply programs with pharmacist-selected configurations and stated responsibilities.",
        action: "pharmacy_program_inquiry",
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
