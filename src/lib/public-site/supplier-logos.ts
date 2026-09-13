/**
 * Brands carried across the operating stores, for the footer logo band
 * (product owner, 2026-09-13).
 *
 * Every entry is a brand whose logo the store itself publishes on its
 * brands directory (lifesupply.ca/brands/ or wellmartmedical.com/brands/),
 * observed on `verifiedAt`. A logo is listed only because the store lists
 * the brand; nothing here asserts a contract, an exclusive arrangement, a
 * partnership, or an endorsement, and the band's label says "carried", not
 * "partners". Add a brand by adding a treated file and a row; the registry
 * test checks the file, its size and its name.
 *
 * Treatment: copied from the store's own brand image at its original upload
 * size, white background keyed out, converted to greyscale with alpha,
 * trimmed to the mark, and scaled to 96px tall (48px displayed) with Pillow;
 * no colour, no red, no reshaping of any mark.
 */
export interface SupplierLogo {
  slug: string;
  /** The brand name as the store lists it; also the image's alt text. */
  name: string;
  src: string;
  width: number;
  height: number;
  /** The operating store whose brands directory lists it. */
  observedOn: "lifesupply" | "wellmart";
  verifiedAt: string;
}

const VERIFIED = "2026-09-13";

export const SUPPLIER_LOGOS: readonly SupplierLogo[] = [
  {
    slug: "3m",
    name: "3M",
    src: "/lsh/logos/3m.png",
    width: 183,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "abbott",
    name: "Abbott",
    src: "/lsh/logos/abbott.png",
    width: 360,
    height: 90,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "ad-medical",
    name: "A&D Medical",
    src: "/lsh/logos/ad-medical.png",
    width: 200,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "allison-medical",
    name: "Allison Medical",
    src: "/lsh/logos/allison-medical.png",
    width: 232,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "attends",
    name: "Attends",
    src: "/lsh/logos/attends.png",
    width: 360,
    height: 68,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "avanos",
    name: "Avanos",
    src: "/lsh/logos/avanos.png",
    width: 360,
    height: 61,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "b-braun",
    name: "B. Braun",
    src: "/lsh/logos/b-braun.png",
    width: 360,
    height: 62,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "bard",
    name: "Bard",
    src: "/lsh/logos/bard.png",
    width: 360,
    height: 86,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "baxter",
    name: "Baxter",
    src: "/lsh/logos/baxter.png",
    width: 360,
    height: 57,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "bayer",
    name: "Bayer",
    src: "/lsh/logos/bayer.png",
    width: 96,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "bd",
    name: "BD",
    src: "/lsh/logos/bd.png",
    width: 254,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "bsn",
    name: "BSN Medical",
    src: "/lsh/logos/bsn.png",
    width: 360,
    height: 95,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "cardinal-health",
    name: "Cardinal Health",
    src: "/lsh/logos/cardinal-health.png",
    width: 302,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "coloplast",
    name: "Coloplast",
    src: "/lsh/logos/coloplast.png",
    width: 360,
    height: 82,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "convatec",
    name: "Convatec",
    src: "/lsh/logos/convatec.png",
    width: 360,
    height: 94,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "covidien",
    name: "Covidien",
    src: "/lsh/logos/covidien.png",
    width: 360,
    height: 64,
    observedOn: "wellmart",
    verifiedAt: VERIFIED,
  },
  {
    slug: "deroyal",
    name: "DeRoyal",
    src: "/lsh/logos/deroyal.png",
    width: 360,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "drive-medical",
    name: "Drive DeVilbiss Healthcare",
    src: "/lsh/logos/drive-medical.png",
    width: 360,
    height: 64,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "dukal",
    name: "Dukal",
    src: "/lsh/logos/dukal.png",
    width: 360,
    height: 74,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "dynarex",
    name: "Dynarex",
    src: "/lsh/logos/dynarex.png",
    width: 301,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "gojo",
    name: "GOJO",
    src: "/lsh/logos/gojo.png",
    width: 277,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "graham-field",
    name: "Graham-Field",
    src: "/lsh/logos/graham-field.png",
    width: 360,
    height: 89,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "hollister",
    name: "Hollister",
    src: "/lsh/logos/hollister.png",
    width: 243,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "icu-medical",
    name: "ICU Medical",
    src: "/lsh/logos/icu-medical.png",
    width: 360,
    height: 94,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "integra",
    name: "Integra LifeSciences",
    src: "/lsh/logos/integra.png",
    width: 267,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "invacare",
    name: "Invacare",
    src: "/lsh/logos/invacare.png",
    width: 211,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "jobst",
    name: "Jobst",
    src: "/lsh/logos/jobst.png",
    width: 294,
    height: 96,
    observedOn: "lifesupply",
    verifiedAt: VERIFIED,
  },
  {
    slug: "kimberly-clark",
    name: "Kimberly-Clark",
    src: "/lsh/logos/kimberly-clark.png",
    width: 360,
    height: 47,
    observedOn: "wellmart",
    verifiedAt: VERIFIED,
  },
  {
    slug: "medline",
    name: "Medline",
    src: "/lsh/logos/medline.png",
    width: 108,
    height: 96,
    observedOn: "wellmart",
    verifiedAt: VERIFIED,
  },
];
