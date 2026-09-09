/**
 * Pharmacy Solutions (`/pharmacy-solutions/`), added 2026-09-08 at the
 * product owner's direction as a section that states where pharmacy work
 * stands today and the direction, so the section exists before any
 * pharmacy operation does.
 *
 * Status discipline (guide §2): the only pharmacy offer in development is
 * the non-drug supply program (partner overview, September 2026, and the
 * Partners → Pharmacies page). Pharmacy-related operations are a stated
 * development focus, presented as "under evaluation" exactly as the
 * investor pages state it. No acquisition, transaction, counterparty,
 * licence, dispensing, or timing is named or implied; nothing here
 * dispenses, diagnoses, or prescribes.
 */
export const pharmacy = {
  status: {
    label: "Development focus",
    sentence:
      "Pharmacy Solutions describes a stated development focus. The non-drug supply program for pharmacies is in development; pharmacy-related operations are under evaluation and are not offered on this site.",
  },
  hub: {
    eyebrow: "Pharmacy Solutions",
    title: "Supply programs for pharmacies today, and a stated direction for tomorrow.",
    intro:
      "LifeSupply works with pharmacies as care partners: non-drug supply pathways that a pharmacist selects and the store fulfils. Pharmacy-related operations and regulated care infrastructure are a stated development focus, presented here with their status.",
    today: {
      eyebrow: "In development today",
      title: "Non-drug supply programs for pharmacies.",
      intro:
        "The pharmacy pathway in the metabolic care supply program: an approved, pharmacy-supported supply pathway that extends onboarding and refill support, with fulfilment responsibilities stated per program.",
      items: [
        {
          title: "Non-drug supply programs",
          text: "Pharmacist-selected starter configurations, usage-driven consumables, and occasional items for the patients a pharmacy supports. Medication is excluded from every configuration.",
        },
        {
          title: "Onboarding and refill support",
          text: "Patient materials, ordering guidance, and replenishment shaped around the approved pathway, so the pharmacy's counter is not the only place supplies can be organised.",
        },
        {
          title: "Fulfilment & administration",
          text: "Kitting, direct shipment, replenishment administration, and exception handling under an agreed service scope, with responsibilities stated before launch.",
        },
      ],
    },
    direction: {
      eyebrow: "Stated direction",
      title: "Pharmacy-related operations, under evaluation.",
      text: "The public growth strategy names pharmacy-related operations and regulated care infrastructure as a development focus. Each is subject to regulatory, operational, and partner confirmation, and is presented on this site as under evaluation until an operation exists. No pharmacy operation is offered here.",
      items: [
        {
          title: "Pharmacy-related operations",
          status: "Under evaluation",
          text: "A stated development focus. Status, dependencies, and the forward-looking qualification are set out on the investor pages.",
        },
        {
          title: "Regulated care infrastructure",
          status: "Under evaluation",
          text: "Specialty, compounding, and related themes, each with its own status and dependencies, described on the advanced therapeutics page.",
        },
      ],
    },
    boundaries: {
      title: "Boundaries",
      items: [
        "This site does not dispense, diagnose, prescribe, or recommend any medication or dose.",
        "A supply program provides non-drug supplies and non-clinical operational support only.",
        "No pharmacy acquisition, transaction, licence, or counterparty is announced or implied by this section.",
        "Availability, pricing, and service scope are confirmed with the partner before anything is released.",
      ],
    },
    actions: ["discuss_program", "partner_pharmacies"],
    related: ["metabolic_hub", "partner_pharmacies", "advanced_therapeutics"],
  },
} as const;
