import { ExternalLink } from "lucide-react";

import { Accordion } from "@/components/public-site/accordion";
import { ActionLink } from "@/components/public-site/action-link";
import { CommercialModel } from "@/components/public-site/commercial-model";
import { PathwayComparison } from "@/components/public-site/pathway-comparison";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection, OnThisPage } from "@/components/public-site/on-this-page";
import {
  Callout,
  IconBadge,
  IconFeatureGrid,
  ProcessSteps,
  SplitSection,
} from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { getBrand, getBrandCategory } from "@/lib/public-site/brands";
import {
  commercialModel,
  comparisonRows,
  getKit,
  pathwayComparison,
  metabolic,
  type KitPathway,
} from "@/lib/public-site/content/metabolic";
import { iconForTitle } from "@/lib/public-site/icon-map";

/** The status line and the disclaimer every metabolic page carries. */
function StatusBand() {
  return (
    <section className="px-5 py-12 lg:px-8">
      <Reveal className="mx-auto grid max-w-7xl gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-[auto_1fr_1fr] lg:pl-8">
        <IconBadge icon="activity" />
        <p className="leading-7 text-[var(--lsh-charcoal)]">
          <span className="lsh-display mr-2 inline-flex border border-[var(--lsh-brand-red)] px-2 py-0.5 text-[10px] text-[var(--lsh-brand-red)]">
            {metabolic.status.label}
          </span>
          {metabolic.status.sentence}
        </p>
        <p className="leading-7 text-[var(--lsh-muted)]">{metabolic.disclaimer}</p>
      </Reveal>
    </section>
  );
}

