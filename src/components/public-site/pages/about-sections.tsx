import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { Container, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import {
  Reveal,
  ScrollBeam,
  SpotlightCard,
  Stagger,
  StaggerItem,
} from "@/components/public-site/motion";
import { ParallaxBand } from "@/components/public-site/parallax-band";
import { IconBadge, SplitSection } from "@/components/public-site/sections";
import { getGraphic } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { orderedMilestones } from "@/lib/public-site/content/about";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { METABOLIC_ROUTES, PHARMACY_ROUTES } from "@/lib/public-site/routes";

/**
 * The About sections the homepage also carries (product owner, 2026-09-11):
 * footprint and milestones, the operating-base band, growth direction, and
 * the developing opportunities. One rendering each, used by both pages, so
 * the two cannot drift.
 */

/** Footprint beside the dated public record. */
export function FootprintAndMilestones() {
  const { about } = LIFE_SUPPLY_CONTENT;
  const footprintGraphic = getGraphic("facade");
  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <SectionHeading eyebrow={about.footprint.eyebrow} title={about.footprint.title} />
          </Reveal>
          {/*
           * Country by country since 2026-09-12 (product owner), each naming
           * the brands that operate there, rather than one paragraph that ran
           * the two together.
           */}
          <Stagger as="dl" className="mt-8 grid gap-6">
            {about.footprint.regions.map((region) => (
              <StaggerItem key={region.name} className="border-t border-[var(--lsh-rule)] pt-5">
                <dt className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                  {region.name}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{region.text}</dd>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="group mt-8">
            <figure className="relative overflow-hidden border-t-4 border-[var(--lsh-brand-red)]">
              <Image
                src={footprintGraphic.src}
                alt={footprintGraphic.alt}
                width={footprintGraphic.width}
                height={footprintGraphic.height}
                sizes="(min-width: 1024px) 420px, 100vw"
                className="h-auto w-full transition-transform duration-1000 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </figure>
          </Reveal>
        </div>
        <div>
          <Reveal>
            <SectionHeading
              eyebrow={about.milestones.eyebrow}
              title={about.milestones.title}
              description={about.milestones.note}
            />
          </Reveal>
          <ScrollBeam className="mt-10 pl-8">
            <ol className="grid gap-8">
              {orderedMilestones().map((item) => (
                <Reveal key={`${item.date}-${item.text}`} as="li" className="relative">
                  <span
                    className="absolute -left-8 top-1.5 h-3 w-3 -translate-x-[calc(50%-1px)] rounded-full bg-[var(--lsh-brand-red)] ring-4 ring-[var(--lsh-surface)]"
                    aria-hidden="true"
                  />
                  <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">{item.date}</p>
                  <p className="lsh-display mt-1 text-xl leading-tight text-[var(--lsh-charcoal)]">
                    {item.text}
                  </p>
                  <p className="mt-2 text-sm text-[var(--lsh-muted)]">
                    Source:{" "}
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:text-[var(--lsh-brand-red)]"
                      >
                        {item.source} <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    ) : (
                      item.source
                    )}
                  </p>
                </Reveal>
              ))}
            </ol>
          </ScrollBeam>
        </div>
      </Container>
    </section>
  );
}

/** The operating-base banner: the warehouse band on ink. */
export function OperatingBaseBand() {
  const { about } = LIFE_SUPPLY_CONTENT;
  return (
    <ParallaxBand
      band="warehouse"
      tone="ink"
      eyebrow={about.bands.warehouse.eyebrow}
      statement={about.bands.warehouse.statement}
    />
  );
}

/** Growth direction, closing on the stores. */
export function GrowthDirection() {
  const { about } = LIFE_SUPPLY_CONTENT;
  return (
    <SplitSection
      tone="onDark"
      eyebrow={about.direction.eyebrow}
      title={about.direction.title}
      graphic="boardroom"
      side="left"
    >
      <p className="text-white/85">{about.direction.lead}</p>
      {about.direction.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}
      <div className="pt-2">
        <ActionLink action="growth_strategy">Explore our growth strategy</ActionLink>
      </div>
    </SplitSection>
  );
}

/**
 * Developing opportunities. Two columns: the heading, the strategy
 * statement, and the status note hold the left; each opportunity carries its
 * own discussion in a card on the right.
 */
/**
 * Where each developing card goes when it is clicked (product owner,
 * 2026-09-12): its own page under Solutions. Read from the route registry by
 * the item's key, so the content model holds no paths and a card can never
 * point at an address the registry does not publish.
 */
const DEVELOPING_ROUTES = {
  metabolic: METABOLIC_ROUTES.hub,
  pharmacy: PHARMACY_ROUTES.hub,
} as const;

export function DevelopingOpportunities() {
  const { about } = LIFE_SUPPLY_CONTENT;
  return (
    <section className="px-5 py-20 lg:px-8">
      <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <SectionHeading eyebrow={about.developing.eyebrow} title={about.developing.title} />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-7 border-l-4 border-[var(--lsh-brand-red)] pl-6 text-lg leading-8 text-[var(--lsh-charcoal)]">
              {about.developing.lead}
            </p>
          </Reveal>
          {/* Neither programme can be bought; the section says so in words. */}
          <Reveal delay={0.15}>
            <p className="mt-7 text-sm leading-6 text-[var(--lsh-muted)]">
              {about.developing.note}
            </p>
          </Reveal>
        </div>
        <div>
          <Reveal>
            <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
              {about.developing.intro}
            </p>
          </Reveal>
          <Stagger as="ul" className="mt-6 grid gap-5">
            {about.developing.items.map((item) => (
              <StaggerItem key={item.title} as="li" className="h-full">
                {/*
                 * `article` is not a name-from-content role, so without an
                 * explicit label this link reaches assistive technology with
                 * no name at all. The programme title is the name.
                 */}
                <Link
                  href={DEVELOPING_ROUTES[item.key]}
                  aria-label={item.title}
                  className="group block h-full"
                >
                  <SpotlightCard
                    as="article"
                    className="lsh-lift h-full border-t-2 border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] p-7 transition-colors group-hover:border-[var(--lsh-brand-red)] lg:p-8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <IconBadge icon={iconForTitle(item.title)} />
                      <span className="lsh-display border border-[var(--lsh-brand-red)] px-2 py-0.5 text-[10px] text-[var(--lsh-brand-red)]">
                        {item.status}
                      </span>
                    </div>
                    <h3 className="lsh-display mt-6 text-2xl leading-tight text-[var(--lsh-charcoal)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
                    <p className="mt-3 border-t border-[var(--lsh-rule)] pt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                      {item.detail}
                    </p>
                    <span className="lsh-display mt-5 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                      {item.cta}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </span>
                  </SpotlightCard>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  );
}
