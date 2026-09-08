import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink, Mail, Phone, ShieldCheck } from "lucide-react";

import { HeroVideo } from "@/components/public-site/hero-video";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  CommandCenterLoginLink,
  Container,
  EditorialStat,
  Eyebrow,
  ImageBand,
  InfoBand,
  PrimaryAction,
  PublicHero,
  SecondaryAction,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import {
  Reveal,
  ScrollBeam,
  SpotlightCard,
  Stagger,
  StaggerItem,
} from "@/components/public-site/motion";
import { LIFE_SUPPLY_CONTENT, LIFE_SUPPLY_ROUTES } from "@/lib/public-site/lifesupply-content";

/*
 * Every visible sentence below is a prop from LIFE_SUPPLY_CONTENT. The only
 * strings authored in this file are imperative UI labels on links and the
 * short section labels that name a block ("Operations timeline").
 *
 * Each page renders exactly one PublicHero, which is the route's single h1.
 *
 * Motion: sections reveal once as they scroll into view, grids stagger their
 * cards, cards carry a pointer spotlight over the shared lift, and figures
 * count up to the approved text. All of it collapses to the final state for
 * visitors who prefer reduced motion (see motion.tsx).
 */

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/** The operating-brand cards, shared by the homepage and the About page. */
function BrandCards() {
  const { about } = LIFE_SUPPLY_CONTENT;
  return (
    <Stagger className="grid gap-5 lg:grid-cols-3">
      {about.brands.map((brandItem) => (
        <StaggerItem key={brandItem.name} className="h-full">
          <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
            <a
              href={brandItem.url}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col p-7"
            >
              <Building2
                className="text-[var(--lsh-brand-red)] transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
              <h3 className="lsh-display mt-8 text-2xl text-[var(--lsh-charcoal)]">
                {brandItem.name}
              </h3>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{brandItem.description}</p>
              <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]">
                Visit brand{" "}
                <ExternalLink
                  size={15}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
            </a>
          </SpotlightCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function LifeSupplyHome() {
  const { homepage, about } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PublicHero
        size="home"
        eyebrow={homepage.eyebrow}
        title={homepage.title}
        description={homepage.description}
        media={<HeroVideo {...homepage.heroMedia} />}
        actions={
          <>
            <PrimaryAction href={LIFE_SUPPLY_ROUTES.about}>Explore LifeSupply</PrimaryAction>
            <SecondaryAction href={LIFE_SUPPLY_ROUTES.investorRelations}>
              Investor relations
            </SecondaryAction>
            <CommandCenterLoginLink variant="hero" />
          </>
        }
      />

      {/* The legacy red information band, carrying the operating-context statement. */}
      <Reveal>
        <InfoBand
          eyebrow={homepage.operatingContext.eyebrow}
          statement={homepage.operatingContext.statement}
        />
      </Reveal>

      {/* Hairline grid: the rule colour shows only through the 1px gaps, so no padding on the grid itself. */}
      <section className="px-5 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-px bg-[var(--lsh-rule)] lg:grid-cols-3">
          {homepage.pillars.map((pillar) => (
            <StaggerItem key={pillar.index} className="h-full">
              <SpotlightCard as="article" className="group h-full bg-[var(--lsh-paper)] px-7 py-10">
                <p className="lsh-display text-sm text-[var(--lsh-brand-red)]">{pillar.index}</p>
                <span
                  className="mt-3 block h-1 w-8 bg-[var(--lsh-brand-red)] transition-[width] duration-300 group-hover:w-16 motion-reduce:transition-none"
                  aria-hidden="true"
                />
                <h2 className="lsh-display mt-6 text-3xl text-[var(--lsh-charcoal)]">
                  {pillar.title}
                </h2>
                <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{pillar.text}</p>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading
              eyebrow={homepage.glance.eyebrow}
              title={homepage.glance.title}
              description={homepage.glance.description}
            />
          </Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-3">
            {homepage.publicMetrics.map((metric) => (
              <StaggerItem key={metric.label} className="h-full">
                <EditorialStat value={metric.value} label={metric.label} />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* The operating brands, from the About page's approved portfolio copy. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading eyebrow={about.portfolio.eyebrow} title={about.portfolio.title} />
          </Reveal>
          <div className="mt-10">
            <BrandCards />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <Reveal className="mx-auto flex max-w-7xl flex-col justify-between gap-7 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:flex-row lg:items-center lg:pl-8">
          <SectionHeading eyebrow={homepage.overview.eyebrow} title={homepage.overview.title} />
          <div className="shrink-0">
            <PrimaryAction href={LIFE_SUPPLY_ROUTES.operations}>Our operations</PrimaryAction>
          </div>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}

export function AboutPage() {
  const { about, brand } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        description={about.growth}
      />

      {/* The label is the heading; the statement is the content. */}
      <section className="px-5 py-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-px bg-[var(--lsh-rule)] lg:grid-cols-2">
          <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-8 lg:p-10">
            <Eyebrow as="h2">{about.labels.mission}</Eyebrow>
            <p className="lsh-display mt-5 text-3xl leading-[1.1] text-[var(--lsh-charcoal)]">
              {about.mission}
            </p>
          </StaggerItem>
          <StaggerItem className="h-full border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white lg:p-10">
            <Eyebrow as="h2" tone="onDark">
              {about.labels.vision}
            </Eyebrow>
            <p className="lsh-display mt-5 text-3xl leading-[1.1] text-white">{about.vision}</p>
          </StaggerItem>
        </Stagger>
      </section>

      <section className="bg-[var(--lsh-paper)] pb-20">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={about.portfolio.eyebrow} title={about.portfolio.title} />
          </Reveal>
          <div className="mt-10">
            <BrandCards />
          </div>
          {/*
           * The lockup is white on transparent. The first pass placed it on this
           * white section at 75% opacity, where it could not be seen at all. It
           * now sits on the charcoal band it needs, at its intrinsic 389×93.
           */}
          <Reveal className="mt-14">
            <ImageBand
              src={brand.portfolioImage}
              alt={brand.portfolioImageAlt}
              width={brand.portfolioImageWidth}
              height={brand.portfolioImageHeight}
              eyebrow={about.portfolio.eyebrow}
            />
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}

export function OperationsPage() {
  const { operations, operationsTimeline } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Our operations"
        title="Connected channels designed around medical-product access."
        description="The public operating narrative describes online commerce, fulfillment, retail, wholesale, and regulated-care infrastructure as complementary functions."
      />

      {/* The divisions as a beam that fills in as the visitor reads down them. */}
      <section className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
        <ScrollBeam className="pl-10">
          <div className="grid gap-12">
            {operations.map((operation, index) => (
              <Reveal key={operation.title} as="article" className="relative">
                <span
                  className="absolute -left-10 top-2 h-3 w-3 -translate-x-[calc(50%-1px)] rounded-full bg-[var(--lsh-brand-red)] ring-4 ring-[var(--lsh-paper)]"
                  aria-hidden="true"
                />
                <p className="lsh-display text-sm text-[var(--lsh-brand-red)]">0{index + 1}</p>
                <h2 className="lsh-display mt-2 text-3xl text-[var(--lsh-charcoal)]">
                  {operation.title}
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-[var(--lsh-muted)]">
                  {operation.description}
                </p>
              </Reveal>
            ))}
          </div>
        </ScrollBeam>
      </section>

      {/* The timeline graphic is portrait; it gets its own column rather than a cropped landscape slot. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <Eyebrow as="h2">Operations timeline</Eyebrow>
            <div className="mt-6 overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-4 shadow-sm">
              <Image
                src={operationsTimeline.src}
                alt={operationsTimeline.alt}
                width={operationsTimeline.width}
                height={operationsTimeline.height}
                sizes="(min-width: 768px) 640px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function TeamPage() {
  const { management, board } = LIFE_SUPPLY_CONTENT.team;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Our team"
        title="Leadership across operations, finance, business development, and technology."
        description="Profiles below preserve publicly sourced historical information and should be reviewed in the Command Center publication workflow before future updates."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {management.map((member) => (
            <StaggerItem key={member.slug} className="h-full">
              <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                <Link href={`/${member.slug}/`} className="group flex h-full flex-col p-7">
                  <div className="flex items-start gap-5">
                    {"image" in member ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={92}
                        height={92}
                        className="h-20 w-20 rounded-full object-cover ring-0 ring-[var(--lsh-brand-red)] transition-[box-shadow] duration-300 group-hover:ring-4 motion-reduce:transition-none"
                      />
                    ) : (
                      <div
                        className="lsh-display flex h-20 w-20 items-center justify-center rounded-full bg-[var(--lsh-surface)] text-2xl text-[var(--lsh-brand-red)] ring-0 ring-[var(--lsh-brand-red)] transition-[box-shadow] duration-300 group-hover:ring-4 motion-reduce:transition-none"
                        aria-hidden="true"
                      >
                        {member.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                    )}
                    <div>
                      <h2 className="lsh-display text-2xl text-[var(--lsh-charcoal)]">
                        {member.name}
                      </h2>
                      <p className="lsh-display mt-1 text-[10px] text-[var(--lsh-brand-red)]">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <p className="mt-6 leading-7 text-[var(--lsh-muted)]">{member.summary}</p>
                  <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]">
                    View profile{" "}
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-16 border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white">
          <Eyebrow as="h2" tone="onDark">
            Board of directors
          </Eyebrow>
          <Stagger as="ul" className="mt-6 flex flex-wrap gap-3">
            {board.map((name) => (
              <StaggerItem
                key={name}
                as="li"
                className="border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:border-[var(--lsh-red-on-ink)] hover:text-white"
              >
                {name}
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}

export function InvestorRelationsPage() {
  const investor = LIFE_SUPPLY_CONTENT.investorRelations;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Investor relations"
        title={investor.title}
        description={investor.description}
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        {/*
         * The presentation preview is a tall portrait capture. It is shown
         * from the top in a fixed-height window that fades out at the foot,
         * and pans upward a little on hover, rather than being squashed into
         * the landscape slot it used to occupy.
         */}
        <Reveal className="group relative max-h-[40rem] overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-4 lg:sticky lg:top-28 lg:self-start">
          <Image
            src={investor.preview.src}
            alt={investor.preview.alt}
            width={investor.preview.width}
            height={investor.preview.height}
            sizes="(min-width: 1024px) 560px, 100vw"
            className="h-auto w-full shadow-sm transition-transform ease-out [transition-duration:1200ms] group-hover:-translate-y-10 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--lsh-surface)] to-transparent"
            aria-hidden="true"
          />
        </Reveal>
        <div>
          <Reveal>
            <SectionHeading
              eyebrow={investor.currentReport.period}
              title="Current report context"
              description={investor.currentReport.status}
            />
          </Reveal>
          <Stagger className="mt-8 grid gap-3 sm:grid-cols-3">
            {investor.currentReport.highlights.map((item) => (
              <StaggerItem key={item.label} className="h-full">
                <EditorialStat value={item.value} label={item.label} />
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-8 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
            <div className="lsh-display flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
              <ShieldCheck size={18} aria-hidden="true" /> Disclosure context
            </div>
            <p className="mt-3 leading-7 text-[var(--lsh-muted)]">
              {investor.expansionContext.description}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${investor.contact.email}`}
              className="lsh-primary-action lsh-display inline-flex items-center gap-2 px-5 py-3 text-[11px] transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <Mail size={16} aria-hidden="true" /> {investor.contact.email}
            </a>
            <a
              href={telHref(investor.contact.phone)}
              className="lsh-display inline-flex items-center gap-2 border border-[var(--lsh-rule-strong)] px-5 py-3 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              <Phone size={16} aria-hidden="true" /> {investor.contact.phone}
            </a>
          </Reveal>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function NewsPage() {
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Company news"
        title="Historical news and corporate announcements."
        description="This archive preserves public source links while the Command Center publication workflow is introduced for future news."
      />
      <section className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
        <Stagger className="grid gap-4">
          {LIFE_SUPPLY_CONTENT.news.map((item) => (
            <StaggerItem key={item.href}>
              <SpotlightCard className="lsh-lift border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid gap-4 p-7 sm:grid-cols-[1fr_auto] sm:items-end"
                >
                  <div>
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {item.date} · {item.source}
                    </p>
                    <h2 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">
                      {item.title}
                    </h2>
                  </div>
                  <span className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                    Read source{" "}
                    <ExternalLink
                      size={15}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </span>
                </a>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </LifeSupplyLayout>
  );
}

export function ContactPage() {
  const { channels, subsidiaries } = LIFE_SUPPLY_CONTENT.contact;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Contact"
        title="Direct public channels for the right LifeSupply conversation."
        description="Published contact details are treated as a verified corporate directory. Future form routing will be managed through the Command Center publication and approval workflow."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Stagger className="grid gap-5 md:grid-cols-2">
          {channels.map((channel) => (
            <StaggerItem key={channel.label} className="h-full">
              <SpotlightCard
                as="article"
                className="lsh-lift h-full border border-t-4 border-[var(--lsh-rule)] border-t-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-7"
              >
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                  {channel.label}
                </p>
                <h2 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">
                  {channel.name}
                </h2>
                <div className="mt-5 grid gap-2 text-sm text-[var(--lsh-muted)]">
                  <a
                    href={`mailto:${channel.email}`}
                    className="inline-flex w-fit items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
                  >
                    <Mail size={15} aria-hidden="true" /> {channel.email}
                  </a>
                  {"phone" in channel ? (
                    <a
                      href={telHref(channel.phone)}
                      className="inline-flex w-fit items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
                    >
                      <Phone size={15} aria-hidden="true" /> {channel.phone}
                    </a>
                  ) : null}
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading eyebrow="Operating entities" title="LifeSupply public subsidiaries" />
          </Reveal>
          <Stagger className="mt-8 grid gap-4 lg:grid-cols-3">
            {subsidiaries.map((entity) => (
              <StaggerItem key={entity.name} className="h-full">
                <SpotlightCard className="lsh-lift h-full border border-transparent bg-[var(--lsh-paper)]">
                  <a
                    href={entity.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex h-full flex-col p-6"
                  >
                    <h3 className="lsh-display text-xl text-[var(--lsh-charcoal)]">
                      {entity.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                      {entity.detail}
                    </p>
                    <p className="lsh-display mt-auto pt-3 text-[10px] text-[var(--lsh-brand-red)]">
                      {entity.phone}
                    </p>
                  </a>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

export function ShopBoundaryPage() {
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Product access"
        title="Commerce occurs through LifeSupply’s approved operating channels."
        description="This corporate website does not process transactions. Future product discovery will be published from a channel-approved Command Center projection, while orders remain in the designated commerce system."
      />
      <section className="mx-auto max-w-4xl px-5 py-20 text-center lg:px-8">
        <Reveal>
          <p className="lsh-display text-3xl text-[var(--lsh-charcoal)]">
            Looking for medical products?
          </p>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-[var(--lsh-muted)]">
            Visit LifeSupply’s consumer-facing ecommerce channel for current catalogue,
            availability, fulfillment, payment, and customer-service information.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryAction href="https://lifesupply.ca" external>
              Visit LifeSupply.ca
            </PrimaryAction>
          </div>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}

export function LegacyProfilePage({ slug }: { slug: string }) {
  const profile = LIFE_SUPPLY_CONTENT.team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) return null;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow="Leadership profile" title={profile.name} description={profile.role} />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 shadow-sm sm:p-12">
          <Eyebrow>Historical public profile</Eyebrow>
          <p className="mt-6 text-lg leading-8 text-[var(--lsh-muted)]">{profile.bio}</p>
          <p className="mt-8 border-t border-[var(--lsh-rule)] pt-6 text-sm leading-6 text-[var(--lsh-muted)]">
            This preserved biography is sourced from the prior public website. The Command Center
            publication workflow will govern subsequent current-role or biography updates.
          </p>
          <div className="mt-8">
            <PrimaryAction href={LIFE_SUPPLY_ROUTES.team}>Return to team</PrimaryAction>
          </div>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}
