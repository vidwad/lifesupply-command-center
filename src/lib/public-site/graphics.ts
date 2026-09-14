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

const AUDIENCE_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-13 for the two audience panels on Medical Supply Solutions; monochrome brief, no person, no logo, no text, no legible screen; scaled to 1600×900 and converted to neutral greyscale with ffmpeg, no red treatment; conceptual, not operational photography, and not a LifeSupply premises, customer, or project.";

const CATEGORY_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-13 for the category explorer on Medical Supply Solutions; monochrome brief, no person, no logo, no packaging text, no product branding; scaled to 1600×900 and converted to neutral greyscale with ffmpeg, no red treatment; conceptual, not operational photography, and never a specific product offered for sale.";

const BUSINESS_ILLUSTRATION_PROVENANCE =
  "Isometric illustration supplied by the product owner on 2026-09-13 for the operating-foundation columns of the investor page; served at its supplied size through next/image; conceptual, not operational photography, and not a LifeSupply premises, product, order, or person.";

const TECHNOLOGY_ILLUSTRATION_PROVENANCE =
  "Isometric illustration supplied by the product owner on 2026-09-13 for the technology steps of the investor page; resized to 960×960 and saved as JPEG; conceptual, not operational photography, and not a LifeSupply system, product, order, or person.";

const CLINIC_ROUTER_PROVENANCE =
  "Isometric illustration supplied by the product owner on 2026-09-13 for the Clinic Solutions router; resized to 1440×960 and saved as JPEG; conceptual, not operational photography, and not a LifeSupply project, premises, product, or person.";

const PHARMACY_ILLUSTRATION_PROVENANCE =
  "Isometric illustration supplied by the product owner on 2026-09-13 for the Pharmacy Solutions hero; trimmed, squared to 960×960 and saved as a palette PNG; conceptual, not operational photography, and not a LifeSupply product, program, or person.";

const PHARMACY_CATEGORY_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-13 for the representative-supplies tiles on Pharmacy Solutions; monochrome brief, no person, no logo, no packaging text, no product branding; scaled to 1600×900 and converted to neutral greyscale; conceptual, not operational photography, and never a specific product offered for sale.";

const CONNECTED_CARE_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-13 for the Connected Care Vision hero; monochrome brief, no person, no logo, no text, no vials or laboratory equipment; scaled to 1600×900 and converted to neutral greyscale; conceptual, not operational photography, and not a LifeSupply premises.";

const MEDICAL_SUPPLIES_PROVENANCE =
  "Gamma image generation (photo mode), commissioned 2026-09-12 for the Balkowitsch Worldwide profile on the consolidated Medical Supply Solutions page; monochrome brief, no person, no facility, no logo, no text, no legible reading on any screen; scaled to 1800×1012 and converted to neutral greyscale with ffmpeg, then given a midtone lift (lutyuv gamma 1.75) so it sits with the two Canadian store photographs rather than reading as a much darker frame beside them; no highlight is clipped. It is conceptual, not operational photography: not a LifeSupply facility, not a photograph of a listed product, and no item in it is a confirmed SKU. It replaced the warehouse photograph on this page, which showed a person packing and could be read as an employee or an operating site.";