/** Verified "browse" chips from the brand registry, or the honest reason there are none. */
function BrowseLinks({ kit }: { kit: KitPathway }) {
  if (kit.browse.length === 0) {
    return <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{kit.browseNote}</p>;
  }
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {kit.browse.map((ref) => {
        const record = getBrand(ref.brand);
        const category = getBrandCategory(ref.brand, ref.category);
        return (
          <li key={`${ref.brand}-${ref.category}`}>
            <a
              href={category.url}
              target="_blank"
              rel="noreferrer"
              className="lsh-display inline-flex items-center gap-1.5 border border-[var(--lsh-rule-strong)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              {record.name}: {category.label} <ExternalLink size={11} aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * `/metabolic-health/` — displayed as Metabolic Health Solutions, and since
 * the website consolidation (stage 2, 2026-09-10) the whole programme on one
 * page.
 *
 * The care-kits hub and its eight pathway pages made a reader open nine
 * addresses to compare eight things that only make sense against each other,
 * and refills was a tenth that could not be understood without the item roles
 * the pathways define. Everything is sectioned here instead, each pathway
 * keeping the anchor its page's slug used.
 */
export function MetabolicHealthPage() {
  const { hub } = metabolic;
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
      <OnThisPage items={metabolic.sections} />
      <StatusBand />

      {/*
       * Who buys what, and on what basis (round three, outcome 4). This used to
       * sit below the page's closing actions and disclosures, where a reader
       * reached it only after the whole pathway pitch. The commercial
       * explanation now precedes the detail it explains.
       */}
      <CommercialModel model={commercialModel} />

      {/* A connected supply experience: start, continue, support. */}
      <ProcessSteps
        eyebrow={hub.experience.eyebrow}
        title={hub.experience.title}
        description={hub.experience.intro}
        steps={hub.experience.steps.map((step) => ({
          index: step.index,
          title: step.title,
          text: step.text,
          icon: iconForTitle(step.title),
        }))}
      />
      <Callout icon="activity" eyebrow="The result" tone="onLight">
        <p className="lsh-display text-2xl leading-[1.1]">{hub.experience.result}</p>
      </Callout>

      {/* Four ways the relationship creates value. */}
      <IconFeatureGrid
        tone="onSurface"
        numbered
        columns={4}
        eyebrow={hub.streams.eyebrow}
        title={hub.streams.title}
        description={hub.streams.intro}
        items={hub.streams.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
        }))}
      />
      <Callout icon="shield" tone="onSurface">
        <p>{hub.streams.note}</p>
      </Callout>

      {/* For care partners, beside conceptual monitoring supplies. */}
      <SplitSection
        eyebrow={hub.audiences.eyebrow}
        title={hub.audiences.title}
        graphic="metabolicSupplies"
      >
        <p>{hub.audiences.intro}</p>
        <ul className="grid gap-5">
          {hub.audiences.items.map((item) => (
            <li key={item.title} className="flex gap-4">
              <IconBadge icon={iconForTitle(item.title)} size={18} />
              <div>
                <h3 className="lsh-display text-lg text-[var(--lsh-charcoal)]">{item.title}</h3>
                <p className="mt-1 text-sm leading-6">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="grid gap-6 border-t border-[var(--lsh-rule)] pt-6 sm:grid-cols-2">
          <div>
            <Eyebrow as="h3">{hub.audiences.support.title}</Eyebrow>
            <ul className="mt-3 grid gap-1.5 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {hub.audiences.support.items.map((item) => (
                <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow as="h3">{hub.audiences.principle.title}</Eyebrow>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {hub.audiences.principle.text}
            </p>
          </div>
        </div>
      </SplitSection>

      {/* Flexible by design: the six configuration dimensions. */}
      <IconFeatureGrid
        tone="onSurface"
        columns={3}
        eyebrow={hub.configure.eyebrow}
        title={hub.configure.title}
        description={hub.configure.intro}
        items={hub.configure.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
        }))}
      />
      <Callout icon="clipboardCheck" tone="onSurface">
        <p>{hub.configure.note}</p>
      </Callout>

      {/* Next step: discuss, configure, confirm. */}
      <ProcessSteps
        eyebrow={hub.process.eyebrow}
        title={hub.process.title}
        description={hub.process.intro}
        steps={hub.process.items.map((step) => ({
          index: step.index,
          title: step.title,
          text: step.text,
          icon: iconForTitle(step.title),
        }))}
        action={
          <>
            <ActionLink action="discuss_program" />
            <ActionLink action="explore_kits" variant="onDark" />
            <ActionLink action="refills_information" variant="onDark" />
          </>
        }
      />

      {/* Important information, as the overview states it. */}
      <section className="px-5 py-16 lg:px-8">
        <Container>
          <Reveal className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-7">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">{hub.important.title}</Eyebrow>
              <IconBadge icon="shield" size={18} />
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)] md:grid-cols-2">
              {hub.important.items.map((item) => (
                <li key={item} className="border-l-2 border-[var(--lsh-charcoal)] pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <PathwaysSection />
      <ReplenishmentSection />
      <CollaborationSection />
    </LifeSupplyLayout>
  );
}

/**
 * The eight pathways (`#pathways`), absorbed from the care-kits hub and its
 * eight pages on 2026-09-10.
 *
 * The comparison is the catalogue, as it has been since round three; each row
 * now names an anchor on this page rather than a page of its own. The eight
 * pathway sections follow it in the same order, each keeping the anchor its
 * page's slug used, so an old address lands on the same material.
 */
function PathwaysSection() {
  const { kitsHub } = metabolic;
  return (
    <AnchoredSection id="pathways">
      <section className="border-t border-[var(--lsh-rule)] px-5 pt-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={kitsHub.eyebrow}
              title={kitsHub.title}
              description={kitsHub.intro}
            />
          </Reveal>
        </Container>
      </section>

      {/* The single catalogue: every row opens that pathway's section below. */}
      <PathwayComparison
        comparison={pathwayComparison}
        pathways={comparisonRows().map((row) => ({ ...row, href: `#${row.slug}` }))}
      />

      <section className="px-5 pb-16 lg:px-8">
        <Container>
          {/* The three item roles every pathway is described with. */}
          <Stagger className="grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {kitsHub.legend.items.map((item) => (
              <StaggerItem key={item.role} className="flex gap-4 bg-[var(--lsh-surface)] p-6">
                <IconBadge icon={iconForTitle(item.role)} size={18} />
                <div>
                  <Eyebrow as="h3">{item.title}</Eyebrow>
                  <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {metabolic.kits.map((kit) => (
        <PathwaySection key={kit.slug} slug={kit.slug} />
      ))}
    </AnchoredSection>
  );
}

/**
 * One pathway, at the anchor its own page used to answer on.
 *
 * Everything its page carried is here: audience, the distinction that
 * matters, the three item roles, compatibility, exclusions, the verified
 * store categories or the honest reason there are none, and its own FAQs.
 * The layout is denser than the page was, because eight of these now sit on
 * one page, but nothing was dropped to achieve that — a canary checks each
 * pathway still renders every one of those parts.
 */
function PathwaySection({ slug }: { slug: string }) {
  const kit = getKit(slug);
  if (!kit) return null;
  return (
    <AnchoredSection
      id={kit.slug}
      className="border-t border-[var(--lsh-rule)] px-5 py-16 lg:px-8"
      backTo={{ href: "#pathways", label: "All eight pathways" }}
    >
      <Container>
        <Reveal className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <span className="lsh-display text-sm text-[var(--lsh-brand-red)]">{kit.id}</span>
          <h3 className="lsh-display text-3xl leading-tight text-[var(--lsh-charcoal)]">
            {kit.label}
          </h3>
        </Reveal>
        <Reveal delay={0.05} className="mt-4 max-w-3xl leading-7 text-[var(--lsh-muted)]">
          <p>{kit.purpose}</p>
        </Reveal>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Reveal className="flex gap-5 bg-[var(--lsh-surface)] p-6">
            <IconBadge icon="users" size={18} />
            <div>
              <Eyebrow as="h4">Who it is for</Eyebrow>
              <p className="mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">{kit.audience}</p>
            </div>
          </Reveal>
          <Reveal
            delay={0.05}
            className="flex gap-5 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6"
          >
            <IconBadge icon="shield" size={18} />
            <div>
              <Eyebrow as="h4">The distinction that matters</Eyebrow>
              <p className="mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">{kit.distinction}</p>
            </div>
          </Reveal>
        </div>

        {/* Roles only. Approved contents, quantities and a store configuration do not exist yet. */}
        <Stagger as="ul" className="mt-5 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
          {kit.roles.map((item) => (
            <StaggerItem as="li" key={item.role} className="bg-[var(--lsh-paper)] p-6">
              <div className="flex items-start justify-between gap-3">
                <IconBadge icon={iconForTitle(item.role)} size={18} />
                <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                  {item.role}
                </span>
              </div>
              <h4 className="lsh-display mt-4 text-lg text-[var(--lsh-charcoal)]">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h4">Compatibility</Eyebrow>
              <IconBadge icon="clipboardCheck" size={18} />
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {kit.compatibility.map((rule) => (
                <li key={rule} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
                  {rule}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal
            delay={0.05}
            className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h4">Excluded</Eyebrow>
              <IconBadge icon="shield" size={18} />
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {kit.exclusions.map((rule) => (
                <li key={rule} className="border-l-2 border-[var(--lsh-charcoal)] pl-3">
                  {rule}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-8 grid gap-10 border-t border-[var(--lsh-rule)] pt-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h4">Browse related store categories</Eyebrow>
              <IconBadge icon="cart" size={18} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
              Browsing a store category is not ordering a configuration. Prices and availability are
              published on the store.
            </p>
            <BrowseLinks kit={kit} />
          </Reveal>
          <Reveal delay={0.05}>
            <Eyebrow as="h4">Questions</Eyebrow>
            <div className="mt-4">
              <Accordion items={kit.faqs} />
            </div>
          </Reveal>
        </div>
      </Container>
    </AnchoredSection>
  );
}

/**
 * Replenishment (`#replenishment`), absorbed from `/metabolic-health/refills/`
 * on 2026-09-10. It sits after the pathways because the distinction it draws —
 * a starter item is chosen once and is never refilled — only means anything
 * once the three item roles have been read.
 */
function ReplenishmentSection() {
  const { refills } = metabolic;
  return (
    <AnchoredSection id="replenishment">
      <section className="border-t border-[var(--lsh-rule)] px-5 pt-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={refills.eyebrow}
              title={refills.title}
              description={refills.intro}
            />
          </Reveal>
        </Container>
      </section>
      <SplitSection
        tone="onSurface"
        eyebrow={refills.eyebrow}
        title={refills.today.title}
        graphic="pharmacy"
        side="left"
      >
        <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
          {refills.today.items.map((item) => (
            <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
              {item}
            </li>
          ))}
        </ul>
      </SplitSection>
      <Callout icon="repeat" eyebrow={refills.later.title} tone="onLight">
        <p>{refills.later.text}</p>
        <p className="mt-3 text-[var(--lsh-muted)]">{refills.substitutions}</p>
      </Callout>
    </AnchoredSection>
  );
}

/**
 * Programme collaboration (`#collaboration`), added on 2026-09-10.
 *
 * Stage 1 moved clinic collaboration onto Clinic Solutions pointing here for
 * the fuller scope, because the supply programme a collaboration would
 * configure is this one. This section is that scope. Without it the clinic
 * link went to a page that never picked the subject up.
 */
function CollaborationSection() {
  const { collaboration } = metabolic;
  const blocks = [collaboration.who, collaboration.boundary, collaboration.before] as const;
  return (
    <AnchoredSection id="collaboration">
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={collaboration.eyebrow}
              title={collaboration.title}
              description={collaboration.intro}
            />
          </Reveal>
          <Stagger as="ul" className="mt-10 grid gap-5 md:grid-cols-3">
            {blocks.map((block, index) => (
              <StaggerItem as="li" key={block.title} className="h-full">
                <div
                  className={`flex h-full flex-col border-t-4 bg-[var(--lsh-surface)] p-7 ${
                    index === 1 ? "border-[var(--lsh-charcoal)]" : "border-[var(--lsh-brand-red)]"
                  }`}
                >
                  <Eyebrow as="h3">{block.title}</Eyebrow>
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                    {block.items.map((item) => (
                      <li
                        key={item}
                        className={`border-l-2 pl-3 ${
                          index === 1
                            ? "border-[var(--lsh-charcoal)]"
                            : "border-[var(--lsh-brand-red)]"
                        }`}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal
            delay={0.1}
            className="mt-8 flex flex-col gap-5 border-t border-[var(--lsh-rule)] pt-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <p className="max-w-3xl leading-7 text-[var(--lsh-muted)]">{collaboration.note}</p>
            <div className="flex shrink-0 flex-wrap gap-3">
              {collaboration.actions.map((action, index) => (
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
