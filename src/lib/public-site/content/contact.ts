/**
 * Verified contact directory (approved as already published; unchanged) and
 * the Stage 3 intent routing for `/contact/`: each intent points at a
 * registry action that resolves to a verified page or an approved channel.
 * There is no form; Stage 7 replaces these destinations with the intake.
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
  subsidiaries: [
    {
      name: "Wellmart Health Supplies Ltd. DBA Lifesupply",
      detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
      phone: "1-855-755-5433",
      url: "https://lifesupply.ca",
    },
  ],

  // Stage 3: intent routing, no form.
  routing: {
    eyebrow: "Start with what you need",
    title: "Routed to the right conversation.",
    text: "Each intent goes to a verified page or an approved channel. A form will follow once its routing, retention, and ownership are approved.",
  },
  intents: [
    {
      label: "Clinic development",
      text: "Planning, design, construction, renovation, or fit-out.",
      action: "plan_clinic",
    },
    {
      label: "Equipment quote",
      text: "Room-by-room equipment planning and a quote.",
      action: "equipment_quote",
    },
    {
      label: "Ongoing procurement",
      text: "Routine supply for a clinic that is already open.",
      action: "clinic_supply_review",
    },
    {
      label: "Metabolic-health program",
      text: "Supply services for a program, in development.",
      action: "discuss_program",
    },
    {
      label: "Pharmacy supply program",
      text: "Non-drug supplies and fulfilment for a pharmacy.",
      action: "discuss_program",
    },
    {
      label: "Supplier or manufacturer",
      text: "Categories, regions, product data, and onboarding.",
      action: "supplier_inquiry",
    },
    {
      label: "Investor",
      text: "Current context and materials.",
      action: "investor_materials",
    },
    {
      label: "Acquisition or strategic transaction",
      text: "Confidential first conversation.",
      action: "acquisition_inquiry",
    },
    { label: "General", text: "Anything else.", action: "general_inquiry" },
  ],
  existingOrder: {
    title: "Existing order?",
    text: "Contact the store that took the order. This site cannot see or change store orders.",
  },
} as const;
