import { ActionLink } from "@/components/public-site/action-link";
import { CarePathwayDiagram } from "@/components/public-site/care-pathway-diagram";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
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
  const { hub, scope } = LIFE_SUPPLY_CONTENT.pharmacy;
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

      {/* Which of the two pharmacy businesses this page is about (round three). */}
      <section className="px-5 pt-16 lg:px-8">
        <Container>
          <Reveal className="border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6 lg:p-7">
            <Eyebrow as="h2">{scope.title}</Eyebrow>
            <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-8">
              {scope.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-[var(--lsh-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Why it matters: the intro, then the typeset hub diagram, which carries the four value items. */}
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-10">
          <Reveal>
            <SectionHeading
              eyebrow={hub.value.eyebrow}
              title={hub.value.title}
              description={hub.value.intro}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <CarePathwayDiagram centre={hub.value.centre} items={hub.value.items} />
          </Reveal>
        </Container>
      </section>

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
          status: "In development",
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
    </LifeSupplyLayout>
  );
}
