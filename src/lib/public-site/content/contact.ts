/**
 * Verified contact directory (approved as already published; unchanged) and
 * the intent routing for `/contact/`: each intent points at a registry
 * action that resolves to a verified page or a verified channel. The public
 * surface is database-free and has no approved delivery path for a
 * submitting form, so the routes are the product, not a placeholder; the
 * copy no longer promises a form (website improvement program, 2026-09-09).
 * Existing-order support goes to the originating store (guide §5).
 *
 * MedDirect Distribution Corporation and Dexton Medical Corporation are no
 * longer operational (product owner, 2026-09-08) and are not listed; the
 * showroom channel that used a Dexton address went with them, and the
 * online-sales channel was withdrawn with the leadership change the same
 * day (supply reviews now go to the corporate office).
 *
 * The action registry may only use email addresses that appear in
 * `channels` (checked by registry.test.ts).
 */
export const contact = {
  channels: [
    {
      label: "Investor relations",
      /**
       * `homeLabel` and `blurb` are the homepage contact section's own
       * wording (product owner, 2026-09-12). The address, email and phone
       * stay here and are rendered from here on both pages, so there is one
       * place to change a contact detail.
       */
      homeLabel: "Investor Relations",
      blurb: "For financial information, corporate reporting, and investor enquiries.",
      name: "Investor Relations",
      email: "invest@lifesupply.com",
      phone: "604-677-4146",
    },
    {
      label: "Mergers & acquisitions",
      homeLabel: "Acquisitions and Business Opportunities",
      /**
       * The only channel that routes to a named person. The other two are
       * routes rather than people, so the homepage prints the heading and the
       * address and no name under them.
       */
      homeShowsName: true,
      blurb:
        "For business owners and advisers interested in discussing a potential acquisition or related opportunity.",
      name: "Abdul Ladha",
      email: "abdul@lifesupply.com",
      phone: "604-677-4146",
    },
    {
      label: "Corporate office",
      homeLabel: "General Business Enquiries",
      blurb:
        "For corporate enquiries and help finding the appropriate contact for supply or clinic-service opportunities.",
      name: "General inquiries",
      email: "info@lifesupply.com",
      /** The group's one corporate address (product owner, 2026-09-10). */
      address: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
    },
  ],
  /**
   * The corporate structure as set out in the consolidated financial
   * statements for the year ended December 31, 2025: one parent and three
   * wholly-owned subsidiaries. Brand architecture is kept separate from legal
   * structure; the four customer-facing brands do not map one-to-one onto the
   * companies (round three, 2026-09-10).
   */
  /**
   * Contact keeps the entity names and the channel each one answers on,
   * because a visitor here is deciding who to write to. The explanation of
   * the structure — parent, subsidiaries, and why a brand name is not a
   * company name — moved to About on 2026-09-10 (website consolidation,
   * stage 4), which is the page that already carries identity and history.
   * It was told in full in both places before that.
   */
  entities: {
    eyebrow: "Corporate structure",
    title: "One parent company, three wholly-owned subsidiaries.",
    note: "LifeSupply Health Inc. owns three operating subsidiaries outright. Each is listed below with the channel it answers on; About sets out how the structure and the customer-facing brands relate.",
    action: "about_group",
  },
  subsidiaries: [
    {
      name: "Wellmart Health Supplies Ltd.",
      relationship: "Canadian subsidiary, wholly owned",
      detail: "The group's Canadian operating base, acquired in 2020. It trades as LifeSupply.",
      phone: "1-855-755-5433",
      url: "https://lifesupply.ca",
    },
    {
      name: "LifeSupply US, Inc.",
      relationship: "United States subsidiary, wholly owned",
      detail:
        "The group's United States operating company, holding its American commerce activity.",
      phone: null,
      url: null,
    },
    {
      name: "Balkowitsch Enterprises Inc.",
      relationship: "Wholly owned",
      detail:
        "Acquired in 2023, bringing a United States customer base, a distributor network, and 25 years of trading history. It goes to market as Balkowitsch Worldwide.",
      phone: null,
      url: "https://balkowitsch.com",
    },
  ],

  // Stage 3: intent routing, no form.
  routing: {
    eyebrow: "Start with what you need",
    title: "Routed to the right conversation.",
    text: "Choose the route that matches the inquiry. Most open an email with the subject already set; two open a consultation page on the Clinics site. Each route names its destination.",
    guide: {
      title: "What to include",
      intro:
        "A first message is easier to answer with a few facts. None of them is required, and none of them asks for health, patient, or account information.",
      items: [
        "The organization and the sender's role in it.",
        "The region it operates in.",
        "The type of business or practice: clinic, pharmacy, distributor, supplier, or something else.",
        "Broadly what is needed, in a sentence or two.",
        "What the first conversation should cover.",
      ],
      next: "A first exchange is about fit: whether the need matches what LifeSupply does today or is developing. Programs in development are not currently offered.",
    },
    sensitive:
      "Please do not send health information, personal medical details, prescriptions, or account or payment details through these channels.",
  },
  intents: [
    {
      label: "Clinic development",
      text: "Planning, design, construction, renovation, or fit-out for a clinic project in British Columbia.",
      action: "plan_clinic",
    },
    {
      label: "Equipment quote",
      text: "Room-by-room equipment planning and a quote for a new or renovated clinic.",
      action: "equipment_quote",
    },
    {
      label: "Clinic procurement",
      text: "Routine supply for a clinic that is already open, with no construction project involved.",
      action: "clinic_supply_review",
    },
    {
      label: "Metabolic-health program",
      text: "Supply services for a metabolic-health program. In development, and not available today.",
      action: "discuss_program",
    },
    {
      label: "Pharmacy supply program",
      text: "Non-drug supplies and fulfilment for a pharmacy. In development; medication is excluded.",
      action: "pharmacy_program_inquiry",
    },
    {
      label: "Supplier or distribution",
      text: "Categories, regions, product data, and onboarding for suppliers and manufacturers.",
      action: "supplier_inquiry",
    },
    {
      label: "Investor relations",
      text: "Annual-report context, the growth strategy, and investor materials on request.",
      action: "investor_materials",
    },
    {
      label: "Acquisition or strategic",
      text: "A first conversation about an acquisition or a strategic arrangement.",
      action: "acquisition_inquiry",
    },
    {
      label: "General",
      text: "Corporate, media, or anything that does not fit the routes above.",
      action: "general_inquiry",
    },
  ],
  existingOrder: {
    title: "Existing order?",
    text: "Contact the store that took the order. This site cannot see or change store orders.",
  },
} as const;
