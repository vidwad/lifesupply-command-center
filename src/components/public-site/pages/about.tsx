import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import {
  LeadershipAndGovernance,
  ProfileDialogs,
} from "@/components/public-site/pages/team-sections";
import { ParallaxBand } from "@/components/public-site/parallax-band";
import { IconBadge } from "@/components/public-site/sections";
import { VideoEmbed } from "@/components/public-site/video-embed";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { METABOLIC_ROUTES, PHARMACY_ROUTES } from "@/lib/public-site/routes";
import { ABOUT_VIDEO, youtubeWatchUrl } from "@/lib/public-site/video";

/**
 * About — `/about-us/`, rewritten on 2026-09-12 at the product owner's
 * direction:
 *
 *   1. Hero — what the group is, and what it is building on that
 *   2. A message from our Chairman & CEO — the company video
 *   3. Our purpose — the mission and the vision
 *   4. Our foundation — the operating history and the reported figures
 *   5. Our operations — what the group does today, business by business
 *   6. "Since inception" — the band, as a pause between now and next
 *   7. Our development priorities — the two supply programs being built
 *   8. Longer-term opportunities — the regulated activities being assessed
 *   9. Our approach to growth — four things the strategy rests on
 *  10. Leadership and governance — one section, each profile a dialog
 *  11. Connect with LifeSupply
 *
 * The page tells the operating business first, then separates what is being
 * built from what is only being assessed. Each boundary is stated once,
 * beside the activity it applies to, rather than repeated between sections:
 * the stores keep their own accounts and currencies, the clinic business
 * develops premises while the operator keeps patient care, the two programs
 * are not available and exclude medication, and the regulated activities are
 * not offered at all. The program-architecture tiers said the same thing in
 * one block; this says it where each fact belongs, so the tiers and their two
 * clarifying notes no longer render.
 *
 * `/our-team/` redirects here, and the four legacy profile addresses land on
 * the person's dialog rather than on the top of a listing.
 */

/** Where each development card goes, read from the route registry by key. */
const PRIORITY_ROUTES = {
  metabolic: METABOLIC_ROUTES.hub,
  pharmacy: PHARMACY_ROUTES.hub,
} as const;

