/**
 * The public website's copy, for the assistant (owner, 2026-11-04: answer
 * from "the website"). The site's content model is a set of typed modules
 * in `src/lib/public-site/content`; this flattens one module's string
 * leaves into "path: text" lines the model can read, capped in size. Only
 * what the site publishes is here, so nothing confidential can leak
 * through it.
 */

export const WEBSITE_SECTIONS = [
  "home",
  "about",
  "businesses",
  "clinics",
  "connected-care",
  "metabolic",
  "pharmacy",
  "operations",
  "partners",
  "investors",
  "news",
  "team",
  "contact",
  "policies",
  "brand",
  "architecture",
] as const;

export type WebsiteSection = (typeof WEBSITE_SECTIONS)[number];

const LOADERS: Record<WebsiteSection, () => Promise<Record<string, unknown>>> = {
  home: () => import("@/lib/public-site/content/home"),
  about: () => import("@/lib/public-site/content/about"),
  businesses: () => import("@/lib/public-site/content/businesses"),
  clinics: () => import("@/lib/public-site/content/clinics"),
  "connected-care": () => import("@/lib/public-site/content/connected-care"),
  metabolic: () => import("@/lib/public-site/content/metabolic"),
  pharmacy: () => import("@/lib/public-site/content/pharmacy"),
  operations: () => import("@/lib/public-site/content/operations"),
  partners: () => import("@/lib/public-site/content/partners"),
  investors: () => import("@/lib/public-site/content/investors"),
  news: () => import("@/lib/public-site/content/news"),
  team: () => import("@/lib/public-site/content/team"),
  contact: () => import("@/lib/public-site/content/contact"),
  policies: () => import("@/lib/public-site/content/policies"),
  brand: () => import("@/lib/public-site/content/brand"),
  architecture: () => import("@/lib/public-site/content/architecture"),
};

export const WEBSITE_MAX_CHARS = 16_000;

/** Pure: every string leaf as "a.b[0].c: text", skipping paths that look like asset references. */
export function flattenContent(value: unknown, path = "", out: string[] = []): string[] {
  if (typeof value === "string") {
    const text = value.trim();
    if (
      text &&
      !/^(\/|https?:\/\/|data:)/.test(text) &&
      !/\.(png|jpe?g|svg|webp|mp4)$/i.test(text)
    ) {
      out.push(`${path}: ${text}`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => flattenContent(item, `${path}[${index}]`, out));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (typeof item === "function") continue;
      flattenContent(item, path ? `${path}.${key}` : key, out);
    }
  }
  return out;
}

export async function readWebsiteSection(
  section: string,
): Promise<
  | { ok: true; section: WebsiteSection; text: string; truncated: boolean }
  | { ok: false; reason: string }
> {
  if (!(WEBSITE_SECTIONS as readonly string[]).includes(section)) {
    return {
      ok: false,
      reason: `Unknown section "${section}". Sections: ${WEBSITE_SECTIONS.join(", ")}.`,
    };
  }
  const loaded = await LOADERS[section as WebsiteSection]();
  const lines = flattenContent(loaded);
  const joined = lines.join("\n");
  const truncated = joined.length > WEBSITE_MAX_CHARS;
  return {
    ok: true,
    section: section as WebsiteSection,
    text: truncated ? joined.slice(0, WEBSITE_MAX_CHARS) : joined,
    truncated,
  };
}
