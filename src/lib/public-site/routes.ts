/**
 * Route registry — every public route the plan names, with the state it is
 * in today (ROUTE_AND_ACTION_MAP.md §3). Navigation is derived from this
 * table: only `live` routes reach a menu, so a planned page can be recorded
 * here without ever producing a dead link. Flipping a route to `live` is
 * what adds it, and its group, to the menus.
 *
 * `LIFE_SUPPLY_ROUTES` keeps the legacy-compatible paths the canaries and
 * the route files depend on. Trailing slashes are part of the contract.
 */
import type { OperatingBrandKey } from "@/lib/public-site/brands";
import { KIT_SLUGS } from "@/lib/public-site/content/metabolic";

export const LIFE_SUPPLY_ROUTES = {
  home: "/",
  about: "/about-us/",
  /** Medical Supply Solutions: the three online stores (renamed from Our Businesses, 2026-09-08). */
  operations: "/medical-supply-solutions/",
  /** The former hub address; a permanent redirect to `operations`. */
  legacyOperations: "/our-operations/",
  team: "/our-team/",
  investorRelations: "/investor-relations/",
  news: "/news/",
  contact: "/contact/",
  legacyContact: "/contact-2/",
  shop: "/shop/",
} as const;

/**
 * Brand pages. The three stores live under Medical Supply Solutions; the
 * LifeSupply Clinics brand is the Clinic Solutions section itself
 * (restructure of 2026-09-08, product owner).
 */
export const BRAND_ROUTES: Record<OperatingBrandKey, string> = {
  lifesupply: "/medical-supply-solutions/lifesupply/",
  wellmart: "/medical-supply-solutions/wellmart-medical/",
  clinics: "/clinic-solutions/",
  balkowitsch: "/medical-supply-solutions/balkowitsch/",
};

export const STAGE_3_ROUTES = {
  clinicSolutions: "/clinic-solutions/",
  equipment: "/clinic-solutions/equipment/",
  ongoingSupplies: "/clinic-solutions/ongoing-supplies/",
} as const;

/** Addresses withdrawn on 2026-09-08; each one permanently redirects (next.config.ts). */
export const WITHDRAWN_ROUTES = {
  operationsHub: "/our-operations/",
  operationsLifeSupply: "/our-operations/lifesupply/",
  operationsWellmart: "/our-operations/wellmart-medical/",
  operationsClinics: "/our-operations/lifesupply-clinics/",
  operationsBalkowitsch: "/our-operations/balkowitsch/",
  technology: "/our-operations/technology-fulfilment/",
  designBuild: "/clinic-solutions/design-build/",
} as const;

/** Stage 4 pages. Kit pages are a dynamic route; `kitRoute()` builds their paths. */
export const METABOLIC_ROUTES = {
  hub: "/metabolic-health/",
  careKits: "/metabolic-health/care-kits/",
  refills: "/metabolic-health/refills/",
} as const;

/** Pharmacy Solutions (2026-09-08): an information section with its status stated. */
export const PHARMACY_ROUTES = {
  hub: "/pharmacy-solutions/",
} as const;

export function kitRoute(slug: string): string {
  return `${METABOLIC_ROUTES.careKits}${slug}/`;
}

/** Stage 5 pages. News items and resources are dynamic routes with no approved record yet. */
export const STAGE_5_ROUTES = {
  partners: "/partners/",
  partnerClinics: "/partners/clinics/",
  partnerPharmacies: "/partners/pharmacies/",
  partnerSuppliers: "/partners/suppliers/",
  partnerAcquisitions: "/partners/acquisitions/",
  growthStrategy: "/investor-relations/growth-strategy/",
  advancedTherapeutics: "/investor-relations/advanced-therapeutics/",
  investorDocuments: "/investor-relations/documents/",
  shareholderServices: "/investor-relations/shareholder-services/",
  disclosures: "/investor-relations/disclosures/",
  privacy: "/privacy/",
  terms: "/terms/",
  accessibility: "/accessibility/",
} as const;

/** Retained legacy profile addresses: `/{slug}/`. */
export function profileRoute(slug: string): string {
  return `/${slug}/`;
}

