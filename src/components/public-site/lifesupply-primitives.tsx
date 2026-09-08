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
 *   ImageBand exists because both bundled marks are white on a transparent
 *   ground. Rendered on paper they vanish — which is exactly how the portfolio
 *   lockup shipped on /about-us/. The band gives them the ink field they need.
 *
 * Every visible sentence arrives as a prop from lifesupply-content.ts. The
 * only strings authored here are imperative UI labels.
 */
import Image from "next/image";
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
  as?: "p" | "h2" | "h3";
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
}: {
  eyebrow: string;
  title: string;
  description?: string;
  size?: "home" | "page";
  actions?: React.ReactNode;
  /** Optional decorative media layer (HeroVideo) rendered beneath the colour field. */
  media?: React.ReactNode;
}) {
  const isHome = size === "home";
  return (
    <section
      className={`relative overflow-hidden bg-[var(--lsh-ink)] px-5 text-white lg:px-8 ${
        isHome ? "pb-20 pt-16 lg:pb-28 lg:pt-24" : "py-16 lg:py-24"
      } ${media ? "flex min-h-[32rem] items-center lg:min-h-[42rem]" : ""}`}
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
            ? "[background-image:radial-gradient(circle_at_85%_10%,rgba(222,0,0,0.5),transparent_32%),linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.8)_45%,rgba(0,0,0,0.55)_100%)]"
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
          <Eyebrow tone="onDark">{eyebrow}</Eyebrow>
          <h1
            className={`lsh-display mt-5 ${
              isHome
                ? "text-[clamp(2.5rem,7.2vw,5.75rem)] leading-[0.94]"
                : "text-[clamp(2rem,5vw,4rem)] leading-[1.02]"
            }`}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={`mt-6 max-w-2xl leading-8 text-white/80 ${isHome ? "text-lg" : "text-base sm:text-lg"}`}
            >
              {description}
            </p>
          ) : null}
          {actions ? <div className="mt-9 flex flex-wrap gap-3">{actions}</div> : null}
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
  description?: string;
  tone?: Tone;
  className?: string;
}) {
  const dark = tone === "onDark";
  return (
    <div className={`max-w-3xl ${className}`.trim()}>
      <Eyebrow tone={dark ? "onDark" : "red"}>{eyebrow}</Eyebrow>
      <h2
        className={`lsh-display mt-4 text-3xl leading-[1.08] sm:text-4xl ${
          dark ? "text-white" : "text-[var(--lsh-charcoal)]"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base leading-7 ${dark ? "text-white/75" : "text-[var(--lsh-muted)]"}`}
        >
          {description}
        </p>
      ) : null}
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
 *   hero     an outlined action alongside the hero's other actions
 *   header   the earlier header-row placement, kept for compatibility
 */
export function CommandCenterLoginLink({
  variant = "hero",
}: {
  variant?: "utility" | "menu" | "hero" | "header";
}) {
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

  if (variant === "menu") {
    return (
      <a
        href={href}
        className="lsh-display mt-2 inline-flex items-center gap-2 text-xs text-white/85 transition-colors hover:text-white"
      >
        <LogIn size={14} aria-hidden="true" /> Command Center login
      </a>
    );
  }

  const className =
    variant === "header"
      ? "lsh-display hidden items-center gap-2 border border-white/45 px-4 py-2 text-[10px] text-white transition-colors hover:border-white hover:bg-white hover:text-black sm:inline-flex"
      : `${ACTION_BASE} border border-white/45 text-white hover:border-white hover:bg-white hover:text-black`;
  return (
    <a href={href} className={className}>
      Command Center login <ExternalLink size={variant === "header" ? 13 : 16} aria-hidden="true" />
    </a>
  );
}

/** A reported figure with its source qualification. Red top rule, condensed numeral. */
export function EditorialStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] px-5 py-7 shadow-sm">
      <p className="lsh-display text-4xl text-[var(--lsh-charcoal)]">{value}</p>
      <p className="mt-3 text-sm leading-5 text-[var(--lsh-muted)]">{label}</p>
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

/**
 * An ink field for original artwork that only reads on a dark ground.
 *
 * Both bundled marks are white on transparent. This gives them charcoal and a
 * red top rule, keeps their intrinsic ratio through next/image, and never
 * upscales beyond a modest factor via `maxWidth`.
 */
export function ImageBand({
  src,
  alt,
  width,
  height,
  eyebrow,
  caption,
  maxWidth = "max-w-md",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  eyebrow?: string;
  caption?: string;
  maxWidth?: string;
}) {
  return (
    <figure className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white sm:p-10">
      {eyebrow ? (
        <Eyebrow tone="onDark" className="mb-6">
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 448px, 100vw"
        className={`h-auto w-full ${maxWidth}`}
      />
      {caption ? (
        <figcaption className="mt-5 max-w-xl text-sm leading-6 text-white/70">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
