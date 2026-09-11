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
  PHARMACY_ROUTES,
  STAGE_3_ROUTES,
  STAGE_5_ROUTES,
  sectionRoute,
} from "@/lib/public-site/routes";

export type ActionKey =
  | "explore_businesses"
  | "about_group"
  | "plan_clinic"
  | "equipment_quote"
  | "clinic_supply_review"
  | "clinic_equipment"
  | "clinic_ongoing_supplies"
  | "clinic_solutions"
  | "pharmacy_hub"
  | "view_clinic_projects"
  | "discuss_program"
  | "pharmacy_program_inquiry"
  | "metabolic_hub"
  | "explore_kits"
  | "refills_information"
  | "partner_inquiry"
  | "business_inquiries"
  | "partner_clinics"
  | "partner_pharmacies"
  | "clinic_collaboration"
  | "growth_strategy"
  | "advanced_therapeutics"
  | "news_resources"
  | "supplier_inquiry"
  | "supplier_page"
  | "us_business_inquiry"
  | "acquisition_inquiry"
  | "general_inquiry"
  | "investor_information"
  | "investor_materials"
  | "shop_lifesupply"
  | "browse_clinic_supplies"
  | "shop_wellmart"
  | "shop_clinics"
  | "shop_balkowitsch"
  | "medical_supply_stores"
  | "brand_lifesupply"
  | "brand_wellmart"
  | "brand_clinics"
  | "brand_balkowitsch"
  | "contact_directory";

export type ActionDestination =
  | { kind: "internal"; path: string }
  | { kind: "external"; url: string }
  | { kind: "mailto"; value: string; subject?: string }
  | { kind: "tel"; value: string };

export type InquiryIntent =
  | "clinic_development"
  | "equipment_quote"
  | "ongoing_procurement"
  | "metabolic_program"
  | "pharmacy"
  | "supplier"
  | "investor"
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
/**
 * A mail channel, optionally with the subject the visitor's mail
 * application opens with. The public surface is database-free and the proxy
 * blocks `/api/` on the public host, so there is no approved server-side
 * delivery: these routes are the inquiry mechanism rather than a
 * placeholder, and a subject line is what makes an arriving message
 * routable (website improvement program, 2026-09-09).
 */
const mail = (value: string, subject?: string): ActionDestination => ({
  kind: "mailto",
  value,
  subject,
});

