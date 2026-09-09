import { Mail, Phone, ShieldCheck } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  EditorialStat,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { BentoGrid, IconBadge, IconFeatureGrid } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { investorRelations, type BusinessStatus } from "@/lib/public-site/content/investors";
import { iconForTitle } from "@/lib/public-site/icon-map";
import {
  LIFE_SUPPLY_ROUTES,
  METABOLIC_ROUTES,
  STAGE_3_ROUTES,
  STAGE_5_ROUTES,
} from "@/lib/public-site/routes";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

const SECTION_ROUTES = {
  growthStrategy: STAGE_5_ROUTES.growthStrategy,
  advancedTherapeutics: STAGE_5_ROUTES.advancedTherapeutics,
  news: LIFE_SUPPLY_ROUTES.news,
  disclosures: STAGE_5_ROUTES.disclosures,
} as const;

const STRAND_ROUTES = {
  operations: LIFE_SUPPLY_ROUTES.operations,
  clinicSolutions: STAGE_3_ROUTES.clinicSolutions,
  metabolic: METABOLIC_ROUTES.hub,
  advancedTherapeutics: STAGE_5_ROUTES.advancedTherapeutics,
  acquisitions: STAGE_5_ROUTES.partnerAcquisitions,
} as const;

/** Business-availability status, stated beside the claim it qualifies. */
function StatusTag({ status }: { status: BusinessStatus }) {
  const operating = status === "Operating";
  return (
    <span
      className={`lsh-display inline-flex border px-2 py-0.5 text-[10px] ${
        operating
          ? "border-[var(--lsh-charcoal)] text-[var(--lsh-charcoal)]"
          : "border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]"
      }`}
    >
      {status}
    </span>
  );
}

/** The forward-looking qualification, beside the claims it qualifies. */
function ForwardLooking({ text }: { text: string }) {
  return (
    <Reveal className="mx-auto mt-10 flex max-w-7xl gap-5 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
      <IconBadge icon="shield" />
      <div>
        <div className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
          Forward-looking statements
        </div>
        <p className="mt-2 leading-7 text-[var(--lsh-muted)]">{text}</p>
      </div>
    </Reveal>
  );
}

function InvestorContact() {
  const { contact } = investorRelations;
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={`mailto:${contact.email}`}
        className="lsh-primary-action lsh-display inline-flex items-center gap-2 px-5 py-3 text-[11px] transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <Mail size={16} aria-hidden="true" /> {contact.email}
      </a>
      <a
        href={telHref(contact.phone)}
        className="lsh-display inline-flex items-center gap-2 border border-[var(--lsh-rule-strong)] px-5 py-3 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
      >
        <Phone size={16} aria-hidden="true" /> {contact.phone}
      </a>
    </div>
  );
}

function ActionRow({ actions }: { actions: readonly string[] }) {
  return (
    <Reveal className="mx-auto mt-12 flex max-w-7xl flex-wrap gap-3">
      {actions.map((action, index) => (
        <ActionLink
          key={action}
          action={action as ActionKey}
          variant={index === 0 ? "primary" : "onLight"}
        />
      ))}
    </Reveal>
  );
}

/** The three approved figures with their full scope. */
function ReportedFigures() {
  const { currentReport } = investorRelations;
  return (
    <>
      <Reveal>
        <SectionHeading
          eyebrow={currentReport.period}
          title="Current report context"
          description={`${currentReport.status}. ${currentReport.entity}.`}
        />
      </Reveal>
      <Stagger className="mt-8 grid gap-3 sm:grid-cols-3">
        {currentReport.highlights.map((item) => (
          <StaggerItem key={item.label} className="h-full">
            <EditorialStat value={item.value} label={item.label} />
          </StaggerItem>
        ))}
      </Stagger>
    </>
  );
}

