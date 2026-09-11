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
} as const;

/**
 * Metabolic Health. The care-kits hub, its eight pathway pages and refills
 * became sections of the hub on 2026-09-10 (website consolidation, stage 2),
 * so only the hub remains a route.
 */
export const METABOLIC_ROUTES = {
  hub: "/metabolic-health/",
} as const;

/** Pharmacy Solutions (2026-09-08): an information section with its status stated. */
export const PHARMACY_ROUTES = {
  hub: "/pharmacy-solutions/",
} as const;

/** The retired address of one pathway page, for the redirect map and tests. */
export function kitRoute(slug: string): string {
  return `${CONSOLIDATED_ROUTES.careKits}${slug}/`;
}

/**
 * Addresses retired by the website consolidation (stage 1, 2026-09-10).
 * Their content was moved first; each address then became a permanent
 * redirect to the section that now carries it (next.config.ts, and
 * docs/website-consolidation/REDIRECTS.md for the reasoning). They stay in
 * the registry as `redirect` rows so the sitemap and the menus keep being
 * derived rather than hand-maintained.
 */
export const CONSOLIDATED_ROUTES = {
  shop: "/shop/",
  equipment: "/clinic-solutions/equipment/",
  ongoingSupplies: "/clinic-solutions/ongoing-supplies/",
  partnerClinics: "/partners/clinics/",
  // Stage 2 (2026-09-10): the pharmacy partner page, the care-kits hub, its
  // eight pathway pages and refills. Each pathway keeps the anchor its slug
  // used, so an old pathway address lands on the same material.
  partnerPharmacies: "/partners/pharmacies/",
  careKits: "/metabolic-health/care-kits/",
  refills: "/metabolic-health/refills/",
  // Stage 3 (2026-09-10): Partners stopped being a primary category, and its
  // hub went with it. The hub only routed by relationship; two of its four
  // relationships had already become sections of the pages that carried their
  // subject, and the enquiry routing it offered is what Contact does. Its
  // two remaining children stay live at their own addresses.
  partners: "/partners/",
} as const;

/**
 * The section anchors a consolidated page publishes, by page.
 *
 * A consolidated page absorbs what used to be several addresses, so an
 * internal link now often has to name a section rather than a page. Listing
 * the anchors here is what makes that checkable: `isLiveSection()` refuses a
 * fragment that no page declares, so a link can never point at a section
 * that was renamed or never built. The page component takes its anchors from
 * this same table, so the two cannot drift.
 */
export const SECTION_ANCHORS: Readonly<Record<string, readonly string[]>> = {
  [LIFE_SUPPLY_ROUTES.operations]: ["stores"],
  [STAGE_3_ROUTES.clinicSolutions]: ["planning", "equipment", "ongoing-supplies", "collaboration"],
  [PHARMACY_ROUTES.hub]: ["partner-program"],
  // The eight pathway anchors are the eight slugs, so a retired pathway
  // address and its anchor can never drift apart.
  [METABOLIC_ROUTES.hub]: ["pathways", ...KIT_SLUGS, "replenishment", "collaboration"],
  [LIFE_SUPPLY_ROUTES.contact]: ["business-inquiries"],
};

/** `"/clinic-solutions/" + "equipment"` → `"/clinic-solutions/#equipment"`. */
export function sectionRoute(path: string, anchor: string): string {
  return `${path}#${anchor}`;
}

/** Splits an internal href into its page path and its anchor, if it has one. */
export function splitSection(href: string): { path: string; anchor: string | null } {
  const hash = href.indexOf("#");
  return hash === -1
    ? { path: href, anchor: null }
    : { path: href.slice(0, hash), anchor: href.slice(hash + 1) };
}

/**
 * True when an internal href resolves: its page is live, and where it names
 * an anchor, that page declares it.
 */
export function isLiveSection(href: string): boolean {
  const { path, anchor } = splitSection(href);
  if (!isLiveRoute(path)) return false;
  return anchor === null || (SECTION_ANCHORS[path]?.includes(anchor) ?? false);
}

/** Addresses withdrawn on 2026-09-08; each one permanently redirects (next.config.ts). */
export const WITHDRAWN_ROUTES = {
  operationsHub: "/our-operations/",
  operationsLifeSupply: "/our-operations/lifesupply/",
  operationsWellmart: "/our-operations/wellmart-medical/",
  operationsClinics: "/our-operations/lifesupply-clinics/",
  operationsBalkowitsch: "/our-operations/balkowitsch/",
  technology: "/our-operations/technology-fulfilment/",
  designBuild: "/clinic-solutions/design-build/",
  // 2026-09-09 (product owner): the investor documents index merged into
  // News & resources, and Shareholder services withdrawn.
  investorDocuments: "/investor-relations/documents/",
  shareholderServices: "/investor-relations/shareholder-services/",
} as const;

