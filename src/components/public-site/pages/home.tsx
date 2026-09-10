import { Mail, Phone } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import type { ActionKey } from "@/lib/public-site/actions";
import { BrandGrid } from "@/components/public-site/brand-grid";
import { HeroVideo } from "@/components/public-site/hero-video";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  InfoBand,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { renderIcon } from "@/components/public-site/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
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

      {/*
       * Where to start: an index, not a card grid (2026-09-10).
       *
       * These were three bordered tiles with an 18px glyph boxed in the
       * corner, the same shape as the six sections below them. As an index
       * the rows can breathe, the icon can be drawn at a size where it is
       * actually a drawing, and the red rule that draws under a row on hover
       * does the work the border was doing badly.
       */}
      <section className="px-5 py-14 lg:px-8">
        <Container>
          <Reveal>
            <Eyebrow as="h2">{homepage.audiences.eyebrow}</Eyebrow>
          </Reveal>
          <Stagger as="ul" className="mt-8">
            {homepage.audiences.items.map((route, index) => (
              <StaggerItem
                key={route.title}
                as="li"
                className="lsh-rule-draw relative border-t border-[var(--lsh-rule)] last:border-b"
              >
                <div className="grid items-baseline gap-x-8 gap-y-4 py-8 md:grid-cols-[auto_minmax(0,22rem)_minmax(0,1fr)_auto] lg:py-10">
                  <span
                    aria-hidden="true"
                    className="lsh-display hidden text-[11px] text-[var(--lsh-muted)] md:block"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--lsh-brand-red)]" aria-hidden="true">
                      {renderIcon(iconForTitle(route.title), { size: 34, strokeWidth: 1.5 })}
                    </span>
                    <h3 className="lsh-display text-2xl leading-none text-[var(--lsh-charcoal)] lg:text-3xl">
                      {route.title}
                    </h3>
                  </div>
                  <p className="max-w-xl leading-7 text-[var(--lsh-muted)]">{route.text}</p>
                  <div className="md:justify-self-end">
                    <ActionLink action={route.action as ActionKey} variant="text" />
                  </div>
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
          {/*
           * Three columns, no panels. The gap-px trick drew a box around each
           * one, which made a statement of intent look like a specification
           * table. A single red rule over each column and a headline set two
           * steps larger carries it instead.
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
                {/*
                 * Sized for the column, not the viewport: the statement scale
                 * is a full-width device and overruns a third of the grid.
                 */}
                <h3 className="lsh-display mt-4 text-[2.5rem] leading-[0.9] tracking-tight text-[var(--lsh-charcoal)] sm:text-5xl lg:text-[3.25rem]">
                  {panel.headline}
                </h3>
                <p className="mt-6 max-w-md leading-7 text-[var(--lsh-muted)]">{panel.text}</p>
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

      {/*
       * Verified proof, given the page's loudest moment (2026-09-10).
       *
       * Twenty-five years, fifty thousand products and a million customers is
       * the strongest thing this company can say, and it was set as three
       * hairline tiles indistinguishable from the partner cards further down.
       * On ink, at the figure scale, the digits become the picture. It also
       * breaks a long run of white sections at the point the page needs air.
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
          {/* Steps in a sequence, ruled rather than boxed (2026-09-10). */}
          <Stagger as="ul" className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-3">
            {homepage.clinicLifecycle.steps.map((step) => (
              <StaggerItem
                key={step.index}
                as="li"
                className="flex h-full flex-col border-t border-white/25 pt-6"
              >
                <span className="lsh-display text-[11px] text-[var(--lsh-red-on-ink)]">
                  {step.index}
                </span>
                <h3 className="lsh-display mt-4 text-2xl leading-none lg:text-3xl">{step.title}</h3>
                <p className="mt-4 max-w-md leading-7 text-white/70">{step.text}</p>
                <div className="mt-auto pt-7">
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
            <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
              {homepage.metabolic.eyebrow}
            </p>
            <h2 className="lsh-display mt-4 text-3xl leading-[1.02] text-[var(--lsh-charcoal)] sm:text-4xl lg:text-[2.75rem]">
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
        {/*
         * Two routes, set as an editorial pair rather than two identical
         * bordered tiles with a glyph in the corner (2026-09-10). The red rule
         * over each one and the larger title do the separating.
         */}
        <Stagger className="mx-auto grid max-w-7xl gap-x-14 gap-y-14 lg:grid-cols-2">
          {homepage.paths.map((path) => (
            <StaggerItem key={path.eyebrow} as="article" className="flex h-full flex-col">
              <span aria-hidden="true" className="block h-1 w-full bg-[var(--lsh-brand-red)]" />
              <div className="mt-6">
                <Eyebrow as="h3">{path.eyebrow}</Eyebrow>
              </div>
              <p className="lsh-display mt-4 text-3xl leading-[1.02] text-[var(--lsh-charcoal)] lg:text-[2.5rem]">
                {path.title}
              </p>
              <p className="mt-5 max-w-xl leading-7 text-[var(--lsh-muted)]">{path.text}</p>
              <div className="mt-auto pt-7">
                <ActionLink action={path.action} variant="text">
                  {path.actionLabel}
                </ActionLink>
              </div>
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
        </div>
      </section>
    </LifeSupplyLayout>
  );
}
