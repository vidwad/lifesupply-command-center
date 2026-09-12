import { Mail, Phone } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandGrid } from "@/components/public-site/brand-grid";
import { HeroBackdrop } from "@/components/public-site/parallax-band";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  InfoBand,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import {
  DevelopingOpportunities,
  FootprintAndMilestones,
  GrowthDirection,
  OperatingBaseBand,
} from "@/components/public-site/pages/about-sections";
import { ProgramArchitecture } from "@/components/public-site/program-architecture";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/**
 * Homepage, in the order the product owner set on 2026-09-11:
 *
 *   1. Hero
 *   2. Experience and direction — who we are, where we are going
 *   3. How the business fits together — the program architecture, from About
 *   4. What the stores sell — the red band
 *   5. LifeSupply at a glance — the reported figures, on ink
 *   6. Footprint and milestones — from About
 *   7. The operating base — the warehouse band, from About
 *   8. Operating brands
 *   9. Growth direction — on ink, from About
 *  10. Looking ahead — the two programs in development, from About
 *  11. Contact
 *
 * Everything else the page carried — the "Where to start" index, the group
 * introduction, the clinic lifecycle, the metabolic block, the partner and
 * investor paths — is gone. The About sections render through the same
 * components About uses, so the two pages cannot drift.
 *
 * Every sentence is a prop from the content model; every destination is an
 * action-registry key or a registry link. Only imperative UI labels are
 * authored here.
 */
export function LifeSupplyHome() {
  const { homepage, contact, architecture } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      {/*
       * The hero leads on the picture since 2026-09-12 (product owner): the
       * legacy background footage read as a murky dark field behind the
       * heading, so the homepage takes the photograph About used, carried at
       * full density behind a thinner scrim. The company video still plays on
       * About, where it is introduced rather than used as wallpaper.
       */}
      <PublicHero
        size="home"
        eyebrow={homepage.eyebrow}
        title={homepage.title}
        description={homepage.description}
        media={<HeroBackdrop band="data" prominence="full" position="72% 50%" />}
        scrim="light"
        actions={
          <>
            <ActionLink action="investor_information">Investor information</ActionLink>
            <ActionLink action="explore_businesses" variant="onDark" />
          </>
        }
      />

      {/* Who we are, where we are going, where we want to be: three panels after the hero. */}
      <section className="bg-[var(--lsh-paper)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={homepage.whoWeAre.eyebrow} title={homepage.whoWeAre.title} />
          </Reveal>
          {/*
           * Three columns, no panels. A single red rule over each column and
           * a headline set two steps larger carries it.
           */}
          <Stagger as="ul" className="mt-14 grid gap-x-10 gap-y-14 lg:grid-cols-3">
            {homepage.whoWeAre.panels.map((panel, index) => (
              <StaggerItem key={panel.headline} as="li" className="flex h-full flex-col">
                <span aria-hidden="true" className="block h-1 w-full bg-[var(--lsh-brand-red)]" />
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                    {panel.eyebrow}
                  </p>
                  <span
                    aria-hidden="true"
                    className="lsh-display text-[11px] text-[var(--lsh-rule-strong)]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="lsh-display mt-4 text-[2.5rem] leading-[0.9] tracking-tight text-[var(--lsh-charcoal)] sm:text-5xl lg:text-[3.25rem]">
                  {panel.headline}
                </h3>
                <p className="mt-6 max-w-md leading-7 text-[var(--lsh-muted)]">{panel.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/*
       * How the business fits together: what operates, what is being built,
       * what is being weighed. The two clarifying notes beneath the tiers
       * stay on About (product owner, 2026-09-11).
       */}
      <ProgramArchitecture content={architecture} notes={false} />

      {/* The red information band, carrying the operating-context statement. */}
      <Reveal>
        <InfoBand
          eyebrow={homepage.operatingContext.eyebrow}
          statement={homepage.operatingContext.statement}
        />
      </Reveal>

      {/* Verified proof, on ink, at the figure scale. */}
      <section className="bg-[var(--lsh-ink)] px-5 py-24 text-white lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <p className="lsh-display text-[11px] text-[var(--lsh-red-on-ink)]">
              {homepage.glance.eyebrow}
            </p>
            <h2 className="lsh-display mt-4 text-3xl leading-tight sm:text-4xl">
              {homepage.glance.title}
            </h2>
            <p className="mt-4 leading-7 text-white/70">{homepage.glance.description}</p>
          </Reveal>
          {/*
           * Each entry is reversed so the figure reads first and the label
           * sits under it, while the source keeps the term before its
           * description. The label is the `dt` itself rather than a hidden
           * copy, so a screen reader announces it once, not twice.
           */}
          <Stagger as="dl" className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-3">
            {homepage.publicMetrics.map((metric) => (
              <StaggerItem
                key={metric.label}
                className="flex flex-col-reverse border-t border-white/20 pt-6"
              >
                <dt className="mt-6 max-w-[18rem] text-sm leading-6 text-white/60">
                  {metric.label}
                </dt>
                <dd data-stat="figure" className="lsh-figure text-[var(--lsh-red-on-ink)]">
                  {metric.value}
                </dd>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <FootprintAndMilestones />
      <OperatingBaseBand />

      {/* The four operating brands, from the registry. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={homepage.brands.eyebrow}
              title={homepage.brands.title}
              description={homepage.brands.description}
            />
          </Reveal>
          <div className="mt-10">
            <BrandGrid />
          </div>
        </Container>
      </section>

      <GrowthDirection />
      <DevelopingOpportunities />

      {/* Closing contact: the verified directory. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-20 text-white lg:px-8">
        <Container>
          <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              tone="onDark"
              eyebrow={homepage.closing.eyebrow}
              title={homepage.closing.title}
            />
            <div className="shrink-0">
              <ActionLink action="contact_directory">Contact directory</ActionLink>
            </div>
          </Reveal>
          <Stagger className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {contact.channels.map((channel) => (
              <StaggerItem key={channel.label} className="border-t border-white/25 pt-6">
                <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                  {channel.label}
                </p>
                <p className="lsh-display mt-3 text-2xl leading-none">{channel.name}</p>
                <div className="mt-4 grid gap-1.5 text-sm text-white/75">
                  <a
                    href={`mailto:${channel.email}`}
                    className="inline-flex w-fit items-center gap-2 transition-colors hover:text-white"
                  >
                    <Mail size={14} aria-hidden="true" /> {channel.email}
                  </a>
                  {"phone" in channel ? (
                    <a
                      href={telHref(channel.phone)}
                      className="inline-flex w-fit items-center gap-2 transition-colors hover:text-white"
                    >
                      <Phone size={14} aria-hidden="true" /> {channel.phone}
                    </a>
                  ) : null}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
