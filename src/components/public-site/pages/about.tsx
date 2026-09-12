import { ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Stagger, StaggerItem } from "@/components/public-site/motion";
import {
  BoardOfDirectors,
  Leadership,
  ProfileDialogs,
  TeamIntro,
} from "@/components/public-site/pages/team-sections";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { ParallaxBand } from "@/components/public-site/parallax-band";
import { ProgramArchitecture } from "@/components/public-site/program-architecture";
import { IconBadge } from "@/components/public-site/sections";
import { VideoEmbed } from "@/components/public-site/video-embed";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { ABOUT_VIDEO, youtubeWatchUrl } from "@/lib/public-site/video";

/**
 * About — `/about-us/`, reshaped on 2026-09-11 (product owner):
 *
 *   1. Hero
 *   2. Mission and Vision beside the company video
 *   3. "Since inception" — the band that closes the company's own account
 *   4. How the business fits together — the program architecture
 *   5. The team: the title and text `/our-team/` opened with, Leadership,
 *      and the Board of Directors, with each profile as a dialog
 *
 * Nothing follows the board but the footer. The footprint and milestones,
 * the operating-base band, the brands, the growth direction and the
 * developing opportunities render on the homepage instead, through the same
 * components, so nothing was lost by moving them. The program architecture
 * came back here on 2026-09-12 at the product owner's instruction and now
 * renders on this page only.
 *
 * `/our-team/` redirects here, and the four legacy profile addresses land on
 * the person's dialog rather than on the top of a listing. The hero backdrop
 * and the band photograph are the prior About page's (product owner,
 * 2026-09-09).
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
        media={<GraphicBackdrop graphic="aboutAtrium" position="62% 50%" />}
      />

      {/* The company video leads on the left in the wider track, with Mission
          and Vision stacked beside it (product owner, 2026-09-12; the two
          columns were the other way round from 2026-09-09). */}
      <section className="px-5 py-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-px bg-[var(--lsh-rule)] lg:grid-cols-[1.1fr_0.9fr]">
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
        </Stagger>
      </section>

      <ParallaxBand
        band="desk"
        tone="redLight"
        eyebrow={about.bands.desk.eyebrow}
        statement={about.bands.desk.statement}
      />

      {/*
       * How the business fits together: what operates, what is being built,
       * what is being weighed. Moved here from the homepage on 2026-09-12
       * (product owner), between the band and the team.
       *
       * The two clarifying notes beneath the tiers render again with it. They
       * were taken off the homepage on 2026-09-11 and were meant to stay on
       * About; About lost the section later the same day, so they have been
       * unpublished since. This is the page they belong to.
       */}
      <ProgramArchitecture content={architecture} />

      {/*
       * The team, under the program architecture, and nothing after it but
       * the footer (product owner, 2026-09-11). `/our-team/` redirects here.
       *
       * What this replaced now lives on the homepage: the footprint and
       * milestones, the operating-base band, the brands, the growth direction,
       * the program architecture and the developing opportunities all render
       * there, through the same components, so nothing was lost with the
       * sections. The corporate-structure statement is the one exception and
       * is recorded in the change log.
       */}
      <TeamIntro />
      <Leadership />
      <BoardOfDirectors />
      <ProfileDialogs />
    </LifeSupplyLayout>
  );
}
