/**
 * Medical Supply Solutions copy: the store hub at `/medical-supply-solutions/`
 * and the three store pages. Restructured on 2026-09-08 at the product
 * owner's direction from the Stage 3 "Our Businesses" portfolio map: the
 * corporate material moved to About, the LifeSupply Clinics brand page
 * became the Clinic Solutions section, and the technology and fulfilment
 * page was withdrawn (not a major business unit).
 *
 * Every factual statement traces to a SOURCE_REGISTER.md row or to approved
 * copy already published; the rest is Stage 3 draft framing, marked as
 * such. Store terms (shipping thresholds, delivery times, prices) are never
 * restated here: pages say the store publishes them. No brand-to-entity
 * relationship is asserted (WEB-01). Store links come from the brand
 * registry, never from this file.
 */
export const businesses = {
  /**
   * Medical Supply Solutions hub (`/medical-supply-solutions/`, renamed from
   * Our Businesses on 2026-09-08 at the product owner's direction): the
   * three online stores. Corporate material (entities, capabilities,
   * developing programs) moved to About.
   */
  hub: {
    eyebrow: "Medical Supply Solutions",
    title: "Three online stores for medical, health, and home-care supply.",
    description:
      "LifeSupply, Wellmart Medical, and Balkowitsch Worldwide each keep their own catalogue, accounts, currency, prices, and support. This section introduces each store and where its emphasis lies; buying happens on the store.",
    stores: {
      eyebrow: "The stores",
      title: "Each store keeps its own site, accounts, currency, and support.",
      /** Card actions: the store first, the brand page second (round three, outcome 7). */
      shopLabel: "Shop",
      aboutLabel: "About",
    },
    /**
     * A distinct route for professional buyers (round three, outcome 7). What a
     * supply review covers is described from verified capability only: the
     * categories the stores actually carry, account setup on the store that
     * carries them, and equipment planning where a British Columbia clinic
     * project is involved. No credit terms, consolidated billing, system
     * integration or named account management is offered, because none is
     * established.
     */
    procurement: {
      eyebrow: "Buying for a practice",
      title: "A supply review for clinics, pharmacies, and other professional buyers.",
      text: "Professional buyers do not have to work out which of three stores carries what. Start a conversation and it covers the ground below. Where a clinic project in British Columbia is involved, equipment is part of the same conversation.",
      covers: [
        "The categories a practice orders routinely, and which store carries each.",
        "How accounts work on that store, in its own currency and on its own terms.",
        "Equipment for a British Columbia clinic project, where there is one.",
      ],
      limit:
        "Orders, prices, shipping and returns stay with the store that fulfils them. A review does not create credit terms, consolidated billing, or a connection between a practice's systems and the stores.",
      action: "clinic_supply_review",
    },
    clinics: {
      eyebrow: "Clinic projects and clinic supply",
      title: "Clinic planning, equipment, and ongoing supply have their own section.",
      text: "Clinic Solutions covers LifeSupply Clinics: planning, design, construction and fit-out, equipment quotes, and keeping an open clinic supplied through the stores.",
      action: "clinic_solutions",
    },
    services: {
      eyebrow: "Choosing a store",
      title: "Geography, currency, and support at a glance.",
      text: "Shop & Services lists the four destinations with their geography and currency, and where an existing order is handled.",
      action: "shop_services",
    },
  },

  /** Brand pages. `actions` are registry keys; categories and store links come from the registry. */
  pages: {
    lifesupply: {
      eyebrow: "Operating brand · Canada",
      title: "LifeSupply: Canadian medical and home-care supply, online.",
      intro:
        "LifeSupply.ca is a Canadian online store for medical, health, and home-care supplies, with clinic-supply categories for professional buyers. It serves patients, caregivers, and professionals through one storefront.",
      audience: {
        title: "Who it serves",
        text: "Patients, caregivers, and medical professionals alike, including buyers purchasing for a clinic. There is one LifeSupply.ca storefront for all of them, with no separate professional portal.",
      },
      categories: {
        title: "Categories",
        text: "A selection of the store's published categories. Prices, availability, shipping thresholds, and delivery times are published on the store.",
      },
      channels: {
        title: "Service channels",
        text: "Customer service by phone and email during the store's published hours. Order, delivery, and return questions go to the store.",
      },
      actions: ["shop_lifesupply", "clinic_supply_review"],
    },
    wellmart: {
      eyebrow: "Operating brand · Canada",
      title: "Wellmart Medical: home medical equipment and supplies for Canada.",
      intro:
        "Wellmart Medical is a Canadian online store for home medical equipment and supplies, from mobility and bath safety to incontinence, ostomy, respiratory, and diabetic categories.",
      audience: {
        title: "Who it serves",
        text: "Home-care buyers first, and professional buyers are equally welcome. This corporate site presents Wellmart Medical with a home-care emphasis; the store itself serves both.",
      },
      categories: {
        title: "Categories",
        text: "A selection of the store's published categories. Prices, availability, shipping thresholds, and delivery times are published on the store.",
      },
      channels: {
        title: "Service channels",
        text: "Customer service by phone and email during the store's published hours. Order, delivery, and return questions go to the store.",
      },
      actions: ["shop_wellmart"],
    },
    balkowitsch: {
      eyebrow: "Operating brand · United States",
      title: "Balkowitsch Worldwide: a U.S. online store, priced in U.S. dollars.",
      intro:
        "Balkowitsch Worldwide sells medical, health, wellness, and related categories to U.S. customers from the United States, priced and supported in its own market.",
      audience: {
        title: "Its place on this site",
        text: "Balkowitsch Worldwide is one of the group's four operating businesses. Its catalogue, accounts, currency, prices, and customer support are its own.",
      },
      categories: {
        title: "Categories",
        text: "A selection of the store's published categories. Prices, availability, shipping, and returns are published on the store in U.S. dollars.",
      },
      channels: {
        title: "Service channels",
        text: "Toll-free and international phone support and email during the store's published hours. Order questions go to the store.",
      },
      actions: ["shop_balkowitsch", "us_business_inquiry"],
    },
  },
} as const;