export function AboutPage() {
  const { about } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        description={about.heroParagraphs}
        actions={
          <>
            <ActionLink action="explore_businesses">Explore our businesses</ActionLink>
            <ActionLink action="growth_strategy" variant="onDark">
              View our growth strategy
            </ActionLink>
          </>
        }
        media={<GraphicBackdrop graphic="aboutMedtech" position="62% 50%" />}
      />

      {/* The chairman's introduction. Nothing is requested from YouTube until
          the visitor presses play; that is behaviour, and it is asserted in
          the browser suite rather than explained on the page. */}
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-px bg-[var(--lsh-rule)] lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="flex h-full flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 lg:p-10">
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
            <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-5">
              <a
                href={youtubeWatchUrl(ABOUT_VIDEO)}
                target="_blank"
                rel="noreferrer"
                className="lsh-display inline-flex items-center gap-1 text-[11px] text-[var(--lsh-brand-red)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:decoration-[var(--lsh-brand-red)]"
              >
                {about.video.watchLabel} <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </Reveal>
          <Stagger className="grid gap-px">
            <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-8 lg:p-10">
              <Eyebrow as="h2">{about.purpose.eyebrow}</Eyebrow>
              <p className="lsh-display mt-5 text-2xl leading-[1.15] text-[var(--lsh-charcoal)] lg:text-3xl lg:leading-[1.1]">
                {about.purpose.title}
              </p>
            </StaggerItem>
            <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <Eyebrow as="h3">{about.labels.mission}</Eyebrow>
                <IconBadge icon={iconForTitle(about.labels.mission)} />
              </div>
              <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{about.mission}</p>
            </StaggerItem>
            <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <Eyebrow as="h3" tone="onDark">
                  {about.labels.vision}
                </Eyebrow>
                <IconBadge icon={iconForTitle(about.labels.vision)} tone="onDark" />
              </div>
              <p className="mt-4 leading-7 text-white/75">{about.vision}</p>
            </StaggerItem>
          </Stagger>
        </Container>
      </section>

      {/* Our foundation: the operating history, then the reported figures with
          their source and the cumulative qualification beneath them. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Sticky while the right column scrolls, as on Our development
              priorities (product owner, 2026-09-12). */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionHeading
                eyebrow={about.foundation.eyebrow}
                title={about.foundation.title}
                description={about.foundation.lead}
              />
            </Reveal>
          </div>
          <div>
            <Stagger className="grid gap-6">
              {about.foundation.paragraphs.map((paragraph) => (
                <StaggerItem key={paragraph.slice(0, 40)}>
                  <p className="leading-8 text-[var(--lsh-muted)]">{paragraph}</p>
                </StaggerItem>
              ))}
            </Stagger>
            <Stagger as="dl" className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-3">
              {about.foundation.metrics.map((metric) => (
                <StaggerItem
                  key={metric.label}
                  className="border-t-2 border-[var(--lsh-rule-strong)] pt-5"
                >
                  <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                    {metric.label}
                  </dt>
                  <dd>
                    <span className="lsh-display mt-3 block text-2xl leading-none text-[var(--lsh-charcoal)]">
                      {metric.value}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-[var(--lsh-muted)]">
                      {metric.caption}
                    </span>
                  </dd>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal>
              <p className="mt-8 border-t border-[var(--lsh-rule)] pt-5 text-xs leading-5 text-[var(--lsh-muted)]">
                {about.foundation.source}
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Our operations: each business, then the boundary that applies to it. */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={about.operations.eyebrow} title={about.operations.title} />
          </Reveal>
          <Stagger className="mt-12 grid gap-px bg-[var(--lsh-rule)] lg:grid-cols-2">
            {about.operations.blocks.map((block) => (
              <StaggerItem
                key={block.key}
                className="flex h-full flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 lg:p-10"
              >
                <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                  {block.title}
                </h3>
                <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{block.lead}</p>
                <ul className="mt-5 grid gap-3">
                  {block.items.map((item) => (
                    <li key={item.slice(0, 40)} className="lsh-bullet text-[var(--lsh-muted)]">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-[var(--lsh-rule)] pt-4 text-sm leading-6 text-[var(--lsh-muted)]">
                  {block.note}
                </p>
                <div className="mt-auto pt-6">
                  <ActionLink action={block.action}>{block.cta}</ActionLink>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* A pause between what runs today and what is being built. */}
      <ParallaxBand
        band="desk"
        tone="redLight"
        eyebrow={about.bands.desk.eyebrow}
        statement={about.bands.desk.statement}
      />

      {/* Our development priorities: two programs, each with its own status,
          its own boundary, and the page it leads to. */}
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionHeading eyebrow={about.priorities.eyebrow} title={about.priorities.title} />
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-7 border-l-4 border-[var(--lsh-brand-red)] pl-6 text-lg leading-8 text-[var(--lsh-charcoal)]">
                {about.priorities.lead}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-7 text-sm leading-6 text-[var(--lsh-muted)]">
                {about.priorities.note}
              </p>
            </Reveal>
          </div>
          <Stagger as="ul" className="grid gap-5">
            {about.priorities.items.map((item) => (
              <StaggerItem key={item.key} as="li" className="h-full">
                <Link
                  href={PRIORITY_ROUTES[item.key]}
                  aria-label={item.title}
                  className="group block h-full"
                >
                  <SpotlightCard
                    as="article"
                    className="lsh-lift h-full border-t-2 border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] p-7 transition-colors group-hover:border-[var(--lsh-brand-red)] lg:p-8"
                  >
                    <span className="lsh-display inline-flex border border-[var(--lsh-brand-red)] px-2 py-0.5 text-[10px] text-[var(--lsh-brand-red)]">
                      {item.status}
                    </span>
                    <h3 className="lsh-display mt-5 text-2xl leading-tight text-[var(--lsh-charcoal)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.summary}</p>
                    <p className="mt-3 border-t border-[var(--lsh-rule)] pt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                      {item.detail}
                    </p>
                    {item.boundary ? (
                      <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                        {item.boundary}
                      </p>
                    ) : null}
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
        </Container>
      </section>

      {/* Longer-term opportunities: assessed, not offered. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={about.longerTerm.eyebrow}
              title={about.longerTerm.title}
              description={about.longerTerm.lead}
            />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2">
            {about.longerTerm.items.map((item) => (
              <StaggerItem
                key={item.title}
                as="li"
                className="h-full bg-[var(--lsh-paper)] p-7 lg:p-8"
              >
                <h3 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 flex flex-col gap-6 border-t border-[var(--lsh-rule-strong)] pt-8 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-3xl text-sm leading-6 text-[var(--lsh-muted)]">
              {about.longerTerm.note}
            </p>
            <div className="shrink-0">
              <ActionLink action="advanced_therapeutics">{about.longerTerm.cta}</ActionLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Our approach to growth. */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={about.approach.eyebrow}
              title={about.approach.title}
              description={about.approach.lead}
            />
          </Reveal>
          <Stagger as="ol" className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {about.approach.items.map((item, index) => (
              <StaggerItem key={item.title} as="li" className="flex h-full flex-col">
                <span aria-hidden="true" className="block h-1 w-full bg-[var(--lsh-brand-red)]" />
                <span className="lsh-display mt-5 text-[11px] text-[var(--lsh-rule-strong)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="lsh-display mt-2 text-xl leading-tight text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10">
            <ActionLink action="growth_strategy">{about.approach.cta}</ActionLink>
          </Reveal>
        </Container>
      </section>

      <LeadershipAndGovernance />

      {/* Where to go next. */}
      <section className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8">
        <Container>
          <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              tone="onDark"
              eyebrow={about.connect.eyebrow}
              title={about.connect.title}
              description={about.connect.lead}
            />
            <div className="flex shrink-0 flex-wrap gap-3">
              <ActionLink action="general_inquiry">Contact LifeSupply</ActionLink>
              <ActionLink action="investor_information" variant="onDark">
                Investor information
              </ActionLink>
            </div>
          </Reveal>
        </Container>
      </section>

      <ProfileDialogs />
    </LifeSupplyLayout>
  );
}
