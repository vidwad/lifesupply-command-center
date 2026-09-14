/**
 * Connected Care Vision (`/connected-care/`), added 2026-09-13 at the product
 * owner's direction: the one page that explains how the businesses and the
 * proposed capabilities could work together. The other pages describe
 * individual activities; this one shows the relationship between them, for
 * prospective pharmacy sellers, healthcare partners, technology partners and
 * investors.
 *
 * It is a long-term development vision, and it says so on every part. What
 * operates today (the supply stores, order support), what is in development
 * (organizational purchasing and portals, the patient-supply programs), and
 * what would depend on partnerships, acquisitions and regulatory conditions
 * (professional relationships, pharmacy services, compounding, advanced
 * therapeutics) each carry their own status. A connected experience does not
 * require LifeSupply to own every participating business or employ every
 * professional. Professional decisions stay independent; access never
 * guarantees a prescription or a treatment; compounding is a conditional
 * branch inside the pharmacy step, framed on a lawful pathway and satisfied
 * conditions rather than an awaited blanket authorization; research and
 * advanced therapeutics sit outside the ordinary care flow; no connection
 * hands a supply system a medical record; virtual care includes in-person
 * pathways; the intended benefits are objectives, never demonstrated
 * improvements; and the revenue opportunities are never added together. The
 * detailed revenue model stays on the investor page.
 */
