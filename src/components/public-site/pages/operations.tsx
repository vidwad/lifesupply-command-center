import Image from "next/image";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { BentoGrid, Callout, IconBadge, IconFeatureGrid } from "@/components/public-site/sections";
import { OPERATING_BRANDS, brandGeography, type OperatingBrandKey } from "@/lib/public-site/brands";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";
import { BRAND_ROUTES } from "@/lib/public-site/routes";

/**
 * Our Businesses hub — the Stage 3 portfolio map (guide §3,
 * `/our-operations/`): brands, published entities, shared capabilities, and
 * developing programs, each kept distinct. Primary action: explore a
 * business. Brand tiles link to the internal brand pages; the store links
 * live on those pages and in the footer.
 */
export function OperationsPage() {
  const { businesses, operations, operationsTimeline, contact, brand } = LIFE_SUPPLY_CONTENT;
  const { hub, technology } = businesses;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.description}
        actions={<ActionLink action="clinic_solutions" variant="onDark" />}
      />

      {/* How the map is organised. */}
      <section className="px-5 pt-20 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading eyebrow={hub.map.eyebrow} title={hub.map.title} />
          <p className="border-l-4 border-[var(--lsh-brand-red)] pl-6 leading-8 text-[var(--lsh-muted)]">
            {hub.map.text}
          </p>
        </Reveal>
      </section>

      {/* Brands: a bento of the four internal brand pages around one conceptual graphic. */}
      <BentoGrid
        tiles={[
          {
            title: hub.brands.title,
            eyebrow: hub.brands.eyebrow,
            graphic: "warehouse",
            span: "tall",
          },
          ...OPERATING_BRANDS.map((record) => ({
            title: record.name,
            text: record.purpose,
            eyebrow: brandGeography(record),
            icon: iconForTitle(record.name),
            href: BRAND_ROUTES[record.key as OperatingBrandKey],
            linkLabel: `About ${record.name}`,
          })),
        ]}
      />

      {/* Technology and fulfilment across the brands. */}
      <Callout
        icon="workflow"
        eyebrow={technology.eyebrow}
        action={<ActionLink action="technology_fulfilment" variant="onLight" />}
      >
        <p className="lsh-display text-2xl leading-[1.1]">{technology.title}</p>
        <p className="mt-2 text-[var(--lsh-muted)]">{technology.intro}</p>
      </Callout>

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
            <StaggerItem as="li" className="flex items-start gap-4 bg-[var(--lsh-paper)] p-6">
              <IconBadge icon="landmark" size={20} />
              <div>
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">Corporate</p>
                <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">
                  {brand.address[0]}
                </p>
              </div>
            </StaggerItem>
            {contact.subsidiaries.map((entity) => (
              <StaggerItem
                key={entity.name}
                as="li"
                className="flex items-start gap-4 bg-[var(--lsh-paper)] p-6"
              >
                <IconBadge icon="building" size={20} />
                <div>
                  <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                    Published entity
                  </p>
                  <p className="lsh-display mt-2 text-lg text-[var(--lsh-charcoal)]">
                    {entity.name}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Shared capabilities: the approved narrative, unchanged. */}
      <IconFeatureGrid
        tone="onDark"
        numbered
        columns={2}
        eyebrow={hub.capabilities.eyebrow}
        title={hub.capabilities.title}
        description={hub.capabilities.note}
        items={operations.slice(0, 4).map((operation) => ({
          title: operation.title,
          text: operation.description,
          icon: iconForTitle(operation.title),
        }))}
      />

      {/* Developing programs, with status. */}
      <IconFeatureGrid
        columns={2}
        eyebrow={hub.developing.eyebrow}
        title={hub.developing.title}
        items={hub.developing.items.map((item) => ({
          title: item.title,
          text: item.text,
          status: item.status,
          icon: iconForTitle(item.title),
        }))}
      />

      {/* The historical timeline graphic, labelled as such. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <Eyebrow as="h2">{hub.timeline.eyebrow}</Eyebrow>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{hub.timeline.note}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-hidden border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-4 shadow-sm">
              <Image
                src={operationsTimeline.src}
                alt={operationsTimeline.alt}
                width={operationsTimeline.width}
                height={operationsTimeline.height}
                sizes="(min-width: 1024px) 720px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
