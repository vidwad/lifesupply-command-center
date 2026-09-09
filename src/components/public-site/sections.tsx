/**
 * Section patterns for the public site (design pass, September 2026).
 *
 * The first build used one pattern everywhere: a hero, then bordered card
 * grids. These primitives give each page family a rhythm of its own:
 *
 * - `IconFeatureGrid`: icon, title, text tiles with a red hairline reveal.
 * - `SplitSection`: copy beside a conceptual graphic, alternating sides.
 * - `ProcessSteps`: numbered steps with a connecting rail and icons.
 * - `Callout`: a single qualified statement with an icon, for distinctions.
 * - `BentoGrid`: mixed-size tiles for hub pages, adapted from the 21st.dev
 *   "Feature Bento" layout (uilayout.contact) and restrained to the
 *   red/black/white system: no gradients, square corners, hairline rules.
 * - `GraphicBand`: a full-bleed conceptual graphic with a short statement.
 *
 * Every image is a registered graphic (graphics.ts) rendered through
 * next/image at its real size. Every sentence is a prop from the content
 * model. Motion comes from motion.tsx and collapses for reduced motion.
 */
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { iconFor, renderIcon } from "@/components/public-site/icons";
import { Container, Eyebrow, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { getGraphic, type GraphicKey } from "@/lib/public-site/graphics";

type Tone = "onLight" | "onSurface" | "onDark";

const SECTION_BG: Record<Tone, string> = {
  onLight: "bg-[var(--lsh-paper)]",
  onSurface: "bg-[var(--lsh-surface)]",
  onDark: "bg-[var(--lsh-ink)] text-white",
};

export function IconBadge({
  icon,
  tone = "onLight",
  size = 22,
}: {
  icon?: string;
  tone?: Tone;
  size?: number;
}) {
  if (!iconFor(icon)) return null;
  const dark = tone === "onDark";
  return (
    <span
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center border ${
        dark
          ? "border-white/20 bg-white/5 text-[var(--lsh-red-on-ink)]"
          : "border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] text-[var(--lsh-brand-red)]"
      }`}
      aria-hidden="true"
    >
      {renderIcon(icon, { size, strokeWidth: 1.75 })}
    </span>
  );
}

export function IconFeatureGrid({
  eyebrow,
  title,
  description,
  items,
  tone = "onLight",
  columns = 3,
  numbered = false,
}: {
  eyebrow?: string;
  title?: string;
  description?: string | readonly string[];
  items: readonly {
    title: string;
    text: string;
    icon?: string;
    status?: string;
    href?: string;
    linkLabel?: string;
  }[];
  tone?: Tone;
  columns?: 2 | 3 | 4;
  numbered?: boolean;
}) {
  const dark = tone === "onDark";
  const cols =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 4
        ? "md:grid-cols-2 xl:grid-cols-4"
        : "md:grid-cols-3";
  return (
    <section className={`${SECTION_BG[tone]} px-5 py-20 lg:px-8`}>
      <Container>
        {title ? (
          <Reveal>
            <SectionHeading
              tone={dark ? "onDark" : "onLight"}
              eyebrow={eyebrow ?? ""}
              title={title}
              description={description}
            />
          </Reveal>
        ) : null}
        <Stagger className={`grid gap-5 ${title ? "mt-12" : ""} ${cols}`}>
          {items.map((item, index) => {
            const inner = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <IconBadge icon={item.icon} tone={tone} />
                  {numbered ? (
                    <span
                      className={`lsh-display text-sm ${dark ? "text-[var(--lsh-red-on-ink)]" : "text-[var(--lsh-brand-red)]"}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  ) : item.status ? (
                    <span
                      className={`lsh-display border px-2 py-0.5 text-[10px] ${
                        dark
                          ? "border-white/30 text-white/80"
                          : "border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]"
                      }`}
                    >
                      {item.status}
                    </span>
                  ) : null}
                </div>
                <h3
                  className={`lsh-display mt-6 text-xl leading-tight ${dark ? "" : "text-[var(--lsh-charcoal)]"}`}
                >
                  {item.title}
                </h3>
                <p
                  className={`mt-3 leading-7 ${dark ? "text-white/75" : "text-[var(--lsh-muted)]"}`}
                >
                  {item.text}
                </p>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] after:absolute after:inset-0 after:content-[''] ${dark ? "text-[var(--lsh-red-on-ink)]" : "text-[var(--lsh-brand-red)]"}`}
                  >
                    {item.linkLabel ?? "Learn more"}{" "}
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </Link>
                ) : null}
              </>
            );
            const card = `lsh-lift group relative flex h-full flex-col border-t-2 p-7 transition-colors ${
              dark
                ? "border-white/20 bg-[var(--lsh-charcoal)] hover:border-[var(--lsh-red-on-ink)]"
                : "border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] hover:border-[var(--lsh-brand-red)]"
            }`;
            return (
              <StaggerItem key={item.title} className="h-full">
                <SpotlightCard className="h-full">
                  <article className={card}>{inner}</article>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}

export function SplitSection({
  eyebrow,
  title,
  children,
  graphic,
  side = "right",
  tone = "onLight",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  graphic: GraphicKey;
  side?: "left" | "right";
  tone?: Tone;
}) {
  const g = getGraphic(graphic);
  const dark = tone === "onDark";
  return (
    <section className={`${SECTION_BG[tone]} px-5 py-20 lg:px-8`}>
      <Container className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
        <Reveal className={side === "left" ? "lg:order-2" : ""}>
          <Eyebrow tone={dark ? "onDark" : "red"}>{eyebrow}</Eyebrow>
          <h2
            className={`lsh-display mt-4 text-3xl leading-[1.05] sm:text-4xl ${dark ? "" : "text-[var(--lsh-charcoal)]"}`}
          >
            {title}
          </h2>
          <div
            className={`mt-6 grid gap-4 leading-7 ${dark ? "text-white/75" : "text-[var(--lsh-muted)]"}`}
          >
            {children}
          </div>
        </Reveal>
        <Reveal delay={0.1} className={`group relative ${side === "left" ? "lg:order-1" : ""}`}>
          <figure className="relative overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-ink)]">
            <Image
              src={g.src}
              alt={g.alt}
              width={g.width}
              height={g.height}
              sizes="(min-width: 1024px) 600px, 100vw"
              className="h-auto w-full transition-transform duration-1000 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}

export function ProcessSteps({
  eyebrow,
  title,
  description,
  steps,
  tone = "onDark",
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  steps: readonly { index?: string; title: string; text: string; icon?: string }[];
  tone?: Tone;
  action?: React.ReactNode;
}) {
  const dark = tone === "onDark";
  return (
    <section className={`${SECTION_BG[tone]} px-5 py-20 lg:px-8`}>
      <Container>
        <Reveal>
          <SectionHeading
            tone={dark ? "onDark" : "onLight"}
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </Reveal>
        <Stagger as="ul" className="relative mt-14 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          {/* Connecting rail on wide screens. */}
          <span
            aria-hidden="true"
            className={`absolute left-0 right-0 top-6 hidden h-px xl:block ${dark ? "bg-white/15" : "bg-[var(--lsh-rule-strong)]"}`}
          />
          {steps.map((step, index) => (
            <StaggerItem key={step.title} as="li" className="relative">
              <div className="flex items-center gap-4">
                <span
                  className={`lsh-display relative z-10 inline-flex h-12 w-12 items-center justify-center border text-sm ${
                    dark
                      ? "border-[var(--lsh-red-on-ink)] bg-[var(--lsh-ink)] text-[var(--lsh-red-on-ink)]"
                      : "border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] text-[var(--lsh-brand-red)]"
                  }`}
                >
                  {step.index ?? String(index + 1).padStart(2, "0")}
                </span>
                <IconBadge icon={step.icon} tone={tone} size={20} />
              </div>
              <h3
                className={`lsh-display mt-6 text-xl ${dark ? "" : "text-[var(--lsh-charcoal)]"}`}
              >
                {step.title}
              </h3>
              <p className={`mt-3 leading-7 ${dark ? "text-white/75" : "text-[var(--lsh-muted)]"}`}>
                {step.text}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
        {action ? <Reveal className="mt-12 flex flex-wrap gap-3">{action}</Reveal> : null}
      </Container>
    </section>
  );
}

export function Callout({
  icon = "shield",
  eyebrow,
  children,
  tone = "onSurface",
  action,
}: {
  icon?: string;
  eyebrow?: string;
  children: React.ReactNode;
  tone?: Tone;
  action?: React.ReactNode;
}) {
  const dark = tone === "onDark";
  return (
    <section className={`${SECTION_BG[tone]} px-5 py-12 lg:px-8`}>
      <Container>
        <Reveal
          className={`flex flex-col gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:flex-row lg:items-center lg:justify-between lg:pl-8`}
        >
          <div className="flex items-start gap-5">
            <IconBadge icon={icon} tone={tone} />
            <div>
              {eyebrow ? <Eyebrow tone={dark ? "onDark" : "red"}>{eyebrow}</Eyebrow> : null}
              <div
                className={`mt-2 max-w-3xl leading-7 ${dark ? "text-white/85" : "text-[var(--lsh-charcoal)]"}`}
              >
                {children}
              </div>
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </Reveal>
      </Container>
    </section>
  );
}

export function BentoGrid({
  tiles,
  tone = "onLight",
}: {
  tiles: readonly {
    /** Optional on a graphic tile, which may carry only its eyebrow. */
    title?: string;
    text?: string;
    icon?: string;
    href?: string;
    linkLabel?: string;
    span?: "wide" | "tall" | "default";
    graphic?: GraphicKey;
    eyebrow?: string;
  }[];
  tone?: Tone;
}) {
  const dark = tone === "onDark";
  return (
    <section className={`${SECTION_BG[tone]} px-5 py-20 lg:px-8`}>
      <Container>
        <Stagger className="grid auto-rows-[minmax(14rem,auto)] gap-4 md:grid-cols-3">
          {tiles.map((tile) => {
            const g = tile.graphic ? getGraphic(tile.graphic) : null;
            const span =
              tile.span === "wide" ? "md:col-span-2" : tile.span === "tall" ? "md:row-span-2" : "";
            const shell = `group relative flex h-full flex-col justify-end overflow-hidden border p-7 ${
              g
                ? "border-transparent bg-[var(--lsh-ink)] text-white"
                : dark
                  ? "border-white/15 bg-[var(--lsh-charcoal)] text-white hover:border-[var(--lsh-red-on-ink)]"
                  : "border-[var(--lsh-rule)] bg-[var(--lsh-paper)] hover:border-[var(--lsh-brand-red)]"
            } transition-colors`;
            const body = (
              <>
                {g ? (
                  <>
                    <Image
                      src={g.src}
                      alt=""
                      width={g.width}
                      height={g.height}
                      sizes="(min-width: 768px) 66vw, 100vw"
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-1000 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                    />
                  </>
                ) : null}
                <div className="relative">
                  {tile.eyebrow ? (
                    <Eyebrow tone={g || dark ? "onDark" : "red"}>{tile.eyebrow}</Eyebrow>
                  ) : null}
                  {tile.title || !g ? (
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <h3
                        className={`lsh-display text-2xl leading-tight ${g || dark ? "" : "text-[var(--lsh-charcoal)]"}`}
                      >
                        {tile.title}
                      </h3>
                      {!g ? <IconBadge icon={tile.icon} tone={tone} /> : null}
                    </div>
                  ) : null}
                  {tile.text ? (
                    <p
                      className={`mt-3 max-w-md leading-7 ${g || dark ? "text-white/80" : "text-[var(--lsh-muted)]"}`}
                    >
                      {tile.text}
                    </p>
                  ) : null}
                  {tile.href ? (
                    <Link
                      href={tile.href}
                      className={`lsh-display mt-5 inline-flex items-center gap-2 text-[11px] after:absolute after:inset-0 after:content-[''] ${g || dark ? "text-[var(--lsh-red-on-ink)]" : "text-[var(--lsh-brand-red)]"}`}
                    >
                      {tile.linkLabel ?? "Open"}{" "}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </Link>
                  ) : null}
                </div>
              </>
            );
            return (
              <StaggerItem key={tile.title ?? tile.graphic} className={`h-full ${span}`}>
                <div className={shell}>{body}</div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}

export function GraphicBand({
  graphic,
  eyebrow,
  statement,
  action,
}: {
  graphic: GraphicKey;
  eyebrow?: string;
  statement: string;
  action?: React.ReactNode;
}) {
  const g = getGraphic(graphic);
  return (
    <section className="relative overflow-hidden bg-[var(--lsh-ink)] px-5 py-24 text-white lg:px-8 lg:py-32">
      <Image
        src={g.src}
        alt=""
        width={g.width}
        height={g.height}
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
        aria-hidden="true"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 [background-image:linear-gradient(100deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.65)_55%,rgba(0,0,0,0.3)_100%)]"
      />
      <Container className="relative">
        <Reveal className="max-w-3xl border-l-4 border-[var(--lsh-brand-red)] pl-6">
          {eyebrow ? <Eyebrow tone="onDark">{eyebrow}</Eyebrow> : null}
          <p className="lsh-display mt-4 text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">
            {statement}
          </p>
          {action ? <div className="mt-8 flex flex-wrap gap-3">{action}</div> : null}
        </Reveal>
      </Container>
    </section>
  );
}
