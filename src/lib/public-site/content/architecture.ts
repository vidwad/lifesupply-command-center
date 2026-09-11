/**
 * Program architecture (round three, outcome 3).
 *
 * "Pharmacy" meant two different things on this site and a reader could not
 * tell them apart: supplying pharmacies with non-drug products, which is a
 * developing program, and LifeSupply holding licensed pharmacy operations of
 * its own, which is a separate regulated question under evaluation. This is
 * the single place that sets the whole shape out, with one status vocabulary
 * used everywhere: Operating, In development, Under evaluation.
 *
 * Drafted with Codex against the verified facts and edited before use. Every
 * item here already appears elsewhere on the site; this adds no new activity,
 * it puts the existing ones in order.
 */

export type ProgramStatus = "Operating" | "In development" | "Under evaluation";

export interface ProgramTier {
  status: ProgramStatus;
  /** What this tier means, in one line. */
  meaning: string;
  items: { title: string; text: string; href?: string }[];
}

export const architecture = {
  eyebrow: "How the business fits together",
  title: "What LifeSupply runs today, what it is building, and what it is still weighing.",
  intro:
    "LifeSupply sells health, safety, medical and industrial products online across Canada and the United States, and delivers clinic projects in British Columbia. Two supply programs are being built on that base. A separate set of regulated activities is being assessed on its own terms, and none of them is running.",
  statusLabel: "Status",
  tiers: [
    {
      status: "Operating",
      meaning: "Running today.",
      items: [
        {
          title: "Online supply commerce",
          text: "Health, safety, medical and industrial products through LifeSupply.ca and Wellmart Medical in Canada, priced in Canadian dollars, and Balkowitsch Worldwide in the United States, priced in U.S. dollars. Each store keeps its own accounts, prices and support.",
          href: "/medical-supply-solutions",
        },
        {
          title: "Clinic projects",
          text: "LifeSupply Clinics plans, designs, builds and fits out clinics and supplies their equipment, for projects in British Columbia. LifeSupply does not operate patient-care clinics.",
          href: "/clinic-solutions",
        },
      ],
    },
    {
      status: "In development",
      meaning: "Being designed and tested. Nothing here can be bought, and no launch date is set.",
      items: [
        {
          title: "Metabolic-health supply and services",
          text: "Configurable patient-supply pathways, clinic procurement, kitting and fulfilment, and non-clinical workflow support. Clinical and pharmacy providers keep every clinical decision.",
          href: "/metabolic-health",
        },
        {
          title: "Pharmacy supply programs",
          text: "Pharmacist-selected non-drug supplies and fulfilment for pharmacies. The pharmacy is the customer. Medication is excluded entirely.",
          href: "/pharmacy-solutions",
        },
      ],
    },
    {
      status: "Under evaluation",
      meaning:
        "Regulated activities being assessed. None is offered, licensed or operating, and each would need licences and qualified people the group does not hold today.",
      items: [
        {
          title: "Licensed pharmacy operations",
          text: "Whether LifeSupply should hold licensed pharmacy operations of its own, rather than supply pharmacies that others run.",
          href: "/investor-relations/advanced-therapeutics",
        },
        {
          title: "Specialty and compounding",
          text: "Compounded preparations for specific programs, which would sit behind pharmacy licensing and compounding standards.",
        },
        {
          title: "Peptide synthesis and research",
          text: "Research-stage synthesis capability, which would need research partners and facilities.",
        },
        {
          title: "Manufacturing",
          text: "Producing regulated products rather than distributing them. LifeSupply does not manufacture regulated products today.",
        },
      ],
    },
  ] as readonly ProgramTier[],
  note: {
    title: "The two meanings of pharmacy",
    text: "Supplying pharmacies and running one are different businesses. Pharmacy supply programs sell non-drug products and fulfilment to pharmacies, and are in development. Licensed pharmacy operations would mean LifeSupply dispensing itself, which is under evaluation and not licensed or operating.",
  },
  principle: {
    title: "How participation works",
    text: "LifeSupply supplies products and delivers clinic projects. It does not diagnose, prescribe, dispense or treat, and it does not manufacture regulated products. Where a developing program touches regulated care, LifeSupply's part is the supply side: the clinical or pharmacy provider holds the licence and makes every clinical decision.",
  },
} as const;
