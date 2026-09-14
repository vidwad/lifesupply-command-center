import Image from "next/image";
import { ArrowRight, Mail, Phone } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  EditorialStat,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection } from "@/components/public-site/on-this-page";
import { SectionNav } from "@/components/public-site/section-nav";
import { GraphicBand, IconBadge } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { investorRelations } from "@/lib/public-site/content/investors";
import { getGraphic } from "@/lib/public-site/graphics";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { measurementAttributes } from "@/lib/public-site/measurement";
import { publishedDocumentUrl, type Published } from "@/lib/public-site/published";
import type { PublishedDocumentDto } from "@/server/public-web/contracts";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

const HERO_SECONDARY =
  "lsh-display inline-flex items-center gap-2 border border-white/40 px-5 py-3 text-[11px] text-white transition-colors hover:border-white";

/** Business-availability status, stated beside the claim it qualifies. */
function StatusTag({ status, tone = "onLight" }: { status: string; tone?: "onLight" | "onDark" }) {
  const operating = status === "Operating";
  const classes =
    tone === "onDark"
      ? operating
        ? "border-white/40 text-white"
        : "border-[var(--lsh-red-on-ink)] text-[var(--lsh-red-on-ink)]"
      : operating
        ? "border-[var(--lsh-charcoal)] text-[var(--lsh-charcoal)]"
        : "border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]";
  return (
    <span
      className={`lsh-display inline-flex border px-2 py-0.5 text-left text-[10px] leading-4 ${classes}`}
    >
      {status}
    </span>
  );
}