/** Stage 5 pages. News items and resources are dynamic routes with no approved record yet. */
export const STAGE_5_ROUTES = {
  partnerSuppliers: "/partners/suppliers/",
  partnerAcquisitions: "/partners/acquisitions/",
  growthStrategy: "/investor-relations/growth-strategy/",
  advancedTherapeutics: "/investor-relations/advanced-therapeutics/",
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

export type NavGroupKey = "businesses" | "solutions" | "investors" | "about" | "utility" | "legal";

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
    label: "Medical Supplies",
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
    navGroup: "solutions",
  },
  {
    path: PHARMACY_ROUTES.hub,
    label: "Pharmacy Solutions",
    stage: 5,
    status: "live",
    navGroup: "solutions",
  },
  {
    path: METABOLIC_ROUTES.hub,
    // Displayed as "Metabolic Health Solutions" in the Solutions menu, which
    // is where the owner's architecture names it.
    label: "Metabolic Health Solutions",
    stage: 4,
    status: "live",
    navGroup: "solutions",
  },
  {
    // Suppliers & Manufacturers keeps its page and loses its category: it is
    // linked from Medical Supplies and the footer rather than from a menu.
    path: "/partners/suppliers/",
    label: "Suppliers & Manufacturers",
    stage: 5,
    status: "live",
    navGroup: null,
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
  // News & resources sits in the Investors group since 2026-09-09, where the
  // documents index used to be; it keeps its legacy address.
  { path: "/news/", label: "News & resources", stage: 5, status: "live", navGroup: "investors" },
  {
    path: "/investor-relations/disclosures/",
    label: "Disclosures",
    stage: 5,
    status: "live",
    navGroup: "investors",
  },
  {
    // Acquisitions moved into the Investors group, where the reader who wants
    // it already is.
    path: "/partners/acquisitions/",
    label: "Acquisitions & Strategic Transactions",
    stage: 5,
    status: "live",
    navGroup: "investors",
  },
  { path: "/our-team/", label: "Our team", stage: 5, status: "live", navGroup: "about" },
  // Contact is the last primary item since 2026-09-10; it is added by
  // `buildPrimaryNavigation()` rather than derived from a group.
  { path: "/contact/", label: "Contact", stage: 3, status: "live", navGroup: null },
  { path: "/contact-2/", label: "Contact (legacy)", stage: 9, status: "redirect", navGroup: null },
  // Website consolidation, stage 1 (2026-09-10): Shop & Services merged into
  // the Medical Supplies stores section; Equipment, Ongoing supplies and the
  // Partners clinic page merged into Clinic Solutions as sections.
  ...[...Object.values(CONSOLIDATED_ROUTES), ...KIT_SLUGS.map(kitRoute)].map(
    (path): RouteRecord => ({
      path,
      label: "Consolidated address (redirect)",
      stage: 3,
      status: "redirect",
      navGroup: null,
    }),
  ),
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
  /**
   * The group's own live destination, or `null` when the group is a menu
   * with no page behind it.
   *
   * Solutions is the only such group (2026-09-10). The owner's instruction
   * creates no `/solutions` landing page, because a page listing three links
   * to three pages is a step, not a destination. Its trigger is therefore a
   * button that opens the menu rather than a link that goes somewhere.
   */
  href: string | null;
  /** Further destinations, excluding the trigger's own href. */
  links: NavLink[];
}

/**
 * Primary navigation, as the owner set it on 2026-09-10:
 *
 *   About | Medical Supplies | Solutions | Investors | Contact
 *
 * Five items. Clinic, Pharmacy and Metabolic stopped being top-level
 * categories and became the three entries under Solutions; Partners was
 * retired as a category and its hub with it. Contact is last, a direct link,
 * with no dropdown — so it leaves the utility strip, where it was a duplicate.
 *
 * The logo still links Home, which is why Home is no longer a menu item: two
 * controls in the same header going to the same place is one too many.
 *
 * A group appears only when its hub route is live, or, for a group with no
 * hub, when it has at least one live child. A child appears only when it is a
 * live route, so a planned page can sit in the registry without producing a
 * dead link.
 */
const PRIMARY_GROUPS: { key: NavGroupKey; label: string; hub: string | null }[] = [
  { key: "about", label: "About", hub: "/about-us/" },
  { key: "businesses", label: "Medical Supplies", hub: LIFE_SUPPLY_ROUTES.operations },
  // No `/solutions` page exists; this is a menu only.
  { key: "solutions", label: "Solutions", hub: null },
  { key: "investors", label: "Investors", hub: "/investor-relations/" },
];

function liveChildren(group: NavGroupKey, hub: string | null): NavLink[] {
  return LIVE_ROUTES.filter((route) => route.navGroup === group && route.path !== hub).map(
    (route) => ({ label: route.label, href: route.path }),
  );
}

/**
 * The five primary items. Contact is appended rather than declared as a
 * group, because it is a direct link with no dropdown and no children — the
 * group shape would only invite one to be added later.
 */
export function buildPrimaryNavigation(): NavGroup[] {
  const groups = PRIMARY_GROUPS.filter((group) =>
    group.hub === null ? liveChildren(group.key, null).length > 0 : isLiveRoute(group.hub),
  ).map((group) => ({
    key: group.key,
    label: group.label,
    href: group.hub,
    links: liveChildren(group.key, group.hub),
  }));
  if (!isLiveRoute(LIFE_SUPPLY_ROUTES.contact)) return groups;
  return [
    ...groups,
    {
      key: "utility" as NavGroupKey,
      label: "Contact",
      href: LIFE_SUPPLY_ROUTES.contact,
      links: [],
    },
  ];
}

/**
 * Utility links beside the primary menu. One since 2026-09-10: Shop Stores,
 * which jumps to the stores section of Medical Supplies. Contact left the
 * strip when it became the last primary item, where it was a duplicate of
 * the same destination. The login is rendered by `CommandCenterLoginLink`.
 */
export function buildUtilityNavigation(): NavLink[] {
  return [{ label: "Shop Stores", href: sectionRoute(LIFE_SUPPLY_ROUTES.operations, "stores") }];
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
    PRIMARY_GROUPS.some((group) => group.hub !== null && group.hub === route.path) ||
    route.navGroup === "about" ||
    route.navGroup === "solutions" ||
    // Top-level pages that are no longer in a menu but must stay reachable:
    // the suppliers page, Contact, and the legacy news address.
    route.path === "/partners/suppliers/" ||
    route.path === LIFE_SUPPLY_ROUTES.contact ||
    route.path === LIFE_SUPPLY_ROUTES.news,
).map((route) => ({ label: route.label, href: route.path }));
