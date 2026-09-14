/**
 * Pharmacy Solutions (`/pharmacy-solutions/`).
 *
 * Re-scoped on 2026-09-13 (product owner, second brief of the day) around
 * three levels of engagement, in the order a pharmacy meets them:
 *
 *   1. medical products for pharmacies      available through the stores today
 *   2. patient-supply programs and tools    in development
 *   3. specialty pharmacy and compounding   under evaluation
 *
 * The first brief of the day had narrowed the page to metabolic-health
 * arrangements; a pharmacy could miss the simpler opportunity to buy other
 * medical and home-care products. The page now runs: the broader hero; the
 * product categories a pharmacy can explore today, mirroring the Medical
 * Supplies explorer; three purchasing relationships; the developing
 * patient-supply model; proposed ordering tools; a concise section on
 * specialty pharmacy and compounding opportunities; and a contact block with
 * separate actions for purchasing, program development and strategic
 * collaboration.
 *
 * Status discipline. Retail availability through the stores is stated as
 * such and never as a wholesale program: availability, resale arrangements,
 * pricing and supply terms are confirmed with the operating business. The
 * supply arrangement is in development and not yet available; medication and
 * dispensing are outside its scope. Compounding is written as it stands in
 * law: it exists within regulatory frameworks, and the question is whether a
 * particular preparation, ingredient, purpose and operating model is
 * permissible in a jurisdiction, so the framing is "where a lawful pathway
 * exists and the required professional, operational, and regulatory
 * conditions can be satisfied", never a blanket authorization awaited, and a
 * permission in one country is never permission in the other. Compounding a
 * preparation and synthesizing its active ingredient stay distinct; peptide
 * synthesis, research and manufacturing live on the investor page. LifeSupply
 * does not offer compounded medications or peptide-compounding services.
 * Consumables are "replenished", never "refilled". Three enquiry subjects,
 * one per conversation, and never the metabolic-health one.
 */
