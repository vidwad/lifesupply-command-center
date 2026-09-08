/**
 * LifeSupply Clinics and Clinic Solutions copy for Stage 3 (guide §3:
 * `/our-operations/lifesupply-clinics/`, `/clinic-solutions/` and its three
 * children).
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

  /** Brand page (`/our-operations/lifesupply-clinics/`). */
  brandPage: {
    // Stage 8: contextual links to the program and the supply store.
    related: ["metabolic_hub", "brand_lifesupply"],
    eyebrow: "Operating brand · British Columbia",
    title: "LifeSupply Clinics: clinic planning, design, build, and equipment.",
    intro:
      "LifeSupply Clinics plans, designs, builds, and fits out medical, dental, and wellness clinics, and handles equipment inquiries for them, within verified delivery arrangements.",
    servicesHeading: { eyebrow: "Services", title: "From feasibility to hand-over." },
    specialtiesHeading: { eyebrow: "Specialties", title: "Clinic types the site names." },
    processHeading: {
      eyebrow: "Process",
      title: "Four stages, as the Clinics site describes them.",
    },
    supplyHeading: { eyebrow: "After opening", title: "A conditional supply opportunity." },
    actions: ["plan_clinic", "equipment_quote"],
  },

  /** Clinic Solutions hub (`/clinic-solutions/`). */
  hub: {
    // Stage 8: contextual links from the clinic lifecycle to the program and collaboration pages.
    related: ["metabolic_hub", "partner_clinics"],
    eyebrow: "Clinic Solutions",
    title: "Plan it, equip it, or keep it supplied.",
    intro:
      "Three ways to work with the group, depending on where your clinic is. An existing clinic can start at supply without a construction project.",
    needs: [
      {
        index: "01",
        title: "Plan or renovate a clinic",
        text: "Feasibility, design, construction and fit-out, and project coordination, delivered within verified arrangements.",
        route: "designBuild",
        linkLabel: "Design and build",
      },
      {
        index: "02",
        title: "Equip a clinic",
        text: "Room-by-room equipment planning, quotes, and opening supplies for a new or expanding practice.",
        route: "equipment",
        linkLabel: "Equipment",
      },
      {
        index: "03",
        title: "Supply an existing clinic",
        text: "Routine procurement and repeat ordering through the stores, with a supply review to match categories to the practice.",
        route: "ongoingSupplies",
        linkLabel: "Ongoing supplies",
      },
    ],
  },

  /** `/clinic-solutions/design-build/` */
  designBuild: {
    eyebrow: "Design & build",
    title: "Clinic design and construction, with delivery roles stated.",
    intro:
      "LifeSupply Clinics plans, designs, and builds clinics in British Columbia together with its core partners. This page introduces the service; the consultation happens on the Clinics site.",
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
    actions: ["plan_clinic", "view_clinic_projects"],
  },

  /** `/clinic-solutions/equipment/` */
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

  /** `/clinic-solutions/ongoing-supplies/` */
  ongoingSupplies: {
    eyebrow: "Ongoing supplies",
    title: "Keep an open clinic supplied.",
    intro:
      "Routine procurement runs through the operating stores, with their accounts, published prices, and repeat ordering as each store provides them. A supply review matches the practice to the right categories and channel.",
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
    related: ["metabolic_hub", "partner_clinics"],
  },
} as const;
