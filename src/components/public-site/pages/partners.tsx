import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal } from "@/components/public-site/motion";
import { IconFeatureGrid, ProcessSteps, SplitSection } from "@/components/public-site/sections";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import type { ActionKey } from "@/lib/public-site/actions";
import { partners } from "@/lib/public-site/content/partners";
import { iconForTitle } from "@/lib/public-site/icon-map";

/** Numbered steps on ink, with icons. */
function Steps({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: readonly { index: string; title: string; text: string }[];
}) {
  return (
    <ProcessSteps
      eyebrow={eyebrow}
      title={title}
      steps={items.map((step) => ({
        index: step.index,
        title: step.title,
        text: step.text,
        icon: iconForTitle(step.title),
      }))}
    />
  );
}

/** The page's actions, closing the page. */
function ActionsClose({ actions }: { actions: readonly string[] }) {
  return (
    <section className="bg-[var(--lsh-surface)] px-5 py-16 lg:px-8">
      <Container>
        <Reveal className="flex flex-wrap gap-3">
          {actions.map((action, index) => (
            <ActionLink
              key={action}
              action={action as ActionKey}
              variant={index === 0 ? "primary" : "onLight"}
            />
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

/** `/partners/acquisitions/` */
export function PartnerAcquisitionsPage() {
  const a = partners.acquisitions;
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="boardroom" position="70% 50%" />}
        eyebrow={a.eyebrow}
        title={a.title}
        description={a.intro}
        actions={<ActionLink action="acquisition_inquiry" />}
      />
      <IconFeatureGrid
        eyebrow={a.criteria.eyebrow}
        title={a.criteria.title}
        items={a.criteria.items.map((item) => ({
          title: item.title,
          text: item.text,
          icon: iconForTitle(item.title),
        }))}
      />
      <SplitSection
        tone="onSurface"
        eyebrow="Structures"
        title={a.structures.title}
        graphic="boardroom"
        side="left"
      >
        <p>{a.structures.text}</p>
      </SplitSection>
      <Steps eyebrow="Process" title={a.process.title} items={a.process.items} />
      <ActionsClose actions={a.actions} />
    </LifeSupplyLayout>
  );
}