/** `/investor-relations/` */
export function InvestorRelationsPage() {
  const investor = investorRelations;
  const { hub } = investor;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={hub.eyebrow} title={investor.title} description={investor.description} />

      {/* The business today, each strand with its status. */}
      <IconFeatureGrid
        columns={4}
        eyebrow={hub.rationale.eyebrow}
        title={hub.rationale.title}
        items={hub.rationale.items.map((item) => ({
          title: item.title,
          text: item.text,
          status: item.status,
          icon: iconForTitle(item.title),
        }))}
      />
      <section className="px-5 pb-20 lg:px-8">
        <Container>
          <ForwardLooking text={hub.forwardLooking} />
        </Container>
      </section>

      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <ReportedFigures />
          </div>
          <Reveal className="flex gap-5 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-6 lg:self-start">
            <IconBadge icon="file" />
            <div>
              <div className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                {investor.expansionContext.title}
              </div>
              <p className="lsh-display mt-2 text-[10px] text-[var(--lsh-muted)]">
                {investor.expansionContext.date}
              </p>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">
                {investor.expansionContext.description}
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* The four sections, around one conceptual graphic. */}
      <BentoGrid
        tiles={[
          { title: hub.eyebrow, eyebrow: "In this section", graphic: "boardroom" },
          ...hub.sections.map((section) => ({
            title: section.title,
            text: section.text,
            icon: iconForTitle(section.title),
            href: SECTION_ROUTES[section.route],
            linkLabel: "Open",
          })),
        ]}
      />
      <section className="px-5 pb-20 lg:px-8">
        <Container>
          <Reveal className="flex flex-wrap items-center gap-4">
            <InvestorContact />
            <ActionLink action="growth_strategy" variant="text" />
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/investor-relations/growth-strategy/` */
export function GrowthStrategyPage() {
  const g = investorRelations.growthStrategy;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={g.eyebrow} title={g.title} description={g.intro} />
      <IconFeatureGrid
        items={g.strands.map((strand) => ({
          title: strand.title,
          text: strand.text,
          status: strand.status,
          icon: iconForTitle(strand.title),
          href: STRAND_ROUTES[strand.route],
          linkLabel: "Read more",
        }))}
      />
      <section className="px-5 pb-20 lg:px-8">
        <Container>
          <ForwardLooking text={investorRelations.hub.forwardLooking} />
        </Container>
      </section>
      <section className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={g.record.eyebrow}
              title={g.record.title}
              description={g.record.note}
            />
          </Reveal>
          <Stagger as="ul" className="mt-10 grid gap-px bg-white/15 md:grid-cols-2 xl:grid-cols-3">
            {g.record.items.map((item) => (
              <StaggerItem
                key={`${item.date}-${item.text}`}
                as="li"
                className="flex gap-4 bg-[var(--lsh-charcoal)] p-6"
              >
                <IconBadge icon="scroll" tone="onDark" size={18} />
                <div>
                  <p className="lsh-display text-[10px] text-[var(--lsh-red-on-ink)]">
                    {item.date}
                  </p>
                  <p className="mt-2 leading-7 text-white/80">{item.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
      <section className="px-5 pb-20 lg:px-8">
        <ActionRow actions={g.actions} />
      </section>
    </LifeSupplyLayout>
  );
}

/** `/investor-relations/advanced-therapeutics/` */
export function AdvancedTherapeuticsPage() {
  const t = investorRelations.advancedTherapeutics;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={t.eyebrow} title={t.title} description={t.intro} />
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Stagger className="grid gap-5 md:grid-cols-2">
            {t.options.map((option) => (
              <StaggerItem
                key={option.title}
                as="article"
                className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <IconBadge icon={iconForTitle(option.title)} />
                  <StatusTag status={option.status} />
                </div>
                <h2 className="lsh-display mt-6 text-2xl text-[var(--lsh-charcoal)]">
                  {option.title}
                </h2>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{option.text}</p>
                <Eyebrow as="h3" className="mt-6">
                  Depends on
                </Eyebrow>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                  {option.dependencies.map((dependency) => (
                    <li key={dependency} className="border-l-2 border-[var(--lsh-charcoal)] pl-3">
                      {dependency}
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            ))}
          </Stagger>
          <ForwardLooking text={t.qualification} />
          <ActionRow actions={t.actions} />
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/investor-relations/disclosures/` */
export function DisclosuresPage() {
  const d = investorRelations.disclosures;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={d.eyebrow} title={d.title} description={d.intro} />
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <ReportedFigures />
          </div>
          <Reveal className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-7 lg:self-start">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">Basis of the figures</Eyebrow>
              <IconBadge icon="chart" size={18} />
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {d.basis.map((line) => (
                <li key={line} className="border-l-2 border-[var(--lsh-charcoal)] pl-3">
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
        <Container>
          <Reveal className="mt-10 flex gap-5 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
            <IconBadge icon="shield" />
            <div>
              <div className="lsh-display flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                <ShieldCheck size={16} aria-hidden="true" /> {d.forwardLooking.title}
              </div>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{d.forwardLooking.text}</p>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{d.materials}</p>
            </div>
          </Reveal>
        </Container>
        <ActionRow actions={d.actions} />
      </section>
    </LifeSupplyLayout>
  );
}
