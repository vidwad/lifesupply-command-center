import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandGrid } from "@/components/public-site/brand-grid";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  ImageBand,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, ScrollBeam, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge, SplitSection } from "@/components/public-site/sections";
import { CONCEPTUAL_CAPTION, getGraphic } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * About — the Stage 2 page contract (guide §3, `/about-us/`): current group
 * introduction, geographic footprint, sourced milestones, operating
 * philosophy, brands, growth direction. Primary action: explore operations.
 */
export function AboutPage() {
  const { about, brand } = LIFE_SUPPLY_CONTENT;
  const footprintGraphic = getGraphic("facade");
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        description={about.growth}
        actions={<ActionLink action="explore_businesses" />}
      />

      {/* Operating philosophy: the label is the heading; the statement is the content. */}
      <section className="px-5 py-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-px bg-[var(--lsh-rule)] lg:grid-cols-2">
          <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-8 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">{about.labels.mission}</Eyebrow>
              <IconBadge icon={iconForTitle(about.labels.mission)} />
            </div>
            <p className="lsh-display mt-5 text-3xl leading-[1.1] text-[var(--lsh-charcoal)]">
              {about.mission}
            </p>
          </StaggerItem>
          <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2" tone="onDark">
                {about.labels.vision}
              </Eyebrow>
              <IconBadge icon={iconForTitle(about.labels.vision)} tone="onDark" />
            </div>
            <p className="lsh-display mt-5 text-3xl leading-[1.1] text-white">{about.vision}</p>
          </StaggerItem>
        </Stagger>
      </section>

      {/* Footprint and milestones. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionHeading
                eyebrow={about.footprint.eyebrow}
                title={about.footprint.title}
                description={about.footprint.text}
              />
            </Reveal>
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
                <figcaption className="lsh-display absolute bottom-0 left-0 bg-black/70 px-4 py-2 text-[10px] text-white/80">
                  {CONCEPTUAL_CAPTION}
                </figcaption>
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
                {about.milestones.items.map((item) => (
                  <Reveal key={`${item.date}-${item.text}`} as="li" className="relative">
                    <span
                      className="absolute -left-8 top-1.5 h-3 w-3 -translate-x-[calc(50%-1px)] rounded-full bg-[var(--lsh-brand-red)] ring-4 ring-[var(--lsh-surface)]"
                      aria-hidden="true"
                    />
                    <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                      {item.date}
                    </p>
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
        </div>
      </section>

      {/* Brands, from the registry, and the historical portfolio lockup on the ink field it needs. */}
      <section className="bg-[var(--lsh-paper)] py-20">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={about.portfolio.eyebrow} title={about.portfolio.title} />
          </Reveal>
          <div className="mt-10">
            <BrandGrid />
          </div>
          <Reveal className="mt-14">
            <ImageBand
              src={brand.portfolioImage}
              alt={brand.portfolioImageAlt}
              width={brand.portfolioImageWidth}
              height={brand.portfolioImageHeight}
              eyebrow="Portfolio marks"
            />
          </Reveal>
        </Container>
      </section>

      {/* Growth direction, stated conditionally, closing on the operations page. */}
      <SplitSection
        tone="onDark"
        eyebrow={about.direction.eyebrow}
        title={about.direction.title}
        graphic="boardroom"
        side="left"
        caption={CONCEPTUAL_CAPTION}
      >
        <p className="text-white/85">{about.growth}</p>
        <p>{about.direction.text}</p>
        <div className="pt-2">
          <ActionLink action="explore_businesses" />
        </div>
      </SplitSection>
    </LifeSupplyLayout>
  );
}
