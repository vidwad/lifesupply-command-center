import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { OPERATING_BRANDS, brandGeography, type OperatingBrandKey } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { BRAND_ROUTES, STAGE_3_ROUTES } from "@/lib/public-site/routes";

/**
 * Our Businesses hub — the Stage 3 portfolio map (guide §3,
 * `/our-operations/`): brands, published entities, shared capabilities, and
 * developing programs, each kept distinct. Primary action: explore a
 * business. Brand cards link to the internal brand pages; the store links
 * live on those pages and in the footer.
 */
export function OperationsPage() {
  const { businesses, operations, operationsTimeline, contact, brand } = LIFE_SUPPLY_CONTENT;
  const { hub } = businesses;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.description}
        actions={<ActionLink action="clinic_solutions" variant="onDark" />}
      />

      {/* How the map is organised. */}
      <section className="px-5 py-20 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading eyebrow={hub.map.eyebrow} title={hub.map.title} />
          <p className="border-l-4 border-[var(--lsh-brand-red)] pl-6 leading-8 text-[var(--lsh-muted)]">
            {hub.map.text}
          </p>
        </Reveal>
      </section>

      {/* Brands: internal pages. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading eyebrow={hub.brands.eyebrow} title={hub.brands.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {OPERATING_BRANDS.map((record) => (
              <StaggerItem key={record.key} className="h-full">
                <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                  <Link
                    href={BRAND_ROUTES[record.key as OperatingBrandKey]}
                    className="group flex h-full flex-col p-7"
                  >
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {brandGeography(record)}
                    </p>
                    <h3 className="lsh-display mt-6 text-2xl text-[var(--lsh-charcoal)]">
                      {record.name}
                    </h3>
                    <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{record.purpose}</p>
                    <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]">
                      About {record.name}{" "}
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
          <Reveal className="mt-8">
            <Link
              href={STAGE_3_ROUTES.technology}
              className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]"
            >
              Technology and fulfilment across the brands{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Entities, as published. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading
              eyebrow={hub.entities.eyebrow}
              title={hub.entities.title}
              description={hub.entities.note}
            />
          </Reveal>
          <Stagger as="ul" className="grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2">
            <StaggerItem as="li" className="bg-[var(--lsh-paper)] p-6">
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">Corporate</p>
              <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">
                {brand.address[0]}
              </p>
            </StaggerItem>
            {contact.subsidiaries.map((entity) => (
              <StaggerItem key={entity.name} as="li" className="bg-[var(--lsh-paper)] p-6">
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                  Published entity
                </p>
                <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">{entity.name}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Shared capabilities: the approved narrative, unchanged. */}
      <section className="bg-[var(--lsh-ink)] px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              tone="onDark"
              eyebrow={hub.capabilities.eyebrow}
              title={hub.capabilities.title}
              description={hub.capabilities.note}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-px bg-white/15 md:grid-cols-2">
            {operations.slice(0, 4).map((operation, index) => (
              <StaggerItem
                key={operation.title}
                as="article"
                className="bg-[var(--lsh-charcoal)] p-8"
              >
                <p className="lsh-display text-sm text-[var(--lsh-red-on-ink)]">0{index + 1}</p>
                <h3 className="lsh-display mt-3 text-2xl">{operation.title}</h3>
                <p className="mt-3 leading-7 text-white/75">{operation.description}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Developing programs, with status. */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={hub.developing.eyebrow} title={hub.developing.title} />
          </Reveal>
          <Stagger className="mt-10 grid gap-5 lg:grid-cols-2">
            {hub.developing.items.map((item) => (
              <StaggerItem
                key={item.title}
                as="article"
                className="border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-7"
              >
                <span className="lsh-display inline-flex border border-[var(--lsh-brand-red)] px-3 py-1 text-[10px] text-[var(--lsh-brand-red)]">
                  {item.status}
                </span>
                <h3 className="lsh-display mt-4 text-2xl text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* The historical timeline graphic, labelled as such. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <Eyebrow as="h2">{hub.timeline.eyebrow}</Eyebrow>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{hub.timeline.note}</p>
            <div className="mt-6 overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-4 shadow-sm">
              <Image
                src={operationsTimeline.src}
                alt={operationsTimeline.alt}
                width={operationsTimeline.width}
                height={operationsTimeline.height}
                sizes="(min-width: 768px) 640px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}
