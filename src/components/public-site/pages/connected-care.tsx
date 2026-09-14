import { ChevronDown } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { ConnectedCareSection } from "@/components/public-site/connected-care/connected-care-section";
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
import { SectionNav } from "@/components/public-site/section-nav";
import { GraphicBand, IconBadge } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * `/connected-care/` (product owner, 2026-09-13), simplified the same day
 * after a design review: nine parts, each doing one job, with the diagram
 * as the centrepiece.
 *
 *   hero            the vision and its status
 *   #challenge      the separate steps, the intended benefits as objectives,
 *                   and the ownership point
 *   #model          the Connected Care diagram
 *   #example        one illustrative metabolic-health journey
 *   band            the three statuses in one line, on a photograph
 *   #principles     three rules that hold at every step
 *   #pharmacy       acquisitions and partnerships beside compounding, with
 *                   the regulatory distinction behind a disclosure
 *   #sequence       six staged steps, nothing claimed as begun
 *   #value          the commercial value, never added together
 *   closing         the actions for the four audiences
 *
 * The two central-message statements and the six-layer technology table
 * left the page: the hero and the diagram already carry them.
 */
function StatusLine({ value }: { value: string }) {
  return (
    <p className="lsh-display mt-5 inline-block border border-[var(--lsh-brand-red)] px-2 py-1 text-[10px] text-[var(--lsh-brand-red)]">
      {value}
    </p>
  );
}

