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

  process: [
    {
      index: "01",
      title: "Understand the practice",
      text: "Services, equipment, workflow, and vision become a roadmap for the space and the growth plan.",
    },
    {
      index: "02",
      title: "Assess and plan",
      text: "Space, logistics, utilities, and compliance requirements; layouts, timelines, budgets, and scope.",
    },
    {
      index: "03",
      title: "Design",
      text: "Floor plans, 3D renderings, finishes, ergonomics, and infection-control considerations built into the detail.",
    },
    {
      index: "04",
      title: "Build and hand over",
      text: "Healthcare-focused construction with permits, inspections, walkthroughs, and post-construction support.",
    },
  ],

  /** Published project pages on the Clinics site; verified 2026-09-08. Titles as published. */
  projects: {
    eyebrow: "Clinic projects",
    title: "Six clinic projects across British Columbia.",
    intro:
      "Medical, oral surgery, ENT, and physiotherapy clinics in Burnaby, Squamish, White Rock, Abbotsford, and Vancouver. Each one opens on the LifeSupply Clinics site, where the project is presented in full.",
    items: [
      {
        title: "Medical clinic construction in Burnaby",
        href: "https://www.lifesupplyclinics.com/portfolio/medical-clinic-construction-in-burnaby/",
      },
      {
        title: "Oral surgery clinic in Squamish",
        href: "https://www.lifesupplyclinics.com/portfolio/oral-surgery-clinic-in-squamish/",
      },
      {
        title: "Oral surgery in White Rock",
        href: "https://www.lifesupplyclinics.com/portfolio/oral-surgery-in-white-rock/",
      },
      {
        title: "ENT clinic construction in Abbotsford",
        href: "https://www.lifesupplyclinics.com/portfolio/ent-clinic-construction-in-abbotsford/",
      },
      {
        title: "Physio clinic construction in Vancouver",
        href: "https://www.lifesupplyclinics.com/portfolio/physio-clinic-construction-in-vancouver/",
      },
      {
        title: "Medical clinic design-build in Vancouver",
        href: "https://www.lifesupplyclinics.com/portfolio/medical-clinic-design-build-in-vancouver/",
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
      "LifeSupply Clinics plans, designs, builds, and fits out medical, dental, and wellness clinics in British Columbia, and handles equipment enquiries for them. A clinic that is already open can start at supply instead: that needs no construction project at all.",

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
          text: "Opening, renovating, or expanding a practice in British Columbia. Planning, design, construction, fit-out, and the equipment that goes with it.",
          href: "#planning",
          label: "Plan or renovate a clinic",
        },
        {
          index: "02",
          title: "Equipment for a clinic",
          text: "Rooms to equip or specific devices in mind, for a new practice or an expanding one. Planned room by room and priced by quote.",
          href: "#equipment",
          label: "Plan and quote equipment",
        },
        {
          index: "03",
          title: "Supplies for an open clinic",
          text: "Already seeing patients. Everyday supplies and repeat ordering through the operating stores, with no construction project involved.",
          href: "#ongoing-supplies",
          label: "Keep a clinic supplied",
        },
      ],
      collaboration: {
        text: "Interested in shaping a supply programme, or in working together on a clinic design?",
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
    },

    servicesHeading: { eyebrow: "Services", title: "From feasibility to hand-over." },
    specialtiesHeading: { eyebrow: "Specialties", title: "Clinic types served." },
    processHeading: {
      eyebrow: "Process",
      title: "Four stages, from first conversation to hand-over.",
    },
    actions: ["plan_clinic", "equipment_quote", "clinic_supply_review"],

    /** The closing band: one call to action, and what each step does not commit anyone to. */
    close: {
      eyebrow: "Next step",
      title: "Start with what the clinic needs.",
      text: "Book a consultation to discuss a project in British Columbia, request an equipment quote, or arrange a supply review for a clinic that is already open.",
      qualification:
        "Projects, equipment orders, and ongoing supplies are agreed separately. A consultation does not commit anyone to a project, a quote is not an order, and completing a project creates no obligation to buy supplies.",
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
    title: "Help shape a supply program, or a clinic design.",
    intro:
      "Two things are open to a clinic beyond buying: helping configure the metabolic-health supply program, which is in development and not yet running, or a design partnership on a British Columbia clinic project. Neither is needed to order supplies; a clinic that simply wants to buy is a customer of the store, on that store's own terms.",
    items: [
      {
        title: "Program configuration",
        text: "Clinical staff define what a supply configuration has to contain for their program. LifeSupply would then set out what is needed to start, what is used up and reordered, and what is bought occasionally, and confirm that each item fits the devices in use. Nothing is fulfilled until the configuration and the store that carries it are agreed.",
        status: "Proposed",
      },
      {
        title: "Pilots",
        text: "A limited pilot of a program's supply or workflow support, discussed before it is designed. Any pilot would need its own written agreement covering scope, duration, responsibilities, commercial terms, and how it ends. None is running today.",
        status: "Proposed",
      },
      {
        title: "Design partnership",
        text: "Early involvement in a clinic project's planning, layout, and equipment choices, delivered through LifeSupply Clinics and the trades and suppliers it works with.",
        status: "Available through LifeSupply Clinics",
      },
    ],
    metabolicNote:
      "Metabolic Health sets out that program in full: who it would serve, the eight supply pathways it covers, and what has to be agreed before any of it starts.",
    actions: ["clinic_collaboration", "metabolic_hub"],
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
    catalogue: {
      title: "Opening supplies and consumables",
      text: "Clinic and dental clinic supply categories are published on LifeSupply.ca, and can be ordered there directly.",
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
    title: "Keep an open clinic supplied.",
    intro:
      "Ordering runs through the LifeSupply Health stores: LifeSupply.ca for clinic and dental clinic supplies, and Wellmart Medical for home medical equipment. Each has its own accounts, published prices, and repeat ordering. A supply review matches a practice to the right categories and the store that carries them, so a buyer does not have to work out which store stocks what.",
    /** The one line about projects on a page that is not about projects. */
    projectPointer:
      "Planning, design, construction, and fit-out are a separate service, for British Columbia projects.",
    /** The link that follows the pointer, so the reader is not left hunting. */
    projectPointerLink: { href: "#planning", label: "See clinic projects" },
    boundary:
      "This section covers supplies. LifeSupply does not operate patient-care clinics and takes no part in clinical decisions.",
    available: {
      title: "Available today",
      items: [
        "Store accounts and repeat ordering, as published on each store",
        "Clinic-supply and dental clinic-supply categories on LifeSupply.ca",
        "Home medical equipment and supply categories on Wellmart Medical",
        "Customer service by phone and email during published hours",
      ],
    },
    conditional: {
      title: "Discussed case by case",
      text: "Approved substitutions, par-level restocking, automatic replenishment, and contracted procurement services are not offered on this site today. Where a clinic needs them, they are discussed and agreed separately.",
    },
    actions: ["clinic_supply_review", "shop_lifesupply"],
  },
} as const;
