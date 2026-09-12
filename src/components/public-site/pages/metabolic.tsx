import { ExternalLink } from "lucide-react";

import { Accordion } from "@/components/public-site/accordion";
import { ActionLink } from "@/components/public-site/action-link";
import { CommercialModel } from "@/components/public-site/commercial-model";
import { FoldSummary } from "@/components/public-site/fold";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import {
  MetabolicCoordinationGrid,
  MetabolicEditorialVisual,
  MetabolicHeroVisual,
  MetabolicReplenishmentRhythm,
} from "@/components/public-site/metabolic-visuals";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { AnchoredSection, OnThisPage } from "@/components/public-site/on-this-page";
import { IconBadge } from "@/components/public-site/sections";
import { SupplyRolesDiagram } from "@/components/public-site/supply-roles-diagram";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import type { ActionKey } from "@/lib/public-site/actions";
import { getBrand, getBrandCategory } from "@/lib/public-site/brands";
import {
  commercialModel,
  metabolic,
  type KitPathway,
  type PathwayGroup,
} from "@/lib/public-site/content/metabolic";
import { iconForTitle } from "@/lib/public-site/icon-map";

/** The pathways of one kind, in the order the content model lists them. */
const byGroup = (key: PathwayGroup) => metabolic.kits.filter((kit) => kit.group === key);

/**
 * `/metabolic-health/` — displayed as Metabolic Health Solutions.
 *
 * Reworked on 2026-09-11 after the product owner reviewed the consolidated
 * page: it read as a program specification rather than an introduction to a
 * business opportunity, and answered what the parts are and what they cannot
 * do before it answered what problem they would solve, how the arrangement
 * would work, and why an organisation should start a conversation.
 *
 * The order is now the reader's: what is being developed and for whom; who it
 * would help and why; how the four parts fit together, once; the eight
 * pathways as three kinds with the detail folded; replenishment as how the
 * model works rather than a correction; collaboration with a route for each
 * audience; a closing enquiry that says what to bring; and the two boundaries
 * last, as essential information rather than an opening caveat.
 *
 * The eleven anchors the consolidation's redirects land on are unchanged.
 * Each pathway's anchor sits on a visible card, never inside a closed
 * `details`, so a deep link shows the pathway with JavaScript disabled.
 */
export function MetabolicHealthPage() {
  const { hub } = metabolic;
  const [primary, secondary] = hub.actions as readonly ActionKey[];
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={
          <>
            <GraphicBackdrop graphic="metabolicSupplies" position="80% 50%" />
            <MetabolicHeroVisual />
          </>
        }
        eyebrow={hub.eyebrow}
        title={hub.title}
        description={hub.intro}
        actions={
          <>
            {/* The status on its own line, separate from the proposition it qualifies. */}
            <p className="lsh-display basis-full text-[11px] leading-relaxed text-white/80">
              {hub.status}
            </p>
            {primary ? <ActionLink action={primary} /> : null}
            {secondary ? <ActionLink action={secondary} variant="onDark" /> : null}
          </>
        }
      />
      <OnThisPage items={metabolic.sections} />
      <ValueSection />
      <CommercialModel model={commercialModel} />
      <PathwaysSection />
      <ReplenishmentSection />
      <CollaborationSection />
      <ClosingBand />
      <BoundariesBand />
    </LifeSupplyLayout>
  );
}

const VALUE_ICONS = ["stethoscope", "pill", "heart"] as const;

