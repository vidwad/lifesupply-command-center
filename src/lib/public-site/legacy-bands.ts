/**
 * Divider photographs carried over from the prior lifesupplyhealth.com About
 * page (product owner, 2026-09-09).
 *
 * The prior page separated its sections with full-width photographs on a
 * fixed background with a colour overlay. Three of them return here: one as
 * the About hero's backdrop and two as parallax divider bands, the same
 * photographs held locally, cropped to 16:9, in greyscale, and rendered
 * behind the site's own overlay colouring. They are decorative: each layer
 * is hidden from assistive technology and carries no text, so nothing is
 * claimed by the picture. The other images on that page (three small card
 * backgrounds and the growth chart with figures as pixels) were not carried
 * over.
 */
export interface LegacyBand {
  src: string;
  /** What the picture shows, for the register; never rendered. */
  description: string;
  width: number;
  height: number;
  /** Where the file came from and how it was treated. */
  provenance: string;
}

const provenance = (upload: string) =>
  `Photograph from the prior lifesupplyhealth.com About page (wp-content/uploads/${upload}), stock imagery that site used as a section background; copied 2026-09-09 at the product owner's instruction, cropped to 1920×1080, greyscale, served behind a colour overlay as a decorative divider.`;

export const LEGACY_BANDS = {
  desk: {
    src: "/lsh/graphics/legacy/about-desk.jpg",
    description: "Hands writing on papers at a desk, with glasses beside them.",
    width: 1920,
    height: 1080,
    provenance: provenance("2021/08/about1.jpg"),
  },
  data: {
    src: "/lsh/graphics/legacy/about-data.jpg",
    description: "A person looking at layered data displays in an office.",
    width: 1920,
    height: 1080,
    provenance: provenance("2021/10/lshome1.jpg"),
  },
  warehouse: {
    src: "/lsh/graphics/legacy/about-warehouse.jpg",
    description: "A warehouse aisle of racked pallets with a forklift.",
    width: 1920,
    height: 1080,
    provenance: provenance("2021/07/ob3-1024x683-1.png"),
  },
} as const satisfies Record<string, LegacyBand>;

export type LegacyBandKey = keyof typeof LEGACY_BANDS;

export function getLegacyBand(key: LegacyBandKey): LegacyBand {
  return LEGACY_BANDS[key];
}
