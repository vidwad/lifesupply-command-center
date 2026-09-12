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
  /**
   * Section navigation (website consolidation, stage 2). The page now carries
   * the partner programme as well as the overview, so a reader needs to see
   * its shape before scrolling into it.
   */
  sections: [{ href: "#partner-program", label: "Partner program" }],

  /**
   * Round three, outcome 3. "Pharmacy" meant two things across this site and a
   * reader could not tell which one a page was about. This block says so on
   * the page most likely to be misread. Drafted with Codex, edited before use.
   */
  /**
   * Unpublished since 2026-09-12 (product owner). Both distinctions it drew
   * survive where they belong: the hub's own title says the programme is in
   * development, its cards say medication is excluded, and About now
   * separates supplying pharmacies from holding a licensed pharmacy, which
   * it lists under Longer-term opportunities as being assessed only.
   */
  scope: {
    title: "Which pharmacy business this is",
    paragraphs: [
      "This page is about supplying pharmacies. LifeSupply is developing pharmacist-selected non-drug supply and fulfilment programs, where the pharmacy is the customer and medication is excluded entirely. The programs are in development and cannot be bought yet.",
      "Whether LifeSupply should hold licensed pharmacy operations of its own is a separate question. That sits under evaluation alongside specialty and compounding, peptide research, and manufacturing, and none of them is offered, licensed or operating. Supplying pharmacies and running one are different businesses.",
    ],
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
      /** The diagram's hub: what the four items connect to. */
      centre: {
        title: "LifeSupply supply platform",
        subtitle: "commerce, fulfilment, clinic capabilities",
      },
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
    actions: ["pharmacy_program_inquiry", "discuss_program"],
  },

  /**
   * The pharmacy partner programme, moved here from `/partners/pharmacies`
   * when that page was retired (website consolidation, stage 2, 2026-09-10).
   *
   * It belongs on the page that already explains the pharmacy supply model
   * rather than in a partners hub: a pharmacist reading about the programme
   * needs the scope distinction above it, and the partners page had to
   * restate that distinction before it could say anything of its own.
   */
  partnerProgram: {
    eyebrow: "Partner program",
    title: "Non-drug supply programs for pharmacies.",
    intro:
      "A pharmacy can support its patients with non-drug supplies that the pharmacist selects. LifeSupply proposes to configure and fulfil those supplies, with every responsibility stated before a program starts. The service is in development; no pharmacy program is operating.",
    model: {
      eyebrow: "The model",
      title: "A proposed model: the pharmacist selects, the supply service fulfils.",
      items: [
        {
          title: "Pharmacist-selected configurations",
          text: "The pharmacist chooses the supplies and their roles. LifeSupply does not substitute and does not select for the patient.",
        },
        {
          title: "Non-drug only",
          text: "Medication is excluded from every configuration. LifeSupply would supply non-drug items only; it would not dispense, and it would not handle or alter a prescription.",
        },
        {
          title: "Fulfilment responsibilities stated per program",
          text: "Who holds stock, who ships, who invoices, and who the patient contacts are written down before fulfilment begins.",
        },
      ],
    },
    responsibilities: {
      title: "Complaints and recalls",
      items: [
        "Product complaints are routed to the party stated in the program agreement and to the manufacturer as required.",
        "Recall handling follows the manufacturer's and the regulator's instructions; the program agreement names who notifies patients and who retrieves product.",
        "Each program agreement names who is responsible for what. A responsibility that is not written into the agreement has not been agreed.",
      ],
    },
    actions: ["discuss_program", "metabolic_hub"],
  },
} as const;
