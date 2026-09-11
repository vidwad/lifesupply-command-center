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

import {
  CONSOLIDATED_ROUTES,
  LIFE_SUPPLY_ROUTES,
  METABOLIC_ROUTES,
  PHARMACY_ROUTES,
  SECTION_ANCHORS,
  STAGE_3_ROUTES,
} from "@/lib/public-site/routes";
import { KIT_SLUGS } from "@/lib/public-site/content/metabolic";
import { PROFILE_ANCHORS } from "@/lib/public-site/content/team";

const ROOT = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const PUBLIC_DIR = "src/components/public-site";

/** Every file in the public content model, for sweeps that must cover all copy. */
function publicContentFiles() {
  const dir = "src/lib/public-site/content";
  return readdirSync(join(ROOT, dir))
    .filter((file) => file.endsWith(".ts"))
    .map((file) => `${dir}/${file}`);
}

const LAYOUT = `${PUBLIC_DIR}/lifesupply-layout.tsx`;
const PAGES = `${PUBLIC_DIR}/lifesupply-pages.tsx`;
/**
 * Every page family under `pages/`, still exported through the barrel above;
 * the canaries read all of them as one source.
 *
 * Derived from the directory since 2026-09-10 rather than listed by hand. A
 * hand-written list silently stops covering a page family that is added, and
 * breaks on one that is consolidated away — neither of which should be able
 * to happen to a confidentiality sweep.
 */
function publicComponentFiles() {
  const walk = (dir: string): string[] =>
    readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(`${dir}/${entry.name}`)
        : entry.name.endsWith(".tsx")
          ? [`${dir}/${entry.name}`]
          : [],
    );
  return walk(PUBLIC_DIR).sort();
}

function publicPageFiles() {
  const dir = `${PUBLIC_DIR}/pages`;
  return readdirSync(join(ROOT, dir))
    .filter((file) => file.endsWith(".tsx"))
    .sort()
    .map((file) => `${dir}/${file}`);
}
const PAGE_FAMILIES = publicPageFiles();
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
const CARE_PATHWAY = `${PUBLIC_DIR}/care-pathway-diagram.tsx`;
const ON_THIS_PAGE = `${PUBLIC_DIR}/on-this-page.tsx`;
const CONTENT = "src/lib/public-site/lifesupply-content.ts";
// The content model is a barrel over focused modules; the routes registry
// carries the legacy-compatible route table. The module list is derived for
// the same reason the page list is.
const CONTENT_MODULES = publicContentFiles();
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
const carePathway = () => stripComments(read(CARE_PATHWAY));
const onThisPage = () => stripComments(read(ON_THIS_PAGE));
const content = () =>
  [CONTENT, ...CONTENT_MODULES, ROUTES_FILE].map((file) => stripComments(read(file))).join("\n");
