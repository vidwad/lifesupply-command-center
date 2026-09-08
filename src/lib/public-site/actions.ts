/**
 * Action registry — every primary action the public site can render, with
 * the destination that works today (ROUTE_AND_ACTION_MAP.md §2).
 *
 * Destinations are one of: an internal route that is live, an external URL
 * that was verified on the recorded date, or an approved contact channel.
 * `registry.test.ts` checks that internal paths are live routes, that
 * `mailto:` values appear in the approved directory, and that external URLs
 * belong to a registered brand. Components call `actionHref()`; they never
 * assemble a destination themselves.
 *
 * Stage 7 replaces the contact-channel destinations with the inquiry intake.
 * The Command Center login is deliberately absent: only
 * `CommandCenterLoginLink` may resolve it.
 */
import { getBrand } from "@/lib/public-site/brands";
import {
  BRAND_ROUTES,
  LIFE_SUPPLY_ROUTES,
  METABOLIC_ROUTES,
  STAGE_3_ROUTES,
  STAGE_5_ROUTES,
} from "@/lib/public-site/routes";

export type ActionKey =
  | "explore_businesses"
  | "about_group"
  | "plan_clinic"
  | "equipment_quote"
  | "clinic_supply_review"
  | "clinic_solutions"
  | "view_clinic_projects"
  | "discuss_program"
  | "metabolic_hub"
  | "explore_kits"
  | "refills_information"
  | "partner_inquiry"
  | "partners_hub"
  | "clinic_collaboration"
  | "growth_strategy"
  | "advanced_therapeutics"
  | "investor_documents"
  | "supplier_inquiry"
  | "us_business_inquiry"
  | "acquisition_inquiry"
  | "general_inquiry"
  | "investor_information"
  | "investor_materials"
  | "shareholder_services"
  | "shop_lifesupply"
  | "shop_wellmart"
  | "shop_clinics"
  | "shop_balkowitsch"
  | "shop_services"
  | "brand_lifesupply"
  | "brand_wellmart"
  | "brand_clinics"
  | "brand_balkowitsch"
  | "technology_fulfilment"
  | "contact_directory";

export type ActionDestination =
  | { kind: "internal"; path: string }
  | { kind: "external"; url: string }
  | { kind: "mailto"; value: string }
  | { kind: "tel"; value: string };

export type InquiryIntent =
  | "clinic_development"
  | "equipment_quote"
  | "ongoing_procurement"
  | "metabolic_program"
  | "pharmacy"
  | "supplier"
  | "investor"
  | "shareholder"
  | "acquisition"
  | "general"
  | "existing_order_support";

export interface ActionRecord {
  key: ActionKey;
  label: string;
  intent: InquiryIntent | "navigation" | "commerce" | "partner";
  destination: ActionDestination;
  /** Approved directory channel that owns the follow-up, once WEB-07 assigns one. */
  ownerChannel: string | null;
  /** ISO date the external destination last returned HTTP 200; `null` for internal paths. */
  verifiedAt: string | null;
}

const VERIFIED = "2026-09-08";

const internal = (path: string): ActionDestination => ({ kind: "internal", path });
const external = (url: string): ActionDestination => ({ kind: "external", url });
const mail = (value: string): ActionDestination => ({ kind: "mailto", value });

