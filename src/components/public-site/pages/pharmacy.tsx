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
import { AnchoredSection, OnThisPage } from "@/components/public-site/on-this-page";
import { IconBadge, IconFeatureGrid, SplitSection } from "@/components/public-site/sections";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import type { ActionKey } from "@/lib/public-site/actions";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

/**
 * `/pharmacy-solutions/` (2026-09-08, expanded 2026-09-09): why the program
 * matters to the ecosystem, the pharmacy supply program that is in
 * development today, and the stated direction for pharmacy-related
 * operations, each with its status. Nothing here dispenses, diagnoses, or
 * prescribes, and no transaction is named or implied.
 *
 * `/partners/pharmacies` merged into the `#partner-program` section on
 * 2026-09-10 (website consolidation, stage 2) and permanently redirects here.
 * A pharmacist reading about the programme needs the scope distinction above
 * it, and the partners page had to restate that distinction before it could
 * say anything of its own.
 */
export function PharmacySolutionsPage() {
  const { hub } = LIFE_SUPPLY_CONTENT.pharmacy;
  const [primary, secondary] = hub.actions as readonly ActionKey[];
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="pharmacy" position="75% 60%" />}
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

      <OnThisPage items={LIFE_SUPPLY_CONTENT.pharmacy.sections} />

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

      <PartnerProgramSection />
    </LifeSupplyLayout>
  );
}

/**
 * The pharmacy partner programme (`#partner-program`), absorbed from
 * `/partners/pharmacies` on 2026-09-10.
 *
 * It leads with the model, because the whole proposition turns on one
 * division of labour: the pharmacist selects, the supply service fulfils.
 * The complaints-and-recalls block stays with it — it is the part a pharmacy
 * actually has to check before agreeing to anything.
 */
function PartnerProgramSection() {
  const { partnerProgram } = LIFE_SUPPLY_CONTENT.pharmacy;
  return (
    <AnchoredSection id="partner-program">
      <section className="border-t border-[var(--lsh-rule)] px-5 pt-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={partnerProgram.eyebrow}
              title={partnerProgram.title}
              description={partnerProgram.intro}
            />
          </Reveal>
        </Container>
      </section>
      <IconFeatureGrid
        numbered
        eyebrow={partnerProgram.model.eyebrow}
        title={partnerProgram.model.title}
        items={partnerProgram.model.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
        }))}
      />
      <section className="px-5 pb-20 lg:px-8">
        <Container>
          <Reveal className="flex gap-5 border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-7">
            <IconBadge icon="shield" />
            <div>
              <Eyebrow as="h3">{partnerProgram.responsibilities.title}</Eyebrow>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)] lg:grid-cols-3">
                {partnerProgram.responsibilities.items.map((item) => (
                  <li key={item} className="lsh-bullet">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.05} className="mt-8 flex flex-wrap gap-3">
            {partnerProgram.actions.map((action, index) => (
              <ActionLink
                key={action}
                action={action as ActionKey}
                variant={index === 0 ? "primary" : "onLight"}
              />
            ))}
          </Reveal>
        </Container>
      </section>
    </AnchoredSection>
  );
}
