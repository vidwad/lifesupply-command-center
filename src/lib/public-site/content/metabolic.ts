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

export interface KitPathway {
  id: string;
  slug: string;
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

const ROLE_TEXT = {
  starter: "Durable items chosen once for the person or the clinic and not repeated on a schedule.",
  consumable: "Items used up in the course of care and replaced on the usage cycle.",
  occasional: "Items bought once or rarely, such as travel or storage organisers.",
} as const;

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
    title: "A supply program shaped around a care pathway.",
    intro:
      "LifeSupply is developing a non-drug supply service for clinics, pharmacies, and care programs, bringing patient supplies and day-to-day clinic purchasing into one coordinated plan. The service is in development: no pathway and no program can be ordered yet.",

    /**
     * The offer, once. Four parts, each said one way.
     */
    offer: {
      eyebrow: "The proposed service",
      title: "From patient supplies to clinic purchasing.",
      items: [
        {
          title: "Patient supplies",
          text: "Eight configurable pathways would bring together the starter equipment, consumables, and occasional items a care program uses, selected around the devices already in use. Medication and prescriptions are excluded.",
        },
        {
          title: "Clinic purchasing",
          text: "The same conversation would cover a practice's routine buying: injection, monitoring, exam-room, infection-control, and minor wound-care supplies, through the store that carries them.",
        },
        {
          title: "Fulfilment",
          text: "A plan would set out how items are assembled and shipped, how replenishment is handled, and who deals with a stock or delivery problem when one arises.",
        },
        {
          title: "Workflow support",
          text: "Administrative support for ordering, patient materials, and supply enquiries, under a scope agreed in advance. Clinical decisions stay with the clinician or pharmacist.",
        },
      ],
      /**
       * The four are coordinated, never combined. Round four added this after
       * the page had implied a single integrated arrangement, and it survives
       * the 2026-09-11 rewrite because dropping it would let the four read as
       * one platform.
       */
      note: "The four are coordinated, not combined. They would stay separate arrangements: not one contract, not one account, and not a connection between anyone's systems.",
    },

    actions: ["discuss_program", "explore_kits"],