export const pharmacy = {
  /** The in-page navigation, in page order. `#partner-program` keeps the address `/partners/pharmacies` redirects to. */
  sections: [
    { href: "#products", label: "Products" },
    { href: "#relationships", label: "Relationships" },
    { href: "#partner-program", label: "Programs" },
    { href: "#tools", label: "Tools" },
    { href: "#specialty", label: "Specialty" },
  ],

  /** 1. The broader relationship, with the three statuses in one line. */
  hub: {
    eyebrow: "Pharmacy Solutions",
    title: "Medical supplies for your pharmacy. New ways to support your customers.",
    intro: [
      "LifeSupply’s operating stores offer medical, health, and home-care products that pharmacies can explore for their own requirements and customer needs.",
      "We are also developing more structured patient-supply arrangements and ordering tools, while evaluating selected opportunities in specialty pharmacy services.",
    ],
    status:
      "Products are available through the operating stores. Dedicated pharmacy programs and ordering tools are in development; regulated pharmacy activities remain under evaluation.",
    /** The owner's supplies illustration, beside the copy. */
    graphic: "pharmacySupplies",
    actions: ["pharmacy_products", "pharmacy_purchasing_inquiry"],
  },

  /**
   * 2. What a pharmacy can explore today. The eight categories are the
   * Medical Supplies explorer's own, with a pharmacy reading of each, so this
   * grid and that explorer can never disagree; the link goes to the explorer
   * rather than duplicating its catalogue.
   */
  products: {
    eyebrow: "Medical products for pharmacies",
    title: "A broader range of products for pharmacy and home-care needs.",
    intro: [
      "Pharmacy customers may need mobility aids, home monitoring equipment, wound-care supplies, and everyday care products alongside their usual pharmacy purchases.",
      "LifeSupply’s operating stores provide access to a broad range of these categories. Pharmacies can explore available products and discuss their purchasing requirements, including products for use within the pharmacy and potential additions to their retail assortment.",
    ],
    categories: [
      {
        title: "Mobility & Daily Living",
        text: "Products for customers seeking practical support at home.",
        graphic: "brandWellmart",
      },
      {
        title: "Bathroom Safety & Home Care",
        text: "Equipment and accessories relevant to home-care needs.",
        graphic: "categoryBathroom",
      },
      {
        title: "Monitoring & Diagnostics",
        text: "Blood-pressure monitors, thermometers, and other relevant monitoring products.",
        graphic: "categoryMonitoring",
      },
      {
        title: "Injection & Diabetes Supplies",
        text: "Compatible meters, strips, lancets, and related non-drug accessories.",
        graphic: "categoryInjection",
      },
      {
        title: "Wound Care & First Aid",
        text: "Dressings, bandages, and everyday first-aid supplies.",
        graphic: "categoryWound",
      },
      {
        title: "Incontinence & Ostomy Care",
        text: "Recurring care products and accessories.",
        graphic: "categoryIncontinence",
      },
      {
        title: "Respiratory Care",
        text: "Relevant products available through the supplying store.",
        graphic: "categoryRespiratory",
      },
      {
        title: "Clinic & Dental Supplies",
        text: "Selected consumables for the pharmacy’s service areas and internal use.",
        graphic: "categoryClinicDental",
      },
    ],
    closing:
      "Tell us which categories you are interested in, your location, and whether the products are intended for pharmacy use or resale. Availability, resale arrangements, pricing, and supply terms would be confirmed with the relevant operating business.",
    action: "pharmacy_products",
    actionLabel: "Browse medical supply categories",
    secondaryAction: "pharmacy_purchasing_inquiry",
    secondaryLabel: "Discuss a pharmacy product assortment",
  },

  /** 3. Which conversation a pharmacy wants to have. */
  relationships: {
    eyebrow: "Three purchasing relationships",
    title: "Support for the pharmacy, its shelves, and its customers.",
    items: [
      {
        title: "For pharmacy operations",
        text: "Explore supplies and equipment relevant to the pharmacy’s own service areas and day-to-day requirements.",
        status: "Available through the stores",
        action: "pharmacy_products",
        label: "Explore supplies and equipment",
      },
      {
        title: "For the retail assortment",
        text: "Discuss medical and home-care categories that could complement the pharmacy’s existing offering, with product availability and resale terms reviewed individually.",
        status: "Discussed individually",
        action: "pharmacy_purchasing_inquiry",
        label: "Discuss your retail assortment",
      },
      {
        title: "For patient-supply programs",
        text: "Help define proposed arrangements for pharmacist-selected supplies, initial orders, and consumable replenishment.",
        status: "In development",
        action: "pharmacy_model",
        label: "See the proposed model",
      },
    ],
  },

  /**
   * 4. The developing patient-supply model: one service within the broader
   * relationship, with its own status and the one operating model.
   */
  programs: {
    eyebrow: "Patient-supply programs",
    title: "Structured supply programs for the patients you support.",
    intro: [
      "Alongside general product purchasing, LifeSupply is developing arrangements that bring pharmacist-selected, non-drug supplies, initial ordering, and consumable replenishment into a defined process.",
      "The initial focus connects with the proposed metabolic-health offering. Each arrangement would establish the products involved and the responsibilities for ordering, payment, fulfilment, and support.",
    ],
    status:
      "In development. Pharmacy supply programs are not yet available. Medication and dispensing are outside the proposed scope.",
    steps: [
      {
        index: "1",
        title: "Define the requirements",
        text: "The pharmacy identifies the intended patients or program, relevant supply categories, and the products or specifications to be considered.",
      },
      {
        index: "2",
        title: "Agree the arrangement",
        text: "LifeSupply and the pharmacy define product configuration, ordering, payment, stockholding, fulfilment, and customer-support responsibilities.",
      },
      {
        index: "3",
        title: "Arrange initial supplies",
        text: "The proposed workflow supports the first order, with clear information about what is included and where order questions should be directed.",
      },
      {
        index: "4",
        title: "Support replenishment",
        text: "Consumables are reordered according to use and the agreed process. Durable equipment and occasional purchases are treated separately.",
      },
    ],
    supporting:
      "Clinical decisions and product suitability remain with the appropriate healthcare professional. LifeSupply’s proposed role is product supply and non-clinical fulfilment support.",
    /** Representative categories for a program, as a sentence: proposed, never confirmed bundles. */
    categoriesLead: "Depending on the agreed program, relevant categories could include",
    categories: [
      "home monitoring",
      "diabetes supplies",
      "injection accessories",
      "sharps containers",
      "supply organization",
      "consumable replenishment",
    ],
    categoriesNote:
      "These are proposed categories, not confirmed bundles. Product selection, compatibility, availability, and quantities would be established for each arrangement.",
    action: "explore_kits",
    actionLabel: "Explore Metabolic Health supply pathways",
  },

  /** 5. Proposed ordering tools across the whole relationship, told apart from anything offered today. */
  tools: {
    eyebrow: "Proposed ordering tools",
    title: "Ordering tools for a broader pharmacy relationship.",
    paragraphs: [
      "LifeSupply is evaluating how dedicated ordering tools could support pharmacy purchasing across operational supplies, selected retail products, and patient-supply programs.",
      "Proposed capabilities could include approved catalogues, saved orders, purchasing permissions, and clearer visibility into order status. Product access, pricing arrangements, and any system connections would be defined for each participating organization.",
    ],
    capabilitiesTitle: "Potential capabilities",
    capabilities: [
      "Approved catalogues for pharmacy operations, the retail assortment, and patient programs.",
      "Saved initial and repeat orders.",
      "Location-specific purchasing and defined ordering permissions.",
      "Approval steps where the pharmacy wants them.",
      "Consumable replenishment reminders.",
      "Order and delivery-status information.",
    ],
    status:
      "These tools are proposed development capabilities and are not currently offered as a pharmacy portal. A demonstration does not establish that the portal or the underlying business arrangements are operational.",
    /** Always visible above the concept, so a realistic interface never reads as a live product. */
    concept: {
      label: "Illustrative portal concept — proposed capabilities",
      note: "Demonstration data is fictional. No live product, pharmacy, account, or order is shown.",
      viewsLabel: "Portal views",
      views: [
        { key: "catalogue", label: "Catalogue" },
        { key: "purchasing", label: "Purchasing" },
        { key: "reporting", label: "Reporting" },
      ],
    },
  },

  /**
   * 6. Specialty pharmacy and compounding, concisely: relevant to a
   * prospective pharmacy collaborator, so it belongs here; the investment
   * rationale and the development dependencies stay on the investor page.
   */
  specialty: {
    eyebrow: "Specialty pharmacy and compounding",
    title: "Evaluating future specialty pharmacy and compounding opportunities.",
    status: "Under evaluation",
    paragraphs: [
      "LifeSupply is evaluating whether selected specialty pharmacy capabilities could complement its medical-supply business and relationships with pharmacies and clinics.",
      "Areas for assessment may include collaborations with appropriately licensed pharmacy operators and, where a lawful pathway exists and the required professional, operational, and regulatory conditions can be satisfied, opportunities involving compounded peptide preparations.",
      "Each opportunity would be assessed separately for the proposed preparation, patient need, jurisdiction, ingredient eligibility, professional responsibilities, and operating requirements. A permission in one country is not a permission to supply another. Any decision to proceed would also depend on appropriate facilities, quality systems, funding, and commercial viability.",
      "LifeSupply does not currently offer compounded medications or peptide-compounding services.",
    ],
    areasTitle: "Potential areas of participation",
    areas: [
      {
        title: "Supply support",
        text: "Explore the non-drug equipment and consumables required by an appropriately licensed operator, subject to product suitability and applicable requirements.",
      },
      {
        title: "Licensed pharmacy collaboration",
        text: "Evaluate potential business arrangements with qualified pharmacy operators, with professional responsibilities and any regulated activities clearly defined.",
      },
      {
        title: "Future operating capabilities",
        text: "Assess whether a licensed operation or other permitted structure could support a viable specialty pharmacy offering.",
      },
    ],
    /** Compounding a preparation and synthesizing its active ingredient are different activities; the latter is an investor matter. */
    investorNote:
      "Peptide synthesis, research, and manufacturing are separate activities from compounding and are described with the expansion strategy. The investment rationale and development dependencies are addressed separately in Investor Information.",
    investorAction: "advanced_therapeutics",
    investorLabel: "Investor Information",
    actions: ["pharmacy_strategic_inquiry", "growth_strategy"],
    actionLabels: ["Discuss a strategic pharmacy opportunity", "Explore the expansion strategy"],
  },

  /** 7. Contact: one action per conversation, and the way to the stores. */
  closing: {
    eyebrow: "Contact",
    title: "Start the conversation that fits your pharmacy.",
    text: "Tell us where your pharmacy operates and which conversation you would like to have. Each goes to the same team, with a subject that tells us where to begin.",
    actions: [
      {
        action: "pharmacy_purchasing_inquiry",
        title: "Purchasing",
        text: "Products for the pharmacy’s own use or its retail assortment, with availability and terms confirmed by the operating business.",
      },
      {
        action: "pharmacy_program_inquiry",
        title: "Program development",
        text: "Help define a patient-supply arrangement: the supplies, the ordering, and the responsibilities.",
      },
      {
        action: "pharmacy_strategic_inquiry",
        title: "Strategic collaboration",
        text: "Specialty pharmacy and compounding opportunities, assessed by product, activity, and jurisdiction.",
      },
    ],
    checklistTitle: "What a program discussion would cover",
    checklist: [
      "Pharmacy location and intended program.",
      "Relevant non-drug supply categories.",
      "Initial purchases and recurring consumable needs.",
      "Ordering, payment, stockholding, and delivery responsibilities.",
      "Patient-facing order information and support.",
      "Product complaints and recall responsibilities.",
      "Commercial terms and any proposed pilot scope.",
    ],
    supporting:
      "Any pilot or launch would require a separately agreed scope and operating arrangements.",
    storesLead: "Looking for products available today?",
    storesAction: "medical_supply_stores",
    storesLabel: "Explore our medical supply stores",
  },

  /*
   * Unpublished records. None of these renders; the canaries check that and
   * keep the wording on record.
   */

  /**
   * "The pharmacy's needs", three points from the first brief of 2026-09-13,
   * unpublished the same day when the page was re-scoped: the three
   * purchasing relationships and the operating model now carry them.
   */
  needs: {
    eyebrow: "The pharmacy’s needs",
    title: "A more organized approach to patient supplies.",
    items: [
      {
        title: "Clarify initial requirements",
        text: "Identify the equipment, consumables, and occasional-use items to include, based on the pharmacist’s selection and the relevant product specifications.",
      },
      {
        title: "Simplify repeat purchasing",
        text: "Distinguish equipment purchased initially from consumables that need replacing, with a clear route for reordering.",
      },
      {
        title: "Establish clear responsibilities",
        text: "Agree who receives orders, supplies products, manages delivery questions, and coordinates product complaints or recalls.",
      },
    ],
  },

  /**
   * The scope note (round three), unpublished since 2026-09-12 (product
   * owner). The distinction it drew survives in the specialty section and on
   * the investor page, and About separates the two pharmacy businesses.
   */
  scope: {
    title: "Which pharmacy business this is",
    paragraphs: [
      "This page is about supplying pharmacies. LifeSupply is developing pharmacist-selected non-drug supply and fulfilment programs, where the pharmacy is the customer and medication is excluded entirely. The programs are in development and cannot be bought yet.",
      "Whether LifeSupply should hold licensed pharmacy operations of its own is a separate question. That sits under evaluation alongside specialty and compounding, peptide research, and manufacturing, and none of them is offered, licensed or operating. Supplying pharmacies and running one are different businesses.",
    ],
  },

  /**
   * "Pharmacy-related operations, under evaluation": the stated-direction
   * section that came off this page on 2026-09-13 (product owner). The
   * concise specialty section above took its place the same day; the
   * investor page carries the detail with the same status.
   */
  direction: {
    eyebrow: "Stated direction",
    title: "Pharmacy-related operations, under evaluation.",
    text: "Pharmacy-related operations and regulated care infrastructure are a stated development focus within the public growth strategy. Both remain subject to regulatory, operational, and partner confirmation, and are presented on this site as under evaluation until an operation exists. No pharmacy operation is offered here.",
    items: [
      {
        title: "Pharmacy-related operations",
        status: "Under evaluation",
        text: "The investor pages describe this development focus, its dependencies, and the qualifications that apply to forward-looking activities.",
      },
      {
        title: "Regulated care infrastructure",
        status: "Under evaluation",
        text: "Specialty, compounding, and related options remain under evaluation. The advanced therapeutics page describes their individual status and dependencies.",
      },
    ],
  },

  /**
   * The complaints-and-recalls block, unpublished since 2026-09-13 (product
   * owner). The responsibility itself is one item in the program checklist.
   */
  responsibilities: {
    title: "Complaints and recalls",
    items: [
      "Product complaints are routed to the party stated in the program agreement and to the manufacturer as required.",
      "Recall handling follows the manufacturer's and the regulator's instructions; the program agreement names who notifies patients and who retrieves product.",
      "Each program agreement names who is responsible for what. A responsibility that is not written into the agreement has not been agreed.",
    ],
  },
} as const;
