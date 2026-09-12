/**
 * Conceptual graphics registry for the public site.
 *
 * Every image the section primitives render is listed here with its real
 * pixel size and its provenance. Two sets:
 *
 *   Design-pass set (September 2026): AI-generated conceptual still-life and
 *   environment images (Gamma, photo mode), commissioned by the product
 *   owner, rendered strictly monochrome and then given the same
 *   grayscale-plus-red treatment as the hero stills. They depict no person,
 *   no text, no logo, no product, and no LifeSupply facility.
 *
 *   Brand set (`brand*` keys, September 2026): the four greyscale brand
 *   photographs supplied by the product owner (`public/lsh/graphics/brands/`,
 *   PNG masters retained beside the served JPEG derivatives; manifest and
 *   handoff in `BRAND_GREYSCALE_ASSETS.md`). AI-generated conceptual images
 *   edited from earlier colour concepts, kept neutral greyscale with no red
 *   treatment. The Balkowitsch image shows a synthetic person who must never
 *   be presented as an employee or customer; the clinic reception is not an
 *   owned clinic or a completed project.
 *
 * Alt text and provenance call every image conceptual, and none may be
 * presented as operational photography (guide §4). No visible caption is
 * rendered: the product owner removed image notices on 2026-09-09. Original leadership
 * portraits and the hero footage remain the only operational imagery.
 */
import type { OperatingBrandKey } from "@/lib/public-site/brands";

export interface Graphic {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Where the file came from and how it was treated. */
  provenance: string;
  /** CSS object-position for a square crop of a landscape source. */
  position?: string;
}

const PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-08 for the design pass; monochrome brief; scaled to 1600×900 and given the site's grayscale-plus-red treatment with ffmpeg; conceptual, not operational photography.";

const BRAND_PROVENANCE =
  "Greyscale brand photograph supplied by the product owner on 2026-09-08 (PR #86; PNG master 1672×941 retained in public/lsh/graphics/brands/); AI-generated conceptual image edited from an earlier colour concept; JPEG derivative scaled and cropped to 1600×900 with ffmpeg, neutral greyscale, no red treatment; conceptual, not operational photography.";

const HERO_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-11 for the hero backdrops; monochrome brief, no person, no text, no logo; scaled to 1600×900 and converted to neutral greyscale with ffmpeg, no red treatment because the hero scrim supplies the brand colour; conceptual, not operational photography.";

const ABOUT_HERO_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-12 for the About hero; monochrome brief, no person, no text, no logo, no product; scaled to 1600×900 and converted to neutral greyscale with ffmpeg, no red treatment because the hero scrim supplies the brand colour; conceptual, not operational photography, and not a LifeSupply building.";

const CLINIC_ROUTE_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-12 for the three next-step routes on Clinic Solutions; monochrome brief, no person, no text, no logo, no brand mark; scaled to 1600×900 and converted to neutral greyscale with ffmpeg; conceptual, not operational photography, and not a LifeSupply project.";

export const GRAPHICS = {
  /** Beside "Opening, renovating, or expanding?" on Clinic Solutions. */
  clinicPlans: {
    src: "/lsh/graphics/clinic-plans.jpg",
    alt: "Conceptual still life of rolled architectural drawings, a floor plan, a scale rule and a pencil on a dark surface.",
    width: 1600,
    height: 900,
    provenance: CLINIC_ROUTE_PROVENANCE,
  },
  /** Beside "Equipping rooms, or replacing a device?". */
  clinicDevice: {
    src: "/lsh/graphics/clinic-device.jpg",
    alt: "Conceptual photograph of a screen on a slim rolling stand in an empty, daylit treatment room.",
    width: 1600,
    height: 900,
    provenance: CLINIC_ROUTE_PROVENANCE,
  },
  /** Beside "Need everyday supplies?". */
  clinicSupplies: {
    src: "/lsh/graphics/clinic-supplies.jpg",
    alt: "Conceptual still life of plain boxes, folded gauze and sealed pouches arranged on a pale shelf.",
    width: 1600,
    height: 900,
    provenance: CLINIC_ROUTE_PROVENANCE,
  },
  /**
   * Behind the About hero. Composed for the slot: the left third falls away
   * into shadow so the heading sits on near-black, and the glazing carries
   * the light on the right, where the scrim is thinnest.
   */
  /**
   * Behind the About hero since 2026-09-12 (product owner asked for something
   * more modern, medical and high-tech). Composed for the slot the same way
   * the atrium was: the left third falls into shadow under the heading, and
   * the daylight carries the right, where the scrim is thinnest.
   */
  aboutMedtech: {
    src: "/lsh/graphics/about-medtech.jpg",
    alt: "Conceptual photograph of a diagnostic monitor and a smooth equipment housing on a pale counter in an empty, daylit clinical room.",
    width: 1600,
    height: 900,
    provenance: ABOUT_HERO_PROVENANCE,
  },
  /** Behind the About hero from 2026-09-12; unpublished the same day. */
  aboutAtrium: {
    src: "/lsh/graphics/about-atrium.jpg",
    alt: "Conceptual photograph of an empty concrete-and-glass atrium, with a cantilevered staircase beside a full-height glazed wall.",
    width: 1600,
    height: 900,
    provenance: ABOUT_HERO_PROVENANCE,
  },
  /** Behind the News & Resources heroes. The one image commissioned for the hero pass. */
  newsDesk: {
    src: "/lsh/graphics/news-desk.jpg",
    alt: "Conceptual still life of a folded newspaper, a stack of blank reports, a closed folio and reading glasses on a dark desk.",
    width: 1600,
    height: 900,
    provenance: HERO_PROVENANCE,
  },
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
  brandLifeSupply: {
    src: "/lsh/graphics/brands/lifesupply-greyscale-v1.jpg",
    alt: "Conceptual arrangement of medical supplies and monitoring equipment on a counter.",
    width: 1600,
    height: 900,
    provenance: BRAND_PROVENANCE,
    position: "50% 50%",
  },
  brandWellmart: {
    src: "/lsh/graphics/brands/wellmart-medical-greyscale-v1.jpg",
    alt: "Conceptual image of a rollator in a bright home interior.",
    width: 1600,
    height: 900,
    provenance: BRAND_PROVENANCE,
    position: "50% 50%",
  },
  brandBalkowitsch: {
    src: "/lsh/graphics/brands/balkowitsch-greyscale-v1.jpg",
    alt: "Conceptual image of a person packing medical supplies at a warehouse workstation.",
    width: 1600,
    height: 900,
    provenance: BRAND_PROVENANCE,
    position: "50% 50%",
  },
  brandClinics: {
    src: "/lsh/graphics/brands/lifesupply-clinics-greyscale-v1.jpg",
    alt: "Conceptual image of a contemporary clinic reception area and corridor.",
    width: 1600,
    height: 900,
    provenance: BRAND_PROVENANCE,
    position: "55% 50%",
  },
} as const satisfies Record<string, Graphic>;

export type GraphicKey = keyof typeof GRAPHICS;

/** The photograph for each operating brand (registry key → graphic key). */
export const BRAND_GRAPHICS: Record<OperatingBrandKey, GraphicKey> = {
  lifesupply: "brandLifeSupply",
  wellmart: "brandWellmart",
  clinics: "brandClinics",
  balkowitsch: "brandBalkowitsch",
};

export function getGraphic(key: GraphicKey): Graphic {
  return GRAPHICS[key];
}