export const connectedCare = {
  /** The in-page navigation, in page order. */
  sections: [
    { href: "#challenge", label: "Why" },
    { href: "#model", label: "Model" },
    { href: "#example", label: "Example" },
    { href: "#acquisitions", label: "Pharmacy" },
    { href: "#compounding", label: "Compounding" },
    { href: "#technology", label: "Technology" },
    { href: "#sequence", label: "Sequence" },
    { href: "#value", label: "Value" },
  ],

  /** A. The hero: the vision, and its status beside it. */
  hero: {
    eyebrow: "Connected Care Vision",
    title: "A vision for more connected care.",
    intro: [
      "LifeSupply is exploring how its medical-supply businesses could connect with qualified healthcare professionals, pharmacy services, and digital tools to support a more coordinated experience.",
      "The proposed model would bring together access to care, appropriate pharmacy services, medical products, and ongoing support through a combination of existing operations, partnerships, technology development, and potential acquisitions.",
    ],
    status:
      "A long-term development vision. The integrated care platform and proposed clinical and pharmacy services are not currently offered by LifeSupply.",
    graphic: "connectedCareDesk",
    actions: [
      { action: "connected_care_model", label: "Explore the connected care model" },
      { action: "partner_inquiry", label: "Discuss a strategic partnership" },
    ],
  },

  /** The central message, in plain language, and the ownership point beneath it. */
  vision: {
    eyebrow: "The vision",
    statements: [
      "LifeSupply’s long-term vision is to connect medical supplies, access to qualified healthcare professionals, pharmacy services, and ongoing patient support through a coordinated digital experience.",
      "Building on its existing supply businesses and clinic-development relationships, the company intends to evaluate partnerships, technology development, and potential pharmacy acquisitions that could bring these capabilities together.",
    ],
    ownership:
      "A connected experience does not require LifeSupply to own every participating business or employ every professional. Some capabilities may be owned, others acquired, and others delivered through appropriately structured relationships.",
  },

  /** B. The problem being addressed, and the intended benefits as objectives. */
  challenge: {
    eyebrow: "The problem being addressed",
    title: "Care and supplies often involve separate steps.",
    paragraphs: [
      "A person may need to find a healthcare professional, attend an assessment, obtain a prescription where appropriate, arrange pharmacy services, purchase supporting supplies, and return for follow-up.",
      "LifeSupply’s proposed direction is to make the connections between those steps easier to navigate, while preserving the responsibilities of the professionals and organizations involved.",
    ],
    benefitsTitle: "Intended benefits",
    benefits: [
      "Clearer next steps.",
      "Better coordination between participating services.",
      "Easier access to relevant product and order information.",
      "Less repeated administrative work where systems can appropriately connect.",
      "More organized follow-up and replenishment.",
    ],
    benefitsNote:
      "These are objectives for the proposed model until demonstrated. They are not proven improvements in outcomes, cost, or waiting times.",
  },

  /**
   * C. The Connected Care diagram (product owner, 2026-09-13): one typed
   * configuration that the desktop network, the tablet grid and the mobile
   * sequence all read. The patient's needs at the centre; the two existing
   * businesses on the left with their written status; the two proposed
   * capabilities on the right; the technology foundation beneath, its four
   * capabilities mapped to the nodes they could support as a conceptual
   * mapping and never an integration; one expandable item on emerging
   * therapies, with research, synthesis and manufacturing kept outside the
   * patient-care flow; and one note. A connector never implies ownership or
   * data exchange, and nothing here is offered.
   */
  diagram: {
    eyebrow: "Connected Care Vision",
    title: "Connected care, built around patient needs.",
    intro:
      "Our vision is to connect medical supplies, clinic infrastructure, professional care and pharmacy services through technology that makes each step easier to coordinate.",
    statusNote:
      "Existing businesses provide the foundation. Professional-care connections, pharmacy expansion and an integrated platform are proposed capabilities.",
    hub: {
      icon: "patient",
      title: "Patient needs",
      tagline: "Access. Choice. Continuity.",
      text: "Appropriate care and supplies, with clear next steps and ongoing support.",
    },
    nodes: [
      {
        key: "supplies",
        side: "left",
        icon: "supplies",
        status: "Existing operations",
        statusKind: "existing",
        title: "Medical supplies",
        text: "Medical, health and home-care products for individuals, caregivers and professional buyers.",
        businesses: ["LifeSupply", "Wellmart Medical", "Balkowitsch Worldwide"],
        detail:
          "Canadian and U.S. supply operations provide a foundation for equipment, consumables and ongoing purchasing needs. Product supply is separate from prescribing and dispensing.",
        relationship: "Products and ongoing supplies",
        link: { action: "medical_supply_stores", label: "The three stores on Medical Supplies" },
      },
      {
        key: "clinic",
        side: "left",
        icon: "clinic",
        status: "Existing operations",
        statusKind: "existing",
        title: "Clinic spaces and equipment",
        text: "Clinic planning, design, build and equipment support in British Columbia.",
        businesses: ["LifeSupply Clinics"],
        detail:
          "Clinic-development projects bring equipment, opening supplies and potential ongoing procurement needs into view. The practices that open in those spaces provide their own patient care.",
        relationship: "Spaces and equipment for care",
        link: { action: "clinic_solutions", label: "Clinic Solutions" },
      },
      {
        key: "care",
        side: "right",
        icon: "care",
        status: "Proposed connections",
        statusKind: "proposed",
        title: "Professional care",
        text: "Connections with physicians, specialists and other qualified health professionals.",
        detail:
          "The proposed model could support assessment, referral and follow-up, including virtual care where appropriate and in-person services when needed. Clinical decisions remain with qualified professionals; access does not guarantee a prescription or a particular treatment.",
        relationship: "Assessment and follow-up",
        link: { action: "connected_care_example", label: "How a pathway could work" },
      },
      {
        key: "pharmacy",
        side: "right",
        icon: "pharmacy",
        status: "Under evaluation",
        statusKind: "evaluation",
        title: "Pharmacy capabilities",
        text: "Potential pharmacy acquisitions and collaborations to support coordinated pharmacy services.",
        detail:
          "Qualified pharmacists could support prescription review, dispensing, counselling and, where appropriate and permitted, patient-specific compounding. No acquisition has been made, and a person would remain free to use any pharmacy.",
        relationship: "Pharmacy services and support",
        incoming: "Prescription when clinically appropriate",
        link: { action: "pharmacy_hub", label: "Pharmacy Solutions" },
      },
    ],
    prescription: {
      from: "care",
      to: "pharmacy",
      label: "Prescription when clinically appropriate",
    },
    technology: {
      icon: "technology",
      title: "Technology connecting the experience",
      status: "Proposed platform",
      statusKind: "proposed",
      text: "A shared digital layer could help coordinate access, authorized information exchange, ordering and ongoing support.",
      capabilities: [
        {
          key: "access",
          title: "Access and coordination",
          text: "Appointments, care navigation and communications.",
          supports: ["hub", "care"],
          note: "Could help a person find a participating provider and understand the next step; it would not decide who sees them.",
        },
        {
          key: "workflows",
          title: "Care and pharmacy workflows",
          text: "Authorized information exchange and agreed professional workflows.",
          supports: ["care", "pharmacy"],
          note: "Could carry authorized information between a clinician and a pharmacy under agreed workflows, with each professional’s decisions unchanged.",
        },
        {
          key: "ordering",
          title: "Ordering and fulfilment",
          text: "Supply purchasing, organizational portals and order visibility.",
          supports: ["supplies", "clinic", "pharmacy"],
          note: "Could bring supply purchasing, organizational portals and order visibility into one place for the supplying businesses and the clinics or pharmacies they serve.",
        },
        {
          key: "planning",
          title: "Planning and automation",
          text: "Demand estimates, replenishment reminders and draft orders.",
          supports: ["supplies", "clinic"],
          note: "Could estimate demand and prepare replenishment reminders and draft orders from purchasing history; nothing would be ordered without a person’s approval.",
        },
      ],
    },
    emerging: {
      title: "Evolving with emerging therapies",
      text: "The model could support future metabolic-health and other therapeutic programs as clinical evidence, professional requirements and applicable regulations allow.",
      outside:
        "Research, synthesis and manufacturing sit outside the ordinary patient-care flow and are evaluated separately, as the investor page describes. Research activity is not a route to commercially available treatment.",
      action: "advanced_therapeutics",
      label: "Advanced therapeutics on Investor Information",
    },
    note: "Illustrative development vision. Proposed services and integrations would be introduced only as the relevant capabilities and requirements are confirmed.",
    labels: {
      relationship: "Relationship",
      businesses: "Businesses",
      viewRole: "View role",
      select: "show its connections",
      clear: "Clear selection",
      supports: "Could support:",
      capabilitiesTitle: "Select a capability to see what it could support.",
    },
  },

  /** D. One illustrative journey, with compounding as a conditional branch inside the pharmacy step. */
  example: {
    eyebrow: "A practical example",
    title: "How a metabolic-health pathway could work.",
    label: "Illustrative journey. Not a description of a service LifeSupply offers.",
    steps: [
      {
        title: "Connect with a qualified provider.",
        text: "A person seeks an assessment through a participating provider’s appropriate access channel.",
      },
      {
        title: "Receive an individualized assessment.",
        text: "The clinician considers the person’s needs and determines appropriate next steps, which may include investigations, referral, treatment, or no medication.",
      },
      {
        title: "Arrange pharmacy services where needed.",
        text: "If a prescription is issued, an appropriately licensed pharmacy reviews it and provides the permitted service.",
      },
      {
        title: "Obtain supporting supplies.",
        text: "Relevant equipment and consumables are selected with appropriate professional input and obtained through agreed supply channels.",
      },
      {
        title: "Continue follow-up.",
        text: "Clinical review remains with the healthcare provider. Product ordering and supply replenishment follow their own arrangements.",
      },
    ],
    /** Attached to the third step: a branch, never the outcome. */
    branch: {
      step: 3,
      title: "Conditional branch: eligible compounding",
      text: "Only where a compounded preparation is clinically appropriate, lawful in the jurisdiction, and within the pharmacy’s permitted scope. Otherwise the pharmacy provides the standard service, or no pharmacy service is needed.",
    },
  },

  /** E. Potential pharmacy acquisitions: what ownership could add, and what it would not be for. */
  acquisitions: {
    eyebrow: "Potential pharmacy acquisitions",
    title: "Building pharmacy capabilities through selective acquisitions and partnerships.",
    status: "Under evaluation",
    paragraphs: [
      "LifeSupply’s proposed expansion could include acquiring interests in appropriately licensed pharmacy businesses or establishing relationships with qualified pharmacy operators.",
      "The purpose would be to add professional pharmacy capability to a broader care and supply model, where there is a sound clinical, operational, and commercial basis.",
      "Any transaction would require assessment of the business, its licences and permitted activities, professional staffing, facilities, quality systems, and integration requirements.",
    ],
    addsTitle: "What pharmacy ownership could add",
    adds: [
      "An established operating capability.",
      "Qualified professional teams.",
      "Appropriate dispensing or compounding infrastructure.",
      "A foundation for coordinated workflows.",
      "Continuity of service within the acquired business.",
    ],
    safeguard:
      "Ownership would not be a way to control prescribing or to direct every patient to a group-owned pharmacy. The model preserves professional judgment and patient choice.",
    action: "acquisitions_page",
    actionLabel: "Acquisitions & Strategic Opportunities",
  },

  /** F. Compounding and advanced therapeutics, with the regulatory premise stated correctly and briefly. */
  compounding: {
    eyebrow: "Compounding and advanced therapeutics",
    title: "Evaluate new capabilities as evidence and lawful pathways develop.",
    status: "Under evaluation",
    paragraphs: [
      "The proposed model could accommodate selected specialty pharmacy services and, where permissible and appropriate, compounded preparations, including certain peptide-based therapies.",
      "Each opportunity would be assessed individually for its clinical rationale, permitted ingredients, professional requirements, facilities, quality controls, and applicable jurisdiction.",
      "Peptide synthesis, research, and regulated manufacturing would be evaluated separately from patient-specific pharmacy compounding.",
    ],
    distinctionTitle: "The distinction in brief",
    distinction: [
      "Compounding already operates within specific regulatory frameworks in Canada and the United States. The question is whether a particular preparation, ingredient, purpose, and operating model is permissible, not whether peptides receive a single authorization.",
      "A pharmacy acquisition does not itself establish permission to compound a particular product.",
      "Compounded preparations are not approved drugs, and different conditions apply to different categories of compounding in each country. A permission in one country is not a permission in the other.",
    ],
    note: "LifeSupply does not currently offer compounded medications, peptide-compounding services, or advanced therapeutics.",
    actions: [
      { action: "pharmacy_hub", label: "Specialty pharmacy on Pharmacy Solutions" },
      { action: "advanced_therapeutics", label: "Advanced therapeutics on Investor Information" },
    ],
  },

  /** G. The technology, in practical layers, and the two limits that apply to it. */
  technology: {
    eyebrow: "The technology, layer by layer",
    title: "One coordinated experience, with clear responsibilities.",
    intro:
      "The platform is described in practical layers. Each connection would be designed around the information actually required and the appropriate permissions.",
    columns: { layer: "Proposed layer", functions: "Functions to evaluate" },
    layers: [
      {
        title: "Patient access",
        text: "Service discovery, appointment requests, communications, and clear next steps.",
      },
      {
        title: "Provider coordination",
        text: "Appropriate referrals, follow-up workflows, and authorized information exchange.",
      },
      {
        title: "Pharmacy workflow",
        text: "Relevant prescription and service coordination through permitted systems.",
      },
      {
        title: "Supply ordering",
        text: "Approved product lists, ordering, fulfilment visibility, and replenishment.",
      },
      {
        title: "Organizational tools",
        text: "Clinic and pharmacy portals, permissions, approvals, and purchasing reports.",
      },
      {
        title: "Administration",
        text: "Consent, identity, access controls, audit records, and operational support.",
      },
    ],
    notes: [
      "No connection would give a supply system a complete medical record. Each exchange is limited to the information it needs, with consent and permissions defined for it.",
      "Virtual care would include appropriate in-person pathways. It is not suitable for every circumstance, and the participating provider decides.",
    ],
    status: "Organizational portals are in development; the wider platform is proposed.",
  },

  /** H. The development sequence, and what it does not claim. */
  sequence: {
    eyebrow: "Development sequence",
    title: "Build the connections in stages.",
    steps: [
      {
        title: "Strengthen current supply operations and product data.",
        status: "Operating",
      },
      {
        title: "Develop organizational purchasing and supply portals.",
        status: "In development",
      },
      {
        title: "Establish suitable professional and pharmacy relationships.",
        status: "Proposed",
      },
      {
        title: "Evaluate and execute appropriate acquisitions where feasible.",
        status: "Under evaluation",
      },
      {
        title: "Pilot a defined care-and-supply workflow in a specific jurisdiction.",
        status: "Proposed",
      },
      {
        title: "Expand only after the operating model is demonstrated.",
        status: "Proposed",
      },
    ],
    note: "Acquisition work and technology development could proceed in parallel. No step is stated here as begun or approved unless the investor page says so.",
  },

  /** The commercial value, visible but never added together. */
  value: {
    eyebrow: "Commercial value",
    title: "More ways to support customers over time.",
    statement:
      "LifeSupply could connect an established product-supply business with additional professional and digital capabilities, creating more ways to support customers over time.",
    items: [
      "Product sales through existing channels.",
      "Potential recurring supply relationships.",
      "Appropriately structured technology or administrative services.",
      "Pharmacy revenue within any acquired and permitted operation.",
      "Better coordination of customer service and purchasing.",
    ],
    note: "These opportunities are not additive: some activities may be delivered by independent providers, and some may never form part of LifeSupply’s offering. The detailed revenue model is on the investor page.",
    action: "growth_strategy",
    actionLabel: "Growth strategy on Investor Information",
  },

  /** The closing actions, for the four audiences the page serves. */
  closing: {
    eyebrow: "Next step",
    title: "Talk to us about a connected-care relationship.",
    text: "For pharmacy sellers, healthcare partners, technology partners, and investors.",
    actions: [
      { action: "partner_inquiry", label: "Discuss a strategic partnership" },
      { action: "investor_information", label: "Investor Information" },
      { action: "pharmacy_hub", label: "Pharmacy Solutions" },
    ],
  },
} as const;