export const ACTIONS: Record<ActionKey, ActionRecord> = {
  explore_businesses: {
    key: "explore_businesses",
    label: "Explore medical supply solutions",
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
    // Routed to the corporate office since 2026-09-08 (the prior named channel was withdrawn).
    destination: mail("info@lifesupply.com", "Clinic supply review"),
    ownerChannel: "Corporate office",
    verifiedAt: null,
  },
  clinic_equipment: {
    key: "clinic_equipment",
    label: "Equipment planning and quotes",
    intent: "navigation",
    destination: internal(sectionRoute(STAGE_3_ROUTES.clinicSolutions, "equipment")),
    ownerChannel: null,
    verifiedAt: null,
  },
  clinic_ongoing_supplies: {
    key: "clinic_ongoing_supplies",
    label: "Ongoing supplies",
    intent: "navigation",
    destination: internal(sectionRoute(STAGE_3_ROUTES.clinicSolutions, "ongoing-supplies")),
    ownerChannel: null,
    verifiedAt: null,
  },
  pharmacy_hub: {
    key: "pharmacy_hub",
    label: "Pharmacy Solutions",
    intent: "navigation",
    destination: internal(PHARMACY_ROUTES.hub),
    ownerChannel: null,
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
    destination: internal(sectionRoute(METABOLIC_ROUTES.hub, "pathways")),
    ownerChannel: null,
    verifiedAt: null,
  },
  refills_information: {
    key: "refills_information",
    label: "How refills work",
    intent: "navigation",
    destination: internal(sectionRoute(METABOLIC_ROUTES.hub, "replenishment")),
    ownerChannel: null,
    verifiedAt: null,
  },
  discuss_program: {
    key: "discuss_program",
    label: "Discuss a supply program",
    intent: "metabolic_program",
    destination: mail("info@lifesupply.com", "Metabolic-health supply program"),
    ownerChannel: null,
    verifiedAt: null,
  },
  pharmacy_program_inquiry: {
    key: "pharmacy_program_inquiry",
    label: "Discuss a pharmacy supply program",
    intent: "pharmacy",
    destination: mail("info@lifesupply.com", "Pharmacy supply program"),
    ownerChannel: null,
    verifiedAt: null,
  },
  /**
   * Replaces `partners_hub`: the Partners hub was retired on 2026-09-10 and
   * the enquiry routing it offered is what Contact does, with the destination
   * named on every choice.
   */
  business_inquiries: {
    key: "business_inquiries",
    label: "Start a business conversation",
    intent: "navigation",
    destination: internal(sectionRoute(LIFE_SUPPLY_ROUTES.contact, "business-inquiries")),
    ownerChannel: null,
    verifiedAt: null,
  },
  partner_clinics: {
    key: "partner_clinics",
    label: "Clinic collaboration",
    intent: "navigation",
    destination: internal(sectionRoute(STAGE_3_ROUTES.clinicSolutions, "collaboration")),
    ownerChannel: null,
    verifiedAt: null,
  },
  partner_pharmacies: {
    key: "partner_pharmacies",
    label: "Pharmacy supply programs",
    intent: "navigation",
    destination: internal(sectionRoute(PHARMACY_ROUTES.hub, "partner-program")),
    ownerChannel: null,
    verifiedAt: null,
  },
  clinic_collaboration: {
    key: "clinic_collaboration",
    label: "Discuss clinic collaboration",
    intent: "partner",
    destination: mail("info@lifesupply.com", "Clinic collaboration"),
    ownerChannel: "info@lifesupply.com",
    verifiedAt: null,
  },
  /**
   * Suppliers & Manufacturers keeps its page after losing its menu category
   * on 2026-09-10; this is how Medical Supplies reaches it.
   */
  supplier_page: {
    key: "supplier_page",
    label: "Supplier information",
    intent: "navigation",
    destination: internal(STAGE_5_ROUTES.partnerSuppliers),
    ownerChannel: null,
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
  news_resources: {
    key: "news_resources",
    label: "News & resources",
    intent: "navigation",
    destination: internal(LIFE_SUPPLY_ROUTES.news),
    ownerChannel: null,
    verifiedAt: null,
  },
  partner_inquiry: {
    key: "partner_inquiry",
    label: "Start a partner conversation",
    intent: "partner",
    destination: mail("info@lifesupply.com", "Partner inquiry"),
    ownerChannel: null,
    verifiedAt: null,
  },
  supplier_inquiry: {
    key: "supplier_inquiry",
    label: "Submit a supplier inquiry",
    intent: "supplier",
    destination: mail("info@lifesupply.com", "Supplier or distribution inquiry"),
    ownerChannel: null,
    verifiedAt: null,
  },
  us_business_inquiry: {
    key: "us_business_inquiry",
    label: "U.S. business inquiry",
    intent: "general",
    destination: mail("info@lifesupply.com", "United States business inquiry"),
    ownerChannel: null,
    verifiedAt: null,
  },
  acquisition_inquiry: {
    key: "acquisition_inquiry",
    label: "Acquisition or strategic inquiry",
    intent: "acquisition",
    destination: mail("abdul@lifesupply.com", "Acquisition or strategic inquiry"),
    ownerChannel: "Mergers & acquisitions",
    verifiedAt: null,
  },
  general_inquiry: {
    key: "general_inquiry",
    label: "General inquiry",
    intent: "general",
    destination: mail("info@lifesupply.com", "General inquiry"),
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
    destination: mail("invest@lifesupply.com", "Investor materials request"),
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
  browse_clinic_supplies: {
    key: "browse_clinic_supplies",
    label: "Browse clinic supplies",
    intent: "commerce",
    destination: external("https://lifesupply.ca/clinic-supplies/"),
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
  /**
   * Replaces the former `shop_services` action: Shop & Services merged into
   * the Medical Supplies stores section on 2026-09-10, so the action names
   * that section rather than a page of its own.
   */
  medical_supply_stores: {
    key: "medical_supply_stores",
    label: "Compare the stores",
    intent: "navigation",
    destination: internal(sectionRoute(LIFE_SUPPLY_ROUTES.operations, "stores")),
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
      return destination.subject
        ? `mailto:${destination.value}?subject=${encodeURIComponent(destination.subject)}`
        : `mailto:${destination.value}`;
    case "tel":
      return `tel:${destination.value.replace(/[^+\d]/g, "")}`;
  }
}

/** True when the action leaves this site (external URL, mail, or phone). */
export function isExternalAction(key: ActionKey): boolean {
  return ACTIONS[key].destination.kind !== "internal";
}

/**
 * What an action actually does, said plainly, so a visitor knows before
 * clicking whether a mail window opens or another site does (round four,
 * change 7). The contact page previously implied every route was an email
 * with a prepared subject, while two of the nine open a consultation page on
 * lifesupplyclinics.com.
 */
export function actionBehaviour(key: ActionKey): { label: string; address: string | null } {
  const destination = ACTIONS[key].destination;
  switch (destination.kind) {
    case "mailto":
      return { label: "Opens an email, subject prepared", address: destination.value };
    case "tel":
      return { label: "Calls this number", address: destination.value };
    case "external":
      return {
        label: `Opens ${new URL(destination.url).hostname.replace(/^www\./, "")}`,
        address: null,
      };
    case "internal":
      return { label: "Goes to a page on this site", address: null };
  }
}
