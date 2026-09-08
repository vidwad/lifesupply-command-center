/** Investor-relations copy. Approved as already published; unchanged in Stage 2. */
export const investorRelations = {
  title: "Investor information, presented with context.",
  description:
    "The investor section presents current annual-report context alongside historical news and materials, with a clear distinction between disclosed information, forward-looking statements, and offering-specific content.",
  /** A tall portrait capture of the deck; declared at its real pixel size (checked by the canaries). */
  preview: {
    src: "/lsh/investor-presentation-preview.png",
    alt: "LifeSupply investor presentation preview",
    width: 1233,
    height: 2634,
  },
  contact: { email: "invest@lifesupply.com", phone: "604-677-4146" },
  currentReport: {
    period: "Year ended December 31, 2025",
    status: "Unaudited consolidated financial information",
    highlights: [
      { label: "Net sales", value: "$6.75M" },
      { label: "Gross profit", value: "$2.20M" },
      { label: "Net income", value: "$284K" },
    ],
  },
  expansionContext: {
    date: "August 25, 2026",
    title: "Expansion strategy source material",
    description:
      "A supplied financing presentation outlines proposed metabolic-health and therapeutics expansion themes, subject to investor suitability, forward-looking disclosure, board approval, regulatory requirements, and final transaction terms.",
  },
} as const;
