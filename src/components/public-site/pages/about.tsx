import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandGrid } from "@/components/public-site/brand-grid";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, ScrollBeam, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge, IconFeatureGrid, SplitSection } from "@/components/public-site/sections";
import { VideoEmbed } from "@/components/public-site/video-embed";
import { getGraphic } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { ABOUT_VIDEO, youtubeWatchUrl } from "@/lib/public-site/video";

/**
 * About — the Stage 2 page contract (guide §3, `/about-us/`): current group
 * introduction, geographic footprint, sourced milestones, operating
 * philosophy, brands, growth direction. Since 2026-09-08 it also carries the
 * corporate portfolio that used to open Our Businesses: the published
 * entities, the shared capabilities narrative, and the developing programs.
 */
export function AboutPage() {
  const { about, brand, contact, operations } = LIFE_SUPPLY_CONTENT;
  const footprintGraphic = getGraphic("facade");
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        description={about.growth}
        actions={<ActionLink action="explore_businesses" />}
      />

      {/* Operating philosophy beside the company video: Mission and Vision stacked
          in one column, the video in the other (product owner, 2026-09-09). */}
      <section className="px-5 py-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-px bg-[var(--lsh-rule)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-px">
            <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <Eyebrow as="h2">{about.labels.mission}</Eyebrow>
                <IconBadge icon={iconForTitle(about.labels.mission)} />
              </div>
              <p className="lsh-display mt-5 text-2xl leading-[1.15] text-[var(--lsh-charcoal)] lg:text-3xl lg:leading-[1.1]">
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
              <p className="lsh-display mt-5 text-2xl leading-[1.15] text-white lg:text-3xl lg:leading-[1.1]">
                {about.vision}
              </p>
            </StaggerItem>
          </div>
          <StaggerItem className="flex h-full flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">{about.video.eyebrow}</Eyebrow>
              <IconBadge icon="play" />
            </div>
            <p className="lsh-display mt-5 text-2xl leading-[1.15] text-[var(--lsh-charcoal)] lg:text-3xl lg:leading-[1.1]">
              {about.video.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
              {about.video.description}
            </p>
            <VideoEmbed video={ABOUT_VIDEO} playLabel={about.video.playLabel} className="mt-6" />
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              <p className="text-xs leading-5 text-[var(--lsh-muted)]">{about.video.note}</p>
              <a
                href={youtubeWatchUrl(ABOUT_VIDEO)}
                target="_blank"
                rel="noreferrer"
                className="lsh-display inline-flex items-center gap-1 text-[11px] text-[var(--lsh-brand-red)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:decoration-[var(--lsh-brand-red)]"
              >
                {about.video.watchLabel} <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
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

      {/* The group: the approved operating statement and the published entities. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHeading eyebrow={about.corporate.eyebrow} title={about.corporate.title} />
            <p className="mt-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 leading-8 text-[var(--lsh-muted)]">
              {about.corporate.text}
            </p>
          </Reveal>
          <div>
            <Reveal>
              <SectionHeading
                eyebrow={about.corporate.entities.eyebrow}
                title={about.corporate.entities.title}
                description={about.corporate.entities.note}
              />
            </Reveal>
            <Stagger as="ul" className="mt-8 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2">
              <StaggerItem as="li" className="flex items-start gap-4 bg-[var(--lsh-paper)] p-6">
                <IconBadge icon="landmark" size={20} />
                <div>
                  <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">Corporate</p>
                  <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">
                    {brand.address[0]}
                  </p>
                </div>
              </StaggerItem>
              {contact.subsidiaries.map((entity) => (
                <StaggerItem
                  key={entity.name}
                  as="li"
                  className="flex items-start gap-4 bg-[var(--lsh-paper)] p-6"
                >
                  <IconBadge icon="building" size={20} />
                  <div>
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      Published entity
                    </p>
                    <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">
                      {entity.name}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Shared capabilities: the approved narrative, unchanged. */}
      <IconFeatureGrid
        tone="onDark"
        numbered
        columns={2}
        eyebrow={about.corporate.capabilities.eyebrow}
        title={about.corporate.capabilities.title}
        description={about.corporate.capabilities.note}
        items={operations.slice(0, 4).map((operation) => ({
          title: operation.title,
          text: operation.description,
          icon: iconForTitle(operation.title),
        }))}
      />

      {/* Developing programs, with status. */}
      <IconFeatureGrid
        columns={2}
        eyebrow={about.corporate.developing.eyebrow}
        title={about.corporate.developing.title}
        items={about.corporate.developing.items.map((item) => ({
          title: item.title,
          text: item.text,
          status: item.status,
          icon: iconForTitle(item.title),
        }))}
      />

      {/* Brands, from the registry. */}
      <section className="bg-[var(--lsh-surface)] py-20">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={about.portfolio.eyebrow} title={about.portfolio.title} />
          </Reveal>
          <div className="mt-10">
            <BrandGrid />
          </div>
        </Container>
      </section>

      {/* Growth direction, stated conditionally, closing on the stores. */}
      <SplitSection
        tone="onDark"
        eyebrow={about.direction.eyebrow}
        title={about.direction.title}
        graphic="boardroom"
        side="left"
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
