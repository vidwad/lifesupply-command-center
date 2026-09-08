/**
 * Brand registry — the typed record of the group's public surfaces
 * (docs/website-development/CLAUDE.md §2, IMPLEMENTATION_BACKLOG.md §11).
 *
 * Everything a component needs to name a brand, link to it, or describe its
 * geography comes from here. Unknown values are `null`, never guessed: a
 * legal relationship is recorded only when the product owner confirms it
 * (WEB-01), and no relationship is inferred from a website label.
 *
 * `canonicalUrl` values were fetched and returned HTTP 200 on the
 * `verifiedAt` date (SOURCE_REGISTER.md §1). They carry no query string or
 * tracking parameter; `registry.test.ts` enforces that. The Command Center
 * is not a brand: its login is rendered only by `CommandCenterLoginLink`.
 */
export type BrandKey = "corporate" | "lifesupply" | "wellmart" | "clinics" | "balkowitsch";

export type BrandAvailability =
  | "operating"
  | "pilot"
  | "in_development"
  | "under_evaluation"
  | "unavailable";

export interface BrandRecord {
  key: BrandKey;
  /** Display name. */
  name: string;
  /** Legal entity, once confirmed. `null` until WEB-01. */
  legalEntity: string | null;
  /** Relationship to LifeSupply Health Supplies Inc., once confirmed. `null` until WEB-01. */
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
  /** Authentic mark with its provenance; `null` until an approved file exists (WB-207). */
  asset: { src: string; width: number; height: number; source: string; usage: string } | null;
  /** SOURCE_REGISTER.md rows that support this record. */
  source: string;
  owner: string | null;
  verifiedAt: string;
  publishStatus: "published" | "draft";
  availability: BrandAvailability;
}

export const BRANDS: readonly BrandRecord[] = [
  {
    key: "corporate",
    name: "LifeSupply Health",
    legalEntity: "LifeSupply Health Supplies Inc.",
    relationship: "corporate",
    canonicalUrl: "https://lifesupplyhealth.com/",
    country: "CA",
    currency: null,
    purpose:
      "Corporate hub for the group: operating portfolio, clinic solutions, partners, and investors.",
    supportUrl: null,
    supportPhone: null,
    supportEmail: "info@lifesupply.com",
    asset: {
      src: "/lsh/lifesupply-mark.png",
      width: 661,
      height: 93,
      source: "Official logo supplied by the product owner, 2026-09-08",
      usage: "Dark fields only",
    },
    source: "S-01, S-13, S-27",
    owner: null,
    verifiedAt: "2026-09-08",
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
    asset: null,
    source: "S-02, S-10, S-25, S-30, S-80–S-84",
    owner: null,
    verifiedAt: "2026-09-08",
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
    asset: null,
    source: "S-03, S-12, S-29, S-85–S-87",
    owner: null,
    verifiedAt: "2026-09-08",
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
    asset: null,
    source: "S-04, S-16, S-28, S-70–S-75",
    owner: null,
    verifiedAt: "2026-09-08",
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
    asset: null,
    source: "S-05, S-15, S-24, S-88",
    owner: null,
    verifiedAt: "2026-09-08",
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

/** "Canada · CAD" style descriptor used on cards; never a legal statement. */
export function brandGeography(record: BrandRecord): string {
  const country = record.country === "CA" ? "Canada" : "United States";
  return record.currency ? `${country} · ${record.currency}` : country;
}
