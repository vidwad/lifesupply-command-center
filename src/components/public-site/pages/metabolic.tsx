import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { Accordion } from "@/components/public-site/accordion";
import { ActionLink } from "@/components/public-site/action-link";
import { CommercialModel } from "@/components/public-site/commercial-model";
import { PathwayComparison } from "@/components/public-site/pathway-comparison";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
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
import { METABOLIC_ROUTES, kitRoute } from "@/lib/public-site/routes";

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

/** `/metabolic-health/` — the partner overview's model, with the status beside every claim. */
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
      <StatusBand />

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
      <CommercialModel model={commercialModel} />
    </LifeSupplyLayout>
  );
}

/** `/metabolic-health/care-kits/` */
export function CareKitsPage() {
  const { kitsHub } = metabolic;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={kitsHub.eyebrow}
        title={kitsHub.title}
        description={kitsHub.intro}
        actions={<ActionLink action="discuss_program" />}
      />
      <StatusBand />
      <PathwayComparison comparison={pathwayComparison} pathways={comparisonRows()} />

      <section className="px-5 pb-20 lg:px-8">
        <Container>
          {/* The three item roles every pathway is described with. */}
          <Stagger className="grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {kitsHub.legend.items.map((item) => (
              <StaggerItem key={item.role} className="flex gap-4 bg-[var(--lsh-surface)] p-6">
                <IconBadge icon={iconForTitle(item.role)} size={18} />
                <div>
                  <Eyebrow as="h2">{item.title}</Eyebrow>
                  <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {/* The eight pathways. */}
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {metabolic.kits.map((kit) => (
              <StaggerItem key={kit.slug} className="h-full">
                <SpotlightCard className="lsh-lift h-full border border-t-2 border-[var(--lsh-rule)] border-t-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] transition-colors hover:border-t-[var(--lsh-brand-red)]">
                  <Link href={kitRoute(kit.slug)} className="group flex h-full flex-col p-7">
                    <div className="flex items-start justify-between gap-4">
                      <IconBadge icon={iconForTitle(kit.id)} />
                      <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                        {kit.id} · {metabolic.status.label}
                      </p>
                    </div>
                    <h3 className="lsh-display mt-6 text-xl leading-tight text-[var(--lsh-charcoal)]">
                      {kit.label}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{kit.audience}</p>
                    <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]">
                      Pathway details{" "}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </span>
                  </Link>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 flex flex-wrap gap-3">
            {kitsHub.actions.map((action, index) => (
              <ActionLink
                key={action}
                action={action as ActionKey}
                variant={index === 0 ? "primary" : "onLight"}
              />
            ))}
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/metabolic-health/care-kits/[kit]/` */
export function CareKitPage({ slug }: { slug: string }) {
  const kit = getKit(slug);
  if (!kit) return null;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={`${kit.id} · ${metabolic.kitsHub.eyebrow}`}
        title={kit.label}
        description={kit.purpose}
        actions={<ActionLink action="discuss_program" />}
      />
      <StatusBand />

      {/* Audience and the critical distinction. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <Reveal className="flex gap-5">
            <IconBadge icon="users" />
            <div>
              <Eyebrow as="h2">Who it is for</Eyebrow>
              <p className="mt-3 leading-7 text-[var(--lsh-charcoal)]">{kit.audience}</p>
            </div>
          </Reveal>
          <Reveal className="flex gap-5 border-l-4 border-[var(--lsh-brand-red)] pl-6">
            <IconBadge icon="shield" />
            <div>
              <Eyebrow as="h2">The distinction that matters</Eyebrow>
              <p className="mt-3 leading-7 text-[var(--lsh-charcoal)]">{kit.distinction}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Item roles; no contents, quantities, or SKUs exist yet. */}
      <IconFeatureGrid
        eyebrow="Configuration"
        title="What a configuration would cover."
        description="Roles only. Approved contents, quantities, and a store configuration do not exist yet; when they do, they will be published here with their revision."
        items={kit.roles.map((item) => ({
          title: item.title,
          text: item.text,
          status: item.role,
          icon: iconForTitle(item.role),
        }))}
      />

      <section className="px-5 pb-20 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-2">
          <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h3">Compatibility</Eyebrow>
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
          <Reveal className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-7">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h3">Excluded</Eyebrow>
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
        </Container>
      </section>

      {/* Browse, questions, next step. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">Browse related store categories</Eyebrow>
              <IconBadge icon="cart" size={18} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
              Browsing a store category is not ordering a configuration. Prices and availability are
              published on the store.
            </p>
            <BrowseLinks kit={kit} />
          </Reveal>
          <Reveal>
            <Eyebrow as="h2">Questions</Eyebrow>
            <div className="mt-4">
              <Accordion items={kit.faqs} />
            </div>
          </Reveal>
        </Container>
        <Reveal className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-between gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6">
          <p className="max-w-2xl leading-7 text-[var(--lsh-muted)]">{metabolic.status.sentence}</p>
          <div className="flex flex-wrap gap-3">
            <ActionLink action="discuss_program" />
            <Link
              href={METABOLIC_ROUTES.careKits}
              className="lsh-display inline-flex items-center gap-2 border border-[var(--lsh-rule-strong)] px-5 py-3 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              All pathways <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/metabolic-health/refills/` */
export function RefillsPage() {
  const { refills } = metabolic;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={refills.eyebrow}
        title={refills.title}
        description={refills.intro}
        actions={<ActionLink action="discuss_program" />}
      />
      <StatusBand />
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
      <section className="px-5 pb-20 lg:px-8">
        <Reveal className="mx-auto flex max-w-7xl flex-wrap gap-3">
          {refills.actions.map((action, index) => (
            <ActionLink
              key={action}
              action={action as ActionKey}
              variant={index === 0 ? "primary" : "onLight"}
            />
          ))}
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}
