import Image from "next/image";

/**
 * Decorative visual media for `/metabolic-health/`.
 *
 * The artwork is deliberately an unbranded, non-drug supply-planning still
 * life: it cannot imply a treatment, a kit contents list, an available product,
 * or a clinical recommendation. The page's approved content remains the source
 * of truth for every visible claim.
 */
const METABOLIC_HERO_ART =
  "https://files.manuscdn.com/user_upload_by_module/session_file/108358424/IrfLMmnDFNVssjmQ.png";

const METABOLIC_EDITORIAL_ART = {
  pathways: "/lsh/graphics/metabolic-supplies.jpg",
  replenishment: "/lsh/graphics/warehouse.jpg",
  collaboration: "/lsh/graphics/pharmacy.jpg",
} as const;

type EditorialVisual = keyof typeof METABOLIC_EDITORIAL_ART;

/**
 * The hero media sits behind the public-hero contrast field. Its objects stay
 * right-aligned so the title keeps a quiet, readable left side at every width.
 */
export function MetabolicHeroVisual() {
  return (
    <div className="lsh-metabolic-hero-media" aria-hidden="true">
      <Image
        src={METABOLIC_HERO_ART}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_center]"
      />
      <span className="lsh-metabolic-hero-halo lsh-metabolic-hero-halo--one" />
      <span className="lsh-metabolic-hero-halo lsh-metabolic-hero-halo--two" />
    </div>
  );
}

/**
 * Three conceptual visual anchors used by the pathway, replenishment and
 * collaboration sections. They are decorative: no visible text is embedded in
 * the raster imagery, and every approved statement stays as accessible HTML.
 */
export function MetabolicEditorialVisual({ visual }: { visual: EditorialVisual }) {
  return (
    <div
      className={`lsh-metabolic-editorial lsh-metabolic-editorial--${visual}`}
      aria-hidden="true"
    >
      <Image
        src={METABOLIC_EDITORIAL_ART[visual]}
        alt=""
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      <span className="lsh-metabolic-editorial-line" />
    </div>
  );
}

/**
 * A graphic rhythm for the replenishment section. It is intentionally
 * unlabelled: it communicates continuity without suggesting a schedule,
 * automatic shipment, inventory level, or available supply programme.
 */
export function MetabolicReplenishmentRhythm() {
  return (
    <div className="lsh-metabolic-rhythm" aria-hidden="true">
      <div className="lsh-metabolic-rhythm-track">
        <span className="lsh-metabolic-rhythm-unit lsh-metabolic-rhythm-unit--one" />
        <span className="lsh-metabolic-rhythm-unit lsh-metabolic-rhythm-unit--two" />
        <span className="lsh-metabolic-rhythm-unit lsh-metabolic-rhythm-unit--three" />
      </div>
    </div>
  );
}

/** Decorative collaboration coordinates placed over the conceptual still life. */
export function MetabolicCoordinationGrid() {
  return (
    <svg className="lsh-metabolic-coordinates" viewBox="0 0 320 180" fill="none" aria-hidden="true">
      <path d="M32 138L115 62L202 112L287 35" />
      <path d="M32 35L115 62L202 20L287 35" />
      <path d="M32 138L115 154L202 112L287 145" />
      <circle cx="32" cy="138" r="5" />
      <circle cx="115" cy="62" r="5" />
      <circle cx="202" cy="112" r="5" />
      <circle cx="287" cy="35" r="5" />
      <circle cx="115" cy="154" r="4" />
      <circle cx="202" cy="20" r="4" />
      <circle cx="287" cy="145" r="4" />
    </svg>
  );
}
