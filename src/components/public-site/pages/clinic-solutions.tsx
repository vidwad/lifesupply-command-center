import { ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection, OnThisPage } from "@/components/public-site/on-this-page";
import { ServiceChannels } from "@/components/public-site/pages/brands";
import { SiteScreen } from "@/components/public-site/site-screen";
import { Callout, IconBadge, ProcessSteps, SplitSection } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { getBrand } from "@/lib/public-site/brands";
import { BRAND_GRAPHICS } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/** The two sentences the clinic project material leads with. */
function ClinicDistinction() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  return (
    <section className="px-5 py-12 lg:px-8">
      <Reveal className="mx-auto grid max-w-7xl gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-[auto_1fr_1fr] lg:pl-8">
        <IconBadge icon="shield" />
        <p className="leading-7 text-[var(--lsh-charcoal)]">{clinics.distinction}</p>
        <p className="leading-7 text-[var(--lsh-muted)]">{clinics.attribution}</p>
      </Reveal>
    </section>
  );
}

/** A checklist block. */
function Checklist({
  title,
  text,
  items,
  icon = "clipboardCheck",
}: {
  title: string;
  text?: string;
  items: readonly string[];
  icon?: string;
}) {
  return (
    <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
      <div className="flex items-start justify-between gap-4">
        <Eyebrow as="h3">{title}</Eyebrow>
        <IconBadge icon={icon} size={18} />
      </div>
      {text ? <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{text}</p> : null}
      <ul className="mt-5 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
        {items.map((item) => (
          <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
            {item}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/** Closing band: the conditional post-opening statement plus the page's actions. */
function ConditionalClose({ actions }: { actions: readonly ActionKey[] }) {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  return (
    <section className="bg-[var(--lsh-ink)] px-5 py-16 text-white lg:px-8">
      <Reveal className="mx-auto flex max-w-7xl flex-col justify-between gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:flex-row lg:items-center lg:pl-8">
        <div className="flex items-start gap-5">
          <IconBadge icon="workflow" tone="onDark" />
          <p className="max-w-2xl leading-7 text-white/80">{clinics.postOpening}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {actions.map((action, index) => (
            <ActionLink key={action} action={action} variant={index === 0 ? "primary" : "onDark"} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/**
 * Planning and building (`#planning`): the three needs that route the page,
 * the brand's services and specialties, its process, its published projects,
 * and what a consultation covers.
 */
function PlanningSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const { hub } = clinics;
  const record = getBrand("clinics");
  return (
    <AnchoredSection id="planning">
      {/* The three needs, each with its verified destination. */}
      <section className="px-5 pb-20 lg:px-8">
        <Stagger className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {hub.needs.map((need) => (
            <StaggerItem key={need.index} className="h-full">
              <SpotlightCard
                as="article"
                className="lsh-lift flex h-full flex-col border-t-2 border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] p-7 transition-colors hover:border-[var(--lsh-brand-red)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <IconBadge icon={iconForTitle(need.title)} />
                  <span className="lsh-display text-sm text-[var(--lsh-brand-red)]">
                    {need.index}
                  </span>
                </div>
                <h2 className="lsh-display mt-6 text-xl leading-tight text-[var(--lsh-charcoal)]">
                  {need.title}
                </h2>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{need.text}</p>
                <div className="mt-auto pt-6">
                  <ActionLink action={need.action as ActionKey} variant="text" />
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Services and specialties, beside the clinic photograph. */}
      <SplitSection
        tone="onSurface"
        eyebrow={hub.servicesHeading.eyebrow}
        title={hub.servicesHeading.title}
        graphic={BRAND_GRAPHICS.clinics}
        side="left"
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {clinics.services.map((service) => (
            <li key={service.title} className="flex gap-4">
              <IconBadge icon={iconForTitle(service.title)} size={18} />
              <div>
                <h3 className="lsh-display text-lg text-[var(--lsh-charcoal)]">{service.title}</h3>
                <ul className="mt-2 grid gap-1 text-sm leading-6">
                  {service.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Eyebrow as="h3">{hub.specialtiesHeading.title}</Eyebrow>
          <ul className="mt-3 flex flex-wrap gap-2">
            {clinics.specialties.map((item) => (
              <li
                key={item}
                className="lsh-display border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </SplitSection>

      {/* Process. */}
      <ProcessSteps
        eyebrow={hub.processHeading.eyebrow}
        title={hub.processHeading.title}
        steps={clinics.process.map((step) => ({
          index: step.index,
          title: step.title,
          text: step.text,
          icon: iconForTitle(step.title),
        }))}
      />

      {/* Published projects, as the Clinics site presents them, beside its actual home page. */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <SectionHeading
                eyebrow={clinics.projects.eyebrow}
                title={clinics.projects.title}
                description={clinics.geography}
              />
              <p className="mt-6 leading-7 text-[var(--lsh-muted)]">{clinics.attribution}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <SiteScreen site="clinics" className="border border-[var(--lsh-rule)]" />
            </Reveal>
          </div>
          <Stagger
            as="ul"
            className="mt-12 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-2 xl:grid-cols-3"
          >
            {clinics.projects.items.map((project) => (
              <StaggerItem key={project.href} as="li" className="bg-[var(--lsh-paper)]">
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full items-center gap-4 p-6 transition-colors hover:bg-[var(--lsh-surface)]"
                >
                  <IconBadge icon="building" size={18} />
                  <span className="lsh-display flex-1 text-lg leading-tight text-[var(--lsh-charcoal)]">
                    {project.title}
                  </span>
                  <ExternalLink
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </a>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-8">
            <ActionLink action="view_clinic_projects" variant="text" />
          </div>
        </Container>
      </section>

      {/* The consultation, and the Clinics site's own channels. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <Checklist
            title={hub.consultation.title}
            text={hub.consultation.text}
            items={hub.consultation.items}
            icon="clipboardList"
          />
          <ServiceChannels
            record={record}
            title={hub.channelsHeading.title}
            text={hub.channelsHeading.text}
          />
        </Container>
      </section>
    </AnchoredSection>
  );
}

/**
 * Equipment (`#equipment`), absorbed from `/clinic-solutions/equipment/` on
 * 2026-09-10: what a quote request needs, and where the opening-supply
 * categories are published. Equipment pricing is quoted, never listed here.
 */
function EquipmentSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.equipment;
  const store = getBrand("lifesupply");
  const clinicCategories = store.categories.filter((category) => /clinic/i.test(category.label));
  return (
    <AnchoredSection id="equipment">
      <section className="border-t border-[var(--lsh-rule)] px-5 pt-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={page.eyebrow} title={page.title} description={page.intro} />
          </Reveal>
        </Container>
      </section>
      <SplitSection
        tone="onSurface"
        eyebrow="Quote request"
        title={page.quote.title}
        graphic="equipment"
        side="left"
      >
        <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
          {page.quote.items.map((item) => (
            <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
              {item}
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <ActionLink action="equipment_quote" />
        </div>
      </SplitSection>
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="flex gap-5">
            <IconBadge icon="layout" />
            <div>
              <Eyebrow as="h3">{page.catalogue.title}</Eyebrow>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{page.catalogue.text}</p>
            </div>
          </Reveal>
          <Stagger as="ul" className="flex flex-wrap gap-2">
            {clinicCategories.map((category) => (
              <StaggerItem key={category.url} as="li">
                <a
                  href={category.url}
                  target="_blank"
                  rel="noreferrer"
                  className="lsh-display inline-flex items-center gap-1.5 border border-[var(--lsh-rule-strong)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                >
                  {category.label} <ExternalLink size={11} aria-hidden="true" />
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
    </AnchoredSection>
  );
}

/**
 * Ongoing supplies (`#ongoing-supplies`), absorbed from
 * `/clinic-solutions/ongoing-supplies/` on 2026-09-10.
 *
 * Round four, change 5 still governs what belongs here: this is read by a
 * clinic that is already open and wants to buy, so it keeps the non-clinical
 * boundary that qualifies its own content and does not repeat the
 * construction attribution or the project-sequence qualification. Those now
 * sit a few sections above on the same page, which is what the project
 * pointer refers to.
 */
function OngoingSuppliesSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.ongoingSupplies;
  return (
    <AnchoredSection id="ongoing-supplies">
      <section className="px-5 pt-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={page.eyebrow} title={page.title} description={page.intro} />
          </Reveal>
          <Reveal
            delay={0.05}
            className="mt-10 grid gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-2 lg:pl-8"
          >
            <p className="leading-7 text-[var(--lsh-charcoal)]">{page.boundary}</p>
            <p className="leading-7 text-[var(--lsh-muted)]">{page.projectPointer}</p>
          </Reveal>
        </Container>
      </section>
      <SplitSection
        tone="onSurface"
        eyebrow="Supply categories"
        title={page.available.title}
        graphic="shipping"
      >
        <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)] sm:grid-cols-2">
          {page.available.items.map((item) => (
            <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
              {item}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          {page.actions.map((action, index) => (
            <ActionLink
              key={action}
              action={action as ActionKey}
              variant={index === 0 ? "primary" : "onLight"}
            />
          ))}
        </div>
      </SplitSection>
      <Callout icon="shield" eyebrow={page.conditional.title} tone="onLight">
        <p>{page.conditional.text}</p>
      </Callout>
    </AnchoredSection>
  );
}

/**
 * Collaboration (`#collaboration`), absorbed from `/partners/clinics/` on
 * 2026-09-10. It leads with the distinction it exists to draw — a clinic that
 * buys supplies is a customer, not a partner — because nothing after it means
 * anything until that is settled. The statuses are the section's own and stay
 * visible on each item.
 */
function CollaborationSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const section = clinics.collaboration;
  return (
    <AnchoredSection id="collaboration">
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.intro}
            />
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Reveal className="flex gap-5 border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-7">
              <IconBadge icon="shield" />
              <div>
                <Eyebrow as="h3">{section.distinction.title}</Eyebrow>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                  {section.distinction.items.map((item) => (
                    <li key={item} className="border-l-2 border-[var(--lsh-charcoal)] pl-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {section.items.map((item) => (
                <StaggerItem as="li" key={item.title} className="h-full">
                  <article className="flex h-full flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-7">
                    {/*
                     * The status wraps onto its own line rather than being
                     * held beside the title: "Available through LifeSupply
                     * Clinics" is longer than a 320 px card can hold, and a
                     * status that cannot shrink pushes the page sideways.
                     */}
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                      <h3 className="lsh-display min-w-0 text-xl leading-tight text-[var(--lsh-charcoal)]">
                        {item.title}
                      </h3>
                      <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal
            delay={0.1}
            className="mt-8 flex flex-col gap-5 border-t border-[var(--lsh-rule)] pt-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <p className="max-w-3xl leading-7 text-[var(--lsh-muted)]">{section.metabolicNote}</p>
            <div className="flex shrink-0 flex-wrap gap-3">
              {section.actions.map((action, index) => (
                <ActionLink
                  key={action}
                  action={action as ActionKey}
                  variant={index === 0 ? "primary" : "onLight"}
                />
              ))}
            </div>
          </Reveal>
        </Container>
      </section>
    </AnchoredSection>
  );
}

/**
 * `/clinic-solutions/` — the whole clinic relationship on one page (website
 * consolidation, stage 1, 2026-09-10).
 *
 * Equipment, Ongoing supplies and the Partners clinic page were separate
 * addresses until now. They made a visitor guess which of four pages
 * described their situation, and each one had to re-establish the same
 * context before it could say anything. The page is sectioned instead: plan
 * and build, equip, keep supplied, collaborate. `OnThisPage` shows that shape
 * before the reader scrolls, and the three retired addresses redirect to
 * their section.
 *
 * Every section is an `AnchoredSection`, so a redirect or a link that names a
 * fragment lands on the whole block with the sticky header cleared — and it
 * does so with JavaScript disabled, because these are plain anchors rather
 * than scripted scrolling.
 */
export function ClinicSolutionsPage() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const { hub } = clinics;
  const [primary, secondary] = hub.actions as readonly ActionKey[];
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.intro}
        actions={
          <>
            {primary ? <ActionLink action={primary} /> : null}
            {secondary ? <ActionLink action={secondary} variant="onDark" /> : null}
          </>
        }
      />
      <OnThisPage items={clinics.sections} />
      <ClinicDistinction />

      {/* The two ways in, before the three needs: a project, or supplies for an open clinic. */}
      <section className="border-b border-[var(--lsh-rule)] px-5 py-16 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={hub.entry.eyebrow}
              title={hub.entry.title}
              description={hub.entry.note}
            />
          </Reveal>
          <Stagger as="ul" className="mt-10 grid gap-5 md:grid-cols-2">
            {hub.entry.options.map((option) => (
              <StaggerItem as="li" key={option.title} className="h-full">
                <article className="flex h-full flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7 lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                      {option.title}
                    </h2>
                    <IconBadge icon={iconForTitle(option.title)} />
                  </div>
                  <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{option.text}</p>
                  <div className="mt-auto pt-6">
                    <ActionLink action={option.action as ActionKey} />
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <PlanningSection />
      <EquipmentSection />

      {/* After opening: conditional. */}
      <Callout icon="truck" eyebrow={hub.supplyHeading.eyebrow} tone="onLight">
        <p className="lsh-display text-2xl leading-[1.1]">{hub.supplyHeading.title}</p>
      </Callout>

      <OngoingSuppliesSection />
      <CollaborationSection />
      <ConditionalClose actions={hub.actions as readonly ActionKey[]} />
    </LifeSupplyLayout>
  );
}
