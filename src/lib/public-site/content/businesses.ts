/**
 * Medical Supply Solutions copy: the store hub at `/medical-supply-solutions/`
 * and the three store pages. Restructured on 2026-09-08 at the product
 * owner's direction from the Stage 3 "Our Businesses" portfolio map: the
 * corporate material moved to About, the LifeSupply Clinics brand page
 * became the Clinic Solutions section, and the technology and fulfilment
 * page was withdrawn (not a major business unit).
 *
 * Every factual statement traces to a SOURCE_REGISTER.md row or to approved
 * copy already published; the rest is Stage 3 draft framing, marked as
 * such. Store terms (shipping thresholds, delivery times, prices) are never
 * restated here: pages say the store publishes them. No brand-to-entity
 * relationship is asserted (WEB-01). Store links come from the brand
 * registry, never from this file.
 */
export const businesses = {
  /**
   * Medical Supply Solutions hub (`/medical-supply-solutions/`, renamed from
   * Our Businesses on 2026-09-08 at the product owner's direction): the
   * three online stores. Corporate material (entities, capabilities,
   * developing programs) moved to About.
   */
  /**
   * Medical Supply Solutions, consolidated on 2026-09-12 (product owner).
   *
   * The three brand pages and the suppliers page were folded in as sections,
   * so the page answers three questions in order: where should I shop, who
   * helps with professional purchasing, and how do I introduce my products.
   *
   * Repetition went with the consolidation. "This corporate site does not
   * sell products", "this site cannot see or change orders" and "each store
   * has its own catalogue, accounts, currency, prices and support" were said
   * in several places; Ordering and support now explains each once.
   */
  hub: {
    eyebrow: "Medical Supply Solutions",
    title: "Medical and home-care supplies. Choose the store that fits your needs.",
    description: [
      "Explore LifeSupply’s online stores serving Canada and the United States, with products for home care, everyday health, and professional practice.",
      "Shop directly with a store, discuss purchasing for your organization, or introduce your products to our supply businesses.",
    ],
    actions: {
      stores: "Explore our stores",
      professional: "Buying for a practice?",
      suppliers: "Supplier & manufacturer enquiries",
    },
    /** The in-page navigation, and the order the sections run in. */
    sections: [
      { href: "#stores", label: "Our stores" },
      { href: "#professional-buyers", label: "Professional purchasing" },
      { href: "#ordering-support", label: "Ordering & support" },
      { href: "#suppliers", label: "Suppliers" },
    ],
    stores: {
      eyebrow: "Our online stores",
      title: "Three stores. A clear place to start.",
      intro: [
        "LifeSupply and Wellmart Medical serve Canadian customers. Balkowitsch Worldwide serves the U.S. market. Explore each store’s focus and product categories below.",
        "Each store manages its own catalogue, pricing, accounts, and customer service. Purchases are completed on the store’s website.",
      ],
      shopLabel: "Shop",
    },
    professional: {
      eyebrow: "For professional buyers",
      title: "Start with what your practice needs.",
      paragraphs: [
        "Buying for a clinic, pharmacy, or another healthcare business? Tell us the categories you purchase and where you operate. A supply review can help identify relevant products and the appropriate operating store.",
        "For clinic projects in British Columbia, we can also direct equipment enquiries to LifeSupply Clinics.",
      ],
      checklistTitle: "What to bring to the conversation",
      checklist: [
        "Your organization, location, and type of practice.",
        "The product categories you purchase regularly.",
        "Any specific equipment or product requirements.",
        "Your purchasing frequency and delivery requirements.",
      ],
      action: "clinic_supply_review",
      actionLabel: "Request a supply review",
      supportingAction: "clinic_ongoing_supplies",
      supportingLabel: "Explore clinic supplies & equipment",
      /**
       * What the conversation is, and is not. It starts a purchasing
       * discussion; it does not create pricing, credit, billing, integration,
       * replenishment or a subscription, none of which is offered.
       */
      note: "Orders follow the supplying store’s terms. Any additional purchasing or service arrangements must be agreed separately.",
    },
    ordering: {
      eyebrow: "Ordering & support",
      title: "Ordering and support, through your store.",
      intro:
        "Browse and purchase on the operating store’s website. For an existing order, contact the store where you purchased.",
      disclosures: [
        {
          question: "Where do I place an order?",
          answer:
            "Follow a store or product-category link above to browse and purchase. Checkout takes place on that store’s website.",
        },
        {
          question: "Which currency and delivery terms apply?",
          answer:
            "LifeSupply and Wellmart Medical price in Canadian dollars. Balkowitsch Worldwide prices in U.S. dollars. Check the selected store for delivery availability, shipping charges, returns, and current policies.",
        },
        {
          question: "Who can help with an existing order?",
          answer:
            "The store that accepted your order handles delivery questions, returns, and order support.",
        },
      ],
      supportLabel: "Support",
      supportLinks: [
        { brand: "lifesupply", label: "LifeSupply support" },
        { brand: "wellmart", label: "Wellmart support" },
        { brand: "balkowitsch", label: "Balkowitsch support" },
      ],
    },
    suppliers: {
      eyebrow: "Suppliers & manufacturers",
      title: "Introduce your products to our supply businesses.",
      paragraphs: [
        "We welcome enquiries from suppliers and manufacturers whose products complement the medical, health, home-care, safety, and related categories carried by our operating stores.",
        "Tell us what you supply, the markets you serve, and where you hold distribution rights. Product fit and commercial arrangements are reviewed with the relevant operating business.",
      ],
      requirementsTitle: "What to include",
      requirements: [
        {
          title: "Your business and products",
          text: "Your company, product range, intended customers, and the categories you would like us to consider.",
        },
        {
          title: "Markets and distribution rights",
          text: "The countries or regions you can supply, your distribution rights, and any exclusivity arrangements.",
        },
        {
          title: "Product information",
          text: "Descriptions, images, specifications, applicable regulatory identifiers, and your pricing structure.",
        },
        {
          title: "Commercial requirements",
          text: "Lead times, minimum order quantities, return arrangements, and product-support terms.",
        },
      ],
      processTitle: "From introduction to listing.",
      process: [
        {
          index: "01",
          title: "Introduce",
          text: "Send a short overview of your business, products, and proposed markets.",
        },
        {
          index: "02",
          title: "Review",
          text: "The relevant business reviews category fit, distribution rights, product information, and applicable requirements.",
        },
        {
          index: "03",
          title: "Agree",
          text: "Commercial terms and supply responsibilities are agreed with the operating store.",
        },
        {
          index: "04",
          title: "List",
          text: "Approved products are added through the store’s catalogue process.",
        },
      ],
      action: "supplier_inquiry",
      actionLabel: "Submit a supplier enquiry",
      /** An introduction is reviewed for fit; it is not an acceptance. */
      note: "Initial enquiries are reviewed for fit; submitting information does not establish a supply agreement.",
    },
    closing: {
      title: "Need help finding the right starting point?",
      text: "Contact LifeSupply about a business enquiry, or return to the store comparison to browse products.",
      action: "contact_directory",
      actionLabel: "Contact LifeSupply",
      backLabel: "Back to our stores",
    },
  },
} as const;
