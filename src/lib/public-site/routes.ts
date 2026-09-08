/**
 * Route registry — every public route the plan names, with the state it is
 * in today (ROUTE_AND_ACTION_MAP.md §3). Navigation is derived from this
 * table: only `live` routes reach a menu, so a planned page can be recorded
 * here without ever producing a dead link.
 *
 * `LIFE_SUPPLY_ROUTES` keeps the legacy-compatible paths the canaries and
 * the route files depend on. Trailing slashes are part of the contract.
 */
import { OPERATING_BRANDS } from "@/lib/public-site/brands";

export const LIFE_SUPPLY_ROUTES = {
  home: "/",
  about: "/about-us/",
  operations: "/our-operations/",
  team: "/our-team/",
  investorRelations: "/investor-relations/",
  news: "/news/",
  contact: "/contact/",
  legacyContact: "/contact-2/",
  shop: "/shop/",
} as const;

export type NavGroupKey =
  | "businesses"
  | "clinic"
  | "metabolic"
  | "partners"
  | "investors"
  | "about"
  | "utility";

export interface RouteRecord {
  path: string;
  label: string;
  /** Implementation stage that owns the page (guide §3). */
  stage: 2 | 3 | 4 | 5 | 6 | 7 | 9;
  status: "live" | "proposed" | "redirect";
  navGroup: NavGroupKey | null;
}

export const ROUTES: readonly RouteRecord[] = [
  { path: "/", label: "Home", stage: 2, status: "live", navGroup: null },
  { path: "/about-us/", label: "About us", stage: 2, status: "live", navGroup: "about" },
  {
    path: "/our-operations/",
    label: "Our operations",
    stage: 3,
    status: "live",
    navGroup: "businesses",
  },
  {
    path: "/our-operations/lifesupply/",
    label: "LifeSupply",
    stage: 3,
    status: "proposed",
    navGroup: "businesses",
  },
  {
    path: "/our-operations/wellmart-medical/",
    label: "Wellmart Medical",
    stage: 3,
    status: "proposed",
    navGroup: "businesses",
  },
  {
    path: "/our-operations/lifesupply-clinics/",
    label: "LifeSupply Clinics",
    stage: 3,
    status: "proposed",
    navGroup: "businesses",
  },
  {
    path: "/our-operations/balkowitsch/",
    label: "Balkowitsch Worldwide",
    stage: 3,
    status: "proposed",
    navGroup: "businesses",
  },
  {
    path: "/our-operations/technology-fulfilment/",
    label: "Technology & fulfilment",
    stage: 3,
    status: "proposed",
    navGroup: "businesses",
  },
  {
    path: "/clinic-solutions/",
    label: "Clinic Solutions",
    stage: 3,
    status: "proposed",
    navGroup: "clinic",
  },
  {
    path: "/clinic-solutions/design-build/",
    label: "Design & build",
    stage: 3,
    status: "proposed",
    navGroup: "clinic",
  },
  {
    path: "/clinic-solutions/equipment/",
    label: "Equipment",
    stage: 3,
    status: "proposed",
    navGroup: "clinic",
  },
  {
    path: "/clinic-solutions/ongoing-supplies/",
    label: "Ongoing supplies",
    stage: 3,
    status: "proposed",
    navGroup: "clinic",
  },
  {
    path: "/metabolic-health/",
    label: "Metabolic Health",
    stage: 4,
    status: "proposed",
    navGroup: "metabolic",
  },
  {
    path: "/metabolic-health/care-kits/",
    label: "Care kits",
    stage: 4,
    status: "proposed",
    navGroup: "metabolic",
  },
  {
    path: "/metabolic-health/refills/",
    label: "Refills",
    stage: 4,
    status: "proposed",
    navGroup: "metabolic",
  },
  { path: "/partners/", label: "Partners", stage: 5, status: "proposed", navGroup: "partners" },
  {
    path: "/partners/clinics/",
    label: "Clinics",
    stage: 5,
    status: "proposed",
    navGroup: "partners",
  },
  {
    path: "/partners/pharmacies/",
    label: "Pharmacies",
    stage: 5,
    status: "proposed",
    navGroup: "partners",
  },
  {
    path: "/partners/suppliers/",
    label: "Suppliers",
    stage: 5,
    status: "proposed",
    navGroup: "partners",
  },
  {
    path: "/partners/acquisitions/",
    label: "Acquisitions",
    stage: 5,
    status: "proposed",
    navGroup: "partners",
  },
  {
    path: "/investor-relations/",
    label: "Investor relations",
    stage: 5,
    status: "live",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/growth-strategy/",
    label: "Growth strategy",
    stage: 5,
    status: "proposed",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/advanced-therapeutics/",
    label: "Advanced therapeutics",
    stage: 5,
    status: "proposed",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/documents/",
    label: "Documents",
    stage: 5,
    status: "proposed",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/shareholder-services/",
    label: "Shareholder services",
    stage: 5,
    status: "proposed",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/disclosures/",
    label: "Disclosures",
    stage: 5,
    status: "proposed",
    navGroup: "investors",
  },
  { path: "/our-team/", label: "Our team", stage: 5, status: "live", navGroup: "about" },
  { path: "/news/", label: "News & resources", stage: 5, status: "live", navGroup: "about" },
  { path: "/shop/", label: "Shop & Services", stage: 3, status: "live", navGroup: "utility" },
  { path: "/contact/", label: "Contact", stage: 3, status: "live", navGroup: "utility" },
  { path: "/contact-2/", label: "Contact (legacy)", stage: 9, status: "redirect", navGroup: null },
  { path: "/privacy/", label: "Privacy", stage: 5, status: "proposed", navGroup: null },
  { path: "/terms/", label: "Terms", stage: 5, status: "proposed", navGroup: null },
  { path: "/accessibility/", label: "Accessibility", stage: 5, status: "proposed", navGroup: null },
];