export function newsItemRoute(slug: string): string {
  return `${LIFE_SUPPLY_ROUTES.news}${slug}/`;
}

export function resourceRoute(slug: string): string {
  return `/resources/${slug}/`;
}

export type NavGroupKey =
  | "businesses"
  | "clinic"
  | "metabolic"
  | "pharmacy"
  | "partners"
  | "investors"
  | "about"
  | "utility"
  | "legal";

export interface RouteRecord {
  path: string;
  label: string;
  /** Implementation stage that owns the page (guide §3). */
  stage: 2 | 3 | 4 | 5 | 6 | 7 | 9;
  status: "live" | "proposed" | "redirect";
  navGroup: NavGroupKey | null;
  /** For dynamic routes: the route file that serves the path (default: the static file for the path). */
  routeFile?: string;
}

export const ROUTES: readonly RouteRecord[] = [
  { path: "/", label: "Home", stage: 2, status: "live", navGroup: null },
  { path: "/about-us/", label: "About us", stage: 2, status: "live", navGroup: "about" },
  {
    path: LIFE_SUPPLY_ROUTES.operations,
    label: "Medical Supply Solutions",
    stage: 3,
    status: "live",
    navGroup: "businesses",
  },
  {
    path: BRAND_ROUTES.lifesupply,
    label: "LifeSupply",
    stage: 3,
    status: "live",
    navGroup: "businesses",
  },
  {
    path: BRAND_ROUTES.wellmart,
    label: "Wellmart Medical",
    stage: 3,
    status: "live",
    navGroup: "businesses",
  },
  {
    path: BRAND_ROUTES.balkowitsch,
    label: "Balkowitsch Worldwide",
    stage: 3,
    status: "live",
    navGroup: "businesses",
  },
  {
    path: STAGE_3_ROUTES.clinicSolutions,
    label: "Clinic Solutions",
    stage: 3,
    status: "live",
    navGroup: "clinic",
  },
  {
    path: STAGE_3_ROUTES.equipment,
    label: "Equipment",
    stage: 3,
    status: "live",
    navGroup: "clinic",
  },
  {
    path: STAGE_3_ROUTES.ongoingSupplies,
    label: "Ongoing supplies",
    stage: 3,
    status: "live",
    navGroup: "clinic",
  },
  {
    path: METABOLIC_ROUTES.hub,
    label: "Metabolic Health",
    stage: 4,
    status: "live",
    navGroup: "metabolic",
  },
  {
    path: METABOLIC_ROUTES.careKits,
    label: "Care kits",
    stage: 4,
    status: "live",
    navGroup: "metabolic",
  },
  ...KIT_SLUGS.map(
    (slug): RouteRecord => ({
      path: kitRoute(slug),
      label: slug,
      stage: 4,
      status: "live",
      navGroup: null,
      routeFile: "src/app/metabolic-health/care-kits/[kit]/page.tsx",
    }),
  ),
  {
    path: METABOLIC_ROUTES.refills,
    label: "Refills",
    stage: 4,
    status: "live",
    navGroup: "metabolic",
  },
  {
    path: PHARMACY_ROUTES.hub,
    label: "Pharmacy Solutions",
    stage: 5,
    status: "live",
    navGroup: "pharmacy",
  },
  { path: "/partners/", label: "Partners", stage: 5, status: "live", navGroup: "partners" },
  {
    path: "/partners/clinics/",
    label: "Clinics",
    stage: 5,
    status: "live",
    navGroup: "partners",
  },
  {
    path: "/partners/pharmacies/",
    label: "Pharmacies",
    stage: 5,
    status: "live",
    navGroup: "partners",
  },
  {
    path: "/partners/suppliers/",
    label: "Suppliers",
    stage: 5,
    status: "live",
    navGroup: "partners",
  },
  {
    path: "/partners/acquisitions/",
    label: "Acquisitions",
    stage: 5,
    status: "live",
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
    status: "live",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/advanced-therapeutics/",
    label: "Advanced therapeutics",
    stage: 5,
    status: "live",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/documents/",
    label: "Documents",
    stage: 5,
    status: "live",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/shareholder-services/",
    label: "Shareholder services",
    stage: 5,
    status: "live",
    navGroup: "investors",
  },
  {
    path: "/investor-relations/disclosures/",
    label: "Disclosures",
    stage: 5,
    status: "live",
    navGroup: "investors",
  },
  { path: "/our-team/", label: "Our team", stage: 5, status: "live", navGroup: "about" },
  { path: "/news/", label: "News & resources", stage: 5, status: "live", navGroup: "about" },
  { path: "/shop/", label: "Shop & Services", stage: 3, status: "live", navGroup: "utility" },
  { path: "/contact/", label: "Contact", stage: 3, status: "live", navGroup: "utility" },
  { path: "/contact-2/", label: "Contact (legacy)", stage: 9, status: "redirect", navGroup: null },
  // Restructure of 2026-09-08 (product owner): Our Businesses became Medical
  // Supply Solutions, the Clinics brand page merged into Clinic Solutions,
  // Design & build merged into the Clinic Solutions hub, and Technology &
  // fulfilment was withdrawn. Every old address redirects (next.config.ts).
  ...Object.values(WITHDRAWN_ROUTES).map(
    (path): RouteRecord => ({
      path,
      label: "Withdrawn address (redirect)",
      stage: 3,
      status: "redirect",
      navGroup: null,
    }),
  ),
  { path: "/privacy/", label: "Privacy", stage: 5, status: "live", navGroup: "legal" },
  { path: "/terms/", label: "Terms of use", stage: 5, status: "live", navGroup: "legal" },
  { path: "/accessibility/", label: "Accessibility", stage: 5, status: "live", navGroup: "legal" },
  // Stage 6: served on demand from the published read model; a slug that is not published is a 404.
  {
    path: "/news/[slug]/",
    label: "News item",
    stage: 6,
    status: "live",
    navGroup: null,
    routeFile: "src/app/news/[slug]/page.tsx",
  },
  {
    path: "/resources/[slug]/",
    label: "Resource",
    stage: 6,
    status: "live",
    navGroup: null,
    routeFile: "src/app/resources/[slug]/page.tsx",
  },
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
 * Primary navigation contract (guide §3, restructured 2026-09-08): Medical
 * Supply Solutions / Clinic Solutions / Metabolic Health / Partners /
 * Investors / About. A group appears only when its hub route is live; a
 * child appears only when it is a live route. The three stores have their
 * own pages under Medical Supply Solutions, so the store links themselves
 * live on those pages and in the footer; LifeSupply Clinics is the Clinic
 * Solutions section.
 */
const PRIMARY_GROUPS: { key: NavGroupKey; label: string; hub: string }[] = [
  { key: "businesses", label: "Medical Supply Solutions", hub: LIFE_SUPPLY_ROUTES.operations },
  { key: "clinic", label: "Clinic Solutions", hub: STAGE_3_ROUTES.clinicSolutions },
  { key: "metabolic", label: "Metabolic Health", hub: METABOLIC_ROUTES.hub },
  { key: "pharmacy", label: "Pharmacy Solutions", hub: PHARMACY_ROUTES.hub },
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
    links: liveChildren(group.key, group.hub),
  }));
}

/** Utility links: Shop & Services and Contact. The login is rendered by CommandCenterLoginLink. */
export function buildUtilityNavigation(): NavLink[] {
  return LIVE_ROUTES.filter((route) => route.navGroup === "utility").map((route) => ({
    label: route.label,
    href: route.path,
  }));
}

/** Policy links for the footer: privacy, terms, accessibility, once each page is live. */
export function buildLegalNavigation(): NavLink[] {
  return LIVE_ROUTES.filter((route) => route.navGroup === "legal").map((route) => ({
    label: route.label,
    href: route.path,
  }));
}

/**
 * Flat list of the top-level live pages for the footer "Explore" column and
 * for tests: hub pages and the About-group pages, not every child.
 */
export const LIFE_SUPPLY_NAVIGATION: readonly NavLink[] = LIVE_ROUTES.filter(
  (route) =>
    route.navGroup !== null &&
    route.navGroup !== "utility" &&
    (PRIMARY_GROUPS.some((group) => group.hub === route.path) || route.navGroup === "about"),
).map((route) => ({ label: route.label, href: route.path }));
