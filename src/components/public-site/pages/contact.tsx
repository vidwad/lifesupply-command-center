import { ExternalLink, Mail, Phone } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Eyebrow,
  PublicHero,
  SectionHeading,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { OPERATING_BRANDS } from "@/lib/public-site/brands";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { LIFE_SUPPLY_CONTENT } from "@/lib/public-site/lifesupply-content";

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/**
 * Contact (`/contact/`, Stage 3): intent routing first, then the verified
 * directory, then the published entities. No form until Stage 7; every
 * intent resolves through the action registry to a verified page or an
 * approved channel. Existing-order support goes to the originating store.
 */
export function ContactPage() {
  const { contact } = LIFE_SUPPLY_CONTENT;
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Contact"
        title="Direct public channels for the right LifeSupply conversation."
        description="Published contact details are treated as a verified corporate directory. Future form routing will be managed through the Command Center publication and approval workflow."
      />

      {/* Intent routing. */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow={contact.routing.eyebrow}
              title={contact.routing.title}
              description={contact.routing.text}
            />
          </Reveal>
          <Reveal delay={0.05} className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
              <Eyebrow as="h3">{contact.routing.guide.title}</Eyebrow>
              <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                {contact.routing.guide.intro}
              </p>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {contact.routing.guide.items.map((item) => (
                  <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid content-start gap-5">
              <div className="border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-6">
                <Eyebrow as="h3">What happens next</Eyebrow>
                <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                  {contact.routing.guide.next}
                </p>
              </div>
              <p className="flex gap-4 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-5 text-sm leading-6 text-[var(--lsh-charcoal)]">
                {contact.routing.sensitive}
              </p>
            </div>
          </Reveal>
          <Stagger
            as="ul"
            className="mt-10 grid gap-px bg-[var(--lsh-rule)] sm:grid-cols-2 xl:grid-cols-5"
          >
            {contact.intents.map((intent) => (
              <StaggerItem
                key={intent.label}
                as="li"
                className="flex flex-col bg-[var(--lsh-paper)] p-6 transition-colors hover:bg-[var(--lsh-surface)]"
              >
                <IconBadge icon={iconForTitle(intent.label)} size={20} />
                <h3 className="lsh-display mt-5 text-lg leading-tight text-[var(--lsh-charcoal)]">
                  {intent.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{intent.text}</p>
                <div className="mt-auto pt-4">
                  <ActionLink action={intent.action as ActionKey} variant="text" />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-8 flex gap-5 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
            <IconBadge icon={iconForTitle(contact.existingOrder.title)} />
            <div>
              <Eyebrow as="h3">{contact.existingOrder.title}</Eyebrow>
              <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                {contact.existingOrder.text}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {OPERATING_BRANDS.filter((record) => record.supportUrl).map((record) => (
                  <li key={record.key}>
                    <a
                      href={record.supportUrl!}
                      target="_blank"
                      rel="noreferrer"
                      className="lsh-display inline-flex items-center gap-1.5 border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                    >
                      {record.name} support <ExternalLink size={11} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The verified directory. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading eyebrow="Directory" title="Verified corporate channels." />
          </Reveal>
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
            {contact.channels.map((channel) => (
              <StaggerItem key={channel.label} className="h-full">
                <SpotlightCard
                  as="article"
                  className="lsh-lift h-full border border-t-4 border-[var(--lsh-rule)] border-t-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {channel.label}
                    </p>
                    <IconBadge icon={iconForTitle(channel.label)} size={18} />
                  </div>
                  <h3 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">
                    {channel.name}
                  </h3>
                  <div className="mt-5 grid gap-2 text-sm text-[var(--lsh-muted)]">
                    <a
                      href={`mailto:${channel.email}`}
                      className="inline-flex w-fit items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
                    >
                      <Mail size={15} aria-hidden="true" /> {channel.email}
                    </a>
                    {"phone" in channel ? (
                      <a
                        href={telHref(channel.phone)}
                        className="inline-flex w-fit items-center gap-2 transition-colors hover:text-[var(--lsh-brand-red)]"
                      >
                        <Phone size={15} aria-hidden="true" /> {channel.phone}
                      </a>
                    ) : null}
                  </div>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Published entities. */}
      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow={contact.entities.eyebrow}
              title={contact.entities.title}
              description={contact.entities.note}
            />
          </Reveal>
          <Stagger className="mt-8 grid gap-4 lg:grid-cols-3">
            {contact.subsidiaries.map((entity) => (
              <StaggerItem key={entity.name} className="h-full">
                <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                  <a
                    href={entity.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex h-full flex-col p-6"
                  >
                    <IconBadge icon="building" size={18} />
                    <h3 className="lsh-display mt-5 text-xl text-[var(--lsh-charcoal)]">
                      {entity.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                      {entity.relationship}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                      {entity.detail}
                    </p>
                    <p className="lsh-display mt-auto pt-3 text-[10px] text-[var(--lsh-brand-red)]">
                      {entity.phone}
                    </p>
                  </a>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}