export const GRAPHICS = {
  /**
   * Beside "Who are we and what we do" on the homepage (product owner,
   * 2026-09-13, who asked for an image in that section). The two halves of
   * the sentence in one frame: supply cartons and sealed packs for the online
   * stores, rolled floor plans and a scale rule for the clinic projects.
   */
  suppliesAndPlans: {
    src: "/lsh/graphics/supplies-and-plans.jpg",
    alt: "Conceptual still life of plain supply cartons and sealed packs beside rolled floor plans and a scale rule on a pale counter.",
    width: 1600,
    height: 900,
    provenance:
      'Gamma image generation (photo mode), commissioned 2026-09-13 for the homepage "Who are we and what we do" section; monochrome brief, no person, no facility, no logo, no legible text on the plans; scaled to 1600×900 and converted to neutral greyscale with ffmpeg, no red treatment; conceptual, not operational photography, and not a LifeSupply premises or project.',
  },
  /**
   * The two audience panels on Medical Supply Solutions (product owner,
   * 2026-09-13): a home-care setting for individuals and caregivers, a
   * clinic stock room for organizations. Neither shows a person, and the
   * stock room is a generic room, not a LifeSupply premises or a customer's.
   */
  audienceHome: {
    src: "/lsh/graphics/medical-supplies/audience-home-greyscale-v1.jpg",
    alt: "Conceptual photograph of a walking frame beside an armchair, with a blood-pressure monitor on a side table in a daylit living room.",
    width: 1600,
    height: 900,
    provenance: AUDIENCE_PROVENANCE,
  },
  audienceClinic: {
    src: "/lsh/graphics/medical-supplies/audience-clinic-greyscale-v1.jpg",
    alt: "Conceptual photograph of an empty clinic supply room: wire shelving stacked with plain cartons and sealed packs, and a steel cart in front.",
    width: 1600,
    height: 900,
    provenance: AUDIENCE_PROVENANCE,
  },
  /**
   * The category explorer tiles on Medical Supply Solutions (product owner,
   * 2026-09-13). Each illustrates a category and none is a specific product:
   * cartons are blank, screens are blank, and no packaging carries text.
   * Mobility & Daily Living reuses `brandWellmart`, the rollator.
   */
  categoryBathroom: {
    src: "/lsh/graphics/medical-supplies/category-bathroom-greyscale-v1.jpg",
    alt: "Conceptual photograph of a wall-mounted grab bar and a shower chair against a tiled wall in raking light.",
    width: 1600,
    height: 900,
    provenance: CATEGORY_PROVENANCE,
  },
  categoryMonitoring: {
    src: "/lsh/graphics/medical-supplies/category-monitoring-greyscale-v1.jpg",
    alt: "Conceptual still life of a blood-pressure monitor with its cuff, a digital thermometer, and a glucose meter with a test-strip vial on a concrete surface.",
    width: 1600,
    height: 900,
    provenance: CATEGORY_PROVENANCE,
  },
  categoryWound: {
    src: "/lsh/graphics/medical-supplies/category-wound-greyscale-v1.jpg",
    alt: "Conceptual still life of sealed dressing packs, a roll of gauze bandage, and adhesive strips on a white table.",
    width: 1600,
    height: 900,
    provenance: CATEGORY_PROVENANCE,
  },
  categoryClinicDental: {
    src: "/lsh/graphics/medical-supplies/category-clinic-dental-greyscale-v1.jpg",
    alt: "Conceptual still life of a steel tray holding a tissue box, folded gauze, a sealed pack of dental instruments, cotton rolls, and a stack of paper cups.",
    width: 1600,
    height: 900,
    provenance: CATEGORY_PROVENANCE,
  },
  categoryInjection: {
    src: "/lsh/graphics/medical-supplies/category-injection-greyscale-v1.jpg",
    alt: "Conceptual still life of plain unmarked cartons beside a sharps container on a concrete block.",
    width: 1600,
    height: 900,
    provenance: CATEGORY_PROVENANCE,
  },
  categoryIncontinence: {
    src: "/lsh/graphics/medical-supplies/category-incontinence-greyscale-v1.jpg",
    alt: "Conceptual still life of a folded stack of absorbent pads, a plain carton, and a folded towel on a concrete shelf.",
    width: 1600,
    height: 900,
    provenance: CATEGORY_PROVENANCE,
  },
  categoryRespiratory: {
    src: "/lsh/graphics/medical-supplies/category-respiratory-greyscale-v1.jpg",
    alt: "Conceptual photograph of a compact nebulizer with coiled tubing and a mask on a bedside table in sunlight.",
    width: 1600,
    height: 900,
    provenance: CATEGORY_PROVENANCE,
  },
  /**
   * Three illustrations above the operating-foundation columns on the
   * investor page, supplied by the product owner on 2026-09-13: an online
   * supply store's goods with a laptop, a fulfilment box with a hand truck
   * and an order list, and an examination room with a floor plan. Isometric
   * renders, not photographs, and none shows a person, a real product, a
   * real premises or a real order.
   */
  businessStores: {
    src: "/lsh/graphics/investors/stores.png",
    alt: "Conceptual illustration of a laptop showing a product grid beside a rollator, a blood-pressure monitor and sealed dressings on a grey base.",
    width: 960,
    height: 960,
    provenance: BUSINESS_ILLUSTRATION_PROVENANCE,
  },
  businessUs: {
    src: "/lsh/graphics/investors/us.png",
    alt: "Conceptual illustration of an open shipping carton of supplies beside a hand truck of boxes and a tablet showing an order list, on a grey base.",
    width: 960,
    height: 960,
    provenance: BUSINESS_ILLUSTRATION_PROVENANCE,
  },
  businessClinic: {
    src: "/lsh/graphics/investors/clinic.png",
    alt: "Conceptual isometric illustration of an examination room with an exam table, a stool, cabinetry and a rolled floor plan on the floor.",
    width: 960,
    height: 960,
    provenance: BUSINESS_ILLUSTRATION_PROVENANCE,
  },
  /**
   * Beside the "A supply portal built around your organization" heading on
   * Medical Supply Solutions (product owner, 2026-09-13): a desktop monitor
   * showing the page's own illustrative portal concept. The screen carries
   * the concept's label and its fictional-data note; it is a render of the
   * concept, not a product.
   */
  portalMonitor: {
    src: "/lsh/graphics/medical-supplies/supply-portal.jpg",
    alt: "Conceptual illustration of a desktop monitor showing the illustrative portal concept: an approved catalogue with units and approval status, and saved order lists, labelled as proposed capabilities with fictional data.",
    width: 1500,
    height: 1000,
    provenance:
      "Illustration supplied by the product owner on 2026-09-13: a monitor render of the page's own illustrative portal concept, resized to 1500×1000 and saved as JPEG; conceptual, not operational photography, and not a live product, account, or order.",
  },
  /**
   * Three illustrations above the technology steps on the investor page,
   * supplied by the product owner on 2026-09-13. Isometric renders on a
   * white ground, resized to 960 px and saved as JPEG; none shows a person,
   * a real product, a real system or a real order.
   */
  technologyInformation: {
    src: "/lsh/graphics/investors/information.jpg",
    alt: "Conceptual illustration of three product record cards, showing a blister pack, a bottle and a supply carton, beside a database cylinder.",
    width: 960,
    height: 960,
    provenance: TECHNOLOGY_ILLUSTRATION_PROVENANCE,
  },
  technologyMonitoring: {
    src: "/lsh/graphics/investors/monitoring.jpg",
    alt: "Conceptual illustration of a chart panel with a rising and falling line, a magnifier over a dotted projection, and a warning light.",
    width: 960,
    height: 960,
    provenance: TECHNOLOGY_ILLUSTRATION_PROVENANCE,
  },
  technologyOrdering: {
    src: "/lsh/graphics/investors/ordering.jpg",
    alt: "Conceptual illustration of an order list of three cartons with a red confirm bar, beside a calendar with a marked date.",
    width: 960,
    height: 960,
    provenance: TECHNOLOGY_ILLUSTRATION_PROVENANCE,
  },
  /** The Balkowitsch Worldwide store profile on Medical Supply Solutions. */
  balkowitschProducts: {
    src: "/lsh/graphics/medical-supplies/balkowitsch-products-greyscale-v1.jpg",
    alt: "Conceptual arrangement of home-health monitoring equipment and wound-care supplies.",
    width: 1800,
    height: 1012,
    provenance: MEDICAL_SUPPLIES_PROVENANCE,
  },
  /**
   * Above the "A clinic project" card in the Clinic Solutions router,
   * supplied by the product owner on 2026-09-13: an isometric clinic model
   * standing on a floor plan, with a scale rule, a pencil, rolled drawings
   * and a fan of finish samples. A render, not a photograph; no person, no
   * real project and no real premises. The other two router cards reuse
   * the examination-room and supply-store renders registered for the
   * investor page, which the owner supplied again for this placement.
   */
  clinicProject: {
    src: "/lsh/graphics/clinic-solutions/clinic-project.jpg",
    alt: "Conceptual illustration of an isometric clinic model standing on a floor plan, with a scale rule, a pencil, rolled drawings and a fan of finish samples.",
    width: 1440,
    height: 960,
    provenance: CLINIC_ROUTER_PROVENANCE,
  },
  /**
   * The Pharmacy Solutions hero illustration, supplied by the product owner
   * on 2026-09-13: a bathroom scale, a blood-pressure monitor with its cuff,
   * a grey organizer case and two sealed pouches. A render, not a
   * photograph; no person, no medication, no real product.
   */
  pharmacySupplies: {
    src: "/lsh/graphics/pharmacy/supplies.png",
    alt: "Conceptual illustration of a bathroom scale, a blood-pressure monitor with its cuff, a grey organizer case and two sealed pouches.",
    width: 960,
    height: 960,
    provenance: PHARMACY_ILLUSTRATION_PROVENANCE,
  },
  /** Two representative-supplies tiles on Pharmacy Solutions; the other four reuse category and still-life graphics already here. */
  pharmacyInjection: {
    src: "/lsh/graphics/pharmacy/injection-accessories-greyscale-v1.jpg",
    alt: "Conceptual still life of plain white cartons, two sealed blank packets and a capped pen needle on a pale surface.",
    width: 1600,
    height: 900,
    provenance: PHARMACY_CATEGORY_PROVENANCE,
  },
  pharmacyOrganization: {
    src: "/lsh/graphics/pharmacy/supply-organization-greyscale-v1.jpg",
    alt: "Conceptual still life of an open grey organizer case holding folded gauze, a sealed pouch and a plain carton, beside a small zip pouch.",
    width: 1600,
    height: 900,
    provenance: PHARMACY_CATEGORY_PROVENANCE,
  },
  /** Behind the Connected Care Vision hero (2026-09-13): a consultation desk, not a laboratory. */
  connectedCareDesk: {
    src: "/lsh/graphics/connected-care/consultation-desk-greyscale-v1.jpg",
    alt: "Conceptual photograph of a consultation desk in window light, with a tablet showing a blank screen, a blood-pressure monitor with its cuff, a sealed carton and a pen on a notepad.",
    width: 1600,
    height: 900,
    provenance: CONNECTED_CARE_PROVENANCE,
  },
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
