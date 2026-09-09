/**
 * Conceptual graphics registry for the public site.
 *
 * Every image the section primitives render is listed here with its real
 * pixel size and its provenance. The files are AI-generated conceptual
 * still-life and environment images (Gamma, photo mode, September 2026),
 * commissioned by the product owner for this design pass, rendered strictly
 * monochrome and then given the same grayscale-plus-red treatment as the
 * hero stills so the whole site shares one look. They depict no person, no
 * text, no logo, no product, and no LifeSupply facility; captions and alt
 * text call them conceptual, and they must never be presented as
 * operational photography (guide §4). Original leadership portraits and
 * the hero footage remain the only operational imagery.
 */

export interface Graphic {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Where the file came from and how it was treated. */
  provenance: string;
}

const PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-08 for the design pass; monochrome brief; scaled to 1600×900 and given the site's grayscale-plus-red treatment with ffmpeg; conceptual, not operational photography.";

export const GRAPHICS = {
  suppliesFlatlay: {
    src: "/lsh/graphics/supplies-flatlay.jpg",
    alt: "Conceptual still life of medical supplies: a glucose meter, sealed boxes, a stethoscope, gauze, a carton and a clipboard on slate.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  examRoom: {
    src: "/lsh/graphics/exam-room.jpg",
    alt: "Conceptual image of an empty examination room with an exam table, a diagnostic panel and a supply cabinet.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  equipment: {
    src: "/lsh/graphics/equipment.jpg",
    alt: "Conceptual image of clinic equipment: an instrument trolley, a blood-pressure unit and a sealed crate.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  warehouse: {
    src: "/lsh/graphics/warehouse.jpg",
    alt: "Conceptual image of a fulfilment aisle with shelved cartons and a packing bench.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  metabolicSupplies: {
    src: "/lsh/graphics/metabolic-supplies.jpg",
    alt: "Conceptual still life of monitoring and injection supplies: a glucose meter, pen-needle boxes, a sharps container and a travel case.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  pharmacy: {
    src: "/lsh/graphics/pharmacy.jpg",
    alt: "Conceptual image of a pharmacy back-shelf with unlabelled boxes and a basket of sealed supply packs.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  boardroom: {
    src: "/lsh/graphics/boardroom.jpg",
    alt: "Conceptual image of an empty boardroom with a long table and a city view.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  shipping: {
    src: "/lsh/graphics/shipping.jpg",
    alt: "Conceptual image of stacked cartons on a pallet in a loading bay, one open to sealed supply packs.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
  facade: {
    src: "/lsh/graphics/facade.jpg",
    alt: "Conceptual image of a modern glass office facade against an overcast sky.",
    width: 1600,
    height: 900,
    provenance: PROVENANCE,
  },
} as const satisfies Record<string, Graphic>;

export type GraphicKey = keyof typeof GRAPHICS;

export function getGraphic(key: GraphicKey): Graphic {
  return GRAPHICS[key];
}

/** Shown beside every conceptual graphic that could be mistaken for a real place. */
export const CONCEPTUAL_CAPTION = "Conceptual image";
