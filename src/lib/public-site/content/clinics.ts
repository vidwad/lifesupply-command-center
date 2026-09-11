/**
 * LifeSupply Clinics and Clinic Solutions copy (guide §3). Since the
 * restructure of 2026-09-08, `/clinic-solutions/` is the LifeSupply Clinics
 * section, with Equipment and Ongoing supplies as its two children.
 *
 * Rules applied throughout:
 *   - LifeSupply Clinics is clinic development, construction and fit-out,
 *     and equipment services delivered with the trades and suppliers each
 *     project needs. Nothing
 *     here describes a company-operated patient-care clinic.
 *   - Services, specialties, process, and projects are as the Clinics site
 *     publishes them (SOURCE_REGISTER.md S-70 to S-75). Delivery roles are
 *     attributed only as that site states them; partner names are not
 *     published, so none are invented (WEB-03).
 *   - Post-opening supply is conditional: a project is not an order, and an
 *     order is not a supply commitment.
 * External destinations come from the action and brand registries.
 */
export const clinics = {
  services: [
    {
      title: "Planning",
      items: [
        "Site evaluation and feasibility",
        "Space planning and workflow",
        "Regulatory and compliance assessment",
        "Budgeting and scheduling",
        "Equipment and utilities coordination",
      ],
    },
    {
      title: "Design",
      items: [
        "Interior design and layout",
        "3D renderings and concept visualization",
        "Material and finish selection",
        "Infection-control considerations",
        "Accessibility and ergonomics",
      ],
    },
    {
      title: "Construction",
      items: [
        "Full clinic builds and turnkey delivery",
        "Renovations and expansions",
        "Mechanical, electrical, and plumbing installation",
        "On-site project management and quality control",
      ],
    },
    {
      title: "Project management",
      items: [
        "Permits and inspections",
        "Contractor and vendor coordination",
        "Budget tracking and reporting",
        "Final walkthroughs and post-construction support",
      ],
    },
  ],

  specialties: [
    "Dental clinics",
    "Medical offices",
    "Med spas and aesthetic clinics",
    "Physiotherapy and rehabilitation centres",
    "Surgical suites (non-hospital)",
  ],

  /**
   * What happens next, in one sentence a stage. It used to restate the four
   * service groups above it almost word for word - "3D renderings" appeared
   * in both - which made the page feel assembled rather than written
   * (product owner, 2026-09-11). The services carry the substance; this
   * carries the sequence.
   */
  process: [
    {
      index: "01",
      title: "Consultation",
      text: "Talk through the practice and the space it needs.",
    },
    {
      index: "02",
      title: "Scope and budget",
      text: "Agree what the project covers, what it costs, and when it runs.",
    },
    {
      index: "03",
      title: "Design",
      text: "Review drawings and finishes ahead of construction.",
    },
    {
      index: "04",
      title: "Build and hand over",
      text: "See the finished space at the final walkthrough.",
    },
  ],

  /**
   * Published project pages on the Clinics site; titles, clinic types, floor
   * areas and build years verified against each page on 2026-09-11.
   *
   * Until that date this was six titles and six links, illustrated by a
   * laptop showing the LifeSupply Clinics home page, which demonstrates that
   * another website exists rather than the quality of the work (product
   * owner). Three now carry a photograph of the finished room, registered in
   * `project-photography.ts` with the page it came from.
   *
   * Every value here is as published. The Vancouver rehabilitation project is
   * published as an "Allied Health Clinic" on a page titled "Physio clinic
   * construction", and the published type is what is stated. No scope,
   * budget, client or endorsement is published, because none is available.
   */
  projects: {
    eyebrow: "Clinic projects",
    title: "Six clinic projects across British Columbia.",
    intro:
      "Medical, oral surgery, ENT, and rehabilitation clinics in Burnaby, Squamish, White Rock, Abbotsford, and Vancouver, built between 2021 and 2024. Each one opens its project page on the LifeSupply Clinics site.",
    /** Labels for the facts each project publishes. */
    labels: { type: "Clinic type", area: "Floor area", year: "Built" },
    items: [
      {
        title: "Medical clinic construction in Burnaby",
        type: "Medical clinic",
        place: "Burnaby, BC",
        area: "3,000 sq ft",
        year: "2023",
        photo: "burnaby",
        href: "https://www.lifesupplyclinics.com/portfolio/medical-clinic-construction-in-burnaby/",
      },
      {
        title: "ENT clinic construction in Abbotsford",
        type: "ENT clinic",
        place: "Abbotsford, BC",
        area: "3,000 sq ft",
        year: "2022",
        photo: "abbotsford",
        href: "https://www.lifesupplyclinics.com/portfolio/ent-clinic-construction-in-abbotsford/",
      },
      {
        title: "Medical clinic design-build in Vancouver",
        type: "Medical clinic",
        place: "Vancouver, BC",
        area: "3,000 sq ft",
        year: "2022",
        photo: "vancouverMedical",
        href: "https://www.lifesupplyclinics.com/portfolio/medical-clinic-design-build-in-vancouver/",
      },
      {
        title: "Oral surgery clinic in Squamish",
        type: "Oral surgery clinic",
        place: "Squamish, BC",
        area: "4,000 sq ft",
        year: "2024",
        href: "https://www.lifesupplyclinics.com/portfolio/oral-surgery-clinic-in-squamish/",
      },
      {
        title: "Oral surgery in White Rock",
        type: "Oral surgery clinic",
        place: "White Rock, BC",
        area: "4,000 sq ft",
        year: "2024",
        href: "https://www.lifesupplyclinics.com/portfolio/oral-surgery-in-white-rock/",
      },
      {
        title: "Physio clinic construction in Vancouver",
        type: "Allied health clinic",
        place: "Vancouver, BC",
        area: "2,000 sq ft",
        year: "2021",
        href: "https://www.lifesupplyclinics.com/portfolio/physio-clinic-construction-in-vancouver/",
      },
    ],
  },

  /**
   * Clinic Solutions hub (`/clinic-solutions/`). Since 2026-09-08 this is
   * the LifeSupply Clinics section itself: the former brand page and the
   * former Design & build child merged into it, so one page carries the
   * brand, the services, the process, the projects, the consultation, and
   * the three-need router (plan it, equip it, keep it supplied).
   */
  hub: {
    eyebrow: "Clinic Solutions · LifeSupply Clinics",
    title: "Plan it, equip it, or keep it supplied.",
    intro:
      "Planning, design, construction, and equipment for medical, dental, and wellness clinics in British Columbia, plus everyday supplies for practices already operating.",
    /**
     * The headline promises three services and the hero offered two actions.
     * This is the third, kept quieter than the buttons because a clinic that
     * only wants to buy is the reader least likely to need a conversation.
     */
    supplyRoute: {
      text: "Buying supplies for an existing clinic?",
      href: "#ongoing-supplies",
      label: "Go straight to supplies",
    },

    /**
     * One router (page redesign, 2026-09-10).
     *
     * The page asked the same question three times before saying anything: a
     * section-navigation strip, then a two-card "which do you need", then a
     * three-card "plan / equip / supply". They routed to the same places. This
     * is the one control that does that job, and it is a named navigation
     * landmark, so it also serves as the page's section navigation.
     *
     * Collaboration sits below the three as a quieter line, because it is a
     * different kind of relationship and far fewer readers want it.
     */
    router: {
      eyebrow: "Start here",
      title: "What does your clinic need?",
      routes: [
        {
          index: "01",
          title: "A clinic project",
          text: "Opening, renovating, or expanding a practice in British Columbia: planning, design, construction, and fit-out.",
          href: "#planning",
          label: "Plan or renovate a clinic",
        },
        {
          index: "02",
          title: "Equipment for a clinic",
          text: "Rooms to equip or a device to replace. Planned room by room and priced by quote.",
          href: "#equipment",
          label: "Plan and quote equipment",
        },
        {
          index: "03",
          title: "Supplies for an open clinic",
          text: "Already seeing patients. Everyday supplies through the operating stores, with no construction project involved.",
          href: "#ongoing-supplies",
          label: "Keep a clinic supplied",
        },
      ],
      collaboration: {
        text: "There is also a proposed supply-program collaboration for clinics.",
        href: "#collaboration",
        label: "Collaboration",
      },
    },

    planning: {
      eyebrow: "Planning, design, and construction",
      title: "Bring a clinic plan into focus.",
      intro:
        "Whether a practice is opening, renovating, or expanding, the first conversation covers the space, the workflow, the equipment it has to hold, the budget, and the target opening date.",
      /**
       * The two qualifications that matter, as body copy where the reader has
       * just learned what the service is. They sat in a grey box at position
       * two before this redesign, ahead of anything they qualified.
       */
      boundary:
        "LifeSupply Clinics develops clinic spaces, and delivers the construction with its core partners. It does not operate patient-care clinics and takes no part in clinical decisions.",
      /**
       * Design partnership, moved here from Collaboration on 2026-09-11. It
       * is part of how a project runs, not a separate proposition, and it
       * only means anything to a reader who is already planning one.
       */
      partnership:
        "A practice that wants to be involved earlier can take a design partnership: a say in planning, layout, and equipment choices from the start, delivered through LifeSupply Clinics and the trades and suppliers it works with.",
      partnershipStatus: "Available through LifeSupply Clinics",
    },

    servicesHeading: { eyebrow: "Services", title: "From feasibility to hand-over." },
    specialtiesHeading: { eyebrow: "Specialties", title: "Clinic types served" },
    processHeading: {
      eyebrow: "Process",
      title: "Four stages, from first conversation to hand-over.",
    },
    actions: ["plan_clinic", "equipment_quote", "clinic_supply_review"],

    /**
     * The closing band. Each action says who it is for, because three buttons
     * in a row tell a reader nothing about which one is theirs. The
     * qualification was three clauses explaining what each step is not, which
     * made the page end defensively; one sentence carries the same
     * distinction (product owner, 2026-09-11).
     */
    close: {
      eyebrow: "Next step",
      title: "Start with what the clinic needs.",
      routes: [
        { prompt: "Opening, renovating, or expanding?", action: "plan_clinic" },
        { prompt: "Equipping rooms, or replacing a device?", action: "equipment_quote" },
        { prompt: "Need everyday supplies?", action: "clinic_supply_review" },
      ],
      qualification:
        "Projects, equipment purchases, and ongoing supplies are scoped and agreed separately.",
    },
  },

  /**
   * Clinic collaboration, moved here from `/partners/clinics` when that page
   * was retired (consolidation stage 1, 2026-09-10). It belongs beside the
   * clinic relationship it describes rather than in a partners hub, and the
   * distinction it draws — purchasing is not collaboration — is the reason it
   * has to travel with the rest of the clinic content rather than be dropped.
   *
   * The supply program a collaboration would configure is the metabolic-health
   * service, so the section links there rather than restating its scope.
   */
  collaboration: {
    eyebrow: "Collaboration",
    title: "Help shape a metabolic-health supply program.",
    text: "LifeSupply is developing non-drug supply and fulfilment arrangements with prospective clinic and pharmacy collaborators. The program is in development and not yet running, and no pilot is running today. Metabolic Health sets out who it would serve and the eight supply pathways it covers.",
    /** Buying needs none of it. The distinction the retired box existed to draw. */
    note: "None of it is needed to order supplies: a clinic that simply wants to buy is a customer of the store, on that store's own terms.",
    status: "Proposed",
    actions: ["metabolic_hub", "clinic_collaboration"],
  },

  equipment: {
    eyebrow: "Clinic equipment",
    title: "Plan the equipment each room needs.",
    intro:
      "LifeSupply Clinics plans equipment room by room, from the exam room to the sterilization area, for medical, dental, and wellness clinics in British Columbia. That covers a practice fitting out for the first time, one expanding, and one replacing or adding a device in rooms already in use. Equipment is priced by quote rather than listed.",
    quote: {
      title: "What a quote request needs",
      items: [
        "Rooms and functions to equip",
        "Specialty procedures and any specific devices",
        "Timeline to opening, or the date delivery is needed",
        "Delivery address and access",
      ],
    },
    actions: ["equipment_quote"],
  },

  /**
   * `/clinic-solutions/ongoing-supplies/`
   *
   * Round four, change 5. This page is read by a clinic that is already open
   * and wants to buy. It used to carry the construction attribution and the
   * project-sequence qualification, both of which belong to a project the
   * reader is not undertaking. They stay on the project pages; a single line
   * points there for anyone who does need them, and the non-clinical boundary
   * stays because it qualifies what is on this page.
   */
  ongoingSupplies: {
    eyebrow: "Supplies for an open clinic",
    title: "Everyday supplies for your practice.",
    intro:
      "Source everyday practice supplies from LifeSupply.ca and Wellmart Medical. Browse the categories below, or ask for a supply review and we will point the practice at the right ones and the store that carries them.",
    /**
     * What a practice can actually source, with the category it is published
     * in. Every link was verified on 2026-09-11; the store publishes its own
     * prices and availability, and none is repeated here.
     */
    categories: {
      title: "What a practice can source",
      items: [
        {
          label: "Clinic supplies",
          text: "Exam-room consumables, infection control, and general practice supplies.",
          href: "https://lifesupply.ca/clinic-supplies/",
        },
        {
          label: "Dental clinic supplies",
          text: "Operatory and sterilisation supplies for a dental practice.",
          href: "https://lifesupply.ca/dental-clinic-supplies/",
        },
        {
          label: "Needles and syringes",
          text: "Needles and syringes, browsable by gauge and volume.",
          href: "https://lifesupply.ca/needles-syringes/",
        },
        {
          label: "First aid",
          text: "Wound care, dressings, and the contents of a practice first-aid station.",
          href: "https://lifesupply.ca/first-aid/",
        },
        {
          label: "Monitors and diagnostics",
          text: "Blood-pressure and biometric monitors, thermometers, and glucose meters.",
          href: "https://lifesupply.ca/biometric-monitors/",
        },
        {
          label: "Home medical equipment",
          text: "Mobility, respiratory, and home-care categories, on Wellmart Medical.",
          href: "https://wellmartmedical.com/home-medical-equipment/",
        },
      ],
    },
    /** How buying works, once, after the reader knows what is on offer. */
    ordering:
      "Prices, availability, ordering, and order support are handled by the store itself, on its own account.",
    boundary:
      "This section covers supplies. LifeSupply does not operate patient-care clinics and takes no part in clinical decisions.",
    /** The one line about projects on a page that is not about projects. */
    projectPointer:
      "Planning, design, construction, and fit-out are a separate service, for British Columbia projects.",
    /** The link that follows the pointer, so the reader is not left hunting. */
    projectPointerLink: { href: "#clinic-projects", label: "See clinic projects" },
    actions: ["clinic_supply_review", "browse_clinic_supplies"],
  },
} as const;