    /** The closing band: what a first conversation covers, and what it is not. */
    close: {
      eyebrow: "Next step",
      title: "Start a supply conversation.",
      text: "A first conversation covers the patients or the practice, the devices and supplies involved, the region, and how ordering and delivery would need to work.",
      qualification:
        "It commits no one to buying or supplying anything. A configuration becomes orderable only once its contents, its store, and its fulfilment are confirmed and published, and any pilot would need its own signed agreement.",
    },
  },

  kitsHub: {
    eyebrow: "Supply pathways",
    title: "Eight starting points for a supply plan.",
    intro:
      "Each pathway is a configurable starting point rather than a product: who it is for, what the starter, consumable, and occasional items would cover, which compatibility rules apply, and what is excluded. They overlap on purpose, so a program can draw on more than one.",
    legend: {
      title: "Item roles",
      items: [
        { role: "starter", title: "Starter equipment", text: ROLE_TEXT.starter },
        { role: "consumable", title: "Consumables", text: ROLE_TEXT.consumable },
        { role: "occasional", title: "Occasional items", text: ROLE_TEXT.occasional },
      ],
    },
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
    title: "Starter items are not refills.",
    intro:
      "Only the consumables a pathway uses up are replenished. Starter equipment is chosen once, and occasional items are bought when they are needed.",
    today: {
      title: "Today",
      items: [
        "Reordering happens through the operating stores, with their accounts and repeat ordering as each store provides.",
        "There is no automatic shipment, no reminder service, and no subscription on this site today.",
        "Intervals, pauses, changes, and cancellation therefore follow the store's own ordering, not a program schedule.",
      ],
    },
    later: {
      title: "When a service is published",
      text: "If a refill service is launched, this page will state whether it is reminder-based or automatic shipment, the intervals, how to pause, change, or cancel, and how substitutions are handled. None of that is offered until it is published here.",
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
    eyebrow: "Collaboration",
    title: "Help shape the program before it exists.",
    intro:
      "The pathways are starting points, not finished products. Clinics, pharmacies, manufacturers and suppliers can help define what a configuration should contain for the people they look after. Clinical decisions stay with the clinician or pharmacist throughout.",
    who: {
      title: "Who a collaboration is with",
      items: [
        "A clinic whose staff want a configuration shaped around a program they already run. The clinic's side of this is set out under Clinic Solutions.",
        "A pharmacy whose pharmacist would select the non-drug supplies for its patients. The pharmacy's side of this is set out under Pharmacy Solutions.",
        "A manufacturer or supplier whose products would sit inside a configuration, on the supplier terms published separately.",
      ],
    },
    /**
     * What a plan would settle. This absorbed the six "Configure the
     * experience" dimensions, which asked the same question from the other
     * direction, and the "Partner principle" note that followed them.
     */
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
    actions: ["discuss_program", "clinic_solutions"],
  },

  kits: [
    {
      id: "K01",
      slug: "glp-1-support",
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
      exclusions: [
        MEDICATION_EXCLUDED,
        "Regional disposal or collection guidance, until sourced for the region.",
      ],
      availability: "in_development",
      approvedContents: null,
      browse: [],
      browseNote:
        "No operating store publishes a sharps-container category today, so there is nothing to browse. This pathway has no store destination until one exists.",
      faqs: [
        {
          q: "How do I dispose of a full container?",
          a: "Disposal rules differ by region. This site does not give disposal guidance until it is sourced for your region; ask your pharmacy or local program.",
        },
      ],
    },
    {
      id: "K04",
      slug: "travel-support",
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
      exclusions: [MEDICATION_EXCLUDED, "Temperature, cooling, or storage-performance claims."],
      availability: "in_development",
      approvedContents: null,
      browse: [{ brand: "lifesupply", category: "First aid" }],
      browseNote: null,
      faqs: [
        {
          q: "Does an organiser control temperature?",
          a: "No storage-performance claim is made on this site. Any such property belongs to a specific product and its manufacturer.",
        },
      ],
    },
    {
      id: "K05",
      slug: "home-monitoring",
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
      label: "Diabetes Supply Support",
      audience:
        "People managing diabetes under clinical direction, and the clinics and pharmacies that supply them.",
      purpose:
        "Meter, strip, and lancing supplies matched to the meter in use, with actual refill requirements stated.",
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
      label: "Clinic Injectable Supplies",
      audience: "Clinics purchasing injectable supplies for their own use.",
      purpose: "Clinic purchasing configurations and par-level restocking, set up per clinic.",
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
      label: "Pharmacy Patient-Support Supplies",
      audience: "Pharmacies supporting their patients with non-drug supplies.",
      purpose:
        "Pharmacist-selected non-drug supplies, with fulfilment responsibilities stated explicitly.",
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
      browseNote:
        "There is no store collection for pharmacy programs. A program is configured by conversation with the pharmacy, and nothing is listed until it is.",
      faqs: [
        {
          q: "Who is responsible for complaints and recalls?",
          a: "That is stated per program before fulfilment starts, and never assumed.",
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
/**
 * The eight pathways side by side, so a visitor can compare them without
 * opening eight pages (round two, 2026-09-10). Every field is taken from the
 * pathway's own entry; the table adds no claim. Pathways are starting
 * points, not exclusive choices, and the note says so.
 */
export const pathwayComparison = {
  labels: {
    audience: "Intended for",
    purpose: "Supply purpose",
    role: "Durable and consumable roles",
    status: "Status",
  },
  note: "Starter equipment is chosen once rather than replenished on a cycle, so a pathway's Status describes the configuration rather than a subscription.",
} as const;

export const commercialModel = {
  eyebrow: "How the model works",
  title: "Who buys what, and on what basis.",
  intro:
    "Buying products and contracting a service are different arrangements, and the four categories below keep them apart. Two of them operate today through the stores. Two are in development. Clinical and pharmacy providers keep every clinical decision in all four.",
  labels: {
    customer: "Contracting party",
    provided: "What is provided",
    revenue: "Revenue type",
    frequency: "Frequency",
    status: "Status",
    retained: "Provider retains",
  },
  rows: [
    {
      category: "Patient supply purchases",
      customer: "The patient or caregiver, buying from an operating store on its own account.",
      provided:
        "Pharmacist-selected non-drug supplies, or metabolic-health starter equipment and usage-driven consumables. Medication is excluded.",
      revenue: "Product revenue, on the store's ordinary terms.",
      frequency: "Starter equipment once; consumables as they are used.",
      status:
        "Store purchasing operates today. The programs that would shape these selections are in development.",
      retained: "Prescribing, treatment, and every clinical decision.",
    },
    {
      category: "Clinic-wide procurement",
      customer: "The clinic, purchasing through an operating store.",
      provided: "Equipment and consumables for the clinic's own use, chosen by the practice.",
      revenue: "Product revenue, on the store's ordinary terms.",
      frequency: "Equipment occasionally; consumables on the practice's own reordering cycle.",
      status: "Ordinary store purchasing, which operates today on the store's own terms.",
      retained: "Clinical suitability, selection, and use of what is bought.",
    },
    {
      category: "Contracted kitting and fulfilment",
      customer: "The clinic or pharmacy, under a written scope agreed in advance.",
      provided:
        "Assembly of non-drug supply kits, direct shipment, replenishment administration, and exception handling.",
      revenue: "Service revenue rather than product revenue. Nothing is priced.",
      frequency: "As the agreed scope sets out.",
      status: "In development. Not available, and nothing is priced.",
      retained: "What the kit must contain, and whether it suits the patient.",
    },
    {
      category: "Contracted workflow support",
      customer: "The clinic or pharmacy, under a written scope agreed in advance.",
      provided: "Non-clinical administrative support for the supply side of a program.",
      revenue: "Service revenue rather than product revenue. Nothing is priced.",
      frequency: "As the agreed scope sets out.",
      status: "In development, and not available today.",
      retained: "All clinical decisions, interpretation, and patient care.",
    },
  ],
  note: "This describes a proposed model. It is not an offer, it establishes no contract, and it implies no integration between the operating stores or with a provider's own systems. The two contracted categories are in development and cannot be bought today.",
} as const;

/**
 * One comparison row per pathway, built from its own fields. Adds no claim.
 *
 * This is the care-kits hub's only catalogue (round three, outcome 5): the
 * eight cards that used to repeat it are gone, so each row carries the route
 * to its own page and the name is the way in.
 */
export function comparisonRows() {
  return metabolic.kits.map((kit) => ({
    id: kit.id,
    slug: kit.slug,
    label: kit.label,
    audience: kit.audience,
    purpose: kit.purpose,
    roles: kit.roles.map((role) => role.title).join(", "),
    // Every pathway carries the same status, so the comparison states it
    // once per row from one place rather than eight times in the data.
    status: "In development",
  }));
}

export const KIT_SLUGS = metabolic.kits.map((kit) => kit.slug);

export function getKit(slug: string) {
  return metabolic.kits.find((kit) => kit.slug === slug) ?? null;
}
