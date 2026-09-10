/**
 * Brand registry — the typed record of the group's public surfaces
 * (docs/website-development/CLAUDE.md §2, IMPLEMENTATION_BACKLOG.md §11).
 *
 * Everything a component needs to name a brand, link to it, or describe its
 * geography comes from here. Unknown values are `null`, never guessed: a
 * legal relationship is recorded only when the product owner confirms it
 * (WEB-01), and no relationship is inferred from a website label.
 *
 * Every URL here (`canonicalUrl`, `supportUrl`, `categories`, `storeLinks`)
 * was fetched and returned HTTP 200 on the `verifiedAt` date
 * (SOURCE_REGISTER.md §1 and §7; Stage 3 re-verification 2026-09-08). They
 * carry no query string or tracking parameter; `registry.test.ts` enforces
 * that. Category links are the store's own category pages, listed only when
 * they were observed on the store; no category is guessed. The Command
 * Center is not a brand: its login is rendered only by
 * `CommandCenterLoginLink`.
 */
export type BrandKey = "corporate" | "lifesupply" | "wellmart" | "clinics" | "balkowitsch";

export type OperatingBrandKey = Exclude<BrandKey, "corporate">;

export type BrandAvailability =
  | "operating"
  | "pilot"
  | "in_development"
  | "under_evaluation"
  | "unavailable";

export interface VerifiedLink {
  label: string;
  url: string;
}

export interface BrandRecord {
  key: BrandKey;
  /** Display name. */
  name: string;
  /** Legal entity, once confirmed. `null` until WEB-01. */
  legalEntity: string | null;
  /** Relationship to LifeSupply Health Inc., once confirmed. `null` until WEB-01. */
  relationship: "corporate" | "operated_by_group_entity" | "related" | null;
  canonicalUrl: string;
  country: "CA" | "US";
  currency: "CAD" | "USD" | null;
  /** One-line purpose in plain language. */
  purpose: string;
  /** Verified customer-support destination on the brand's own site. */
  supportUrl: string | null;
  supportPhone: string | null;
  supportEmail: string | null;
  /** Support hours exactly as the brand publishes them; `null` when not observed. */
  supportHours: string | null;
  /** Verified category pages on the brand's own site (observed, never guessed). */
  categories: VerifiedLink[];
  /** Verified policy or service pages on the brand's own site. */
  storeLinks: VerifiedLink[];
  /** Authentic mark with its provenance; `null` until an approved file exists (WB-207). */
  asset: { src: string; width: number; height: number; source: string; usage: string } | null;
  /** SOURCE_REGISTER.md rows that support this record. */
  source: string;
  owner: string | null;
  verifiedAt: string;
  publishStatus: "published" | "draft";
  availability: BrandAvailability;
}

const VERIFIED = "2026-09-08";

