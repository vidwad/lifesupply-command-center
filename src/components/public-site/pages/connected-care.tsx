import { ActionLink } from "@/components/public-site/action-link";
import { ConnectedCareModel } from "@/components/public-site/connected-care-model";
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
import type { ActionKey } from "@/lib/public-site/actions";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * `/connected-care/` (product owner, 2026-09-13): how the businesses and the
 * proposed capabilities could work together.
 *
 *   hero            the vision and its status
 *   the vision      the central message and the ownership point
 *   #challenge      the separate steps, and the intended benefits as objectives
 *   #model          the interactive ring: the person, six participants
 *   #example        one illustrative metabolic-health journey, compounding a branch
 *   #acquisitions   selective pharmacy acquisitions and partnerships
 *   #compounding    compounding and advanced therapeutics, the premise stated
 *   #technology     the platform in practical layers, with its two limits
 *   #sequence       the development sequence, nothing claimed as begun
 *   #value          the commercial value, never added together
 *   closing         the actions for the four audiences
 *
 * Every part carries its status. Nothing here is offered, no outcome or
 * cost is claimed, and professional decisions and patient choice stay
 * where they belong.
 */
function StatusLine({ value, tone = "onLight" }: { value: string; tone?: "onLight" | "onDark" }) {
  return (
    <p
      className={`lsh-display mt-5 inline-block border px-2 py-1 text-[10px] ${
        tone === "onDark"
          ? "border-[var(--lsh-red-on-ink)] text-[var(--lsh-red-on-ink)]"
          : "border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]"
      }`}
    >
      {value}
    </p>
  );
}

export function ConnectedCarePage() {
  const {
    hero,
    vision,
    challenge,
    model,
    example,
    acquisitions,
    compounding,
    technology,
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

      {/* The central message, set large, and the ownership point beneath it. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-[0.3fr_1.7fr] lg:gap-16">
          <Reveal>
            <Eyebrow as="h2">{vision.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="grid gap-5 border-l-4 border-[var(--lsh-brand-red)] pl-6">
              {vision.statements.map((statement) => (
                <p
                  key={statement.slice(0, 40)}
                  className="lsh-display text-xl leading-snug text-[var(--lsh-charcoal)] lg:text-2xl"
                >
                  {statement}
                </p>
              ))}
            </div>
            <p className="mt-6 max-w-3xl leading-7 text-[var(--lsh-muted)]">{vision.ownership}</p>
          </Reveal>
        </Container>
      </section>

      {/* B. The problem being addressed, beside the intended benefits. */}
      <AnchoredSection id="challenge" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={challenge.eyebrow}
              title={challenge.title}
              description={challenge.paragraphs}
            />
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
            <p className="mt-5 border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-muted)]">
              {challenge.benefitsNote}
            </p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* C. The model: the interactive ring, and the area kept outside it. */}
      <AnchoredSection
        id="model"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={model.eyebrow} title={model.title} description={model.intro} />
          </Reveal>
          <Reveal delay={0.05} className="mt-12">
            <ConnectedCareModel
              selectLabel={model.selectLabel}
              centre={model.centre}
              groups={model.groups}
              labels={model.labels}
              participants={model.participants}
            />
          </Reveal>
          <Reveal className="mt-10 grid gap-4 border border-dashed border-[var(--lsh-rule-strong)] p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
            <div>
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                {model.outside.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{model.outside.text}</p>
            </div>
            <ActionLink action={model.outside.action as ActionKey} variant="onLight">
              {model.outside.label}
            </ActionLink>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* D. One illustrative journey, labelled, with compounding as a branch off the third step. */}
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

      {/* E. Pharmacy acquisitions: purpose, assessment, what ownership could add, and the safeguard. */}
      <AnchoredSection
        id="acquisitions"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={acquisitions.eyebrow}
              title={acquisitions.title}
              description={acquisitions.paragraphs}
            />
            <StatusLine value={acquisitions.status} />
            <div className="mt-8">
              <ActionLink action={acquisitions.action as ActionKey} variant="onLight">
                {acquisitions.actionLabel}
              </ActionLink>
            </div>
          </Reveal>
          <Reveal delay={0.05} className="lg:pt-10">
            <Eyebrow as="h3">{acquisitions.addsTitle}</Eyebrow>
            <ol className="mt-5 divide-y divide-[var(--lsh-rule-strong)] border-y border-[var(--lsh-rule-strong)]">
              {acquisitions.adds.map((item, index) => (
                <li key={item} className="flex gap-5 py-3">
                  <span className="lsh-display w-6 shrink-0 pt-1 text-[11px] text-[var(--lsh-brand-red)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-7 text-[var(--lsh-charcoal)]">{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {acquisitions.safeguard}
            </p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* F. Compounding and advanced therapeutics, on ink, with the premise stated in three sentences. */}
      <AnchoredSection
        id="compounding"
        offset="sectionNav"
        className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8"
      >
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={compounding.eyebrow}
              title={compounding.title}
              description={compounding.paragraphs}
            />
            <StatusLine value={compounding.status} tone="onDark" />
            <p className="mt-6 max-w-2xl border-l-2 border-[var(--lsh-red-on-ink)] pl-4 text-sm leading-6 text-white/85">
              {compounding.note}
            </p>
          </Reveal>
          <Reveal delay={0.05} className="lg:pt-10">
            <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
              {compounding.distinctionTitle}
            </p>
            <ul className="mt-4 grid gap-4">
              {compounding.distinction.map((item) => (
                <li
                  key={item.slice(0, 40)}
                  className="border-t border-white/15 pt-4 text-sm leading-6 text-white/80"
                >
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {compounding.actions.map((item) => (
                <ActionLink key={item.action} action={item.action as ActionKey} variant="onDark">
                  {item.label}
                </ActionLink>
              ))}
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* G. The technology in six layers, and the two limits. */}
      <AnchoredSection id="technology" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={technology.eyebrow}
              title={technology.title}
              description={technology.intro}
            />
          </Reveal>
          <Reveal delay={0.05} className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-t border-[var(--lsh-rule-strong)]">
              <thead>
                <tr className="border-b border-[var(--lsh-rule-strong)]">
                  <th
                    scope="col"
                    className="lsh-display py-3 pr-6 text-left text-[10px] text-[var(--lsh-muted)]"
                  >
                    {technology.columns.layer}
                  </th>
                  <th
                    scope="col"
                    className="lsh-display py-3 text-left text-[10px] text-[var(--lsh-muted)]"
                  >
                    {technology.columns.functions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lsh-rule)]">
                {technology.layers.map((layer) => (
                  <tr key={layer.title}>
                    <th
                      scope="row"
                      className="lsh-display w-[14rem] py-4 pr-6 text-left align-top text-sm text-[var(--lsh-charcoal)]"
                    >
                      {layer.title}
                    </th>
                    <td className="py-4 align-top leading-7 text-[var(--lsh-muted)]">
                      {layer.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Reveal className="mt-10 grid gap-6 border-t border-[var(--lsh-rule-strong)] pt-6 lg:grid-cols-2 lg:gap-16">
            {technology.notes.map((note) => (
              <p key={note.slice(0, 40)} className="text-sm leading-6 text-[var(--lsh-muted)]">
                {note}
              </p>
            ))}
          </Reveal>
          <Reveal className="mt-6">
            <p className="inline-block border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {technology.status}
            </p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* H. The development sequence: six numbered stages on a rail, each with its status. */}
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

      {/* The commercial value: the one strategic claim, five sources, never added together. */}
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
            <p className="mt-5 border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-muted)]">
              {value.note}
            </p>
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
