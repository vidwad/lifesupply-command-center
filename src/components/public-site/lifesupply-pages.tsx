import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Mail, Phone, ShieldCheck } from "lucide-react";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  EditorialStat,
  Eyebrow,
  PrimaryAction,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { LIFE_SUPPLY_CONTENT, LIFE_SUPPLY_ROUTES } from "@/lib/public-site/lifesupply-content";

/*
 * Every visible sentence below is a prop from LIFE_SUPPLY_CONTENT. The only
 * strings authored in this file are imperative UI labels on links.
 *
 * Each page renders exactly one PublicHero, which is the route's single h1.
 *
 * Page families live in `./pages/` and are re-exported here so the route
 * files keep one import: Home and About (Stage 2); Our Businesses, the four
 * brand pages, Technology & fulfilment, Clinic Solutions, Shop & Services,
 * and Contact (Stage 3); Metabolic Health, the care-kit hub, the kit pages,
 * and Refills (Stage 4). The pages below keep their baseline until their
 * own stage (Team, Investors, News, and profiles in Stage 5).
 */
export { AboutPage } from "@/components/public-site/pages/about";
export {
  ClinicsBrandPage,
  StoreBrandPage,
  TechnologyFulfilmentPage,
} from "@/components/public-site/pages/brands";
export {
  ClinicSolutionsPage,
  DesignBuildPage,
  EquipmentPage,
  OngoingSuppliesPage,
} from "@/components/public-site/pages/clinic-solutions";
export { ContactPage } from "@/components/public-site/pages/contact";
export { LifeSupplyHome } from "@/components/public-site/pages/home";
export {
  CareKitPage,
  CareKitsPage,
  MetabolicHealthPage,
  RefillsPage,
} from "@/components/public-site/pages/metabolic";
export { OperationsPage } from "@/components/public-site/pages/operations";
export { ShopServicesPage } from "@/components/public-site/pages/shop";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

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