/** Governed public documents from the published read model; fails closed when unreachable. */
function PublishedDocuments({ published }: { published: Published<PublishedDocumentDto[]> }) {
  const copy = investorRelations.materials.published;
  // A list that fetched cleanly and returned nothing is left out rather than
  // announcing itself as empty; an outage says so.
  if (published.ok && published.data.length === 0) return null;
  return (
    <Reveal className="mt-12">
      <Eyebrow as="h3">{copy.title}</Eyebrow>
      {!published.ok ? (
        <p
          role="status"
          className="mt-4 border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-muted)]"
        >
          {copy.unavailable}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {published.data.map((doc) => (
            <li key={doc.id} className="border-t border-[var(--lsh-rule-strong)] pt-5">
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                {doc.documentType.replace("_", " ")}
                {doc.periodLabel ? ` · ${doc.periodLabel}` : ""}
              </p>
              <h4 className="lsh-display mt-2 text-xl text-[var(--lsh-charcoal)]">{doc.title}</h4>
              {doc.disclosureText ? (
                <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                  {doc.disclosureText}
                </p>
              ) : null}
              <p className="mt-4">
                {doc.downloadPath ? (
                  <a
                    {...measurementAttributes("public_document_download", {
                      documentType: doc.documentType,
                    })}
                    href={publishedDocumentUrl(doc.downloadPath)}
                    className="lsh-display inline-flex items-center gap-2 border border-[var(--lsh-rule-strong)] px-4 py-2 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                  >
                    {copy.download} <ArrowRight size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-xs text-[var(--lsh-muted)]">On request</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );
}

/**
 * `/investor-relations/` — the one investor page (product owner, 2026-09-13).
 *
 * The investor overview, Growth Strategy, Advanced Therapeutics, Disclosures
 * and the document directory became sections of this page, in the order an
 * investor asks the questions:
 *
 *   1. #business               what the group operates today
 *   2. #financial-information  what it has reported, once, with its basis
 *   3. #business-model         how it earns revenue and how it could extend
 *   4. #growth-strategy        where growth can come from, five priorities
 *   5. #execution              the phased approach and what it would require
 *   6. #advanced-therapeutics  longer-term regulated opportunities, restrained
 *   7. #materials              the document directory, moved from Company News
 *   8. #contact                the next action, and the two supporting pages
 *   9. #disclosures            the full qualification, on a permanent anchor
 *
 * The three retired addresses redirect to their sections. No figure counts
 * up, no chart is drawn from a single period, no phase reads as achieved,
 * and no proposed activity reads as offered.
 */
export function InvestorRelationsPage({
  documents,
}: {
  documents: Published<PublishedDocumentDto[]>;
}) {
  const ir = investorRelations;
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="boardroom" position="70% 50%" />}
        eyebrow={ir.eyebrow}
        title={ir.title}
        description={ir.description}
        actions={
          <>
            <ActionLink action={ir.actions.primary as ActionKey} />
            <a href={ir.actions.secondaryHref} className={HERO_SECONDARY}>
              {ir.actions.secondaryLabel}
            </a>
          </>
        }
      />

      <SectionNav items={ir.sections} />

      {/* 1. The operating foundation: three columns, two links out. */}
      <AnchoredSection id="business" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={ir.business.eyebrow}
              title={ir.business.title}
              description={ir.business.intro}
            />
          </Reveal>
          <Stagger as="ul" className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {ir.business.items.map((item, index) => (
              <StaggerItem
                key={item.title}
                as="li"
                className="border-t-4 border-[var(--lsh-brand-red)] pt-5"
              >
                {/* The owner's illustration for the column, above its number and status. */}
                <figure className="relative mb-6 aspect-square overflow-hidden bg-[var(--lsh-surface)]">
                  <Image
                    src={getGraphic(item.graphic).src}
                    alt={getGraphic(item.graphic).alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-contain p-4"
                  />
                </figure>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <IconBadge icon={iconForTitle(item.title)} />
                    <span className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <StatusTag status={item.status} />
                </div>
                <h3 className="lsh-display mt-5 text-xl leading-tight text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--lsh-rule)] pt-6">
            {ir.business.links.map((link, index) => (
              <ActionLink
                key={link.action}
                action={link.action as ActionKey}
                variant={index === 0 ? "primary" : "onLight"}
              >
                {link.label}
              </ActionLink>
            ))}
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 2. The three figures, once, on a quiet ground, with the basis beneath. */}
      <AnchoredSection
        id="financial-information"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal>
            <SectionHeading eyebrow={ir.financials.eyebrow} title={ir.financials.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-3">
            {ir.currentReport.highlights.map((item) => (
              <StaggerItem key={item.label} className="h-full">
                <EditorialStat value={item.value} label={item.label} />
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 grid gap-6 border-t border-[var(--lsh-rule-strong)] pt-6 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16">
            <Eyebrow as="h3">{ir.financials.basisTitle}</Eyebrow>
            <div>
              <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {ir.financials.basis.map((line) => (
                  <li key={line} className="lsh-bullet">
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-6 text-[var(--lsh-muted)]">{ir.financials.note}</p>
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* The operating half closes on a photograph and one statement. */}
      <GraphicBand
        graphic={ir.bands.foundation.graphic}
        eyebrow={ir.bands.foundation.eyebrow}
        statement={ir.bands.foundation.statement}
      />

      {/* 3. The business model: a real table, status in words, repeat demand told apart from contracted revenue. */}
      <AnchoredSection id="business-model" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={ir.model.eyebrow}
              title={ir.model.title}
              description={ir.model.intro}
            />
          </Reveal>
          <Reveal className="mt-10">
            {/* Phones: one stacked block per activity, so the status is never off screen. */}
            <ul className="divide-y divide-[var(--lsh-rule)] border-y border-[var(--lsh-rule-strong)] md:hidden">
              {ir.model.rows.map((row) => (
                <li key={row.activity} className="py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <IconBadge icon={iconForTitle(row.activity)} size={18} />
                      <h3 className="lsh-display text-base leading-tight text-[var(--lsh-charcoal)]">
                        {row.activity}
                      </h3>
                    </div>
                    <StatusTag status={row.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{row.role}</p>
                </li>
              ))}
            </ul>
            {/* Tablet and desktop: the same rows as a table. */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                    <th scope="col" className="border-b border-[var(--lsh-rule-strong)] py-3 pr-6">
                      {ir.model.labels.activity}
                    </th>
                    <th scope="col" className="border-b border-[var(--lsh-rule-strong)] py-3 pr-6">
                      {ir.model.labels.role}
                    </th>
                    <th scope="col" className="border-b border-[var(--lsh-rule-strong)] py-3">
                      {ir.model.labels.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ir.model.rows.map((row) => (
                    <tr key={row.activity} className="align-top">
                      <th
                        scope="row"
                        className="border-b border-[var(--lsh-rule)] py-5 pr-6 text-base leading-tight text-[var(--lsh-charcoal)]"
                      >
                        <span className="flex items-center gap-3">
                          <IconBadge icon={iconForTitle(row.activity)} size={18} />
                          <span className="lsh-display">{row.activity}</span>
                        </span>
                      </th>
                      <td className="border-b border-[var(--lsh-rule)] py-5 pr-6 text-sm leading-6 text-[var(--lsh-muted)]">
                        {row.role}
                      </td>
                      <td className="border-b border-[var(--lsh-rule)] py-5 text-sm leading-6 text-[var(--lsh-charcoal)]">
                        {row.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-sm leading-6 text-[var(--lsh-muted)]">{ir.model.note}</p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 4. Growth priorities: a numbered editorial list with varied rows, and one typeset visual for technology. */}
      <AnchoredSection
        id="growth-strategy"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={ir.growth.eyebrow}
              title={ir.growth.title}
              description={ir.growth.intro}
            />
          </Reveal>
          <ol className="mt-12 divide-y divide-[var(--lsh-rule-strong)] border-y border-[var(--lsh-rule-strong)]">
            {ir.growth.priorities.map((priority) => (
              <li key={priority.index}>
                <Reveal className="grid gap-6 py-10 lg:grid-cols-[4rem_1fr_1fr] lg:gap-10">
                  <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-5">
                    <span className="lsh-display text-3xl leading-none text-[var(--lsh-brand-red)]">
                      {priority.index}
                    </span>
                    <IconBadge icon={iconForTitle(priority.title)} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                        {priority.title}
                      </h3>
                      <StatusTag status={priority.status} />
                    </div>
                    <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{priority.text}</p>
                    {"secondary" in priority ? (
                      <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{priority.secondary}</p>
                    ) : null}
                  </div>
                  <div className="lg:pt-1">
                    {priority.points.length > 0 ? (
                      <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                        {priority.points.map((point) => (
                          <li key={point} className="lsh-bullet">
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div
                      className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${
                        priority.points.length > 0 ? "mt-6" : ""
                      }`}
                    >
                      {"link" in priority ? (
                        <ActionLink action={priority.link.action as ActionKey} variant="text">
                          {priority.link.label}
                        </ActionLink>
                      ) : null}
                      {"links" in priority
                        ? priority.links.map((link) => (
                            <ActionLink
                              key={link.action}
                              action={link.action as ActionKey}
                              variant="text"
                            >
                              {link.label}
                            </ActionLink>
                          ))
                        : null}
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          {/*
           * The one visual for the technology priority: three plain steps
           * from information to a better decision, typeset in real text.
           * No circuitry, no brain, no warehouse.
           */}
          <Reveal className="mt-12">
            <h3 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)]">
              {ir.growth.technology.title}
            </h3>
            <ol className="mt-6 grid gap-px bg-[var(--lsh-rule-strong)] md:grid-cols-3">
              {ir.growth.technology.steps.map((step, index) => (
                <li key={step.title} className="flex flex-col bg-[var(--lsh-paper)] p-6">
                  {/* The owner's illustration for the step, above its number. */}
                  <figure className="relative mb-5 aspect-square overflow-hidden">
                    <Image
                      src={getGraphic(step.graphic).src}
                      alt={getGraphic(step.graphic).alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-contain mix-blend-multiply"
                    />
                  </figure>
                  <span className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                    {String(index + 1).padStart(2, "0")}
                    {index < ir.growth.technology.steps.length - 1 ? (
                      <span aria-hidden="true" className="ml-2 text-[var(--lsh-rule-strong)]">
                        →
                      </span>
                    ) : null}
                  </span>
                  <div className="mt-4">
                    <IconBadge icon={iconForTitle(step.title)} />
                  </div>
                  <p className="lsh-display mt-4 text-lg leading-tight text-[var(--lsh-charcoal)]">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{step.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-6 text-[var(--lsh-muted)]">
              {ir.growth.technology.note}
            </p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 5. Execution: four planned phases, each with the evidence it needs, and what development would require. */}
      <AnchoredSection id="execution" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={ir.execution.eyebrow}
              title={ir.execution.title}
              description={ir.execution.intro}
            />
          </Reveal>
          {/*
           * The four phases as a stepper: numbered nodes on one rail, the
           * phase and its purpose above the rail, and beneath each node the
           * gate it has to pass, drawn as a checkpoint. Every node reads
           * "Planned", and no node is drawn as reached: the sequence shows the
           * order of the work, not progress along it. Horizontal from lg,
           * a vertical rail below it. Real text throughout.
           */}
          <ol className="relative mt-14 grid gap-12 lg:grid-cols-4 lg:gap-8">
            <span
              aria-hidden="true"
              className="absolute left-6 top-0 h-full w-px bg-[var(--lsh-rule-strong)] lg:left-6 lg:right-[calc(25%-3rem)] lg:top-6 lg:h-px lg:w-auto"
            />
            {ir.execution.phases.map((phase, index) => (
              <li key={phase.index} className="relative flex flex-col pl-20 lg:pl-0">
                {/* The node: the phase number in a red ring on the rail. */}
                <span className="lsh-display absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full border-2 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] text-[13px] text-[var(--lsh-brand-red)] lg:static lg:mb-6">
                  {phase.index}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <IconBadge icon={iconForTitle(phase.title)} size={18} />
                  <StatusTag status={ir.execution.statusLabel} />
                </div>
                <h3 className="lsh-display mt-4 text-2xl leading-tight text-[var(--lsh-charcoal)]">
                  {phase.title}
                </h3>
                <p className="mt-2 leading-7 text-[var(--lsh-muted)] lg:min-h-[5.5rem]">
                  <span className="lsh-display mb-1 block text-[10px] text-[var(--lsh-brand-red)]">
                    {ir.execution.labels.purpose}
                  </span>
                  {phase.purpose}
                </p>
                {/* The gate beneath the phase: what has to be shown before the next begins. */}
                <div className="mt-6 flex-1 border-l-2 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-4">
                  <p className="lsh-display flex items-center gap-2 text-[10px] text-[var(--lsh-charcoal)]">
                    <IconBadge icon="badge" size={14} />
                    {ir.execution.labels.evidence}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{phase.evidence}</p>
                </div>
                {index < ir.execution.phases.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="lsh-display absolute -right-5 top-3 hidden text-lg text-[var(--lsh-rule-strong)] lg:block"
                  >
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <Reveal className="mt-8 grid gap-6 border-t border-[var(--lsh-rule-strong)] pt-8 lg:grid-cols-2 lg:gap-16">
            <p className="text-sm leading-6 text-[var(--lsh-muted)]">{ir.execution.status}</p>
            <div>
              <Eyebrow as="h3">{ir.execution.capital.title}</Eyebrow>
              <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                {ir.execution.capital.text}
              </p>
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 6. Longer-term regulated opportunities: a restrained four-row list, no laboratory. */}
      <AnchoredSection
        id="advanced-therapeutics"
        offset="sectionNav"
        className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8"
      >
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-44 lg:self-start">
            <SectionHeading
              eyebrow={ir.longerTerm.eyebrow}
              title={ir.longerTerm.title}
              description={ir.longerTerm.intro}
            />
            <p className="mt-6 border-t border-[var(--lsh-rule-strong)] pt-5 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {ir.longerTerm.statement}
            </p>
          </Reveal>
          <Stagger as="ul" className="grid gap-8">
            {ir.longerTerm.options.map((option) => (
              <StaggerItem
                key={option.title}
                as="li"
                className="border-t border-[var(--lsh-rule-strong)] pt-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <IconBadge icon={iconForTitle(option.title)} size={18} />
                    <h3 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)]">
                      {option.title}
                    </h3>
                  </div>
                  <StatusTag status={option.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2 sm:gap-8">
                  <div>
                    <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {ir.longerTerm.labels.role}
                    </dt>
                    <dd className="mt-1 text-[var(--lsh-charcoal)]">{option.role}</dd>
                  </div>
                  <div>
                    <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {ir.longerTerm.labels.dependencies}
                    </dt>
                    <dd className="mt-1 text-[var(--lsh-muted)]">{option.dependencies}</dd>
                  </div>
                </dl>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </AnchoredSection>

      {/* The supporting-information half opens on a photograph and one statement. */}
      <GraphicBand
        graphic={ir.bands.materials.graphic}
        eyebrow={ir.bands.materials.eyebrow}
        statement={ir.bands.materials.statement}
      />

      {/* 7. Investor materials: one record per row, a document-specific request, and the governed published list. */}
      <AnchoredSection id="materials" offset="sectionNav" className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={ir.materials.eyebrow}
              title={ir.materials.title}
              description={ir.materials.intro}
            />
          </Reveal>
          <Stagger
            as="ul"
            className="mt-10 divide-y divide-[var(--lsh-rule)] border-y border-[var(--lsh-rule-strong)]"
          >
            {ir.materials.records.map((record) => (
              <StaggerItem
                key={record.title}
                as="li"
                className="grid gap-4 py-6 lg:grid-cols-[1.4fr_1fr_auto] lg:items-start lg:gap-10"
              >
                <div className="flex items-start gap-4">
                  <IconBadge icon={iconForTitle(record.title)} size={18} />
                  <div>
                    <h3 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)]">
                      {record.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{record.note}</p>
                  </div>
                </div>
                <dl className="grid gap-2 text-sm leading-6">
                  <div className="flex gap-3">
                    <dt className="lsh-display w-24 shrink-0 text-[10px] leading-6 text-[var(--lsh-brand-red)]">
                      {ir.materials.labels.date}
                    </dt>
                    <dd className="text-[var(--lsh-charcoal)]">{record.date}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="lsh-display w-24 shrink-0 text-[10px] leading-6 text-[var(--lsh-brand-red)]">
                      {ir.materials.labels.access}
                    </dt>
                    <dd className="text-[var(--lsh-muted)]">{record.category}</dd>
                  </div>
                </dl>
                <div className="lg:pt-1">
                  <ActionLink action={record.action as ActionKey} variant="onLight" />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <PublishedDocuments published={documents} />
          <Reveal>
            <p className="mt-8 text-sm leading-6 text-[var(--lsh-muted)]">
              {ir.materials.requestNote}
            </p>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 8. Investor contact: the channel, the primary action, and the two supporting pages. */}
      <AnchoredSection
        id="contact"
        offset="sectionNav"
        className="bg-[var(--lsh-charcoal)] px-5 py-20 text-white lg:px-8"
      >
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={ir.contactSection.eyebrow}
              title={ir.contactSection.title}
              description={ir.contactSection.text}
            />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ActionLink action={ir.contactSection.primary as ActionKey} />
              {ir.contactSection.secondary.map((link) => (
                <ActionLink key={link.action} action={link.action as ActionKey} variant="onDark">
                  {link.label}
                </ActionLink>
              ))}
            </div>
          </Reveal>
          <Reveal
            delay={0.05}
            className="border-t border-white/25 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
          >
            <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
              {ir.contactSection.channel}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-white/80">
              <a
                href={`mailto:${ir.contact.email}`}
                className="inline-flex w-fit items-center gap-2 transition-colors hover:text-white"
              >
                <Mail size={15} aria-hidden="true" /> {ir.contact.email}
              </a>
              <a
                href={telHref(ir.contact.phone)}
                className="inline-flex w-fit items-center gap-2 transition-colors hover:text-white"
              >
                <Phone size={15} aria-hidden="true" /> {ir.contact.phone}
              </a>
            </div>
          </Reveal>
        </Container>
      </AnchoredSection>

      {/* 9. Disclosures, on a permanent anchor: the figures' basis, the forward-looking statement, no offering. */}
      <AnchoredSection id="disclosures" offset="sectionNav" className="px-5 py-16 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={ir.disclosures.eyebrow} title={ir.disclosures.title} />
          </Reveal>
          <Reveal delay={0.05} className="grid gap-5 text-sm leading-6 text-[var(--lsh-muted)]">
            <p>{ir.disclosures.figures}</p>
            <div>
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                {ir.disclosures.forwardLooking.title}
              </p>
              <p className="mt-2">{ir.disclosures.forwardLooking.text}</p>
            </div>
            <p>{ir.disclosures.offering}</p>
          </Reveal>
        </Container>
      </AnchoredSection>
    </LifeSupplyLayout>
  );
}
