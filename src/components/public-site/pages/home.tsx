import Link from "next/link";
import { ArrowRight, ExternalLink, Mail, Phone } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { BrandGrid } from "@/components/public-site/brand-grid";
import { HeroVideo } from "@/components/public-site/hero-video";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  EditorialStat,
  Eyebrow,
  InfoBand,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { LIFE_SUPPLY_CONTENT, LIFE_SUPPLY_ROUTES } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/**
 * Homepage — the Stage 2 page contract (guide §3, `/`): group introduction,
 * verified proof, four brands, clinic lifecycle, metabolic opportunity,
 * partner and investor paths, current news, closing contact.
 *
 * Every sentence is a prop from the content model; every destination is an
 * action-registry key or a registry link. Only imperative UI labels are
 * authored here.
 */
export function LifeSupplyHome() {
  const { homepage, news, contact, brand } = LIFE_SUPPLY_CONTENT;
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
            <ActionLink action="explore_businesses" />
            <ActionLink action="plan_clinic" variant="onDark">
              Plan a clinic
            </ActionLink>
            <ActionLink action="investor_information" variant="onDark">
              Investor information
            </ActionLink>
          </>
        }
      />

      {/* Group introduction. */}
      <section className="px-5 py-20 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow={homepage.introduction.eyebrow}
            title={homepage.introduction.title}
          />
          <div className="border-l-4 border-[var(--lsh-brand-red)] pl-6">
            <p className="lsh-display text-2xl leading-[1.15] text-[var(--lsh-charcoal)] sm:text-3xl">
              {homepage.introduction.statement}
            </p>
            <p className="mt-5 max-w-2xl leading-7 text-[var(--lsh-muted)]">
              {homepage.introduction.qualification}
            </p>
          </div>
        </Reveal>
      </section>

      {/* The legacy red information band, carrying the operating-context statement. */}
      <Reveal>
        <InfoBand
          eyebrow={homepage.operatingContext.eyebrow}
          statement={homepage.operatingContext.statement}
        />
      </Reveal>

      {/* Verified proof: the three approved figures, with their source context. */}
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

      {/* The four operating brands, from the registry. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
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
        </div>
      </section>

      {/* Clinic lifecycle: plan, equip, supply. Each step has its own verified destination. */}
      <section className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={homepage.clinicLifecycle.eyebrow}
              title={homepage.clinicLifecycle.title}
              description={homepage.clinicLifecycle.intro}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-px bg-white/15 lg:grid-cols-3">
            {homepage.clinicLifecycle.steps.map((step) => (
              <StaggerItem
                key={step.index}
                as="article"
                className="flex h-full flex-col bg-[var(--lsh-charcoal)] p-8"
              >
                <p className="lsh-display text-sm text-[var(--lsh-red-on-ink)]">{step.index}</p>
                <span className="mt-3 block h-1 w-8 bg-[var(--lsh-brand-red)]" aria-hidden="true" />
                <h3 className="lsh-display mt-6 text-2xl">{step.title}</h3>
                <p className="mt-3 leading-7 text-white/75">{step.text}</p>
                <div className="mt-auto pt-6">
                  <ActionLink action={step.action} variant="onDark">
                    {step.actionLabel}
                  </ActionLink>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal>
            <p className="mt-8 max-w-3xl text-sm leading-6 text-white/60">
              {homepage.clinicLifecycle.note}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Metabolic opportunity, with its status stated. */}
      <section className="px-5 py-20 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-[1fr_1fr] lg:pl-8">
          <div>
            <span className="lsh-display inline-flex border border-[var(--lsh-brand-red)] px-3 py-1 text-[10px] text-[var(--lsh-brand-red)]">
              {homepage.metabolic.eyebrow}
            </span>
            <h2 className="lsh-display mt-5 text-3xl leading-[1.08] text-[var(--lsh-charcoal)] sm:text-4xl">
              {homepage.metabolic.title}
            </h2>
          </div>
          <div>
            <p className="leading-7 text-[var(--lsh-muted)]">{homepage.metabolic.text}</p>
            <div className="mt-6">
              <ActionLink action={homepage.metabolic.action} variant="onLight">
                {homepage.metabolic.actionLabel}
              </ActionLink>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Partner and investor paths. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          {homepage.paths.map((path) => (
            <StaggerItem key={path.eyebrow} className="h-full">
              <SpotlightCard
                as="article"
                className="lsh-lift flex h-full flex-col border border-t-4 border-[var(--lsh-rule)] border-t-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8"
              >
                <Eyebrow as="h3">{path.eyebrow}</Eyebrow>
                <p className="lsh-display mt-4 text-2xl leading-[1.1] text-[var(--lsh-charcoal)]">
                  {path.title}
                </p>
                <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{path.text}</p>
                <div className="mt-auto pt-6">
                  <ActionLink action={path.action} variant="text">
                    {path.actionLabel}
                  </ActionLink>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Current news: the dated public record, labelled historical. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow={homepage.newsroom.eyebrow}
              title={homepage.newsroom.title}
              description={homepage.newsroom.note}
            />
            <Link
              href={LIFE_SUPPLY_ROUTES.news}
              className="lsh-display inline-flex shrink-0 items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]"
            >
              All news <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </Reveal>
          <Stagger className="mt-10 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-2 xl:grid-cols-4">
            {news.map((item) => (
              <StaggerItem key={item.href} className="h-full">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col bg-[var(--lsh-paper)] p-7"
                >
                  <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                    {item.date} · {item.source}
                  </p>
                  <h3 className="lsh-display mt-3 text-xl leading-tight text-[var(--lsh-charcoal)]">
                    {item.title}
                  </h3>
                  <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-5 text-[11px] text-[var(--lsh-brand-red)]">
                    Read source{" "}
                    <ExternalLink
                      size={14}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </span>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Closing contact: the verified directory. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
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
          <Stagger className="mt-10 grid gap-px bg-white/15 md:grid-cols-2 xl:grid-cols-3">
            {contact.channels.map((channel) => (
              <StaggerItem key={channel.label} className="bg-[var(--lsh-ink)] p-6">
                <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                  {channel.label}
                </p>
                <p className="lsh-display mt-2 text-xl">{channel.name}</p>
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
            <StaggerItem className="bg-[var(--lsh-ink)] p-6">
              <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                Corporate office
              </p>
              <address className="mt-3 text-sm not-italic leading-6 text-white/75">
                {brand.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </StaggerItem>
          </Stagger>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}
