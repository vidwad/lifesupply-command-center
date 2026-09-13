/**
 * The Acquisitions & Strategic Opportunities page (`/partners/acquisitions/`).
 *
 * The Partners hub was retired on 2026-09-10 (website consolidation, stage
 * 3), Suppliers & Manufacturers became a section of Medical Supply Solutions
 * on 2026-09-12, and this page was rewritten on 2026-09-13 (product owner)
 * as a focused outreach page for business owners and transaction advisers,
 * reached from the investor page, Contact and the footer rather than from a
 * menu. It keeps its address.
 *
 * Nothing here names a counterparty, a transaction, a pilot, or a signed
 * agreement: the register holds no such approved fact (S-63, S-72). Nothing
 * implies financing is committed or that terms are predetermined; every
 * structure is one that could be considered, and any terms depend on board
 * approval, financing, diligence, and applicable regulatory and disclosure
 * requirements. The `suppliers` block is the wording the retired supplier
 * page carried, kept on the record; Medical Supply Solutions renders its
 * own supplier section.
 */
export const partners = {
  suppliers: {
    eyebrow: "Partners · Suppliers and manufacturers",
    title: "Supplying the operating stores.",
    intro:
      "LifeSupply's operating stores carry health, safety, medical, and related categories in Canada and the United States. This page sets out what a supplier or manufacturer conversation covers and what is needed to start one.",
    actions: ["supplier_inquiry", "explore_businesses"],
  },

  acquisitions: {
    eyebrow: "Acquisitions & Strategic Opportunities",
    title: "Complementary businesses. A clear reason to come together.",
    intro: [
      "LifeSupply welcomes discussions with owners and advisers of businesses that could complement its medical, health, and related supply operations in Canada and the United States.",
      "Our interest is in transactions with a clear commercial rationale: relevant customers, product breadth, supplier relationships, geographic reach, or capabilities that strengthen the operating business.",
    ],
    /** 1. The kinds of business and capability of interest. */
    interests: {
      eyebrow: "Of interest",
      title: "Businesses and capabilities that could add to the operating stores.",
      items: [
        {
          title: "Medical, health, and home-care supply businesses",
          text: "Online or catalogue supply businesses whose customers, categories, or suppliers extend what the operating stores already carry.",
        },
        {
          title: "Clinic, pharmacy, and home-care customer bases",
          text: "Businesses that serve clinics, pharmacies, rehabilitation practices, or home-care buyers in Canada or the United States.",
        },
        {
          title: "Supplier relationships and product lines",
          text: "Distribution rights, brand relationships, or product ranges that broaden the categories the stores can offer.",
        },
        {
          title: "Operational capabilities",
          text: "Fulfilment, sourcing, catalogue, or service capabilities that the operating business could use across its stores.",
        },
      ],
    },
    /** 2. What makes a fit, and what integration would have to be true. */
    fit: {
      eyebrow: "Strategic fit",
      title: "What a good fit looks like.",
      items: [
        {
          title: "An operating reason",
          text: "Shared fulfilment, catalogue, sourcing, or customer relationships that the combined business would actually use, rather than scale alone.",
        },
        {
          title: "Customers and categories that extend the stores",
          text: "A customer base or product range the operating stores can serve better together than apart.",
        },
        {
          title: "A credible integration path",
          text: "Systems, people, and supplier arrangements that can be brought together without disrupting either business's customers.",
        },
      ],
    },
    /** 3. Structures that could be considered; none is standard. */
    structures: {
      eyebrow: "Structures",
      title: "Structures considered, case by case.",
      text: "Asset purchases, share purchases, and strategic arrangements can all be considered. Structure follows the business and the counterparty, and no terms are standard or predetermined. Strategic and public-market counterparties are welcome to start the same confidential conversation.",
    },
    /** 4. The confidential process, and what to include in an introduction. */
    process: {
      eyebrow: "Process",
      title: "A confidential introduction and evaluation.",
      items: [
        {
          index: "01",
          title: "Introduction",
          text: "A short written introduction to the channel below. Sensitive documents should wait until confidentiality is arranged.",
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
          text: "Any terms depend on board approval, financing, diligence, and applicable regulatory and disclosure requirements.",
        },
      ],
    },
    introduction: {
      title: "What to include in an introduction",
      items: [
        "A description of the business and what it does.",
        "Where it operates and the markets it serves.",
        "Its product and customer focus.",
        "The reason for making contact.",
      ],
      note: "Please arrange confidentiality before providing sensitive documents.",
    },
    /** 5. Direct contact. */
    contact: {
      eyebrow: "Contact",
      title: "Start the conversation with Abdul Ladha.",
      text: "Acquisition and strategic enquiries go directly to the Chairman & Chief Executive Officer.",
    },
    actions: ["acquisition_inquiry", "investor_information"],
  },
} as const;
