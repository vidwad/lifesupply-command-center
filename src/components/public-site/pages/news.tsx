import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PrimaryAction,
  PublicHero,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/public-site/motion";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { ACTIONS, type ActionKey } from "@/lib/public-site/actions";
import { news } from "@/lib/public-site/content/news";
import type { Published } from "@/lib/public-site/published";
import { LIFE_SUPPLY_ROUTES, newsItemRoute, resourceRoute } from "@/lib/public-site/routes";
import type { PublicNewsItemDto, PublicResourceDto } from "@/server/public-web/contracts";

/**
 * A governed section is shown when it has records, and when it could not be
 * reached, where it says so. A section that fetched cleanly and returned
 * nothing is left out entirely rather than announcing that it is empty
 * (website improvement program, 2026-09-09).
 */
function isEmpty<T>(published: { ok: true; data: T[] } | { ok: false }): boolean {
  return published.ok && published.data.length === 0;
}

/** A section that says plainly when it is unreachable rather than filling itself. */
function Note({ text, tone = "empty" }: { text: string; tone?: "empty" | "unavailable" }) {
  return (
    <p
      className={`mt-4 border-l-2 pl-4 text-sm leading-6 text-[var(--lsh-muted)] ${
        tone === "unavailable" ? "border-[var(--lsh-brand-red)]" : "border-[var(--lsh-rule-strong)]"
      }`}
      role={tone === "unavailable" ? "status" : undefined}
    >
      {text}
    </p>
  );
}

/** Format an ISO calendar date for display without a timezone shift. */
export function displayDate(iso: string) {
  const parts = iso.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * `/news/` — Company News: governed current announcements, the static
 * historical archive, and governed resources.
 *
 * Renamed from News & resources on 2026-09-13 (product owner). The "New
 * here?" company introduction came off, and the investor documents
 * directory moved to the investor page's materials section; this page keeps
 * one line pointing there. A clean editorial list: four historical releases
 * need no image cards, filters, or pagination.
 */
export function NewsPage({
  current,
  resources,
}: {
  current: Published<PublicNewsItemDto[]>;
  resources: Published<PublicResourceDto[]>;
}) {
  const { hero, sections, historical, materials } = news;
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="newsDesk" position="75% 50%" />}
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
      />

      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-16">
          {isEmpty(current) ? null : (
            <Reveal>
              <Eyebrow as="h2">{sections.current.title}</Eyebrow>
              {!current.ok ? (
                <Note text={sections.current.unavailable} tone="unavailable" />
              ) : (
                <ul className="mt-6 divide-y divide-[var(--lsh-rule)] border-y border-[var(--lsh-rule-strong)]">
                  {current.data.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={newsItemRoute(item.slug)}
                        className="group grid gap-3 py-7 sm:grid-cols-[10rem_1fr] sm:gap-8"
                      >
                        <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                          {displayDate(item.date)}
                        </p>
                        <div>
                          <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                            {item.title}
                          </h3>
                          <p className="mt-2 leading-7 text-[var(--lsh-muted)]">{item.summary}</p>
                          <span className="lsh-display mt-3 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                            Read <ArrowRight size={15} aria-hidden="true" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          )}

          <div>
            <Reveal className="flex flex-wrap items-end justify-between gap-3">
              <Eyebrow as="h2">{sections.historical.title}</Eyebrow>
              <p className="text-xs text-[var(--lsh-muted)]">{sections.historical.note}</p>
            </Reveal>
            <Stagger
              as="ul"
              className="mt-6 divide-y divide-[var(--lsh-rule)] border-y border-[var(--lsh-rule-strong)]"
            >
              {historical.map((item) => (
                <StaggerItem key={item.href} as="li">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group grid gap-3 py-7 sm:grid-cols-[10rem_1fr_auto] sm:items-baseline sm:gap-8"
                  >
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {item.date}
                    </p>
                    <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">
                      {item.title}
                    </h3>
                    <span className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-muted)] transition-colors group-hover:text-[var(--lsh-brand-red)]">
                      {item.source}
                      <ExternalLink size={14} aria-hidden="true" />
                    </span>
                  </a>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {isEmpty(resources) ? null : (
            <Reveal>
              <Eyebrow as="h2">{sections.resources.title}</Eyebrow>
              {!resources.ok ? (
                <Note text={sections.resources.unavailable} tone="unavailable" />
              ) : (
                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                  {resources.data.map((item) => (
                    <li key={item.slug} className="border-t border-[var(--lsh-rule-strong)] pt-5">
                      <Link href={resourceRoute(item.slug)} className="group grid gap-2">
                        <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                          Reviewed {displayDate(item.reviewed)}
                        </p>
                        <h3 className="lsh-display text-xl text-[var(--lsh-charcoal)]">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-6 text-[var(--lsh-muted)]">{item.summary}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          )}

          {/* Where the investor materials went. */}
          <Reveal className="flex flex-col gap-4 border-t border-[var(--lsh-rule)] pt-8 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-[var(--lsh-muted)]">{materials.text}</p>
            <div className="shrink-0">
              <ActionLink action={materials.action as ActionKey} variant="onLight" />
            </div>
          </Reveal>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}

/** Rendered when a governed page cannot be fetched: the section fails closed, never blank. */
export function PublishedUnavailablePage() {
  const copy = news.itemUnavailable;
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="newsDesk" position="75% 50%" />}
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.text}
      />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <PrimaryAction href={LIFE_SUPPLY_ROUTES.news}>Back to news</PrimaryAction>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/news/[slug]/` — a dated announcement from the published read model. */
export function NewsItemView({ item }: { item: PublicNewsItemDto }) {
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="newsDesk" position="75% 50%" />}
        eyebrow={`Company news · ${displayDate(item.date)}`}
        title={item.title}
        description={item.summary}
      />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <Reveal className="grid gap-5 text-lg leading-8 text-[var(--lsh-muted)]">
          {item.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
        {item.source ? (
          <Reveal className="mt-8 border-t border-[var(--lsh-rule)] pt-6 text-sm text-[var(--lsh-muted)]">
            Source:{" "}
            <a href={item.source.href} target="_blank" rel="noreferrer" className="underline">
              {item.source.label}
            </a>
          </Reveal>
        ) : null}
        <Reveal className="mt-8 flex flex-wrap gap-3">
          <PrimaryAction href={LIFE_SUPPLY_ROUTES.news}>All news</PrimaryAction>
          <ActionLink action="general_inquiry" variant="onLight" />
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/resources/[slug]/` — practical guidance with its author, reviewer, and dates. */
export function ResourceView({ item }: { item: PublicResourceDto }) {
  // The action key is authored in the Command Center; an unknown key falls back to the general channel.
  const action: ActionKey = item.action in ACTIONS ? (item.action as ActionKey) : "general_inquiry";
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="newsDesk" position="75% 50%" />}
        eyebrow="Resource"
        title={item.title}
        description={item.summary}
      />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <Reveal className="mb-8 grid gap-1 border-l-4 border-[var(--lsh-brand-red)] pl-4 text-xs text-[var(--lsh-muted)]">
          <span>Author: {item.author}</span>
          <span>Reviewer: {item.reviewer}</span>
          <span>
            Published {displayDate(item.published)} · Reviewed {displayDate(item.reviewed)}
          </span>
        </Reveal>
        <Reveal className="grid gap-5 text-lg leading-8 text-[var(--lsh-muted)]">
          {item.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
        <Reveal className="mt-8 flex flex-wrap gap-3">
          <ActionLink action={action} />
          <PrimaryAction href={LIFE_SUPPLY_ROUTES.news}>All resources</PrimaryAction>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}
