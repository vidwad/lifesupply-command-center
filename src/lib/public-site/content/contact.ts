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
      name: "Investor Relations",
      email: "invest@lifesupply.com",
      phone: "604-677-4146",
    },
    {
      label: "Mergers & acquisitions",
      name: "Abdul Ladha",
      email: "abdul@lifesupply.com",
      phone: "604-677-4146",
    },
    { label: "Corporate office", name: "General inquiries", email: "info@lifesupply.com" },
  ],
  /**
   * The related legal entity the operating stores publish, with the
   * relationship exactly as those stores state it (S-10). Brands are not
   * entities: four brands do not imply four companies, and no ownership
   * percentage or further subsidiary is published (round two, 2026-09-10).
   */
  entities: {
    eyebrow: "Corporate structure",
    title: "Related legal entity",
    note: "LifeSupply Health Supplies Inc. is the parent. The entity below is the one the operating stores name; the four brands are businesses and channels, not separate companies.",
  },
  subsidiaries: [
    {
      name: "Wellmart Health Supplies Ltd. DBA Lifesupply",
      relationship: "A division of LifeSupply Health Supplies Inc., as stated on lifesupply.ca",
      detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
      phone: "1-855-755-5433",
      url: "https://lifesupply.ca",
    },
  ],

  // Stage 3: intent routing, no form.
  routing: {
    eyebrow: "Start with what you need",
    title: "Routed to the right conversation.",
    text: "Choose the route that matches your inquiry. Each one leads to the relevant LifeSupply page or email address.",
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
