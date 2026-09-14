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
 * `/pharmacy-solutions/`, rebuilt on 2026-09-13 (product owner) around why a
 * pharmacy would work with LifeSupply, what the proposed arrangement covers,
 * and how participation would work:
 *
 *   hero                the proposition, its status, one enquiry
 *   #needs              three practical points
 *   #supplies           six representative categories, with pictures
 *   #partner-program    the one operating model (the address the retired
 *                       partners page redirects to)
 *   #tools              proposed ordering tools, and the labelled concept
 *   #participation      what an initial conversation would cover
 *   closing             the same enquiry, and the two supporting links
 *
 * Nothing here dispenses, diagnoses, or prescribes; nothing proposed reads
 * as offered; and every enquiry on the page carries the pharmacy subject.
 * The question of LifeSupply holding licensed pharmacy operations is on the
 * investor page, and one sentence under the model points there.
 */
export function PharmacySolutionsPage() {
  const { hub, needs, supplies, model, tools, participation, closing } =
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

      {/* 1. The pharmacy's needs: three practical points. */}
      <AnchoredSection id="needs" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={needs.eyebrow} title={needs.title} description={needs.intro} />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {needs.items.map((item, index) => (
              <StaggerItem
                key={item.title}
                as="li"
                className="border-t-4 border-[var(--lsh-brand-red)] pt-5"
              >
                <div className="flex items-center gap-4">
                  <IconBadge icon={iconForTitle(item.title)} />
                  <span className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="lsh-display mt-5 text-xl leading-tight text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </AnchoredSection>

      {/* 2. Representative supplies: six compact picture tiles, and the note that they are proposed categories. */}
      <AnchoredSection
        id="supplies"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={supplies.eyebrow}
              title={supplies.title}
              description={supplies.intro}
            />
          </Reveal>
          <Stagger
            as="ul"
            className="mt-10 grid gap-px bg-[var(--lsh-rule-strong)] sm:grid-cols-2 lg:grid-cols-3"
          >
            {supplies.categories.map((category) => {
              const graphic = getGraphic(category.graphic);
              return (
                <StaggerItem key={category.title} as="li" className="bg-[var(--lsh-paper)]">
                  <figure className="relative aspect-[16/10] overflow-hidden bg-[var(--lsh-surface)]">
                    <Image
                      src={graphic.src}
                      alt={graphic.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      style={{ objectPosition: category.position }}
                      className="object-cover"
                    />
                  </figure>
                  <div className="p-5">
                    <h3 className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
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
          <Reveal className="mt-8 grid gap-6 border-t border-[var(--lsh-rule-strong)] pt-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center lg:gap-16">
            <p className="text-sm leading-6 text-[var(--lsh-muted)]">{supplies.note}</p>
            <div className="lg:justify-self-end">
              <ActionLink action={supplies.action as ActionKey} variant="onLight">
                {supplies.actionLabel}
              </ActionLink>
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 3. The one operating model: four steps, horizontal on wide screens, and the two sentences beneath. */}
      <AnchoredSection id="partner-program" offset="sectionNav">
        <ProcessSteps
          eyebrow={model.eyebrow}
          title={model.title}
          steps={model.steps.map((step) => ({ ...step, icon: iconForTitle(step.title) }))}
          action={
            <div className="grid gap-5 text-sm leading-6 text-white/70 lg:max-w-3xl">
              <p>{model.supporting}</p>
              <div className="border-t border-white/15 pt-5">
                <p>{model.distinction}</p>
                <div className="mt-4">
                  <ActionLink action={model.distinctionAction as ActionKey} variant="onDark">
                    {model.distinctionLabel}
                  </ActionLink>
                </div>
              </div>
            </div>
          }
        />
      </AnchoredSection>

      {/* 4. Proposed ordering tools: the copy and the capabilities, the status, then the labelled concept. */}
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

      {/* 5. Participation: a short introduction beside a structured checklist. */}
      <AnchoredSection id="participation" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={participation.eyebrow}
              title={participation.title}
              description={participation.paragraphs}
            />
          </Reveal>
          <Reveal delay={0.05} className="lg:pt-10">
            <Eyebrow as="h3">{participation.checklistTitle}</Eyebrow>
            <ol className="mt-5 divide-y divide-[var(--lsh-rule)] border-y border-[var(--lsh-rule)]">
              {participation.checklist.map((item, index) => (
                <li key={item} className="flex gap-5 py-3">
                  <span className="lsh-display w-6 shrink-0 pt-1 text-[11px] text-[var(--lsh-brand-red)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-7 text-[var(--lsh-charcoal)]">{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm leading-6 text-[var(--lsh-muted)]">
              {participation.supporting}
            </p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 6. The closing action: the same enquiry, the metabolic link, and the way to the stores. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-20 text-white lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={closing.eyebrow}
              title={closing.title}
              description={closing.text}
            />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ActionLink action={closing.action as ActionKey} />
              <ActionLink action={closing.secondary as ActionKey} variant="onDark">
                {closing.secondaryLabel}
              </ActionLink>
            </div>
          </Reveal>
          <Reveal
            delay={0.05}
            className="border-t border-white/25 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
          >
            <p className="text-sm leading-6 text-white/75">{closing.storesLead}</p>
            <div className="mt-4">
              <ActionLink action={closing.storesAction as ActionKey} variant="onDark">
                {closing.storesLabel}
              </ActionLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