/** One function's body out of a source file, for section-scoped assertions. */
const bodyOf = (source: string, name: string): string => {
  const start = source.indexOf(`function ${name}(`);
  if (start === -1) return "";
  const rest = source.slice(start);
  const next = rest.slice(1).search(/\n(export )?function /);
  return next === -1 ? rest : rest.slice(0, next + 1);
};
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
  carePathway(),
  onThisPage(),
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
    expect(exported.length).toBeGreaterThanOrEqual(5);
    // SpotlightCard is pointer-only decoration with no animation of its own.
    expect(consulted.length).toBe(exported.length - 1);
    // The hero entrance moved to CSS in round four, so it must collapse there
    // too rather than escaping this rule by leaving the library.
    const css = read("src/styles/globals.css");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,120}\.lsh-enter\s*\{\s*animation: none/,
    );
  });

  it("counts figures up to exactly the approved text", () => {
    // The formatted target is derived from the content string, so the number
    // a visitor ends on is the number that was approved, decimals included.
    const code = motionPrimitives();
    expect(code).toContain("latest.toFixed(decimals)");
    expect(code).toMatch(/if \(!parsed \|\| reduce\)[\s\S]*?\{value\}/);
  });

  it("keeps the hero readable before any animation runs", () => {
    // Round four, change 2. The headline used to be a motion.h1 whose words
    // each began at opacity 0, and the description and actions sat in wrappers
    // that did the same. Framer-motion writes those initial styles into the
    // server-rendered HTML, so the hero was invisible until JavaScript ran.
    const code = primitives();
    // The heading is a plain h1 holding the whole title.
    expect(code).toMatch(/<h1[\s\S]{0,400}\{title\}[\s\S]{0,40}<\/h1>/);
    // Nothing in the hero is animated by the library any more.
    expect(code).not.toMatch(/<Enter\b|<HeroTitle\b/);
    expect(motionPrimitives()).not.toMatch(/export function (Enter|HeroTitle)\b/);
    // The entrance that replaced it moves the content and never hides it.
    const css = read("src/styles/globals.css");
    const entrance = css.slice(css.indexOf("@keyframes lsh-enter-rise"));
    expect(entrance.slice(0, 200)).toMatch(/transform: translateY/);
    expect(entrance.slice(0, 200)).not.toMatch(/opacity/);
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
    // The heading element lives in PublicHero, written once, as a plain h1
    // (round four, change 2). No page and no other primitive may render one.
    expect((primitives().match(/<h1\b/g) ?? []).length).toBe(1);
    expect(motionPrimitives()).not.toContain("<motion.h1");
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
      "src/app/medical-supply-solutions/lifesupply/page.tsx",
      "src/app/medical-supply-solutions/wellmart-medical/page.tsx",
      "src/app/medical-supply-solutions/balkowitsch/page.tsx",
      "src/app/clinic-solutions/page.tsx",
      "src/app/metabolic-health/page.tsx",
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
      // Retired addresses stay in the table as redirect rows, so the sitemap
      // and the menus keep being derived and no address is simply dropped.
      '"/shop/"',
      '"/partners/pharmacies/"',
      '"/metabolic-health/care-kits/"',
      '"/metabolic-health/refills/"',
      '"/clinic-solutions/equipment/"',
      '"/clinic-solutions/ongoing-supplies/"',
      '"/partners/clinics/"',
    ]) {
      expect(c, path).toContain(path);
    }
  });

  it("sources the shell and anchor-page copy from the content model, not from JSX", () => {
    // Sentences the first pass embedded in components. They now live in the
    // content model only; a component that re-embeds one fails here.
    const sentences = [
      "Corporate information, operating context, and investor resources",
      "Information on this site is current at the date published and may be updated.",
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
    // A page resolves its content icons through the registry: either through
    // the section primitives, or directly through `icons.ts` where the design
    // draws the glyph itself rather than boxing it (2026-09-10). What is
    // banned either way is a page reaching into lucide for a content icon.
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
      const page = read(`${PUBLIC_DIR}/pages/${name}.tsx`);
      expect(page, name).toMatch(/@\/components\/public-site\/(sections|icons)/);
      // Only interface affordances may come straight from lucide.
      const lucide = /import \{([^}]*)\} from "lucide-react"/.exec(page)?.[1] ?? "";
      const AFFORDANCES = [
        "ArrowRight",
        "ArrowUp",
        "ExternalLink",
        "Mail",
        "MapPin",
        "Phone",
        "Play",
        "Search",
      ];
      for (const glyph of lucide
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)) {
        expect(AFFORDANCES, `${name} imports ${glyph} from lucide`).toContain(glyph);
      }
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

describe("round two: qualified inquiries and policy accuracy", () => {
  it("gives pharmacy and metabolic inquiries their own subjects", () => {
    const actions = stripComments(read("src/lib/public-site/actions.ts"));
    expect(actions).toContain('"Pharmacy supply program"');
    expect(actions).toContain('"Metabolic-health supply program"');
    // The generic shared subject is gone.
    expect(actions).not.toContain('"Supply program inquiry"');
  });

  it("tells a visitor what to include, without asking for anything sensitive", () => {
    const contact = stripComments(read("src/lib/public-site/content/contact.ts"));
    expect(contact).toContain("What to include");
    expect(contact).toContain("A first exchange is about fit");
    expect(contact).toContain("do not send health information");
    // Nothing personal, clinical or financial is requested.
    for (const banned of [
      /date of birth|health card|patient (name|record)|prescription number/i,
      /credit card|account number|social insurance/i,
    ]) {
      expect(contact, String(banned)).not.toMatch(banned);
    }
    // No response-time or service commitment is made.
    expect(contact).not.toMatch(/within \d+ (business )?(hours|days)|we will respond/i);
  });

  it("claims no accessibility audit it has not had, and no booking it has not made", () => {
    const policies = stripComments(read("src/lib/public-site/content/policies.ts"));
    expect(policies).toContain("has not been audited by an external accessibility reviewer");
    expect(policies).not.toMatch(/review is (scheduled|booked)|audit is (booked|scheduled)/i);
    // It states what actually runs instead.
    expect(policies).toContain("Automated accessibility checks run against every public route");
  });
});

describe("round four: consolidation, precision and available actions", () => {
  it("gives each homepage section its own job", () => {
    const home = stripComments(read("src/lib/public-site/content/home.ts"));
    // The group introduction explains the structure; it no longer restates the
    // operating scope the panels above and the brand cards below already carry.
    expect(home).toContain("One parent company, three wholly-owned subsidiaries.");
    expect(home).not.toMatch(/introduction:[\s\S]{0,600}Four operating websites sit under one/);
    // The growth direction is stated once, in the panels.
    const introBlock = home.slice(home.indexOf("introduction:"), home.indexOf("audiences:"));
    expect(introBlock).not.toMatch(/stated direction|growth strateg/i);
  });

  it("says the four categories are coordinated, never one contract or account", () => {
    const metabolic = stripComments(read("src/lib/public-site/content/metabolic.ts"));
    expect(metabolic).not.toMatch(/one commercial relationship/i);
    expect(metabolic).toContain("not one contract, not one account");
    // Reporting scope is stated once, the same way in both places.
    expect(metabolic).not.toMatch(/Reporting scope is not defined/i);
    expect(metabolic).not.toMatch(/status reporting/i);
  });

  it("opens the investor section with the business, not the access policy", () => {
    const investors = stripComments(read("src/lib/public-site/content/investors.ts"));
    const opening = investors.slice(0, investors.indexOf("currentReport:"));
    expect(opening).toContain("sells health, safety, medical and industrial products online");
    expect(opening).toContain("C$6.75M");
    // The classification scheme is not the first thing a reader meets.
    expect(opening).not.toMatch(/disclosed information, forward-looking statements/i);
  });

  it("keeps project qualifications out of the ongoing-supplies section", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/clinic-solutions.tsx`));
    const start = page.indexOf("function OngoingSuppliesSection(");
    expect(start).toBeGreaterThan(-1);
    const rest = page.slice(start);
    const next = rest.slice(1).search(/\n(export )?function /);
    const supplies = next === -1 ? rest : rest.slice(0, next + 1);
    // Round four, change 5. The construction attribution and the
    // project-sequence note belong to a project this reader is not
    // undertaking, and consolidating the pages does not change that: they
    // stay in the planning section, and this one points at them.
    expect(supplies).not.toContain("<ClinicDistinction />");
    expect(supplies).not.toContain("<ConditionalClose ");
    expect(supplies).not.toContain("{clinics.postOpening}");
    expect(supplies).toContain("{page.projectPointer}");
    expect(supplies).toContain("{page.boundary}");
  });

  it("orders the milestones oldest first and marks the cumulative figure", () => {
    const about = stripComments(read("src/lib/public-site/content/about.ts"));
    expect(about).toContain("orderedMilestones");
    // Every entry carries a sort key, so a new one cannot land out of order.
    const entries = about.match(/date: "/g) ?? [];
    const keys = about.match(/sortKey: "/g) ?? [];
    expect(keys.length).toBe(entries.length);
    // Cumulative is never presented as a current customer count.
    expect(about).toContain("cumulatively since inception, not a count of current customers");
    expect(about).not.toMatch(/\b1 million (active|current) customers\b/i);
  });

  it("advertises no empty document category and no download that does not exist", () => {
    const news = stripComments(read("src/lib/public-site/content/news.ts"));
    const page = stripComments(read(`${PUBLIC_DIR}/pages/news.tsx`));
    // The three access-class tiles are gone; one of them held nothing at all.
    expect(page).not.toContain("d.classes.map");
    expect(news).toContain("None is downloadable here");
    // Every record still shows where it stands.
    for (const category of ["Restricted, on request", "Historical"]) {
      expect(news).toContain(category);
    }
  });
});

describe("round four: presentation and interaction", () => {
  it("puts the contact choices above the preparation guidance", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`));
    const choices = page.indexOf("contact.intents.map");
    const guide = page.indexOf("contact.routing.guide.title");
    expect(choices).toBeGreaterThan(-1);
    expect(guide).toBeGreaterThan(choices);
  });

  it("labels every contact action with what it actually does", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`));
    expect(page).toContain("actionBehaviour(");
    const actions = stripComments(read("src/lib/public-site/actions.ts"));
    // A mail route says a mail window opens; an external route names the host.
    expect(actions).toContain("Opens an email, subject prepared");
    expect(actions).toContain("Opens ${new URL(destination.url).hostname");
    // The opening no longer implies every route is an email.
    const contact = stripComments(read("src/lib/public-site/content/contact.ts"));
    expect(contact).not.toMatch(/Each one leads to the relevant LifeSupply page or email address/);
    expect(contact).toContain("two open a consultation page on the Clinics site");
  });

  it("never reports a copy that did not happen, and always shows the address", () => {
    const copy = stripComments(read(`${PUBLIC_DIR}/copy-email.tsx`));
    // A failed clipboard write says so rather than showing success.
    expect(copy).toMatch(/catch\s*\{[\s\S]{0,80}setState\("failed"\)/);
    expect(copy).toContain("Copy failed");
    expect(copy).toContain('role="status"');
    // The control is an addition; the address is rendered as text beside it.
    const page = stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`));
    expect(page).toMatch(/\{behaviour\.address\}[\s\S]{0,120}<CopyEmail/);
  });

  it("still renders no form and promises no delivery", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`));
    expect(page).not.toMatch(/<form\b/);
    for (const banned of [/message sent/i, /we('ll| will) get back/i, /thank you for/i]) {
      expect(page, String(banned)).not.toMatch(banned);
    }
  });
});

describe("round three: architecture, placement and voice", () => {
  it("sets out three tiers with one status vocabulary, and separates the two pharmacy businesses", () => {
    const architecture = stripComments(read("src/lib/public-site/content/architecture.ts"));
    for (const status of ["Operating", "In development", "Under evaluation"]) {
      expect(architecture).toContain(`status: "${status}"`);
    }
    // Supplying pharmacies is in development; running one is under evaluation.
    expect(architecture).toContain("Pharmacy supply programs");
    expect(architecture).toContain("Licensed pharmacy operations");
    expect(architecture).toContain("Supplying pharmacies and running one are different businesses");
    // Nothing in development or under evaluation may read as purchasable.
    expect(architecture).toContain("Nothing here can be bought");
    expect(architecture).toContain("None is offered, licensed or operating");
    // Commerce geography is never given to the clinic business.
    expect(architecture).not.toMatch(
      /clinic[^.]{0,80}(Canada and the United States|across Canada)/i,
    );
  });

  it("puts the commercial explanation before the pathway detail it explains", () => {
    // It used to sit below the page's closing actions and disclosures.
    const page = stripComments(read(`${PUBLIC_DIR}/pages/metabolic.tsx`));
    const body = page.slice(page.indexOf("export function MetabolicHealthPage("));
    const model = body.indexOf("<CommercialModel");
    expect(model).toBeGreaterThan(-1);
    // It explains who buys what, so it comes before the pathways and before
    // the closing, and after the description of the offer it prices.
    expect(body.indexOf("<OfferSection />")).toBeLessThan(model);
    expect(model).toBeLessThan(body.indexOf("<PathwaysSection />"));
    expect(model).toBeLessThan(body.indexOf("<ClosingBand />"));
  });

  it("gives the investor pages a planned sequence with no date, count or target", () => {
    const investors = stripComments(read("src/lib/public-site/content/investors.ts"));
    expect(investors).toContain("execution:");
    for (const stage of [
      "Design and de-risk",
      "Controlled pilot",
      "Launch and integrate",
      "Replicate and scale",
    ]) {
      expect(investors).toContain(stage);
    }
    // Planned, never achieved.
    expect(investors).toContain("All four steps are planned");
    expect(investors).toContain("has completed a pilot");
    // No schedule or scale target reaches the sequence.
    const execution = investors.slice(investors.indexOf("execution:"));
    expect(execution).not.toMatch(/\b\d+\s*(days?|weeks?|months?|clinics?|partners?|patients?)\b/i);
    expect(execution).not.toMatch(/\bby (Q[1-4]|20\d\d)\b/i);
  });

  it("lists the pathways once, with every name opening its own section", () => {
    // The care-kits hub used to render the comparison and then eight cards
    // repeating it (round three, outcome 5). The rule survives consolidation:
    // the comparison is still the only catalogue, and each row still carries
    // a destination — an anchor on this page since 2026-09-10 rather than a
    // page of its own.
    const page = stripComments(read(`${PUBLIC_DIR}/pages/metabolic.tsx`));
    expect(page).toContain("<PathwayComparison");
    expect(page).toContain("href: `#${row.slug}`");
    // The kit list is mapped exactly once, to render the eight sections the
    // catalogue points at, and never a second time into repeating cards.
    expect((page.match(/metabolic\.kits\.map/g) ?? []).length).toBe(1);
    expect(page).toContain("<PathwaySection key={kit.slug}");
    // Every row still carries a destination.
    const comparison = stripComments(read(`${PUBLIC_DIR}/pathway-comparison.tsx`));
    expect(comparison).toContain("href={p.href}");
  });

  it("puts the store first on every operating-brand card, with the brand page second", () => {
    // The cards used to offer only an internal "About" link, so a visitor who
    // wanted to buy had to pass through a corporate page (round three, outcome 7).
    const page = stripComments(read(`${PUBLIC_DIR}/pages/operations.tsx`));
    const shop = page.indexOf("hub.stores.shopLabel");
    const about = page.indexOf("hub.stores.aboutLabel");
    expect(shop).toBeGreaterThan(-1);
    expect(about).toBeGreaterThan(shop);
    expect(page).toContain("record.canonicalUrl");
    // No card-covering overlay, so both links stay reachable.
    expect(page).not.toContain("after:absolute after:inset-0");
    // The professional route says what it covers and what it does not create.
    const businesses = stripComments(read("src/lib/public-site/content/businesses.ts"));
    expect(businesses).toContain("procurement:");
    expect(businesses).toContain("Start a conversation and it covers the ground below");
    for (const banned of [
      /credit terms (are|is) (available|offered)/i,
      /consolidated billing (is|are) (available|offered)/i,
      /dedicated account (manager|management)/i,
      /integrat(es|ed|ion) with your (system|ERP|practice)/i,
    ]) {
      expect(businesses, String(banned)).not.toMatch(banned);
    }
  });

  it("states the company plainly where the governed sections are empty, without restating it", () => {
    // Rather than leave a visitor nothing or invent an announcement to fill
    // the gap (round three, outcome 9).
    //
    // The rule changed shape on 2026-09-10 and got stricter. This block used
    // to restate the group, brands, footprint, scale, reported figures and
    // developing programs — six facts each of which already had an owning
    // page. Six copies of a figure is six places for it to drift, so the
    // block now orients and links, and the figures are asserted absent here
    // rather than asserted to match.
    const newsContent = stripComments(read("src/lib/public-site/content/news.ts"));
    expect(newsContent).toContain("overview:");
    expect(newsContent).toContain("LifeSupply Health Inc. is a Canadian parent company");
    for (const figure of ["C$6.75M", "C$2.20M", "C$284K"]) {
      expect(newsContent, figure).not.toContain(figure);
    }
    // And it routes to the pages that do own those facts.
    const page = stripComments(read(`${PUBLIC_DIR}/pages/news.tsx`));
    expect(page).not.toContain("overview.facts.map");
    expect(page).toContain("overview.action");
    expect(page).toContain('<ActionLink action="investor_information"');
    expect(newsContent).toContain('action: "about_group"');
  });

  it("carries no document or leadership provenance note in public copy", () => {
    const newsContent = stripComments(read("src/lib/public-site/content/news.ts"));
    const teamContent = stripComments(read("src/lib/public-site/content/team.ts"));
    const teamPage = stripComments(read(`${PUBLIC_DIR}/pages/team.tsx`));
    // Publishing mechanics: reviewers, versions-on-approval, governed workflow.
    for (const banned of [
      /author, reviewer, and review date/i,
      /governed workflow/i,
      /once approved, with title, date, version/i,
    ]) {
      expect(newsContent, String(banned)).not.toMatch(banned);
    }
    // Where titles came from is not a fact about the company.
    expect(teamContent).not.toContain("titlesNote");
    expect(teamPage).not.toContain("titlesNote");
    expect(teamContent).not.toMatch(/as published on the prior/i);
    // The leadership title itself is stated instead.
    expect(teamContent).toContain('role: "Chairman & CEO"');
  });

  it("uses one corporate address and one parent name, as the owner confirmed", () => {
    // Product owner, 2026-09-10: the parent is LifeSupply Health Inc., and every
    // address on the site is the Surrey corporate address. WEB-01 is closed.
    const SURREY = "6911 King George Highway";
    const brand = stripComments(read("src/lib/public-site/content/brand.ts"));
    const contact = stripComments(read("src/lib/public-site/content/contact.ts"));
    const seo = stripComments(read("src/lib/public-site/seo.ts"));
    for (const [name, source] of [
      ["brand", brand],
      ["contact", contact],
      ["seo", seo],
    ] as const) {
      expect(source, name).toContain(SURREY);
    }
    expect(brand).toContain("LifeSupply Health Inc.");
    expect(seo).toContain("LifeSupply Health Inc.");
    // No second street address anywhere in the content model.
    for (const file of publicContentFiles()) {
      const text = stripComments(read(file));
      const streets = [
        ...text.matchAll(/\d{3,5}\s+[A-Z][A-Za-z]+\s+(Highway|Street|Avenue|Road|Way|Drive)/g),
      ];
      for (const match of streets) {
        expect(match[0], `${file} :: ${match[0]}`).toContain("King George Highway");
      }
      expect(text, file).not.toContain("Health Supplies Inc.");
    }
  });

  it("claims no founding investor base, because no source supports one", () => {
    // Withdrawn at the owner's direction on 2026-09-10 and replaced with the
    // group's verified acquisition history.
    const home = stripComments(read("src/lib/public-site/content/home.ts"));
    expect(home).not.toMatch(/founding investor|investment bankers|capital-market professionals/i);
    expect(home).toContain("Wellmart Health Supplies became the Canadian operating base in 2020");
    expect(home).toContain("Balkowitsch Enterprises added United States reach");
  });

  it("draws the three card icons to the same rules as the stock set", () => {
    const custom = stripComments(read(`${PUBLIC_DIR}/custom-icons.tsx`));
    // Colour is inherited, never stored: no hex, no named colour, no fill.
    expect(custom).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(custom).not.toMatch(/(fill|stroke)="(?!none"|currentColor")[a-z]/i);
    expect(custom).toContain('stroke: "currentColor"');
    expect(custom).toContain('fill: "none"');
    // The lucide construction, so they sit beside the stock glyphs.
    expect(custom).toContain('viewBox: "0 0 24 24"');
    expect(custom).toContain("strokeLinecap");
    // No text or numerals inside an icon.
    expect(custom).not.toMatch(/<text|<tspan/);
    // Each of the three cards resolves to one of them.
    const map = stripComments(read("src/lib/public-site/icon-map.ts"));
    for (const [title, key] of [
      ["Operating businesses", "operatingBusinesses"],
      ["Partnership opportunities", "partnershipOpportunities"],
      ["Investor information", "investorInformation"],
    ]) {
      expect(map).toContain(`"${title}": "${key}"`);
    }
  });

  it("keeps internal workflow and publication language out of public copy", () => {
    const files = [...publicContentFiles(), `${PUBLIC_DIR}/pages/contact.tsx`];
    for (const file of files) {
      const text = stripComments(read(file));
      for (const banned of [
        /publication and approval workflow|approval workflow/i,
        /disclosure context/i,
        /annual-report narrative describes/i,
        /subject to update and applicable/i,
      ]) {
        expect(text, `${file} :: ${banned}`).not.toMatch(banned);
      }
      // The privacy statement has to describe the staff login the footer links
      // to; nowhere else may name the internal system.
      if (!file.endsWith("policies.ts")) {
        expect(text, `${file} :: Command Center`).not.toMatch(/Command Center/i);
      }
    }
  });
});