export const ACTIONS: Record<ActionKey, ActionRecord> = {
  explore_businesses: {
    key: "explore_businesses",
    label: "Explore our businesses",
    intent: "navigation",
    destination: internal(LIFE_SUPPLY_ROUTES.operations),
    ownerChannel: null,
    verifiedAt: null,
  },
  about_group: {
    key: "about_group",
    label: "About LifeSupply",
    intent: "navigation",
    destination: internal(LIFE_SUPPLY_ROUTES.about),
    ownerChannel: null,
    verifiedAt: null,
  },
  plan_clinic: {
    key: "plan_clinic",
    label: "Book a consultation",
    intent: "clinic_development",
    // The Clinics site's own consultation page (S-73).
    destination: external("https://www.lifesupplyclinics.com/contact-us/"),
    ownerChannel: "info@lifesupplyclinics.com",
    verifiedAt: VERIFIED,
  },
  equipment_quote: {
    key: "equipment_quote",
    label: "Request an equipment quote",
    intent: "equipment_quote",
    // The Clinics site's own quote page (S-73).
    destination: external("https://www.lifesupplyclinics.com/buy-clinic-equipment/"),
    ownerChannel: "info@lifesupplyclinics.com",
    verifiedAt: VERIFIED,
  },
  clinic_supply_review: {
    key: "clinic_supply_review",
    label: "Request a supply review",
    intent: "ongoing_procurement",
    destination: mail("ben@lifesupply.com"),
    ownerChannel: "Online sales & product lines",
    verifiedAt: null,
  },
  clinic_solutions: {
    key: "clinic_solutions",
    label: "Clinic Solutions",
    intent: "navigation",
    destination: internal(STAGE_3_ROUTES.clinicSolutions),
    ownerChannel: null,
    verifiedAt: null,
  },
  view_clinic_projects: {
    key: "view_clinic_projects",
    label: "See published projects",
    intent: "clinic_development",
    destination: external("https://www.lifesupplyclinics.com/our-projects/"),
    ownerChannel: null,
    verifiedAt: VERIFIED,
  },
  metabolic_hub: {
    key: "metabolic_hub",
    label: "Metabolic Health",
    intent: "navigation",
    destination: internal(METABOLIC_ROUTES.hub),
    ownerChannel: null,
    verifiedAt: null,
  },
  explore_kits: {
    key: "explore_kits",
    label: "Explore the pathways",
    intent: "navigation",
    destination: internal(METABOLIC_ROUTES.careKits),
    ownerChannel: null,
    verifiedAt: null,
  },
  refills_information: {
    key: "refills_information",
    label: "How refills work",
    intent: "navigation",
    destination: internal(METABOLIC_ROUTES.refills),
    ownerChannel: null,
    verifiedAt: null,
  },
  discuss_program: {
    key: "discuss_program",
    label: "Discuss a supply program",
    intent: "metabolic_program",
    destination: mail("info@lifesupply.com"),
    ownerChannel: null,
    verifiedAt: null,
  },
  partners_hub: {
    key: "partners_hub",
    label: "Explore partner relationships",
    intent: "navigation",
    destination: internal(STAGE_5_ROUTES.partners),
    ownerChannel: null,
    verifiedAt: null,
  },
  clinic_collaboration: {
    key: "clinic_collaboration",
    label: "Discuss clinic collaboration",
    intent: "partner",
    destination: mail("info@lifesupply.com"),
    ownerChannel: "info@lifesupply.com",
    verifiedAt: null,
  },
  growth_strategy: {
    key: "growth_strategy",
    label: "Growth strategy",
    intent: "navigation",
    destination: internal(STAGE_5_ROUTES.growthStrategy),
    ownerChannel: null,
    verifiedAt: null,
  },
  advanced_therapeutics: {
    key: "advanced_therapeutics",
    label: "Advanced therapeutics",
    intent: "navigation",
    destination: internal(STAGE_5_ROUTES.advancedTherapeutics),
    ownerChannel: null,
    verifiedAt: null,
  },
  investor_documents: {
    key: "investor_documents",
    label: "Documents index",
    intent: "navigation",
    destination: internal(STAGE_5_ROUTES.investorDocuments),
    ownerChannel: null,
    verifiedAt: null,
  },
  partner_inquiry: {
    key: "partner_inquiry",
    label: "Start a partner conversation",
    intent: "partner",
    destination: mail("info@lifesupply.com"),
    ownerChannel: null,
    verifiedAt: null,
  },
  supplier_inquiry: {
    key: "supplier_inquiry",
    label: "Submit a supplier inquiry",
    intent: "supplier",
    destination: mail("info@lifesupply.com"),
    ownerChannel: null,
    verifiedAt: null,
  },
  us_business_inquiry: {
    key: "us_business_inquiry",
    label: "U.S. business inquiry",
    intent: "general",
    destination: mail("info@lifesupply.com"),
    ownerChannel: null,
    verifiedAt: null,
  },
  acquisition_inquiry: {
    key: "acquisition_inquiry",
    label: "Acquisition or strategic inquiry",
    intent: "acquisition",
    destination: mail("abdul@lifesupply.com"),
    ownerChannel: "Mergers & acquisitions",
    verifiedAt: null,
  },
  general_inquiry: {
    key: "general_inquiry",
    label: "General inquiry",
    intent: "general",
    destination: mail("info@lifesupply.com"),
    ownerChannel: "Corporate office",
    verifiedAt: null,
  },
  investor_information: {
    key: "investor_information",
    label: "Investor relations",
    intent: "investor",
    destination: internal(LIFE_SUPPLY_ROUTES.investorRelations),
    ownerChannel: "Investor relations",
    verifiedAt: null,
  },
  investor_materials: {
    key: "investor_materials",
    label: "Request investor materials",
    intent: "investor",
    destination: mail("invest@lifesupply.com"),
    ownerChannel: "Investor relations",
    verifiedAt: null,
  },
  shareholder_services: {
    key: "shareholder_services",
    label: "Shareholder services",
    intent: "shareholder",
    destination: mail("invest@lifesupply.com"),
    ownerChannel: "Investor relations",
    verifiedAt: null,
  },
  shop_lifesupply: {
    key: "shop_lifesupply",
    label: "Shop LifeSupply",
    intent: "commerce",
    destination: external(getBrand("lifesupply").canonicalUrl),
    ownerChannel: null,
    verifiedAt: VERIFIED,
  },
  shop_wellmart: {
    key: "shop_wellmart",
    label: "Shop Wellmart Medical",
    intent: "commerce",
    destination: external(getBrand("wellmart").canonicalUrl),
    ownerChannel: null,
    verifiedAt: VERIFIED,
  },
  shop_clinics: {
    key: "shop_clinics",
    label: "Visit LifeSupply Clinics",
    intent: "clinic_development",
    destination: external(getBrand("clinics").canonicalUrl),
    ownerChannel: null,
    verifiedAt: VERIFIED,
  },
  shop_balkowitsch: {
    key: "shop_balkowitsch",
    label: "Shop Balkowitsch Worldwide",
    intent: "commerce",
    destination: external(getBrand("balkowitsch").canonicalUrl),
    ownerChannel: null,
    verifiedAt: VERIFIED,
  },
  shop_services: {
    key: "shop_services",
    label: "Shop & Services",
    intent: "navigation",
    destination: internal(LIFE_SUPPLY_ROUTES.shop),
    ownerChannel: null,
    verifiedAt: null,
  },
  brand_lifesupply: {
    key: "brand_lifesupply",
    label: "About LifeSupply.ca",
    intent: "navigation",
    destination: internal(BRAND_ROUTES.lifesupply),
    ownerChannel: null,
    verifiedAt: null,
  },
  brand_wellmart: {
    key: "brand_wellmart",
    label: "About Wellmart Medical",
    intent: "navigation",
    destination: internal(BRAND_ROUTES.wellmart),
    ownerChannel: null,
    verifiedAt: null,
  },
  brand_clinics: {
    key: "brand_clinics",
    label: "About LifeSupply Clinics",
    intent: "navigation",
    destination: internal(BRAND_ROUTES.clinics),
    ownerChannel: null,
    verifiedAt: null,
  },
  brand_balkowitsch: {
    key: "brand_balkowitsch",
    label: "About Balkowitsch Worldwide",
    intent: "navigation",
    destination: internal(BRAND_ROUTES.balkowitsch),
    ownerChannel: null,
    verifiedAt: null,
  },
  technology_fulfilment: {
    key: "technology_fulfilment",
    label: "Technology & fulfilment",
    intent: "navigation",
    destination: internal(STAGE_3_ROUTES.technology),
    ownerChannel: null,
    verifiedAt: null,
  },
  contact_directory: {
    key: "contact_directory",
    label: "Contact",
    intent: "navigation",
    destination: internal(LIFE_SUPPLY_ROUTES.contact),
    ownerChannel: null,
    verifiedAt: null,
  },
};

export function getAction(key: ActionKey): ActionRecord {
  return ACTIONS[key];
}

/** The href to render for an action, whatever kind of destination it has. */
export function actionHref(key: ActionKey): string {
  const { destination } = ACTIONS[key];
  switch (destination.kind) {
    case "internal":
      return destination.path;
    case "external":
      return destination.url;
    case "mailto":
      return `mailto:${destination.value}`;
    case "tel":
      return `tel:${destination.value.replace(/[^+\d]/g, "")}`;
  }
}

/** True when the action leaves this site (external URL, mail, or phone). */
export function isExternalAction(key: ActionKey): boolean {
  return ACTIONS[key].destination.kind !== "internal";
}
