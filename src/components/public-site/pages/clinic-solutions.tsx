import { ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";

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
import { IconBadge, ProcessSteps, SplitSection } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";

import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import {
  getProjectPhotograph,
  type ProjectPhotographKey,
} from "@/lib/public-site/project-photography";

/**
 * A completed project behind the hero.
 *
 * The hero was a black field with a red glow and the copy on the left, which
 * is orderly but says nothing about the quality of the work (product owner,
 * 2026-09-11). `PublicHero`'s media layer already thins its scrim on the
 * right for exactly this, so the room shows through beside the sentence that
 * describes building rooms.
 *
 * Decorative and hidden from assistive technology: the heading carries the
 * meaning, and the Projects section names this project and links to it.
 */
function HeroBackdrop({ project }: { project: ProjectPhotographKey }) {
  const photo = getProjectPhotograph(project);
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <Image
        src={photo.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right opacity-80"
        draggable={false}
      />
    </div>
  );
}

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
      className="border-b border-[var(--lsh-rule)] px-5 py-14 lg:px-8"
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
 * One composed section since 2026-09-11. It was a white band introducing the
 * service, then a grey band explaining it — a pattern the page repeated three
 * times, which made it read as several former pages stacked rather than one
 * edited page (product owner). The heading, the two qualifications, the four
 * service groups and the clinic types are now one band.
 *
 * No photograph here. The conceptual clinic image that stood beside the
 * services is generated, and it sat two screens above real photographs of
 * real finished clinics; the weaker picture undercut the stronger ones. This
 * section carries structure, the Projects section carries the evidence.
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

          {/* The four service groups, flush with the heading. */}
          <Stagger
            as="ul"
            className="-mx-5 mt-14 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2 lg:-mx-8 lg:grid-cols-4"
          >
            {clinics.services.map((service) => (
              <StaggerItem
                as="li"
                key={service.title}
                className="h-full bg-[var(--lsh-paper)] p-5 lg:p-8"
              >
                <IconBadge icon={iconForTitle(service.title)} size={18} />
                <h3 className="lsh-display mt-4 text-xl text-[var(--lsh-charcoal)]">
                  {service.title}
                </h3>
                <ul className="mt-3 grid gap-1 text-sm leading-6 text-[var(--lsh-muted)]">
                  {service.items.map((item) => (
                    <li key={item} className="lsh-bullet">
                      {item}
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-12 grid gap-10 border-t border-[var(--lsh-rule)] pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <Eyebrow as="h3">{hub.specialtiesHeading.title}</Eyebrow>
              <ul className="mt-4 flex flex-wrap gap-2">
                {clinics.specialties.map((item) => (
                  <li
                    key={item}
                    className="lsh-display border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            {/* Design partnership, moved out of Collaboration on 2026-09-11. */}
            <Reveal delay={0.08} className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <IconBadge icon="users" />
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Eyebrow as="h3">Design partnership</Eyebrow>
                  <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                    {hub.planning.partnershipStatus}
                  </span>
                </div>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{hub.planning.partnership}</p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

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
 * The six built clinics: the page's strongest proof.
 *
 * Until 2026-09-11 it was six titles and six external links, illustrated by a
 * laptop displaying the LifeSupply Clinics home page — which demonstrates
 * that another website exists rather than the quality of the work (product
 * owner). Three projects now lead with a photograph of the finished room and
 * the facts that project publishes; the other three follow as compact rows
 * carrying the same facts without a picture.
 *
 * Every value is published by LifeSupply Clinics on the project's own page,
 * and `project-photography.ts` records which page each photograph came from.
 * No scope, budget, client or endorsement is stated, because none is
 * published.
 */
function ProjectsSection() {
  const { projects } = LIFE_SUPPLY_CONTENT.clinics;
  const featured = projects.items.filter((project) => "photo" in project);
  const rest = projects.items.filter((project) => !("photo" in project));
  return (
    <section
      id="clinic-projects"
      className="scroll-mt-24 border-b border-[var(--lsh-rule)] px-5 py-24 lg:px-8"
    >
      <Container>
        <Reveal className="max-w-3xl">
          <SectionHeading
            eyebrow={projects.eyebrow}
            title={projects.title}
            description={projects.intro}
          />
        </Reveal>

        <Stagger as="ol" className="mt-14 grid gap-8 lg:grid-cols-3">
          {featured.map((project) => {
            const photo = getProjectPhotograph(project.photo as ProjectPhotographKey);
            return (
              <StaggerItem as="li" key={project.href} className="h-full">
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col border-t-4 border-[var(--lsh-charcoal)] transition-colors hover:border-[var(--lsh-brand-red)]"
                >
                  <figure className="relative aspect-[16/9] w-full max-w-full overflow-hidden bg-[var(--lsh-surface)]">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </figure>
                  <div className="flex flex-1 flex-col gap-3 pt-5">
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {project.type} · {project.place}
                    </p>
                    <h3 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)] transition-colors group-hover:text-[var(--lsh-brand-red)] lg:text-2xl">
                      {project.title}
                    </h3>
                    <dl className="mt-auto flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--lsh-rule)] pt-4 text-sm">
                      <div>
                        <dt className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                          {projects.labels.area}
                        </dt>
                        <dd className="mt-1 text-[var(--lsh-charcoal)]">{project.area}</dd>
                      </div>
                      <div>
                        <dt className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                          {projects.labels.year}
                        </dt>
                        <dd className="mt-1 text-[var(--lsh-charcoal)]">{project.year}</dd>
                      </div>
                      <span className="lsh-display ml-auto inline-flex items-center gap-1.5 self-end text-[11px] text-[var(--lsh-brand-red)]">
                        View project
                        <ExternalLink
                          size={13}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        />
                      </span>
                    </dl>
                  </div>
                </a>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* The remaining three, with the same facts and no picture. */}
        <Stagger
          as="ol"
          className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] lg:-mx-8 lg:grid-cols-3"
        >
          {rest.map((project) => (
            <StaggerItem as="li" key={project.href} className="h-full bg-[var(--lsh-paper)]">
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col gap-2 p-5 transition-colors hover:bg-[var(--lsh-surface)] lg:p-8"
              >
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                  {project.type} · {project.place}
                </p>
                <h3 className="lsh-display flex items-start gap-3 text-lg leading-tight text-[var(--lsh-charcoal)] transition-colors group-hover:text-[var(--lsh-brand-red)]">
                  <span className="flex-1">{project.title}</span>
                  <ExternalLink
                    size={16}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </h3>
                <p className="mt-auto pt-3 text-sm text-[var(--lsh-muted)]">
                  {project.area} · {project.year}
                </p>
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
 *
 * The introduction had a white band of its own ahead of the grey band that
 * explained it. They are one section now: the heading, the equipment image,
 * the checklist and the enquiry, in one place (product owner, 2026-09-11).
 *
 * An "Opening supplies and consumables" band followed, linking to Clinic
 * supplies and Dental clinic supplies. The ongoing-supplies section directly
 * beneath it now opens with those two categories and four more, each with a
 * line of description, so the band was pointing at the next section.
 */
function EquipmentSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.equipment;
  return (
    <AnchoredSection id="equipment">
      <SplitSection
        tone="onSurface"
        eyebrow={page.eyebrow}
        title={page.title}
        graphic="equipment"
        side="left"
        fill
      >
        <p className="leading-7 text-[var(--lsh-muted)]">{page.intro}</p>
        <div className="border-t border-[var(--lsh-rule-strong)] pt-5">
          <Eyebrow as="h3">{page.quote.title}</Eyebrow>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
            {page.quote.items.map((item) => (
              <li key={item} className="lsh-bullet">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-2">
          <ActionLink action="equipment_quote" />
        </div>
      </SplitSection>
    </AnchoredSection>
  );
}

/**
 * Ongoing supplies (`#ongoing-supplies`).
 *
 * Rebuilt on 2026-09-11 around the buyer's first question. It had given its
 * opening paragraph to accounts, published prices and repeat ordering, and a
 * side column to what LifeSupply does not do — which answered "how do you run
 * an account" and "what do you not do" before "what can you supply my
 * practice", and gave a limitation the same visual weight as the offer
 * (product owner).
 *
 * The verified categories lead. The ordering arrangement and the
 * non-clinical boundary follow in one line beneath them, where they qualify
 * something the reader has already seen.
 */
function OngoingSuppliesSection() {
  const { clinics } = LIFE_SUPPLY_CONTENT;
  const page = clinics.ongoingSupplies;
  return (
    <AnchoredSection id="ongoing-supplies">
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={page.eyebrow} title={page.title} description={page.intro} />
          </Reveal>

          <Stagger
            as="ul"
            className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2 lg:-mx-8 lg:grid-cols-3"
          >
            {page.categories.items.map((item) => (
              <StaggerItem as="li" key={item.href} className="h-full bg-[var(--lsh-paper)]">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col gap-3 p-5 transition-colors hover:bg-[var(--lsh-surface)] lg:p-8"
                >
                  <h3 className="lsh-display flex items-start gap-3 text-lg leading-tight text-[var(--lsh-charcoal)] transition-colors group-hover:text-[var(--lsh-brand-red)]">
                    <span className="flex-1">{item.label}</span>
                    <ExternalLink
                      size={16}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </h3>
                  <p className="text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
                </a>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal
            delay={0.1}
            className="mt-10 flex flex-col gap-6 border-t border-[var(--lsh-rule)] pt-8 lg:flex-row lg:items-start lg:justify-between"
          >
            <div className="max-w-2xl text-sm leading-6 text-[var(--lsh-muted)]">
              <p>{page.ordering}</p>
              <p className="mt-3">{page.boundary}</p>
              <p className="mt-3">
                {page.projectPointer}{" "}
                <a
                  href={page.projectPointerLink.href}
                  className="text-[var(--lsh-brand-red)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:decoration-[var(--lsh-brand-red)]"
                >
                  {page.projectPointerLink.label}
                </a>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              {page.actions.map((action, index) => (
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
 * Collaboration (`#collaboration`), absorbed from `/partners/clinics/` on
 * 2026-09-10 and cut back to a callout on 2026-09-11.
 *
 * It had given full treatment to program configuration, pilots and design
 * partnership in a band immediately before the closing enquiry — a second,
 * less immediately relevant business proposition at the moment the page
 * should be helping a clinic owner act (product owner). Design partnership
 * moved into Planning, where a reader considering a project meets it.
 * Configuration and pilots are the metabolic-health program, which Metabolic
 * Health sets out in full, so this points there and keeps the development
 * qualification.
 */
function CollaborationSection() {
  const section = LIFE_SUPPLY_CONTENT.clinics.collaboration;
  return (
    <AnchoredSection id="collaboration">
      <section className="border-t border-[var(--lsh-rule)] px-5 py-12 lg:px-8">
        <Container>
          <Reveal className="-mx-5 flex flex-col gap-6 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-5 lg:-mx-8 lg:flex-row lg:items-center lg:gap-10 lg:p-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Eyebrow as="h2">{section.eyebrow}</Eyebrow>
                <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                  {section.status}
                </span>
              </div>
              <p className="lsh-display mt-3 text-xl leading-tight text-[var(--lsh-charcoal)]">
                {section.title}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--lsh-muted)]">
                {section.text}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--lsh-muted)]">
                {section.note}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3 lg:self-center">
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
 * them commits them to.
 *
 * Each action now says who it is for. Three buttons in a row repeated the
 * router without adding guidance, and a reader arriving here after the whole
 * page still had to work out which one was theirs (product owner,
 * 2026-09-11). The qualification was three clauses explaining what each step
 * is not, which made the page end defensively; one sentence draws the same
 * distinction.
 */
function ClosingBand() {
  const { close } = LIFE_SUPPLY_CONTENT.clinics.hub;
  return (
    <section className="bg-[var(--lsh-ink)] px-5 py-24 text-white lg:px-8">
      <Container>
        <Reveal className="border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:pl-10">
          <Eyebrow tone="onDark" as="h2">
            {close.eyebrow}
          </Eyebrow>
          <p className="lsh-display mt-4 max-w-2xl text-4xl leading-[1.05] lg:text-5xl">
            {close.title}
          </p>
        </Reveal>
        <Stagger as="ul" className="mt-12 grid gap-8 sm:grid-cols-3">
          {close.routes.map((route) => (
            <StaggerItem as="li" key={route.action} className="border-t border-white/20 pt-5">
              <p className="leading-7 text-white/75">{route.prompt}</p>
              <div className="mt-4">
                <ActionLink action={route.action as ActionKey} variant="onDark" />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal
          delay={0.1}
          className="mt-12 border-t border-white/15 pt-6 text-sm leading-6 text-white/60"
        >
          <p>{close.qualification}</p>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * `/clinic-solutions/` — the whole clinic relationship on one page.
 *
 * Redesigned on 2026-09-10, refined on 2026-09-11. The consolidation put the
 * architecture right; the refinement addressed what was left — the page still
 * read as several former pages assembled rather than one edited page (product
 * owner).
 *
 * Three patterns went:
 *
 *   - A white band introducing a service, then a grey band explaining it,
 *     three times over. Planning and Equipment are each one composed section.
 *   - Six project links illustrated by a laptop showing another website.
 *     Three projects now lead with a photograph of the finished room.
 *   - A full collaboration block between the supplies section and the
 *     closing enquiry. It is a callout, and design partnership moved into
 *     Planning where it belongs.
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
        media={<HeroBackdrop project="burnaby" />}
        actions={
          <>
            {primary ? <ActionLink action={primary} /> : null}
            {secondary ? <ActionLink action={secondary} variant="onDark" /> : null}
            {/*
             * The headline promises three services and the hero offered two
             * actions. This is the third, kept quieter than the buttons.
             */}
            <a
              href={hub.supplyRoute.href}
              className="lsh-display flex basis-full flex-col gap-1.5 pt-2 text-[11px] text-white/70 transition-colors hover:text-white sm:flex-row sm:items-baseline sm:gap-2"
            >
              <span>{hub.supplyRoute.text}</span>
              <span className="inline-flex items-center gap-1.5 self-start text-white underline decoration-[var(--lsh-brand-red)] decoration-2 underline-offset-4">
                {hub.supplyRoute.label}
                <ArrowRight size={13} aria-hidden="true" />
              </span>
            </a>
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
