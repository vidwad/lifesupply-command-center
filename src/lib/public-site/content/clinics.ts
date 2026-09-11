/**
 * LifeSupply Clinics and Clinic Solutions copy (guide §3). Since the
 * restructure of 2026-09-08, `/clinic-solutions/` is the LifeSupply Clinics
 * section, with Equipment and Ongoing supplies as its two children.
 *
 * Rules applied throughout:
 *   - LifeSupply Clinics is clinic development, construction and fit-out,
 *     and equipment services within verified delivery arrangements. Nothing
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
  distinction:
    "LifeSupply Clinics is a clinic-development, construction and fit-out, and equipment service. It does not operate patient-care clinics, and nothing on this site refers to a company-operated clinic network.",
  attribution:
    "LifeSupply Clinics presents its projects as delivered together with its core partners. Individual partner roles and project clients are not published, and this site attributes no construction work to LifeSupply beyond what the Clinics site states.",
  geography:
    "Published projects are in British Columbia: Burnaby, Squamish, White Rock, Abbotsford, and Vancouver.",
  postOpening:
    "A clinic project can lead to an equipment order and, after opening, to ongoing supply. Each step is agreed separately: a consultation is not a contracted project, a quote is not an order, and a completed project creates no supply commitment.",

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
    eyebrow: "Published projects",
    title: "As presented by LifeSupply Clinics.",
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
      "LifeSupply Clinics plans, designs, builds, and fits out medical, dental, and wellness clinics in British Columbia, and handles equipment inquiries for them, within verified delivery arrangements. An existing clinic can start at supply without a construction project.",
    /**
     * The two ways into Clinic Solutions, stated before the three needs
     * (website improvement program, 2026-09-09, on a Codex recommendation):
     * a visitor with an open clinic should not have to read a construction
     * page to find out that supply needs no project. The two are
     * independent choices, not steps, and neither implies the other.
     */
    entry: {
      eyebrow: "Which do you need?",
      title: "A clinic project, or supplies for a clinic already open.",
      note: "The two are separate. Ordering supplies needs no project, and a project does not create a store account.",
      options: [
        {
          title: "Opening or renovating a clinic",
          text: "Planning, design, construction, fit-out, and equipment for clinic projects in British Columbia.",
          action: "plan_clinic",
        },
        {
          title: "Supplying a clinic that is already open",
          text: "Routine procurement and repeat ordering through the operating stores, on their own accounts and terms. No construction project is involved.",
          action: "clinic_ongoing_supplies",
        },
      ],
    },
    needs: [
      {
        index: "01",
        title: "Plan or renovate a clinic",
        text: "Feasibility, design, construction and fit-out, and project coordination, delivered within verified arrangements. The consultation happens on the Clinics site.",
        action: "plan_clinic",
      },
      {
        index: "02",
        title: "Equip a clinic",
        text: "Room-by-room equipment planning, quotes, and opening supplies for a new or expanding practice.",
        action: "clinic_equipment",
      },
      {
        index: "03",
        title: "Supply an existing clinic",
        text: "Routine procurement and repeat ordering through the stores, with a supply review to match categories to the practice.",
        action: "clinic_ongoing_supplies",
      },
    ],
    servicesHeading: { eyebrow: "Services", title: "From feasibility to hand-over." },
    specialtiesHeading: { eyebrow: "Specialties", title: "Clinic types served." },
    processHeading: {
      eyebrow: "Process",
      title: "Four stages, as the Clinics site describes them.",
    },
    consultation: {
      title: "What a consultation covers",
      text: "A first conversation is easier with a few facts to hand. None of them is a commitment.",
      items: [
        "Practice type and specialty",
        "Location and approximate size",
        "Current stage: concept, leased space, renovation, or expansion",
        "Target opening",
        "Equipment and supply interests",
      ],
    },
    channelsHeading: {
      title: "Service channels",
      text: "Consultations and equipment quotes are handled on the Clinics site; its published contact channels are below.",
    },
    supplyHeading: { eyebrow: "After opening", title: "A conditional supply opportunity." },
    actions: ["plan_clinic", "equipment_quote", "clinic_supply_review"],
  },

  /**
   * Section navigation for the consolidated page (consolidation stage 1).
   * Clinic Solutions is now one page covering the whole relationship, so a
   * reader needs to see its shape before scrolling into it.
   */
  sections: [
    { href: "#planning", label: "Plan and build" },
    { href: "#equipment", label: "Equip" },
    { href: "#ongoing-supplies", label: "Keep supplied" },
    { href: "#collaboration", label: "Collaboration" },
  ],

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
    title: "Working with LifeSupply beyond purchasing.",
    intro:
      "Some clinics want more than a supply account: a say in how a program's supplies are configured, or a design partnership on a project. That is a different relationship from buying, and it is described here.",
    distinction: {
      title: "Collaboration is not procurement",
      items: [
        "A clinic that purchases supplies is a customer of the operating store, with that store's account, prices, and support. No collaboration is required.",
        "A program collaboration means the clinic helps define a supply configuration, a workflow, or a pilot, agreed in writing before anything is fulfilled.",
        "A design partnership relates to a clinic project delivered through LifeSupply Clinics and its delivery partners, on the terms of that project.",
        "An expression of interest is not a pilot, and a pilot is not contracted revenue for either side until it is agreed.",
      ],
    },
    items: [
      {
        title: "Program configuration",
        text: "Clinical staff define what a supply configuration must contain for their program; LifeSupply models it as starter, consumable, and occasional roles and states compatibility. Nothing is fulfilled until the configuration and its store are confirmed.",
        status: "Proposed",
      },
      {
        title: "Pilots",
        text: "A limited, written pilot of a program's supply or workflow support, with its scope, duration, responsibilities, and exit stated up front.",
        status: "Proposed",
      },
      {
        title: "Design partnership",
        text: "Early involvement in a clinic project's planning, layout, and equipment choices, delivered through LifeSupply Clinics within its verified delivery arrangements.",
        status: "Available through LifeSupply Clinics",
      },
    ],
    metabolicNote:
      "The supply program a collaboration would configure is the metabolic-health service, which is in development. Its scope, its eight pathways, and what has to be confirmed before anything runs are set out on Metabolic Health.",
    actions: ["clinic_collaboration", "metabolic_hub"],
  },

  equipment: {
    eyebrow: "Equipment",
    title: "Room-by-room equipment planning and quotes.",
    intro:
      "Equipment is planned by room and function, from the exam room to the sterilization area. Quotes are prepared from a request on the Clinics site; opening supplies can be planned alongside.",
    quote: {
      title: "What a quote request needs",
      items: [
        "Rooms and functions to equip",
        "Specialty procedures and any specific devices",
        "Timeline to opening",
        "Delivery address and access",
      ],
    },
    catalogue: {
      title: "Opening supplies and consumables",
      text: "Clinic and dental clinic supply categories are published on LifeSupply.ca. Equipment pricing is quoted, not listed on this corporate site.",
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
    eyebrow: "Ongoing supplies",
    title: "Keep an open clinic supplied.",
    intro:
      "Routine procurement runs through the operating stores, with their accounts, published prices, and repeat ordering as each store provides them. A supply review matches the practice to the right categories and channel.",
    /** The one line about projects on a page that is not about projects. */
    projectPointer:
      "Planning, design, construction and fit-out are a separate service for British Columbia projects, set out under Clinic Solutions.",
    boundary:
      "LifeSupply does not operate patient-care clinics and takes no part in clinical decisions. What is on this page is supply.",
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
