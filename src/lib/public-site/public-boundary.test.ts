/**
 * Canaries for the public LifeSupply front end.
 *
 * The brief for the public site (docs/41) states rules that are easy to
 * break silently during visual work: the login must stay external to Render,
 * the proxy must keep internal paths off the public host, images must go
 * through next/image at their real size, copy must come from the content
 * model, and every route needs exactly one h1. None of those would fail a
 * type check. These assert them against the shipped source so a future
 * styling PR cannot loosen them without a deliberate edit here.
 *
 * There is no DOM test environment in this repository, so these scan source
 * rather than render — the same approach the pricing canaries use.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const PUBLIC_DIR = "src/components/public-site";
const LAYOUT = `${PUBLIC_DIR}/lifesupply-layout.tsx`;
const PAGES = `${PUBLIC_DIR}/lifesupply-pages.tsx`;
// Stage 2 split the Home and About pages into their own files, still exported
// through the barrel above; the canaries read all of them as one source.
const PAGE_FAMILIES = [
  "home",
  "about",
  "operations",
  "brands",
  "clinic-solutions",
  "shop",
  "contact",
  "metabolic",
  "partners",
  "pharmacy",
  "investors",
  "team",
  "news",
  "policies",
].map((name) => `${PUBLIC_DIR}/pages/${name}.tsx`);
const BRAND_GRID = `${PUBLIC_DIR}/brand-grid.tsx`;
const ACTION_LINK = `${PUBLIC_DIR}/action-link.tsx`;
const PRIMITIVES = `${PUBLIC_DIR}/lifesupply-primitives.tsx`;
const HERO_VIDEO = `${PUBLIC_DIR}/hero-video.tsx`;
const MOTION = `${PUBLIC_DIR}/motion.tsx`;
const SECTIONS = `${PUBLIC_DIR}/sections.tsx`;
const ACCORDION = `${PUBLIC_DIR}/accordion.tsx`;
const SCROLL_TO_TOP = `${PUBLIC_DIR}/scroll-to-top.tsx`;
const BRAND_IMAGE = `${PUBLIC_DIR}/brand-image.tsx`;
const SITE_SCREEN = `${PUBLIC_DIR}/site-screen.tsx`;
const VIDEO_EMBED = `${PUBLIC_DIR}/video-embed.tsx`;
const PARALLAX_BAND = `${PUBLIC_DIR}/parallax-band.tsx`;
const CONTENT = "src/lib/public-site/lifesupply-content.ts";
// The content model is a barrel over focused modules; the routes registry
// carries the legacy-compatible route table.
const CONTENT_MODULES = [
  "brand",
  "home",
  "about",
  "operations",
  "businesses",
  "clinics",
  "shop",
  "metabolic",
  "team",
  "investors",
  "partners",
  "pharmacy",
  "news",
  "policies",
  "contact",
].map((name) => `src/lib/public-site/content/${name}.ts`);
const ROUTES_FILE = "src/lib/public-site/routes.ts";
const PROXY = "src/proxy.ts";
const CSS = "src/styles/globals.css";

const layout = () => stripComments(read(LAYOUT));
const pages = () => [PAGES, ...PAGE_FAMILIES].map((file) => stripComments(read(file))).join("\n");
const brandGrid = () => stripComments(read(BRAND_GRID));
const actionLink = () => stripComments(read(ACTION_LINK));
const primitives = () => stripComments(read(PRIMITIVES));
const heroVideo = () => stripComments(read(HERO_VIDEO));
const motionPrimitives = () => stripComments(read(MOTION));
const sections = () => stripComments(read(SECTIONS));
const accordion = () => stripComments(read(ACCORDION));
const scrollToTop = () => stripComments(read(SCROLL_TO_TOP));
const brandImage = () => stripComments(read(BRAND_IMAGE));
const siteScreen = () => stripComments(read(SITE_SCREEN));
const videoEmbed = () => stripComments(read(VIDEO_EMBED));
const parallaxBand = () => stripComments(read(PARALLAX_BAND));
const content = () =>
  [CONTENT, ...CONTENT_MODULES, ROUTES_FILE].map((file) => stripComments(read(file))).join("\n");
const publicComponents = () => [
  layout(),
  pages(),
  primitives(),
  heroVideo(),
  motionPrimitives(),
  brandGrid(),
  actionLink(),
  sections(),
  accordion(),
  scrollToTop(),
  brandImage(),
  siteScreen(),
  videoEmbed(),
  parallaxBand(),
];

/** Width and height from a PNG's IHDR chunk. */
function pngSize(rel: string): { width: number; height: number } {
  const bytes = readFileSync(join(ROOT, rel));
  expect(bytes.subarray(1, 4).toString(), `${rel} is not a PNG`).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** Width and height from a JPEG's first start-of-frame marker. */
function jpegSize(rel: string): { width: number; height: number } {
  const bytes = readFileSync(join(ROOT, rel));
  expect(bytes.readUInt16BE(0).toString(16), `${rel} is not a JPEG`).toBe("ffd8");
  let offset = 2;
  while (offset < bytes.length) {
    expect(bytes[offset], `${rel}: marker expected at ${offset}`).toBe(0xff);
    const marker = bytes[offset + 1] ?? 0;
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error(`${rel}: no start-of-frame marker`);
}

const fileSize = (rel: string) => statSync(join(ROOT, rel)).size;

describe("the Command Center login boundary in the public UI", () => {
  it("resolves the login URL in exactly one component, and only through getCommandCenterLoginUrl()", () => {
    const calls = primitives().match(/getCommandCenterLoginUrl\(\)/g) ?? [];
    expect(calls).toHaveLength(1);
    expect(layout()).not.toContain("getCommandCenterLoginUrl(");
    expect(pages()).not.toContain("getCommandCenterLoginUrl(");
  });

  it("renders the visible login control from that one component everywhere", () => {
    // The Playwright smoke test finds this control by its accessible name.
    expect(primitives()).toContain("Command Center login");
    expect(layout()).toContain("<CommandCenterLoginLink");
    // Never a hero action: the Command Center is a management tool, not a
    // public destination (product owner, 2026-09-08). It appears only in the
    // shell's utility strip, mobile panel, and footer row.
    expect(pages()).not.toContain("<CommandCenterLoginLink");
    expect(primitives()).not.toContain('"hero"');
    expect(layout()).not.toContain("Command Center login");
    expect(pages()).not.toContain("Command Center login");
  });

  it("contains no same-host dashboard or login href anywhere in the public components", () => {
    for (const code of publicComponents()) {
      expect(code).not.toMatch(/["'`]\/dashboard/);
      expect(code).not.toMatch(/["'`]\/login/);
      expect(code).not.toMatch(/["'`]\/admin/);
    }
  });
});

describe("the proxy keeps internal paths off the public host", () => {
  const proxy = () => stripComments(read(PROXY));

  it("still detects the public host through the shared helper", () => {
    expect(proxy()).toContain('isLifeSupplyPublicHost(req.headers.get("host"))');
  });

  it("still blocks every internal path on the public host and sends visitors home", () => {
    const code = proxy();
    for (const path of ["/dashboard", "/admin", "/login", "/forgot-password", "/api/"]) {
      expect(code, path).toContain(`pathname.startsWith("${path}")`);
    }
    expect(code).toContain('NextResponse.redirect(new URL("/", origin))');
  });

  it("still leaves only the published public API and health check open", () => {
    // Stage 9 moved the literal into the allowlist module the proxy calls first.
    const publicPaths = stripComments(read("src/lib/public-site/public-paths.ts"));
    expect(publicPaths).toContain('pathname === "/api/health"');
    expect(publicPaths).toContain('pathname.startsWith("/api/public/")');
    expect(proxy()).toContain("isPublicApiPath(pathname)");
    return;
    const code = proxy();
    expect(code).toContain('pathname === "/api/health"');
    expect(code).toContain('pathname.startsWith("/api/public/")');
  });
});

describe("original assets", () => {
  it("are rendered through next/image, never a raw img tag", () => {
    for (const code of publicComponents()) {
      expect(code).not.toMatch(/<img[\s>]/);
    }
  });

  it("declares the mark at its real pixel dimensions", () => {
    // A wrong intrinsic size makes next/image reserve the wrong box and
    // shifts the layout on load. The content model is checked against the
    // PNG headers so swapping an asset without updating its size fails here.
    const c = content();
    const declared = (key: string) => Number(c.match(new RegExp(`${key}:\\s*(\\d+)`))?.[1]);
    expect({ width: declared("imageWidth"), height: declared("imageHeight") }).toEqual(
      pngSize("public/lsh/lifesupply-mark.png"),
    );
  });

  it("read those dimensions from the content model rather than hard-coding them", () => {
    expect(layout()).toContain("width={brand.imageWidth}");
    expect(layout()).toContain("height={brand.imageHeight}");
  });

  it("carries no MedDirect or Dexton material: entities, lockup, timeline, and channel withdrawn", () => {
    // Both entities are no longer operational (product owner, 2026-09-08).
    // Nothing public may name them, link to them, or render an asset that
    // shows them (the portfolio lockup and the legacy timeline graphic).
    for (const source of [content(), ...publicComponents()]) {
      expect(source).not.toMatch(/dexton|meddirect|med ?direct/i);
      expect(source).not.toMatch(
        /portfolio-lockup|operations-timeline|portfolioImage|operationsTimeline/,
      );
    }
    expect(existsSync(join(ROOT, "public/lsh/lifesupply-portfolio-lockup.png"))).toBe(false);
    expect(existsSync(join(ROOT, "public/lsh/operations-timeline.jpg"))).toBe(false);
  });
});

describe("the hero footage", () => {
  // The legacy hero video, reduced to its caption-free scenes. The budget
  // keeps the homepage's first paint honest: the poster is what shows first,
  // and the loop is fetched only after the browser has said motion is fine.
  const ASSETS = {
    webm: "public/lsh/hero/hero-loop.webm",
    mp4: "public/lsh/hero/hero-loop.mp4",
    poster: "public/lsh/hero/hero-poster.jpg",
  };

  it("ships the loop in both containers and the poster, within the byte budget", () => {
    for (const rel of Object.values(ASSETS)) expect(existsSync(join(ROOT, rel)), rel).toBe(true);
    expect(fileSize(ASSETS.webm)).toBeLessThan(2_500_000);
    expect(fileSize(ASSETS.mp4)).toBeLessThan(3_000_000);
    expect(fileSize(ASSETS.poster)).toBeLessThan(400_000);
  });

  it("declares the poster at its real pixel size and points at the shipped files", () => {
    const c = content();
    const declared = (key: string) => Number(c.match(new RegExp(`${key}:\\s*(\\d+)`))?.[1]);
    expect({ width: declared("posterWidth"), height: declared("posterHeight") }).toEqual(
      jpegSize(ASSETS.poster),
    );
    for (const rel of Object.values(ASSETS)) {
      expect(c).toContain(`"${rel.replace(/^public/, "")}"`);
    }
    expect(pages()).toContain("<HeroVideo {...homepage.heroMedia} />");
  });

  it("is decorative, silent, inline, looped, and pauses itself off screen", () => {
    const code = heroVideo();
    expect(code).toContain('aria-hidden="true"');
    expect(code).toMatch(
      /<video[\s\S]*?\bautoPlay\b[\s\S]*?\bmuted\b[\s\S]*?\bloop\b[\s\S]*?\bplaysInline\b/,
    );
    // VP9 first, H.264 fallback.
    expect(code.indexOf('type="video/webm"')).toBeLessThan(code.indexOf('type="video/mp4"'));
    // No on-screen control, by product-owner decision (2026-09-08); the
    // loop pauses itself when the hero leaves the viewport instead.
    expect(code).not.toContain("<button");
    expect(code).toContain("new IntersectionObserver(");
    expect(code).toContain("video.pause()");
  });

  it("gives reduced-motion visitors the poster only, and renders no footage on the server", () => {
    const code = heroVideo();
    expect(code).toContain("useSyncExternalStore(");
    expect(code).toContain("(prefers-reduced-motion: reduce)");
    // The server snapshot is "reduced", so the video element never reaches
    // the HTML and no bytes are requested before the preference is known.
    expect(code).toMatch(/useSyncExternalStore\([\s\S]*?\(\) => true,?\s*\)/);
    // The only effect drives the element from an observer; it writes no state.
    expect(code).not.toMatch(/useEffect\([\s\S]*?set[A-Z]\w*\(/);
  });
});

describe("motion", () => {
  it("collapses every animation for reduced-motion visitors", () => {
    const code = motionPrimitives();
    // Each exported primitive consults the preference. Count the components
    // and the calls: they must match, so a new primitive cannot skip it.
    const exported = code.match(/^export function \w+/gm) ?? [];
    // CountUp reads the preference through the hydration-safe store instead
    // (its markup depends on the value, so the server and client must agree).
    const consulted = code.match(/(?<!function )use(Hydrated)?ReducedMotion\(\)/g) ?? [];
    expect(exported.length).toBeGreaterThanOrEqual(7);
    // SpotlightCard is pointer-only decoration with no animation of its own.
    expect(consulted.length).toBe(exported.length - 1);
  });

  it("counts figures up to exactly the approved text", () => {
    // The formatted target is derived from the content string, so the number
    // a visitor ends on is the number that was approved, decimals included.
    const code = motionPrimitives();
    expect(code).toContain("latest.toFixed(decimals)");
    expect(code).toMatch(/if \(!parsed \|\| reduce\)[\s\S]*?\{value\}/);
  });

  it("keeps the hero title a single real heading", () => {
    // Words are spans inside one motion.h1, not separate elements, so the
    // accessible name is the full sentence and the one-h1 rule holds.
    const code = motionPrimitives();
    expect(code).toMatch(/<motion\.h1[\s\S]*?words\.map[\s\S]*?<\/motion\.h1>/);
  });
});

describe("brand tokens", () => {
  it("are consumed as variables — no raw hex colour survives in the public components", () => {
    for (const code of publicComponents()) {
      expect(code).not.toMatch(/#[0-9a-fA-F]{6}\b/);
      expect(code).not.toMatch(/#[0-9a-fA-F]{3}\b/);
    }
  });

  it("define the legacy palette and the rule hairlines on the scoped shell", () => {
    const css = read(CSS);
    const shell = css.slice(css.indexOf(".lsh-shell {"), css.indexOf(".lsh-shell h1"));
    for (const token of [
      "--lsh-brand-red: #de0000",
      "--lsh-red-hover: #b63737",
      "--lsh-red-on-ink:",
      "--lsh-ink: #000000",
      "--lsh-charcoal: #1d1d1d",
      "--lsh-paper: #ffffff",
      "--lsh-rule:",
      "--lsh-rule-strong:",
      "--lsh-display-font:",
      "--lsh-body-font:",
    ]) {
      expect(shell, token).toContain(token);
    }
  });
});

describe("motion and focus", () => {
  const css = () => read(CSS);

  it("keeps hover feedback for reduced-motion users and gates only the lift", () => {
    const source = css();
    const feedback = source.indexOf(".lsh-lift:hover {");
    const motionGate = source.indexOf("@media (prefers-reduced-motion: no-preference)");
    expect(feedback).toBeGreaterThan(-1);
    expect(motionGate).toBeGreaterThan(feedback);

    // The ungated block carries colour and shadow, and no transform.
    const ungated = source.slice(feedback, source.indexOf("}", feedback));
    expect(ungated).toContain("border-color");
    expect(ungated).toContain("box-shadow");
    expect(ungated).not.toContain("transform");

    // The transform lives inside the gate.
    const gated = source.slice(motionGate);
    expect(gated).toContain("transform: translateY(-4px)");
  });

  it("collapses transitions under prefers-reduced-motion: reduce", () => {
    expect(css()).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.lsh-shell \*[\s\S]*?transition-duration: 0\.01ms !important/,
    );
  });

  it("gives keyboard focus a visible ring, including on red surfaces", () => {
    const source = css();
    expect(source).toContain(".lsh-shell :is(a, button):focus-visible");
    expect(source).toMatch(
      /\.lsh-primary-action[^{]*:focus-visible[\s\S]*?box-shadow: 0 0 0 6px var\(--lsh-brand-red\)/,
    );
  });
});

describe("document structure", () => {
  it("has a skip link that lands on the main landmark", () => {
    const code = layout();
    expect(code).toContain('href="#lsh-main"');
    expect(code).toContain('id="lsh-main"');
    expect(code).toContain("tabIndex={-1}");
    expect(code).toContain("<main");
  });

  it("marks the current route through one NavItem used by every navigation", () => {
    const code = layout();
    expect((code.match(/aria-current=\{active \? "page" : undefined\}/g) ?? []).length).toBe(1);
    // Header, mobile panel, and footer all render NavItem, never a bespoke link.
    expect((code.match(/<NavItem\b/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(code).toContain("aria-expanded={isMenuOpen}");
    expect(code).toContain('aria-controls="lsh-mobile-menu"');
  });

  it("hides the header on scroll-down and returns it on scroll-up, honouring reduced motion", () => {
    // The LLD behaviour: sticky header, translated away while reading down,
    // back on the first upward movement. Never hidden with the menu open or
    // with keyboard focus inside it, and the transition is off under
    // prefers-reduced-motion.
    const code = layout();
    expect(code).toContain("useScrollDirection()");
    expect(code).toContain("scrollingDown && !isMenuOpen && !focusWithinHeader");
    expect(code).toContain('headerHidden ? "-translate-y-full" : "translate-y-0"');
    expect(code).toMatch(/transition-transform[^`"]*motion-reduce:transition-none/);
    expect(code).toContain("onFocusCapture=");

    const hook = read("src/lib/public-site/use-scroll-direction.ts");
    expect(hook).toContain("{ passive: true }");
    expect(hook).toContain("requestAnimationFrame(update)");
    expect(hook).toContain("if (y <= topOffset)");
  });

  it("gives navigation links the extending red underline, with the motion switched off when asked", () => {
    const code = layout();
    expect(code).toContain("hover:after:w-full");
    expect(code).toContain("after:bg-[var(--lsh-brand-red)]");
    expect(code).toContain("motion-reduce:after:transition-none");
    // Active: a short bar under the first letters; inactive: none.
    expect(code).toContain('"text-white after:w-5"');
    expect(code).toContain('"text-white/75 after:w-0 hover:text-white"');
  });

  it("carries no Investor information button in the header or the panel (product owner, 2026-09-09)", () => {
    const code = layout();
    expect(code).not.toContain("Investor information");
    expect(code).not.toContain("LIFE_SUPPLY_ROUTES.investorRelations");
  });

  it("renders exactly one h1 per page, and only from PublicHero", () => {
    const pageSource = pages();
    const exportedPages = (
      pageSource.match(
        /^export function \w+Page\b|^export function \w+View\b|^export function LifeSupplyHome\b/gm,
      ) ?? []
    ).length;
    const heroes = (pageSource.match(/<PublicHero\b/g) ?? []).length;
    expect(exportedPages).toBeGreaterThan(0);
    expect(heroes).toBe(exportedPages);
    expect(pageSource).not.toContain("<h1");
    expect(layout()).not.toContain("<h1");
    expect(primitives()).not.toContain("<h1");
    // The heading element itself is HeroTitle's motion.h1, rendered once, by PublicHero.
    expect((primitives().match(/<HeroTitle\b/g) ?? []).length).toBe(1);
    expect((motionPrimitives().match(/<motion\.h1\b/g) ?? []).length).toBe(1);
  });

  it("wraps every page in the shared layout", () => {
    const pageSource = pages();
    const exportedPages = (
      pageSource.match(
        /^export function \w+Page\b|^export function \w+View\b|^export function LifeSupplyHome\b/gm,
      ) ?? []
    ).length;
    expect((pageSource.match(/<LifeSupplyLayout>/g) ?? []).length).toBe(exportedPages);
  });
});

describe("routes and content governance", () => {
  it("keeps every public route file in place and pointed at the shared pages", () => {
    for (const route of [
      "src/app/page.tsx",
      "src/app/about-us/page.tsx",
      "src/app/medical-supply-solutions/page.tsx",
      "src/app/pharmacy-solutions/page.tsx",
      "src/app/our-team/page.tsx",
      "src/app/investor-relations/page.tsx",
      "src/app/news/page.tsx",
      "src/app/contact/page.tsx",
      "src/app/shop/page.tsx",
      "src/app/[slug]/page.tsx",
      "src/app/medical-supply-solutions/lifesupply/page.tsx",
      "src/app/medical-supply-solutions/wellmart-medical/page.tsx",
      "src/app/medical-supply-solutions/balkowitsch/page.tsx",
      "src/app/clinic-solutions/page.tsx",
      "src/app/clinic-solutions/equipment/page.tsx",
      "src/app/clinic-solutions/ongoing-supplies/page.tsx",
      "src/app/metabolic-health/page.tsx",
      "src/app/metabolic-health/care-kits/page.tsx",
      "src/app/metabolic-health/care-kits/[kit]/page.tsx",
      "src/app/metabolic-health/refills/page.tsx",
      "src/app/partners/page.tsx",
      "src/app/partners/clinics/page.tsx",
      "src/app/partners/pharmacies/page.tsx",
      "src/app/partners/suppliers/page.tsx",
      "src/app/partners/acquisitions/page.tsx",
      "src/app/investor-relations/growth-strategy/page.tsx",
      "src/app/investor-relations/advanced-therapeutics/page.tsx",
      "src/app/investor-relations/disclosures/page.tsx",
      "src/app/privacy/page.tsx",
      "src/app/terms/page.tsx",
      "src/app/accessibility/page.tsx",
      "src/app/news/[slug]/page.tsx",
      "src/app/resources/[slug]/page.tsx",
    ]) {
      expect(existsSync(join(ROOT, route)), route).toBe(true);
      expect(read(route), route).toContain("@/components/public-site/lifesupply-pages");
    }
  });

  it("keeps the route table unchanged", () => {
    const c = content();
    for (const path of [
      '"/"',
      '"/about-us/"',
      '"/our-operations/"',
      '"/our-team/"',
      '"/investor-relations/"',
      '"/news/"',
      '"/contact/"',
      '"/contact-2/"',
      '"/shop/"',
    ]) {
      expect(c, path).toContain(path);
    }
  });

  it("sources the shell and anchor-page copy from the content model, not from JSX", () => {
    // Sentences the first pass embedded in components. They now live in the
    // content model only; a component that re-embeds one fails here.
    const sentences = [
      "Corporate information, operating context, and investor resources",
      "Public information is subject to update and applicable disclosure context.",
      "Health, safety, medical, and industrial supply categories across Canada",
      "Publicly reported scale, with source context.",
      "A clinic project can start at any stage.",
      "A platform approach to medical-supply access.",
      "The operating websites behind the group.",
    ];
    const c = content();
    for (const sentence of sentences) {
      expect(c, sentence).toContain(sentence);
      expect(layout(), sentence).not.toContain(sentence);
      expect(pages(), sentence).not.toContain(sentence);
      expect(primitives(), sentence).not.toContain(sentence);
    }
  });
});

describe("design-pass graphics and section primitives", () => {
  it("renders conceptual graphics only through the registry, labelled conceptual, never as a raw file path", () => {
    // The registry (graphics.ts) declares every conceptual image with its
    // real size and provenance; a page that types a /lsh/graphics/ path by
    // hand fails here. No visible caption is rendered (product owner, 2026-09-09).
    for (const code of publicComponents()) {
      expect(code).not.toContain("/lsh/graphics/");
    }
    for (const code of [pages(), sections()]) {
      expect(code).not.toMatch(/graphic=\{?"[a-z]+\.jpg/);
    }
    expect(sections()).toContain("getGraphic(");
    for (const code of publicComponents()) {
      expect(code).not.toContain("CONCEPTUAL_CAPTION");
      expect(code).not.toMatch(/<figcaption/);
      expect(code).not.toContain("Conceptual image");
    }
    const graphics = stripComments(read("src/lib/public-site/graphics.ts"));
    expect(graphics).toContain("conceptual, not operational photography");
    // Section primitives resolve icons through the registry, never an ad-hoc lucide import per page.
    expect(sections()).toContain("iconFor(icon)");
    for (const name of [
      "home",
      "about",
      "operations",
      "brands",
      "clinic-solutions",
      "metabolic",
      "partners",
      "investors",
    ]) {
      expect(read(`${PUBLIC_DIR}/pages/${name}.tsx`), name).toContain(
        "@/components/public-site/sections",
      );
    }
  });

  it("renders the back-to-top control only once needed, returns focus to main, and honours reduced motion", () => {
    const code = scrollToTop();
    expect(code).toContain('aria-label="Back to top"');
    expect(code).toContain("if (!shown) return null;");
    expect(code).toContain('document.getElementById("lsh-main")');
    expect(code).toContain('behavior: reduce ? "auto" : "smooth"');
    expect(code).toContain("{ passive: true }");
    expect(layout()).toContain("<ScrollToTop />");
    expect(read(CSS)).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.lsh-scroll-top/,
    );
  });

  it("keeps the accordion keyboard-operable and reduced-motion safe", () => {
    const code = accordion();
    expect(code).toContain("<button");
    expect(code).toContain("aria-expanded={expanded}");
    expect(code).toContain("aria-controls={panelId}");
    expect(code).toContain("useReducedMotion()");
    expect(sections()).toContain("motion-reduce:");
  });
});

describe("Stage 2 registries and navigation", () => {
  it("resolves every external destination through the registries, never in a component", () => {
    // Store, brand, and channel destinations live in brands.ts, actions.ts,
    // and the content model. A component that types an https:// or a mail
    // address by hand fails here.
    for (const code of publicComponents()) {
      expect(code).not.toMatch(/https?:\/\//);
      expect(code).not.toMatch(/mailto:[a-z]/i);
    }
  });

  it("derives the menus from the route registry and never names a planned route", () => {
    const code = layout();
    expect(code).toContain("buildPrimaryNavigation()");
    expect(code).toContain("buildUtilityNavigation()");
    // Every planned route is now live; the shell still names none of them by literal.
    for (const literal of [
      '"/partners',
      '"/investor-relations/',
      '"/privacy',
      '"/terms',
      '"/accessibility',
    ]) {
      for (const source of [layout(), pages(), primitives()]) {
        expect(source, literal).not.toContain(literal);
      }
    }
  });

  it("renders only the three approved figures, and no legacy count anywhere", () => {
    const home = stripComments(read(`${PUBLIC_DIR}/pages/home.tsx`));
    expect(home).toContain("homepage.publicMetrics.map");
    const c = content();
    for (const figure of ['"25+"', '"50K+"', '"1M+"']) expect(c, figure).toContain(figure);
    // The conflicting counts catalogued in SOURCE_REGISTER.md §4.
    for (const legacy of [
      "55,000",
      "45,000",
      "46,000",
      "40,000",
      "30,000",
      "180 distributors",
      "200 manufacturers",
      "A decade of",
    ]) {
      expect(c, legacy).not.toContain(legacy);
      for (const code of publicComponents()) expect(code, legacy).not.toContain(legacy);
    }
  });

  it("builds the Home and About contracts from the content model and the brand registry", () => {
    const source = pages();
    expect((source.match(/<BrandGrid \/>/g) ?? []).length).toBe(2);
    for (const block of [
      "homepage.introduction",
      "homepage.clinicLifecycle.steps.map",
      "homepage.metabolic",
      "homepage.paths.map",
      "homepage.closing",
      "about.footprint",
      "about.milestones.items.map",
      "about.direction",
      "about.developing.items.map",
    ]) {
      expect(source, block).toContain(block);
    }
    // Primary actions are registry keys rendered through ActionLink.
    expect(source).toContain('<ActionLink action="explore_businesses"');
    // The consultation action reaches the homepage lifecycle through the content model.
    expect(content()).toContain('action: "plan_clinic"');
    expect(source).toContain('<ActionLink action="investor_information"');
  });

  it("keeps brand names as text until an authentic mark with a usage record exists, with the photograph decorative", () => {
    const code = brandGrid();
    expect(code).toContain("record.asset ?");
    expect(code).not.toMatch(/<img[\s>]/);
    expect(code).not.toContain("/lsh/");
    // The photograph sits inside the external link, so it is decorative and
    // the link keeps "Visit <brand>" plus the card text as its name.
    expect(code).toMatch(/<BrandImage[\s\S]*?decorative/);
  });

  it("shows each store's real home page only through the dated screen registry, never a raw path", () => {
    for (const code of publicComponents()) {
      expect(code).not.toContain("/lsh/sites/");
    }
    const code = siteScreen();
    expect(code).toContain("getSiteScreen(site)");
    const brands = stripComments(read(`${PUBLIC_DIR}/pages/brands.tsx`));
    expect(brands).toContain("<SiteScreen site={brandKey}");
    expect(stripComments(read(`${PUBLIC_DIR}/pages/clinic-solutions.tsx`))).toContain(
      '<SiteScreen site="clinics"',
    );
  });

  it("renders the four brand photographs only through the registry mapping", () => {
    const code = brandImage();
    expect(code).toContain("getGraphic(BRAND_GRAPHICS[brand])");
    expect(code).toContain('alt={decorative ? "" : g.alt}');
    const graphics = stripComments(read("src/lib/public-site/graphics.ts"));
    for (const key of ["lifesupply", "wellmart", "clinics", "balkowitsch"]) {
      expect(graphics).toMatch(new RegExp(`${key}: "brand[A-Za-z]+"`));
    }
    // The brand set keeps its own provenance; the served files are the JPEG derivatives.
    expect(graphics).toContain("PNG master 1672×941 retained");
    expect(graphics).not.toMatch(/brands\/[a-z-]+\.png/);
    for (const page of ["brand-grid", "pages/shop", "pages/operations"]) {
      expect(read(`${PUBLIC_DIR}/${page}.tsx`), page).toContain('presentation="square"');
    }
  });

  it("keeps the grouped navigation keyboard-operable and the panel hover-free", () => {
    const code = layout();
    expect(code).toContain("group-focus-within:visible");
    expect(code).toContain("aria-expanded={open}");
    expect(code).toMatch(/aria-controls=\{`lsh-menu-\$\{group\.key\}`\}/);
    expect(code).toContain('if (event.key === "Escape") setOpen(false);');
    // Every dropdown and expanded mobile group opens with the group's own page.
    expect((code.match(/label="Overview"/g) ?? []).length).toBe(2);
    expect(code).toContain("neverCurrent");
    // The mobile panel lists group children as plain rows; nothing depends on hover there.
    expect(code).toMatch(/id="lsh-mobile-menu"[\s\S]*?PRIMARY_NAV\.map[\s\S]*?group\.links\.map/);
    // Groups collapse behind a real button with state and a controlled list,
    // one open at a time, the current page's group first; never hover.
    expect(code).toContain("aria-expanded={expandedGroup === group.key}");
    expect(code).toContain("aria-controls={`lsh-mobile-group-${group.key}`}");
    // Collapsed through the display class, not the attribute: a `grid` utility
    // outranks the preflight [hidden] rule and would keep the list visible.
    expect(code).toMatch(/expandedGroup === group\.key\s*\?\s*"grid[^"]*"\s*:\s*"hidden"/);
    expect(code).not.toContain("hidden={expandedGroup");
    expect(code).toContain("setExpandedGroup(activeGroup?.key ?? null)");
  });
});

describe("restructure of 2026-09-08: sections, redirects, leadership, and Pharmacy Solutions", () => {
  const nextConfig = () => stripComments(read("next.config.ts"));

  it("redirects every withdrawn address permanently and keeps it on the public-host allowlist", () => {
    const config = nextConfig();
    for (const source of [
      "/our-operations",
      "/our-operations/lifesupply",
      "/our-operations/wellmart-medical",
      "/our-operations/balkowitsch",
      "/our-operations/lifesupply-clinics",
      "/our-operations/technology-fulfilment",
      "/clinic-solutions/design-build",
      "/investor-relations/documents",
      "/investor-relations/shareholder-services",
    ]) {
      expect(config, source).toContain(`source: "${source}"`);
    }
    // 2026-09-09: the documents index merged into News & resources; Shareholder services withdrawn.
    expect(config).toContain('destination: "/news"');
    for (const code of publicComponents()) {
      expect(code).not.toMatch(/shareholder/i);
      expect(code).not.toContain("RelatedActions");
    }
    for (const slug of [
      "ben-hastibakhsh",
      "gary-li",
      "craig-loverock",
      "mike-gill",
      "christopher-ishola",
      "ross-jelveh-2",
      "dr-margaret-clarke-2",
      "john-anderson-2",
    ]) {
      expect(config, slug).toContain(`"${slug}"`);
    }
    expect(config).toContain('destination: "/our-team"');
    expect(config).not.toContain('destination: "/ross-jelveh-2"');
    // The directors restored on 2026-09-09 are live profiles, not redirects.
    for (const slug of ["keith-dolo-2", "barrett-e-g-sleeman", "david-vogt", "abdul-ladha"]) {
      expect(config, slug).not.toContain(`"${slug}"`);
    }
  });

  it("names the sections as the product owner set them and leaves no trace of the old ones", () => {
    const routes = stripComments(read(ROUTES_FILE));
    expect(routes).toContain('label: "Medical Supplies"');
    expect(routes).toContain('label: "Pharmacy Solutions"');
    expect(routes).not.toContain('label: "Our Businesses"');
    for (const source of [layout(), pages(), primitives()]) {
      expect(source).not.toContain("Our Businesses");
      expect(source).not.toContain("Design & build");
      expect(source).not.toMatch(/ClinicsBrandPage|DesignBuildPage|OperationsPage\b/);
    }
  });

  it("presents Pharmacy Solutions with its status and no pharmacy operation, transaction, or dispensing claim", () => {
    const pharmacy = stripComments(read("src/lib/public-site/content/pharmacy.ts"));
    expect(pharmacy).toContain("does not dispense, diagnose, prescribe, or recommend");
    expect(pharmacy).toContain('status: "Under evaluation"');
    expect(pharmacy).toContain(
      "No pharmacy acquisition, transaction, licence, or counterparty is announced or implied",
    );
    expect(pharmacy).not.toMatch(/\bour pharmac(y|ies)\b/i);
    expect(pharmacy).not.toMatch(
      /licen[cs]ed pharmacy|dispens(es|ing) (medication|prescriptions)/i,
    );
    expect(pharmacy).not.toMatch(
      /(acquire|acquisition of|closing|signed|announce[sd]?) (a |the )?pharmacy/i,
    );
    const page = stripComments(read(`${PUBLIC_DIR}/pages/pharmacy.tsx`));
    expect(page).toContain("{pharmacy.status.sentence}");
  });

  it("closes About on the developing opportunities, carries no group or capabilities section, and divides it with decorative legacy bands", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/about.tsx`));
    const aboutContent = stripComments(read("src/lib/public-site/content/about.ts"));
    for (const gone of [
      "Connected channels",
      "Published entities",
      "Shared capabilities",
      "corporate",
    ]) {
      expect(page, gone).not.toContain(gone);
      expect(aboutContent, gone).not.toContain(gone);
    }
    expect(aboutContent).toContain("Developing opportunities under evaluation.");
    // The developing grid is the last block before the layout closes.
    expect(page.trimEnd()).toMatch(
      /about\.developing\.items\.map[\s\S]*?\/>\s*<\/LifeSupplyLayout>\s*\);\s*}\s*$/,
    );
    // The hero backdrop and two bands, each decorative, drawn from the registry, never a path literal.
    expect(page).toContain('media={<HeroBackdrop band="data" />}');
    expect((page.match(/<ParallaxBand /g) ?? []).length).toBe(2);
    expect(page).toContain('<ParallaxBand band="desk" tone="redLight" />');
    expect(page).toContain('<ParallaxBand band="warehouse" tone="ink" />');
    const band = parallaxBand();
    expect(band).toContain('aria-hidden="true"');
    expect(band).toContain('alt=""');
    expect(band).toContain("useReducedMotion()");
    expect(band).not.toContain("/lsh/");
    expect(band).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });

  it("lists the confirmed leader and the four directors of the prior site, and none of the withdrawn people", () => {
    const teamPage = stripComments(read(`${PUBLIC_DIR}/pages/team.tsx`));
    expect(teamPage).toContain("labels.board");
    expect(teamPage).toContain("board.map(");
    const teamContent = stripComments(read("src/lib/public-site/content/team.ts"));
    // Four profiles, four board cards, one leadership card.
    expect((teamContent.match(/slug: "/g) ?? []).length).toBe(9);
    for (const slug of ["abdul-ladha", "keith-dolo-2", "barrett-e-g-sleeman", "david-vogt"]) {
      expect(teamContent).toContain(`"${slug}"`);
    }
    for (const name of [
      "Hastibakhsh",
      "Gary Li",
      "Loverock",
      "Mike Gill",
      "Ishola",
      "Jelveh",
      "Holowenko",
      "Anderson",
    ]) {
      for (const source of [teamContent, ...publicComponents()]) {
        expect(source, name).not.toContain(name);
      }
    }
    // The dated 2022 record of a board appointment is history, not a roster.
    expect(stripComments(read("src/lib/public-site/content/about.ts"))).toContain(
      "Dr. Margaret Clarke appointed",
    );
  });
});

describe("Stage 3 brands, Clinic Solutions, and Shop & Services", () => {
  const clinicPages = () => stripComments(read(`${PUBLIC_DIR}/pages/clinic-solutions.tsx`));
  const brandPages = () => stripComments(read(`${PUBLIC_DIR}/pages/brands.tsx`));
  const shopPage = () => stripComments(read(`${PUBLIC_DIR}/pages/shop.tsx`));
  const contactPage = () => stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`));
  const clinicsContent = () => stripComments(read("src/lib/public-site/content/clinics.ts"));

  it("keeps clinic development distinct from patient care on every clinic page", () => {
    // The distinction sentence is content; every Clinic Solutions page and
    // the Clinics brand page render it. Nothing anywhere describes owned
    // clinics or patient care as a company service.
    expect(clinicsContent()).toContain("does not operate patient-care clinics");
    expect((clinicPages().match(/<ClinicDistinction \/>/g) ?? []).length).toBe(3);
    expect(clinicPages()).toContain("{clinics.distinction}");
    for (const source of [content(), ...publicComponents()]) {
      expect(source).not.toMatch(/\bour (patient-care )?clinics\b/i);
      expect(source).not.toMatch(/\bpatient care (is|we) (provided|provide)/i);
    }
  });

  it("attributes delivery roles only as the Clinics site states them", () => {
    expect(clinicsContent()).toContain("core partners");
    expect(clinicsContent()).toContain("attributes no construction work to LifeSupply beyond");
    expect(clinicPages()).toContain("{clinics.attribution}");
  });

  it("treats post-opening supply as conditional on every clinic page", () => {
    expect(clinicsContent()).toContain("creates no supply commitment");
    expect((clinicPages().match(/<ConditionalClose /g) ?? []).length).toBe(3);
    expect(clinicPages()).toContain("{clinics.postOpening}");
  });

  it("never restates store terms: thresholds, delivery times, or prices", () => {
    for (const source of [content(), ...publicComponents()]) {
      expect(source).not.toMatch(/\$\s?\d{2,3}(\.\d{2})?\b(?![KM])/);
      expect(source).not.toMatch(/business days/i);
      expect(source).not.toMatch(/free shipping (on|over|in) /i);
    }
    expect(shopPage()).not.toMatch(/add to cart|checkout|\bprice\b/i);
  });

  it("reads categories, support channels, and project links from the registries and content", () => {
    expect(brandPages()).toContain("record.categories.map");
    expect(brandPages()).toContain("record.storeLinks.map");
    expect(clinicPages()).toContain("clinics.projects.items.map");
    expect(contactPage()).toContain("contact.intents.map");
    expect(contactPage()).toContain("contact.existingOrder");
    expect(shopPage()).toContain("shop.choices.map");
    expect(shopPage()).toContain("brandGeography(record)");
  });

  it("gives every Stage 3 page one PublicHero and the shared layout", () => {
    for (const source of [clinicPages(), brandPages(), shopPage(), contactPage()]) {
      const exported = (source.match(/^export function \w+Page\b/gm) ?? []).length;
      expect(exported).toBeGreaterThan(0);
      expect((source.match(/<PublicHero\b/g) ?? []).length).toBe(exported);
      expect((source.match(/<LifeSupplyLayout>/g) ?? []).length).toBe(exported);
    }
  });
});

describe("Stage 4 Metabolic Health and the eight pathways", () => {
  const metabolicPage = () => stripComments(read(`${PUBLIC_DIR}/pages/metabolic.tsx`));
  const metabolicContent = () => stripComments(read("src/lib/public-site/content/metabolic.ts"));

  it("states the in-development status and the disclaimer on every metabolic page", () => {
    const page = metabolicPage();
    expect((page.match(/<StatusBand \/>/g) ?? []).length).toBe(4);
    expect(metabolicContent()).toContain("No pathway is purchasable on this site");
    expect(metabolicContent()).toContain("does not diagnose, prescribe, or recommend");
  });

  it("makes no SKU, price, discount, insurance, storage, or clinical claim", () => {
    const c = metabolicContent();
    for (const banned of [
      /\bSKU\b/i,
      /\$\s?\d/,
      /\bdiscount\b/i,
      /\d+\s?% off/i,
      /\binsurance\b|\bcovered by\b/i,
      /keeps? (it |supplies )?(cold|cool)/i,
      /\bclinically (proven|shown)\b/i,
      // "prescribed device" is compatibility language; the site itself never diagnoses or prescribes.
      /(?<!does not )diagnos/i,
      /(?<!does not diagnose, )prescribes?/i,
    ]) {
      expect(c, String(banned)).not.toMatch(banned);
    }
    expect(metabolicPage()).not.toMatch(/add to cart|buy now|\bcheckout\b/i);
  });

  it("excludes medication from every pathway and never claims a universal device", () => {
    const c = metabolicContent();
    expect((c.match(/MEDICATION_EXCLUDED/g) ?? []).length).toBeGreaterThanOrEqual(9);
    expect(c).toContain("An insulin syringe is not universal injectable equipment");
    expect(c).not.toMatch(/(fits|works with|suits) (all|any|every) (pen|device|syringe|meter)/i);
    expect(c).not.toMatch(/\buniversal (pack|pen|syringe|needle|kit)\b/i);
  });

  it("keeps starter items out of refills and claims no refill service that does not exist", () => {
    const c = metabolicContent();
    expect(c).toContain("Starter items are not refills.");
    expect(c).toContain("no automatic shipment, no reminder service, and no subscription");
    expect(c).not.toMatch(/subscribe and save|auto-?ship (is|now) available/i);
  });

  it("resolves browse links only through the brand registry and says so when there is none", () => {
    const page = metabolicPage();
    expect(page).toContain("getBrandCategory(ref.brand, ref.category)");
    expect(page).toContain("{kit.browseNote}");
    expect(metabolicContent()).toContain(
      "No operating store publishes a sharps-container category today",
    );
  });
});

describe("Stage 5 partners, investors, team, news, and policies", () => {
  const stage5Content = () =>
    ["investors", "partners", "team", "news", "policies"]
      .map((name) => stripComments(read(`src/lib/public-site/content/${name}.ts`)))
      .join("\n");
  const stage5Pages = () =>
    ["investors", "partners", "team", "news", "policies"]
      .map((name) => stripComments(read(`${PUBLIC_DIR}/pages/${name}.tsx`)))
      .join("\n");

  it("names no financing amount, valuation, exchange, listing, structure, or counterparty (S-63, S-65)", () => {
    const c = stage5Content();
    for (const banned of [
      /\$\s?4\.2/,
      /\bmillion\b/i,
      /\bvaluation\b/i,
      /\bIRR\b/,
      /\bshare (count|price)\b/i,
      /\bTSXV?\b/,
      /\bCSE\b/,
      /\bCPC\b/,
      /\bCDNX\b/,
      /\bFendX\b/i,
      /(shares?|company|stock|securities) (is|are|be|become|becoming|will be) listed/i,
      /listed on (the |a |an )?(exchange|TSX|CSE|NASDAQ|NYSE)/i,
      /public listing|go(ing)? public|IPO/i,
      /letter of intent (has|was|is) (been )?signed/i,
      /\bsigned (a |an )?(agreement|partnership|LOI)\b/i,
    ]) {
      expect(c, String(banned)).not.toMatch(banned);
    }
    // Only the three approved figures appear anywhere in the Stage 5 copy,
    // apart from the two figures inside the directors' preserved biographies,
    // which describe other organisations (a listed employer's size and a
    // bank loan portfolio), never LifeSupply.
    const dollars = c.match(/\$[\d.,]+( billion|[MK])?/g) ?? [];
    expect(new Set(dollars)).toEqual(
      new Set(["$6.75M", "$2.20M", "$284K", "$6.1 billion", "$5 billion"]),
    );
    const teamContent = stripComments(read("src/lib/public-site/content/team.ts"));
    expect(teamContent.match(/\$[\d.,]+( billion|[MK])?/g)).toEqual(["$6.1 billion", "$5 billion"]);
  });

  it("keeps static documents at a request step and downloads only through the published read model", () => {
    expect(stage5Content()).not.toMatch(/\.pdf/i);
    // The documents index lives on the News & resources page since 2026-09-09.
    const newsPage = stripComments(read(`${PUBLIC_DIR}/pages/news.tsx`));
    const investors = stripComments(read(`${PUBLIC_DIR}/pages/investors.tsx`));
    // The only download link is built from a published record's same-origin path; never a literal file.
    expect(newsPage).toContain("publishedDocumentUrl(doc.downloadPath)");
    expect(investors).not.toContain("publishedDocumentUrl");
    for (const code of [newsPage, investors]) {
      expect(code).not.toMatch(/\bdownload=/);
    }
    expect(investors).not.toMatch(/href="https?:\/\//);
    expect(existsSync(join(ROOT, "public/documents"))).toBe(false);
    expect(existsSync(join(ROOT, "public/investors"))).toBe(false);
  });

  it("resolves team titles only through the dated legacy profiles, and no longer renders the undated deck", () => {
    const teamPage = stripComments(read(`${PUBLIC_DIR}/pages/team.tsx`));
    expect(teamPage).toContain("legacyTitle(member.slug)");
    expect(teamPage).not.toMatch(/member\.role/);
    expect(stage5Pages()).not.toContain("investor-presentation-preview");
    expect(stage5Content()).not.toContain("investor-presentation-preview");
  });

  it("authors no company news or resource statically, and fabricates no author or date", () => {
    const c = stripComments(read("src/lib/public-site/content/news.ts"));
    // Since Stage 6 these families are governed; the static module holds only the historical record.
    expect(c).not.toMatch(/^\s{2}current:/m);
    expect(c).not.toMatch(/^\s{2}resources:/m);
    expect(c).not.toMatch(/author: "/);
    expect(c).not.toMatch(/reviewer: "/);
    const page = stripComments(read(`${PUBLIC_DIR}/pages/news.tsx`));
    expect(page).toContain("sections.current.empty");
    expect(page).toContain("sections.resources.empty");
  });

  it("states the policies as current behaviour: no form, no cookie, no tracker, and no consent claim", () => {
    const c = stripComments(read("src/lib/public-site/content/policies.ts"));
    expect(c).toContain("do not set cookies");
    expect(c).toContain("no third-party analytics");
    // The one embedded video is stated as click-to-load, on the privacy-enhanced host.
    expect(c).toContain("until you press play");
    expect(c).toContain("privacy-enhanced");
    expect(c).toContain("no form, no account, no newsletter sign-up, and no inquiry intake");
    expect(c).not.toMatch(/cookie (banner|consent)/i);
    expect(c).not.toMatch(/we (collect|store) your/i);
    expect(c).not.toMatch(/Google Analytics|GA4/);
    // The public shell still loads no third-party script and sets no cookie.
    expect(layout()).not.toMatch(/<script/i);
    expect(layout()).not.toMatch(/document\.cookie/);
  });

  it("keeps clinic collaboration distinct from procurement and pharmacy programs non-drug", () => {
    const c = stripComments(read("src/lib/public-site/content/partners.ts"));
    expect(c).toContain("Collaboration is not procurement");
    expect(c).toContain("Medication is excluded from every configuration");
    expect(c).toContain("No transaction, letter of intent, or discussion is announced or implied");
    expect(c).not.toMatch(/referral (fee|bonus|incentive) (is|are) (offered|available)/i);
  });

  it("carries the forward-looking qualification beside the investor claims", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/investors.tsx`));
    expect((page.match(/<ForwardLooking /g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(page).toContain("d.forwardLooking.text");
    expect(page).toContain("<StatusTag status=");
  });
});

describe("Stage 6 governed publishing on the public site", () => {
  const publishedClient = () => stripComments(read("src/lib/public-site/published.ts"));

  it("reaches published content only through the fail-closed client, never a database", () => {
    const sources = [
      ...publicComponents(),
      ...CONTENT_MODULES.map((path) => read(path)),
      publishedClient(),
    ];
    for (const source of sources) {
      expect(source).not.toMatch(/@\/server\/db|@prisma\/client|DATABASE_URL|prisma\./);
    }
    for (const route of [
      "src/app/news/page.tsx",
      "src/app/news/[slug]/page.tsx",
      "src/app/resources/[slug]/page.tsx",
    ]) {
      const source = read(route);
      expect(source, route).toContain("@/lib/public-site/published");
      expect(source, route).not.toMatch(/@\/server\/db|@\/server\/public-web\/readers/);
    }
    expect(publishedClient()).toContain("return { ok: false }");
    expect(publishedClient()).toContain("safeParse");
  });

  it("fails closed in every governed section: an outage reads as unavailable, never as empty", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/news.tsx`));
    expect(page).toContain("sections.current.unavailable");
    expect(page).toContain("sections.resources.unavailable");
    expect(page).toContain("export function PublishedUnavailablePage");
    // The published document list, merged into the news page on 2026-09-09.
    expect(page).toContain("copy.unavailable");
    for (const route of ["src/app/news/[slug]/page.tsx", "src/app/resources/[slug]/page.tsx"]) {
      expect(read(route), route).toContain("if (!result.ok) return <PublishedUnavailablePage />;");
      expect(read(route), route).toContain("robots: { index: false }");
    }
  });

  it("keeps the published-only rule on the server: readers filter by status and window, routes answer a generic 503", () => {
    const readers = stripComments(read("src/server/public-web/readers.ts"));
    expect(readers).toContain("status: PublicContentStatus.published");
    expect(readers).toContain("isTimeValid(row, now)");
    const http = stripComments(read("src/server/public-web/http.ts"));
    expect(http).toContain('"Public website data is temporarily unavailable."');
    expect(http).toContain('"Cache-Control": "no-store"');
    const workflow = stripComments(read("src/server/public-web/workflow.ts"));
    expect(workflow).toContain("PERMISSIONS.PUBLIC_WEB_APPROVE");
    expect(workflow).toContain("current.preparedById === actor.id");
    expect(workflow).toContain("updatedAt: expectedUpdatedAt");
    expect(workflow).toContain("writeAudit(");
  });

  it("never previews a draft on the public site; the preview route is permission-gated and unindexed", () => {
    const preview = read("src/app/(print)/public-web-preview/[id]/page.tsx");
    expect(preview).toContain("requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT)");
    expect(preview).toContain("robots: { index: false, follow: false }");
    for (const source of [...publicComponents(), publishedClient()]) {
      expect(source).not.toContain("public-web-preview");
    }
  });

  it("adds no migration file: the Render container applies migrations on every deploy", () => {
    const migrations = readdirSync(join(ROOT, "prisma/migrations")).filter(
      (name) => /^\d{14}_/.test(name) && Number(name.slice(0, 14)) > 20260907235000,
    );
    expect(migrations).toEqual([]);
    expect(
      existsSync(
        join(
          ROOT,
          "docs/website-development/migrations/stage-06-public-web-governance/migration.sql",
        ),
      ),
    ).toBe(true);
  });
});

describe("Stage 7 inquiry capture stays unpublished until its decisions are recorded", () => {
  it("renders the inquiry form on no public page and keeps the contact directory in place", () => {
    for (const source of [
      ...publicComponents().filter((code) => !code.includes("export function InquiryForm")),
      layout(),
      primitives(),
    ]) {
      expect(source).not.toContain("InquiryForm");
      expect(source).not.toContain("inquiry-form");
    }
    for (const route of [
      "src/app/contact/page.tsx",
      "src/app/partners/page.tsx",
      "src/app/investor-relations/page.tsx",
    ]) {
      expect(read(route), route).not.toContain("inquiry-form");
    }
    const contactContent = stripComments(read("src/lib/public-site/content/contact.ts"));
    expect(contactContent).toContain("intents:");
    expect(stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`))).not.toContain("<form");
  });

  it("puts no visitor data in URLs, logs, or audit rows, and never trusts a browser recipient", () => {
    const form = stripComments(read(`${PUBLIC_DIR}/inquiry-form.tsx`));
    expect(form).toContain('method: "POST"');
    expect(form).not.toMatch(/searchParams|\?email=|location\.search/);
    expect(form).toContain('sourcePath.split("?")[0]');
    const contract = stripComments(read("src/server/public-inquiry/contract.ts"));
    expect(contract).toContain('"recipient"');
    expect(contract).toContain('"redirect"');
    expect(contract).toContain(".strict()");
    const intake = stripComments(read("src/server/public-inquiry/intake.ts"));
    expect(intake).toContain("redactForLog(record)");
    expect(intake).not.toMatch(/afterData:\s*record\b|contact\.email/);
    const delivery = stripComments(read("src/server/public-inquiry/delivery.ts"));
    expect(delivery).toContain('lastError: "Delivery failed"');
  });

  it("adds no migration file and ships the inquiry table as a prepared artifact", () => {
    const migrations = readdirSync(join(ROOT, "prisma/migrations")).filter(
      (name) => /^\d{14}_/.test(name) && Number(name.slice(0, 14)) > 20260907235000,
    );
    expect(migrations).toEqual([]);
    expect(
      existsSync(
        join(ROOT, "docs/website-development/migrations/stage-07-public-inquiry/migration.sql"),
      ),
    ).toBe(true);
    expect(stripComments(read("src/server/public-inquiry/store.ts"))).toContain(
      "to_regclass('public.public_inquiries')",
    );
  });

  it("leaves the privacy page unchanged because no collection is live", () => {
    const privacy = stripComments(read("src/lib/public-site/content/policies.ts"));
    expect(privacy).toContain(
      "There is no form, no account, no newsletter sign-up, and no inquiry intake on this site.",
    );
  });
});
