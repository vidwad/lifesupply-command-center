/**
 * What the public host may serve (Stage 9, D-03 and D-12).
 *
 * The proxy used to block a short list of internal prefixes on the public
 * host and let everything else fall through to the authentication wrapper,
 * so `/customers` on the public host ended in a redirect to `/login`, which
 * was itself blocked (D-03), and the wrapper set Auth.js cookies on every
 * public page (D-12). This module is the allowlist that replaces that: a
 * request on the public host is either a public path, an internal family
 * that is sent home, or an unknown path that is left to 404.
 *
 * The public paths derive from the same registries the pages and the
 * sitemap use, so a new public route becomes reachable by being registered
 * live, not by editing the proxy. The internal families are the dashboard
 * route groups; a test asserts the list matches `src/app/(dashboard)`.
 */
import { team } from "@/lib/public-site/content/team";
import { ROUTES } from "@/lib/public-site/routes";

/** Top-level segments of every public route, live or redirect, from the registry. */
export const PUBLIC_TOP_LEVEL_SEGMENTS: readonly string[] = Array.from(
  new Set(
    ROUTES.filter((route) => route.status !== "proposed")
      .map((route) => route.path.split("/").filter(Boolean)[0])
      .filter((segment): segment is string => Boolean(segment)),
  ),
);

/** The retained profile address, plus the withdrawn ones that redirect to the team page. */
export const PUBLIC_PROFILE_SLUGS: readonly string[] = [
  ...team.legacyProfiles.map((profile) => profile.slug),
  ...team.withdrawnProfileSlugs,
];

/** Dashboard and auth route families; must match `src/app/(dashboard)` and `(auth)`. */
export const INTERNAL_TOP_LEVEL_SEGMENTS: readonly string[] = [
  "admin",
  "ai-analyst",
  "analytics",
  "approvals",
  "automation",
  "customers",
  "dashboard",
  "financials",
  "investors",
  "marketing",
  "operations",
  "opportunities",
  "orders",
  "products",
  "public-web",
  "public-web-preview",
  "reports",
  "suppliers",
  "tasks",
  "login",
  "forgot-password",
];

function firstSegment(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

/** True for the public API and health endpoints; every other `/api/*` path is internal. */
export function isPublicApiPath(pathname: string) {
  return pathname === "/api/health" || pathname.startsWith("/api/public/");
}

/** A page the public host serves: home, a registered public family, or a retained profile. */
export function isPublicPagePath(pathname: string) {
  if (pathname === "/") return true;
  const segment = firstSegment(pathname);
  if (PUBLIC_TOP_LEVEL_SEGMENTS.includes(segment)) return true;
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 1 && PUBLIC_PROFILE_SLUGS.includes(segment);
}

/** An internal family that must never be reachable on the public host. */
export function isInternalPath(pathname: string) {
  if (pathname.startsWith("/api/")) return !isPublicApiPath(pathname);
  return INTERNAL_TOP_LEVEL_SEGMENTS.includes(firstSegment(pathname));
}
