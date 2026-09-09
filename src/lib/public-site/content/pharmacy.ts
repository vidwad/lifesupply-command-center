/**
 * Pharmacy Solutions (`/pharmacy-solutions/`), added 2026-09-08 at the
 * product owner's direction as a section that states where pharmacy work
 * stands today and the direction, so the section exists before any
 * pharmacy operation does.
 *
 * Reviewed and expanded on 2026-09-09 at the product owner's direction
 * (wording drafted with Codex under the rules below): a "why it matters"
 * block explains the value to the LifeSupply ecosystem as design intent.
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
    title: "Non-drug supply support for pharmacies, in development.",
    intro:
      "LifeSupply is developing a program that brings pharmacist-selected supplies, onboarding, and replenishment into one defined supply pathway, built on the group's existing commerce, fulfilment, and clinic capabilities. Pharmacy-related operations remain a stated development focus, presented here with their status.",
    /**
     * Why it matters (2026-09-09, product owner: explain the value to the
     * LifeSupply ecosystem). Each item is what the program is designed to
     * do, never a result; drafted with Codex under the site's rules.
     */
    value: {
      eyebrow: "Within the LifeSupply ecosystem",
      title: "Connecting supply needs across the care pathway.",
      intro:
        "The program is designed to connect pharmacy-supported patient supplies with the group's broader supply platform, with responsibilities defined at each step.",
      items: [
        {
          title: "For the pharmacy",
          text: "Pharmacist-led supply selection paired with practical ordering and fulfilment support: a defined way to organise non-drug supplies for the patients the pharmacy supports.",
        },
        {
          title: "For the patient",
          text: "Initial ordering and consumable replenishment designed to be easier to navigate, with clear supply information and a stated route for order questions.",
        },
        {
          title: "For clinic pathways",
          text: "Patient supply arrangements aligned with clinic procurement and pathway requirements, with clear responsibilities for configuration, replenishment, and support.",
        },
        {
          title: "For the group",
          text: "LifeSupply's existing commerce, fulfilment, and clinic capabilities reused for configurable, recurring non-drug supply relationships, with replenishment driven by consumable use.",
        },
      ],
    },
    today: {
      eyebrow: "In development today",
      title: "A non-drug supply program shaped around the pharmacy.",
      intro:
        "The pharmacy pathway within LifeSupply's metabolic-health supply work: selected supplies, ordering materials, and fulfilment planning brought together, with fulfilment responsibilities stated per program. No pharmacy supply program is operating.",
      items: [
        {
          title: "Pharmacist-selected configurations",
          text: "Starter equipment, usage-driven consumables, and occasional items selected by the pharmacist for the intended pathway. Selection stays with the pharmacist; medication is excluded from every configuration.",
        },
        {
          title: "Onboarding and refill support",
          text: "Patient materials and ordering guidance designed to explain how to obtain initial supplies and replenish consumables as used. Starter equipment is separate from refills; no automatic shipment or subscription is offered.",
        },
        {
          title: "Fulfilment & administration",
          text: "Planned scope: kitting, direct shipment, replenishment administration, and exception handling. Stockholding, shipping, invoicing, and responsibility for complaints and recalls would be agreed in writing before fulfilment begins.",
        },
      ],
    },
    direction: {
      eyebrow: "Stated direction",
      title: "Pharmacy-related operations, under evaluation.",
      text: "Pharmacy-related operations and regulated care infrastructure are a stated development focus within the public growth strategy. Both remain subject to regulatory, operational, and partner confirmation, and are presented on this site as under evaluation until an operation exists. No pharmacy operation is offered here.",
      items: [
        {
          title: "Pharmacy-related operations",
          status: "Under evaluation",
          text: "The investor pages describe this development focus, its dependencies, and the qualifications that apply to forward-looking activities.",
        },
        {
          title: "Regulated care infrastructure",
          status: "Under evaluation",
          text: "Specialty, compounding, and related options remain under evaluation. The advanced therapeutics page describes their individual status and dependencies.",
        },
      ],
    },
    boundaries: {
      title: "Boundaries",
      items: [
        "This site does not dispense, diagnose, prescribe, or recommend any medication or dose.",
        "The program's scope is limited to non-drug supplies and non-clinical operational support; medication and prescriptions are excluded.",
        "No pharmacy acquisition, transaction, licence, or counterparty is announced or implied by this section.",
        "Any release would require confirmation of contents, compatibility, availability, pricing, and service responsibilities with the partner.",
      ],
    },
    actions: ["discuss_program", "partner_pharmacies"],
  },
} as const;
