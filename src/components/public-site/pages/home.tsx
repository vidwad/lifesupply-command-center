import Image from "next/image";
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
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import {
  DevelopingOpportunities,
  FootprintAndMilestones,
  GrowthDirection,
  OperatingBaseBand,
} from "@/components/public-site/pages/about-sections";
import { getGraphic } from "@/lib/public-site/graphics";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/**
 * Homepage, in the order the product owner set on 2026-09-11:
 *
 *   1. Hero
 *   2. Experience and direction — who we are, where we are going
 *   3. What the stores sell — the red band
 *   4. LifeSupply at a glance — the reported figures, on ink
 *   5. Footprint and milestones — from About
 *   6. The operating base — the warehouse band, from About
 *   7. Operating brands
 *   8. Growth direction — on ink, from About
 *   9. Looking ahead — the two programs in development, from About
 *  10. Contact
 *
 * The program architecture was section 3 until 2026-09-12, when the product
 * owner moved it to About, between the "Since inception" band and the team.
 * It renders there only now.
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
  const { homepage, contact } = LIFE_SUPPLY_CONTENT;
  const suppliesAndPlans = getGraphic("suppliesAndPlans");
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

      {/*
       * What the group is and what it does (product owner, 2026-09-12). It
       * sits between the hero and the panels: the hero says what kind of
       * company this is, this says what it actually runs, and the panels then
       * say where it came from and where it is going.
       */}
      <section className="border-b border-[var(--lsh-rule)] bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="grid items-stretch gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Reveal>
              <SectionHeading eyebrow={homepage.whoWeDo.eyebrow} title={homepage.whoWeDo.title} />
            </Reveal>
            <Stagger className="mt-8 grid content-start gap-6">
              {homepage.whoWeDo.paragraphs.map((paragraph) => (
                <StaggerItem key={paragraph.slice(0, 40)}>
                  <p className="leading-8 text-[var(--lsh-muted)]">{paragraph}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          {/*
           * The two halves of the sentence in one frame: cartons and sealed
           * packs for the online stores, floor plans and a scale rule for the
           * clinic projects. It fills its column rather than sitting in a
           * fixed box, so neither column ends early and the section has no
           * empty half. The picture is on the right here and on the left in
           * the growth-direction band further down, so the two read as a
           * rhythm rather than the same composition twice.
           */}
          <Reveal delay={0.1} className="group min-h-64 lg:min-h-0">
            <figure className="relative h-full min-h-64 overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)]">
              <Image
                src={suppliesAndPlans.src}
                alt={suppliesAndPlans.alt}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </figure>
          </Reveal>
        </Container>
      </section>

      {/* Who we are, where we are going, where we want to be: three panels after the hero. */}
      <section className="bg-[var(--lsh-paper)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={homepage.whoWeAre.eyebrow}
              title={homepage.whoWeAre.title}
              description={homepage.whoWeAre.description}
            />
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

      {/* The red information band, carrying the operating-context statement. */}
      <Reveal>
        <InfoBand
          eyebrow={homepage.operatingContext.eyebrow}
          statement={homepage.operatingContext.statement}
        />
      </Reveal>

      {/*
       * Verified proof, on ink, at the figure scale. The three figures count
       * up from zero when they scroll into view (product owner, 2026-09-13,
       * as the site had before the 2026-09-09 design pass); the approved text
       * is what the server renders, and reduced motion shows it at once.
       */}
      <section className="bg-[var(--lsh-ink)] px-5 py-24 text-white lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <p className="lsh-display text-[11px] text-[var(--lsh-red-on-ink)]">
              {homepage.glance.eyebrow}
            </p>
            <h2 className="lsh-display mt-4 text-3xl leading-tight sm:text-4xl">
              {homepage.glance.title}
            </h2>
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
                {/* The unit sits on its own line under the figure at every
                    width, so the three cells align whether or not the
                    longest value leaves room beside it. */}
                <dd>
                  <span data-stat="figure" className="lsh-figure text-[var(--lsh-red-on-ink)]">
                    <CountUp value={metric.value} />
                  </span>
                  <span className="lsh-display mt-3 block text-sm text-white/70">
                    {metric.unit}
                  </span>
                </dd>
              </StaggerItem>
            ))}
          </Stagger>
          {/* The source and the cumulative qualification, once, under all three. */}
          <Reveal>
            <p className="mt-12 border-t border-white/20 pt-6 text-xs leading-5 text-white/50">
              {homepage.glance.source}
            </p>
          </Reveal>
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
              description={homepage.closing.lead}
            />
            <div className="shrink-0">
              <ActionLink action="contact_directory">View all contact options</ActionLink>
            </div>
          </Reveal>
          <Stagger className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {contact.channels.map((channel) => (
              <StaggerItem key={channel.label} className="border-t border-white/25 pt-6">
                <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                  {channel.homeLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/70">{channel.blurb}</p>
                {/*
                 * The person's name, only where the channel routes to one.
                 * Investor Relations and General Business Enquiries are routes,
                 * not people, so they print the heading and the address alone.
                 */}
                {"homeShowsName" in channel ? (
                  <p className="lsh-display mt-4 text-2xl leading-none">{channel.name}</p>
                ) : null}
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
          {/* Nothing is sold on this site, so an order question belongs to the store. */}
          <Reveal>
            <p className="mt-12 border-t border-white/20 pt-6 text-sm leading-6 text-white/60">
              {homepage.closing.note}
            </p>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
