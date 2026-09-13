import { ActionLink } from "@/components/public-site/action-link";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { SupplierProcess } from "@/components/public-site/supplier-process";
import type { ActionKey } from "@/lib/public-site/actions";
import { partners } from "@/lib/public-site/content/partners";

/**
 * `/partners/acquisitions/` — Acquisitions & Strategic Opportunities, a
 * focused outreach page for business owners and transaction advisers
 * (rewritten 2026-09-13, product owner). In order: what is of interest,
 * what a fit looks like, the structures that could be considered, the
 * confidential process with what to include in an introduction, and direct
 * contact. It is not a second growth-strategy presentation; that is a
 * section of the investor page, linked from the close.
 */
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

      {/* 1. Of interest: four rows, rule-separated. */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={a.interests.eyebrow} title={a.interests.title} />
          </Reveal>
          <Stagger as="ul" className="mt-10 grid gap-8 md:grid-cols-2">
            {a.interests.items.map((item, index) => (
              <StaggerItem
                key={item.title}
                as="li"
                className="border-t border-[var(--lsh-rule-strong)] pt-5"
              >
                <span className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="lsh-display mt-3 text-xl leading-tight text-[var(--lsh-charcoal)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* 2. Fit, and 3. structures, side by side on the surface tone. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <Container className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <Reveal>
              <SectionHeading eyebrow={a.fit.eyebrow} title={a.fit.title} />
            </Reveal>
            <Stagger as="dl" className="mt-8 grid gap-6">
              {a.fit.items.map((item) => (
                <StaggerItem
                  key={item.title}
                  className="border-t border-[var(--lsh-rule-strong)] pt-4"
                >
                  <dt className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                    {item.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</dd>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal
            delay={0.05}
            className="border-t-4 border-[var(--lsh-brand-red)] pt-5 lg:self-start"
          >
            <Eyebrow as="h2">{a.structures.eyebrow}</Eyebrow>
            <p className="lsh-display mt-4 text-2xl leading-tight text-[var(--lsh-charcoal)]">
              {a.structures.title}
            </p>
            <p className="mt-4 leading-7 text-[var(--lsh-muted)]">{a.structures.text}</p>
          </Reveal>
        </Container>
      </section>

      {/* 4. The process, and what to include. */}
      <section className="px-5 py-20 lg:px-8">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={a.process.eyebrow} title={a.process.title} />
          </Reveal>
          <div className="mt-10">
            <SupplierProcess title="From introduction to terms." steps={a.process.items} />
          </div>
          <Reveal className="mt-14 grid gap-6 border-t border-[var(--lsh-rule-strong)] pt-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Eyebrow as="h3">{a.introduction.title}</Eyebrow>
            <div>
              <ul className="grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)] sm:grid-cols-2">
                {a.introduction.items.map((item) => (
                  <li key={item} className="lsh-bullet">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-6 text-[var(--lsh-muted)]">
                {a.introduction.note}
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 5. Direct contact, on charcoal. */}
      <section className="bg-[var(--lsh-charcoal)] px-5 py-16 text-white lg:px-8">
        <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-2xl">
            <SectionHeading
              tone="onDark"
              eyebrow={a.contact.eyebrow}
              title={a.contact.title}
              description={a.contact.text}
            />
          </Reveal>
          <Reveal delay={0.05} className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {a.actions.map((action, index) => (
              <ActionLink
                key={action}
                action={action as ActionKey}
                variant={index === 0 ? "primary" : "onDark"}
              />
            ))}
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
