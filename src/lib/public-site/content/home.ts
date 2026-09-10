/**
 * Homepage copy for the Stage 2 page contract (docs/website-development/
 * CLAUDE.md §3, `/`): group introduction, verified proof, four brands, clinic
 * lifecycle, metabolic opportunity, partner and investor paths, current
 * news, closing contact.
 *
 * Provenance is recorded beside each block. "Approved" blocks were already
 * published before Stage 2. Blocks marked "Stage 2 draft" are new sentences
 * written from the development guide's operating model (§2) and the
 * verified facts in SOURCE_REGISTER.md; they introduce no figure, partner,
 * approval, or availability that the register does not support, and they
 * are listed for product-owner review in STAGE_02_EVIDENCE.md. Actions are
 * registry keys (actions.ts), never raw destinations.
 */
export const homepage = {
  /**
   * Hero. Rewritten in the website improvement program (2026-09-09) so the
   * first screen states what the group operates today and what it is
   * developing, and so clinic-service geography is not conflated with the
   * stores' commerce geography. Drafted with Codex against the evidence
   * register; no new claim is introduced.
   */
  eyebrow: "LifeSupply Health Supplies Inc.",
  title: "Medical supplies today, with new supply services in development.",
  description:
    "An established Canadian group: online medical, health, and home-care supply businesses serving Canada and the United States, and clinic planning, design, and equipment services for projects in British Columbia. Pharmacy and metabolic-health supply programs are in development.",
  /**
   * Background footage for the hero: the legacy lifesupplyhealth.com hero
   * video (wp-content/uploads/2021/10/LSHomeVid.mp4, 19 s, 1488×836), cut
   * to its two caption-free scenes (instruments flat-lay 9.75–11.75 s and
   * tablet 16–18.2 s), slowed 2.5× with motion interpolation, desaturated,
   * and cross-faded into a seamless 8.9 s loop at 1280×720. The city scene
   * and every captioned stretch were dropped: they carry the old mark and
   * figures that are not approved copy. Decorative only; no copy lives in
   * the footage. The poster is the loop's first frame.
   */
  heroMedia: {
    webm: "/lsh/hero/hero-loop.webm",
    mp4: "/lsh/hero/hero-loop.mp4",
    poster: "/lsh/hero/hero-poster.jpg",
    posterWidth: 1600,
    posterHeight: 900,
  },

  /**
   * Who we are, where we are going, where we want to be. Product owner,
   * 2026-09-09, after the prior site's three-panel statement. The wording
   * was drafted with Codex under the site's rules and edited here: "a
   * decade" became the approved "more than 25 years" (2025 annual-report
   * narrative); "growing annually, organically and through acquisition"
   * became strategy and objective; the third panel, blank on the prior
   * site, was written from the approved vision and direction copy. The
   * founding-investor description is kept as a description of that base.
   * Nothing here states a growth rate, a transaction, or a ranking as fact.
   */
  whoWeAre: {
    eyebrow: "Experience and direction",
    title: "Who we are and where we are going.",
    panels: [
      {
        eyebrow: "This is who we are",
        headline: "Experienced",
        text: "More than 25 years of operations and a founding investor base of medical practitioners and specialists alongside investment bankers and capital-market professionals. Today the businesses connect online medical, health and supply commerce with clinic planning, design, and build services in Canada and the United States.",
      },
      {
        eyebrow: "This is where we are going",
        headline: "Growing",
        text: "The strategy is to build on the existing business through operating discipline, technology and complementary acquisitions. The objective is to integrate strategically located medical supply stores, pharmacies, clinics and distributors, broadening the products and services offered online in Canada and the United States.",
      },
      {
        eyebrow: "This is where we want to be",
        headline: "Connected",
        text: "The ambition is to become a global leader in the online sale and distribution of health and medical products and related services: deeper clinic relationships, recurring patient-support supply programs, and commerce, clinic-development and equipment capabilities connected to serve a broader customer base over time.",
      },
    ],
  },

  /**
   * Group introduction. Stage 2 draft from the guide's proposed positioning
   * (S-120). The first sentence is the guide's wording; the second states
   * the expansion direction conditionally, in the qualification pattern the
   * approved About copy already uses. Pending product-owner approval.
   */
  introduction: {
    eyebrow: "The LifeSupply group",
    title: "Commerce, clinic development, equipment, and ongoing supply.",
    statement:
      "Four operating websites sit under one corporate group, combining online supply commerce in Canada and the United States with clinic development services for British Columbia projects. Each keeps its own accounts, currency, and customer support.",
    qualification:
      "The stated direction is to build on those capabilities toward deeper clinic relationships and recurring supply programs. Pharmacy and metabolic-health supply services are in development and are not available today.",
  },

  /**
   * Audience routes, directly under the hero (website improvement program,
   * 2026-09-09): the three journeys the site serves, each to a page that
   * already exists. Destinations are registry action keys, never literals.
   */
  audiences: {
    eyebrow: "Where to start",
    items: [
      {
        title: "Operating businesses",
        text: "Four operating websites for medical, health, and home-care supplies, and for clinic planning, design, and equipment.",
        action: "explore_businesses",
      },
      {
        title: "Partnership opportunities",
        text: "Clinics, pharmacies, suppliers, and strategic counterparties, each with the conversation that fits.",
        action: "partners_hub",
      },
      {
        title: "Investor information",
        text: "Reported figures with their basis, the growth strategy, and the dated public record.",
        action: "investor_information",
      },
    ],
  },

  // Approved (moved from JSX in PR #61). Verified proof, with source context.
  glance: {
    eyebrow: "LifeSupply at a glance",
    title: "Publicly reported scale, with source context.",
    description:
      "These figures are cited in the 2025 annual-report narrative and should be read with the report’s stated qualifications.",
  },
  publicMetrics: [
    { value: "25+", label: "years of operations cited in the 2025 annual report" },
    { value: "50K+", label: "products cited in the 2025 annual report" },
    { value: "1M+", label: "customers served cited in the 2025 annual report" },
  ],

  // Stage 2 draft. Section heading only; the cards come from the brand registry.
  brands: {
    eyebrow: "Operating brands",
    title: "Four operating websites across Canada and the United States.",
    description:
      "Each brand keeps its own storefront or service site, accounts, currency, and customer support. LifeSupply Health is the corporate hub, not a store.",
  },

  /**
   * Clinic lifecycle. Stage 2 draft from the guide's operating model: a
   * clinic project can introduce equipment and supply needs, and an existing
   * clinic can become a supply customer without a construction project. The
   * services named are those the LifeSupply Clinics site describes (S-70);
   * both external actions are that site's verified pages (S-73).
   */
  clinicLifecycle: {
    eyebrow: "Clinic solutions",
    title: "A clinic project can start at any stage.",
    intro:
      "LifeSupply Clinics offers clinic planning, design, construction and fit-out, project coordination, and equipment services. An existing clinic can become a supply customer without a construction project.",
    steps: [
      {
        index: "01",
        title: "Plan or renovate a clinic",
        text: "Site evaluation, layout, compliance, budgeting, and build coordination, delivered within verified arrangements.",
        action: "plan_clinic",
        actionLabel: "Book a consultation",
      },
      {
        index: "02",
        title: "Equip it",
        text: "Room-by-room equipment planning, quotes, and opening supplies for a new or expanding practice.",
        action: "equipment_quote",
        actionLabel: "Request an equipment quote",
      },
      {
        index: "03",
        title: "Keep it supplied",
        text: "Routine procurement and repeat ordering for clinics that are already open.",
        action: "clinic_supply_review",
        actionLabel: "Request a supply review",
      },
    ],
    note: "A consultation is not a contracted project, and a quote is not an order. Each step is confirmed on its own terms.",
  },

  /**
   * Metabolic opportunity. Stage 2 draft. Status is "in development" because
   * no store carries a kit collection and no availability has been confirmed
   * (S-89, S-90, WEB-04). No product, price, clinical, or regulatory claim.
   */
  metabolic: {
    eyebrow: "In development",
    title: "Metabolic-health supply services.",
    text: "LifeSupply is developing a supply-services offer for metabolic-health programs: non-drug supplies, clinic procurement, kitting and fulfilment, and contracted workflow support. Availability will be published when it is confirmed; nothing on this site is a purchasable program yet.",
    action: "metabolic_hub",
    actionLabel: "Metabolic Health",
  },

  // Stage 2 draft; Stage 5 reconciled the partner path to the Partners hub.
  paths: [
    {
      eyebrow: "Partners",
      title: "Clinics, pharmacies, suppliers, and acquisition counterparties.",
      text: "Program and design collaboration, non-drug supply programs, supplier onboarding, and acquisition discussions each start with a conversation.",
      action: "partners_hub",
      actionLabel: "Explore partner relationships",
    },
    {
      eyebrow: "Investors",
      title: "Investor information, presented with context.",
      text: "Current annual-report context, historical materials, and a direct investor-relations contact.",
      action: "investor_information",
      actionLabel: "Investor relations",
    },
  ],

  // Stage 2 draft heading; the items are the approved historical news records.
  newsroom: {
    eyebrow: "Historical company news",
    title: "Announcements from the public record.",
    note: "Dated releases from 2022. No later company news has been published.",
  },

  // Stage 2 draft heading; the channels are the approved directory.
  closing: {
    eyebrow: "Contact",
    title: "Reach the right LifeSupply conversation.",
  },

  /**
   * Retained from the first restoration pass for the red information band.
   * A restatement of `description`; not a new claim.
   */
  operatingContext: {
    eyebrow: "Public operating context",
    statement:
      "Health, safety, medical, and industrial supply categories across Canada and the United States.",
  },
} as const;
