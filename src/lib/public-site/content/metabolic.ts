/**
 * Metabolic Health copy and the eight supply pathways for Stage 4 (guide §3:
 * `/metabolic-health/`, `/metabolic-health/care-kits/`, the eight kit pages,
 * and `/metabolic-health/refills/`).
 *
 * Status at Stage 4: the product owner supplied no program status, no
 * approved kit contents, and no refill capability (WEB-04 open). Every page
 * is therefore an information page: availability is "in development", no
 * contents, quantities, prices, discounts, insurance, or storage claims are
 * stated, and the only next step is the approved program-inquiry channel.
 *
 * The hub copy follows the product owner's Metabolic Care Supply & Services
 * partner overview (volume 1 of 2, management review draft, September 2,
 * 2026): the connected supply experience, the four value streams, the care
 * partners, the configuration dimensions, the next step, and its important
 * information, with the development status kept beside every claim.
 *
 * Model (IMPLEMENTATION_BACKLOG.md §13): each pathway records its audience,
 * purpose, the three
 * item roles (starter equipment, usage-driven consumables, occasional
 * items) as roles only, compatibility rules, exclusions, availability, and
 * verified "browse" categories resolved through the brand registry. No SKU,
 * bill of materials, or store configuration exists yet (`approvedContents`
 * is null on every kit), so no page renders a purchasable placeholder.
 *
 * Nothing here diagnoses, prescribes, recommends a medication or dose, or
 * implies drug dispensing. Medication is excluded from every pathway.
 */

export type ItemRole = "starter" | "consumable" | "occasional";

export interface BrowseRef {
  /** Brand registry key. */
  brand: "lifesupply" | "wellmart" | "balkowitsch";
  /** Exact category label as registered in brands.ts; resolved, never guessed. */
  category: string;
}

/**
 * How a pathway relates to the others. The eight were listed as peers, and a
 * reader had to work out that two are care-program applications, four are
 * the supply modules those programs draw on, and two are purchasing
 * arrangements for an organisation rather than a patient (product owner,
 * 2026-09-11). The grouping explains the proposed model; it is not a product
 * structure, and nothing in it is orderable.
 */
export type PathwayGroup = "program" | "module" | "configuration";

export interface KitPathway {
  id: string;
  slug: string;
  group: PathwayGroup;
  label: string;
  audience: string;
  purpose: string;
  /** Item roles described as roles; no product, quantity, or SKU. */
  roles: { role: ItemRole; title: string; text: string }[];
  compatibility: string[];
  exclusions: string[];
  availability: "in_development";
  approvedContents: null;
  /** Verified store categories a reader may browse; empty when none exists. */
  browse: BrowseRef[];
  /** Why browse is empty, when it is. */
  browseNote: string | null;
  faqs: { q: string; a: string }[];
}

const MEDICATION_EXCLUDED = "Medication of any kind. These are non-drug supplies only.";