describe("round two: independent review corrections", () => {
  it("states no fee, price, or purchasing assurance in the commercial model", () => {
    const c = stripComments(read("src/lib/public-site/content/metabolic.ts"));
    expect(c).toContain("commercialModel");
    // No fee structure is established by any source.
    expect(c).not.toMatch(/a service fee|fee (schedule|basis|per)|priced at/i);
    expect(c).toContain("Nothing is priced.");
    // No assurance about what a buyer does or does not have to sign.
    expect(c).not.toMatch(/no (project or )?agreement is required/i);
  });

  it("promises no access to material that is not published", () => {
    const investors = stripComments(read("src/lib/public-site/content/investors.ts"));
    expect(investors).not.toMatch(/available on request|on request through/i);
    expect(investors).toContain("the extent of what is published on this site");
  });

  it("asks for nothing that identifies a person, and assures nothing about it", () => {
    const contact = stripComments(read("src/lib/public-site/content/contact.ts"));
    // The withdrawn assurance: an organization and a role can identify someone.
    expect(contact).not.toMatch(/none of them is personal or clinical information/i);
    expect(contact).not.toMatch(/commits you to anything/i);
    expect(contact).toContain("Programs in development are not currently offered.");
  });

  it("implies no account, checkout, or inventory shared between the brands", () => {
    const businesses = stripComments(read("src/lib/public-site/content/businesses.ts"));
    expect(businesses).not.toMatch(/the same account|shared (account|inventory|checkout)/i);
    expect(businesses).toContain("no separate professional portal");
  });
});

