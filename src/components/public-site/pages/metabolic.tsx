import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink, RelatedActions } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import type { ActionKey } from "@/lib/public-site/actions";
import { getBrand, getBrandCategory } from "@/lib/public-site/brands";
import { getKit, metabolic, type KitPathway } from "@/lib/public-site/content/metabolic";
import { METABOLIC_ROUTES, kitRoute } from "@/lib/public-site/routes";

/** The status line and the disclaimer every metabolic page carries. */
function StatusBand() {
  return (
    <section className="px-5 py-12 lg:px-8">
      <Reveal className="mx-auto grid max-w-7xl gap-4 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-2 lg:pl-8">
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

/** `/metabolic-health/` */
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

      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading eyebrow={hub.streams.eyebrow} title={hub.streams.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-2 xl:grid-cols-4">
            {hub.streams.items.map((item, index) => (
              <StaggerItem key={item.title} as="article" className="bg-[var(--lsh-paper)] p-7">
                <p className="lsh-display text-sm text-[var(--lsh-brand-red)]">0{index + 1}</p>
                <h3 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading eyebrow={hub.audiences.eyebrow} title={hub.audiences.title} />
          </Reveal>
          <Stagger className="grid gap-5">
            {hub.audiences.items.map((item) => (
              <StaggerItem
                key={item.title}
                as="article"
                className="border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6"
              >
                <h3 className="lsh-display text-xl text-[var(--lsh-charcoal)]">{item.title}</h3>
                <p className="mt-2 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading tone="onDark" eyebrow={hub.process.eyebrow} title={hub.process.title} />
          </Reveal>
          <Stagger className="mt-12 grid gap-px bg-white/15 md:grid-cols-3">
            {hub.process.items.map((step) => (
              <StaggerItem key={step.index} as="article" className="bg-[var(--lsh-charcoal)] p-8">
                <p className="lsh-display text-sm text-[var(--lsh-red-on-ink)]">{step.index}</p>
                <h3 className="lsh-display mt-3 text-2xl">{step.title}</h3>
                <p className="mt-3 leading-7 text-white/75">{step.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 flex flex-wrap gap-3">
            <ActionLink action="explore_kits" variant="onDark" />
            <ActionLink action="refills_information" variant="onDark" />
          </Reveal>
        </div>
      </section>
      <RelatedActions actions={hub.related} />
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

      <section className="px-5 pb-20 lg:px-8">
        <Container>
          <Reveal className="grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {kitsHub.legend.items.map((item) => (
              <div key={item.role} className="bg-[var(--lsh-surface)] p-6">
                <Eyebrow as="h2">{item.title}</Eyebrow>
                <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
              </div>
            ))}
          </Reveal>
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {metabolic.kits.map((kit) => (
              <StaggerItem key={kit.slug} className="h-full">
                <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                  <Link href={kitRoute(kit.slug)} className="group flex h-full flex-col p-7">
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {kit.id} · {metabolic.status.label}
                    </p>
                    <h3 className="lsh-display mt-4 text-xl leading-tight text-[var(--lsh-charcoal)]">
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
          <Reveal>
            <Eyebrow as="h2">Who it is for</Eyebrow>
            <p className="mt-3 leading-7 text-[var(--lsh-charcoal)]">{kit.audience}</p>
          </Reveal>
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] pl-6">
            <Eyebrow as="h2">The distinction that matters</Eyebrow>
            <p className="mt-3 leading-7 text-[var(--lsh-charcoal)]">{kit.distinction}</p>
          </Reveal>
        </div>
      </section>

      {/* Item roles; no contents, quantities, or SKUs exist yet. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Configuration"
              title="What a configuration would cover."
              description="Roles only. Approved contents, quantities, and a store configuration do not exist yet; when they do, they will be published here with their revision."
            />
          </Reveal>
          <Stagger className="mt-10 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
            {kit.roles.map((item) => (
              <StaggerItem key={item.role} as="article" className="bg-[var(--lsh-paper)] p-7">
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{item.role}</p>
                <h3 className="lsh-display mt-3 text-xl text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
              <Eyebrow as="h3">Compatibility</Eyebrow>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {kit.compatibility.map((rule) => (
                  <li key={rule} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
                    {rule}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-7">
              <Eyebrow as="h3">Excluded</Eyebrow>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {kit.exclusions.map((rule) => (
                  <li key={rule} className="border-l-2 border-[var(--lsh-charcoal)] pl-3">
                    {rule}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Browse, availability, FAQs, next step. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <Reveal>
            <Eyebrow as="h2">Browse related store categories</Eyebrow>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
              Browsing a store category is not ordering a configuration. Prices and availability are
              published on the store.
            </p>
            <BrowseLinks kit={kit} />
          </Reveal>
          <Reveal>
            <Eyebrow as="h2">Questions</Eyebrow>
            <dl className="mt-4 grid gap-4">
              {kit.faqs.map((faq) => (
                <div key={faq.q} className="border-l-2 border-[var(--lsh-brand-red)] pl-4">
                  <dt className="lsh-display text-sm text-[var(--lsh-charcoal)]">{faq.q}</dt>
                  <dd className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
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
      <RelatedActions actions={kit.related} />
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
      <section className="px-5 pb-20 lg:px-8">
        <Container className="grid gap-8 lg:grid-cols-2">
          <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7">
            <Eyebrow as="h2">{refills.today.title}</Eyebrow>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
              {refills.today.items.map((item) => (
                <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-7">
            <Eyebrow as="h2">{refills.later.title}</Eyebrow>
            <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{refills.later.text}</p>
            <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{refills.substitutions}</p>
          </Reveal>
        </Container>
        <Reveal className="mx-auto mt-10 flex max-w-7xl flex-wrap gap-3">
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
