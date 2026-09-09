import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal } from "@/components/public-site/motion";
import { IconBadge, IconFeatureGrid, SplitSection } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * `/pharmacy-solutions/` (2026-09-08, expanded 2026-09-09): why the program
 * matters to the ecosystem, the pharmacy supply program that is in
 * development today, and the stated direction for pharmacy-related
 * operations, each with its status. Nothing here dispenses, diagnoses, or
 * prescribes, and no transaction is named or implied.
 */
export function PharmacySolutionsPage() {
  const { pharmacy } = LIFE_SUPPLY_CONTENT;
  const { hub } = pharmacy;
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

      {/* The status, stated before anything else. */}
      <section className="px-5 py-12 lg:px-8">
        <Reveal className="mx-auto flex max-w-7xl gap-6 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:pl-8">
          <IconBadge icon="pill" />
          <p className="max-w-3xl leading-7 text-[var(--lsh-charcoal)]">
            <span className="lsh-display mr-2 inline-flex border border-[var(--lsh-brand-red)] px-2 py-0.5 text-[10px] text-[var(--lsh-brand-red)]">
              {pharmacy.status.label}
            </span>
            {pharmacy.status.sentence}
          </p>
        </Reveal>
      </section>

      {/* Why it matters: the value to the ecosystem, as design intent. */}
      <IconFeatureGrid
        columns={4}
        eyebrow={hub.value.eyebrow}
        title={hub.value.title}
        description={hub.value.intro}
        items={hub.value.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
        }))}
      />

      {/* In development today: the pharmacy supply program. */}
      <IconFeatureGrid
        tone="onSurface"
        eyebrow={hub.today.eyebrow}
        title={hub.today.title}
        description={hub.today.intro}
        items={hub.today.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
          status: pharmacy.status.label === "Development focus" ? "In development" : undefined,
        }))}
      />

      {/* The stated direction, with its status. */}
      <SplitSection
        eyebrow={hub.direction.eyebrow}
        title={hub.direction.title}
        graphic="pharmacy"
        side="left"
      >
        <p>{hub.direction.text}</p>
        <ul className="grid gap-4">
          {hub.direction.items.map((item) => (
            <li key={item.title} className="flex gap-4">
              <IconBadge icon={iconForTitle(item.title)} size={18} />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="lsh-display text-lg text-[var(--lsh-charcoal)]">{item.title}</h3>
                  <span className="lsh-display border border-[var(--lsh-brand-red)] px-2 py-0.5 text-[10px] text-[var(--lsh-brand-red)]">
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </SplitSection>

      {/* Boundaries. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
        <Container>
          <Reveal className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-paper)] p-7">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow as="h2">{hub.boundaries.title}</Eyebrow>
              <IconBadge icon="shield" size={18} />
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)] md:grid-cols-2">
              {hub.boundaries.items.map((item) => (
                <li key={item} className="border-l-2 border-[var(--lsh-charcoal)] pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