export const metabolic = {
  /**
   * Section navigation for the consolidated page (website consolidation,
   * stage 2, 2026-09-10). Metabolic Health absorbed the care-kits hub, all
   * eight pathway pages and refills, so the page is long by necessity and a
   * reader has to be able to see its shape and jump into it.
   *
   * Each pathway also publishes its own anchor, matching the slug its page
   * used, so `/metabolic-health/care-kits/glp-1-support` still lands on the
   * same material. Those anchors are registered in `routes.ts`; these four
   * are the ones the navigation shows.
   */
  sections: [
    { href: "#pathways", label: "Eight pathways" },
    { href: "#replenishment", label: "Replenishment" },
    { href: "#collaboration", label: "Collaboration" },
  ],

  /**
   * The two boundaries that qualify everything on the page, stated once and
   * early. They were previously spread across a status band, a disclaimer, an
   * "Important information" list of four and several section notes.
   */
  boundaries: {
    clinical:
      "This site does not diagnose, prescribe, or recommend any medication or dose, and supply fulfilment is not drug dispensing. Product questions belong with your clinician, pharmacist, or the store that supplies you.",
    guidance:
      "Supplies and program materials support product instructions and a healthcare professional's guidance. They do not replace either.",
  },

  hub: {
    eyebrow: "Metabolic Health Solutions",
    /**
     * Rewritten 2026-09-11. "A supply program shaped around a care pathway"
     * was accurate and abstract: neither word told a first-time visitor what
     * the service does. The heading now names the thing and the audience, the
     * sentence says what is being developed, and the status stands on its own
     * line rather than ending the introduction on what cannot be ordered
     * (product owner).
     */
    title: "Non-drug supply support for metabolic-health programs.",
    intro:
      "LifeSupply is developing configurable patient supplies, clinic purchasing, and fulfilment support for clinics and pharmacies supporting metabolic-health care.",
    status: "In development. Program configurations and contracted services are not yet available.",
    actions: ["discuss_program", "explore_kits"],

    /**
     * Who it would help and why, before any component or condition. The page
     * used to explain the proposed parts and their limits in detail and never
     * said what problem they solve for the organisation reading it.
     */
    value: {
      eyebrow: "Who it would help",
      title: "One supply plan for the whole program.",
      intro:
        "A metabolic-health program runs on supplies the medication does not come with: the equipment a patient starts with, the consumables they use up, and the stock a clinic keeps for its own rooms. The proposed service would plan those together, around the devices already in use.",
      items: [
        {
          title: "For a clinic",
          text: "One conversation would cover what patients need at home and what the practice buys for itself, so supply is planned with the program rather than around it.",
        },
        {
          title: "For a pharmacy",
          text: "A proposed configuration would be built around the pharmacist's selection of non-drug supplies, with fulfilment responsibilities agreed in advance.",
        },
        {
          title: "For the patient",
          text: "The proposed plan would identify starter equipment matched to the prescribed device and the consumables that go with it, with ordering and replenishment responsibilities agreed for each arrangement. Clinical decisions stay with the clinician or pharmacist.",
        },
      ],
    },

    /**
     * The closing band. The main enquiry speaks to the organisation, and the
     * list says what to bring so the first conversation is a useful one. None
     * of it identifies a patient.
     */
    close: {
      eyebrow: "Next step",
      title: "Discuss your clinic or pharmacy's supply needs.",
      text: "A first conversation is easier with a few things to hand. None of them identifies a patient.",
      bring: [
        "Organisation type and region",
        "The program or practice being supported",
        "The broad supply categories involved",
        "Whether the interest is patient supplies, clinic purchasing, or proposed fulfilment support",
      ],
      qualification:
        "Starting a conversation commits no one to anything. A configuration becomes orderable once its contents, its store, and its fulfilment are confirmed and published, and a pilot would run under its own agreement.",
    },
  },

  kitsHub: {
    eyebrow: "Supply pathways",
    title: "Eight pathways, three kinds.",
    intro:
      "Each pathway is a configurable starting point rather than a product: who it is for, what the starter, consumable, and occasional items would cover, which compatibility rules apply, and what is excluded. They overlap on purpose, so a program can draw on more than one. All eight are in development.",
    /** The three kinds, in the order a program is assembled. */
    groups: [
      {
        key: "program",
        title: "Patient-program applications",
        text: "Built around a care program a clinician manages. Each draws on the supporting modules below.",
      },
      {
        key: "module",
        title: "Supporting supply modules",
        text: "The supply needs one program shares with another: injecting safely, disposing of sharps, travelling, and monitoring at home.",
      },
      {
        key: "configuration",
        title: "Clinic and pharmacy configurations",
        text: "Proposed arrangements for clinic stock purchasing or pharmacy-led patient supply support.",
      },
    ],
    /**
     * How the kinds combine, as an illustration of the proposed model. It
     * names no product and no quantity, because none is published.
     */
    example: {
      title: "How they combine",
      text: "An illustration of the proposed model: a clinic supporting an injectable GLP-1 program could consider injection supplies, sharps containers, and travel organisers, alongside supplies for its own stock. The clinician or pharmacist would determine which supplies are appropriate; contents and quantities are not confirmed, and none is published yet.",
    },
    /** The label on each pathway's folded detail. */
    detailLabel: "Explore this pathway",
    /** On every card, outside the fold, for a reader who arrives by deep link. */
    status: "In development",
    actions: ["discuss_program", "refills_information"],
  },

  /**
   * Replenishment (`#replenishment`), formerly `/metabolic-health/refills/`.
   * The distinction it exists to draw — a starter item is chosen once and is
   * not refilled — is the reason it sits after the pathways rather than
   * before them: it only means anything once the three item roles are known.
   */
  refills: {
    eyebrow: "Replenishment",
    /**
     * "Starter items are not refills" was accurate and corrective: it read as
     * a reply to a misunderstanding rather than an explanation. The heading
     * now says how the model works, and the sentence it replaced survives as
     * the first line beneath it (product owner, 2026-09-11).
     */
    title: "Start with the equipment. Replenish what gets used.",
    intro:
      "Starter items are not refills. Starter equipment is selected at the start, consumables are reordered as they are used, and occasional items are added when they are needed.",
    roles: [
      {
        role: "starter",
        title: "Starter equipment",
        when: "Selected once",
        text: "Chosen at the start and matched to the device in use.",
      },
      {
        role: "consumable",
        title: "Consumables",
        when: "Reordered by use",
        text: "Replaced on the usage cycle, in the quantities the program expects.",
      },
      {
        role: "occasional",
        title: "Occasional items",
        when: "Added when needed",
        text: "Bought once or rarely, such as a travel or storage organiser.",
      },
    ],
    /**
     * Unpublished since 2026-09-12 (product owner): the Today / In
     * development pair and the substitutions line were removed from the
     * replenishment section. Kept here so what they state is still on the
     * record and can be restored verbatim.
     */
    today: {
      title: "Today",
      text: "Reordering happens through the operating stores, with their accounts and repeat ordering as each store provides. There is no automatic shipment, no reminder service, and no subscription on this site today, so intervals, pauses, changes, and cancellation follow the store's own ordering.",
    },
    later: {
      title: "In development",
      text: "A program-specific replenishment service is in development. If one is launched, this page will say how it works before anything is offered.",
    },
    substitutions:
      "Substitutions for a prescribed device's consumables are never made by this site. Compatibility is confirmed with the clinician or pharmacist and the store.",
    actions: ["discuss_program", "explore_kits"],
  },

  /**
   * Programme collaboration (`#collaboration`), added by the website
   * consolidation, stage 2.
   *
   * Stage 1 moved clinic collaboration onto Clinic Solutions and left it
   * pointing at this page for the fuller scope, because the supply programme
   * a collaboration would configure is this one. This section is that scope:
   * who can help define a programme, what a collaboration is and is not, and
   * what has to be true before anything runs. Without it, the clinic section's
   * link went to a page that never picked the subject up.
   */
  collaboration: {
    eyebrow: "Develop a configuration",
    title: "Help shape a program for your clinic or pharmacy.",
    status: "In development",
    intro:
      "The pathways are starting points, not finished products. A clinic, a pharmacy, or a supplier can help define what a configuration should contain for the people they look after. Clinical decisions stay with the clinician or pharmacist throughout.",
    /**
     * Three routes, each with its own destination, so a pharmacy or a
     * supplier is not handed a Clinic Solutions button (product owner,
     * 2026-09-11).
     */
    who: {
      title: "Who a collaboration is with",
      items: [
        {
          title: "A clinic",
          text: "Staff who want a configuration shaped around a program they already run.",
          action: "clinic_solutions",
        },
        {
          title: "A pharmacy",
          text: "A pharmacist who would select the non-drug supplies for the pharmacy's patients.",
          action: "pharmacy_hub",
        },
        {
          title: "A manufacturer or supplier",
          text: "Products that would sit inside a configuration, on the supplier terms published separately.",
          action: "supplier_page",
        },
      ],
    },
    planning: {
      title: "What a supply plan would settle",
      items: [
        "The configuration: which items, in which roles, and which store carries them.",
        "Compatibility with the devices in use, confirmed with the prescribing clinician or pharmacist.",
        "Replenishment quantities and the expected pattern of use.",
        "Patient materials, ordering guidance, and how the program is presented.",
        "Who holds stock, who ships, who invoices, and who a patient or practice contacts.",
        "How complaints and recalls are handled, and by whom.",
      ],
    },
    actions: ["discuss_program"],
  },

  kits: [
    {
      id: "K01",
      slug: "glp-1-support",
      group: "program",
      label: "GLP-1 Support Supplies",
      audience:
        "People on a clinician-managed GLP-1 program, and the clinics and pharmacies that support them.",
      purpose:
        "Non-drug accessories for injection routines, sharps handling, and travel, configured to the prescribed device.",
      roles: [
        {
          role: "starter",
          title: "Starter equipment",
          text: "Home sharps disposal and a storage or travel organiser, chosen once.",
        },
        {
          role: "consumable",
          title: "Consumables",
          text: "Injection accessories matched to the prescribed device, replaced on the usage cycle.",
        },
        {
          role: "occasional",
          title: "Occasional items",
          text: "Travel organisation for periods away from home.",
        },
      ],
      compatibility: [
        "Accessories are selected for the exact device the clinician has prescribed.",
        "No accessory is presented as fitting every pen or device.",
      ],
      exclusions: [MEDICATION_EXCLUDED, "Dose guidance or injection technique advice."],
      availability: "in_development",
      approvedContents: null,
      browse: [
        { brand: "lifesupply", category: "Needles and syringes" },
        { brand: "wellmart", category: "Needles and syringes" },
      ],
      browseNote: null,
      faqs: [
        {
          q: "Does this include the medication?",
          a: "No. Every pathway on this site is non-drug supplies only.",
        },
        {
          q: "Will any accessory fit my device?",
          a: "No accessory is universal. The prescribed device determines what fits, and that is confirmed by your clinician or pharmacist.",
        },
      ],
    },
    {
      id: "K02",
      slug: "injection-safety",
      group: "module",
      label: "Injection Safety Supplies",
      audience:
        "Anyone injecting at home under clinical direction, and the clinics that supply them.",
      purpose:
        "Compatible injection supplies, skin preparation, and disposal, configured to the prescribed medication and device.",
      roles: [
        { role: "starter", title: "Starter equipment", text: "Home sharps disposal, chosen once." },
        {
          role: "consumable",
          title: "Consumables",
          text: "Syringes or pen needles in the prescribed specification, skin-preparation supplies, replaced on the usage cycle.",
        },
        { role: "occasional", title: "Occasional items", text: "A carry organiser for travel." },
      ],
      compatibility: [
        "Syringe volume, needle gauge, and needle length follow the prescription; the site does not choose them.",
        "An insulin syringe is not universal injectable equipment.",
      ],
      exclusions: [MEDICATION_EXCLUDED, "Injection technique or dose advice."],
      availability: "in_development",
      approvedContents: null,
      browse: [
        { brand: "lifesupply", category: "Needles and syringes" },
        { brand: "wellmart", category: "Needles and syringes" },
      ],
      browseNote: null,
      faqs: [
        {
          q: "Can I use one syringe type for any injection?",
          a: "No. The specification follows the prescription and the medication; that is a clinical decision.",
        },
      ],
    },
    {
      id: "K03",
      slug: "sharps-supplies",
      group: "module",
      label: "Sharps Containers and Supplies",
      audience:
        "Anyone disposing of sharps at home or while travelling, and clinics managing sharps at par levels.",
      purpose:
        "Sharps containers in home and travel sizes and the usage-driven replacement of full containers.",
      roles: [
        {
          role: "starter",
          title: "Starter equipment",
          text: "A home-size container, chosen once for the setting.",
        },
        { role: "consumable", title: "Consumables", text: "Replacement containers as each fills." },
        { role: "occasional", title: "Occasional items", text: "A travel-size container." },
      ],
      compatibility: [
        "Container size and closure follow the setting and the local disposal route.",
      ],
      exclusions: [MEDICATION_EXCLUDED, "Regional disposal or collection guidance."],
      availability: "in_development",
      approvedContents: null,
      browse: [],
      browseNote: "No operating store publishes a sharps-container category today.",
      faqs: [
        {
          q: "How do I dispose of a full container?",
          a: "Disposal rules differ by region. Ask your pharmacy or local disposal program about the arrangements where you are.",
        },
      ],
    },
    {
      id: "K04",
      slug: "travel-support",
      group: "module",
      label: "Travel Supply Organization",
      audience: "People who need to carry supplies away from home for days or weeks.",
      purpose:
        "Organisation for travelling with supplies: carrying, separating, and keeping a first-aid basic set to hand.",
      roles: [
        {
          role: "occasional",
          title: "Occasional items",
          text: "Carry organisers and a basic first-aid set for travel.",
        },
        {
          role: "consumable",
          title: "Consumables",
          text: "Replenishment of the basic set after use.",
        },
      ],
      compatibility: ["Organisers are chosen for the supplies actually carried."],
      exclusions: [
        MEDICATION_EXCLUDED,
        "Temperature control, which depends on the specific product.",
      ],
      availability: "in_development",
      approvedContents: null,
      browse: [{ brand: "lifesupply", category: "First aid" }],
      browseNote: null,
      faqs: [
        {
          q: "Does an organiser control temperature?",
          a: "Not by itself. Temperature-control properties depend on the specific product and its manufacturer.",
        },
      ],
    },
    {
      id: "K05",
      slug: "home-monitoring",
      group: "module",
      label: "Home Monitoring Supplies",
      audience:
        "People monitoring at home under a clinician's direction, and the clinics that set them up.",
      purpose:
        "Monitoring equipment and its accessories, sized and matched to the person and the device.",
      roles: [
        {
          role: "starter",
          title: "Starter equipment",
          text: "A monitor chosen once, with the right cuff or accessory size.",
        },
        {
          role: "consumable",
          title: "Consumables",
          text: "Device-specific accessories replaced as used.",
        },
      ],
      compatibility: ["Accessory sizing follows the person; accessory type follows the device."],
      exclusions: [MEDICATION_EXCLUDED, "Interpretation of readings or treatment decisions."],
      availability: "in_development",
      approvedContents: null,
      browse: [
        { brand: "lifesupply", category: "Biometric monitors" },
        { brand: "lifesupply", category: "Medical thermometers" },
        { brand: "wellmart", category: "Health monitors" },
        { brand: "balkowitsch", category: "Digital measuring devices" },
      ],
      browseNote: null,
      faqs: [
        {
          q: "Does the site help me read results?",
          a: "No. Readings are interpreted by your clinician.",
        },
      ],
    },
    {
      id: "K06",
      slug: "diabetes-supplies",
      group: "program",
      label: "Diabetes Supply Support",
      audience:
        "People managing diabetes under clinical direction, and the clinics and pharmacies that supply them.",
      purpose:
        "A proposed approach to compatible meter, strip, and lancing supplies, with replenishment needs agreed for the program.",
      roles: [
        {
          role: "starter",
          title: "Starter equipment",
          text: "A meter and lancing device, chosen once.",
        },
        {
          role: "consumable",
          title: "Consumables",
          text: "Strips and lancets that match the meter and device in use, replaced on the usage cycle.",
        },
      ],
      compatibility: ["Strips match the meter; lancets match the lancing device."],
      exclusions: [MEDICATION_EXCLUDED, "Dose or treatment advice."],
      availability: "in_development",
      approvedContents: null,
      browse: [
        { brand: "lifesupply", category: "Diabetic" },
        { brand: "lifesupply", category: "Blood glucose meters" },
        { brand: "wellmart", category: "Diabetic" },
      ],
      browseNote: null,
      faqs: [
        {
          q: "Can I use any strips with my meter?",
          a: "No. Strips are matched to the meter; the store listing states which.",
        },
      ],
    },
    {
      id: "K07",
      slug: "clinic-injectable-supplies",
      group: "configuration",
      label: "Clinic Injectable Supplies",
      audience: "Clinics purchasing injectable supplies for their own use.",
      purpose:
        "A proposed approach to clinic supply purchasing and restocking around agreed stock levels.",
      roles: [
        {
          role: "starter",
          title: "Starter equipment",
          text: "Clinic-scale sharps disposal and storage, chosen once.",
        },
        {
          role: "consumable",
          title: "Consumables",
          text: "Injectable supplies at the clinic's par levels, restocked as used.",
        },
      ],
      compatibility: [
        "Configurations follow the clinic's procedures and devices; no configuration is a standard pack.",
      ],
      exclusions: [MEDICATION_EXCLUDED],
      availability: "in_development",
      approvedContents: null,
      browse: [
        { brand: "lifesupply", category: "Clinic supplies" },
        { brand: "lifesupply", category: "Needles and syringes" },
      ],
      browseNote: null,
      faqs: [
        {
          q: "Is there a standard clinic pack?",
          a: "No. Clinic configurations are set per clinic, at that clinic's par levels.",
        },
      ],
    },
    {
      id: "K08",
      slug: "pharmacy-patient-support",
      group: "configuration",
      label: "Pharmacy Patient-Support Supplies",
      audience: "Pharmacies supporting their patients with non-drug supplies.",
      purpose:
        "A proposed arrangement for pharmacist-selected non-drug supplies, with fulfilment responsibilities agreed before launch.",
      roles: [
        {
          role: "consumable",
          title: "Consumables",
          text: "Pharmacist-selected non-drug supplies, replaced on the usage cycle.",
        },
        {
          role: "occasional",
          title: "Occasional items",
          text: "Organisers or disposal items the pharmacist adds when needed.",
        },
      ],
      compatibility: ["Selection is the pharmacist's; the service does not substitute."],
      exclusions: [MEDICATION_EXCLUDED, "Any dispensing activity."],
      availability: "in_development",
      approvedContents: null,
      browse: [],
      browseNote: "This proposed pharmacy arrangement is in development and has no store listing.",
      faqs: [
        {
          q: "Who is responsible for complaints and recalls?",
          a: "Responsibility for complaints and recalls would be agreed for each program before fulfilment begins.",
        },
      ],
    },
  ] satisfies readonly KitPathway[],
} as const;

