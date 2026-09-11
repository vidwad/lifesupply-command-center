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
import { Callout, IconBadge, SplitSection } from "@/components/public-site/sections";
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

/**
 * The two boundaries that qualify everything below them, stated once.
 *
 * A status band, a disclaimer and an "Important information" list of four
 * carried these between them, and said that nothing is available five times
 * over. The hero says that once now; this says what the service is not.
 */
function BoundariesBand() {
  const { boundaries } = metabolic;
  return (
    <section className="border-b border-[var(--lsh-rule)] px-5 py-12 lg:px-8">
      <Container className="grid gap-8 lg:grid-cols-[auto_1fr_1fr] lg:gap-10">
        <IconBadge icon="shield" />
        <p className="leading-7 text-[var(--lsh-charcoal)]">{boundaries.clinical}</p>
        <p className="leading-7 text-[var(--lsh-muted)]">{boundaries.guidance}</p>
      </Container>
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
/**
 * `/metabolic-health/` — displayed as Metabolic Health Solutions.
 *
 * Redesigned on 2026-09-11. The page stated the same four-part offer four
 * times before the reader reached the eight pathways: once in the
 * introduction, once as "A connected supply experience", once as "Four ways
 * the relationship creates value", and once as a "Program support" list.
 * That, with two process sequences that covered the same ground and three
 * notes repeating that nothing was available, put roughly six thousand pixels
 * of preamble in front of the content people arrive for.
 *
 * The offer is described once. The eleven anchors the consolidation's
 * redirects land on are unchanged.
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
      <BoundariesBand />
      <OfferSection />

      {/* Who buys what, and on what basis (round three, outcome 4). */}
      <CommercialModel model={commercialModel} />

      <PathwaysSection />
      <ReplenishmentSection />
      <CollaborationSection />
      <ClosingBand />
    </LifeSupplyLayout>
  );
}

/**
 * The offer, in one section. Four parts, each stated one way.
 */
function OfferSection() {
  const { offer } = metabolic.hub;
  return (
    <section className="px-5 py-20 lg:px-8">
      <Container>
        <Reveal className="max-w-2xl">
          <SectionHeading eyebrow={offer.eyebrow} title={offer.title} />
        </Reveal>
        <Stagger
          as="ul"
          className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] lg:-mx-8 lg:grid-cols-2"
        >
          {offer.items.map((item, index) => (
            <StaggerItem as="li" key={item.title} className="h-full bg-[var(--lsh-paper)]">
              <article className="flex h-full flex-col gap-4 p-5 lg:p-8">
                <span
                  aria-hidden="true"
                  className="lsh-display text-[var(--lsh-charcoal)]/25 text-4xl leading-none"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal delay={0.1} className="mt-8 border-t border-[var(--lsh-rule)] pt-8">
          <p className="max-w-3xl leading-7 text-[var(--lsh-muted)]">{offer.note}</p>
        </Reveal>
      </Container>
    </section>
  );
}

/** The closing band: what a first conversation covers, and what it is not. */
function ClosingBand() {
  const { close, actions } = metabolic.hub;
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
      {/*
       * One band, one heading. It was three sections until 2026-09-11 — a
       * heading, then the comparison under a near-identical heading of its
       * own, then the item roles beneath the table that uses them. The roles
       * now come first, because the table's "Durable and consumable roles"
       * column means nothing until they have been read.
       */}
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container className="min-w-0">
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={kitsHub.eyebrow}
              title={kitsHub.title}
              description={kitsHub.intro}
            />
          </Reveal>

          {/* The three item roles every pathway is described with. */}
          <Stagger className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3 lg:-mx-8">
            {kitsHub.legend.items.map((item) => (
              <StaggerItem
                key={item.role}
                className="flex gap-4 bg-[var(--lsh-surface)] p-5 lg:p-8"
              >
                <IconBadge icon={iconForTitle(item.role)} size={18} />
                <div>
                  <Eyebrow as="h3">{item.title}</Eyebrow>
                  <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {/* The single catalogue: every row opens that pathway's section below. */}
          <div className="mt-12">
            <PathwayComparison
              comparison={pathwayComparison}
              pathways={comparisonRows().map((row) => ({ ...row, href: `#${row.slug}` }))}
            />
          </div>
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

        <Reveal className="-mx-5 mt-8 flex gap-5 bg-[var(--lsh-surface)] p-5 lg:-mx-8 lg:p-8">
          <IconBadge icon="users" size={18} />
          <div>
            <Eyebrow as="h4">Who it is for</Eyebrow>
            <p className="mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">{kit.audience}</p>
          </div>
        </Reveal>

        {/* Roles only. Approved contents, quantities and a store configuration do not exist yet. */}
        <Stagger
          as="ul"
          className="-mx-5 mt-px grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3 lg:-mx-8"
        >
          {kit.roles.map((item) => (
            <StaggerItem as="li" key={item.role} className="bg-[var(--lsh-paper)] p-5 lg:p-8">
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

        <div className="-mx-5 mt-5 grid gap-5 lg:-mx-8 lg:grid-cols-2">
          <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-5 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h4">Compatibility</Eyebrow>
              <IconBadge icon="clipboardCheck" size={18} />
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {kit.compatibility.map((rule) => (
                <li key={rule} className="lsh-bullet">
                  {rule}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal
            delay={0.05}
            className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-5 lg:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h4">Excluded</Eyebrow>
              <IconBadge icon="shield" size={18} />
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {kit.exclusions.map((rule) => (
                <li key={rule} className="lsh-bullet">
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
      <section className="border-t border-[var(--lsh-rule)] px-5 pb-12 pt-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={refills.eyebrow}
              title={refills.title}
              description={refills.intro}
            />
          </Reveal>
        </Container>
      </section>
      <SplitSection tone="onSurface" title={refills.today.title} graphic="pharmacy" side="left">
        <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
          {refills.today.items.map((item) => (
            <li key={item} className="lsh-bullet">
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
  const blocks = [collaboration.who, collaboration.planning] as const;
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
          <Stagger as="ul" className="mt-12 grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
            {blocks.map((block) => (
              <StaggerItem as="li" key={block.title} className="h-full">
                <Eyebrow as="h3">{block.title}</Eyebrow>
                <ul className="mt-5 grid gap-2 leading-7 text-[var(--lsh-muted)]">
                  {block.items.map((item) => (
                    <li key={item} className="lsh-bullet">
                      {item}
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="mt-10 border-t border-[var(--lsh-rule)] pt-8">
            <div className="flex flex-wrap gap-3">
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
