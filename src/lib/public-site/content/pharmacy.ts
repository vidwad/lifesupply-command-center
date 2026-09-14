/**
 * Pharmacy Solutions (`/pharmacy-solutions/`).
 *
 * Rewritten on 2026-09-13 at the product owner's direction so the page says
 * why a pharmacy would work with LifeSupply, what supplies the proposed
 * arrangement covers, and how participation would work: a pharmacy-focused
 * proposition, the pharmacy's needs, representative supply categories, one
 * operating model, proposed ordering tools told apart from current
 * capabilities, participation, and one closing action. The discussion of
 * LifeSupply potentially holding licensed pharmacy operations left this page
 * for the investor page, where it already sat under Advanced Therapeutics;
 * one sentence here points there.
 *
 * Status discipline: the only pharmacy offer in development is the non-drug
 * supply arrangement, and it is not yet available. Medication and dispensing
 * are outside the proposed scope. No acquisition, transaction, counterparty,
 * licence, or timing is named or implied; nothing here dispenses, diagnoses,
 * or prescribes. Consumables are "replenished", never "refilled", so nothing
 * reads as a prescription refill. One enquiry destination serves the whole
 * page.
 */
export const pharmacy = {
  /** The in-page navigation, in page order. `#partner-program` keeps the address `/partners/pharmacies` redirects to. */
  sections: [
    { href: "#needs", label: "Needs" },
    { href: "#supplies", label: "Supplies" },
    { href: "#partner-program", label: "Model" },
    { href: "#tools", label: "Tools" },
    { href: "#participation", label: "Participation" },
  ],

  /** 1. The proposition, with the development status beside it. */
  hub: {
    eyebrow: "Pharmacy Solutions",
    title: "Help patients access the supplies that support their care.",
    intro: [
      "LifeSupply is developing supply and fulfilment arrangements for pharmacies supporting patients with pharmacist-selected, non-drug products.",
      "The proposed offering would bring product selection, initial ordering, and consumable replenishment into a defined process, with responsibilities agreed between LifeSupply and the participating pharmacy.",
    ],
    status:
      "In development. Pharmacy supply programs are not yet available. Medication and dispensing are outside the proposed scope.",
    /** The owner's supplies illustration, beside the copy. */
    graphic: "pharmacySupplies",
    actions: ["pharmacy_program_inquiry", "pharmacy_model"],
  },

  /** 2. What a pharmacy has to organize. */
  needs: {
    eyebrow: "The pharmacy’s needs",
    title: "A more organized approach to patient supplies.",
    intro: [
      "Supporting a patient’s care can involve initial equipment, compatible accessories, consumables to reorder, and questions about delivery or order support.",
      "The proposed LifeSupply arrangement would help a participating pharmacy define how those supply requirements are handled.",
    ],
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
   * 3. Representative categories: six, drawn from the metabolic-health
   * pathways without reproducing them. Proposed categories, never confirmed
   * bundles, and never a product offered for sale.
   */
  supplies: {
    eyebrow: "Representative supplies",
    title: "The supplies around the care program.",
    intro:
      "The initial development focus connects pharmacy-selected supplies with LifeSupply’s proposed metabolic-health offering. Depending on the agreed program, relevant categories could include:",
    categories: [
      {
        title: "Home monitoring",
        text: "Monitoring equipment and accessories selected for the intended use.",
        graphic: "categoryMonitoring",
        position: "50% 50%",
      },
      {
        title: "Diabetes supplies",
        text: "Compatible meters, strips, and lancing supplies where relevant to the program.",
        graphic: "metabolicSupplies",
        position: "62% 50%",
      },
      {
        title: "Injection accessories",
        text: "Non-drug accessories matched to the prescribed device and specifications.",
        graphic: "pharmacyInjection",
        position: "50% 55%",
      },
      {
        title: "Sharps containers",
        text: "Container requirements considered for the setting and applicable disposal arrangements.",
        graphic: "categoryInjection",
        position: "72% 50%",
      },
      {
        title: "Supply organization",
        text: "Organizers and practical accessories for keeping supplies together.",
        graphic: "pharmacyOrganization",
        position: "45% 50%",
      },
      {
        title: "Consumable replenishment",
        text: "Replacement supplies identified according to use and the agreed arrangement.",
        graphic: "clinicSupplies",
        position: "50% 65%",
      },
    ],
    note: "These are proposed categories, not confirmed bundles. Product selection, compatibility, availability, and quantities would be established for each arrangement.",
    action: "explore_kits",
    actionLabel: "Explore Metabolic Health supply pathways",
  },

  /**
   * 4. The one operating model, replacing the programme, partner-programme
   * and proposed-model explanations that used to repeat one another.
   */
  model: {
    eyebrow: "The proposed operating model",
    title: "The pharmacist selects. The supply arrangement supports delivery.",
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
    /** The one sentence that separates supplying pharmacies from the investor-page question of holding licensed pharmacy operations. */
    distinction:
      "This page describes proposed supply services for pharmacies. LifeSupply’s evaluation of potential licensed pharmacy operations is addressed separately in Investor Information.",
    distinctionAction: "advanced_therapeutics",
    distinctionLabel: "Investor Information",
  },

  /** 5. Proposed ordering tools, told apart from anything offered today. */
  tools: {
    eyebrow: "Proposed ordering tools",
    title: "Ordering tools shaped around the pharmacy’s workflow.",
    paragraphs: [
      "As the supply model develops, LifeSupply could evaluate dedicated ordering tools for participating pharmacies.",
      "These could support approved product lists, saved orders, supply-replenishment reminders, and clearer visibility into order status. The required features and any connections to existing systems would be defined with the pharmacy.",
    ],
    capabilitiesTitle: "Potential capabilities",
    capabilities: [
      "Pharmacist-approved supply lists.",
      "Saved initial and repeat orders.",
      "Consumable replenishment reminders.",
      "Defined ordering permissions.",
      "Order and delivery-status information.",
    ],
    status:
      "These tools are proposed development capabilities and are not currently offered as a pharmacy portal.",
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

  /** 6. Participation: what an initial conversation would cover. */
  participation: {
    eyebrow: "Participation",
    title: "Help define an arrangement that works for your pharmacy.",
    paragraphs: [
      "LifeSupply welcomes discussions with pharmacy owners and managers interested in helping define the proposed supply model.",
      "An initial conversation would focus on your pharmacy’s supply requirements, the patients or programs you support, and how ordering and fulfilment could fit your operations.",
    ],
    checklistTitle: "What the discussion would cover",
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
  },

  /** 7. The closing action: one enquiry destination, used consistently. */
  closing: {
    eyebrow: "Next step",
    title: "Discuss your pharmacy’s supply requirements.",
    text: "Tell us where your pharmacy operates, the program you have in mind, and the supply categories you would like to discuss.",
    action: "pharmacy_program_inquiry",
    secondary: "metabolic_hub",
    secondaryLabel: "Explore Metabolic Health Solutions",
    storesLead: "Looking for products available today?",
    storesAction: "medical_supply_stores",
    storesLabel: "Explore our medical supply stores",
  },

  /*
   * Unpublished records. None of these renders; the canaries check that and
   * keep the wording on record.
   */

  /**
   * The scope note (round three), unpublished since 2026-09-12 (product
   * owner). The distinction it drew survives as `model.distinction` and on
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
   * section that came off this page on 2026-09-13 (product owner). Potential
   * ownership of licensed pharmacies, compounding and related regulated
   * activities are an investor matter, addressed on the investor page under
   * Advanced Therapeutics with the same status.
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
   * owner). The responsibility itself is now one line in the pharmacy's
   * needs and one item in the participation checklist.
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
