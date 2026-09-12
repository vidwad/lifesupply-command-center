/**
 * Shared primitives for the public LifeSupply site.
 *
 * These are the reusable blocks docs/40 asks for, extracted from markup that
 * the first restoration pass repeated across the header, hero, menu, and pages.
 * They are deliberately plain: no "use client", no state, no data access. The
 * client-side layout and the server-rendered pages both import them.
 *
 * Two of them carry a rule, not just a style:
 *
 *   CommandCenterLoginLink is the ONLY place the public UI renders the login
 *   destination, and it can only ever call getCommandCenterLoginUrl(). That is
 *   what keeps a public Vercel visitor pointed at the protected Render login
 *   and never at a same-host /dashboard. public-boundary.test.ts enforces it.
 *
 * Every visible sentence arrives as a prop from lifesupply-content.ts. The
 * only strings authored here are imperative UI labels.
 */
import Link from "next/link";
import { ArrowRight, ExternalLink, LogIn } from "lucide-react";

import { getCommandCenterLoginUrl } from "@/lib/public-site/command-center";

type Tone = "onLight" | "onDark";

/** Page-width column. One definition of the content measure for every section. */
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mx-auto max-w-7xl px-5 lg:px-8 ${className}`.trim()}>{children}</div>;
}

/**
 * The tracked, condensed, uppercase label that opens every section.
 *
 * Colour is chosen by the field it sits on, because brand red is only
 * accessible as small text on light fields:
 *   red     paper / surface  — 5.15:1 and 4.52:1
 *   onDark  ink / charcoal   — the lifted --lsh-red-on-ink, 5.9:1 and 4.8:1
 *   onRed   brand-red band   — pure white; anything less fails
 *
 * `as` lets a label that names a section be its heading ("Mission",
 * "Explore") instead of a paragraph, so heading navigation lands on the label
 * rather than on the sentence that follows it.
 */
export function Eyebrow({
  tone = "red",
  as: Tag = "p",
  className = "",
  children,
}: {
  tone?: "red" | "onDark" | "onRed";
  /**
   * `h4` was added on 2026-09-10: the consolidated pages nest a section
   * heading (h2), a pathway heading (h3) and labelled blocks inside it, and a
   * label that is really a fourth-level heading should say so rather than
   * skip a level to h3 or pretend to be a paragraph.
   */
  as?: "p" | "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
}) {
  const color =
    tone === "red"
      ? "text-[var(--lsh-brand-red)]"
      : tone === "onDark"
        ? "text-[var(--lsh-red-on-ink)]"
        : "text-white";
  return <Tag className={`lsh-display text-[11px] ${color} ${className}`.trim()}>{children}</Tag>;
}

/** The legacy red baseline rule. Decorative; hidden from assistive tech. */
export function RedRule({ className = "w-28" }: { className?: string }) {
  return <div className={`h-1 bg-[var(--lsh-brand-red)] ${className}`} aria-hidden="true" />;
}

/**
 * Full-width ink hero with the single h1 for the route.
 *
 * `size="home"` is the oversized landing statement; `size="page"` is the
 * route-title hero every other page shares. Both scale the heading with
 * clamp() so condensed uppercase copy never becomes a wall of capitals on a
 * narrow screen (docs/40 responsive requirement).
 */
export function PublicHero({
  eyebrow,
  title,
  description,
  size = "page",
  actions,
  media,
  scrim = "standard",
}: {
  eyebrow: string;
  title: string;
  /** One paragraph, or several when the hero introduces the whole page. */
  description?: string | readonly string[];
  size?: "home" | "page";
  actions?: React.ReactNode;
  /** Optional decorative media layer rendered beneath the colour field. */
  media?: React.ReactNode;
  /**
   * `light` thins the scrim so a photographic hero reads as a picture rather
   * than as a dark field (product owner, 2026-09-12). The left stop stays
   * dark enough for the copy; only the right half opens up.
   */
  scrim?: "standard" | "light";
}) {
  const isHome = size === "home";
  return (
    <section
      className={`relative overflow-hidden bg-[var(--lsh-ink)] px-5 text-white lg:px-8 ${
        isHome ? "pb-16 pt-12 lg:pb-20 lg:pt-16" : "py-14 lg:py-20"
      } ${media ? "flex min-h-[24rem] items-center lg:min-h-[30rem]" : ""}`}
    >
      {media}
      {/*
       * The colour field. Without media it is the composed ink ground docs/40
       * asks for instead of stock imagery. Over footage it thins to a
       * left-heavy scrim so the copy keeps its contrast where it sits while
       * the scene shows through on the right, with the red hue kept at the
       * top corner.
       */}
      <div
        className={`absolute inset-0 ${
          media
            ? scrim === "light"
              ? "[background-image:radial-gradient(circle_at_85%_10%,rgba(222,0,0,0.45),transparent_34%),linear-gradient(105deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.62)_45%,rgba(0,0,0,0.3)_100%)]"
              : "[background-image:radial-gradient(circle_at_85%_10%,rgba(222,0,0,0.5),transparent_32%),linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.8)_45%,rgba(0,0,0,0.55)_100%)]"
            : "[background-image:radial-gradient(circle_at_85%_10%,rgba(222,0,0,0.55),transparent_30%),linear-gradient(120deg,rgba(29,29,29,0.98),rgba(0,0,0,1))]"
        }`}
        aria-hidden="true"
      />
      <RedRule className={`absolute bottom-0 left-0 ${isHome ? "w-40" : "w-28"}`} />
      <div className="relative mx-auto w-full max-w-7xl">
        <div
          className={`border-l-4 border-[var(--lsh-brand-red)] pl-5 sm:pl-7 ${
            isHome ? "max-w-5xl" : "max-w-4xl"
          }`}
        >
          {/*
           * Round four, change 2. The eyebrow, the heading, the sentence and
           * the actions are plain elements that are legible at the first
           * frame. `lsh-enter` slides them up by a few pixels in CSS and never
           * touches opacity, so nothing here waits for JavaScript, an
           * observer or an animation to finish before it can be read. The
           * staggered delays are decoration and collapse under reduced motion.
           */}
          <div className="lsh-enter">
            <Eyebrow tone="onDark">{eyebrow}</Eyebrow>
          </div>
          {/* The single h1 for the route. */}
          <h1
            className={`lsh-display lsh-enter mt-5 ${
              isHome
                ? "text-[clamp(2.25rem,5.4vw,4.25rem)] leading-[0.98]"
                : "text-[clamp(1.875rem,4.2vw,3.25rem)] leading-[1.04]"
            }`}
            style={{ "--lsh-enter-delay": "0.08s" } as React.CSSProperties}
          >
            {title}
          </h1>
          {(typeof description === "string" ? [description] : (description ?? [])).map(
            (paragraph, index) => (
              <p
                key={paragraph.slice(0, 40)}
                className={`lsh-enter max-w-2xl leading-8 text-white/80 ${index === 0 ? "mt-6" : "mt-4"} ${isHome ? "text-lg" : "text-base sm:text-lg"}`}
                style={
                  {
                    "--lsh-enter-delay": `${0.16 + index * 0.04}s`,
                  } as React.CSSProperties
                }
              >
                {paragraph}
              </p>
            ),
          )}
          {actions ? (
            <div
              className="lsh-enter mt-9 flex flex-wrap gap-3"
              style={{ "--lsh-enter-delay": "0.24s" } as React.CSSProperties}
            >
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Section opener: eyebrow, h2, optional standfirst. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "onLight",
  className = "",
}: {
  eyebrow: string;
  title: string;
  /** One standfirst, or several paragraphs in order. */
  description?: string | readonly string[];
  tone?: Tone;
  className?: string;
}) {
  const dark = tone === "onDark";
  const paragraphs = typeof description === "string" ? [description] : (description ?? []);
  return (
    <div className={`max-w-3xl ${className}`.trim()}>
      {/* A caller may omit the eyebrow where the band above it already
          carries one; the title then starts the block rather than leaving a
          phantom line of space above itself. */}
      {eyebrow ? <Eyebrow tone={dark ? "onDark" : "red"}>{eyebrow}</Eyebrow> : null}
      <h2
        className={`lsh-display text-3xl leading-[1.08] sm:text-4xl ${eyebrow ? "mt-4" : ""} ${
          dark ? "text-white" : "text-[var(--lsh-charcoal)]"
        }`}
      >
        {title}
      </h2>
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className={`mt-4 text-base leading-7 ${dark ? "text-white/75" : "text-[var(--lsh-muted)]"}`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

const ACTION_BASE =
  "lsh-display inline-flex items-center gap-2 px-5 py-3 text-[11px] transition-colors";

/** Brand-red filled action. Internal routes by default; `external` renders a plain anchor. */
export function PrimaryAction({
  href,
  external = false,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const className = `${ACTION_BASE} lsh-primary-action`;
  const icon = external ? (
    <ExternalLink size={16} aria-hidden="true" />
  ) : (
    <ArrowRight size={16} aria-hidden="true" />
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children} {icon}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children} {icon}
    </Link>
  );
}

/**
 * Outlined secondary action. Inverts on hover — white fill on ink, ink fill
 * on paper — which is the white/red/black action rhythm the legacy site used.
 */
export function SecondaryAction({
  href,
  tone = "onDark",
  external = false,
  children,
}: {
  href: string;
  tone?: Tone;
  external?: boolean;
  children: React.ReactNode;
}) {
  const className = `${ACTION_BASE} border ${
    tone === "onDark"
      ? "border-white/45 text-white hover:border-white hover:bg-white hover:text-black"
      : "border-[var(--lsh-rule-strong)] text-[var(--lsh-charcoal)] hover:border-black hover:bg-black hover:text-white"
  }`;
  const icon = external ? (
    <ExternalLink size={16} aria-hidden="true" />
  ) : (
    <ArrowRight size={16} aria-hidden="true" />
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children} {icon}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children} {icon}
    </Link>
  );
}

/**
 * The public entry to the Command Center. Exactly one source of truth.
 *
 * Always an external, same-tab anchor to the Render login. The visible text
 * is fixed — the Playwright smoke test locates this control by that name and
 * asserts its origin. Do not add a variant that takes an arbitrary href.
 *
 *   utility  the small icon-led link in the utility strip and footer row
 *   menu     the mobile navigation panel
 *
 * It is deliberately never a hero action: the Command Center is a
 * management tool, not a public destination (product owner, 2026-09-08).
 */
export function CommandCenterLoginLink({ variant }: { variant: "utility" | "menu" }) {
  const href = getCommandCenterLoginUrl();

  if (variant === "utility") {
    return (
      <a
        href={href}
        className="lsh-display inline-flex shrink-0 items-center gap-1.5 text-[10px] text-white/85 transition-colors hover:text-white"
      >
        <LogIn size={13} aria-hidden="true" /> Command Center login
      </a>
    );
  }

  return (
    <a
      href={href}
      className="lsh-display mt-2 inline-flex items-center gap-2 text-xs text-white/85 transition-colors hover:text-white"
    >
      <LogIn size={14} aria-hidden="true" /> Command Center login
    </a>
  );
}

/**
 * Split a reported figure into sign or unit, digits, and unit, so the
 * non-numeric parts can carry the brand colour. Figures render immediately:
 * they are financial and operating facts, not an animation (website
 * improvement program, 2026-09-09).
 */
function splitFigure(value: string): [string, string, string] {
  const match = /^([^\d]*)([\d.,]+)(.*)$/.exec(value);
  return match ? [match[1] ?? "", match[2] ?? "", match[3] ?? ""] : ["", value, ""];
}

/**
 * A reported figure with its source qualification: a red top rule, a large
 * condensed numeral that counts up on first view with its sign or unit in
 * brand red, a red hairline that extends on hover, and a faint red glow in
 * the corner. `size="large"` is the homepage treatment; the default suits
 * the investor pages' three-up figures.
 */
export function EditorialStat({
  value,
  label,
  size = "default",
}: {
  value: string;
  label: string;
  size?: "default" | "large";
}) {
  const hero = size === "large";
  return (
    <div
      className={`lsh-lift group relative h-full overflow-hidden border border-t-4 border-[var(--lsh-rule)] border-t-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] shadow-md ${
        hero ? "px-7 py-10 lg:px-9 lg:py-12" : "px-5 py-7"
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(222,0,0,0.16),transparent_68%)]"
      />
      <p
        data-stat="figure"
        className={`lsh-display relative leading-none tracking-tight text-[var(--lsh-charcoal)] ${
          hero ? "text-6xl sm:text-7xl lg:text-8xl" : "text-4xl sm:text-5xl"
        }`}
      >
        {splitFigure(value).map((part, index) =>
          index === 1 ? (
            part
          ) : (
            <span key={part} className="text-[var(--lsh-brand-red)]">
              {part}
            </span>
          ),
        )}
      </p>
      <span
        aria-hidden="true"
        className="mt-5 block h-0.5 w-10 bg-[var(--lsh-brand-red)] transition-[width] duration-500 group-hover:w-20 motion-reduce:transition-none"
      />
      <p
        className={`mt-4 leading-6 text-[var(--lsh-muted)] first-letter:uppercase ${hero ? "max-w-xs text-base" : "text-sm"}`}
      >
        {label}
      </p>
    </div>
  );
}

/**
 * The legacy red information band: a full-bleed brand-red field carrying one
 * condensed white statement. Used sparingly — one per page at most — so it
 * reads as emphasis rather than wallpaper.
 */
export function InfoBand({
  eyebrow,
  statement,
  action,
}: {
  eyebrow?: string;
  statement: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="lsh-on-red bg-[var(--lsh-brand-red)] px-5 py-12 text-white lg:px-8 lg:py-14">
      <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <Eyebrow tone="onRed">{eyebrow}</Eyebrow> : null}
          <p className="lsh-display mt-3 text-2xl leading-[1.08] sm:text-3xl lg:text-4xl">
            {statement}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </Container>
    </section>
  );
}
