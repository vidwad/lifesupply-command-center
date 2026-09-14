import Image from "next/image";

import { ActionLink } from "@/components/public-site/action-link";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection } from "@/components/public-site/on-this-page";
import { PortalConcept } from "@/components/public-site/portal-concept";
import { SectionNav } from "@/components/public-site/section-nav";
import { IconBadge, ProcessSteps } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { getGraphic } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * `/pharmacy-solutions/`, re-scoped on 2026-09-13 (product owner) around
 * three levels of engagement, in the order a pharmacy meets them:
 *
 *   hero                the broader relationship, three statuses in one line
 *   #products           the eight explorer categories, available today
 *   #relationships      operations, retail assortment, patient programs
 *   #partner-program    the developing patient-supply model (the address the
 *                       retired partners page redirects to)
 *   #tools              proposed ordering tools, and the labelled concept
 *   #specialty          specialty pharmacy and compounding, under evaluation
 *   contact             one action per conversation, and the stores
 *
 * Product access today, structured pharmacy services in development, and
 * selected regulated opportunities under evaluation: nothing proposed reads
 * as offered, retail availability never reads as a wholesale program, and
 * each enquiry carries the subject of its own conversation.
 */
export function PharmacySolutionsPage() {
  const { hub, products, relationships, programs, tools, specialty, closing } =
    LIFE_SUPPLY_CONTENT.pharmacy;
  const [primary, secondary] = hub.actions as readonly ActionKey[];
  const illustration = getGraphic(hub.graphic);
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="pharmacy" position="75% 60%" dim accent={false} />}
        aside={
          <Image
            src={illustration.src}
            alt={illustration.alt}
            width={illustration.width}
            height={illustration.height}
            sizes="(min-width: 1024px) 34vw, 70vw"
            className="h-auto w-full max-w-[20rem] lg:max-w-[23rem]"
            priority
            draggable={false}
          />
        }
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.intro}
        status={hub.status}
        actions={
          <>
            {primary ? <ActionLink action={primary} /> : null}
            {secondary ? <ActionLink action={secondary} variant="onDark" /> : null}
          </>
        }
      />

      <SectionNav items={LIFE_SUPPLY_CONTENT.pharmacy.sections} />

      {/* 1. Medical products for pharmacies: the explorer's eight categories, read for a pharmacy, and the two ways to take it further. */}
      <AnchoredSection id="products" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={products.eyebrow}
              title={products.title}
              description={products.intro}
            />
          </Reveal>
          <Stagger
            as="ul"
            className="mt-10 grid gap-px bg-[var(--lsh-rule-strong)] sm:grid-cols-2 lg:grid-cols-4"
          >
            {products.categories.map((category) => {
              const graphic = getGraphic(category.graphic);
              return (
                <StaggerItem key={category.title} as="li" className="bg-[var(--lsh-paper)]">
                  <figure className="relative aspect-[16/10] overflow-hidden bg-[var(--lsh-surface)]">
                    <Image
                      src={graphic.src}
                      alt={graphic.alt}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </figure>
                  <div className="p-5">
                    <h3 className="lsh-display text-base leading-tight text-[var(--lsh-charcoal)]">
                      {category.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                      {category.text}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
          <Reveal className="mt-8 grid gap-6 border-t border-[var(--lsh-rule-strong)] pt-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <p className="text-sm leading-6 text-[var(--lsh-muted)]">{products.closing}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-self-end">
              <ActionLink action={products.action as ActionKey} variant="primary">
                {products.actionLabel}
              </ActionLink>
              <ActionLink action={products.secondaryAction as ActionKey} variant="onLight">
                {products.secondaryLabel}
              </ActionLink>
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 2. Three purchasing relationships: which conversation a pharmacy wants to have, each with its own status and its own next step. */}
      <AnchoredSection
        id="relationships"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={relationships.eyebrow} title={relationships.title} />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {relationships.items.map((item, index) => (
              <StaggerItem
                key={item.title}
                as="li"
                className="flex flex-col border-t-4 border-[var(--lsh-brand-red)] pt-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <IconBadge icon={iconForTitle(item.title)} />
                    <span className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                    {item.status}
                  </span>
                </div>
                <h3 className="lsh-display mt-5 text-xl leading-tight text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
                <div className="mt-auto pt-6">
                  <ActionLink action={item.action as ActionKey} variant="onLight">
                    {item.label}
                  </ActionLink>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </AnchoredSection>

      {/* 3. Patient-supply programs: one developing service, its status, the four steps, and the representative categories as a sentence. */}
      <AnchoredSection id="partner-program" offset="sectionNav">
        <ProcessSteps
          eyebrow={programs.eyebrow}
          title={programs.title}
          description={programs.intro}
          status={programs.status}
          steps={programs.steps.map((step) => ({ ...step, icon: iconForTitle(step.title) }))}
          action={
            <div className="grid gap-5 text-sm leading-6 text-white/70 lg:max-w-3xl">
              <p>{programs.supporting}</p>
              <div className="border-t border-white/15 pt-5">
                <p>
                  {programs.categoriesLead}{" "}
                  <span className="text-white">{programs.categories.join(", ")}</span>.{" "}
                  {programs.categoriesNote}
                </p>
                <div className="mt-4">
                  <ActionLink action={programs.action as ActionKey} variant="onDark">
                    {programs.actionLabel}
                  </ActionLink>
                </div>
              </div>
            </div>
          }
        />
      </AnchoredSection>

      {/* 4. Proposed ordering tools: the copy and the capabilities, the status, then the labelled concept with its three uses. */}
      <AnchoredSection
        id="tools"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Reveal>
              <SectionHeading
                eyebrow={tools.eyebrow}
                title={tools.title}
                description={tools.paragraphs}
              />
              <p className="mt-6 max-w-2xl border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {tools.status}
              </p>
            </Reveal>
            <Reveal delay={0.05} className="lg:pt-10">
              <Eyebrow as="h3">{tools.capabilitiesTitle}</Eyebrow>
              <ul className="mt-5 grid gap-3 text-[var(--lsh-charcoal)]">
                {tools.capabilities.map((capability) => (
                  <li key={capability} className="lsh-bullet leading-7">
                    {capability}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.05} className="mt-12">
            <PortalConcept
              demo="pharmacy"
              label={tools.concept.label}
              note={tools.concept.note}
              viewsLabel={tools.concept.viewsLabel}
              views={tools.concept.views}
            />
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 5. Specialty pharmacy and compounding: concise, under evaluation, with the three potential areas and the pointer to Investor Information. */}
      <AnchoredSection id="specialty" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={specialty.eyebrow} title={specialty.title} />
            <p className="lsh-display mt-5 inline-block border border-[var(--lsh-brand-red)] px-2 py-1 text-[10px] text-[var(--lsh-brand-red)]">
              {specialty.status}
            </p>
            <div className="mt-6 grid max-w-2xl gap-4 leading-7 text-[var(--lsh-muted)]">
              {specialty.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {specialty.actions.map((action, index) => (
                <ActionLink
                  key={action}
                  action={action as ActionKey}
                  variant={index === 0 ? "primary" : "onLight"}
                >
                  {specialty.actionLabels[index]}
                </ActionLink>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.05} className="lg:pt-10">
            <Eyebrow as="h3">{specialty.areasTitle}</Eyebrow>
            <ul className="mt-5 grid gap-6">
              {specialty.areas.map((area) => (
                <li key={area.title} className="flex gap-4">
                  <IconBadge icon={iconForTitle(area.title)} size={18} />
                  <div>
                    <h4 className="lsh-display text-lg text-[var(--lsh-charcoal)]">{area.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{area.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-[var(--lsh-rule)] pt-5">
              <p className="text-sm leading-6 text-[var(--lsh-muted)]">{specialty.investorNote}</p>
              <div className="mt-4">
                <ActionLink action={specialty.investorAction as ActionKey} variant="onLight">
                  {specialty.investorLabel}
                </ActionLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 6. Contact: one action per conversation, the program checklist, and the way to the stores. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-20 text-white lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              tone="onDark"
              eyebrow={closing.eyebrow}
              title={closing.title}
              description={closing.text}
            />
          </Reveal>
          <Stagger as="ul" className="mt-10 grid gap-px bg-white/15 md:grid-cols-3">
            {closing.actions.map((item) => (
              <StaggerItem
                key={item.action}
                as="li"
                className="flex flex-col bg-[var(--lsh-charcoal)] p-6"
              >
                <h3 className="lsh-display text-lg text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.text}</p>
                <div className="mt-auto pt-6">
                  <ActionLink action={item.action as ActionKey} variant="onDark" />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-12 grid gap-10 border-t border-white/15 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Reveal>
              <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                {closing.checklistTitle}
              </p>
              <ol className="mt-4 divide-y divide-white/15 border-y border-white/15">
                {closing.checklist.map((item, index) => (
                  <li key={item} className="flex gap-5 py-3">
                    <span className="lsh-display w-6 shrink-0 pt-1 text-[11px] text-[var(--lsh-red-on-ink)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-7 text-white/85">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm leading-6 text-white/60">{closing.supporting}</p>
            </Reveal>
            <Reveal delay={0.05} className="lg:border-l lg:border-white/25 lg:pl-10">
              <p className="text-sm leading-6 text-white/75">{closing.storesLead}</p>
              <div className="mt-4">
                <ActionLink action={closing.storesAction as ActionKey} variant="onDark">
                  {closing.storesLabel}
                </ActionLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
