import { ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandGrid } from "@/components/public-site/brand-grid";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  DevelopingOpportunities,
  FootprintAndMilestones,
  GrowthDirection,
  OperatingBaseBand,
} from "@/components/public-site/pages/about-sections";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { HeroBackdrop, ParallaxBand } from "@/components/public-site/parallax-band";
import { ProgramArchitecture } from "@/components/public-site/program-architecture";
import { IconBadge } from "@/components/public-site/sections";
import { VideoEmbed } from "@/components/public-site/video-embed";
import type { ActionKey } from "@/lib/public-site/actions";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { ABOUT_VIDEO, youtubeWatchUrl } from "@/lib/public-site/video";

/**
 * About — the Stage 2 page contract (guide §3, `/about-us/`): operating
 * philosophy beside the company video, geographic footprint, sourced
 * milestones, brands, growth direction, and the developing opportunities
 * under evaluation, which close the page. Since 2026-09-11 the footprint,
 * the operating-base band, the growth direction and the developing
 * opportunities render through `about-sections.tsx`, which the homepage
 * also uses, so the two pages cannot drift. Photographs from the prior About
 * page return as the hero backdrop and two parallax divider bands (product
 * owner, 2026-09-09); the former group statement, published-entities list,
 * and shared-capabilities grid were removed the same day.
 */
export function AboutPage() {
  const { about, architecture } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        description={about.heroSummary}
        actions={<ActionLink action="explore_businesses" />}
        media={<HeroBackdrop band="data" />}
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

      <ParallaxBand
        band="desk"
        tone="redLight"
        eyebrow={about.bands.desk.eyebrow}
        statement={about.bands.desk.statement}
      />

      {/*
       * The corporate structure, moved here from Contact on 2026-09-10. About
       * carries identity, history and footprint, so what the company legally
       * is belongs with them; Contact keeps the entity names and channels,
       * which is what a visitor deciding who to write to needs.
       */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="grid gap-8 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-[1.1fr_0.9fr] lg:pl-8">
            <div>
              <SectionHeading
                eyebrow={about.structure.eyebrow}
                title={about.structure.title}
                description={about.structure.text}
              />
            </div>
            <div className="flex flex-col justify-end gap-5">
              <p className="text-sm leading-6 text-[var(--lsh-muted)]">{about.structure.note}</p>
              <div>
                <ActionLink action={about.structure.action as ActionKey} variant="onLight" />
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <FootprintAndMilestones />

      <OperatingBaseBand />

      {/* Brands, from the registry. */}
      <section className="py-20">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={about.portfolio.eyebrow} title={about.portfolio.title} />
          </Reveal>
          <div className="mt-10">
            <BrandGrid />
          </div>
        </Container>
      </section>

      <GrowthDirection />

      {/*
       * The whole shape of the business in one view (round three, outcome 3):
       * what operates, what is being built, and what is still being weighed.
       * The developing programs below this are the detail beneath it.
       */}
      <ProgramArchitecture content={architecture} />

      <DevelopingOpportunities />
    </LifeSupplyLayout>
  );
}
