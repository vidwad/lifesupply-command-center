import { Mail, Phone } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import type { ActionKey } from "@/lib/public-site/actions";
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
import { IconBadge } from "@/components/public-site/sections";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/**
 * Homepage — the Stage 2 page contract (guide §3, `/`): group introduction,
 * verified proof, four brands, clinic lifecycle, metabolic opportunity,
 * partner and investor paths, closing contact. The historical news block
 * was removed on 2026-09-09 (product owner); the newsroom carries it.
 *
 * Every sentence is a prop from the content model; every destination is an
 * action-registry key or a registry link. Only imperative UI labels are
 * authored here. The design pass gives each section its own rhythm: icons
 * on the steps and paths and one red band; the clinic lifecycle and the
 * metabolic offer carry no image (product owner, 2026-09-08).
 */
export function LifeSupplyHome() {
  const { homepage, contact } = LIFE_SUPPLY_CONTENT;
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
            <ActionLink action="investor_information">Investor information</ActionLink>
            <ActionLink action="explore_businesses" variant="onDark" />
          </>
        }
      />

      {/* Audience routes: the three journeys, immediately under the hero. */}
      <section className="border-b border-[var(--lsh-rule)] px-5 py-12 lg:px-8">
        <Container>
          <Reveal>
            <Eyebrow as="h2">{homepage.audiences.eyebrow}</Eyebrow>
          </Reveal>
          <Stagger as="ul" className="mt-6 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {homepage.audiences.items.map((route) => (
              <StaggerItem
                key={route.title}
                as="li"
                className="flex h-full flex-col bg-[var(--lsh-paper)] p-6 lg:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                    {route.title}
                  </h3>
                  <IconBadge icon={iconForTitle(route.title)} size={18} />
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{route.text}</p>
                <div className="mt-auto pt-5">
                  <ActionLink action={route.action as ActionKey} variant="text" />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* Who we are, where we are going, where we want to be: three panels after the hero. */}
      <section className="bg-[var(--lsh-paper)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={homepage.whoWeAre.eyebrow} title={homepage.whoWeAre.title} />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-px bg-[var(--lsh-rule)] lg:grid-cols-3">
            {homepage.whoWeAre.panels.map((panel, index) => (
              <StaggerItem
                key={panel.headline}
                as="li"
                className="flex h-full flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 lg:p-10"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                    {panel.eyebrow}
                  </p>
                  <span className="lsh-display text-sm text-[var(--lsh-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="lsh-display mt-5 text-4xl leading-none tracking-tight text-[var(--lsh-charcoal)] sm:text-5xl">
                  {panel.headline}
                </h3>
                <span
                  aria-hidden="true"
                  className="mt-6 block h-0.5 w-12 bg-[var(--lsh-brand-red)]"
                />
                <p className="mt-6 leading-7 text-[var(--lsh-muted)]">{panel.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* Group introduction. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
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
      <section className="bg-[var(--lsh-paper)]">
        <Container className="py-20">
          <Reveal>
            <SectionHeading
              eyebrow={homepage.glance.eyebrow}
              title={homepage.glance.title}
              description={homepage.glance.description}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-3">
            {homepage.publicMetrics.map((metric) => (
              <StaggerItem key={metric.label} className="h-full">
                <EditorialStat value={metric.value} label={metric.label} size="large" />
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
          <Stagger as="ul" className="mt-12 grid gap-px bg-white/15 lg:grid-cols-3">
            {homepage.clinicLifecycle.steps.map((step) => (
              <StaggerItem
                key={step.index}
                as="li"
                className="flex h-full flex-col bg-[var(--lsh-charcoal)] p-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <IconBadge icon={iconForTitle(step.title)} tone="onDark" />
                  <span className="lsh-display text-sm text-[var(--lsh-red-on-ink)]">
                    {step.index}
                  </span>
                </div>
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
        <Reveal className="mx-auto grid max-w-7xl gap-8 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-2 lg:pl-8">
          <div>
            <div className="flex items-start gap-5">
              <IconBadge icon="activity" />
              <span className="lsh-display inline-flex border border-[var(--lsh-brand-red)] px-3 py-1 text-[10px] text-[var(--lsh-brand-red)]">
                {homepage.metabolic.eyebrow}
              </span>
            </div>
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
                <div className="flex items-start justify-between gap-4">
                  <Eyebrow as="h3">{path.eyebrow}</Eyebrow>
                  <IconBadge icon={iconForTitle(path.eyebrow)} />
                </div>
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
                <div className="flex items-start justify-between gap-4">
                  <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                    {channel.label}
                  </p>
                  <IconBadge icon={iconForTitle(channel.label)} tone="onDark" size={18} />
                </div>
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
          </Stagger>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}
