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
import { LIFE_SUPPLY_ROUTES } from "@/lib/public-site/routes";

export type ActionKey =
  | "explore_businesses"
  | "about_group"
  | "plan_clinic"
  | "equipment_quote"
  | "clinic_supply_review"
  | "discuss_program"
  | "partner_inquiry"
  | "investor_information"
  | "investor_materials"
  | "shop_lifesupply"
  | "shop_wellmart"
  | "shop_clinics"
  | "shop_balkowitsch"
  | "contact_directory";

export type ActionDestination =
  | { kind: "internal"; path: string }
  | { kind: "external"; url: string }
  | { kind: "mailto"; value: string }
  | { kind: "tel"; value: string };

export interface ActionRecord {
  key: ActionKey;
  label: string;
  intent:
    | "navigation"
    | "commerce"
    | "clinic_development"
    | "equipment_quote"
    | "ongoing_procurement"
    | "metabolic_program"
    | "partner"
    | "investor";
  destination: ActionDestination;
  /** Approved directory channel that owns the follow-up, once WEB-07 assigns one. */
  ownerChannel: string | null;
  /** ISO date the external destination last returned HTTP 200; `null` for internal paths. */
  verifiedAt: string | null;
}

export const ACTIONS: Record<ActionKey, ActionRecord> = {
  explore_businesses: {
    key: "explore_businesses",
    label: "Explore our businesses",
    intent: "navigation",
    destination: { kind: "internal", path: LIFE_SUPPLY_ROUTES.operations },
    ownerChannel: null,
    verifiedAt: null,
  },
  about_group: {
    key: "about_group",
    label: "About LifeSupply",
    intent: "navigation",
    destination: { kind: "internal", path: LIFE_SUPPLY_ROUTES.about },
    ownerChannel: null,
    verifiedAt: null,
  },
  plan_clinic: {
    key: "plan_clinic",
    label: "Book a consultation",
    intent: "clinic_development",
    // The Clinics site's own consultation page (S-73).
    destination: { kind: "external", url: "https://www.lifesupplyclinics.com/contact-us/" },
    ownerChannel: "info@lifesupplyclinics.com",
    verifiedAt: "2026-09-08",
  },
  equipment_quote: {
    key: "equipment_quote",
    label: "Request an equipment quote",
    intent: "equipment_quote",
    // The Clinics site's own quote page (S-73).
    destination: {
      kind: "external",
      url: "https://www.lifesupplyclinics.com/buy-clinic-equipment/",
    },
    ownerChannel: "info@lifesupplyclinics.com",
    verifiedAt: "2026-09-08",
  },
  clinic_supply_review: {
    key: "clinic_supply_review",
    label: "Request a supply review",
    intent: "ongoing_procurement",
    destination: { kind: "mailto", value: "ben@lifesupply.com" },
    ownerChannel: "Online sales & product lines",
    verifiedAt: null,
  },
  discuss_program: {
    key: "discuss_program",
    label: "Discuss a supply program",
    intent: "metabolic_program",
    destination: { kind: "mailto", value: "info@lifesupply.com" },
    ownerChannel: null,
    verifiedAt: null,
  },
  partner_inquiry: {
    key: "partner_inquiry",
    label: "Start a partner conversation",
    intent: "partner",
    destination: { kind: "mailto", value: "info@lifesupply.com" },
    ownerChannel: null,
    verifiedAt: null,
  },
  investor_information: {
    key: "investor_information",
    label: "Investor relations",
    intent: "investor",
    destination: { kind: "internal", path: LIFE_SUPPLY_ROUTES.investorRelations },
    ownerChannel: "Investor relations",
    verifiedAt: null,
  },
  investor_materials: {
    key: "investor_materials",
    label: "Request investor materials",
    intent: "investor",
    destination: { kind: "mailto", value: "invest@lifesupply.com" },
    ownerChannel: "Investor relations",
    verifiedAt: null,
  },
  shop_lifesupply: {
    key: "shop_lifesupply",
    label: "Shop LifeSupply",
    intent: "commerce",
    destination: { kind: "external", url: getBrand("lifesupply").canonicalUrl },
    ownerChannel: null,
    verifiedAt: "2026-09-08",
  },
  shop_wellmart: {
    key: "shop_wellmart",
    label: "Shop Wellmart Medical",
    intent: "commerce",
    destination: { kind: "external", url: getBrand("wellmart").canonicalUrl },
    ownerChannel: null,
    verifiedAt: "2026-09-08",
  },
  shop_clinics: {
    key: "shop_clinics",
    label: "Visit LifeSupply Clinics",
    intent: "clinic_development",
    destination: { kind: "external", url: getBrand("clinics").canonicalUrl },
    ownerChannel: null,
    verifiedAt: "2026-09-08",
  },
  shop_balkowitsch: {
    key: "shop_balkowitsch",
    label: "Shop Balkowitsch Worldwide",
    intent: "commerce",
    destination: { kind: "external", url: getBrand("balkowitsch").canonicalUrl },
    ownerChannel: null,
    verifiedAt: "2026-09-08",
  },
  contact_directory: {
    key: "contact_directory",
    label: "Contact",
    intent: "navigation",
    destination: { kind: "internal", path: LIFE_SUPPLY_ROUTES.contact },
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