export function ConnectedCarePage() {
  const {
    hero,
    challenge,
    diagram,
    example,
    band,
    principles,
    pharmacy,
    sequence,
    value,
    closing,
  } = LIFE_SUPPLY_CONTENT.connectedCare;
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic={hero.graphic} position="60% 50%" />}
        scrim="light"
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.intro}
        status={hero.status}
        actions={
          <>
            {hero.actions.map((item, index) => (
              <ActionLink
                key={item.action}
                action={item.action as ActionKey}
                variant={index === 0 ? "primary" : "onDark"}
              >
                {item.label}
              </ActionLink>
            ))}
          </>
        }
      />

      <SectionNav items={LIFE_SUPPLY_CONTENT.connectedCare.sections} />

      {/* 1. The problem, the intended benefits as objectives, and the ownership point. */}
      <AnchoredSection id="challenge" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={challenge.eyebrow}
              title={challenge.title}
              description={challenge.paragraphs}
            />
            <p className="mt-6 max-w-2xl border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {challenge.ownership}
            </p>
          </Reveal>
          <Reveal delay={0.05} className="lg:pt-10">
            <Eyebrow as="h3">{challenge.benefitsTitle}</Eyebrow>
            <ul className="mt-5 grid gap-3 text-[var(--lsh-charcoal)]">
              {challenge.benefits.map((benefit) => (
                <li key={benefit} className="lsh-bullet leading-7">
                  {benefit}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-[var(--lsh-muted)]">
              {challenge.benefitsNote}
            </p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 2. The diagram: the principal explanation of how the businesses and proposed capabilities could work together. */}
      <AnchoredSection
        id="model"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={diagram.eyebrow}
              title={diagram.title}
              description={diagram.intro}
            />
          </Reveal>
          <Reveal delay={0.05} className="mt-10">
            <ConnectedCareSection diagram={diagram} />
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 3. One illustrative journey, labelled, with compounding as a branch off the third step. */}
      <AnchoredSection id="example" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={example.eyebrow} title={example.title} />
            <p className="mt-5 inline-block border border-[var(--lsh-rule-strong)] px-3 py-2 text-xs leading-5 text-[var(--lsh-muted)]">
              {example.label}
            </p>
          </Reveal>
          <Stagger as="ol" className="grid gap-0">
            {example.steps.map((step, index) => (
              <StaggerItem
                key={step.title}
                as="li"
                className="relative border-l-2 border-[var(--lsh-rule-strong)] pb-8 pl-8 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="lsh-display absolute -left-[0.95rem] top-0 inline-flex h-7 w-7 items-center justify-center border border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] text-[11px] text-[var(--lsh-brand-red)]"
                >
                  {index + 1}
                </span>
                <h3 className="lsh-display pt-0.5 text-lg leading-tight text-[var(--lsh-charcoal)]">
                  {step.title}
                </h3>
                <p className="mt-2 leading-7 text-[var(--lsh-muted)]">{step.text}</p>
                {index + 1 === example.branch.step ? (
                  <div className="mt-4 border border-dashed border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-4">
                    <p className="lsh-display text-[10px] text-[var(--lsh-charcoal)]">
                      {example.branch.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                      {example.branch.text}
                    </p>
                  </div>
                ) : null}
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </AnchoredSection>

      {/* The three statuses in one line, on a photograph, before the rules and the pharmacy detail. */}
      <GraphicBand graphic={band.graphic} eyebrow={band.eyebrow} statement={band.statement} />

      {/* 4. Three principles that hold at every step. */}
      <AnchoredSection id="principles" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={principles.eyebrow} title={principles.title} />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {principles.items.map((item, index) => (
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

      {/* 5. Pharmacy expansion: acquisitions and partnerships beside compounding, on ink, with the distinction behind a disclosure. */}
      <AnchoredSection
        id="pharmacy"
        offset="sectionNav"
        className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8"
      >
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              tone="onDark"
              eyebrow={pharmacy.eyebrow}
              title={pharmacy.title}
              description={pharmacy.intro}
            />
            <StatusLine value={pharmacy.status} />
          </Reveal>
          <div className="mt-12 grid gap-12 border-t border-white/15 pt-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                {pharmacy.addsTitle}
              </p>
              <ol className="mt-4 divide-y divide-white/15 border-y border-white/15">
                {pharmacy.adds.map((item, index) => (
                  <li key={item} className="flex gap-5 py-3">
                    <span className="lsh-display w-6 shrink-0 pt-1 text-[11px] text-[var(--lsh-red-on-ink)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-7 text-white/85">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-l-2 border-[var(--lsh-red-on-ink)] pl-4 text-sm leading-6 text-white/85">
                {pharmacy.safeguard}
              </p>
              <p className="mt-4 text-xs leading-5 text-white/60">{pharmacy.assessment}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                {pharmacy.compoundingTitle}
              </p>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-white/80">
                {pharmacy.compounding.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
              <details className="group mt-5 border border-white/20 px-4 py-2">
                <summary className="lsh-display flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[11px] text-white [&::-webkit-details-marker]:hidden">
                  {pharmacy.distinctionTitle}
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <ul className="mb-2 grid gap-3">
                  {pharmacy.distinction.map((item) => (
                    <li
                      key={item.slice(0, 40)}
                      className="border-t border-white/15 pt-3 text-sm leading-6 text-white/75"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
              <p className="mt-5 border-l-2 border-[var(--lsh-red-on-ink)] pl-4 text-sm leading-6 text-white/85">
                {pharmacy.note}
              </p>
            </Reveal>
          </div>
          <Reveal className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-8">
            {pharmacy.actions.map((item) => (
              <ActionLink key={item.action} action={item.action as ActionKey} variant="onDark">
                {item.label}
              </ActionLink>
            ))}
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 6. The development sequence: six numbered stages, each with its status. */}
      <AnchoredSection
        id="sequence"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={sequence.eyebrow} title={sequence.title} />
          </Reveal>
          <Stagger
            as="ol"
            className="mt-12 grid gap-px bg-[var(--lsh-rule-strong)] md:grid-cols-2 xl:grid-cols-3"
          >
            {sequence.steps.map((step, index) => (
              <StaggerItem
                key={step.title}
                as="li"
                className="flex flex-col gap-4 bg-[var(--lsh-paper)] p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="lsh-display inline-flex h-10 w-10 items-center justify-center border border-[var(--lsh-brand-red)] text-sm text-[var(--lsh-brand-red)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[9px] text-[var(--lsh-muted)]">
                    {step.status}
                  </span>
                </div>
                <p className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                  {step.title}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-8">
            <p className="max-w-3xl text-sm leading-6 text-[var(--lsh-muted)]">{sequence.note}</p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 7. The commercial value: the one strategic claim, five sources, never added together. */}
      <AnchoredSection id="value" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={value.eyebrow} title={value.title} />
            <p className="lsh-display mt-6 max-w-2xl border-l-4 border-[var(--lsh-brand-red)] pl-6 text-xl leading-snug text-[var(--lsh-charcoal)]">
              {value.statement}
            </p>
            <div className="mt-8">
              <ActionLink action={value.action as ActionKey} variant="onLight">
                {value.actionLabel}
              </ActionLink>
            </div>
          </Reveal>
          <Reveal delay={0.05} className="lg:pt-10">
            <ul className="grid gap-3 text-[var(--lsh-charcoal)]">
              {value.items.map((item) => (
                <li key={item} className="lsh-bullet leading-7">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-[var(--lsh-muted)]">{value.note}</p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* The closing actions for the four audiences. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-20 text-white lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              tone="onDark"
              eyebrow={closing.eyebrow}
              title={closing.title}
              description={closing.text}
            />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {closing.actions.map((item, index) => (
                <ActionLink
                  key={item.action}
                  action={item.action as ActionKey}
                  variant={index === 0 ? "primary" : "onDark"}
                >
                  {item.label}
                </ActionLink>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