export const BRANDS: readonly BrandRecord[] = [
  {
    key: "corporate",
    name: "LifeSupply Health",
    legalEntity: "LifeSupply Health Inc.",
    relationship: "corporate",
    canonicalUrl: "https://lifesupplyhealth.com/",
    country: "CA",
    currency: null,
    purpose:
      "Corporate hub for the group: operating portfolio, clinic solutions, partners, and investors.",
    supportUrl: null,
    supportPhone: null,
    supportEmail: "info@lifesupply.com",
    supportHours: null,
    categories: [],
    storeLinks: [],
    asset: {
      src: "/lsh/lifesupply-mark.png",
      width: 661,
      height: 93,
      source: "Official logo supplied by the product owner, 2026-09-08",
      usage: "Dark fields only",
    },
    source: "S-01, S-13, S-27",
    owner: null,
    verifiedAt: VERIFIED,
    publishStatus: "published",
    availability: "operating",
  },
  {
    key: "lifesupply",
    name: "LifeSupply",
    legalEntity: null,
    relationship: null,
    canonicalUrl: "https://lifesupply.ca/",
    country: "CA",
    currency: "CAD",
    purpose:
      "Canadian online store for medical, health, and home-care supplies, including clinic supplies.",
    supportUrl: "https://lifesupply.ca/contact/",
    supportPhone: "1-855-755-5433",
    supportEmail: "info@lifesupply.com",
    supportHours: "Monday to Friday, 9 AM to 5 PM Pacific",
    categories: [
      { label: "Clinic supplies", url: "https://lifesupply.ca/clinic-supplies/" },
      { label: "Dental clinic supplies", url: "https://lifesupply.ca/dental-clinic-supplies/" },
      { label: "Needles and syringes", url: "https://lifesupply.ca/needles-syringes/" },
      { label: "Diabetic", url: "https://lifesupply.ca/diabetic/" },
      { label: "Blood glucose meters", url: "https://lifesupply.ca/blood-glucose-meters/" },
      { label: "Biometric monitors", url: "https://lifesupply.ca/biometric-monitors/" },
      { label: "Medical thermometers", url: "https://lifesupply.ca/medical-thermometers/" },
      { label: "First aid", url: "https://lifesupply.ca/first-aid/" },
      { label: "Mobility aids", url: "https://lifesupply.ca/mobility-aids/" },
    ],
    storeLinks: [
      { label: "Shipping and ordering", url: "https://lifesupply.ca/shipping-ordering/" },
      { label: "Return policy", url: "https://lifesupply.ca/return-policy/" },
    ],
    asset: null,
    source: "S-02, S-10, S-25, S-30, S-52, S-80–S-84",
    owner: null,
    verifiedAt: VERIFIED,
    publishStatus: "published",
    availability: "operating",
  },
  {
    key: "wellmart",
    name: "Wellmart Medical",
    legalEntity: null,
    relationship: null,
    canonicalUrl: "https://wellmartmedical.com/",
    country: "CA",
    currency: "CAD",
    purpose: "Canadian online store for home medical equipment and supplies.",
    supportUrl: "https://wellmartmedical.com/contact-us/",
    supportPhone: "1-855-755-5433",
    supportEmail: "info@wellmartmedical.com",
    supportHours: "9 AM to 5 PM Pacific",
    categories: [
      {
        label: "Home medical equipment",
        url: "https://wellmartmedical.com/home-medical-equipment/",
      },
      { label: "Mobility", url: "https://wellmartmedical.com/mobility/" },
      { label: "Bath safety", url: "https://wellmartmedical.com/bath-safety/" },
      { label: "Incontinence", url: "https://wellmartmedical.com/incontinence/" },
      { label: "Ostomy", url: "https://wellmartmedical.com/ostomy/" },
      { label: "Respiratory", url: "https://wellmartmedical.com/respiratory/" },
      { label: "Diabetic", url: "https://wellmartmedical.com/diabetic/" },
      { label: "Health monitors", url: "https://wellmartmedical.com/health-monitors/" },
      { label: "Needles and syringes", url: "https://wellmartmedical.com/needles-and-syringes/" },
      { label: "Skin and wound", url: "https://wellmartmedical.com/skin-and-wound/" },
    ],
    storeLinks: [],
    asset: null,
    source: "S-03, S-12, S-29, S-52, S-85–S-87",
    owner: null,
    verifiedAt: VERIFIED,
    publishStatus: "published",
    availability: "operating",
  },
  {
    key: "clinics",
    name: "LifeSupply Clinics",
    legalEntity: null,
    relationship: null,
    canonicalUrl: "https://www.lifesupplyclinics.com/",
    country: "CA",
    currency: "CAD",
    purpose:
      "Clinic planning, design, construction and fit-out, project coordination, and equipment inquiries, within verified delivery arrangements.",
    supportUrl: "https://www.lifesupplyclinics.com/contact-us/",
    supportPhone: "1-855-755-5433",
    supportEmail: "info@lifesupplyclinics.com",
    supportHours: null,
    categories: [],
    storeLinks: [
      { label: "Our services", url: "https://www.lifesupplyclinics.com/our-services/" },
      { label: "Our projects", url: "https://www.lifesupplyclinics.com/our-projects/" },
      {
        label: "Buy clinic equipment",
        url: "https://www.lifesupplyclinics.com/buy-clinic-equipment/",
      },
    ],
    asset: null,
    source: "S-04, S-16, S-28, S-70–S-75",
    owner: null,
    verifiedAt: VERIFIED,
    publishStatus: "published",
    availability: "operating",
  },
  {
    key: "balkowitsch",
    name: "Balkowitsch Worldwide",
    legalEntity: null,
    relationship: null,
    canonicalUrl: "https://balkowitsch.com/",
    country: "US",
    currency: "USD",
    purpose:
      "U.S. online store with medical, health, wellness, and related categories, priced in U.S. dollars.",
    supportUrl: "https://balkowitsch.com/contact-us/",
    supportPhone: "(800) 355-2956",
    supportEmail: "sales@balkowitsch.com",
    supportHours: "8 AM to 4 PM",
    categories: [
      { label: "Health", url: "https://balkowitsch.com/categories/health.html" },
      {
        label: "Digital measuring devices",
        url: "https://balkowitsch.com/categories/digital-measuring-devices.html",
      },
      { label: "Wound care", url: "https://balkowitsch.com/categories/wound-care.html" },
      { label: "Living aids", url: "https://balkowitsch.com/categories/living-aids.html" },
    ],
    storeLinks: [
      { label: "Shipping and returns", url: "https://balkowitsch.com/shipping-returns/" },
      { label: "FAQ", url: "https://balkowitsch.com/faq/" },
    ],
    asset: null,
    source: "S-05, S-15, S-24, S-52, S-88",
    owner: null,
    verifiedAt: VERIFIED,
    publishStatus: "published",
    availability: "operating",
  },
];

/** The four operating websites, in the order the guide lists them. */
export const OPERATING_BRANDS: readonly BrandRecord[] = BRANDS.filter(
  (record) => record.key !== "corporate",
);

export function getBrand(key: BrandKey): BrandRecord {
  const record = BRANDS.find((entry) => entry.key === key);
  if (!record) throw new Error(`Unknown brand: ${key}`);
  return record;
}

/** A verified category by its registered label; throws so a typo can never render a guessed URL. */
export function getBrandCategory(key: BrandKey, label: string): VerifiedLink {
  const category = getBrand(key).categories.find((entry) => entry.label === label);
  if (!category) throw new Error(`Unknown category for ${key}: ${label}`);
  return category;
}

/** "Canada · CAD" style descriptor used on cards; never a legal statement. */
export function brandGeography(record: BrandRecord): string {
  const country = record.country === "CA" ? "Canada" : "United States";
  return record.currency ? `${country} · ${record.currency}` : country;
}
