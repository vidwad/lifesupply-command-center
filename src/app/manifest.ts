import type { MetadataRoute } from "next";

/**
 * The Command Center as a Home Screen web app (product owner, 2026-11-04).
 *
 * With `display: standalone`, an icon added to the Home Screen opens the
 * application full screen with no browser bar at the top or the bottom,
 * which is the closest a web app comes to a native one on a phone. The
 * bottom key bar's stylesheet rule drops its Safari-toolbar allowance in
 * that mode. The start address is the dashboard; an unauthenticated open
 * lands on the login page as usual.
 *
 * The public website build on Vercel shares this file. There it describes
 * the public site in the browser's ordinary display, so the website never
 * advertises itself as the Command Center.
 */
export default function manifest(): MetadataRoute.Manifest {
  if (process.env.PUBLIC_SITE_MODE === "true") {
    return {
      name: "LifeSupply Health",
      short_name: "LifeSupply",
      start_url: "/",
      display: "browser",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    };
  }
  return {
    name: "LifeSupply Command Center",
    short_name: "Command Center",
    description: "Management information, operations control and reporting for LifeSupply.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
