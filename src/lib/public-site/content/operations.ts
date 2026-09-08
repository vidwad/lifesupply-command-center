/** Operations page copy. Approved as already published; unchanged in Stage 2. */
export const operations = [
  {
    title: "Online ecommerce division",
    description:
      "Publicly described online channels intended to provide medical products to a broad customer base.",
  },
  {
    title: "Distribution & drop ship facility",
    description:
      "A centralized fulfillment, delivery, and logistics function described as having access to distributors, manufacturers, and suppliers.",
  },
  {
    title: "Flagship retail operations",
    description:
      "A bricks-and-mortar retail setting intended to showcase LifeSupply’s top-selling products.",
  },
  {
    title: "Wholesale division",
    description:
      "An institutional-supply focus spanning hospitals, universities, nursing homes, First Nations, and government agencies in the current public overview.",
  },
  {
    title: "Pharmaceutical",
    description:
      "A stated development focus around pharmacy-related operations and regulated care infrastructure, subject to current regulatory, operational, and partner confirmation.",
  },
] as const;

/** A portrait graphic; declared at its real pixel size (checked by the canaries). */
export const operationsTimeline = {
  src: "/lsh/operations-timeline.jpg",
  alt: "LifeSupply operations timeline",
  width: 1099,
  height: 2560,
} as const;