/** Who it would help and why, before any component or condition. */
function ValueSection() {
  const { value } = metabolic.hub;
  return (
    <section className="px-5 py-20 lg:px-8">
      <Container>
        <Reveal className="max-w-3xl">
          <SectionHeading eyebrow={value.eyebrow} title={value.title} description={value.intro} />
        </Reveal>
        <Stagger
          as="ul"
          className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3 lg:-mx-8"
        >
          {value.items.map((item, index) => (
            <StaggerItem
              as="li"
              key={item.title}
              className="lsh-lift h-full bg-[var(--lsh-paper)] p-5 lg:p-8"
            >
              <IconBadge icon={VALUE_ICONS[index] ?? "users"} size={18} />
              <h3 className="mt-4 text-xl text-[var(--lsh-charcoal)]">{item.title}</h3>
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/**
 * The eight pathways (`#pathways`): three kinds, each pathway a card that
 * shows who it is for and what it covers, with the rest folded.
 *
 * Until 2026-09-11 this was a five-column comparison table followed by eight
 * full sections repeating it, about ten thousand pixels in all. The jump row
 * is the compact overview; the cards carry the same detail the eight pages
 * did, behind a native `details` that needs no JavaScript to open.
 */
function PathwaysSection() {
  const { kitsHub } = metabolic;
  return (
    <AnchoredSection id="pathways">
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={kitsHub.eyebrow}
              title={kitsHub.title}
              description={kitsHub.intro}
            />
          </Reveal>

          <div className="mt-10 grid gap-px bg-[var(--lsh-rule)] lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal className="bg-[var(--lsh-ink)]">
              <MetabolicEditorialVisual visual="pathways" />
            </Reveal>
            {/* The compact overview: every pathway, by kind, one link each. */}
            <Reveal delay={0.05} className="grid gap-6 bg-[var(--lsh-paper)] p-6 lg:p-8">
              {kitsHub.groups.map((group) => (
                <div key={group.key}>
                  <Eyebrow as="h3">{group.title}</Eyebrow>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {byGroup(group.key).map((kit) => (
                      <li key={kit.slug}>
                        <a
                          href={`#${kit.slug}`}
                          className="lsh-display inline-flex items-center gap-2 border border-[var(--lsh-rule-strong)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                        >
                          <span className="text-[var(--lsh-brand-red)]">{kit.id}</span>
                          {kit.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Reveal>
          </div>

          {kitsHub.groups.map((group) => (
            <div key={group.key} className="mt-16">
              <Reveal className="max-w-3xl">
                <h3 className="text-2xl leading-tight text-[var(--lsh-charcoal)]">{group.title}</h3>
                <p className="mt-2 leading-7 text-[var(--lsh-muted)]">{group.text}</p>
              </Reveal>
              <Stagger
                as="ul"
                className="-mx-5 mt-6 grid gap-px bg-[var(--lsh-rule)] lg:-mx-8 lg:grid-cols-2"
              >
                {byGroup(group.key).map((kit) => (
                  <PathwayCard key={kit.slug} kit={kit} />
                ))}
              </Stagger>
            </div>
          ))}

          {/* How the kinds combine: an illustration of the model, not a product. */}
          <Reveal className="mt-12 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-5 lg:p-6">
            <Eyebrow as="h3">{kitsHub.example.title}</Eyebrow>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--lsh-muted)]">
              {kitsHub.example.text}
            </p>
          </Reveal>
        </Container>
      </section>
    </AnchoredSection>
  );
}

/**
 * One pathway, at the anchor its own page used to answer on.
 *
 * Everything its page carried is here: audience, the three item roles,
 * compatibility, exclusions, the verified store categories or the plain
 * reason there are none, and its own questions. The name, the purpose and
 * the audience are always visible, so a deep link and a reader without
 * JavaScript both see the pathway; the rest opens on request.
 */
function PathwayCard({ kit }: { kit: KitPathway }) {
  const { kitsHub } = metabolic;
  return (
    <StaggerItem as="li" className="lsh-lift lsh-metabolic-card h-full bg-[var(--lsh-paper)]">
      <article id={kit.slug} className="flex h-full scroll-mt-28 flex-col p-5 lg:p-8">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">{kit.id}</span>
          <h4 className="font-[family-name:var(--lsh-display-font)] text-xl font-bold leading-tight tracking-[0.01em] text-[var(--lsh-charcoal)]">
            {kit.label}
          </h4>
          <span className="lsh-display border border-dashed border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)] sm:ml-auto">
            {kitsHub.status}
          </span>
        </div>
        <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{kit.purpose}</p>
        <div className="mt-4">
          <Eyebrow as="p">Who it is for</Eyebrow>
          <p className="mt-1 text-sm leading-6 text-[var(--lsh-charcoal)]">{kit.audience}</p>
        </div>

        <details className="group mt-5 border-t border-[var(--lsh-rule)]">
          <FoldSummary label={kitsHub.detailLabel} />

          {/* Roles only. Approved contents, quantities and a store configuration do not exist yet. */}
          <ul className="grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-3">
            {kit.roles.map((item) => (
              <li key={item.role} className="bg-[var(--lsh-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <IconBadge icon={iconForTitle(item.role)} size={16} />
                  <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                    {item.role}
                  </span>
                </div>
                <h5 className="mt-3 font-[family-name:var(--lsh-display-font)] text-base font-bold tracking-[0.01em] text-[var(--lsh-charcoal)]">
                  {item.title}
                </h5>
                <p className="mt-1 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <Eyebrow as="p">Compatibility</Eyebrow>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {kit.compatibility.map((rule) => (
                  <li key={rule} className="lsh-bullet">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Eyebrow as="p">Excluded</Eyebrow>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {kit.exclusions.map((rule) => (
                  <li key={rule} className="lsh-bullet">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--lsh-rule)] pt-5">
            <Eyebrow as="p">Browse related store categories</Eyebrow>
            <BrowseLinks kit={kit} />
          </div>

          <div className="mt-5 border-t border-[var(--lsh-rule)] pb-2 pt-5">
            <Eyebrow as="p">Questions</Eyebrow>
            <div className="mt-3">
              <Accordion items={kit.faqs} />
            </div>
          </div>
        </details>
      </article>
    </StaggerItem>
  );
}

/** Verified store categories for a pathway, or the plain reason there are none. */
function BrowseLinks({ kit }: { kit: KitPathway }) {
  if (kit.browse.length === 0) {
    return <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{kit.browseNote}</p>;
  }
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
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
 * Replenishment (`#replenishment`): how the model works, as a strip of the
 * three item roles, then today's position and what is in development in one
 * row each. The section it replaced described reminders, automatic shipments,
 * pauses, changes and cancellation at length for a service that is not
 * offered (product owner, 2026-09-11).
 */
function ReplenishmentSection() {
  const { refills } = metabolic;
  return (
    <AnchoredSection id="replenishment">
      <section className="border-t border-[var(--lsh-rule)] bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow={refills.eyebrow}
              title={refills.title}
              description={refills.intro}
            />
          </Reveal>
          <Reveal delay={0.05} className="mt-12">
            <SupplyRolesDiagram roles={refills.roles} />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-px bg-[var(--lsh-rule)] lg:grid-cols-2">
            <Reveal className="min-w-0 bg-[var(--lsh-ink)]">
              <MetabolicEditorialVisual visual="replenishment" />
            </Reveal>
            <Reveal
              delay={0.05}
              className="flex min-w-0 items-center bg-[var(--lsh-paper)] p-6 lg:min-h-72 lg:p-10"
            >
              <MetabolicReplenishmentRhythm />
            </Reveal>
          </div>
          <div className="mt-12 grid gap-8 border-t border-[var(--lsh-rule-strong)] pt-8 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <Eyebrow as="h3">{refills.today.title}</Eyebrow>
              <p className="mt-3 leading-7 text-[var(--lsh-charcoal)]">{refills.today.text}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <Eyebrow as="h3">{refills.later.title}</Eyebrow>
              <p className="mt-3 leading-7 text-[var(--lsh-charcoal)]">{refills.later.text}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                {refills.substitutions}
              </p>
            </Reveal>
          </div>
        </Container>
      </section>
    </AnchoredSection>
  );
}

/**
 * Collaboration (`#collaboration`): who can help define a configuration,
 * each with a route of their own, and what a supply plan would settle.
 */
function CollaborationSection() {
  const { collaboration } = metabolic;
  return (
    <AnchoredSection id="collaboration">
      <section className="border-t border-[var(--lsh-rule)] px-5 py-20 lg:px-8">
        <Container>
          <Reveal className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Eyebrow>{collaboration.eyebrow}</Eyebrow>
              <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                {collaboration.status}
              </span>
            </div>
            <h2 className="lsh-display mt-4 text-3xl leading-[1.08] text-[var(--lsh-charcoal)] sm:text-4xl">
              {collaboration.title}
            </h2>
            <p className="mt-5 leading-7 text-[var(--lsh-muted)]">{collaboration.intro}</p>
          </Reveal>

          <Reveal delay={0.05} className="lsh-metabolic-collaboration-stage mt-10">
            <MetabolicEditorialVisual visual="collaboration" />
            <MetabolicCoordinationGrid />
          </Reveal>

          <Stagger
            as="ul"
            className="-mx-5 mt-12 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3 lg:-mx-8"
          >
            {collaboration.who.items.map((item) => (
              <StaggerItem
                as="li"
                key={item.title}
                className="flex h-full flex-col bg-[var(--lsh-paper)] p-5 lg:p-8"
              >
                <h3 className="text-xl text-[var(--lsh-charcoal)]">{item.title}</h3>
                <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{item.text}</p>
                <div className="mt-auto pt-5">
                  <ActionLink action={item.action as ActionKey} variant="onLight" />
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-12 grid gap-8 border-t border-[var(--lsh-rule)] pt-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <Eyebrow as="h3">{collaboration.planning.title}</Eyebrow>
              <div className="mt-6">
                {collaboration.actions.map((action) => (
                  <ActionLink key={action} action={action as ActionKey} />
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)] sm:grid-cols-2 sm:gap-x-8">
                {collaboration.planning.items.map((item) => (
                  <li key={item} className="lsh-bullet">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>
    </AnchoredSection>
  );
}

/** The closing band: the enquiry, what to bring, and what it commits no one to. */
function ClosingBand() {
  const { close, actions } = metabolic.hub;
  const [primary] = actions as readonly ActionKey[];
  return (
    <section className="bg-[var(--lsh-ink)] px-5 py-24 text-white lg:px-8">
      <Container>
        <Reveal className="grid gap-10 border-l-4 border-[var(--lsh-brand-red)] pl-6 lg:grid-cols-2 lg:gap-16 lg:pl-10">
          <div>
            <Eyebrow tone="onDark" as="h2">
              {close.eyebrow}
            </Eyebrow>
            <p className="lsh-display mt-4 text-4xl leading-[1.05] lg:text-5xl">{close.title}</p>
            <div className="mt-8">{primary ? <ActionLink action={primary} /> : null}</div>
          </div>
          <div>
            <p className="leading-7 text-white/75">{close.text}</p>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-white/85">
              {close.bring.map((item) => (
                <li key={item} className="lsh-bullet">
                  {item}
                </li>
              ))}
            </ul>
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
 * The two boundaries that qualify everything above them, stated once, as
 * essential information at the end rather than as an opening caveat.
 */
function BoundariesBand() {
  const { boundaries } = metabolic;
  return (
    <section className="border-t border-[var(--lsh-rule)] px-5 py-12 lg:px-8">
      <Container className="grid gap-6 lg:grid-cols-[auto_1fr_1fr] lg:gap-10">
        <div className="flex items-start gap-4">
          <IconBadge icon="shield" />
          <Eyebrow as="h2">Essential information</Eyebrow>
        </div>
        <p className="text-sm leading-6 text-[var(--lsh-charcoal)]">{boundaries.clinical}</p>
        <p className="text-sm leading-6 text-[var(--lsh-muted)]">{boundaries.guidance}</p>
      </Container>
    </section>
  );
}
