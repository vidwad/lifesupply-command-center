/**
 * Store home-page screens for the Medical Supply Solutions pages and the
 * Clinics site's home page for Clinic Solutions.
 *
 * Unlike the conceptual graphics (graphics.ts), these are real: a screenshot
 * of each store's live home page, captured at 1440×900 and composed onto a
 * laptop frame so the "On this site" block shows the actual destination.
 * They are dated, because a storefront changes; refresh them by re-running
 * the capture and updating `capturedOn`. Overlays such as coupon pop-ups
 * were hidden before capture so the page itself is what shows.
 */
import type { OperatingBrandKey } from "@/lib/public-site/brands";

export interface SiteScreen {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** ISO date of the capture. */
  capturedOn: string;
  /** The store host the screen shows. */
  host: string;
  provenance: string;
}

const PROVENANCE =
  "Screenshot of the store's live home page at 1440×900 (Chromium, promotional overlays hidden), composed onto a laptop frame at 1600×1000; captured 2026-09-09 for the Medical Supply Solutions and Clinic Solutions pages. A real screen, not a conceptual image.";

export const SITE_SCREENS = {
  lifesupply: {
    src: "/lsh/sites/lifesupply-home-laptop.jpg",
    alt: "The lifesupply.ca home page shown on a laptop screen.",
    width: 1600,
    height: 1000,
    capturedOn: "2026-09-09",
    host: "lifesupply.ca",
    provenance: PROVENANCE,
  },
  wellmart: {
    src: "/lsh/sites/wellmart-medical-home-laptop.jpg",
    alt: "The wellmartmedical.com home page shown on a laptop screen.",
    width: 1600,
    height: 1000,
    capturedOn: "2026-09-09",
    host: "wellmartmedical.com",
    provenance: PROVENANCE,
  },
  balkowitsch: {
    src: "/lsh/sites/balkowitsch-home-laptop.jpg",
    alt: "The balkowitsch.com home page shown on a laptop screen.",
    width: 1600,
    height: 1000,
    capturedOn: "2026-09-09",
    host: "balkowitsch.com",
    provenance: PROVENANCE,
  },
  clinics: {
    src: "/lsh/sites/lifesupply-clinics-home-laptop.jpg",
    alt: "The lifesupplyclinics.com home page shown on a laptop screen.",
    width: 1600,
    height: 1000,
    capturedOn: "2026-09-09",
    host: "lifesupplyclinics.com",
    provenance: PROVENANCE,
  },
} as const satisfies Record<OperatingBrandKey, SiteScreen>;

export type SiteScreenKey = keyof typeof SITE_SCREENS;

export function getSiteScreen(key: SiteScreenKey): SiteScreen {
  return SITE_SCREENS[key];
}
