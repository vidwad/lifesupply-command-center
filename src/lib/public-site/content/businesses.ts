/**
 * Our Businesses copy for Stage 3: the portfolio map at `/our-operations/`,
 * and the four brand pages (guide §3). The technology and fulfilment page was
 * withdrawn on 2026-09-08 (product owner: not a major business unit).
 *
 * Every factual statement traces to a SOURCE_REGISTER.md row or to approved
 * copy already published; the rest is Stage 3 draft framing, marked as
 * such. Store terms (shipping thresholds, delivery times, prices) are never
 * restated here: pages say the store publishes them. No brand-to-entity
 * relationship is asserted (WEB-01). Store links come from the brand
 * registry, never from this file.
 */
export const businesses = {
  hub: {
    // Approved hero copy (published since PR #60), unchanged.
    eyebrow: "Our operations",
    title: "Connected channels designed around medical-product access.",
    description:
      "The public operating narrative describes online commerce, fulfillment, retail, wholesale, and regulated-care infrastructure as complementary functions.",
    // Stage 3 draft: how the map is organised.
    map: {
      eyebrow: "Portfolio map",
      title: "Brands, entities, capabilities, and programs, kept distinct.",
      text: "Four operating websites carry the group's commerce and clinic services. The legal entities behind them are listed as published. Shared capabilities and developing programs are described with their status, so a brand is never confused with a company, or a plan with an operation.",
    },
    brands: {
      eyebrow: "Operating brands",
      title: "Each brand keeps its own site, accounts, currency, and support.",
    },
    entities: {
      eyebrow: "Published entities",
      title: "Names on the public record.",
      note: "Listed as they appear in the published corporate directory. The brand each entity operates is stated only where the owner has confirmed it.",
    },
    capabilities: {
      eyebrow: "Shared capabilities",
      title: "What the public overview describes.",
      note: "Descriptions are the approved public operating narrative, unchanged.",
    },
    developing: {
      eyebrow: "Developing programs",
      title: "Presented with their status.",
      items: [
        {
          title: "Metabolic-health supply services",
          status: "In development",
          text: "Non-drug supplies, clinic procurement, kitting and fulfilment, and contracted workflow support for metabolic-health programs. Availability will be published when it is confirmed.",
        },
        {
          title: "Pharmaceutical",
          status: "Development focus",
          text: "A stated development focus around pharmacy-related operations and regulated care infrastructure, subject to current regulatory, operational, and partner confirmation.",
        },
      ],
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
        text: "Patients, caregivers, and medical professionals alike. This corporate site presents LifeSupply.ca with an emphasis on clinic procurement; that is a marketing direction, not a restriction, and every customer keeps the same store, accounts, and checkout.",
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
      // Stage 8: the clinic and program journeys this store serves.
      related: ["clinic_solutions", "metabolic_hub"],
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
        "Balkowitsch Worldwide sells medical, health, wellness, and related categories to U.S. customers from the United States, with a broad general catalogue and its own established identity.",
      audience: {
        title: "Its place on this site",
        text: "Balkowitsch Worldwide is one of the four operating websites presented here. Its catalogue, accounts, currency, prices, and customer support are its own, and it keeps its identity.",
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
