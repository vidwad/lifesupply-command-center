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
 * purpose, the critical distinction from the guide's kit table, the three
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
  /** The guide's critical distinction, stated plainly. */
  distinction: string;
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
  status: {
    label: "In development",
    sentence:
      "The metabolic-health supply service is in development. No pathway is purchasable on this site, no configuration has been published, and availability will be announced when it is confirmed.",
  },
  disclaimer:
    "This site does not diagnose, prescribe, or recommend any medication or dose, and supply fulfilment is not drug dispensing. Product questions belong with your clinician, pharmacist, or the store that supplies you.",

  hub: {
    eyebrow: "Metabolic Care Supply & Services",
    title: "Support that stays with the patient.",
    intro:
      "Patient supplies, clinic procurement, partner-ready fulfilment, and workflow support for modern care pathways. LifeSupply is developing this as one commercial relationship, configured around the care pathway; this page explains the model and its status.",
    experience: {
      eyebrow: "A connected supply experience",
      title: "Start well. Stay supplied. Keep care moving.",
      intro:
        "LifeSupply connects non-drug patient supplies with clinic procurement, coordinated fulfilment, and practical workflow support: one commercial relationship, configured around the care pathway.",
      steps: [
        {
          index: "01",
          title: "Start",
          text: "A practical starter configuration brings together the selected equipment, accessories, and initial consumables.",
        },
        {
          index: "02",
          title: "Continue",
          text: "Consumables can be replenished around the approved care pathway without resending durable products.",
        },
        {
          index: "03",
          title: "Support",
          text: "Clear ordering, partner materials, and a defined service route help keep the experience consistent.",
        },
      ],
      result:
        "A better patient supply experience, and a broader procurement and fulfilment relationship for partners.",
    },
    streams: {
      eyebrow: "Integrated offer",
      title: "Four ways the relationship creates value.",
      intro:
        "The eight supply configurations open the conversation. Recurring patient supplies, clinic purchasing, and contracted operational services build the durable account.",
      items: [
        {
          title: "Patient supply pathways",
          text: "Configurable starter products, usage-driven consumables, monitoring accessories, sharps, and travel support.",
        },
        {
          title: "Clinic procurement",
          text: "Routine injection, monitoring, exam-room, infection-control, and minor wound-care supplies.",
        },
        {
          title: "Fulfilment & administration",
          text: "Kitting, direct shipment, replenishment administration, inventory support, and exception handling.",
        },
        {
          title: "Workflow & reporting",
          text: "Ordering visibility, status reporting, and non-clinical workflow support under an agreed service scope.",
        },
      ],
      note: "One portfolio, several ways in. Starter equipment is chosen once, not subscribed to. What recurs is the consumables a pathway uses up, the clinic's own ordinary purchasing, and any contracted service.",
    },
    audiences: {
      eyebrow: "For care partners",
      title: "A program designed around your pathway.",
      intro:
        "LifeSupply can support pharmacies, clinics, and coordinated care programs with a supply experience that reflects their patients, workflow, and service model.",
      items: [
        {
          title: "Pharmacies",
          text: "Extend onboarding and refill support with an approved, pharmacy-supported supply pathway.",
        },
        {
          title: "Clinics",
          text: "Organize recurring supplies around patient volumes, defined procedures, and clinic operations.",
        },
        {
          title: "Care programs",
          text: "Connect selected products, patient materials, and fulfilment into a consistent program experience.",
        },
      ],
      support: {
        title: "Program support",
        items: [
          "Selected starter contents",
          "Usage-driven replenishment",
          "Clinic supply account",
          "Coordinated fulfilment",
          "Workflow and status reporting",
        ],
      },
      principle: {
        title: "Partner principle",
        text: "The final program is shaped with the partner before launch, so products, materials, responsibilities, and fulfilment work together.",
      },
    },
    configure: {
      eyebrow: "Flexible by design",
      title: "Configure the experience, not just the box.",
      intro:
        "The strongest partner relationships align the physical kit with clinic purchasing, patient replenishment, fulfilment responsibilities, and service reporting.",
      items: [
        {
          title: "Contents",
          text: "Starter, refill, and durable-product options selected for the pathway.",
        },
        {
          title: "Cadence",
          text: "Replenishment shaped around expected use and the approved program.",
        },
        {
          title: "Materials",
          text: "Partner-ready information and ordering guidance for the intended audience.",
        },
        {
          title: "Presentation",
          text: "LifeSupply, co-branded, or partner-specific presentation where approved.",
        },
        {
          title: "Fulfilment",
          text: "A defined route from configuration through direct-to-patient and clinic replenishment.",
        },
        {
          title: "Support",
          text: "Ordering status, exception handling, reporting, and a defined escalation pathway.",
        },
      ],
      note: "Final contents, pricing, branding, and service scope are confirmed with the partner before release.",
    },
    process: {
      eyebrow: "Next step",
      title: "Build a supply and service program that fits.",
      intro:
        "Start with patient needs, clinic purchasing, and the partner workflow. LifeSupply can then shape the supply configuration, replenishment, fulfilment, and reporting approach.",
      items: [
        {
          index: "01",
          title: "Discuss",
          text: "A conversation about the program, the devices in use, the audience, and the region.",
        },
        {
          index: "02",
          title: "Configure",
          text: "A configuration is drafted per pathway: starter, consumable, and occasional roles, compatibility, and exclusions.",
        },
        {
          index: "03",
          title: "Confirm availability",
          text: "A configuration becomes orderable only when its contents, store, and fulfilment are confirmed and published. Until then it is information.",
        },
      ],
    },
    important: {
      title: "Important information",
      items: [
        "Programs provide non-drug supplies and non-clinical operational support; medication and prescriptions are not included.",
        "Final contents, device compatibility, sizes, refill quantities, and patient materials are confirmed for the approved pathway.",
        "Product availability, pricing, taxes, freight, and service scope are subject to confirmation.",
        "Programs do not replace product instructions, healthcare-provider guidance, or individualized clinical advice.",
      ],
    },
    actions: ["explore_kits", "discuss_program"],
  },

  kitsHub: {
    eyebrow: "Care kits",
    title: "Eight configurable supply pathways.",
    intro:
      "Each pathway is a configurable entry point, not a product. It names its audience, what starter, consumable, and occasional roles would cover, the compatibility rules that apply, and what is excluded. None is purchasable yet.",
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

  refills: {
    eyebrow: "Refills",
    title: "Starter items are not refills.",
    intro:
      "Only usage-driven consumables are refilled. Starter equipment is chosen once, and occasional items are bought when needed. This page states what refill service exists today and what does not.",
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

  kits: [
    {
      id: "K01",
      slug: "glp-1-support",
      label: "GLP-1 Support Supplies",
      audience:
        "People on a clinician-managed GLP-1 program, and the clinics and pharmacies that support them.",
      purpose:
        "Non-drug accessories for injection routines, sharps handling, and travel, configured to the prescribed device.",
      distinction:
        "Non-drug accessories only. Every item is device-specific: the prescribed pen or device determines which accessories fit. The medication itself is excluded.",
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
      distinction:
        "Compatible configurations only. An insulin syringe is not universal injectable equipment; needle gauge, length, and syringe volume follow the prescription.",
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
      distinction:
        "Container size follows the setting, and replacement is usage-driven. Disposal guidance must fit the region and the service scope, so none is given here until it is sourced for the region.",
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
      distinction:
        "An occasional purchase, not a refill. Any temperature or storage claim would follow the exact supported product, so none is made here.",
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
      distinction:
        "Equipment and accessory sizing and compatibility matter; nothing here interprets a reading or a treatment.",
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
      distinction:
        "Meter and strip compatibility, and lancing-device compatibility, are specific. Refill requirements follow actual usage, not a preset schedule.",
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
      distinction:
        "Clinic purchasing configurations and par-level restocking, not one repeated standard pack. Each clinic's configuration is its own.",
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
      distinction:
        "The pharmacist selects; the supply service fulfils. Who holds stock, who ships, and who handles complaints and recalls is stated per program before anything is fulfilled.",
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
  eyebrow: "Compare the pathways",
  title: "Eight starting points, side by side.",
  intro:
    "Each pathway is a configurable starting point for a supply conversation, not a product. They overlap on purpose: a program can draw on more than one, and none of them excludes another.",
  labels: {
    audience: "Intended for",
    purpose: "Supply purpose",
    role: "Durable and consumable roles",
    status: "Status",
  },
  note: "All eight are in development. Nothing is purchasable on this site, no configuration has been published, and starter equipment is chosen once rather than replenished on a cycle.",
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
      status: "In development. Reporting scope is not defined and is not offered.",
      retained: "All clinical decisions, interpretation, and patient care.",
    },
  ],
  note: "This describes a proposed model. It is not an offer, it establishes no contract, and it implies no integration between the operating stores or with a provider's own systems. The two contracted categories are in development and cannot be bought today.",
} as const;

/** One comparison row per pathway, built from its own fields. Adds no claim. */
export function comparisonRows() {
  return metabolic.kits.map((kit) => ({
    id: kit.id,
    slug: kit.slug,
    label: kit.label,
    audience: kit.audience,
    purpose: kit.purpose,
    roles: kit.roles.map((role) => role.title).join(", "),
    status: metabolic.status.label,
  }));
}

export const KIT_SLUGS = metabolic.kits.map((kit) => kit.slug);

export function getKit(slug: string) {
  return metabolic.kits.find((kit) => kit.slug === slug) ?? null;
}