describe("round two: comparison, replenishment and motion", () => {
  it("compares all eight pathways in one place, from their own entries", () => {
    const c = stripComments(read("src/lib/public-site/content/metabolic.ts"));
    expect(c).toContain("pathwayComparison");
    expect(c).toContain("comparisonRows");
    // Pathways overlap on purpose; nothing may present them as exclusive.
    expect(c).toMatch(/overlap on purpose/);
    expect(c).not.toMatch(/excludes? (?:any )?other pathway|mutually exclusive/i);
    const page = stripComments(read(`${PUBLIC_DIR}/pages/metabolic.tsx`));
    expect(page).toContain("<PathwayComparison");
    const table = stripComments(read(`${PUBLIC_DIR}/pathway-comparison.tsx`));
    expect(table).toContain("<table");
    expect(table).toContain("lg:hidden");
    // The comparison adds no purchase route and no device recommendation.
    expect(table).not.toMatch(/add to cart|buy now|subscribe|we recommend/i);
  });

  it("never blurs meaningful text into view", () => {
    const motion = stripComments(read(MOTION));
    expect(motion).not.toMatch(/filter:\s*"blur/);
    for (const code of publicComponents()) {
      expect(code).not.toMatch(/blur\(\d/);
    }
  });

  it("keeps staff login out of the utility strip and the mobile panel, and in the footer", () => {
    const code = layout();
    expect((code.match(/<CommandCenterLoginLink/g) ?? []).length).toBe(1);
    expect(code).toContain('<CommandCenterLoginLink variant="utility" />');
  });
});

describe("round two: commercial model, portfolio and editorial voice", () => {
  it("sets out the proposed model in one place, with status and provider responsibility on every row", () => {
    const c = stripComments(read("src/lib/public-site/content/metabolic.ts"));
    expect(c).toContain("commercialModel");
    for (const row of [
      "Patient supply purchases",
      "Clinic-wide procurement",
      "Contracted kitting and fulfilment",
      "Contracted workflow support",
    ]) {
      expect(c, row).toContain(row);
    }
    // Proposed, never an offer; and no price, percentage or volume.
    expect(c).toContain("It is not an offer, it establishes no contract");
    const model = stripComments(read(`${PUBLIC_DIR}/commercial-model.tsx`));
    expect(model).not.toMatch(/\$\s?\d|\b\d{1,3}\s?%/);
    // Round four, change 3: two layers. The summary answers who contracts,
    // what they get and whether it exists; the rest sits behind a native
    // disclosure that needs no JavaScript, with a semantic table from md up
    // and labelled stacked entries below it.
    expect(model).toContain("<details");
    expect(model).toContain("<summary");
    expect(model).toContain("<table");
    expect(model).toContain("md:hidden");
    expect(model).toContain("<caption");
    // Each detail field appears once, so there is no second copy to drift.
    for (const field of ["row.revenue", "row.frequency", "row.retained"]) {
      expect((model.match(new RegExp(field.replace(".", "\\."), "g")) ?? []).length).toBe(1);
    }
  });

  it("carries no internal editorial voice in the public copy", () => {
    const content = ["businesses", "clinics", "investors", "contact", "home"].map((n) =>
      stripComments(read(`src/lib/public-site/content/${n}.ts`)),
    );
    for (const code of content) {
      expect(code).not.toMatch(/that is a marketing direction/i);
      expect(code).not.toMatch(/the site names/i);
      expect(code).not.toMatch(/supplied (presentation|for review)/i);
    }
  });

  it("replaces the generic investor link label with a described destination", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/investors.tsx`));
    expect(page).not.toContain('linkLabel: "Open"');
    expect(page).toContain("linkLabel: section.linkLabel");
    const investors = stripComments(read("src/lib/public-site/content/investors.ts"));
    expect(investors).toContain("The business today");
    expect(investors).toContain("Conditions for execution");
  });
});

describe("round two: cross-page factual consistency", () => {
  it("confines clinic services to British Columbia everywhere, and never to the group's commerce geography", () => {
    const content = ["home", "about", "clinics", "businesses"].map((name) =>
      stripComments(read(`src/lib/public-site/content/${name}.ts`)),
    );
    for (const code of content) {
      // A clinic service must never be placed across Canada and the United States.
      expect(code).not.toMatch(
        /clinic[^.]{0,80}(planning|design|build|construction|fit-out)[^.]{0,80}(Canada and the United States|United States)/i,
      );
    }
  });

  it("labels every reported figure with its currency, period, entity and basis", () => {
    // The consolidated statements express all amounts in Canadian dollars under
    // IFRS, unaudited (round three, 2026-09-10).
    const investors = stripComments(read("src/lib/public-site/content/investors.ts"));
    expect(investors).toContain('"Currency: Canadian dollars."');
    // No bare dollar figure: every published amount carries the currency marker.
    for (const figure of ["C$6.75M", "C$2.20M", "C$284K"]) {
      expect(investors).toContain(figure);
    }
    expect(investors).not.toMatch(/value: "\$\d/);
    expect(investors).toContain("Period: year ended December 31, 2025.");
    expect(investors).toContain("LifeSupply Health Inc., consolidated");
    expect(investors).toContain("IFRS");
    expect(investors).toContain("Unaudited");
    // Consolidated results are never attributed to one brand.
    expect(investors).toContain("no result is attributable to any single brand");
  });

  it("publishes the verified corporate structure once, and keeps brands distinct from it", () => {
    const contact = stripComments(read("src/lib/public-site/content/contact.ts"));
    const about = stripComments(read("src/lib/public-site/content/about.ts"));
    const page = stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`));
    expect(page).not.toContain("LifeSupply public subsidiaries");
    // The three subsidiaries the consolidated statements set out. Contact
    // still names them, because a visitor here is deciding who to write to.
    for (const entity of [
      "Wellmart Health Supplies Ltd.",
      "LifeSupply US, Inc.",
      "Balkowitsch Enterprises Inc.",
    ]) {
      expect(contact, entity).toContain(entity);
      expect(about, entity).toContain(entity);
    }
    // The explanation of the structure moved to About on 2026-09-10 and is
    // told once. Brand architecture is never equated with legal structure,
    // wherever it is told.
    expect(about).toContain("a brand name and a company name are not the same thing");
    expect(contact).not.toContain("a brand name and a company name are not the same thing");
    expect(contact).toContain("About sets out how the structure");
    for (const source of [contact, about]) {
      expect(source).not.toMatch(/four (brands|businesses) are (the )?(subsidiaries|companies)/i);
    }
    // The basis is stated once, on the page that tells the structure. Contact
    // states no basis of its own, so the two cannot be read as different
    // vintages of the same fact.
    // The structure carries its date so a reader knows how current it is.
    // It no longer cites the document it came from: that is provenance, and
    // provenance lives in the claim register, not on a page (owner's standing
    // voice instruction; independent review, 2026-09-10).
    expect(about).toContain("as at December 31, 2025");
    for (const source of [about, contact]) {
      expect(source).not.toContain("consolidated financial statements for the year ended");
    }
  });

  it("publishes nothing from the confidential financing materials", () => {
    // The August 25, 2026 expansion materials are accredited-investor documents
    // marked private and confidential. Their financing terms, forward projections,
    // acquisition pipeline and listing plans stay out of public copy entirely.
    const banned = [
      /\$4\.2\s?(million|M)\b/i,
      /\bwarrants?\b/i,
      /29\.74M|29,740,000/,
      /\bCSE\b|initial public offering|\bIPO\b/i,
      /Year 5|base[- ]case/i,
      // The Year 5 revenue split and its components.
      /\$25\.4M|\$25M|\$8\.6M|\$9\.2M|\$7\.6M|\$2\.00M|\$1\.75M|\$0\.45M/,
      /liquidity event|acquisition pipeline|acquisition targets?\b/i,
      /2\.70M|investor loan/i,
      // Naming peptide research as an option under evaluation is approved copy;
      // attaching revenue, upside or licensing income to it is not.
      /peptide[^.]{0,60}(revenue|upside|projection|forecast)/i,
      /R&D licensing/i,
    ];
    for (const file of publicContentFiles()) {
      const text = stripComments(read(file));
      for (const pattern of banned) {
        expect(text, `${file} :: ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

describe("public inquiry routing", () => {
  it("renders no form on the public site and never claims a submission succeeded", () => {
    // The public surface is database-free and the proxy blocks /api/ on the public
    // host, so there is no approved delivery path. The verified mail routes are the
    // mechanism; a form that cannot deliver is never rendered, and no success state
    // exists to be shown falsely (website improvement program, 2026-09-09).
    for (const code of publicComponents()) {
      expect(code).not.toContain("<InquiryForm");
      expect(code).not.toMatch(/<form[\s>]/);
      expect(code).not.toMatch(/thank you|message sent|we will respond within/i);
    }
  });

  it("gives every inquiry channel a routable subject and asks for no sensitive data", () => {
    const actions = stripComments(read("src/lib/public-site/actions.ts"));
    expect(actions).toContain("subject?: string");
    expect(actions).toContain("encodeURIComponent(destination.subject)");
    const contact = stripComments(read("src/lib/public-site/content/contact.ts"));
    expect(contact).toContain("do not send health information");
    for (const banned of [
      /health card|patient (name|record)|prescription number/i,
      /date of birth|social insurance|credit card|account number/i,
    ]) {
      expect(contact, String(banned)).not.toMatch(banned);
    }
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
      "homepage.whoWeAre.panels.map",
      "homepage.introduction",
      "homepage.clinicLifecycle.steps.map",
      "homepage.metabolic",
      "homepage.paths.map",
      "homepage.closing",
      "about.footprint",
      // Ordered by sortKey rather than by array position (round four).
      "orderedMilestones().map",
      "about.direction",
      "about.developing.lead",
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
    // Project photography goes through its own registry on the same terms.
    for (const source of publicComponents()) {
      expect(source).not.toContain("/lsh/graphics/projects/");
    }
    const clinicPage = stripComments(read(`${PUBLIC_DIR}/pages/clinic-solutions.tsx`));
    expect(clinicPage).toContain("getProjectPhotograph(");
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
    // Every brand photograph declares a registered crop rather than being left
    // to the source aspect. The homepage columns use the portrait crop added
    // in the 2026-09-10 design pass; the others stay square. Swept across
    // every public component that renders one, so a new placement cannot skip
    // the crop by not being on a hand-written list.
    const placements = publicComponentFiles().filter((file) => read(file).includes("<BrandImage"));
    expect(placements.length).toBeGreaterThan(0);
    for (const file of placements) {
      expect(read(file), file).toMatch(/presentation="(square|portrait|landscape)"/);
    }
    expect(brandImage()).toContain('presentation === "portrait"');
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
    expect(pharmacy).toContain('status: "Under evaluation"');
    // Boundaries blocks were internal guidance and left every page on 2026-09-09 (product owner);
    // the claims they guarded against stay banned below.
    expect(pharmacy).not.toContain("boundaries:");
    expect(stripComments(read("src/lib/public-site/content/partners.ts"))).not.toContain(
      "boundaries:",
    );
    for (const file of ["pharmacy", "partners"]) {
      expect(stripComments(read(`${PUBLIC_DIR}/pages/${file}.tsx`)), file).not.toMatch(
        /Boundaries/,
      );
    }
    expect(pharmacy).not.toMatch(/\bour pharmac(y|ies)\b/i);
    // Round three: the page must be able to say that holding licensed pharmacy
    // operations is under evaluation, so the ban targets the claim of having or
    // running one rather than the words themselves.
    expect(pharmacy).not.toMatch(/\b(our|its|the company's) licen[cs]ed pharmacy\b/i);
    expect(pharmacy).not.toMatch(
      /(operates?|owns?|runs?|holds?) an? licen[cs]ed pharmac(y|ies)\b/i,
    );
    expect(pharmacy).not.toMatch(/dispens(es|ing) (medication|prescriptions)/i);
    // And it must state which of the two pharmacy businesses this page is.
    expect(pharmacy).toContain("This page is about supplying pharmacies");
    expect(pharmacy).toContain("Supplying pharmacies and running one are different businesses");
    expect(pharmacy).toContain("none of them is offered, licensed or operating");
    expect(pharmacy).not.toMatch(
      /(acquire|acquisition of|closing|signed|announce[sd]?) (a |the )?pharmacy/i,
    );
    const page = stripComments(read(`${PUBLIC_DIR}/pages/pharmacy.tsx`));
    // The status line left the page on 2026-09-09 (product owner); the status still shows on each card.
    expect(page).not.toContain("status.sentence");
    expect(page).toContain('status: "In development"');
    // The value block (2026-09-09) is design intent, never a result or an operation; its hub
    // diagram is drawn from the registry and repeats the cards' copy.
    expect(page).toContain("items={hub.value.items}");
    expect(page).toContain(
      "<CarePathwayDiagram centre={hub.value.centre} items={hub.value.items} />",
    );
    // The diagram is typeset from the content model: a semantic list, no raster, no hard-coded copy.
    const diagram = carePathway();
    expect(diagram).toContain("<ul");
    expect(diagram).not.toMatch(/<img|next\/image|figcaption/);
    expect(diagram).not.toMatch(/For the pharmacy|supply platform/);
    expect(pharmacy).toContain("No pharmacy supply program is operating.");
    expect(pharmacy).not.toMatch(/\b(has|have) (helped|reduced|improved|delivered)\b/i);
    expect(pharmacy).not.toMatch(/subscription is available\b/i);
  });

  it("opens the homepage after the hero with the three-panel statement, stated as record, strategy, and ambition", () => {
    const home = stripComments(read("src/lib/public-site/content/home.ts"));
    for (const line of [
      "This is who we are",
      "This is where we are going",
      "This is where we want to be",
      "More than 25 years of operations",
      "The strategy is to build on the existing business",
      "The ambition is to become a global leader",
    ]) {
      expect(home, line).toContain(line);
    }
    // Trimmed on the product owner's instruction, later on 2026-09-09.
    expect(home).not.toContain("as cited in the 2025 annual-report narrative, and a founding");
    expect(home).not.toContain("standfirst");
    // The utility strip carries no hover rule; the primary menu keeps it.
    expect(layout()).toContain('variant="utility"');
    expect(layout()).toContain("border-t-2 border-white/15 border-t-[var(--lsh-brand-red)]");
    for (const banned of [
      /a decade/i,
      /we are growing/i,
      /we are acquiring/i,
      /has acquired|have acquired/i,
      /one of the largest/i,
      /\bannually\b/i,
    ]) {
      expect(home, String(banned)).not.toMatch(banned);
    }
    // The panels sit between the hero and the group introduction.
    const page = stripComments(read(`${PUBLIC_DIR}/pages/home.tsx`));
    expect(page.indexOf("homepage.whoWeAre")).toBeGreaterThan(page.indexOf("<PublicHero"));
    expect(page.indexOf("homepage.whoWeAre")).toBeLessThan(page.indexOf("homepage.introduction"));
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
    // The growth paragraph (after the prior site's "Our growth strategy") is strategy and
    // objective, never a transaction under way or an available service.
    expect(page).toContain("{about.developing.lead}");
    expect(page).toContain("{item.detail}");
    expect(aboutContent).toContain("The growth strategy is to acquire profitable operations");
    // Neither developing program may read as purchasable, and neither carries a
    // launch date (round three replaced the older double-hedge with this).
    expect(aboutContent).toContain("Neither program is available today, and no launch date is set");
    // Supplying pharmacies and running one stay distinguishable here too.
    expect(aboutContent).toContain("Supplying pharmacies and running one are different businesses");
    for (const banned of [
      /we are acquiring/i,
      /has acquired|have acquired/i,
      /(acquire|acquisition of|closing|signed|announce[sd]?) (a |the )?pharmacy/i,
      /now available|available now/i,
    ]) {
      expect(aboutContent, String(banned)).not.toMatch(banned);
    }
    // The developing grid is the last block before the layout closes.
    expect(page.trimEnd()).toMatch(
      /about\.developing\.items\.map[\s\S]*?<\/section>\s*<\/LifeSupplyLayout>\s*\);\s*}\s*$/,
    );
    // The hero backdrop and two bands, each decorative, drawn from the registry, never a path literal.
    expect(page).toContain('media={<HeroBackdrop band="data" />}');
    expect((page.match(/<ParallaxBand\b/g) ?? []).length).toBe(2);
    expect(page).toMatch(
      /<ParallaxBand\s+band="desk"\s+tone="redLight"\s+eyebrow=\{about\.bands\.desk\.eyebrow\}/,
    );
    expect(page).toMatch(
      /<ParallaxBand\s+band="warehouse"\s+tone="ink"\s+eyebrow=\{about\.bands\.warehouse\.eyebrow\}/,
    );
    // The band lines repeat approved copy only: the three cited figures and the brand count.
    expect(aboutContent).toContain(
      "More than 25 years of operations, more than 50,000 products, more than 1 million customers served.",
    );
    expect(aboutContent).toContain(
      "Four operating websites in Canada and the United States, behind one group.",
    );
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
  /**
   * The body of one function in a source file, up to the next top-level
   * function. Clinic Solutions became one page with four sections on
   * 2026-09-10, so a rule that used to be "this page does not contain X" is
   * now "this section does not contain X" — the same rule, read at the
   * granularity the page now has.
   */
  const sectionBody = (source: string, name: string): string => {
    const body = bodyOf(source, name);
    expect(body, name).not.toBe("");
    return body;
  };
  const brandPages = () => stripComments(read(`${PUBLIC_DIR}/pages/brands.tsx`));
  // Shop & Services merged into the Medical Supplies stores section on
  // 2026-09-10, so the rules that were about that page now read this one.
  const storesPage = () => stripComments(read(`${PUBLIC_DIR}/pages/operations.tsx`));
  const contactPage = () => stripComments(read(`${PUBLIC_DIR}/pages/contact.tsx`));
  const clinicsContent = () => stripComments(read("src/lib/public-site/content/clinics.ts"));

  it("keeps clinic development distinct from patient care on every clinic page", () => {
    // The distinction sentence is content; every Clinic Solutions page and
    // the Clinics brand page render it. Nothing anywhere describes owned
    // clinics or patient care as a company service.
    expect(clinicsContent()).toContain("does not operate patient-care clinics");
    // Two statements of the boundary, each in the section it bounds (page
    // redesign, 2026-09-10). It used to sit in a grey box at position two,
    // ahead of everything it qualified; the planning section now carries it
    // where a reader has just learned what the service is, and the
    // ongoing-supplies section states it in its own words because that reader
    // is buying rather than building (round four, change 5).
    expect(sectionBody(clinicPages(), "PlanningSection")).toContain("{hub.planning.boundary}");
    expect(sectionBody(clinicPages(), "OngoingSuppliesSection")).toContain("{page.boundary}");
    expect(clinicsContent()).toContain("It does not operate patient-care clinics");
    expect(clinicsContent()).toContain(
      "LifeSupply does not operate patient-care clinics and takes no part in clinical decisions",
    );
    expect(clinicPages()).toContain("{page.boundary}");
    for (const source of [content(), ...publicComponents()]) {
      expect(source).not.toMatch(/\bour (patient-care )?clinics\b/i);
      expect(source).not.toMatch(/\bpatient care (is|we) (provided|provide)/i);
    }
  });

  it("attributes delivery roles only as the Clinics site states them", () => {
    // The work is attributed to LifeSupply Clinics and its core partners, and
    // no further. It is said once, in the planning section, where the reader
    // has just learned what the service is; the projects section used to
    // restate it (product owner, 2026-09-11).
    expect(clinicsContent()).toContain("delivers the construction with its core partners");
    expect((clinicsContent().match(/core partners/g) ?? []).length).toBe(1);
    expect(clinicsContent()).not.toContain("this site attributes no construction work");
    expect(sectionBody(clinicPages(), "ProjectsSection")).not.toContain("{attribution}");
    // And the projects are claimed as projects, not as six completed builds:
    // what is published is six project pages, one of which does not describe
    // construction at all.
    expect(clinicsContent()).toContain("Six clinic projects across British Columbia");
    expect(clinicsContent()).not.toMatch(/clinics built/i);
  });

  it("treats post-opening supply as conditional on every clinic page", () => {
    expect(clinicsContent()).toMatch(
      /Projects, equipment purchases, and ongoing supplies are scoped and agreed separately/,
    );
    // One closing band, carrying the sequence qualification.
    //
    // The ongoing-supplies section used to carry a "Discussed case by case"
    // note listing four services the site does not offer. What matters is not
    // that the absence is announced but that nothing beyond the published
    // scope is ever claimed, so that is what this asserts (product owner,
    // 2026-09-11).
    expect((clinicPages().match(/<ClosingBand \/>/g) ?? []).length).toBe(1);
    expect(clinicPages()).toContain("{close.qualification}");
    const hrefs = clinicsContent().match(
      /https:\/\/(?:lifesupply\.ca|wellmartmedical\.com)\/[a-z-]+\//g,
    );
    expect(hrefs, "the supply section names published store categories").not.toBeNull();
    expect((hrefs ?? []).length).toBeGreaterThanOrEqual(4);
    for (const unclaimed of [
      /par-level/i,
      /automatic replenishment/i,
      /contracted procurement/i,
      /approved substitution/i,
    ]) {
      expect(clinicsContent(), String(unclaimed)).not.toMatch(unclaimed);
    }
    // And the supplies page points at the project service rather than
    // explaining it, so a buying clinic is not made to read project terms.
    expect(clinicsContent()).toContain("are a separate service, for British Columbia projects");
  });

  it("never restates store terms: thresholds, delivery times, or prices", () => {
    for (const source of [content(), ...publicComponents()]) {
      expect(source).not.toMatch(/\$\s?\d{2,3}(\.\d{2})?\b(?![KM])/);
      expect(source).not.toMatch(/business days/i);
      expect(source).not.toMatch(/free shipping (on|over|in) /i);
    }
    expect(storesPage()).not.toMatch(/add to cart|checkout|\bprice\b/i);
  });

  it("reads categories, support channels, and project links from the registries and content", () => {
    expect(brandPages()).toContain("record.categories.map");
    expect(brandPages()).toContain("record.storeLinks.map");
    expect(clinicPages()).toContain("projects.items");
    expect(contactPage()).toContain("contact.intents.map");
    expect(contactPage()).toContain("contact.existingOrder");
    // The stores section renders the registry, not a hand-written list, and
    // still states each store's geography and its own support channel.
    expect(storesPage()).toContain("stores.map");
    expect(storesPage()).toContain("brandGeography(record)");
    expect(storesPage()).toContain("record.supportEmail");
    expect(storesPage()).toContain("{hub.stores.support.text}");
  });

  it("gives every Stage 3 page one PublicHero and the shared layout", () => {
    for (const source of [clinicPages(), brandPages(), storesPage(), contactPage()]) {
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

  it("states the availability and the clinical boundary once, above everything they qualify", () => {
    const page = metabolicPage();
    // Metabolic Health is one page since 2026-09-10, so the band renders once
    // — but it must render before any pathway, or a reader reaches a pathway
    // without the status that qualifies it.
    // The availability statement is in the hero, and the two boundaries that
    // qualify the page are in one band beneath it. A status band, a separate
    // disclaimer and an "Important information" list of four carried these
    // between them before 2026-09-11, saying "not available" five times.
    expect((page.match(/<BoundariesBand \/>/g) ?? []).length).toBe(1);
    const body = page.slice(page.indexOf("export function MetabolicHealthPage("));
    expect(body.indexOf("<BoundariesBand />")).toBeLessThan(body.indexOf("<PathwaysSection />"));
    expect(metabolicContent()).toContain("no pathway and no program can be ordered yet");
    // And every pathway still carries its own status in the catalogue row.
    expect(stripComments(read(`${PUBLIC_DIR}/pathway-comparison.tsx`))).toContain("p.status");
    expect(
      (metabolicContent().match(/can be ordered yet/g) ?? []).length,
      "the availability statement is made once, in the hero",
    ).toBe(1);
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
    // Today's position, not a permanent prohibition (round two, 2026-09-10).
    expect(c).toContain("on this site today");
    // No recurring-arrangement process is described, because none exists (round two review).
    expect(c).not.toMatch(/would be proposed separately|recurring arrangement/i);
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
    // Items come only from the published read model; the page authors none.
    expect(page).toContain("current.data.map");
    expect(page).toContain("resources.data.map");
    // A section that fetched cleanly and returned nothing is left out rather than
    // announcing itself as empty (2026-09-09); an outage still says so.
    expect((page.match(/isEmpty\(/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(page).toContain("sections.current.unavailable");
    expect(page).toContain("sections.resources.unavailable");
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

  it("routes the three clinic audiences once, with supply needing no project", () => {
    // The page asked the same routing question three times before saying
    // anything: a section-navigation strip, a two-card "which do you need",
    // and a three-card "plan / equip / supply", all pointing at the same
    // places. One router replaced them on 2026-09-10, and this asserts there
    // is exactly one.
    const c = stripComments(read("src/lib/public-site/content/clinics.ts"));
    const page = stripComments(read(`${PUBLIC_DIR}/pages/clinic-solutions.tsx`));

    // Three routes, each naming the section it goes to.
    for (const href of ["#planning", "#equipment", "#ongoing-supplies"]) {
      expect(c, href).toContain(`href: "${href}"`);
    }
    expect(c).toContain('href: "#collaboration"');
    expect((page.match(/router\.routes\.map/g) ?? []).length).toBe(1);

    // A clinic already open must recognise itself immediately, and supply
    // must never be described as depending on a project.
    expect(c).toContain("Already seeing patients");
    expect(c).toContain("with no construction project involved");
    expect(c).not.toMatch(/supply (requires|needs) a (project|build)/i);

    // The router comes before every section it routes to.
    const body = page.slice(page.indexOf("export function ClinicSolutionsPage("));
    expect(body.indexOf("<Router />")).toBeGreaterThan(-1);
    for (const section of [
      "<PlanningSection />",
      "<EquipmentSection />",
      "<OngoingSuppliesSection />",
      "<CollaborationSection />",
    ]) {
      expect(body.indexOf("<Router />"), section).toBeLessThan(body.indexOf(section));
    }
    // And it is one control, not three: no second router survives.
    expect(page).not.toContain("hub.entry");
    expect(page).not.toContain("hub.needs");
    expect(page).not.toContain("<OnThisPage");
  });

  it("keeps clinic collaboration distinct from procurement and pharmacy programs non-drug", () => {
    const c = stripComments(read("src/lib/public-site/content/partners.ts"));
    // Clinic collaboration moved to the Clinic Solutions page on 2026-09-10,
    // and it is not left behind in the partners model as dead copy.
    //
    // What is asserted is the rule, not a heading. A "Collaboration is not
    // procurement" box stated it until 2026-09-11; it repeated the section
    // introduction and the Pilots item beside it, and defined the subject by
    // what it is not, which is how a compliance file reads rather than a page.
    // The introduction now says buying needs none of it, and every item
    // carries its own status.
    const clinics = stripComments(read("src/lib/public-site/content/clinics.ts"));
    expect(clinics).toMatch(/(not|none of it is) needed to order supplies/i);
    expect(clinics).toContain("a customer of the store, on that store's own terms");
    expect(clinics).toContain('status: "Proposed"');
    // Nothing proposed may read as a service that is running.
    expect(clinics).toContain("no pilot is running today");
    expect(clinics).toContain("in development and not yet running");
    // And the callout must still render both, not just the headline.
    const callout = bodyOf(
      stripComments(read(`${PUBLIC_DIR}/pages/clinic-solutions.tsx`)),
      "CollaborationSection",
    );
    expect(callout).toContain("{section.text}");
    expect(callout).toContain("{section.note}");
    expect(callout).toContain("{section.status}");
    expect(c).not.toContain("Collaboration is not procurement");
    // The pharmacy partner programme moved to Pharmacy Solutions on
    // 2026-09-10. Its non-drug rule travelled with it and is not left behind.
    const pharmacyContent = stripComments(read("src/lib/public-site/content/pharmacy.ts"));
    expect(pharmacyContent).toContain("Medication is excluded from every configuration");
    // The boundary is stated as what LifeSupply would and would not do,
    // rather than as a claim about what a prescription is touched by.
    expect(pharmacyContent).toContain("it would not dispense");
    expect(pharmacyContent).toContain("non-drug items only");
    expect(c).not.toContain("Medication is excluded from every configuration");
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
    for (const route of ["src/app/contact/page.tsx", "src/app/investor-relations/page.tsx"]) {
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

/**
 * Website consolidation, stage 1 (2026-09-10).
 *
 * Four addresses were retired into sections of two pages. The failure modes
 * that matters here are silent: a redirect that lands on a fragment nothing
 * renders, an internal link still pointing at a retired address, or a
 * section that only reveals itself once JavaScript runs. None of the three
 * shows up in a type check, and the first two look fine until someone
 * follows the link.
 */
describe("website consolidation: sections, redirects and deep links", () => {
  const PAGES_BY_ROUTE: Record<string, string> = {
    [LIFE_SUPPLY_ROUTES.operations]: `${PUBLIC_DIR}/pages/operations.tsx`,
    [STAGE_3_ROUTES.clinicSolutions]: `${PUBLIC_DIR}/pages/clinic-solutions.tsx`,
    [PHARMACY_ROUTES.hub]: `${PUBLIC_DIR}/pages/pharmacy.tsx`,
    [METABOLIC_ROUTES.hub]: `${PUBLIC_DIR}/pages/metabolic.tsx`,
    [LIFE_SUPPLY_ROUTES.contact]: `${PUBLIC_DIR}/pages/contact.tsx`,
    [LIFE_SUPPLY_ROUTES.team]: `${PUBLIC_DIR}/pages/team.tsx`,
  };

  it("renders every section anchor the registry declares", () => {
    for (const [route, anchors] of Object.entries(SECTION_ANCHORS)) {
      const file = PAGES_BY_ROUTE[route];
      // A page that declares anchors but has no component here would sail
      // through the loop silently, so the mapping is asserted, not assumed.
      expect(file, route).toBeTruthy();
      const source = stripComments(read(file!));
      for (const anchor of anchors) {
        // The whole section is the target, not a heading floating above its
        // own content, so a reader who follows a redirect lands on the block.
        // The eight pathway anchors come from one mapped component rather
        // than eight literals, so that form counts too.
        const literal = source.includes(`<AnchoredSection id="${anchor}"`);
        const mapped =
          ((KIT_SLUGS as readonly string[]).includes(anchor) &&
            source.includes("id={kit.slug}") &&
            source.includes("metabolic.kits.map")) ||
          // The four profile anchors likewise come from one mapped component.
          ((PROFILE_ANCHORS as readonly string[]).includes(anchor) &&
            source.includes("id={profile.anchor}") &&
            source.includes("team.legacyProfiles.map"));
        expect(literal || mapped, `${route}#${anchor}`).toBe(true);
      }
    }
  });

  it("clears the sticky header on every anchor target and needs no JavaScript to do it", () => {
    const code = onThisPage();
    // `scroll-mt` is what keeps a jumped-to heading from sitting under the
    // sticky header. It belongs on the target, not on the navigation.
    expect(code).toContain("scroll-mt-24");
    // Plain anchors: real text for a screen reader, and the browser's own
    // fragment handling does the scrolling. No scripted scroll, no handler,
    // and nothing that makes the section a client component.
    expect(code).toContain("href={item.href}");
    expect(code).not.toMatch(/onClick|scrollIntoView|useEffect|"use client"/);
    expect(code).toContain("aria-label={label}");
  });

  it("links to the destination directly, never to an address that now redirects", () => {
    const retired = Object.values(CONSOLIDATED_ROUTES);
    for (const file of [...publicComponentFiles(), ...publicContentFiles()]) {
      const source = stripComments(read(file));
      for (const path of retired) {
        // The unslashed form too, since that is the canonical shape a
        // hand-written href would most plausibly take.
        for (const form of [path, path.replace(/\/$/, "")]) {
          expect(source, `${file} → ${form}`).not.toContain(`"${form}"`);
          expect(source, `${file} → ${form}`).not.toContain(`href="${form}`);
        }
      }
    }
  });

  it("redirects every retired address permanently, by exact path, to a real fragment", () => {
    const config = stripComments(read("next.config.ts"));
    const destinations: Record<string, string> = {
      "/shop": "/medical-supply-solutions#stores",
      "/clinic-solutions/equipment": "/clinic-solutions#equipment",
      "/clinic-solutions/ongoing-supplies": "/clinic-solutions#ongoing-supplies",
      "/partners/clinics": "/clinic-solutions#collaboration",
      "/partners/pharmacies": "/pharmacy-solutions#partner-program",
      "/metabolic-health/care-kits": "/metabolic-health#pathways",
      "/metabolic-health/refills": "/metabolic-health#replenishment",
      "/partners": "/contact#business-inquiries",
      "/abdul-ladha": "/our-team#abdul-ladha",
      "/keith-dolo-2": "/our-team#keith-dolo",
      "/barrett-e-g-sleeman": "/our-team#barrett-sleeman",
      "/david-vogt": "/our-team#david-vogt",
      // Every pathway address keeps its slug as its anchor.
      ...Object.fromEntries(
        KIT_SLUGS.map((slug) => [
          `/metabolic-health/care-kits/${slug}`,
          `/metabolic-health#${slug}`,
        ]),
      ),
    };
    for (const [from, to] of Object.entries(destinations)) {
      expect(config, from).toContain(`source: "${from}"`);
      expect(config, to).toContain(`destination: "${to}"`);
    }
    // The `/partners` hazard, asserted rather than trusted: retiring the
    // clinic child must never be written as a prefix match, because
    // `/partners/suppliers` and `/partners/acquisitions` are retained pages.
    expect(config).not.toMatch(/source: "\/partners\/?(:path\*|\*)/);
    expect(config).not.toContain('source: "/clinic-solutions/:path*"');
    for (const retained of ["suppliers", "acquisitions"]) {
      expect(config, retained).not.toContain(`source: "/partners/${retained}"`);
      expect(existsSync(join(ROOT, `src/app/partners/${retained}/page.tsx`)), retained).toBe(true);
    }
    // And the retired route files are actually gone, so nothing serves a 200
    // at an address that is supposed to redirect.
    for (const gone of [
      "src/app/shop/page.tsx",
      "src/app/clinic-solutions/equipment/page.tsx",
      "src/app/clinic-solutions/ongoing-supplies/page.tsx",
      "src/app/partners/clinics/page.tsx",
      "src/app/partners/pharmacies/page.tsx",
      "src/app/metabolic-health/care-kits/page.tsx",
      "src/app/metabolic-health/care-kits/[kit]/page.tsx",
      "src/app/metabolic-health/refills/page.tsx",
      "src/app/partners/page.tsx",
      "src/app/[slug]/page.tsx",
    ]) {
      expect(existsSync(join(ROOT, gone)), gone).toBe(false);
    }
  });

  it("renders the Solutions menu without a page behind it, reachable without hover", () => {
    const layout = stripComments(read(LAYOUT));
    // A group with no hub renders its label as the disclosure button rather
    // than as a link that goes nowhere, and its panel has no "Overview" row.
    expect(layout).toContain("group.href === null");
    // The menu never depends on hover: a real button with aria-expanded and
    // aria-controls drives it, on desktop and in the mobile panel alike.
    expect((layout.match(/aria-expanded=\{/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(layout).toContain("aria-controls={`lsh-menu-${group.key}`}");
    expect(layout).toContain("aria-controls={`lsh-mobile-group-${group.key}`}");
    // Escape closes the desktop panel.
    expect(layout).toContain('if (event.key === "Escape") setOpen(false)');
    // No `/solutions` route file was created for a menu that is only a menu.
    expect(existsSync(join(ROOT, "src/app/solutions"))).toBe(false);
  });

  it("carries the content of every retired page into the section that replaced it", () => {
    const clinics = stripComments(read("src/lib/public-site/content/clinics.ts"));
    const businesses = stripComments(read("src/lib/public-site/content/businesses.ts"));
    // Equipment: the quote request and the catalogue boundary.
    expect(clinics).toContain("What a quote request needs");
    expect(clinics).toContain("priced by quote rather than listed");
    // Ongoing supplies: the published categories a practice can actually buy.
    expect(clinics).toContain("What a practice can source");
    expect(clinics).toContain("https://lifesupply.ca/clinic-supplies/");
    // Collaboration and the design partnership, with their statuses intact
    // and distinct: one is proposed, the other is available today.
    for (const status of ["Proposed", "Available through LifeSupply Clinics"]) {
      expect(clinics, status).toContain(status);
    }
    expect(
      bodyOf(stripComments(read(`${PUBLIC_DIR}/pages/clinic-solutions.tsx`)), "PlanningSection"),
    ).toContain("{hub.planning.partnershipStatus}");
    // Shop & Services: geography, currency, and the support boundary.
    expect(businesses).toContain("Geography and currency");
    expect(businesses).toContain("Support boundary");
    expect(businesses).toContain("this site cannot see or change store orders");
    expect(businesses).toContain("This corporate site does not sell products or take orders.");
  });

  it("keeps every pathway whole after the eight pages became eight sections", () => {
    const page = stripComments(read(`${PUBLIC_DIR}/pages/metabolic.tsx`));
    // Each part the pathway pages carried is rendered by the section that
    // replaced them. Dropping any one of these would lose information that
    // only existed on a page that no longer answers.
    for (const part of [
      "{kit.audience}",
      "kit.roles.map",
      "kit.compatibility.map",
      "kit.exclusions.map",
      "<BrowseLinks kit={kit} />",
      "items={kit.faqs}",
    ]) {
      expect(page, part).toContain(part);
    }
    // Replenishment and the pharmacy programme likewise.
    expect(page).toContain("{refills.later.text}");
    expect(page).toContain("{refills.substitutions}");
    const pharmacyPage = stripComments(read(`${PUBLIC_DIR}/pages/pharmacy.tsx`));
    expect(pharmacyPage).toContain("partnerProgram.model.items.map");
    expect(pharmacyPage).toContain("partnerProgram.responsibilities.items.map");
    // And a pathway is still never sold: it is a configurable starting point.
    const content = stripComments(read("src/lib/public-site/content/metabolic.ts"));
    expect(content).toMatch(/configurable starting point rather than a product/);
    expect(page).not.toMatch(/add to cart|buy now|subscribe/i);
  });
});