/**
 * The proposed supply and service model in one table (round two, 2026-09-10;
 * drafted with Codex against the evidence register). Four categories, each
 * with its contracting party, what is provided, whether the money is product
 * revenue or a service fee, how often it recurs, its status, and what the
 * clinical or pharmacy provider keeps. No price, percentage or volume, and
 * nothing here is a contract or an integration.
 */
export const commercialModel = {
  /**
   * The four parts of the proposed service and the two kinds of arrangement
   * they fall into, said once and in the customer's terms.
   *
   * Until 2026-09-11 the page described the same four parts twice in a row:
   * as an offer, then as a commercial model headed "Contracting party" and
   * "Revenue type", which is the voice of an investor document rather than a
   * page for a prospective clinic or pharmacy (product owner). This is the
   * one description. The distinction that mattered in the old table - store
   * purchasing versus a contracted service - is now the diagram's two lanes
   * and each part's arrangement.
   */
  eyebrow: "How it fits together",
  title: "Four parts, two kinds of arrangement.",
  intro:
    "Two parts are ordinary store purchasing, available today through the operating stores. Two are proposed services that would run under a written scope agreed in advance, with commercial terms established before launch. Nothing is priced.",
  kinds: {
    store: { title: "Store purchasing", status: "Available today" },
    service: { title: "Proposed services", status: "In development" },
  },
  labels: {
    purpose: "What it covers",
    customer: "Who orders",
    arrangement: "Arrangement",
    status: "Status",
    retained: "Clinical responsibility",
  },
  items: [
    {
      key: "patient",
      summary:
        "Non-drug supplies bought from the operating stores today; the program configurations that would shape them are in development.",
      kind: "store",
      title: "Patient supplies",
      purpose:
        "Starter equipment, consumables, and occasional items for a care program, selected around the devices already in use. Medication is excluded.",
      customer: "The patient or caregiver, on a store's own account.",
      arrangement: "An ordinary purchase from an operating store, on its published terms.",
      status:
        "Store purchasing operates today. The pathway configurations that would shape these selections are in development.",
      retained:
        "Prescribing, treatment, and every clinical decision stay with the clinician or pharmacist.",
    },
    {
      key: "clinic",
      summary: "A practice's routine supplies for its own rooms.",
      kind: "store",
      title: "Clinic purchasing",
      purpose:
        "A practice's routine buying: injection, monitoring, exam-room, infection-control, and minor wound-care supplies.",
      customer: "The clinic, on its own store account.",
      arrangement: "An ordinary purchase from an operating store, on its published terms.",
      status: "Operates today.",
      retained:
        "Clinical suitability, selection, and use of what is bought stay with the practice.",
    },
    {
      key: "fulfilment",
      summary: "Kit assembly, shipment, and replenishment administration.",
      kind: "service",
      title: "Fulfilment",
      purpose:
        "Assembly of non-drug supply kits, direct shipment, replenishment administration, and handling of a stock or delivery problem when one arises.",
      customer: "The clinic or pharmacy.",
      arrangement: "A written scope agreed in advance.",
      status: "In development. Not yet available.",
      retained:
        "What a kit must contain, and whether it suits the patient, stays with the clinician or pharmacist.",
    },
    {
      key: "workflow",
      summary: "Ordering, patient materials, and supply enquiries, on an agreed scope.",
      kind: "service",
      title: "Workflow support",
      purpose:
        "Non-clinical administrative support for ordering, patient materials, and supply enquiries.",
      customer: "The clinic or pharmacy.",
      arrangement: "A written scope agreed in advance.",
      status: "In development. Not yet available.",
      retained: "All clinical decisions, interpretation, and patient care stay with the provider.",
    },
  ],
  /**
   * Coordinated, never combined. Round four added this after the page had
   * implied one integrated arrangement; it is said here as what each party
   * keeps rather than as a list of things that do not exist.
   */
  // Unpublished since 2026-09-12 (product owner): the "Separate arrangements"
  // block was removed from the commercial model. Kept for the record.
  note: "Under the proposed model, supply planning would coordinate store purchases and separately agreed services: the operating stores keep their own ordering arrangements and accounts, and a proposed service would need its own agreed scope. It is a proposed model, not an offer, and it establishes no contract; it does not include connections between organisations' ordering systems.",
} as const;

export const KIT_SLUGS = metabolic.kits.map((kit) => kit.slug);

export function getKit(slug: string) {
  return metabolic.kits.find((kit) => kit.slug === slug) ?? null;
}