export const LIVE_ROUTES: readonly RouteRecord[] = ROUTES.filter(
  (route) => route.status === "live",
);

export function isLiveRoute(path: string): boolean {
  return LIVE_ROUTES.some((route) => route.path === path);
}

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface NavGroup {
  key: NavGroupKey;
  label: string;
  /** The group's own live destination; the trigger link. */
  href: string;
  /** Further destinations, excluding the trigger's own href. */
  links: NavLink[];
}

/**
 * Primary navigation contract (guide §3): Our Businesses / Clinic Solutions /
 * Metabolic Health / Partners / Investors / About. A group appears only when
 * its hub route is live; a child appears only when it is a live route or a
 * verified brand destination. Today that yields three groups.
 */
const PRIMARY_GROUPS: { key: NavGroupKey; label: string; hub: string; brandLinks?: boolean }[] = [
  { key: "businesses", label: "Our Businesses", hub: "/our-operations/", brandLinks: true },
  { key: "clinic", label: "Clinic Solutions", hub: "/clinic-solutions/" },
  { key: "metabolic", label: "Metabolic Health", hub: "/metabolic-health/" },
  { key: "partners", label: "Partners", hub: "/partners/" },
  { key: "investors", label: "Investors", hub: "/investor-relations/" },
  { key: "about", label: "About", hub: "/about-us/" },
];

function liveChildren(group: NavGroupKey, hub: string): NavLink[] {
  return LIVE_ROUTES.filter((route) => route.navGroup === group && route.path !== hub).map(
    (route) => ({ label: route.label, href: route.path }),
  );
}

export function buildPrimaryNavigation(): NavGroup[] {
  return PRIMARY_GROUPS.filter((group) => isLiveRoute(group.hub)).map((group) => ({
    key: group.key,
    label: group.label,
    href: group.hub,
    links: [
      ...liveChildren(group.key, group.hub),
      ...(group.brandLinks
        ? OPERATING_BRANDS.map((record) => ({
            label: record.name,
            href: record.canonicalUrl,
            external: true,
          }))
        : []),
    ],
  }));
}

/** Utility links: Shop & Services and Contact. The login is rendered by CommandCenterLoginLink. */
export function buildUtilityNavigation(): NavLink[] {
  return LIVE_ROUTES.filter((route) => route.navGroup === "utility").map((route) => ({
    label: route.label,
    href: route.path,
  }));
}

/**
 * Flat list of every live internal route that appears in a menu, for the
 * footer "Explore" column and for tests. Derived, never hand-maintained.
 */
export const LIFE_SUPPLY_NAVIGATION: readonly NavLink[] = LIVE_ROUTES.filter(
  (route) => route.navGroup !== null && route.navGroup !== "utility",
).map((route) => ({ label: route.label, href: route.path }));
