import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection } from "@/components/public-site/on-this-page";
import { SiteScreen } from "@/components/public-site/site-screen";
import { IconBadge, ProcessSteps, SplitSection } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { getBrand } from "@/lib/public-site/brands";
import { BRAND_GRAPHICS } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * The one router, and the page's section navigation (redesign, 2026-09-10).
 *
 * Three routes, because the page serves three people: someone building a
 * clinic, someone equipping one, and someone who already has one open and
 * only wants supplies. That third reader was the one most easily lost, so the
 * route that serves them says "already seeing patients" in its first words.
 *
 * A named navigation landmark rather than a card grid: it is the control that
 * routes the whole page, and the four fragments it names are the same four a
 * redirect can arrive at. Numerals set in the brand's condensed face carry
 * the hierarchy, so the routes need no boxes around them.
 */
function Router() {
  const { router } = LIFE_SUPPLY_CONTENT.clinics.hub;
  return (
    <nav
      aria-label="Choose a starting point"
      className="border-b border-[var(--lsh-rule)] px-5 py-20 lg:px-8"
    >
      <Container>
        <Reveal>
          <SectionHeading eyebrow={router.eyebrow} title={router.title} />
        </Reveal>
        <Stagger
          as="ol"
          className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] lg:-mx-8 lg:grid-cols-3"
        >
          {router.routes.map((route) => (
            <StaggerItem as="li" key={route.href} className="h-full bg-[var(--lsh-paper)]">
              <a
                href={route.href}
                className="group flex h-full flex-col gap-5 p-5 transition-colors hover:bg-[var(--lsh-surface)] lg:p-8"
              >
                <span
                  aria-hidden="true"
                  className="lsh-display text-[var(--lsh-charcoal)]/25 text-5xl leading-none transition-colors group-hover:text-[var(--lsh-brand-red)] lg:text-6xl"
                >
                  {route.index}
                </span>
                <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                  {route.title}
                </h3>
                <p className="leading-7 text-[var(--lsh-muted)]">{route.text}</p>
                <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-2 text-[11px] text-[var(--lsh-brand-red)]">
                  {route.label}
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal
          delay={0.1}
          className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-[var(--lsh-rule)] pt-8"
        >
          <p className="text-[var(--lsh-muted)]">{router.collaboration.text}</p>
          <a
            href={router.collaboration.href}
            className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:decoration-[var(--lsh-brand-red)]"
          >
            {router.collaboration.label}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </Reveal>
      </Container>
    </nav>
  );
}

/**
 * Planning, design and construction (`#planning`).
 *
 * Opens with what the service is and the two qualifications that bound it,
 * as ordinary body copy set beside the introduction rather than boxed off
 * ahead of it. Then services, process, the built projects, and what a first
 * conversation covers — the order a reader considering a build asks in.
 */
function PlanningSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const { hub } = clinics;
  return (
    <AnchoredSection id="planning">
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <Reveal>
              <SectionHeading
                eyebrow={hub.planning.eyebrow}
                title={hub.planning.title}
                description={hub.planning.intro}
              />
            </Reveal>
            <Reveal
              delay={0.08}
              className="self-end border-l-2 border-[var(--lsh-rule-strong)] pl-6"
            >
              <p className="text-sm leading-6 text-[var(--lsh-muted)]">{hub.planning.boundary}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Services and specialties, beside the clinic photograph. */}
      <SplitSection
        tone="onSurface"
        eyebrow={hub.servicesHeading.eyebrow}
        title={hub.servicesHeading.title}
        graphic={BRAND_GRAPHICS.clinics}
        side="left"
        fill
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {clinics.services.map((service) => (
            <li key={service.title} className="flex gap-4">
              <IconBadge icon={iconForTitle(service.title)} size={18} />
              <div>
                <h3 className="lsh-display text-lg text-[var(--lsh-charcoal)]">{service.title}</h3>
                <ul className="mt-2 grid gap-1 text-sm leading-6">
                  {service.items.map((item) => (
                    <li key={item} className="lsh-bullet">
                      {item}
                    </li>
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

      {/* Process, on ink: the one dark band in the section, and the turn from what to how. */}
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

      <ProjectsSection />
    </AnchoredSection>
  );
}

/**
 * The six built clinics: the page's only proof, and previously a flat row of
 * bordered boxes competing with three other card grids.
 *
 * It is the page's widest moment: the project list set against the Clinics
 * site's own home page, with the geography in the title rather than buried in
 * a sentence. No project photography exists that this site may publish, and
 * none is invented, so the typography carries it.
 *
 * The attribution that sat here restated the planning section's boundary,
 * which already says the construction is delivered with the core partners.
 */
function ProjectsSection() {
  const { projects } = LIFE_SUPPLY_CONTENT.clinics;
  return (
    <section className="border-b border-[var(--lsh-rule)] px-5 py-24 lg:px-8">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={projects.eyebrow}
              title={projects.title}
              description={projects.intro}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <SiteScreen site="clinics" className="border border-[var(--lsh-rule)]" />
          </Reveal>
        </div>

        <Stagger
          as="ol"
          className="-mx-5 mt-14 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2 lg:-mx-8"
        >
          {projects.items.map((project, index) => (
            <StaggerItem key={project.href} as="li" className="bg-[var(--lsh-paper)]">
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full items-start gap-5 p-5 transition-colors hover:bg-[var(--lsh-surface)] lg:p-8"
              >
                <span
                  aria-hidden="true"
                  className="lsh-display pt-1 text-[11px] text-[var(--lsh-brand-red)]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="lsh-display flex-1 text-xl leading-tight text-[var(--lsh-charcoal)] transition-colors group-hover:text-[var(--lsh-brand-red)] lg:text-2xl">
                  {project.title}
                </span>
                <ExternalLink
                  size={18}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </a>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 border-t border-[var(--lsh-rule)] pt-8">
          <ActionLink action="view_clinic_projects" variant="onLight" />
        </Reveal>
      </Container>
    </section>
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
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-2xl">
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
            <li key={item} className="lsh-bullet">
              {item}
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <ActionLink action="equipment_quote" />
        </div>
      </SplitSection>
      <section className="px-5 py-20 lg:px-8">
        {/*
         * The category column sizes to its two chips rather than taking a
         * fixed 1.2fr, which left roughly five hundred pixels of it empty
         * beside them.
         */}
        <Container className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
          <Reveal className="flex gap-5">
            <IconBadge icon="layout" />
            <div>
              <Eyebrow as="h3">{page.catalogue.title}</Eyebrow>
              <p className="mt-3 max-w-xl leading-7 text-[var(--lsh-muted)]">
                {page.catalogue.text}
              </p>
            </div>
          </Reveal>
          <Stagger as="ul" className="flex flex-wrap gap-2 lg:justify-end">
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
 * Ongoing supplies (`#ongoing-supplies`).
 *
 * Round four, change 5 still governs what belongs here: this is read by a
 * clinic that is already open and wants to buy, so it keeps the non-clinical
 * boundary that qualifies its own content and does not repeat the
 * construction attribution or the project-sequence qualification. Those sit
 * earlier on the page, which is what the project pointer refers to.
 *
 * A "Discussed case by case" note listed four things the site does not offer —
 * approved substitutions, par-level restocking, automatic replenishment,
 * contracted procurement — which introduced four terms a reader may not know
 * in order to say they are unavailable. "Available today" above it already
 * bounds the offer, and the supply review already invites the conversation
 * (product owner, 2026-09-11).
 */
function OngoingSuppliesSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.ongoingSupplies;
  return (
    <AnchoredSection id="ongoing-supplies">
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <Reveal>
              <SectionHeading eyebrow={page.eyebrow} title={page.title} description={page.intro} />
            </Reveal>
            <Reveal
              delay={0.08}
              className="self-end border-l-2 border-[var(--lsh-rule-strong)] pl-6"
            >
              <p className="text-sm leading-6 text-[var(--lsh-charcoal)]">{page.boundary}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                {page.projectPointer}{" "}
                <a
                  href={page.projectPointerLink.href}
                  className="text-[var(--lsh-brand-red)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:decoration-[var(--lsh-brand-red)]"
                >
                  {page.projectPointerLink.label}
                </a>
                .
              </p>
            </Reveal>
          </div>
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
            <li key={item} className="lsh-bullet">
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
    </AnchoredSection>
  );
}

/**
 * Collaboration (`#collaboration`), absorbed from `/partners/clinics/` on
 * 2026-09-10.
 *
 * Each item leads with its status, because whether a thing is proposed or
 * available is the first thing a reader needs to know about it, and two of
 * the three are proposals rather than services.
 */
function CollaborationSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const section = clinics.collaboration;
  return (
    <AnchoredSection id="collaboration">
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-2xl">
            <SectionHeading
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.intro}
            />
          </Reveal>
          {/*
           * Three items across, flush with the heading, in the shape the
           * router uses. A "Collaboration is not procurement" box stood to the
           * left of them until 2026-09-11; it restated the introduction above
           * it and the Pilots card beside it, and defined the subject by what
           * it is not.
           */}
          <Stagger
            as="ul"
            className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] lg:-mx-8 lg:grid-cols-3"
          >
            {section.items.map((item) => (
              <StaggerItem as="li" key={item.title} className="h-full bg-[var(--lsh-paper)]">
                <article className="flex h-full flex-col gap-4 p-5 lg:p-8">
                  <span className="lsh-display self-start border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                    {item.status}
                  </span>
                  <h3 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)]">
                    {item.title}
                  </h3>
                  <p className="leading-7 text-[var(--lsh-muted)]">{item.text}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
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
 * The closing band: the three things a reader can start, and what none of
 * them commits them to. Three destinations rather than one, because the page
 * serves three audiences and the band is where each of them decides.
 */
function ClosingBand() {
  const { close, actions } = LIFE_SUPPLY_CONTENT.clinics.hub;
  return (
    <section className="bg-[var(--lsh-ink)] px-5 py-24 text-white lg:px-8">
      <Container>
        <Reveal className="grid gap-10 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:pl-10">
          <div>
            <Eyebrow tone="onDark" as="h2">
              {close.eyebrow}
            </Eyebrow>
            <p className="lsh-display mt-4 text-4xl leading-[1.05] lg:text-5xl">{close.title}</p>
            <p className="mt-5 max-w-xl leading-7 text-white/75">{close.text}</p>
          </div>
          <div>
            <div className="flex flex-wrap gap-3">
              {(actions as readonly ActionKey[]).map((action, index) => (
                <ActionLink
                  key={action}
                  action={action}
                  variant={index === 0 ? "primary" : "onDark"}
                />
              ))}
            </div>
            <p className="mt-8 border-t border-white/15 pt-6 text-sm leading-6 text-white/60">
              {close.qualification}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * `/clinic-solutions/` — the whole clinic relationship on one page.
 *
 * Redesigned on 2026-09-10. The page had asked its routing question three
 * times before saying anything — a section-navigation strip, a two-card
 * "which do you need", and a three-card "plan / equip / supply" — and had put
 * a grey qualification box at position two, ahead of everything it qualified.
 * There is now one router, and the qualifications sit beside the copy they
 * bound.
 *
 * The consolidation's four anchors are unchanged: `#planning`, `#equipment`,
 * `#ongoing-supplies` and `#collaboration` are each the target of retired
 * addresses, and each section still opens with enough context to be read by
 * someone who arrives at it directly and has read nothing above it.
 */
export function ClinicSolutionsPage() {
  const { hub } = LIFE_SUPPLY_CONTENT.clinics;
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
      <Router />
      <PlanningSection />
      <EquipmentSection />
      <OngoingSuppliesSection />
      <CollaborationSection />
      <ClosingBand />
    </LifeSupplyLayout>
  );
}
